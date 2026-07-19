import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PushPromptProps {
  userEmail?: string;
}

export default function PushPrompt({ userEmail }: PushPromptProps) {
  const { supported, subscription, loading, subscribe } = usePushNotifications(userEmail);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem("bluestar_push_dismissed");
    if (val === "true") setDismissed(true);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("bluestar_push_dismissed", "true");
  };

  const handleEnable = async () => {
    if (Notification.permission === "denied") {
      alert("Notifications are blocked. Please enable them in your browser settings.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      await subscribe();
      dismiss();
    }
  };

  // Only show if: supported, logged in, not already subscribed, not dismissed
  if (!supported || !userEmail || subscription || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full shadow-xl rounded-lg bg-primary text-primary-foreground p-4 flex gap-3 items-start animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Bell className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Enable notifications</p>
        <p className="text-xs text-primary-foreground/80 mt-0.5">
          Get instant alerts when Bluestar Alliance updates your application status.
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs px-3"
            onClick={handleEnable}
            disabled={loading}
          >
            {loading ? "Enabling…" : "Enable"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-3 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={dismiss}
          >
            Not now
          </Button>
        </div>
      </div>
      <button onClick={dismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
