import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — AI KidneyGuard" },
      { name: "description", content: "Choose a new password for your AI KidneyGuard account." },
      { property: "og:title", content: "Set a new password — AI KidneyGuard" },
      { property: "og:description", content: "Choose a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("Password must be at least 8 characters.");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg("This reset link may have expired. Request a new one from the sign-in page.");
    navigate({ to: "/assessment" });
  }
  return (
    <PageShell>
      <form onSubmit={submit} className="mx-auto max-w-md space-y-4 px-5 pt-14">
        <h1 className="text-3xl font-semibold">Set a new password</h1>
        <label className="block text-sm font-medium">New password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5" />
        </label>
        {msg && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{msg}</p>}
        <button className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground">Save password</button>
      </form>
    </PageShell>
  );
}
