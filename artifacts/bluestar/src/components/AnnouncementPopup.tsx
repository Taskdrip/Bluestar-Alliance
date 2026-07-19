import { useEffect, useState, useCallback } from "react";
import { X, ShieldAlert, AlertTriangle } from "lucide-react";

interface PopupData {
  id: number;
  imageUrl: string | null;
  title: string;
  body: string;
  isActive: boolean;
  updatedAt: string;
}

// Shown if the API is unavailable or no popup is configured yet
const FALLBACK: Omit<PopupData, "id" | "updatedAt" | "isActive"> = {
  imageUrl: null,
  title: "Bluestar Alliance Company Limited",
  body: "Bluestar Alliance Company Limited and its authorized recruiting channels DO NOT CHARGE recruitment or deployment fees from applicants / candidates.\n\nBEWARE OF ILLEGAL RECRUITERS AND SCAMMERS.",
};

const DISMISSED_KEY = "bluestar_popup_dismissed_v2";
const DELAY_MS = 60_000; // 1 minute

export default function AnnouncementPopup() {
  const [popup, setPopup] = useState<Omit<PopupData, "id" | "updatedAt" | "isActive"> | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => {
      fetch("/api/announcement-popup")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: PopupData | null) => {
          const content = data && data.isActive ? data : FALLBACK;
          setPopup(content);
          setMounted(true);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setVisible(true))
          );
        })
        .catch(() => {
          // API unavailable — show fallback
          setPopup(FALLBACK);
          setMounted(true);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setVisible(true))
          );
        });
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setTimeout(() => setMounted(false), 400);
  }, []);

  // ESC key
  useEffect(() => {
    if (!mounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mounted, dismiss]);

  // Prevent background scroll while open
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mounted]);

  if (!mounted || !popup) return null;

  const lines = popup.body.split("\n\n");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Important Notice"
      className={`fixed inset-0 z-[300] flex items-center justify-center p-4 transition-opacity duration-400 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.45)] overflow-hidden
          transition-all duration-400
          ${visible ? "scale-100 translate-y-0 opacity-100" : "scale-90 translate-y-8 opacity-0"}`}
      >
        {/* ── Close button ── */}
        <button
          onClick={dismiss}
          aria-label="Close notice"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 flex items-center justify-center rounded-full
            bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm
            transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* ── Image or decorative header ── */}
        {popup.imageUrl ? (
          <div className="relative w-full aspect-[16/7] overflow-hidden">
            <img
              src={popup.imageUrl}
              alt="Announcement"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay so close button is always visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          </div>
        ) : (
          /* Decorative hero band */
          <div className="relative w-full bg-[hsl(224,76%,22%)] pt-10 pb-8 px-7 flex flex-col items-center text-center overflow-hidden">
            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(44,96%,52%,0.25),transparent_70%)]" />

            {/* Outer ring + icon */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                  <ShieldAlert className="w-7 h-7 text-amber-400" />
                </div>
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border border-amber-400/40 animate-ping opacity-30" />
            </div>

            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-amber-400/90 mb-2">
              Official Notice
            </p>
            <h2 className="font-serif text-lg font-bold text-white leading-snug">
              {popup.title}
            </h2>
          </div>
        )}

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-6">
          {/* Warning chip */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-[11px] font-bold tracking-widest uppercase text-red-600">
              Important Warning
            </p>
          </div>

          {/* Body text — split paragraphs */}
          <div className="space-y-3">
            {lines.map((line, i) =>
              line.trim() ? (
                <p
                  key={i}
                  className={`text-sm leading-relaxed ${
                    i === lines.length - 1 && line.toUpperCase() === line
                      ? "font-bold text-red-700 text-center tracking-wide text-base"
                      : "text-gray-700"
                  }`}
                >
                  {line}
                </p>
              ) : null
            )}
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* CTA */}
          <button
            onClick={dismiss}
            className="w-full h-11 rounded-xl bg-[hsl(224,76%,28%)] hover:bg-[hsl(224,76%,22%)]
              text-white font-semibold text-sm tracking-wide
              transition-colors shadow-md shadow-primary/20
              focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            I Understand — Dismiss
          </button>

          <p className="mt-3 text-center text-[11px] text-gray-400">
            Tap outside or press <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">Esc</kbd> to close
          </p>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1 bg-gradient-to-r from-[hsl(224,76%,28%)] via-amber-400 to-[hsl(224,76%,28%)]" />
      </div>
    </div>
  );
}
