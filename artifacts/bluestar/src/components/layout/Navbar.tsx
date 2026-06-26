import { Link, useLocation } from "wouter";
import { useGetCurrentUser, getGetCurrentUserQueryKey, useLogoutUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, Bell, BellDot } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  const { data: user } = useGetCurrentUser({
    query: {
      enabled: !!localStorage.getItem("bluestar_token"),
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });
  const logout = useLogoutUser();

  useEffect(() => {
    if (!user) return;
    const email = user.role === "admin" ? "admin" : user.email;
    const role = user.role;
    const fetchNotifs = () => {
      fetch(`/api/notifications?email=${encodeURIComponent(email)}&role=${role}`)
        .then(r => r.json())
        .then((data: any[]) => {
          setNotifs(data.slice(-20).reverse());
          setUnreadCount(data.filter(n => !n.isRead).length);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = () => {
    if (!user) return;
    const email = user.role === "admin" ? "admin" : user.email;
    fetch("/api/notifications/read-all", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(() => {
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }).catch(() => {});
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("bluestar_token");
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/");
      }
    });
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/jobs", label: "Jobs" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/about", label: "About" },
    { href: "/apply", label: "Apply" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-accent rotate-45 transform"></div>
            </div>
            <span className="font-serif font-bold text-xl md:text-2xl text-primary tracking-tight">Bluestar Alliance</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-accent ${location === link.href ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-4 border-l pl-4">
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-primary hover:text-accent">
                  Admin
                </Link>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-md hover:bg-muted/50 transition-colors"
                  title="Notifications"
                >
                  {unreadCount > 0 ? (
                    <BellDot className="w-5 h-5 text-primary" />
                  ) : (
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-sm shadow-xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                        <span className="font-semibold text-sm text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No notifications yet
                          </div>
                        ) : notifs.map(n => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-border/50 last:border-0 ${!n.isRead ? "bg-primary/5" : ""}`}
                          >
                            <p className="text-sm text-foreground leading-relaxed">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <span className="text-sm text-muted-foreground">{user.fullName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l pl-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}>Login</Button>
            </div>
          )}
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-6 w-6" />
                {unreadCount > 0 && user && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-lg font-medium ${location === link.href ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="h-px bg-border my-4" />
                {user ? (
                  <>
                    {user.role === "admin" && (
                      <Link href="/admin" className="text-lg font-medium text-primary">Admin</Link>
                    )}
                    {notifs.filter(n => !n.isRead).length > 0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-sm p-3">
                        <p className="text-sm font-medium text-primary mb-1">{unreadCount} new notification{unreadCount !== 1 ? "s" : ""}</p>
                        <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                      </div>
                    )}
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>Logout</Button>
                  </>
                ) : (
                  <Button className="w-full justify-start" onClick={() => setLocation("/login")}>Login</Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
