import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Direct (non-pooled) connection required for migrations on Neon
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL,
  },
});
