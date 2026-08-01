import { NextResponse } from "next/server";
import { ConfigError } from "./env";

/**
 * One response shape for every route, so clients never have to guess
 * whether an error is a string, an object, or an HTML page.
 */

export type ApiError = {
  error: string;
  /** Machine-readable, stable across wording changes. */
  code: string;
  /** Present on 402 so the client can offer the right remedy. */
  remedy?: { kind: "upgrade" | "topup"; tier?: string; points?: number };
};

export const ok = <T,>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export const fail = (status: number, code: string, error: string, remedy?: ApiError["remedy"]) =>
  NextResponse.json<ApiError>({ error, code, ...(remedy ? { remedy } : {}) }, { status });

export const badRequest = (msg = "Invalid request.") => fail(400, "bad_request", msg);
export const unauthorised = () => fail(401, "unauthorised", "Sign in to continue.");
export const forbidden = (msg = "Your plan does not include this.") => fail(403, "forbidden", msg);
export const tooLarge = () => fail(413, "too_large", "Request body too large.");
export const rateLimited = (retryAfter: number) =>
  NextResponse.json<ApiError>(
    { error: "Too many requests. Try again shortly.", code: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );

/**
 * Wraps a handler so an unexpected throw never leaks a stack trace to
 * the client. Config problems are reported as 503 (fix the deploy)
 * rather than 500 (fix the code) — the distinction matters at 3am.
 */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof ConfigError) {
        console.error("[config]", e.message);
        return fail(503, "not_configured", "This feature is not configured on the server.");
      }
      console.error("[unhandled]", e);
      return fail(500, "internal", "Something went wrong. The error has been logged.");
    }
  };
}

/** Guards against oversized bodies before they are parsed into memory. */
export function bodyTooLarge(req: Request, maxBytes: number): boolean {
  const len = Number(req.headers.get("content-length") ?? 0);
  return Number.isFinite(len) && len > maxBytes;
}

/**
 * Strips control characters and caps length. Applied to anything that
 * reaches a model, to blunt prompt injection and payload stuffing.
 * Keeps tab, newline and carriage return; removes the rest of C0 plus DEL.
 */
const CONTROL_CHARS = new RegExp("[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]", "g");

export function clean(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return input.slice(0, max).replace(CONTROL_CHARS, "").trim();
}
