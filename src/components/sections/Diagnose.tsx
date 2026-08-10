import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { RUNNABLE_TOOLS } from "@/content/freeTools";
import { SUITES_BY_ID, type SuiteId } from "@/content/suites";
import { engineForSuite } from "@/content/aios";
import { EngineCard } from "@/components/graphics/EngineCard";

/**
 * START WITH YOUR OWN DATA.
 *
 * The ordering principle behind this section is the whole product:
 *
 *   You put structured business data in. The engines compute on it.
 *
 * So the reader is not asked to know which engine answers their
 * question. They are shown the QUESTION in their own words — "revenue
 * is up, margin is not" — and the module that answers it is the
 * consequence, not the headline.
 *
 * ONE CARD, NOT SEVEN. This listed all seven runnable tools stacked,
 * which is a directory: a reader scans it, finds nothing addressed to
 * them specifically, and scrolls on. The module shape here is
 * HubSpot's case-studies block — a labelled rule with the "see all"
 * escape hatch on the right, an asymmetric heading, then ONE example
 * given enough room to actually be read. The other six are one click
 * away and are the whole of /free-tools.
 *
 * WHICH ONE IS FEATURED. The first entry in RUNNABLE_TOOLS, which is
 * the decision-clarity check — three minutes, free tier, no data
 * gathering needed before you start. Featuring the twelve-minute bench
 * scoring would be showing the most impressive engine to someone who
 * has not yet agreed to spend three.
 */
export function Diagnose() {
  const [featured] = RUNNABLE_TOOLS;
  if (!featured) return null;

  const suite = SUITES_BY_ID[featured.suite as SuiteId];
  const engine = engineForSuite(featured.suite);
  const tint = engine?.tint ?? suite?.tint ?? "var(--brand)";
  /* `poweredBy` is "Q44 — Decision Clarity Score". This kept the head
     and threw the tail away, which left a bare module code on the card
     next to "3 min" — an identifier that means something internally and
     nothing to a first-time reader, especially as the card never shows
     the tool's name either. Both halves are kept now: the code stays
     for anyone who knows it, and the expansion says what it computes.
     Not every entry has a tail ("LAMID SIGNAL" has none), so the second
     half is optional by construction. */
  const [code, engineName] = featured.poweredBy.split(" — ");
  const href =
    featured.engineCode === "budget" ? "/diagnostics/budget"
    : featured.engineCode ? `/diagnostics/${featured.engineCode}`
    : featured.toolHref!;

  return (
    <Section id="diagnose" className="border-t">
      {/* ── Labelled rule with the escape hatch ─────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <span
          className="rounded-lg border px-3.5 py-2 text-[13px] font-bold"
          style={{ borderColor: "var(--ink)" }}
        >
          Start with your own data
        </span>
        <span
          className="hidden h-px flex-1 sm:block"
          style={{ backgroundImage: "linear-gradient(to right, var(--line) 50%, transparent 50%)", backgroundSize: "8px 1px" }}
          aria-hidden="true"
        />
        <Link
          href="/free-tools"
          className="rounded-lg border px-5 py-3 text-[15px] font-bold transition-colors hover:border-[color:var(--brand)] hover:text-brand"
          style={{ borderColor: "var(--ink)" }}
        >
          See all {RUNNABLE_TOOLS.length} diagnostics
        </Link>
      </div>

      {/* ── Asymmetric heading ──────────────────────────────── */}
      <div className="mt-12 grid gap-6 md:grid-cols-12 md:gap-10">
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-normal leading-[1.15] tracking-[-0.01em] md:col-span-6">
          You put the figures in. The engines do the arithmetic.
        </h2>
        <p className="lead md:col-span-5 md:col-start-8 md:self-end">
          Every one of these computes on data you enter — no language model writes a number, and
          the working comes out with the result. Free to fill in on any plan.
        </p>
      </div>

      {/* ── The one featured diagnostic ─────────────────────── */}
      <Link
        href={href}
        className="card card-interactive group mt-12 grid items-center gap-9 p-8 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
        style={{
          borderLeft: `3px solid ${tint}`,
          /* Without this the card would lift on brand red while its own
             left rule, the "It computes" label and the engine graphic
             are all in the engine's tint — the hover has to answer in
             the same colour the card is already speaking in. */
          ["--suite-tint" as string]: tint,
        }}
      >
        <div>
          <p className="font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-snug">
            &ldquo;{featured.symptom}&rdquo;
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand">
              Run it
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
            <span className="faint inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {featured.minutes} min
              </span>
              {/* The code carries the engine's tint — it is the one
                  place on the card that names the machine, so it should
                  look like the machine rather than like metadata. The
                  expansion stays faint beside it: a reader needs it
                  once, and never again. */}
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold tabular-nums" style={{ color: tint }}>
                  {code}
                </span>
                {engineName && <span>{engineName}</span>}
              </span>
            </span>
          </div>

          <dl
            className="mt-7 space-y-4 border-t pt-6 text-sm leading-relaxed"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <div>
              <dt className="faint text-[11px] font-semibold uppercase tracking-[0.14em]">
                You enter
              </dt>
              <dd className="muted mt-1.5">{featured.inputs}</dd>
            </div>
            <div>
              <dt
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: tint }}
              >
                It computes
              </dt>
              <dd className="mt-1.5">{featured.answers}</dd>
            </div>
          </dl>
        </div>

        <EngineCard suiteId={engine?.id ?? featured.suite} tint={tint} />
      </Link>

      <p className="faint mt-7 text-sm leading-relaxed">
        Free to fill in on any plan. Results need an account, and an engine run costs 40 points —
        a new account is granted exactly that, so the first one is free. A run that fails is not
        charged.
      </p>
    </Section>
  );
}
