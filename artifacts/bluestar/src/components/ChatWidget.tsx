import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MessageSquare, X, Send, Shield, User, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";

const GUEST_EMAIL_KEY = "bluestar_chat_email";
const GUEST_NAME_KEY  = "bluestar_chat_name";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── Guest identity form ─────────────────────────────────────────────────────
function GuestForm({ onIdentify }: { onIdentify: (name: string, email: string) => void }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [err,   setErr]   = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setErr("Please enter your name and email to start chatting."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Please enter a valid email address."); return; }
    localStorage.setItem(GUEST_EMAIL_KEY, email.trim().toLowerCase());
    localStorage.setItem(GUEST_NAME_KEY,  name.trim());
    onIdentify(name.trim(), email.trim().toLowerCase());
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#0f2c6b] flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-[#f5a623]" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">Chat with Bluestar HR</p>
        <p className="text-xs text-gray-500 mt-0.5">We typically reply within a few hours</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {err && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Your Name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2c6b]/25 focus:border-[#0f2c6b]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email Address</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2c6b]/25 focus:border-[#0f2c6b]"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#0f2c6b] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0f2c6b]/90 transition-colors"
        >
          Start Chat →
        </button>
      </form>
    </div>
  );
}

// ─── Chat thread ─────────────────────────────────────────────────────────────
function ChatThread({
  userEmail, senderName, token, isGuest,
}: {
  userEmail: string; senderName: string; token: string | null; isGuest: boolean;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      let res: Response;
      if (isGuest) {
        res = await fetch(`/api/direct-messages/guest/${encodeURIComponent(userEmail)}`);
      } else {
        res = await fetch("/api/direct-messages", {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (res.ok) {
        const data = await res.json();
        // For logged-in users the response is the flat list; for guest it's also flat
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 4000);
    return () => clearInterval(iv);
  }, [userEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true); setError("");
    try {
      let res: Response;
      if (isGuest) {
        res = await fetch("/api/direct-messages/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: senderName, email: userEmail, content: t }),
        });
      } else {
        res = await fetch(`/api/direct-messages/${encodeURIComponent(userEmail)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ senderRole: "user", senderName, content: t }),
        });
      }
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(e.error ?? "Send failed"); return; }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setText("");
    } catch { setError("Network error. Please try again."); }
    finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2.5 px-4 py-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center">
            <MessageSquare className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-xs font-medium text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Say hello — we respond within a few hours</p>
          </div>
        ) : messages.map((m: any) => {
          const mine = m.senderRole !== "admin";
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs
                ${mine ? "bg-[#f5a623]" : "bg-[#0f2c6b]"}`}>
                {mine ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              </div>
              <div className={`max-w-[78%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap
                  ${mine ? "bg-[#0f2c6b] text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
                  {mine ? "You" : m.senderName} · {fmtTime(m.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3 shrink-0">
        {error && <p className="text-xs text-red-500 mb-1.5">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs
              focus:outline-none focus:ring-2 focus:ring-[#0f2c6b]/20 focus:border-[#0f2c6b]
              placeholder:text-gray-300 transition-all"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-8 h-8 rounded-xl bg-[#0f2c6b] text-white flex items-center justify-center
              hover:bg-[#0f2c6b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main widget ─────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [location]  = useLocation();
  const [open,      setOpen]      = useState(false);
  const [unread,    setUnread]    = useState(0);

  // Guest state from localStorage
  const [guestEmail, setGuestEmail] = useState<string | null>(() => localStorage.getItem(GUEST_EMAIL_KEY));
  const [guestName,  setGuestName]  = useState<string | null>(() => localStorage.getItem(GUEST_NAME_KEY));

  // Auth state
  const hasToken = !!localStorage.getItem("bluestar_token");
  const { data: currentUser } = useGetCurrentUser({
    query: { enabled: hasToken, queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  const token = localStorage.getItem("bluestar_token");
  const isLoggedIn = !!currentUser;

  // Poll unread count from admin messages
  useEffect(() => {
    const email = isLoggedIn ? currentUser?.email : guestEmail;
    if (!email) return;

    const poll = async () => {
      try {
        let msgs: any[] = [];
        if (isLoggedIn) {
          const res = await fetch("/api/direct-messages", { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) msgs = await res.json();
        } else if (guestEmail) {
          const res = await fetch(`/api/direct-messages/guest/${encodeURIComponent(guestEmail)}`);
          if (res.ok) msgs = await res.json();
        }
        const unreadCount = msgs.filter((m: any) => m.senderRole === "admin" && !m.isRead).length;
        setUnread(unreadCount);
      } catch { /* silent */ }
    };

    poll();
    const iv = setInterval(poll, 8000);
    return () => clearInterval(iv);
  }, [isLoggedIn, currentUser?.email, guestEmail, token]);

  // Never show the widget on the admin page
  if (location === "/admin") return null;

  const identified = isLoggedIn || (!!guestEmail && !!guestName);
  const chatEmail  = isLoggedIn ? (currentUser?.email ?? "") : (guestEmail ?? "");
  const chatName   = isLoggedIn ? (currentUser?.fullName ?? "Visitor") : (guestName ?? "Visitor");

  const handleIdentify = (name: string, email: string) => {
    setGuestName(name);
    setGuestEmail(email);
  };

  return (
    <>
      {/* Popup panel */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: identified ? 420 : "auto", maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f2c6b] to-[#1a3f8f] px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#f5a623]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Bluestar HR</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-blue-200 text-[10px]">Online · Typically replies in hours</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Body */}
          {identified ? (
            <ChatThread
              userEmail={chatEmail}
              senderName={chatName}
              token={token}
              isGuest={!isLoggedIn}
            />
          ) : (
            <GuestForm onIdentify={handleIdentify} />
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); }}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-[#0f2c6b] text-white shadow-xl
          hover:bg-[#0f2c6b]/90 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Chat with Bluestar HR"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageSquare className="w-5 h-5" />
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
