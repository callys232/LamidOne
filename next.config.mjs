import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  /* PDFKit reads its standard-14 font metrics (Helvetica.afm etc.) off
     disk at runtime rather than bundling them as JS — left as an
     external package (not run through the bundler) and explicitly
     traced so the .afm files actually ship next to the server output.
     Without this, PDF generation throws ENOENT on the very first
     `new PDFDocument()` call. */
  serverExternalPackages: ["pdfkit", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": ["./node_modules/pdfkit/js/data/**/*"],
    "/api/milestones/extract": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.mjs",
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  /* DOCUSHARE moved off the shared /suites/[id] template to its own
     bespoke page — see content/docushare.ts's header comment for why.
     "docushare" is no longer in SUITES, so generateStaticParams no
     longer builds /suites/docushare and it would otherwise 404 for
     anyone with the old URL bookmarked or indexed. Permanent (308) —
     the move is deliberate and not coming back. */
  async redirects() {
    return [
      {
        source: "/suites/docushare",
        destination: "/docushare",
        permanent: true,
      },
    ];
  },
};

/* Config-gated the same way as the runtime SDK: without SENTRY_ORG
   and SENTRY_PROJECT, the plugin skips source-map upload (a build-time
   warning, not a failure) rather than needing an auth token to build
   at all. */
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
