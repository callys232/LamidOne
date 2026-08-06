import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { extractDeliverableText, SUPPORTED_DELIVERABLE_TYPES } from "@/lib/extractDeliverableText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — a submission note, not a video

/**
 * Reads an uploaded .docx or .pdf deliverable into plain text, for the
 * submission form to pre-fill its note field with — the expert still
 * reviews and can edit before submitting. Free: this is read-only
 * extraction, not a scored agent run.
 */
export const POST = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to upload a deliverable.");

  const rl = await limit("form", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) return fail(413, "too_large", "File must be under 8MB.");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return badRequest("Upload a `file` as multipart form data.");

  if (!(SUPPORTED_DELIVERABLE_TYPES as readonly string[]).includes(file.type)) {
    return badRequest(`Unsupported file type "${file.type}". Upload a .docx or .pdf.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) return fail(413, "too_large", "File must be under 8MB.");

  try {
    const { text, warnings } = await extractDeliverableText(buffer, file.type);
    if (!text) return badRequest("No readable text found in that file.");
    return ok({ text: text.slice(0, 4000), warnings, truncated: text.length > 4000 });
  } catch (e) {
    return badRequest((e as Error).message);
  }
});
