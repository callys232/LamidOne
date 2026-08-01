/**
 * Canonical API response shape used by all LAMID API routes.
 * Gives clients full type safety on every endpoint.
 */

export type ApiSuccess<T> = {
  success: true;
  data:    T;
  message?: string;
  pagination?: Pagination;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: string[];
  code?:   string;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface Pagination {
  page:  number;
  limit: number;
  total: number;
  pages: number;
}

/* ── Helper to build typed success/error responses ────────────── */
import { NextResponse } from "next/server";

export function ok<T>(data: T, message?: string, pagination?: Pagination, status = 200) {
  return NextResponse.json(
    { success: true, data, ...(message && { message }), ...(pagination && { pagination }) } satisfies ApiSuccess<T>,
    { status }
  );
}

export function err(message: string, status = 400, errors?: string[], code?: string) {
  return NextResponse.json(
    { success: false, message, ...(errors && { errors }), ...(code && { code }) } satisfies ApiError,
    { status }
  );
}

export function serverErr(e: unknown) {
  const message = e instanceof Error ? e.message : "Internal server error";
  return NextResponse.json({ success: false, message } satisfies ApiError, { status: 500 });
}
