import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — VIVA LIVE" },
      { name: "description", content: "Create your VIVA LIVE account to watch live rooms, chat and send gifts." },
      { property: "og:title", content: "Sign in — VIVA LIVE" },
      { property: "og:description", content: "Join the VIVA LIVE community." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
    country: COUNTRIES[0] ?? "",
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back to VIVA LIVE");
        void navigate({ to: "/" });
      } else if (mode === "signup") {
        if (form.username.trim().length < 3) throw new Error("Username must be at least 3 characters.");
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: form.username.trim().toLowerCase(),
              display_name: form.displayName.trim() || form.username.trim(),
              country: form.country,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created — welcome!");
          void navigate({ to: "/" });
        } else {
          toast.success("Check your email to confirm your account.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo />
        <h1 className="text-2xl font-extrabold">
          {mode === "signup" ? "Join VIVA LIVE" : mode === "forgot" ? "Reset password" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Live rooms, realtime chat, animated gifts — all in test mode.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-3xl glass p-5">
        <Input placeholder="Email" type="email" required value={form.email} onChange={set("email")} />
        {mode !== "forgot" && (
          <Input
            placeholder="Password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={set("password")}
          />
        )}
        {mode === "signup" && (
          <>
            <Input placeholder="Username" required value={form.username} onChange={set("username")} />
            <Input placeholder="Display name" value={form.displayName} onChange={set("displayName")} />
            <select
              value={form.country}
              onChange={set("country")}
              className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}
        <Button type="submit" disabled={busy} className="w-full brand-gradient font-bold text-primary-foreground">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        {mode !== "signup" ? (
          <button className="text-primary" onClick={() => setMode("signup")}>
            New here? Create an account
          </button>
        ) : (
          <button className="text-primary" onClick={() => setMode("login")}>
            Already have an account? Sign in
          </button>
        )}
        {mode === "login" && (
          <button className="text-muted-foreground" onClick={() => setMode("forgot")}>
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}