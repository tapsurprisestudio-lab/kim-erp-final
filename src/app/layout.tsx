import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIM-ERB",
  description: "Ultimate business management platform",
  applicationName: "KIM-ERB"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
