import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";

export const metadata: Metadata = {
  title: "DocLens — Precision Document Intelligence",
  description:
    "Upload documents. Generate tracked links. See every page view. Self-destruct when done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
