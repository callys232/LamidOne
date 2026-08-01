/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* ── Brand ──────────────────────────────────────────────
           One accent, rationed. Red is spent ONLY on: the mark,
           primary CTA fills, checkmarks, suite glyphs, eyebrow dots
           and stat numerals. Never on table ticks, never on body
           text, never as a background wash. See teardown §6.3.     */
        brand: {
          DEFAULT: "#C12129",
          50:  "#FDF3F3",
          100: "#FBE4E5",
          200: "#F6C9CB",
          300: "#EE9DA1",
          400: "#E26A70",
          500: "#D13B43",
          600: "#C12129",
          700: "#A11B22",
          800: "#7E151B",
          900: "#5C0F14",
        },
        /* Page surfaces. Light is a warm off-white, not pure white —
           pure white makes red vibrate. Dark is true black per brief. */
        surface: {
          light: "#FBF9F8",
          "light-raised": "#FFFFFF",
          dark: "#000000",
          "dark-raised": "#0C0C0D",
        },
        ink: {
          DEFAULT: "#16161A",
          muted: "#5C5C66",
          faint: "#8A8A94",
        },
        /* Status is reserved and never impersonates the brand or a
           suite tint. Ticks in comparison tables use `good`.        */
        good: "#15803D",
        warn: "#B45309",
        bad: "#B91C1C",
        /* ── Suite tints ────────────────────────────────────────
           Applied ONLY inside product imagery, suite glyphs and
           engine chips — never to chrome or CTAs. This is the
           per-hub tint system from teardown §7.8: one asset
           library, recoloured per suite.                          */
        suite: {
          core: "#1E4FD8",
          grow: "#0E7A5F",
          talent: "#6D28D9",
          finance: "#B45309",
          desk: "#0369A1",
          signal: "#BE185D",
          learn: "#7C2D12",
          market: "#334155",
        },
      },
      fontFamily: {
        /* Serif display / sans body — the split that does the
           "established, not startup" work. See teardown §1.        */
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(2.75rem, 6vw, 5.25rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        display: ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        stat: ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      maxWidth: { shell: "1240px" },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { fadeUp: "fadeUp .5s cubic-bezier(.22,1,.36,1) forwards" },
    },
  },
  plugins: [],
};
