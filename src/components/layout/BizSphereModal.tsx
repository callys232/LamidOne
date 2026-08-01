"use client";

/**
 * BIZSPHERE — the scroll-to-bottom introduction modal.
 *
 * Ported from ProdLamid's BizSphereModal.jsx/ModalWrapper.jsx pattern:
 * fires once, when the reader scrolls near the end of a page, and never
 * again (localStorage-gated) — introducing BizSphere rather than
 * interrupting the page on load like a typical exit-intent popup.
 *
 * Re-themed onto this app's own system (brand red, theme-aware
 * surfaces) rather than ProdLamid's fixed black/blue/orange palette,
 * so it doesn't read as a foreign widget bolted onto the page.
 */
export function BizSphereModal({ open, onClose, href }: { open: boolean; onClose: () => void; href: string }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-fadeUp relative w-full max-w-md rounded-2xl p-8 text-center shadow-2xl sm:p-10"
        style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Introducing BizSphere"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ background: "var(--ink)", color: "var(--page)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-3 flex justify-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-soft)" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--line)" }} />
          <span className="h-2 w-2 rounded-full border" style={{ borderColor: "var(--line)" }} />
        </div>

        <h2 className="font-display text-xl tracking-wide">BIZSPHERE</h2>
        <p className="faint mt-1 text-xs">it's all about business</p>

        <p className="muted mt-6 text-sm leading-relaxed sm:text-base">
          The exclusive online networking{" "}
          <span className="font-medium text-brand">marketplace</span>, where sellers meet buyers,
          and exchange services and products.
        </p>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="btn btn-primary mt-8 inline-flex w-full justify-center sm:w-auto"
        >
          Join our community
        </a>
      </div>
    </div>
  );
}
