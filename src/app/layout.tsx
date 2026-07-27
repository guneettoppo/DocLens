import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-context";

export const metadata: Metadata = {
  title: "DocLens — Track What They Read",
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
      <body className="min-h-screen bg-bg-primary text-text-primary font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
