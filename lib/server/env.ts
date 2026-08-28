import "server-only";

import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_SESSION_MAX_AGE_SECONDS: z.coerce.number().int().min(900).max(86_400).default(28_800),
  DATA_ENCRYPTION_KEY: z.string().optional().default(""),
  APP_URL: z.string().url().default("http://localhost:3000"),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  S3_ENDPOINT: optionalUrl,
  S3_KMS_KEY_ID: z.string().optional().default(""),
  S3_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(3_600).default(300),
  EMAIL_PROVIDER: z.enum(["disabled", "resend", "smtp"]).default("disabled"),
  EMAIL_FROM: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  SMS_PROVIDER: z.enum(["disabled", "adapter"]).default("disabled"),
  SMS_API_KEY: z.string().optional().default(""),
  SMS_SENDER_ID: z.string().optional().default("AAUChamo"),
  SENTRY_DSN: optionalUrl,
  CRON_SECRET: z.string().optional().default(""),
  OUTBOX_WORKER_SECRET: z.string().optional().default(""),
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

const developmentDefaults = {
  DATABASE_URL: "postgresql://aau_chamo:aau_chamo@127.0.0.1:5432/aau_chamo",
  AUTH_SECRET: "development-only-secret-change-before-deployment",
};

let cachedEnv: RuntimeEnv | undefined;

export function getRuntimeEnv(): RuntimeEnv {
  if (cachedEnv) return cachedEnv;

  const candidate = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? developmentDefaults.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ?? developmentDefaults.AUTH_SECRET,
  };

  const parsed = runtimeEnvSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const isNextProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (parsed.data.NODE_ENV === "production" && !isNextProductionBuild) {
    if (parsed.data.AUTH_SECRET === developmentDefaults.AUTH_SECRET) {
      throw new Error("AUTH_SECRET must be configured before production starts.");
    }
    if (parsed.data.DATABASE_URL === developmentDefaults.DATABASE_URL) {
      throw new Error("DATABASE_URL must be configured before production starts.");
    }
  }

  cachedEnv = parsed.data;
  return parsed.data;
}

export function resetRuntimeEnvForTests() {
  cachedEnv = undefined;
}
