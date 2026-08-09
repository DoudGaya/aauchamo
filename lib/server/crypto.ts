import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getRuntimeEnv } from "@/lib/server/env";

function encryptionKey() {
  const env = getRuntimeEnv();
  if (env.DATA_ENCRYPTION_KEY) {
    const key = Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");
    if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must decode to exactly 32 bytes.");
    return key;
  }
  return createHash("sha256").update(`development:${env.AUTH_SECRET}`).digest();
}

export function encryptSensitive(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSensitive(payload: string) {
  const [version, ivValue, tagValue, ciphertextValue] = payload.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Unsupported encrypted field format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function hashLookup(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
