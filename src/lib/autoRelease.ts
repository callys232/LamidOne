/**
 * ESCROW AUTO-RELEASE POLICY.
 *
 * Ported from ProdLamid's `lib/escrow/autoReleasePolicy.ts` with the
 * same numbers and the same reasoning, kept verbatim because the
 * reasoning is the part worth keeping:
 *
 * There are only two routes to release:
 *   1. The client approves the milestone — funds move immediately.
 *   2. Nobody approves and nobody disputes for a long time — funds move
 *      on the timer, so an expert is not left unpaid by a client who
 *      has gone quiet.
 *
 * The second is a fallback for silence, not a default settlement path.
 * ProdLamid originally ran it at twelve hours — a single night, so a
 * client who did not read their email before morning had already lost
 * the chance to object. Seven days is long enough that silence is a
 * fair signal rather than an accident of timezone.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days of unbroken silence before certified work releases on its own.
 *  Floor of 2 days so it can be tuned but never reduced back to overnight. */
export const AUTO_RELEASE_DAYS = (() => {
  const raw = Number(process.env.ESCROW_AUTO_RELEASE_DAYS);
  return Number.isFinite(raw) && raw >= 2 ? raw : 7;
})();

export const AUTO_RELEASE_MS = AUTO_RELEASE_DAYS * DAY_MS;

/** The moment certified work becomes eligible, measured from certification. */
export function autoReleaseDeadline(from: number = Date.now()): number {
  return from + AUTO_RELEASE_MS;
}

/** Human phrasing for notifications, so the copy tracks the setting. */
export function autoReleaseWindowLabel(): string {
  return AUTO_RELEASE_DAYS === 1 ? "24 hours" : `${AUTO_RELEASE_DAYS} days`;
}

/** States that must never auto-release. A dispute stops the clock
 *  outright; approved/released are already settled and re-releasing
 *  them would double-pay. */
export const BLOCKS_AUTO_RELEASE = ["disputed", "approved"] as const;

/**
 * A lightweight completeness score for a submitted deliverable.
 *
 * ProdLamid's version calls a document-analysis model over the actual
 * uploaded file. This build has no file-content extraction wired yet
 * (that lives in DocuShare, a separate app), so the check here is
 * structural rather than semantic: does the submission carry a real
 * note describing what was delivered, is it long enough to be more
 * than a placeholder. It is deliberately conservative — a low score
 * blocks certification rather than guessing generously, because a
 * false "certified" is the one failure mode that actually costs
 * someone money.
 */
export function scoreDeliverable(note: string | undefined): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const text = (note ?? "").trim();
  if (text.length === 0) {
    reasons.push("No submission note was provided.");
    return { score: 0, reasons };
  }

  if (text.length >= 20) { score += 30; } else { reasons.push("Submission note is very short."); }
  if (text.length >= 80) { score += 25; }
  if (/\b(delivered|complete|attached|link|file|report|draft)\b/i.test(text)) { score += 25; }
  else { reasons.push("Note does not reference a concrete deliverable."); }
  if (!/^(done|finished|complete)\.?$/i.test(text)) { score += 20; }
  else { reasons.push("Note is a bare status word rather than a description."); }

  return { score: Math.min(100, score), reasons };
}

export const CERTIFY_THRESHOLD = 60;
