"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { BizSphereModal } from "./BizSphereModal";

/**
 * Scroll-to-bottom trigger for BizSphereModal, ported from ProdLamid's
 * ModalWrapper.jsx: fires once per browser when the reader nears the
 * end of a page, never again after that (localStorage, not session —
 * matches ProdLamid's original persistence, and a promo you dismiss
 * once shouldn't return every visit).
 *
 * `href` has no live destination yet — until BizSphere has a real URL,
 * this renders nothing at all rather than linking a "Join our
 * community" button to a dead page. Same honest-degradation pattern as
 * the rest of the app when a dependency isn't configured (Paystack,
 * the model key): built and wired, inert until the real value exists.
 */
const STORAGE_KEY = "lamid-bizsphere-modal-shown";
const BIZSPHERE_URL = ""; // set once a live BizSphere/BizPhere URL exists
const BOTTOM_THRESHOLD_PX = 100;

export function BizSphereModalWrapper() {
  const pathname = usePathname();
  const onDashboard = pathname?.startsWith("/dashboard");

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
    if (shown) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shown, handleScroll]);

  if (!BIZSPHERE_URL || onDashboard) return null;

  return <BizSphereModal open={open} onClose={() => setOpen(false)} href={BIZSPHERE_URL} />;
}
