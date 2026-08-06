"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root-level error boundary — catches anything that escapes every
 * page/layout error boundary. Reports to Sentry only when configured;
 * otherwise this is a plain fallback screen with nothing to send it to.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FBF9F8", color: "#16161A" }}>
        <div style={{ maxWidth: 480, margin: "20vh auto", textAlign: "center", padding: "0 24px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong.</h1>
          <p style={{ marginTop: 12, color: "#5C5C66" }}>
            The error has been logged. Refreshing usually resolves it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24, padding: "10px 20px", borderRadius: 8,
              background: "#C12129", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
