export const addSeconds = (date: Date, seconds: number) =>
  new Date(date.getTime() + seconds * 1_000);

export const addMinutes = (date: Date, minutes: number) =>
  addSeconds(date, minutes * 60);

export const isExpired = (date: Date, now = new Date()) => date.getTime() <= now.getTime();

export function dateKey(date = new Date(), timeZone = "Africa/Lagos") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}
