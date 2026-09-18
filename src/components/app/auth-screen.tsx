"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, User, ShieldCheck, Leaf, Apple } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

type Mode = "login" | "register";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);

  // login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.refresh();
      }
    } catch {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        name: regName,
        email: regEmail,
        password: regPassword,
      });
      // auto sign-in after register
      const res = await signIn("credentials", {
        email: regEmail,
        password: regPassword,
        redirect: false,
      });
      if (res?.error) {
        toast.success("Account created! Please sign in.");
        setMode("login");
        setLoginEmail(regEmail);
      } else {
        toast.success("Account created — welcome to NutriFlow!");
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_TAKEN") {
          toast.error("An account with that email already exists.");
        } else if (err.code === "VALIDATION_ERROR") {
          const details = err.details as Array<{ message: string }> | undefined;
          toast.error(details?.[0]?.message ?? "Please check your input.");
        } else if (err.code === "RATE_LIMITED") {
          toast.error("Too many attempts. Please wait 15 minutes.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function passwordIssues(p: string): string[] {
    const issues: string[] = [];
    if (p.length < 8) issues.push("At least 8 characters");
    if (!/[A-Za-z]/.test(p)) issues.push("A letter");
    if (!/[0-9]/.test(p)) issues.push("A number");
    return issues;
  }

  const regIssues = regPassword ? passwordIssues(regPassword) : [];
  const regValid =
    regName.trim().length > 0 &&
    /@/.test(regEmail) &&
    regIssues.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/60 via-background to-background">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Brand header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            NutriFlow
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Secure nutrition & fitness tracking. Calories, macros, exercise, water & fasting.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl shadow-emerald-900/5 border-border/60">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl">Get started</CardTitle>
            <CardDescription>
              Sign in or create a free account. Your data stays encrypted & private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid grid-cols-2 mb-5">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        className="pl-9"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Min 8 chars, letter + number"
                        className="pl-9"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    {regPassword && regIssues.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 pl-1">
                        {regIssues.map((i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-amber-500">•</span> Needs: {i}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !regValid}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>bcrypt-hashed passwords · rate-limited · secure cookies</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Apple className="h-4 w-4 text-emerald-500" /> 85+ foods</span>
          <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 text-emerald-500" /> Macro tracking</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Offline-ready</span>
        </div>
      </main>
    </div>
  );
}
