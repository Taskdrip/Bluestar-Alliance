import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, Search, MessageSquare, Briefcase,
  ChevronRight, Send, User, Shield, AlertCircle, FileText,
  LogIn, RefreshCw, Inbox
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

// ─── Status pipeline ───────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "pending",     label: "Submitted",       icon: FileText },
  { key: "reviewing",   label: "Under Review",     icon: Search },
  { key: "shortlisted", label: "Shortlisted",      icon: CheckCircle2 },
  { key: "interview",   label: "Interview",        icon: MessageSquare },
  { key: "approved",    label: "Approved",         icon: CheckCircle2 },
];

const STATUS_ORDER = ["pending", "reviewing", "shortlisted", "interview", "approved", "rejected"];

function getStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending:     { label: "Submitted",     className: "bg-blue-100 text-blue-800 border-blue-200" },
    reviewing:   { label: "Under Review",  className: "bg-amber-100 text-amber-800 border-amber-200" },
    shortlisted: { label: "Shortlisted",   className: "bg-purple-100 text-purple-800 border-purple-200" },
    interview:   { label: "Interview",     className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    approved:    { label: "Approved ✓",    className: "bg-green-100 text-green-800 border-green-200" },
    rejected:    { label: "Not Proceeding",className: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.className}`}>
      {s.label}
    </span>
  );
}

// ─── Status Stepper ────────────────────────────────────────────────────────
function StatusStepper({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const currentIdx = getStepIndex(status);

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">Application not proceeding</p>
          <p className="text-xs text-red-600 mt-0.5">Thank you for your interest. Please contact HR if you have questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 hidden sm:block" style={{ zIndex: 0 }} />
      <div
        className="absolute top-5 left-5 h-0.5 bg-[#0f2c6b] hidden sm:block transition-all duration-500"
        style={{
          zIndex: 1,
          width: currentIdx === 0
            ? "0%"
            : `calc(${(currentIdx / (STATUS_STEPS.length - 1)) * 100}% - 0px)`,
        }}
      />

      <div className="flex justify-between relative" style={{ zIndex: 2 }}>
        {STATUS_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${done   ? "bg-[#0f2c6b] border-[#0f2c6b] text-white"
                  : active ? "bg-white border-[#0f2c6b] text-[#0f2c6b] shadow-md ring-4 ring-[#0f2c6b]/10"
                           : "bg-white border-gray-200 text-gray-300"}`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs text-center leading-tight hidden sm:block
                ${active ? "font-semibold text-[#0f2c6b]" : done ? "text-gray-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: current step label */}
      <div className="sm:hidden mt-3 text-center">
        <span className="text-sm font-semibold text-[#0f2c6b]">
          {STATUS_STEPS[Math.min(currentIdx, STATUS_STEPS.length - 1)]?.label}
        </span>
        <span className="text-xs text-gray-400 ml-2">· step {currentIdx + 1} of {STATUS_STEPS.length}</span>
      </div>
    </div>
  );
}

// ─── Chat Panel ────────────────────────────────────────────────────────────
function ChatPanel({ application, user, token }: { application: Application; user: any; token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    fetch(`/api/messages/${application.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: Message[]) => {
        setMessages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 8000);
    return () => clearInterval(iv);
  }, [application.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/${application.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderRole: "candidate",
          senderName: user.fullName,
          content: trimmed,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Failed to send message. Please try again.");
        return;
      }
      const newMsg: Message = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setText("");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-[#0f2c6b]/8 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-[#0f2c6b]/40" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">HR will reach out here once your application is reviewed.</p>
          </div>
        ) : messages.map(msg => {
          const isMe = msg.senderRole === "candidate";
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                ${isMe ? "bg-[#f5a623] text-white" : "bg-[#0f2c6b] text-white"}`}>
                {isMe ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              {/* Bubble */}
              <div className={`max-w-[78%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${isMe
                    ? "bg-[#0f2c6b] text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-gray-400">
                    {isMe ? "You" : msg.senderName}
                  </span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-gray-100 shrink-0">
        {error && (
          <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{error}
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your reply… (Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-[#0f2c6b]/30 focus:border-[#0f2c6b]
              placeholder:text-gray-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="self-end mb-0.5 w-10 h-10 rounded-xl bg-[#0f2c6b] text-white flex items-center justify-center
              hover:bg-[#0f2c6b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-right">Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ─── Application Card ──────────────────────────────────────────────────────
function ApplicationCard({ app, user, token }: { app: Application; user: any; token: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f2c6b] to-[#1a3f8f] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Briefcase className="w-4 h-4 text-[#f5a623] shrink-0" />
              <h3 className="font-semibold text-white text-base truncate">{app.position}</h3>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              Applied {new Date(app.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              &ensp;·&ensp;{app.country}
            </p>
          </div>
          <div className="shrink-0">{statusBadge(app.status)}</div>
        </div>
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Progress stepper */}
        <StatusStepper status={app.status} />

        {/* Chat toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl
            bg-gray-50 hover:bg-[#0f2c6b]/5 border border-gray-200 transition-colors text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0f2c6b]" />
            Messages with HR
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>

        {/* Chat panel */}
        {open && (
          <div className="h-72 flex flex-col">
            <ChatPanel application={app} user={user} token={token} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("bluestar_token");

  const { data: user, isLoading: userLoading } = useGetCurrentUser({
    query: {
      enabled: !!token,
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState("");

  useEffect(() => {
    if (!user || !token) return;
    fetch("/api/applications/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error("Failed to load applications");
        return r.json();
      })
      .then((data: Application[]) => {
        setApplications(data);
        setAppsLoading(false);
      })
      .catch(err => {
        setAppsError(err.message ?? "Could not load your applications.");
        setAppsLoading(false);
      });
  }, [user, token]);

  // Not logged in
  if (!token && !userLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-[#0f2c6b]/10 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-[#0f2c6b]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Sign in to view your portal</h2>
          <p className="text-gray-500 text-sm mt-1">Track your applications and chat with HR from your personal dashboard.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setLocation("/login?redirect=/dashboard")} className="bg-[#0f2c6b] hover:bg-[#0f2c6b]/90">
            Log In
          </Button>
          <Button variant="outline" onClick={() => setLocation("/register?redirect=/dashboard")}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#0f2c6b] via-[#0f2c6b] to-[#1e4ba8] text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-[#f5a623]">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium">Applicant Portal</p>
              <h1 className="text-2xl md:text-3xl font-bold mt-0.5">Welcome, {user?.fullName?.split(" ")[0]}</h1>
              <p className="text-blue-300 text-xs mt-1">{user?.email}</p>
            </div>
          </div>

          {/* Summary strip */}
          {!appsLoading && applications.length > 0 && (
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { label: "Applications", value: applications.length },
                { label: "Active", value: applications.filter(a => !["approved","rejected"].includes(a.status)).length },
                { label: "Approved", value: applications.filter(a => a.status === "approved").length },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                  <div className="text-2xl font-bold text-[#f5a623]">{s.value}</div>
                  <div className="text-blue-200 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">

        {appsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : appsError ? (
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-red-700">{appsError}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#0f2c6b]/8 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-[#0f2c6b]/30" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No applications yet</h3>
              <p className="text-gray-500 text-sm mt-2 max-w-xs">
                When you submit an application, you can track its status and chat with our HR team right here.
              </p>
              <Button
                className="mt-6 bg-[#0f2c6b] hover:bg-[#0f2c6b]/90"
                onClick={() => setLocation("/apply")}
              >
                Apply for a Position
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-gray-700">Your Applications</h2>
              <button
                onClick={() => setLocation("/apply")}
                className="text-xs text-[#0f2c6b] font-semibold hover:underline flex items-center gap-1"
              >
                + Apply for another role
              </button>
            </div>
            {applications.map(app => (
              <ApplicationCard key={app.id} app={app} user={user} token={token!} />
            ))}
          </>
        )}

        {/* Help note */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex gap-3 items-start">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Application processing time</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Our HR team typically reviews applications within 3–7 business days.
              You'll be notified here and by email at each stage. For urgent enquiries, please use our
              {" "}<button onClick={() => setLocation("/contact")} className="underline font-medium">contact page</button>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
