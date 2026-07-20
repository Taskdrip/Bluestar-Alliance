import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, Search, MessageSquare, Briefcase,
  Send, User, Shield, AlertCircle, FileText,
  LogIn, RefreshCw, Inbox, Bell, Package,
  LayoutDashboard, ChevronRight, Star, Globe,
  BellDot, UserCircle, Mail, Phone, Calendar,
  BadgeCheck, Circle
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Application {
  id: number;
  fullName: string;
  email: string;
  position: string;
  country: string;
  status: string;
  submittedAt: string;
  yearsOfExperience: number;
}

interface Message {
  id: number;
  applicationId: number;
  senderRole: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Notification {
  id: number;
  message: string;
  type: string;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
}

interface Order {
  id: number;
  applicationId: number;
  visaSponsorship: boolean;
  flightTicket: boolean;
  workPermit: boolean;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "pending",     label: "Submitted",    icon: FileText },
  { key: "reviewing",   label: "Under Review", icon: Search },
  { key: "shortlisted", label: "Shortlisted",  icon: Star },
  { key: "interview",   label: "Interview",    icon: MessageSquare },
  { key: "approved",    label: "Approved",     icon: BadgeCheck },
];
const STATUS_ORDER = ["pending", "reviewing", "shortlisted", "interview", "approved", "rejected"];

function stepIndex(status: string) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

const STATUS_MAP: Record<string, { label: string; pill: string }> = {
  pending:     { label: "Submitted",       pill: "bg-blue-100 text-blue-800 border-blue-200" },
  reviewing:   { label: "Under Review",    pill: "bg-amber-100 text-amber-800 border-amber-200" },
  shortlisted: { label: "Shortlisted",     pill: "bg-purple-100 text-purple-800 border-purple-200" },
  interview:   { label: "Interview",       pill: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  approved:    { label: "Approved ✓",      pill: "bg-green-100 text-green-800 border-green-200" },
  rejected:    { label: "Not Proceeding",  pill: "bg-red-100 text-red-700 border-red-200" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, pill: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.pill}`}>
      {s.label}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Status Stepper ─────────────────────────────────────────────────────────
function StatusStepper({ status }: { status: string }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">Not proceeding</p>
          <p className="text-xs text-red-600 mt-0.5">Thank you for applying. Contact HR for further details.</p>
        </div>
      </div>
    );
  }
  const cur = stepIndex(status);
  return (
    <div className="relative px-1">
      <div className="absolute top-4 left-5 right-5 h-0.5 bg-gray-100 hidden sm:block" />
      <div
        className="absolute top-4 left-5 h-0.5 bg-[#0f2c6b] hidden sm:block transition-all duration-700"
        style={{ width: cur === 0 ? "0%" : `calc(${(cur / (STATUS_STEPS.length - 1)) * 100}% - 0px)` }}
      />
      <div className="flex justify-between relative z-10">
        {STATUS_STEPS.map((s, i) => {
          const done = i < cur; const active = i === cur;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? "bg-[#0f2c6b] border-[#0f2c6b] text-white"
                : active ? "bg-white border-[#0f2c6b] text-[#0f2c6b] ring-4 ring-[#0f2c6b]/10"
                : "bg-white border-gray-200 text-gray-300"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] text-center leading-tight hidden sm:block font-medium
                ${active ? "text-[#0f2c6b]" : done ? "text-gray-500" : "text-gray-300"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sm:hidden mt-2 text-xs text-center font-semibold text-[#0f2c6b]">
        {STATUS_STEPS[Math.min(cur, STATUS_STEPS.length - 1)]?.label}
        <span className="text-gray-400 font-normal"> · {cur + 1}/{STATUS_STEPS.length}</span>
      </p>
    </div>
  );
}

// ─── Chat thread for one application ────────────────────────────────────────
function ChatThread({ app, user, token }: { app: Application; user: any; token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef   = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const isNearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };
  const scrollToBottom = () => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };

  const load = () =>
    fetch(`/api/messages/${app.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((d: Message[]) => { setMessages(d); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); const iv = setInterval(load, 4000); return () => clearInterval(iv); }, [app.id]);
  useEffect(() => {
    const isFirst = prevCountRef.current === 0 && messages.length > 0;
    if (isFirst || (messages.length > prevCountRef.current && isNearBottom())) scrollToBottom();
    prevCountRef.current = messages.length;
  }, [messages]);

  const send = async () => {
    const t = text.trim(); if (!t || sending) return;
    setSending(true); setError("");
    try {
      const res = await fetch(`/api/messages/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senderRole: "candidate", senderName: user.fullName, content: t }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(e.error ?? "Send failed."); return; }
      const newMsg: Message = await res.json();
      setMessages(prev => [...prev, newMsg]); setText("");
    } catch { setError("Network error. Please try again."); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="space-y-3 py-2">
      {[1,2,3].map(i => <div key={i} className={`flex gap-2 ${i%2===0?"flex-row-reverse":""}`}>
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>)}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-0 pb-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Inbox className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No messages yet</p>
            <p className="text-xs text-gray-300 mt-0.5">HR will reach out once they review your profile.</p>
          </div>
        ) : messages.map(m => {
          const mine = m.senderRole === "candidate";
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white
                ${mine ? "bg-[#f5a623]" : "bg-[#0f2c6b]"}`}>
                {mine ? <User className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[76%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
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
      </div>
      <div className="pt-3 border-t border-gray-100 shrink-0">
        {error && <p className="text-xs text-red-500 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder="Type a message… (Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-[#0f2c6b]/25 focus:border-[#0f2c6b]
              placeholder:text-gray-300 transition-all"
          />
          <button onClick={send} disabled={!text.trim()||sending}
            className="w-9 h-9 rounded-xl bg-[#0f2c6b] text-white flex items-center justify-center
              hover:bg-[#0f2c6b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Applications ───────────────────────────────────────────────────────
function ApplicationsTab({ applications, setLocation }: { applications: Application[]; setLocation: any }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const token = localStorage.getItem("bluestar_token")!;
  const { data: user } = useGetCurrentUser({ query: { enabled: true, queryKey: getGetCurrentUserQueryKey(), retry: false } });

  if (applications.length === 0) return (
    <div className="flex flex-col items-center text-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-[#0f2c6b]/8 flex items-center justify-center">
        <Briefcase className="w-7 h-7 text-[#0f2c6b]/25" />
      </div>
      <div>
        <p className="font-semibold text-gray-700">No applications yet</p>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">Submit your first application and track every step of the process right here.</p>
      </div>
      <Button onClick={() => setLocation("/apply")} className="bg-[#0f2c6b] hover:bg-[#0f2c6b]/90 mt-2">
        Apply for a Position
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {applications.map(app => (
        <div key={app.id} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Card header */}
          <div className="bg-gradient-to-r from-[#0f2c6b] to-[#1a3f8f] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#f5a623] shrink-0" />
                  <h3 className="font-semibold text-white text-sm truncate">{app.position}</h3>
                </div>
                <p className="text-blue-300 text-xs mt-1">
                  {app.country} · Applied {fmt(app.submittedAt)}
                </p>
              </div>
              <StatusPill status={app.status} />
            </div>
          </div>
          {/* Stepper + chat toggle */}
          <div className="bg-white px-5 py-4 space-y-4">
            <StatusStepper status={app.status} />
            <button
              onClick={() => setOpenId(openId === app.id ? null : app.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl
                bg-gray-50 hover:bg-[#0f2c6b]/5 border border-gray-200 transition-colors text-sm font-medium text-gray-700"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0f2c6b]" />
                Messages with HR
              </span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openId === app.id ? "rotate-90" : ""}`} />
            </button>
            {openId === app.id && (
              <div className="h-72 flex flex-col">
                <ChatThread app={app} user={user} token={token} />
              </div>
            )}
          </div>
        </div>
      ))}
      <button onClick={() => setLocation("/apply")}
        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400
          hover:border-[#0f2c6b]/30 hover:text-[#0f2c6b] transition-colors font-medium">
        + Apply for another role
      </button>
    </div>
  );
}

// ─── Direct HR Chat (not application-scoped) ─────────────────────────────────
function DirectHRThread({ token, user }: { token: string; user: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef    = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const myEmail = user?.email ?? "";

  const isNearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };
  const scrollToBottom = () => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };

  const load = () =>
    fetch("/api/direct-messages", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((d: any[]) => { setMessages(d); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); const iv = setInterval(load, 4000); return () => clearInterval(iv); }, []);
  useEffect(() => {
    const isFirst = prevCountRef.current === 0 && messages.length > 0;
    if (isFirst || (messages.length > prevCountRef.current && isNearBottom())) scrollToBottom();
    prevCountRef.current = messages.length;
  }, [messages]);

  const send = async () => {
    const t = text.trim(); if (!t || sending) return;
    setSending(true); setError("");
    try {
      const res = await fetch(`/api/direct-messages/${encodeURIComponent(myEmail)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senderRole: "user", senderName: user?.fullName ?? "Applicant", content: t }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setError(e.error ?? "Send failed."); return; }
      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]); setText("");
    } catch { setError("Network error. Please try again."); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="space-y-3 py-2">
      {[1,2,3].map(i => <div key={i} className={`flex gap-2 ${i%2===0?"flex-row-reverse":""}`}>
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>)}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-0 pb-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Inbox className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No direct messages yet</p>
            <p className="text-xs text-gray-300 mt-0.5">HR will message you here directly. You can also reach out below.</p>
          </div>
        ) : messages.map((m: any) => {
          const mine = m.senderRole === "user";
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${mine ? "bg-[#f5a623]" : "bg-[#0f2c6b]"}`}>
                {mine ? <User className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[76%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${mine ? "bg-[#0f2c6b] text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{mine ? "You" : m.senderName} · {fmtTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-3 border-t border-gray-100 shrink-0">
        {error && <p className="text-xs text-red-500 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder="Type a message to HR… (Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2c6b]/25 focus:border-[#0f2c6b] placeholder:text-gray-300 transition-all"
          />
          <button onClick={send} disabled={!text.trim()||sending}
            className="w-9 h-9 rounded-xl bg-[#0f2c6b] text-white flex items-center justify-center hover:bg-[#0f2c6b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Messages ───────────────────────────────────────────────────────────
type MsgSelected = "direct" | number; // "direct" = HR DM thread, number = applicationId

function MessagesTab({ applications, token, user }: { applications: Application[]; token: string; user: any }) {
  const [selected, setSelected] = useState<MsgSelected>("direct");

  const selectedApp = typeof selected === "number" ? applications.find(a => a.id === selected) ?? null : null;

  return (
    <div className="flex gap-0 rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[460px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col overflow-y-auto">
        {/* HR Direct Chat */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 py-3">HR Direct</p>
        <button
          onClick={() => setSelected("direct")}
          className={`text-left px-4 py-3 border-b border-gray-100 transition-colors ${selected === "direct" ? "bg-[#0f2c6b] text-white" : "hover:bg-gray-100 text-gray-700"}`}
        >
          <div className="flex items-center gap-2">
            <Shield className={`w-3.5 h-3.5 shrink-0 ${selected === "direct" ? "text-[#f5a623]" : "text-[#0f2c6b]"}`} />
            <p className={`text-xs font-semibold truncate ${selected === "direct" ? "text-white" : "text-gray-800"}`}>Bluestar HR</p>
          </div>
          <p className={`text-[10px] mt-0.5 ${selected === "direct" ? "text-blue-200" : "text-gray-400"}`}>Direct messages</p>
        </button>

        {/* Application threads */}
        {applications.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 py-3">Applications</p>
            {applications.map(app => (
              <button
                key={app.id}
                onClick={() => setSelected(app.id)}
                className={`text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${selected === app.id ? "bg-[#0f2c6b] text-white" : "hover:bg-gray-100 text-gray-700"}`}
              >
                <p className={`text-xs font-semibold truncate ${selected === app.id ? "text-white" : "text-gray-800"}`}>{app.position}</p>
                <p className={`text-[10px] mt-0.5 ${selected === app.id ? "text-blue-200" : "text-gray-400"}`}>{app.country}</p>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Thread area */}
      <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
        {selected === "direct" ? (
          <>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 shrink-0">
              <Shield className="w-4 h-4 text-[#0f2c6b]" />
              <span className="text-sm font-semibold text-gray-800">Bluestar Alliance HR</span>
              <span className="text-xs text-gray-400 ml-auto">Direct channel</span>
            </div>
            <div className="flex-1 min-h-0">
              <DirectHRThread token={token} user={user} />
            </div>
          </>
        ) : selectedApp ? (
          <>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 shrink-0">
              <Briefcase className="w-4 h-4 text-[#0f2c6b]" />
              <span className="text-sm font-semibold text-gray-800 truncate">{selectedApp.position}</span>
              <StatusPill status={selectedApp.status} />
            </div>
            <div className="flex-1 min-h-0">
              <ChatThread app={selectedApp} user={user} token={token} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Notifications ──────────────────────────────────────────────────────
function NotificationsTab({ token, onNavigate }: { token: string; onNavigate: (tab: TabId) => void }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((d: Notification[]) => { setNotifs([...d].reverse()); setLoading(false); })
      .catch(() => setLoading(false));

  const markAllRead = () => {
    fetch("/api/notifications/read-all", {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    }).then(() => setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))).catch(() => {});
  };

  // Mark a single notification as read and navigate to the relevant tab
  const handleClick = (n: Notification) => {
    if (!n.isRead) {
      fetch(`/api/notifications/${n.id}/read`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      })
        .then(() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)))
        .catch(() => {});
    }
    // Route to the tab that matches the notification type
    if (n.type === "message") onNavigate("messages");
    else if (n.type === "status") onNavigate("applications");
    else if (n.type === "payment") onNavigate("orders");
  };

  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  const typeIcon = (type: string) => {
    if (type === "message") return <MessageSquare className="w-4 h-4 text-[#0f2c6b]" />;
    if (type === "payment") return <Package className="w-4 h-4 text-amber-500" />;
    return <Bell className="w-4 h-4 text-gray-400" />;
  };

  const destinationLabel = (n: Notification) => {
    if (n.type === "message")  return "Go to Messages →";
    if (n.type === "status")   return "Go to Applications →";
    if (n.type === "payment")  return "Go to Orders →";
    return null;
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{unread} unread</p>
          <button onClick={markAllRead} className="text-xs text-[#0f2c6b] font-semibold hover:underline">Mark all read</button>
        </div>
      )}
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 gap-3">
          <Bell className="w-10 h-10 text-gray-200" />
          <p className="font-semibold text-gray-600">No notifications yet</p>
          <p className="text-sm text-gray-400 max-w-xs">You'll be notified here about application updates and messages from HR.</p>
        </div>
      ) : notifs.map(n => (
        <button
          key={n.id}
          onClick={() => handleClick(n)}
          className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors hover:shadow-sm active:scale-[0.99]
            ${n.isRead ? "bg-white border-gray-200 hover:bg-gray-50" : "bg-[#0f2c6b]/4 border-[#0f2c6b]/15 hover:bg-[#0f2c6b]/8"}`}
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            {typeIcon(n.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-snug ${n.isRead ? "text-gray-600" : "text-gray-900 font-medium"}`}>
              {n.message}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-400">{fmtTime(n.createdAt)}</p>
              {destinationLabel(n) && (
                <span className="text-xs text-[#0f2c6b] font-medium">{destinationLabel(n)}</span>
              )}
            </div>
          </div>
          {!n.isRead && <Circle className="w-2 h-2 fill-[#0f2c6b] text-[#0f2c6b] shrink-0 mt-2" />}
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Orders ─────────────────────────────────────────────────────────────
function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/addon-orders/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((d: Order[]) => { setOrders([...d].reverse()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusPill = (s: string) => {
    const m: Record<string,string> = { pending:"bg-amber-100 text-amber-800", confirmed:"bg-green-100 text-green-800", cancelled:"bg-red-100 text-red-700" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m[s]??m.pending}`}>{s}</span>;
  };

  const addons = (o: Order) => [
    o.visaSponsorship && "Visa Sponsorship",
    o.flightTicket && "Flight Ticket",
    o.workPermit && "Work Permit",
  ].filter(Boolean) as string[];

  if (loading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 gap-3">
          <Package className="w-10 h-10 text-gray-200" />
          <p className="font-semibold text-gray-600">No add-on orders yet</p>
          <p className="text-sm text-gray-400 max-w-xs">If you selected Visa Sponsorship, Flight Ticket, or Work Permit, your orders will appear here.</p>
        </div>
      ) : orders.map(o => (
        <div key={o.id} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#0f2c6b]" />
              <span className="text-sm font-semibold text-gray-800">Add-on Order #{o.id}</span>
            </div>
            {statusPill(o.status)}
          </div>
          <div className="px-5 py-4 space-y-2.5">
            <div className="flex flex-wrap gap-2">
              {addons(o).map(a => (
                <span key={a} className="px-3 py-1 rounded-full bg-[#0f2c6b]/8 text-[#0f2c6b] text-xs font-medium">{a}</span>
              ))}
              {addons(o).length === 0 && <span className="text-xs text-gray-400">No specific add-ons</span>}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Submitted {fmt(o.createdAt)}</span>
              <span className="capitalize">{o.paymentMethod.replace("_"," ")}</span>
            </div>
            {o.notes && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{o.notes}</p>
            )}
            <div className="pt-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              Our HR team will be in touch about the next steps for your selected services.
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Account ────────────────────────────────────────────────────────────
function AccountTab({ user, setLocation }: { user: any; setLocation: any }) {
  const handleLogout = () => {
    localStorage.removeItem("bluestar_token");
    setLocation("/");
    window.location.reload();
  };
  return (
    <div className="space-y-4 max-w-lg">
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-[#0f2c6b] to-[#1a3f8f] px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[#f5a623]">{user?.fullName?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-bold text-white text-lg">{user?.fullName}</p>
            <p className="text-blue-200 text-xs mt-0.5">Applicant Account</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { Icon: Mail, label: "Email", value: user?.email },
            { Icon: Calendar, label: "Member since", value: user?.createdAt ? fmt(user.createdAt) : "—" },
            { Icon: Globe, label: "Portal access", value: "Full applicant portal" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3.5">
              <Icon className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Quick links</p>
        {[
          { label: "Apply for a new position", href: "/apply" },
          { label: "Browse open jobs", href: "/jobs" },
          { label: "Contact our HR team", href: "/contact" },
        ].map(({ label, href }) => (
          <button key={href} onClick={() => setLocation(href)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl
              bg-gray-50 hover:bg-[#0f2c6b]/5 border border-gray-200 transition-colors text-sm text-gray-700 font-medium">
            {label}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>

      <button onClick={handleLogout}
        className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium
          hover:bg-red-50 transition-colors">
        Sign out
      </button>
    </div>
  );
}

// ─── Tab definitions ─────────────────────────────────────────────────────────
type TabId = "applications" | "messages" | "notifications" | "orders" | "account";

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: "applications",  label: "Applications",  Icon: LayoutDashboard },
  { id: "messages",      label: "Messages",       Icon: MessageSquare },
  { id: "notifications", label: "Notifications",  Icon: Bell },
  { id: "orders",        label: "Orders",         Icon: Package },
  { id: "account",       label: "Account",        Icon: UserCircle },
];

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("bluestar_token");
  const [activeTab, setActiveTab] = useState<TabId>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  const { data: user, isLoading: userLoading } = useGetCurrentUser({
    query: { enabled: !!token, queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  // Load applications
  useEffect(() => {
    if (!user || !token) return;
    fetch("/api/applications/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((d: Application[]) => { setApplications(d); setAppsLoading(false); })
      .catch(() => setAppsLoading(false));
  }, [user, token]);

  // Badge counts — notifications + direct messages
  useEffect(() => {
    if (!token || !user) return;
    const poll = () => {
      fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((d: Notification[]) => setUnreadNotifs(d.filter(n => !n.isRead).length))
        .catch(() => {});
      fetch("/api/direct-messages", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((d: any[]) => setUnreadMsgs(d.filter((m: any) => !m.isRead && m.senderRole === "admin").length))
        .catch(() => {});
    };
    poll(); const iv = setInterval(poll, 10000); return () => clearInterval(iv);
  }, [user, token]);

  // Not logged in
  if (!token && !userLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-16 h-16 rounded-full bg-[#0f2c6b]/10 flex items-center justify-center">
        <LogIn className="w-8 h-8 text-[#0f2c6b]" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Sign in to view your portal</h2>
        <p className="text-gray-500 text-sm mt-1">Track your applications and chat with HR from your personal dashboard.</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => setLocation("/login?redirect=/dashboard")} className="bg-[#0f2c6b] hover:bg-[#0f2c6b]/90">Log In</Button>
        <Button variant="outline" onClick={() => setLocation("/register?redirect=/dashboard")}>Create Account</Button>
      </div>
    </div>
  );

  if (userLoading || appsLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  const activeApps = applications.filter(a => !["approved","rejected"].includes(a.status)).length;

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#0f2c6b] via-[#0f2c6b] to-[#1e4ba8]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/12 border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-[#f5a623]">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-blue-300 text-xs font-medium">Applicant Portal</p>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate">
                Welcome back, {user?.fullName?.split(" ")[0]}
              </h1>
              <p className="text-blue-300 text-xs mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>
          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { v: applications.length, l: "Applications" },
              { v: activeApps,          l: "In Progress" },
              { v: applications.filter(a => a.status==="approved").length, l: "Approved" },
            ].map(({ v, l }) => (
              <div key={l} className="bg-white/10 rounded-xl py-3 text-center border border-white/10">
                <div className="text-xl font-bold text-[#f5a623]">{v}</div>
                <div className="text-blue-200 text-[10px] mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[80px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 md:px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max sm:min-w-0">
            {TABS.map(({ id, label, Icon }) => {
              const badge = id === "notifications" ? unreadNotifs : id === "messages" ? unreadMsgs : 0;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-1.5 px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2
                    ${activeTab === id
                      ? "border-[#0f2c6b] text-[#0f2c6b]"
                      : "border-transparent text-gray-500 hover:text-gray-800"}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  {badge > 0 && (
                    <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {activeTab === "applications" && (
          <ApplicationsTab applications={applications} setLocation={setLocation} />
        )}
        {activeTab === "messages" && (
          <MessagesTab applications={applications} token={token!} user={user} />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab token={token!} onNavigate={setActiveTab} />
        )}
        {activeTab === "orders" && (
          <OrdersTab token={token!} />
        )}
        {activeTab === "account" && (
          <AccountTab user={user} setLocation={setLocation} />
        )}

        {/* Help note — shown on applications tab only */}
        {activeTab === "applications" && (
          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex gap-3 items-start">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Typical processing time</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Our team reviews applications within 3–7 business days. You'll be notified here and by email at every stage.
                For urgent enquiries, visit our{" "}
                <button onClick={() => setLocation("/contact")} className="underline font-medium">contact page</button>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
