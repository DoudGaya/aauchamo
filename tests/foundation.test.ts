import { afterEach, describe, expect, it } from "vitest";

import { parsePagination } from "@/lib/server/api";
import { getRuntimeEnv, resetRuntimeEnvForTests } from "@/lib/server/env";
import { addMoney, money, multiplyMoney, subtractMoney } from "@/lib/server/money";
import { hashPassword, passwordSchema, verifyPassword } from "@/lib/server/password";
import { PERMISSIONS } from "@/lib/server/permissions";
import { addMinutes, dateKey, isExpired } from "@/lib/server/time";
import { decryptSensitive, encryptSensitive, hashLookup } from "@/lib/server/crypto";
import { customerMatchScore } from "@/lib/server/customer-match";
import { normalizeEmail, normalizePhone } from "@/lib/server/normalize";
import { calculateAuditHash, redactAuditValue } from "@/lib/server/audit";
import { quantity } from "@/lib/server/inventory";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetRuntimeEnvForTests();
});

describe("foundation environment", () => {
  it("provides safe local defaults outside production", () => {
    Object.assign(process.env, { NODE_ENV: "test" });
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
    resetRuntimeEnvForTests();
    const env = getRuntimeEnv();
    expect(env.DATABASE_URL).toContain("127.0.0.1:5432/aau_chamo");
    expect(env.AUTH_SESSION_MAX_AGE_SECONDS).toBe(28_800);
  });

  it("rejects development secrets in production", () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
    resetRuntimeEnvForTests();
    expect(() => getRuntimeEnv()).toThrow(/AUTH_SECRET|DATABASE_URL/);
  });
});

describe("password security", () => {
  it("enforces the password policy", () => {
    expect(passwordSchema.safeParse("weak-password").success).toBe(false);
    expect(passwordSchema.safeParse("Strong-Password-2026!").success).toBe(true);
  });

  it("hashes and verifies without storing plaintext", async () => {
    const value = "Strong-Password-2026!";
    const digest = await hashPassword(value);
    expect(digest).not.toContain(value);
    await expect(verifyPassword(value, digest)).resolves.toBe(true);
    await expect(verifyPassword("Wrong-Password-2026!", digest)).resolves.toBe(false);
    await expect(verifyPassword(value, null)).resolves.toBe(false);
  });
});

describe("money and time primitives", () => {
  it("uses decimal arithmetic for currency", () => {
    expect(money("10.005").toFixed(2)).toBe("10.01");
    expect(addMoney("0.1", "0.2").toFixed(2)).toBe("0.30");
    expect(subtractMoney("50", "12.35").toFixed(2)).toBe("37.65");
    expect(multiplyMoney("199.99", "3").toFixed(2)).toBe("599.97");
  });

  it("creates stable operational date keys", () => {
    const date = new Date("2026-08-02T23:30:00.000Z");
    expect(dateKey(date, "Africa/Lagos")).toBe("20260803");
    const expiry = addMinutes(date, 30);
    expect(isExpired(expiry, date)).toBe(false);
    expect(isExpired(expiry, addMinutes(date, 31))).toBe(true);
  });
});

describe("contracts", () => {
  it("has unique granular permission keys", () => {
    const keys = PERMISSIONS.map(([key]) => key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("audit.view");
    expect(keys).toContain("finance.reverse");
    expect(keys).toContain("inventory.approve_adjustment");
  });

  it("bounds API pagination", () => {
    expect(parsePagination(new URLSearchParams("page=-4&pageSize=1000"))).toEqual({
      page: 1,
      pageSize: 100,
      skip: 0,
      take: 100,
    });
  });

  it("validates stock quantities with decimal precision", () => {
    expect(quantity("1.2344").toString()).toBe("1.234");
    expect(() => quantity("0")).toThrow(/greater than zero/);
    expect(() => quantity("-1")).toThrow(/greater than zero/);
  });

  it("redacts secrets and makes audit tampering detectable", () => {
    const sanitized = redactAuditValue({ customer: "Amina", passwordHash: "secret", nested: { token: "secret", amount: "42.00" } });
    expect(sanitized).toEqual({ customer: "Amina", passwordHash: "[REDACTED]", nested: { token: "[REDACTED]", amount: "42.00" } });
    const first = calculateAuditHash(null, { id: "1", amount: "42.00" });
    const second = calculateAuditHash(first, { id: "2", amount: "13.00" });
    expect(calculateAuditHash(first, { id: "2", amount: "14.00" })).not.toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("protected people data", () => {
  it("normalizes Nigerian phone and email values deterministically", () => {
    expect(normalizePhone("0803 111 2200")).toBe("+2348031112200");
    expect(normalizePhone("+234-803-111-2200")).toBe("+2348031112200");
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("scores duplicate customers using stable evidence", () => {
    expect(customerMatchScore(
      { displayName: "Maryam Sani", phone: "08031112200", email: "m@example.com" },
      { displayName: "Maryam  Sani", phone: "+2348031112200", email: "M@example.com" },
    )).toEqual({ score: 100, reasons: ["phone", "email", "name"] });
  });

  it("encrypts protected fields with authenticated encryption", () => {
    Object.assign(process.env, { NODE_ENV: "test", AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters" });
    delete process.env.DATA_ENCRYPTION_KEY;
    resetRuntimeEnvForTests();
    const plaintext = "A123456789";
    const encrypted = encryptSensitive(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptSensitive(encrypted)).toBe(plaintext);
    expect(hashLookup("  A123456789 ")).toBe(hashLookup("a123456789"));
  });
});
