import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, X, Shield, ShieldCheck, Pencil, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const ALL_PERMISSIONS: { id: string; label: string }[] = [
  { id: "overview",      label: "Overview / Dashboard" },
  { id: "applications",  label: "Applications" },
  { id: "jobs",          label: "Job Listings" },
  { id: "testimonials",  label: "Testimonials" },
  { id: "chat",          label: "Chat" },
  { id: "email",         label: "Send Email" },
  { id: "newsletter",    label: "Newsletter" },
  { id: "payment",       label: "Payment Settings" },
  { id: "orders",        label: "Add-on Orders" },
  { id: "users",         label: "Users Database" },
];

interface AdminRecord {
  id: number;
  email: string;
  fullName: string;
  role: string;
  permissions: string[] | null;
  isDisabled: boolean;
  createdAt: string;
}

interface TeamTabProps {
  token: string | null;
}

export default function TeamTab({ token }: TeamTabProps) {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editDisabled, setEditDisabled] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", password: "" });
  const [createPerms, setCreatePerms] = useState<string[]>(ALL_PERMISSIONS.map(p => p.id));
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    loadAdmins();
  }, [token]);

  const loadAdmins = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/admin/team", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setAdmins)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const startEdit = (admin: AdminRecord) => {
    setEditingId(admin.id);
    setEditPerms(admin.permissions ?? ALL_PERMISSIONS.map(p => p.id));
    setEditDisabled(admin.isDisabled);
    setResult(null);
  };

  const togglePerm = (id: string) => {
    setEditPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = async (adminId: number) => {
    setSavingId(adminId);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/team/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions: editPerms, isDisabled: editDisabled }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAdmins(prev => prev.map(a => a.id === adminId ? updated : a));
        setEditingId(null);
        setResult({ ok: true, msg: "Permissions updated." });
        setTimeout(() => setResult(null), 3000);
      } else {
        const err = await res.json();
        setResult({ ok: false, msg: err.error ?? "Update failed." });
      }
    } catch {
      setResult({ ok: false, msg: "Network error." });
    }
    setSavingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Remove admin "${name}"? They will become a regular user.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadAdmins();
      else alert("Failed to remove admin.");
    } catch {}
    setDeletingId(null);
  };

  const handleCreate = async () => {
    if (!createForm.fullName || !createForm.email || !createForm.password) return;
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...createForm, permissions: createPerms }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(prev => [...prev, data]);
        setCreateForm({ fullName: "", email: "", password: "" });
        setCreatePerms(ALL_PERMISSIONS.map(p => p.id));
        setCreateResult({ ok: true, msg: `Admin "${data.fullName}" created.` });
        setTimeout(() => { setCreateOpen(false); setCreateResult(null); }, 1500);
      } else {
        setCreateResult({ ok: false, msg: data.error ?? "Creation failed." });
      }
    } catch {
      setCreateResult({ ok: false, msg: "Network error." });
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">Admin Team</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage admin accounts and control their access permissions.</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setCreateResult(null); }} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Admin
        </Button>
      </div>

      {result && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded text-sm ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {result.msg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : admins.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No admins yet. Click "Add Admin" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {admins.map(admin => (
            <Card key={admin.id} className={admin.isDisabled ? "opacity-60 border-dashed" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      {admin.role === "superadmin"
                        ? <ShieldCheck className="w-4 h-4 text-primary" />
                        : <Shield className="w-4 h-4 text-primary" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{admin.fullName}</span>
                        <Badge variant={admin.role === "superadmin" ? "default" : "secondary"} className="text-xs capitalize">{admin.role}</Badge>
                        {admin.isDisabled && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{admin.email} · Added {format(new Date(admin.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  {admin.role !== "superadmin" && (
                    <div className="flex gap-2 flex-shrink-0">
                      {editingId === admin.id ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleSave(admin.id)} disabled={savingId === admin.id}>
                            {savingId === admin.id ? "Saving…" : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startEdit(admin)}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0 text-destructive hover:bg-destructive/5"
                            onClick={() => handleDelete(admin.id, admin.fullName)}
                            disabled={deletingId === admin.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Permissions */}
                {admin.role !== "superadmin" && (
                  editingId === admin.id ? (
                    <div className="border border-border rounded-md p-4 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Access Permissions</p>
                        <div className="flex gap-2 text-xs">
                          <button className="text-primary hover:underline" onClick={() => setEditPerms(ALL_PERMISSIONS.map(p => p.id))}>All</button>
                          <span className="text-muted-foreground">·</span>
                          <button className="text-primary hover:underline" onClick={() => setEditPerms([])}>None</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ALL_PERMISSIONS.map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={editPerms.includes(perm.id)}
                              onChange={() => togglePerm(perm.id)}
                              className="w-3.5 h-3.5 accent-primary"
                            />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                      <div className="border-t border-border pt-3 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`disable-${admin.id}`}
                          checked={editDisabled}
                          onChange={e => setEditDisabled(e.target.checked)}
                          className="w-3.5 h-3.5 accent-red-500"
                        />
                        <label htmlFor={`disable-${admin.id}`} className="text-sm cursor-pointer text-red-600 font-medium">
                          Disable this admin account
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(admin.permissions ?? ALL_PERMISSIONS.map(p => p.id)).map(pid => {
                        const label = ALL_PERMISSIONS.find(p => p.id === pid)?.label ?? pid;
                        return <Badge key={pid} variant="secondary" className="text-xs font-normal">{label}</Badge>;
                      })}
                    </div>
                  )
                )}

                {admin.role === "superadmin" && (
                  <p className="text-xs text-muted-foreground italic">Super admins have full access and cannot be restricted.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Admin Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Create Admin Account
              </h2>
              <button onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: "fullName", label: "Full Name", placeholder: "e.g. Jane Smith", type: "text" },
                { key: "email", label: "Email", placeholder: "jane@bluestaralliance.com", type: "email" },
                { key: "password", label: "Initial Password", placeholder: "At least 8 characters", type: "password" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <Label className="mb-2 block">{label}</Label>
                  <Input
                    type={type}
                    value={createForm[key as keyof typeof createForm]}
                    onChange={e => setCreateForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Access Permissions</Label>
                  <div className="flex gap-2 text-xs">
                    <button className="text-primary hover:underline" onClick={() => setCreatePerms(ALL_PERMISSIONS.map(p => p.id))}>All</button>
                    <span className="text-muted-foreground">·</span>
                    <button className="text-primary hover:underline" onClick={() => setCreatePerms([])}>None</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-md bg-muted/20">
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={createPerms.includes(perm.id)}
                        onChange={() => setCreatePerms(prev => prev.includes(perm.id) ? prev.filter(p => p !== perm.id) : [...prev, perm.id])}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              {createResult && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${createResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {createResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {createResult.msg}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 pb-5">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !createForm.fullName || !createForm.email || createForm.password.length < 8}
                className="bg-primary hover:bg-primary/90"
              >
                {creating ? "Creating…" : "Create Admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
