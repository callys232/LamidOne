/**
 * Client-side error monitoring (Sentry), config-gated on
 * NEXT_PUBLIC_SENTRY_DSN — a separate, public-safe variable from the
 * server-side SENTRY_DSN in instrumentation.ts, since this file ships
 * to the browser.
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
