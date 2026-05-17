"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Flag,
  FolderKanban,
  Settings,
  Users,
  Activity,
  LayoutDashboard,
  Globe,
  BarChart3,
  Code,
  LogOut,
  Moon,
  Sun,
  Search,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";

interface SidebarProps {
  projectId?: string;
  onNavigate?: () => void;
}

export function Sidebar({ projectId, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const mainNavItems = [
    { title: "Projects", href: "/projects", icon: FolderKanban },
  ];

  const projectNavItems = projectId
    ? [
        { title: "Overview", href: `/projects/${projectId}`, icon: LayoutDashboard },
        { title: "Flags", href: `/projects/${projectId}/flags`, icon: Flag },
        { title: "Environments", href: `/projects/${projectId}/environments`, icon: Globe },
        { title: "Segments", href: `/projects/${projectId}/segments`, icon: Users },
        { title: "Analytics", href: `/projects/${projectId}/analytics`, icon: BarChart3 },
        { title: "SDK", href: `/projects/${projectId}/sdk`, icon: Code },
        { title: "Audit Logs", href: `/projects/${projectId}/audit-logs`, icon: Activity },
        { title: "Settings", href: `/projects/${projectId}/settings`, icon: Settings },
      ]
    : [];

  const allNavItems = [...mainNavItems, ...projectNavItems];

  const filteredItems = searchQuery
    ? allNavItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNavItems;

  const handleSearchSelect = useCallback((href: string) => {
    router.push(href);
    setSearchOpen(false);
    setSearchQuery("");
    onNavigate?.();
  }, [router, onNavigate]);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 animate-in fade-in-0 slide-in-from-left-2 duration-300">
        <Link href="/" className="flex items-center gap-2 font-semibold group">
          <Flag className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
          <span className="text-lg">Flagship</span>
        </Link>
      </div>

      {/* Search Button */}
      <div className="p-4 pb-2 animate-in fade-in-0 slide-in-from-left-2 duration-300 [animation-delay:30ms]">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 pt-2 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNavItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
                style={{ animationDelay: `${index * 50}ms` }}
                className={cn(
                  "animate-nav-item group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary animate-in fade-in-0 zoom-in-y duration-200" />
                )}
                <item.icon className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                  isActive ? "text-primary" : "group-hover:translate-x-0.5"
                )} />
                {item.title}
              </Link>
            );
          })}
        </div>

        {projectId && (
          <>
            <div className="my-3 border-t" />
            <div
              className="mb-1.5 px-3 text-xs font-semibold uppercase text-muted-foreground animate-nav-item"
              style={{ animationDelay: `${mainNavItems.length * 50}ms` }}
            >
              Project
            </div>
            <div className="space-y-0.5">
              {projectNavItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onNavigate}
                    style={{ animationDelay: `${(mainNavItems.length + 1 + index) * 50}ms` }}
                    className={cn(
                      "animate-nav-item group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary animate-in fade-in-0 zoom-in-y duration-200" />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                      isActive ? "text-primary" : "group-hover:translate-x-0.5"
                    )} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t p-4 space-y-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={toggleTheme}
          aria-label={mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4 mr-2" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          {mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Toggle theme"}
        </Button>

        {/* User Section */}
        {user && (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </>
        )}
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredItems.map((item) => (
                <button
                  key={item.href}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                  onClick={() => handleSearchSelect(item.href)}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.title}
                </button>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No results found
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
