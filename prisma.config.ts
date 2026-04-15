import { defineConfig } from "prisma/config";
import { config as dotenvConfig } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

dotenvConfig({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (defineConfig as any)({
  schema: "prisma/schema.prisma",
  datasource: {
    url: connectionString,
  },
  migrate: {
    adapter: () => new PrismaPg({ connectionString }),
  },
});
