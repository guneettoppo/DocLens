import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow 50mb body size for file uploads via Route Handlers
  serverExternalPackages: ["@prisma/adapter-better-sqlite3", "better-sqlite3"],
};

export default nextConfig;
