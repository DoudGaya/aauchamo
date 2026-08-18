import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { getRuntimeEnv } from "@/lib/server/env";

const globalForDatabase = globalThis as unknown as {
  aauChamoDatabase?: PrismaClient;
};

function createDatabaseClient() {
  const env = getRuntimeEnv();
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 30_000,
    max: 20,
  });

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export const db = globalForDatabase.aauChamoDatabase ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.aauChamoDatabase = db;
}

export type DatabaseClient = typeof db;
