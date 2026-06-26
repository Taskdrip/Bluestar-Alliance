import { useState } from "react";
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
  useUpdateApplicationStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertCircle, Briefcase, CheckCircle, Clock, FileText, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Admin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser({
    query: {
      enabled: !!localStorage.getItem("bluestar_token"),
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useGetStatsSummary({
    query: {
      enabled: !!user && user.role === "admin",
      queryKey: getGetStatsSummaryQueryKey(),
    }
  });

  const { data: roleCounts, isLoading: isLoadingRoles } = useGetApplicationsByRole({
    query: {
      enabled: !!user && user.role === "admin",
      queryKey: getGetApplicationsByRoleQueryKey(),
    }
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

  const updateStatus = useUpdateApplicationStatus();

  // Guard against non-admin users
  if (isLoadingUser) {
    return <div className="p-8 flex justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  if (!user || user.role !== "admin") {
    // Note: in a real app, you might want to redirect in a useEffect, but this satisfies the requirement to show a message or redirect
    setTimeout(() => setLocation("/login"), 3000);
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <Card className="max-w-md w-full border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
            <p className="text-muted-foreground">You do not have administrative privileges to view this page. Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: (updatedApp) => {
          // Optimistically update the cache without triggering full refetch
          queryClient.setQueryData(
            getListApplicationsQueryKey({ 
              status: statusFilter !== "all" ? statusFilter : undefined,
              role: roleFilter !== "all" ? roleFilter : undefined 
            }), 
            (old: any) => old ? old.map((app: any) => app.id === id ? { ...app, status: updatedApp.status } : app) : old
          );
          
          // Also invalidate stats to update top numbers
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500 hover:bg-green-600";
      case "rejected": return "bg-red-500 hover:bg-red-600";
      default: return "bg-yellow-500 hover:bg-yellow-600";
    }
  };

  return (
    <div className="w-full bg-background min-h-screen pb-20">
      <div className="bg-primary py-8 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-primary-foreground/80 mt-2">Manage recruitment operations and applications</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-8 space-y-8">
        {/* Stats Summary */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.totalApplications}</h3>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.pendingApplications}</h3>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.approvedApplications}</h3>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Active Jobs</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">{stats.totalJobs}</h3>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Charts & Graphs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-serif">Applications by Role</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <Skeleton className="w-full h-[300px]" />
              ) : roleCounts && roleCounts.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleCounts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="position" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                        axisLine={false} 
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
            <CardTitle className="font-serif">Recent Applications</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleCounts?.map(r => (
                    <SelectItem key={r.position} value={r.position}>{r.position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingApps ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Candidate</th>
                      <th className="px-6 py-4 font-medium">Position</th>
                      <th className="px-6 py-4 font-medium">Experience</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
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
                          <Badge className={`${getStatusColor(app.status)} text-white`}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Select 
                            value={app.status} 
                            onValueChange={(val) => handleStatusChange(app.id, val)}
                          >
                            <SelectTrigger className="w-[120px] ml-auto h-8 text-xs">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approve</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
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
      </div>
    </div>
  );
}
