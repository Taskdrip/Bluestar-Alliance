import { useEffect, useState, useCallback } from "react";
import { X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PopupData {
  id: number;
  imageUrl: string | null;
  title: string;
  body: string;
  isActive: boolean;
  updatedAt: string;
}

const DISMISSED_KEY = "bluestar_popup_dismissed";

export default function AnnouncementPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    fetch("/api/announcement-popup")
      .then(r => r.ok ? r.json() : null)
      .then((data: PopupData | null) => {
        if (data && data.isActive) {
          setPopup(data);
          // Small delay for a polished entrance after page load
          setTimeout(() => {
            setMounted(true);
            requestAnimationFrame(() => setVisible(true));
          }, 600);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setTimeout(() => setMounted(false), 300);
  }, []);

  // ESC key support
  useEffect(() => {
    if (!mounted) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mounted, dismiss]);

  if (!mounted || !popup) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          visible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        {/* Close button — always accessible */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Close notice"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        {popup.imageUrl ? (
          <div className="w-full aspect-[16/7] overflow-hidden bg-primary/10">
            <img
              src={popup.imageUrl}
              alt="Announcement"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          /* Decorative header band when no image */
          <div className="w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        )}

        {/* Body */}
        <div className="px-7 py-6">
          {/* Icon + label row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-600 leading-none mb-0.5">
                Official Notice
              </p>
              <h2 className="font-serif text-xl font-bold text-primary leading-tight">
                {popup.title}
              </h2>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-primary/20 via-amber-300/60 to-transparent mb-5" />

          {/* Body text */}
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
            {popup.body}
          </p>

          {/* Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={dismiss}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-8 h-11 rounded-lg shadow"
            >
              I Understand
            </Button>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              — Bluestar Alliance Company Limited
            </p>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      </div>
    </div>
  );
}
