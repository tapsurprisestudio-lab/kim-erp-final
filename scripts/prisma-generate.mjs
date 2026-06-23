import { spawnSync } from "node:child_process";

const fallbackDatabaseUrl = "postgresql://prisma:prisma@localhost:5432/kim_erb_build?schema=public";
const command = process.platform === "win32" ? "prisma.cmd" : "prisma";

const result = spawnSync(command, ["generate"], {
  shell: true,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || fallbackDatabaseUrl
  }
});

process.exit(result.status ?? 1);
