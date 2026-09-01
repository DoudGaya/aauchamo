import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/server/normalize";

export type CustomerMatchInput = {
  displayName: string;
  phone?: string | null;
  email?: string | null;
};

export function customerMatchScore(left: CustomerMatchInput, right: CustomerMatchInput) {
  let score = 0;
  const reasons: string[] = [];
  if (left.phone && right.phone && normalizePhone(left.phone) === normalizePhone(right.phone)) {
    score += 60;
    reasons.push("phone");
  }
  const leftEmail = normalizeEmail(left.email);
  const rightEmail = normalizeEmail(right.email);
  if (leftEmail && rightEmail && leftEmail === rightEmail) {
    score += 30;
    reasons.push("email");
  }
  if (normalizeName(left.displayName).toLowerCase() === normalizeName(right.displayName).toLowerCase()) {
    score += 20;
    reasons.push("name");
  }
  return { score: Math.min(100, score), reasons };
}
