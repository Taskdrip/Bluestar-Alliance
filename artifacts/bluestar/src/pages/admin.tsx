import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  useGetStatsSummary,
  getGetStatsSummaryQueryKey,
  useGetApplicationsByRole,
  getGetApplicationsByRoleQueryKey,
  useListApplications,
  getListApplicationsQueryKey,
  useUpdateApplicationStatus,
  useListJobs,
  getListJobsQueryKey,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  AlertCircle, Briefcase, CheckCircle, Clock, FileText, Users,
  Plus, Pencil, Trash2, Send, MessageSquare, CreditCard, Settings,
  Package, Eye, X, Quote, Mail, Newspaper, Database, Shield, Megaphone,
  UploadCloud, ShieldAlert
} from "lucide-react";
import EmailTab from "./admin-email";
import NewsletterTab from "./admin-newsletter";
import UsersTab from "./admin-users";
import TeamTab from "./admin-team";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Tab = "overview" | "applications" | "jobs" | "chat" | "email" | "newsletter" | "payment" | "orders" | "testimonials" | "users" | "team" | "popup";

const ALL_TAB_IDS = ["overview","applications","jobs","testimonials","chat","email","newsletter","payment","orders","users","popup"] as const;

export default function Admin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Applications state
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Jobs state
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobForm, setJobForm] = useState({
    title: "", location: "", category: "", experienceLevel: "",
    description: "", salaryRange: "", isUrgent: false
  });

  // Chat state
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Payment settings state
  const [paymentForm, setPaymentForm] = useState({
    bankName: "", accountName: "", accountNumber: "",
    routingNumber: "", swiftCode: "", additionalInfo: ""
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  // Add-on orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Testimonials state
  const [testimonialsList, setTestimonialsList] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: "", role: "", country: "", quote: "", avatarUrl: "" });

  // Announcement popup state
  const [popupForm, setPopupForm] = useState({ title: "", body: "", imageUrl: "", isActive: true });
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupSaved, setPopupSaved] = useState(false);
  const [popupImageUploading, setPopupImageUploading] = useState(false);
  const [popupImageError, setPopupImageError] = useState<string | null>(null);
  const popupFileInputRef = useRef<HTMLInputElement>(null);

  // Notification badge
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser({
    query: {
      enabled: !!localStorage.getItem("bluestar_token"),
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useGetStatsSummary({
    query: { enabled: !!user && user.role === "admin", queryKey: getGetStatsSummaryQueryKey() }
  });

  const { data: roleCounts, isLoading: isLoadingRoles } = useGetApplicationsByRole({
    query: { enabled: !!user && user.role === "admin", queryKey: getGetApplicationsByRoleQueryKey() }
  });

  const { data: applications, isLoading: isLoadingApps } = useListApplications(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      role: roleFilter !== "all" ? roleFilter : undefined
    },
    {
      query: {
        enabled: !!user && user.role === "admin",
        queryKey: getListApplicationsQueryKey({
          status: statusFilter !== "all" ? statusFilter : undefined,
          role: roleFilter !== "all" ? roleFilter : undefined
        })
      }
    }
  );

  const { data: jobs, isLoading: isLoadingJobs } = useListJobs(
    {},
    { query: { enabled: !!user && user.role === "admin", queryKey: getListJobsQueryKey({}) } }
  );

  const updateStatus = useUpdateApplicationStatus();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const token = localStorage.getItem("bluestar_token");

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then((notifs: any[]) => setUnreadNotifs(notifs.filter(n => !n.isRead).length))
        .catch(() => {});
    }
  }, [user, token]);

  useEffect(() => {
    if (activeTab === "payment" && user?.role === "admin") {
      fetch("/api/admin/payment-settings", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setPaymentForm({
              bankName: data.bankName || "",
              accountName: data.accountName || "",
              accountNumber: data.accountNumber || "",
              routingNumber: data.routingNumber || "",
              swiftCode: data.swiftCode || "",
              additionalInfo: data.additionalInfo || "",
            });
          }
        })
        .catch(() => {});
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "orders" && user?.role === "admin") {
      setOrdersLoading(true);
      fetch("/api/admin/addon-orders", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setOrders(data))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "testimonials" && user?.role === "admin") {
      setTestimonialsLoading(true);
      fetch("/api/testimonials")
        .then(r => r.json())
        .then(data => setTestimonialsList(data))
        .catch(() => {})
        .finally(() => setTestimonialsLoading(false));
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "popup" && token) {
      fetch("/api/announcement-popup/admin", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setPopupForm({
              title: data.title || "",
              body: data.body || "",
              imageUrl: data.imageUrl || "",
              isActive: data.isActive ?? true,
            });
          }
        })
        .catch(() => {});
    }
  }, [activeTab, token]);

  // Fetch messages once when app selected, then poll every 4 s while chat is open
  useEffect(() => {
    if (!selectedAppId) return;

    let cancelled = false;

    const fetchMessages = () => {
      fetch(`/api/messages/${selectedAppId}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (!cancelled) setMessages(data); })
        .catch(() => {});
    };

    fetchMessages(); // immediate load
    const timer = setInterval(fetchMessages, 4000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedAppId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoadingUser) {
    return <div className="p-8 flex justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    setTimeout(() => setLocation("/login"), 3000);
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <Card className="max-w-md w-full border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
            <p className="text-muted-foreground">You do not have administrative privileges. Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: (updatedApp) => {
        queryClient.setQueryData(
          getListApplicationsQueryKey({
            status: statusFilter !== "all" ? statusFilter : undefined,
            role: roleFilter !== "all" ? roleFilter : undefined
          }),
          (old: any) => old ? old.map((app: any) => app.id === id ? { ...app, status: updatedApp.status } : app) : old
        );
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
      }
    });
  };

  const openChatForApp = (app: any) => {
    setSelectedApp(app);
    setSelectedAppId(app.id);
    setActiveTab("chat");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAppId) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/messages/${selectedAppId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senderRole: "admin", senderName: "Bluestar HR Team", content: newMessage.trim() })
      });
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
    } catch (e) {}
    setSendingMsg(false);
  };

  const handleOpenJobModal = (job?: any) => {
    if (job) {
      setEditingJob(job);
      setJobForm({
        title: job.title, location: job.location, category: job.category,
        experienceLevel: job.experienceLevel, description: job.description,
        salaryRange: job.salaryRange || "", isUrgent: job.isUrgent
      });
    } else {
      setEditingJob(null);
      setJobForm({ title: "", location: "", category: "", experienceLevel: "", description: "", salaryRange: "", isUrgent: false });
    }
    setJobModalOpen(true);
  };

  const handleSaveJob = () => {
    if (!jobForm.title || !jobForm.location || !jobForm.category || !jobForm.experienceLevel || !jobForm.description) return;
    const payload = { data: { ...jobForm, salaryRange: jobForm.salaryRange || undefined } };
    if (editingJob) {
      updateJob.mutate({ id: editingJob.id, ...payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
          setJobModalOpen(false);
        }
      });
    } else {
      createJob.mutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          setJobModalOpen(false);
        }
      });
    }
  };

  const handleDeleteJob = (id: number) => {
    if (!window.confirm("Delete this job listing? This cannot be undone.")) return;
    deleteJob.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
      }
    });
  };

  const handleSavePayment = async () => {
    setPaymentSaving(true);
    try {
      await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(paymentForm),
      });
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (e) {}
    setPaymentSaving(false);
  };

  const handleOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/admin/addon-orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) {}
  };

  const handleOpenTestimonialModal = (t?: any) => {
    if (t) {
      setEditingTestimonial(t);
      setTestimonialForm({ name: t.name, role: t.role, country: t.country, quote: t.quote, avatarUrl: t.avatarUrl });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({ name: "", role: "", country: "", quote: "", avatarUrl: "" });
    }
    setTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async () => {
    try {
      const url = editingTestimonial ? `/api/testimonials/${editingTestimonial.id}` : "/api/testimonials";
      const method = editingTestimonial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(testimonialForm),
      });
      const data = await res.json();
      if (editingTestimonial) {
        setTestimonialsList(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        setTestimonialsList(prev => [...prev, data]);
      }
      setTestimonialModalOpen(false);
    } catch {}
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!window.confirm("Delete this testimonial? This cannot be undone.")) return;
    try {
      await fetch(`/api/testimonials/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setTestimonialsList(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const handlePopupImageUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPopupImageError("Only JPG, PNG, GIF, or WEBP images are allowed.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPopupImageError("Image must be under 8MB.");
      return;
    }
    setPopupImageError(null);
    setPopupImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPopupForm(p => ({ ...p, imageUrl: data.url }));
    } catch {
      setPopupImageError("Image upload failed. Please try again.");
    } finally {
      setPopupImageUploading(false);
    }
  };

  const handleSavePopup = async () => {
    if (!popupForm.title.trim() || !popupForm.body.trim()) return;
    setPopupSaving(true);
    try {
      await fetch("/api/announcement-popup/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(popupForm),
      });
      setPopupSaved(true);
      setTimeout(() => setPopupSaved(false), 3000);
    } catch {}
    setPopupSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": case "paid": return "bg-green-500";
      case "rejected": case "failed": return "bg-red-500";
      default: return "bg-yellow-500";
    }
  };

  const isSuperAdmin = user.role === "superadmin";

  // Admins with null permissions get full access; otherwise filter to granted perms
  const adminPermissions: string[] | null = (user as any).permissions
    ? JSON.parse((user as any).permissions)
    : null;

  const hasPermission = (tabId: string) => {
    if (isSuperAdmin) return true;
    if (adminPermissions === null) return true;
    return adminPermissions.includes(tabId);
  };

  const allTabs: { id: Tab; label: string; icon: any; superAdminOnly?: boolean }[] = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "applications", label: "Applications", icon: Users },
    { id: "jobs", label: "Job Listings", icon: Briefcase },
    { id: "testimonials", label: "Testimonials", icon: Quote },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "email", label: "Email", icon: Mail },
    { id: "newsletter", label: "Newsletter", icon: Newspaper },
    { id: "payment", label: "Payment Settings", icon: CreditCard },
    { id: "orders", label: "Add-on Orders", icon: Package },
    { id: "users", label: "Users DB", icon: Database },
    { id: "popup", label: "Announcement Popup", icon: Megaphone },
    { id: "team", label: "Admin Team", icon: Shield, superAdminOnly: true },
  ];

  const tabs = allTabs.filter(t => {
    if (t.superAdminOnly) return isSuperAdmin;
    return hasPermission(t.id);
  });

  return (
    <div className="w-full bg-background min-h-screen pb-20">
      {/* Header */}
      <div className="bg-primary py-8 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-primary-foreground/80 mt-2">Manage recruitment operations and applications</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex overflow-x-auto gap-0 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "chat" && unreadNotifs > 0 && (
                    <span className="absolute -top-0 -right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-8">

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Applications", value: stats.totalApplications, icon: Users, color: "primary" },
                  { label: "Pending Review", value: stats.pendingApplications, icon: Clock, color: "yellow" },
                  { label: "Approved", value: stats.approvedApplications, icon: CheckCircle, color: "green" },
                  { label: "Active Jobs", value: stats.totalJobs, icon: Briefcase, color: "accent" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <h3 className="text-3xl font-bold text-foreground mt-1">{value}</h3>
                      </div>
                      <div className={`w-12 h-12 bg-${color === "yellow" ? "yellow-500" : color === "green" ? "green-500" : color}/10 rounded-full flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${color === "yellow" ? "yellow-600" : color === "green" ? "green-600" : color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Applications by Role</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRoles ? <Skeleton className="w-full h-[300px]" /> : roleCounts && roleCounts.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleCounts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="position" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── APPLICATIONS ──────────────────────────────────────────── */}
        {activeTab === "applications" && (
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
              <CardTitle className="font-serif">Applications</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roleCounts?.map(r => <SelectItem key={r.position} value={r.position}>{r.position}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingApps ? (
                <div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : applications && applications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 font-medium">Candidate</th>
                        <th className="px-6 py-4 font-medium">Position</th>
                        <th className="px-6 py-4 font-medium">Exp</th>
                        <th className="px-6 py-4 font-medium">Location</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{app.fullName}</div>
                            <div className="text-muted-foreground text-xs">{app.email}</div>
                            <div className="text-muted-foreground text-xs">{app.phone}</div>
                          </td>
                          <td className="px-6 py-4 font-medium">{app.position}</td>
                          <td className="px-6 py-4">{app.yearsOfExperience} yrs</td>
                          <td className="px-6 py-4">{app.country}</td>
                          <td className="px-6 py-4">{format(new Date(app.submittedAt), "MMM d, yyyy")}</td>
                          <td className="px-6 py-4">
                            <Badge className={`${getStatusColor(app.status)} text-white`}>{app.status}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => openChatForApp(app)}>
                                <MessageSquare className="w-4 h-4 text-primary" />
                              </Button>
                              <Select value={app.status} onValueChange={(val) => handleStatusChange(app.id, val)}>
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No applications found matching the current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── JOBS ─────────────────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-primary">Job Listings</h2>
              <Button onClick={() => handleOpenJobModal()} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Add New Job
              </Button>
            </div>

            {isLoadingJobs ? (
              <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : jobs && jobs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map(job => (
                  <Card key={job.id} className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                            {job.isUrgent && <Badge className="bg-red-500 text-white text-xs">URGENT</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                            <span>📍 {job.location}</span>
                            <span>🏷 {job.category}</span>
                            <span>🎯 {job.experienceLevel}</span>
                            {job.salaryRange && <span>💰 {job.salaryRange}</span>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">Posted {format(new Date(job.createdAt), "MMM d, yyyy")}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleOpenJobModal(job)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteJob(job.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No job listings yet. Create your first one.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CHAT ─────────────────────────────────────────────────── */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Application List */}
            <Card className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Applications</CardTitle>
                <CardDescription className="text-xs">Select to open a chat thread</CardDescription>
              </CardHeader>
              <div className="flex-1 overflow-y-auto">
                {isLoadingApps ? (
                  <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : applications?.map(app => (
                  <button
                    key={app.id}
                    onClick={() => { setSelectedApp(app); setSelectedAppId(app.id); }}
                    className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${selectedAppId === app.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <div className="font-medium text-sm text-foreground">{app.fullName}</div>
                    <div className="text-xs text-muted-foreground">{app.position}</div>
                    <div className="text-xs text-muted-foreground">{app.email}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 flex flex-col overflow-hidden">
              {selectedApp ? (
                <>
                  <CardHeader className="pb-3 border-b flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{selectedApp.fullName}</CardTitle>
                      <CardDescription className="text-xs">{selectedApp.position} · {selectedApp.email}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(selectedApp.status)} text-white`}>{selectedApp.status}</Badge>
                  </CardHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No messages yet. Start the conversation below.
                      </div>
                    ) : messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${msg.senderRole === "admin" ? "bg-primary text-white" : "bg-muted text-foreground"}`}>
                          <p className="font-medium text-xs opacity-70 mb-1">{msg.senderName}</p>
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className="text-xs opacity-50 mt-1 text-right">{format(new Date(msg.createdAt), "HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message to this candidate..."
                        className="flex-1"
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      />
                      <Button onClick={handleSendMessage} disabled={sendingMsg || !newMessage.trim()} className="bg-primary hover:bg-primary/90">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Select an application to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── EMAIL ────────────────────────────────────────────────── */}
        {activeTab === "email" && (
          <EmailTab token={token} applications={applications ?? []} />
        )}

        {/* ── NEWSLETTER ───────────────────────────────────────────── */}
        {activeTab === "newsletter" && (
          <NewsletterTab token={token} />
        )}

        {/* ── USERS DATABASE ───────────────────────────────────────── */}
        {activeTab === "users" && (
          <UsersTab token={token} />
        )}

        {/* ── ADMIN TEAM (super admin only) ────────────────────────── */}
        {activeTab === "team" && isSuperAdmin && (
          <TeamTab token={token} />
        )}

        {/* ── PAYMENT SETTINGS ─────────────────────────────────────── */}
        {activeTab === "payment" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-1">Payment Settings</h2>
              <p className="text-muted-foreground">Configure bank account details shown to candidates when they check out with add-ons.</p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-5">
                {[
                  { label: "Bank Name", key: "bankName", placeholder: "e.g. Chase Bank" },
                  { label: "Account Name", key: "accountName", placeholder: "Account holder name" },
                  { label: "Account Number", key: "accountNumber", placeholder: "Bank account number" },
                  { label: "Routing Number (Optional)", key: "routingNumber", placeholder: "For US domestic transfers" },
                  { label: "SWIFT / BIC Code (Optional)", key: "swiftCode", placeholder: "For international transfers" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <Label className="text-foreground mb-2 block">{label}</Label>
                    <Input
                      value={paymentForm[key as keyof typeof paymentForm] as string}
                      onChange={e => setPaymentForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="bg-background"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-foreground mb-2 block">Additional Instructions (Optional)</Label>
                  <Textarea
                    value={paymentForm.additionalInfo}
                    onChange={e => setPaymentForm(p => ({ ...p, additionalInfo: e.target.value }))}
                    placeholder="Any extra payment instructions for candidates..."
                    className="bg-background min-h-[100px]"
                  />
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Button onClick={handleSavePayment} disabled={paymentSaving} className="bg-primary hover:bg-primary/90">
                    {paymentSaving ? "Saving..." : "Save Payment Settings"}
                  </Button>
                  {paymentSaved && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Saved successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── ADD-ON ORDERS ─────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-primary">Add-on Orders</h2>
            {ordersLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : orders.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-6 py-4">Applicant</th>
                          <th className="px-6 py-4">Add-ons</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="border-b border-border hover:bg-muted/20">
                            <td className="px-6 py-4">
                              <div className="font-medium">{order.applicantName}</div>
                              <div className="text-xs text-muted-foreground">{order.applicantEmail}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {order.visaSponsorship && <Badge variant="secondary" className="text-xs">Visa</Badge>}
                                {order.flightTicket && <Badge variant="secondary" className="text-xs">Flight</Badge>}
                                {order.workPermit && <Badge variant="secondary" className="text-xs">Work Permit</Badge>}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold">${(order.totalAmount / 100).toFixed(0)}</td>
                            <td className="px-6 py-4">{format(new Date(order.createdAt), "MMM d, yyyy")}</td>
                            <td className="px-6 py-4">
                              <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Select value={order.status} onValueChange={val => handleOrderStatus(order.id, val)}>
                                <SelectTrigger className="w-[120px] h-8 text-xs ml-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="paid">Mark Paid</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No add-on orders yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENT POPUP ───────────────────────────────────── */}
        {activeTab === "popup" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-1">Announcement Popup</h2>
              <p className="text-muted-foreground text-sm">
                Configure the sitewide popup shown to all visitors. Changes take effect immediately when published.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">

                {/* Image upload */}
                <div>
                  <Label className="text-foreground mb-2 block font-medium">Popup Image</Label>
                  <input
                    ref={popupFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePopupImageUpload(f); e.target.value = ""; }}
                  />

                  {popupForm.imageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20 group">
                      <img
                        src={popupForm.imageUrl}
                        alt="Popup preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => popupFileInputRef.current?.click()}
                          disabled={popupImageUploading}
                        >
                          <UploadCloud className="w-4 h-4 mr-1" />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setPopupForm(p => ({ ...p, imageUrl: "" }))}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      {popupImageUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => popupFileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      {popupImageUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading image...</p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">Click to upload image</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP or GIF · Max 8MB</p>
                        </>
                      )}
                    </div>
                  )}
                  {popupImageError && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {popupImageError}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <Label className="text-foreground mb-2 block font-medium">Popup Title</Label>
                  <Input
                    value={popupForm.title}
                    onChange={e => setPopupForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Important Notice"
                    className="bg-background"
                  />
                </div>

                {/* Body */}
                <div>
                  <Label className="text-foreground mb-2 block font-medium">Message Body</Label>
                  <Textarea
                    value={popupForm.body}
                    onChange={e => setPopupForm(p => ({ ...p, body: e.target.value }))}
                    placeholder="Enter the full announcement message..."
                    className="bg-background min-h-[140px] resize-y"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                  <input
                    type="checkbox"
                    id="popupActive"
                    checked={popupForm.isActive}
                    onChange={e => setPopupForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <div>
                    <Label htmlFor="popupActive" className="cursor-pointer font-medium">Show popup to all visitors</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Uncheck to hide the popup sitewide without deleting content</p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-4 pt-2">
                  <Button
                    onClick={handleSavePopup}
                    disabled={popupSaving || !popupForm.title.trim() || !popupForm.body.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {popupSaving ? "Publishing..." : "Publish Changes"}
                  </Button>
                  {popupSaved && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Published successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live preview */}
            {(popupForm.title || popupForm.body) && (
              <div>
                <Label className="text-foreground mb-3 block font-medium">Preview</Label>
                <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-white max-w-md">
                  {popupForm.imageUrl ? (
                    <div className="w-full aspect-[16/7] overflow-hidden bg-primary/10">
                      <img src={popupForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
                  )}
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-amber-600 leading-none mb-0.5">Official Notice</p>
                        <h3 className="font-serif text-base font-bold text-primary leading-tight">{popupForm.title || "Popup Title"}</h3>
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-primary/20 via-amber-300/60 to-transparent mb-3" />
                    <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line line-clamp-4">
                      {popupForm.body || "Popup message will appear here..."}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-md">I Understand</div>
                      <p className="text-[10px] text-muted-foreground">— Bluestar Alliance Company Limited</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
        {activeTab === "testimonials" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-primary">Testimonials</h2>
                <p className="text-muted-foreground text-sm mt-1">Manage success stories shown publicly on the website</p>
              </div>
              <Button onClick={() => handleOpenTestimonialModal()} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Add Testimonial
              </Button>
            </div>

            {testimonialsLoading ? (
              <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : testimonialsList.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {testimonialsList.map(t => (
                  <Card key={t.id} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <img
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-border"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1e3a8a&color=fff`; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                            <span className="font-semibold text-foreground text-sm">{t.name}</span>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-sm text-muted-foreground">{t.role}</span>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-sm text-muted-foreground">{t.country}</span>
                          </div>
                          <p className="text-sm text-muted-foreground italic line-clamp-2">"{t.quote}"</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleOpenTestimonialModal(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTestimonial(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Quote className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No testimonials yet. Add your first success story.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Job Modal */}
      {jobModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-serif text-xl font-bold text-primary">{editingJob ? "Edit Job Listing" : "Create New Job Listing"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setJobModalOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Job Title *", key: "title", placeholder: "e.g. Senior Civil Engineer" },
                { label: "Location *", key: "location", placeholder: "e.g. Perth, Australia" },
                { label: "Category *", key: "category", placeholder: "e.g. Construction, Healthcare" },
                { label: "Experience Level *", key: "experienceLevel", placeholder: "e.g. Senior, Mid-Level, Entry" },
                { label: "Salary Range", key: "salaryRange", placeholder: "e.g. $80,000 - $120,000 AUD" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <Label className="mb-1 block text-sm">{label}</Label>
                  <Input
                    value={jobForm[key as keyof typeof jobForm] as string}
                    onChange={e => setJobForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <Label className="mb-1 block text-sm">Description *</Label>
                <Textarea
                  value={jobForm.description}
                  onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Full job description, responsibilities, requirements..."
                  className="min-h-[140px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={jobForm.isUrgent}
                  onChange={e => setJobForm(p => ({ ...p, isUrgent: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="isUrgent" className="cursor-pointer text-sm font-medium">Mark as Urgent Hire</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setJobModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSaveJob}
                disabled={createJob.isPending || updateJob.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createJob.isPending || updateJob.isPending ? "Saving..." : editingJob ? "Update Job" : "Create Job"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Testimonial Modal */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-serif text-xl font-bold text-primary">{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setTestimonialModalOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Full Name *", key: "name", placeholder: "e.g. James Mwangi" },
                { label: "Job Role *", key: "role", placeholder: "e.g. Civil Engineer" },
                { label: "Country *", key: "country", placeholder: "e.g. Kenya → Australia" },
                { label: "Avatar Photo URL *", key: "avatarUrl", placeholder: "https://randomuser.me/api/portraits/men/1.jpg" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <Label className="mb-1 block text-sm">{label}</Label>
                  <Input
                    value={testimonialForm[key as keyof typeof testimonialForm]}
                    onChange={e => setTestimonialForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <Label className="mb-1 block text-sm">Testimonial Quote *</Label>
                <Textarea
                  value={testimonialForm.quote}
                  onChange={e => setTestimonialForm(p => ({ ...p, quote: e.target.value }))}
                  placeholder="Their success story in their own words..."
                  className="min-h-[120px]"
                />
              </div>
              {testimonialForm.avatarUrl && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-sm">
                  <img
                    src={testimonialForm.avatarUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-border"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonialForm.name || "Preview")}&background=1e3a8a&color=fff`; }}
                  />
                  <p className="text-xs text-muted-foreground">Avatar preview — use randomuser.me portrait URLs for realistic photos</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setTestimonialModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSaveTestimonial}
                disabled={!testimonialForm.name || !testimonialForm.role || !testimonialForm.country || !testimonialForm.quote || !testimonialForm.avatarUrl}
                className="bg-primary hover:bg-primary/90"
              >
                {editingTestimonial ? "Update Testimonial" : "Create Testimonial"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
