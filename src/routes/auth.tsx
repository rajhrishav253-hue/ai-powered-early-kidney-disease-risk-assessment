import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PageShell } from "@/components/site";

const search = z.object({ redirect: z.string().optional() });
const safe = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/assessment");

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — AI KidneyGuard" },
      { name: "description", content: "Sign in or create a free AI KidneyGuard account to run and save assessments." },
      { property: "og:title", content: "Sign in — AI KidneyGuard" },
      { property: "og:description", content: "Create a free account to save your kidney health assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const creds = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const target = safe(redirect);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: target, replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") navigate({ to: target, replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function google() {
    sessionStorage.setItem("kg_after_login", target);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in didn't work. Please try again.");
  }

  useEffect(() => {
    const after = sessionStorage.getItem("kg_after_login");
    if (after) supabase.auth.getUser().then(({ data }) => {
      if (data.user) { sessionStorage.removeItem("kg_after_login"); navigate({ to: safe(after), replace: true }); }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (mode === "forgot") {
      const r = z.string().trim().email().safeParse(email);
      if (!r.success) return setMsg("Enter a valid email");
      setBusy(true);
      await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      return setMsg("If an account exists for that email, we've sent a reset link.");
    }
    const p = creds.safeParse({ email, password });
    if (!p.success) return setMsg(p.error.issues[0]?.message ?? "Check your details");
    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        ...p.data,
        options: { emailRedirectTo: window.location.origin + target, data: { full_name: name.trim().slice(0, 100) } },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      if (!data.session) setMsg("Check your email and click the confirmation link to finish creating your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword(p.data);
      setBusy(false);
      if (error) setMsg("Email or password is incorrect.");
    }
  }

  const field = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring";
  return (
    <PageShell>
      <section className="mx-auto max-w-md px-5 pt-14">
        <h1 className="text-3xl font-semibold">
          {mode === "in" ? "Welcome back" : mode === "up" ? "Create your free account" : "Reset your password"}
        </h1>
        <p className="mt-2 text-muted-foreground">Sign in to run an assessment and keep your results private to you.</p>
        {redirect && (
          <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-primary/30 bg-accent p-4 text-base text-accent-foreground">
            <h2 className="font-display text-base font-semibold">Sign in to see your results</h2>
            <p className="mt-1">Your results are personal health information, so we only show them in a private account. Sign in or create a free account, and you'll come straight back to the assessment.</p>
          </div>
        )}

        {mode !== "forgot" && (
          <>
            <button type="button" onClick={google}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-medium hover:bg-muted">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>
              Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === "up" && (
            <label className="block text-sm font-medium">Your name (optional)
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} />
            </label>
          )}
          <label className="block text-sm font-medium">Email
            <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          {mode !== "forgot" && (
            <label className="block text-sm font-medium">Password
              <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "up" ? "new-password" : "current-password"} required minLength={8} />
            </label>
          )}
          {msg && <p role="status" aria-live="polite" className="rounded-lg bg-muted p-3 text-sm">{msg}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
          {mode === "in" ? (
            <>
              <button className="text-primary hover:underline" onClick={() => { setMode("up"); setMsg(null); }}>New here? Create an account</button>
              <button className="text-muted-foreground hover:underline" onClick={() => { setMode("forgot"); setMsg(null); }}>Forgot password?</button>
            </>
          ) : (
            <button className="text-primary hover:underline" onClick={() => { setMode("in"); setMsg(null); }}>Back to sign in</button>
          )}
        </div>
      </section>
    </PageShell>
  );
}
