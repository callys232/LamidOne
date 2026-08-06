import path from "node:path";
import { pathToFileURL } from "node:url";
import mammoth from "mammoth";

/* pdf-parse (both the 1.x and 2.x lines) proved unusable under this app's
   bundler/runtime: 1.x's own vendored parser fails on any real PDF with
   "bad XRef entry" (reproduced even against a hand-built, spec-compliant
   minimal PDF, outside Turbopack entirely — a genuine bug in that
   package, not an environment issue); 2.x's worker-based API couldn't
   resolve its worker file under Turbopack. Using pdfjs-dist directly,
   pinned to its legacy Node build, sidesteps both: no worker is needed
   in Node when `disableWorker` is set, and this build has no dynamic
   import Turbopack fails to trace. cMap/standard-font data files are
   pointed at pdfjs-dist's own package folder so embedded/CID fonts
   decode correctly, not just plain Latin text. */
const PDFJS_ROOT = path.join(process.cwd(), "node_modules/pdfjs-dist");
const PDFJS_ENTRY = pathToFileURL(path.join(PDFJS_ROOT, "legacy/build/pdf.mjs")).href;

async function pdfToText(buffer: Buffer): Promise<string> {
  const pdfjs = await import(/* webpackIgnore: true */ PDFJS_ENTRY);
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
    cMapUrl: path.join(PDFJS_ROOT, "cmaps") + path.sep,
    cMapPacked: true,
    standardFontDataUrl: path.join(PDFJS_ROOT, "standard_fonts") + path.sep,
  }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: { str?: string }) => item.str ?? "").join(" ") + "\n";
  }
  return text.trim();
}

/**
 * Read a Word or PDF deliverable into plain text — was listed as
 * "on the roadmap" (`content/platform.ts` → "Document extraction",
 * `verified: false`) because deliverable review only ever accepted a
 * typed note (see the submission form's plain textarea); an uploaded
 * file was read by nobody.
 *
 * Deliberately returns text only, never a score — scoreDeliverable()
 * in lib/autoRelease.ts is the one place that judges a submission, so
 * this stays a pure extraction step feeding into the same review path
 * a typed note already goes through, not a second opinion.
 */

export type ExtractedDocument = { text: string; warnings: string[] };

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";

export const SUPPORTED_DELIVERABLE_TYPES = [DOCX_MIME, PDF_MIME] as const;

export async function extractDeliverableText(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
  if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value.trim(),
      warnings: result.messages.map((m) => m.message),
    };
  }

  if (mimeType === PDF_MIME) {
    const text = await pdfToText(buffer);
    return { text, warnings: [] };
  }

  throw new Error(`Unsupported deliverable type "${mimeType}" — upload a .docx or .pdf, or type the note directly.`);
}
