import { spawn } from "node:child_process";

/**
 * Runs document parsers in a separate OS process.
 *
 * `pdf-parse` and `mammoth` process files uploaded by the party who stands to be
 * paid. Run in-process, a crafted document that trips a parser bug gets the full
 * privileges of the request handler, and a decompression bomb takes the server's
 * heap with it — one bad upload becomes an outage.
 *
 * A worker thread is not enough here. Threads share the process, so a V8 fatal
 * error still kills everything; pdf-parse v2 wraps pdf.js, which spawns its own
 * worker, and tearing that down took the host process with it. A child process
 * is the isolation that was actually being claimed: its own heap cap, its own
 * address space, and a crash that the parent merely observes.
 */

export interface SandboxResult {
  ok:    boolean;
  text:  string;
  error?: string;
}

/** Heap ceiling for the parser process. A bomb hits this and dies alone. */
const MAX_HEAP_MB = 256;

/** Wall clock. Parsers can loop on malformed input rather than erroring. */
const TIMEOUT_MS = 25_000;

/** Cap on what the child may hand back, before it reaches the model. */
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

/**
 * The child reads base64 on stdin and writes one JSON line to stdout.
 *
 * Passed with `-e` rather than as a file: Next.js relocates files during build,
 * so a path to a script is not dependable across dev, standalone and container
 * builds. `cwd` stays the project root so node_modules still resolves.
 */
const CHILD_SRC = `
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { raw += c; });
process.stdin.on("end", async () => {
  const reply = (o) => { process.stdout.write(JSON.stringify(o)); process.exit(0); };
  let parser;
  try {
    const { ext, b64 } = JSON.parse(raw);
    const buf = Buffer.from(b64, "base64");
    let text = "";

    if (ext === "pdf") {
      const { PDFParse } = require("pdf-parse");
      parser = new PDFParse({ data: buf });
      text = (await parser.getText()).text || "";
    } else if (ext === "docx") {
      const mod = require("mammoth");
      const mammoth = mod.default || mod;
      text = (await mammoth.extractRawText({ buffer: buf })).value || "";
    } else {
      throw new Error("unsupported type for sandboxed parsing");
    }

    try { await parser?.destroy?.(); } catch {}
    reply({ ok: true, text: String(text) });
  } catch (e) {
    try { await parser?.destroy?.(); } catch {}
    reply({ ok: false, text: "", error: e && e.message ? String(e.message) : "parse failed" });
  }
});
`;

export async function parseInSandbox(buffer: Buffer, ext: "pdf" | "docx"): Promise<SandboxResult> {
  return new Promise<SandboxResult>((resolve) => {
    let settled = false;
    let stdout = "";
    let stderr = "";

    const child = spawn(
      process.execPath,
      [`--max-old-space-size=${MAX_HEAP_MB}`, "-e", CHILD_SRC],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
        // The parser has no business reading the server's environment.
        env: { PATH: process.env.PATH ?? "", NODE_ENV: process.env.NODE_ENV ?? "production" },
        windowsHide: true,
      },
    );

    const finish = (r: SandboxResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // SIGKILL — a wedged parser will not honour a polite signal.
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve(r);
    };

    const timer = setTimeout(
      () => finish({ ok: false, text: "", error: "parsing timed out" }),
      TIMEOUT_MS,
    );

    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
      if (stdout.length > MAX_OUTPUT_BYTES) {
        finish({ ok: false, text: "", error: "parser output too large" });
      }
    });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString("utf8").slice(0, 2000); });

    child.on("error", (e) =>
      finish({ ok: false, text: "", error: e?.message ?? "could not start parser" }));

    /* A process killed for exceeding its heap, or aborted by V8, lands here
       with a non-zero code or a signal — never as a thrown error. */
    child.on("close", (code, signal) => {
      if (settled) return;
      if (signal) {
        finish({ ok: false, text: "", error: `parser killed (${signal}) — file rejected` });
        return;
      }
      if (code !== 0) {
        finish({ ok: false, text: "", error: `parser exited (${code}) — file rejected` });
        return;
      }
      try {
        finish(JSON.parse(stdout) as SandboxResult);
      } catch {
        finish({
          ok: false, text: "",
          error: stderr.trim().split("\n")[0] || "parser produced no usable result",
        });
      }
    });

    child.stdin.on("error", () => { /* child already gone; close handles it */ });
    child.stdin.end(JSON.stringify({ ext, b64: buffer.toString("base64") }));
  });
}
