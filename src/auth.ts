import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertLoginAllowed, recordLoginAttempt } from "@/lib/security/rate-limit";
import { verifyPassword } from "@/lib/security/password";
import { securityLog } from "@/lib/audit";

const credentialsSchema = z.object({
  email: z.string().trim().min(2),
  password: z.string().min(8)
});

export const authConfig = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const identifier = parsed.data.email.toLowerCase();
        const ipAddress =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          "unknown";
        const userAgent = request.headers.get("user-agent") ?? undefined;

        await assertLoginAllowed(identifier, ipAddress);

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }]
          },
          include: {
            company: true,
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!user || user.deletedAt || user.status !== "ACTIVE") {
          await recordLoginAttempt(identifier, ipAddress, false);
          await securityLog("LOGIN_FAILED", "Login failed for inactive or missing account", {
            ipAddress,
            userAgent,
            metadata: { identifier }
          });
          return null;
        }

        if (user.company && ["SUSPENDED", "DELETED"].includes(user.company.status)) {
          await recordLoginAttempt(identifier, ipAddress, false);
          await securityLog("LOGIN_FAILED", "Login failed for suspended company", {
            companyId: user.companyId,
            userId: user.id,
            ipAddress,
            userAgent
          });
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        await recordLoginAttempt(identifier, ipAddress, valid);

        if (!valid) {
          await securityLog("LOGIN_FAILED", "Login failed due to invalid password", {
            companyId: user.companyId,
            userId: user.id,
            ipAddress,
            userAgent
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        await securityLog("LOGIN_SUCCESS", "User signed in", {
          companyId: user.companyId,
          userId: user.id,
          ipAddress,
          userAgent
        });

        const roles = user.roles.map((userRole) => userRole.role.key);
        const permissions = [
          ...new Set(
            user.roles.flatMap((userRole) =>
              userRole.role.permissions.map((rolePermission) => rolePermission.permission.key)
            )
          )
        ];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          companyId: user.companyId,
          companyName: user.company?.name,
          role: roles[0] ?? "user",
          status: user.status,
          locale: user.locale,
          roles,
          permissions
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.role = user.role;
        token.status = user.status;
        token.locale = user.locale;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.companyId = token.companyId as string | null;
        session.user.companyName = token.companyName as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.status = token.status as string | undefined;
        session.user.locale = token.locale as string | undefined;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
