export function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

export function normalizePhone(value?: string | null, defaultCountryCode = "234") {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `${defaultCountryCode}${digits.slice(1)}`;
  if (!digits.startsWith(defaultCountryCode) && digits.length === 10) digits = `${defaultCountryCode}${digits}`;
  return `+${digits}`;
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
