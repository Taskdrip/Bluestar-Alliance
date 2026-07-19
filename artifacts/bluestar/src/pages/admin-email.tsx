import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, Mail, Send, Loader2 } from "lucide-react";

interface EmailTabProps {
  token: string | null;
  applications: any[];
}

export default function EmailTab({ token, applications }: EmailTabProps) {
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; from: string } | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/email/config-status", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(setConfigStatus)
      .catch(() => {});
  }, [token]);

  const handleSend = async () => {
    if (!to || !subject || !body) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, subject, body, isHtml }),
      });
      if (res.ok) {
        setResult({ ok: true, message: `Email sent to ${to}` });
        setTo(""); setSubject(""); setBody("");
      } else {
        const err = await res.json();
        setResult({ ok: false, message: err.error ?? "Failed to send email" });
      }
    } catch {
      setResult({ ok: false, message: "Network error — please try again" });
    }
    setSending(false);
  };

  // Unique applicant emails
  const applicantEmails = Array.from(new Set(applications.map(a => ({ email: a.email, name: a.fullName }))));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-primary mb-1">Send Email</h2>
        <p className="text-muted-foreground">Compose and send a custom email directly to any applicant.</p>
      </div>

      {/* Config status banner */}
      {configStatus !== null && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${configStatus.configured ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          {configStatus.configured
            ? <><CheckCircle className="w-4 h-4" /> Sending from <strong>{configStatus.from}</strong></>
            : <><AlertCircle className="w-4 h-4" /> SMTP not configured — add <code className="font-mono text-xs bg-amber-100 px-1 rounded">SMTP_HOST</code>, <code className="font-mono text-xs bg-amber-100 px-1 rounded">SMTP_USER</code>, <code className="font-mono text-xs bg-amber-100 px-1 rounded">SMTP_PASS</code> in Replit Secrets</>
          }
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <Label className="mb-2 block">To *</Label>
            <div className="flex gap-2">
              <Input
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
                className="flex-1"
              />
              {applicantEmails.length > 0 && (
                <Select onValueChange={val => setTo(val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pick applicant" />
                  </SelectTrigger>
                  <SelectContent>
                    {applicantEmails.map(a => (
                      <SelectItem key={a.email} value={a.email}>
                        {a.name} ({a.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Subject *</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Your application with Bluestar Alliance"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Message *</Label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHtml}
                  onChange={e => setIsHtml(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                HTML mode
              </label>
            </div>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={isHtml ? "<p>Dear applicant,</p>\n<p>...</p>" : "Dear applicant,\n\n..."}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {result && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body || !configStatus?.configured}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : <><Send className="w-4 h-4 mr-2" /> Send Email</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
