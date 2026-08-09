import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getRuntimeEnv } from "@/lib/server/env";

export function cargoTrackingToken(shipmentId: string, awbNumber: string) {
  return createHmac("sha256", getRuntimeEnv().AUTH_SECRET).update(`cargo:${shipmentId}:${awbNumber}`).digest("base64url").slice(0, 32);
}

export function isValidCargoTrackingToken(shipmentId: string, awbNumber: string, candidate: string) {
  const expected = cargoTrackingToken(shipmentId, awbNumber);
  const left = Buffer.from(expected); const right = Buffer.from(candidate);
  return left.length === right.length && timingSafeEqual(left, right);
}
