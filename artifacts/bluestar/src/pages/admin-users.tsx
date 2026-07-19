import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2, Eye, X, KeyRound, ChevronDown, ChevronUp,
  User, FileText, Phone, Mail, MapPin, Briefcase, Calendar, Search
} from "lucide-react";
import { format } from "date-fns";

interface UsersTabProps {
  token: string | null;
}

interface UserRecord {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isDisabled: boolean;
  createdAt: string;
  applications: ApplicationRecord[];
}

interface ApplicationRecord {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  position: string;
  yearsOfExperience: number;
  coverLetter?: string;
  cvFileName?: string;
  status: string;
  submittedAt: string;
}

export default function UsersTab({ token }: UsersTabProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [resetModal, setResetModal] = useState<{ userId: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetDoing, setResetDoing] = useState(false);
  const [resetResult, setResetResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This will also delete all their applications. This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        if (expandedUser === id) setExpandedUser(null);
      } else {
        alert("Failed to delete user.");
      }
    } catch {}
    setDeletingId(null);
  };

  const handleResetPassword = async () => {
    if (!resetModal || !newPassword.trim()) return;
    setResetDoing(true);
    setResetResult(null);
    try {
      const res = await fetch(`/api/admin/users/${resetModal.userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      if (res.ok) {
        setResetResult({ ok: true, msg: "Password reset successfully." });
        setNewPassword("");
        setTimeout(() => { setResetModal(null); setResetResult(null); }, 1500);
      } else {
        const err = await res.json();
        setResetResult({ ok: false, msg: err.error ?? "Reset failed." });
      }
    } catch {
      setResetResult({ ok: false, msg: "Network error." });
    }
    setResetDoing(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-yellow-500";
    }
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">Users & Applicants</h2>
          <p className="text-muted-foreground text-sm mt-1">All registered users and their application records</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 w-[260px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>{search ? "No users match your search." : "No users registered yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <Card key={user.id} className="border-border overflow-hidden">
              {/* User row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{user.fullName}</span>
                    <Badge variant={user.role === "superadmin" ? "default" : user.role === "admin" ? "secondary" : "outline"} className="text-xs capitalize">
                      {user.role}
                    </Badge>
                    {user.isDisabled && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {format(new Date(user.createdAt), "MMM d, yyyy")} · {user.applications.length} application{user.applications.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1.5"
                    onClick={() => { setResetModal({ userId: user.id, name: user.fullName }); setNewPassword(""); setResetResult(null); }}
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Reset PW
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1.5"
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {expandedUser === user.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/5"
                    onClick={() => handleDelete(user.id, user.fullName)}
                    disabled={deletingId === user.id || user.role === "superadmin"}
                    title={user.role === "superadmin" ? "Cannot delete super admin" : "Delete user"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded: full details + applications */}
              {expandedUser === user.id && (
                <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-4">
                  {/* User detail grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Registered {format(new Date(user.createdAt), "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="capitalize">Role: {user.role}</span>
                    </div>
                  </div>

                  {/* Applications */}
                  {user.applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No applications submitted.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Applications ({user.applications.length})</p>
                      {user.applications.map(app => (
                        <div key={app.id} className="bg-background border border-border rounded-md overflow-hidden">
                          <button
                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor(app.status)}`} />
                              <span className="font-medium text-sm">{app.position}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(app.submittedAt), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusColor(app.status)} text-white text-xs`}>{app.status}</Badge>
                              {expandedApp === app.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            </div>
                          </button>
                          {expandedApp === app.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-border space-y-3 text-sm">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{app.phone}</div>
                                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{app.country}</div>
                                <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" />{app.yearsOfExperience} years experience</div>
                                {app.cvFileName && (
                                  <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" />CV: {app.cvFileName}</div>
                                )}
                              </div>
                              {app.coverLetter && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cover Letter</p>
                                  <p className="text-sm text-foreground bg-muted/30 rounded p-3 leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Reset Password
              </h2>
              <button onClick={() => setResetModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Set a new password for <strong>{resetModal.name}</strong>.
              </p>
              <div>
                <Label className="mb-2 block">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  onKeyDown={e => e.key === "Enter" && handleResetPassword()}
                />
              </div>
              {resetResult && (
                <div className={`text-sm px-3 py-2 rounded ${resetResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {resetResult.msg}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <Button variant="outline" onClick={() => setResetModal(null)}>Cancel</Button>
              <Button
                onClick={handleResetPassword}
                disabled={resetDoing || !newPassword.trim() || newPassword.trim().length < 8}
                className="bg-primary hover:bg-primary/90"
              >
                {resetDoing ? "Resetting…" : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
