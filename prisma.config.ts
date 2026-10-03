import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Migrations run against the direct (non-pooled) connection.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
