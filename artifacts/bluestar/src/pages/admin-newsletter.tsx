import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Trash2, Plus, Send, Loader2, Users, Mail } from "lucide-react";
import { format } from "date-fns";

interface NewsletterTabProps {
  token: string | null;
}

export default function NewsletterTab({ token }: NewsletterTabProps) {
  const [configStatus, setConfigStatus] = useState<{ listmonk: boolean; smtp: boolean; mode: string } | null>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addingSubscriber, setAddingSubscriber] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/newsletter/config-status", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setConfigStatus)
      .catch(() => {});

    loadSubscribers();
  }, [token]);

  const loadSubscribers = () => {
    if (!token) return;
    setLoadingSubs(true);
    fetch("/api/newsletter/subscribers", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setSubscribers)
      .catch(() => {})
      .finally(() => setLoadingSubs(false));
  };

  const handleAddSubscriber = async () => {
    if (!newEmail) return;
    setAddingSubscriber(true);
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail, fullName: newName || undefined }),
      });
      if (res.ok) {
        const sub = await res.json();
        setSubscribers(prev => {
          const exists = prev.find(s => s.id === sub.id);
          return exists ? prev.map(s => s.id === sub.id ? sub : s) : [...prev, sub];
        });
        setNewEmail(""); setNewName("");
      }
    } catch {}
    setAddingSubscriber(false);
  };

  const handleRemoveSubscriber = async (id: number) => {
    if (!window.confirm("Remove this subscriber?")) return;
    await fetch(`/api/newsletter/subscribers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSubscribers(prev => prev.filter(s => s.id !== id));
  };

  const handleSend = async () => {
    if (!subject || !body) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, body, isHtml }),
      });
      const data = await res.json();
      if (res.ok) {
        const detail = data.mode === "listmonk"
          ? `Listmonk campaign #${data.campaignId} dispatched`
          : `Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"} via SMTP`;
        setSendResult({ ok: true, message: detail });
        setSubject(""); setBody("");
      } else {
        setSendResult({ ok: false, message: data.error ?? "Send failed" });
      }
    } catch {
      setSendResult({ ok: false, message: "Network error" });
    }
    setSending(false);
  };

  const activeCount = subscribers.filter(s => s.status === "active").length;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-serif text-2xl font-bold text-primary mb-1">Newsletter</h2>
        <p className="text-muted-foreground">Manage subscribers and send campaigns to your mailing list.</p>
      </div>

      {/* Mode badge */}
      {configStatus && (
        <div className="flex flex-wrap gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${configStatus.mode === "listmonk" ? "bg-blue-50 text-blue-700 border-blue-200" : configStatus.mode === "smtp" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <Mail className="w-3 h-3" />
            {configStatus.mode === "listmonk" ? "Listmonk (full campaign engine)" : configStatus.mode === "smtp" ? "SMTP (BCC send)" : "No delivery configured"}
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-muted/40 border-border`}>
            <Users className="w-3 h-3" />
            {activeCount} active subscriber{activeCount === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* Add subscriber */}
      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base">Subscribers</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name (optional)" className="sm:w-44" />
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" type="email" className="flex-1" />
            <Button onClick={handleAddSubscriber} disabled={!newEmail || addingSubscriber} className="bg-primary hover:bg-primary/90 shrink-0">
              {addingSubscriber ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
            </Button>
          </div>

          {loadingSubs ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subscribers yet.</p>
          ) : (
            <div className="divide-y divide-border max-h-64 overflow-y-auto rounded-md border">
              {subscribers.map(sub => (
                <div key={sub.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{sub.fullName ?? sub.email}</p>
                    {sub.fullName && <p className="text-xs text-muted-foreground">{sub.email}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={sub.status === "active" ? "default" : "secondary"} className="text-xs">
                      {sub.status}
                    </Badge>
                    <button onClick={() => handleRemoveSubscriber(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose */}
      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base">Compose Campaign</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label className="mb-2 block">Subject *</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Monthly newsletter — July 2026" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Body *</Label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={isHtml} onChange={e => setIsHtml(e.target.checked)} className="w-3.5 h-3.5" />
                HTML mode
              </label>
            </div>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your newsletter content here…" className="min-h-[180px] font-mono text-sm" />
          </div>

          {sendResult && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${sendResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {sendResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {sendResult.message}
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sending || !subject || !body || configStatus?.mode === "none"}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : <><Send className="w-4 h-4 mr-2" /> Send Campaign</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
