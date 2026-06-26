import { Link, useLocation } from "wouter";
import { useGetCurrentUser, getGetCurrentUserQueryKey, useLogoutUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser({
    query: {
      enabled: !!localStorage.getItem("bluestar_token"),
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });
  const logout = useLogoutUser();

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
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
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
