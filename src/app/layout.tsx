import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";

export const metadata: Metadata = {
  title: "DocLens — Secure Document Sharing",
  description:
    "Upload documents, generate self-destructing links, and track page-level analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
