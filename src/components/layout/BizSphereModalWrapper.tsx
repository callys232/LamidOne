"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { BizSphereModal } from "./BizSphereModal";

/**
 * Scroll-to-bottom trigger for BizSphereModal, ported from ProdLamid's
 * ModalWrapper.jsx: fires once per browser when the reader nears the
 * end of the homepage or pricing page, never again after that
 * (localStorage, not session — matches ProdLamid's original
 * persistence, and a promo you dismiss once shouldn't return every
 * visit). Scoped to just those two pages, not sitewide.
 *
 * BizSphere has no live URL yet — it's coming soon — so `BIZSPHERE_URL`
 * stays empty and `BizSphereModal` falls back to its waitlist form
 * (`/api/waitlist`) instead of a "Join our community" link. Once a
 * real URL exists, set it here and the modal switches back to linking
 * out directly — no other change needed.
 */
const STORAGE_KEY = "lamid-bizsphere-modal-shown";
const BIZSPHERE_URL = ""; // set once a live BizSphere/BizPhere URL exists — until then, the modal collects waitlist emails instead
const BOTTOM_THRESHOLD_PX = 100;
const ELIGIBLE_PATHS = new Set(["/", "/pricing"]);

export function BizSphereModalWrapper() {
  const pathname = usePathname();
  const eligible = pathname !== undefined && ELIGIBLE_PATHS.has(pathname);

  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(true); // default true (hidden) until localStorage is checked, avoids a flash

  const handleScroll = useCallback(() => {
    if (shown) return;
    const scrolled = window.scrollY || document.documentElement.scrollTop;
    const viewport = window.innerHeight;
    const full = document.documentElement.scrollHeight;
    if (scrolled + viewport >= full - BOTTOM_THRESHOLD_PX) {
      setOpen(true);
      setShown(true);
      localStorage.setItem(STORAGE_KEY, "1");
    }
  }, [shown]);

  useEffect(() => {
    setShown(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (shown || !eligible) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shown, eligible, handleScroll]);

  if (!eligible) return null;

  return <BizSphereModal open={open} onClose={() => setOpen(false)} href={BIZSPHERE_URL || undefined} />;
}
