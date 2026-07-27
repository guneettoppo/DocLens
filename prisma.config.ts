import { defineConfig } from "@prisma/config";
import { config } from "dotenv";

config(); // Load .env file into process.env

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
