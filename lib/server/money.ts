import { Prisma } from "@/lib/generated/prisma/client";

export type MoneyInput = string | number | Prisma.Decimal;

export const money = (value: MoneyInput) => new Prisma.Decimal(value).toDecimalPlaces(2);

export const addMoney = (...values: MoneyInput[]) =>
  values
    .reduce<Prisma.Decimal>((total, value) => total.plus(value), new Prisma.Decimal(0))
    .toDecimalPlaces(2);

export const subtractMoney = (left: MoneyInput, right: MoneyInput) =>
  new Prisma.Decimal(left).minus(right).toDecimalPlaces(2);

export const multiplyMoney = (value: MoneyInput, quantity: MoneyInput) =>
  new Prisma.Decimal(value).times(quantity).toDecimalPlaces(2);

export function formatMoney(value: MoneyInput, currency = "NGN", locale = "en-NG") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(new Prisma.Decimal(value).toNumber());
}
