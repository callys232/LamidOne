"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Shared fetch hook for dashboard pages.
 *
 * Every dashboard section follows the same shape: fetch on mount with
 * the mock-auth header, track loading/error, expose a `reload` for
 * after a mutation. Centralised so nineteen pages share one fetch
 * behaviour instead of nineteen slightly different copies of it.
 */

function mockHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const key = window.localStorage.getItem("lamid-mock-user");
  return key ? { "x-lamid-mock": key } : {};
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  return { "content-type": "application/json", ...mockHeader(), ...extra };
}

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { headers: authHeaders() });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
      setData(body);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { load(); }, [load]);

  return { data, error, loading, reload: load };
}

export async function apiPost<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, data: null, error: json?.error ?? `Request failed (${res.status})` };
    return { ok: true, data: json, error: null };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error).message };
  }
}
