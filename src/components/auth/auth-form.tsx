"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";

type AuthMode = "login" | "register";

export function AuthForm({ initialMode }: { initialMode: AuthMode }) {
  const { login, register, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const isRegister = mode === "register";
  const loading = isLoading || authLoading;

  const switchMode = (next: AuthMode) => {
    setError("");
    setMode(next);
    router.replace(`/auth/${next}`, { scroll: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (password !== confirmPassword) { setError("Passwords do not match"); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        toast({ title: "Account created!", description: "Welcome to Flagship!" });
      } else {
        await login(email, password);
        toast({ title: "Welcome back!", description: `Signed in as ${email}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : isRegister ? "Registration failed" : "Login failed";
      setError(msg);
      toast({ title: isRegister ? "Registration failed" : "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-background via-background to-muted">

      {/* Floating background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/6 blur-3xl animate-orb-1" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/3 blur-3xl animate-orb-3" />
      </div>

      {/* Card — fade-up on mount */}
      <div
        className="relative w-full max-w-md transition-all duration-500 ease-out"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)" }}
      >
        <div className="rounded-2xl border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 transition-transform duration-500"
                style={{ transform: mounted ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-20deg)", opacity: mounted ? 1 : 0 }}
              >
                <Flag className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl bg-muted p-1 mb-6">
              {(["login", "register"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ color: mode === m ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                >
                  {/* Active background indicator */}
                  {mode === m && (
                    <span className="absolute inset-0 rounded-lg bg-background shadow-sm animate-in fade-in-0 zoom-in-95 duration-150" />
                  )}
                  <span className="relative">{m === "login" ? "Sign in" : "Sign up"}</span>
                </button>
              ))}
            </div>

            {/* Title — re-animates on mode switch via key */}
            <div key={mode} className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
              <h1 className="text-2xl font-bold tracking-tight">
                {isRegister ? "Create account" : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isRegister
                  ? "Get started with Flagship feature flags"
                  : "Sign in to your Flagship account"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-8 pb-2 space-y-4">

              {/* Error alert */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name — register only, slides in from top */}
              <div
                className="overflow-hidden transition-all duration-350 ease-in-out"
                style={{
                  maxHeight: isRegister ? "5.5rem" : "0px",
                  opacity: isRegister ? 1 : 0,
                  transform: isRegister ? "translateY(0)" : "translateY(-8px)",
                }}
              >
                <div className="space-y-2 pb-0.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isRegister}
                    tabIndex={isRegister ? 0 : -1}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email — always visible */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password — always visible */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <div
                    className="overflow-hidden transition-all duration-250"
                    style={{
                      maxWidth: isRegister ? "0px" : "200px",
                      opacity: isRegister ? 0 : 1,
                    }}
                  >
                    <Link
                      href="/auth/forgot-password"
                      tabIndex={isRegister ? -1 : 0}
                      className="text-xs text-primary hover:underline whitespace-nowrap ml-2"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  disabled={loading}
                />
                {/* Hint only for register */}
                <div
                  className="overflow-hidden transition-all duration-250 ease-in-out"
                  style={{ maxHeight: isRegister ? "1.5rem" : "0px", opacity: isRegister ? 1 : 0 }}
                >
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>
              </div>

              {/* Confirm Password — register only, slides in from bottom */}
              <div
                className="overflow-hidden transition-all duration-350 ease-in-out"
                style={{
                  maxHeight: isRegister ? "5.5rem" : "0px",
                  opacity: isRegister ? 1 : 0,
                  transform: isRegister ? "translateY(0)" : "translateY(8px)",
                }}
              >
                <div className="space-y-2 pb-0.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={isRegister}
                    tabIndex={isRegister ? 0 : -1}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Demo credentials — login only */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isRegister ? "0px" : "5rem", opacity: isRegister ? 0 : 1 }}
              >
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs">
                  <span className="text-muted-foreground font-medium">Demo:</span>
                  <span className="font-mono text-muted-foreground flex-1">admin@flagship.dev / admin123</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    tabIndex={isRegister ? -1 : 0}
                    onClick={() => { setEmail("admin@flagship.dev"); setPassword("admin123"); }}
                    disabled={loading}
                  >
                    Fill
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-8 py-6">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegister ? "Create account" : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
