import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: { requestId: string; timestamp: string } & Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: { requestId: string; timestamp: string };
};

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested record was not found.") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super("CONFLICT", message, 409, details);
  }
}

export function requestIdFrom(request?: Request) {
  return request?.headers.get("x-request-id")?.slice(0, 100) || randomUUID();
}

export function apiSuccess<T>(data: T, requestId: string, meta: Record<string, unknown> = {}) {
  return NextResponse.json<ApiSuccess<T>>({
    ok: true,
    data,
    meta: { requestId, timestamp: new Date().toISOString(), ...meta },
  });
}

export function apiFailure(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return NextResponse.json<ApiFailure>(
      {
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
        meta: { requestId, timestamp: new Date().toISOString() },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    const issueSummary = error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join("; ");
    return NextResponse.json<ApiFailure>(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: issueSummary ? `Validation failed: ${issueSummary}` : "The request contains invalid values.",
          details: error.flatten(),
        },
        meta: { requestId, timestamp: new Date().toISOString() },
      },
      { status: 422 },
    );
  }

  console.error("Unhandled API error", { requestId, error });
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      meta: { requestId, timestamp: new Date().toISOString() },
    },
    { status: 500 },
  );
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("INVALID_JSON", "The request body must contain valid JSON.", 400);
  }
  return schema.parse(body);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "25", 10) || 25),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
