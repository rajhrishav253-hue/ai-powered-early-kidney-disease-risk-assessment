import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account — AI KidneyGuard" },
      { name: "description", content: "Your profile, health history and saved kidney assessments." },
      { property: "og:title", content: "My Account — AI KidneyGuard" },
      { property: "og:description", content: "Your private AI KidneyGuard account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

const tri = (v: boolean | null | undefined) => (v === true ? "yes" : v === false ? "no" : "");
const fromTri = (s: string) => (s === "yes" ? true : s === "no" ? false : null);

function Account() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["account", user.id],
    queryFn: async () => {
      const [p, h, a] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("health_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("risk_assessments").select("id, assessment_date, model_output, confidence, model_version").order("assessment_date", { ascending: false }),
      ]);
      return { profile: p.data, health: h.data, assessments: a.data ?? [] };
    },
  });
  const [f, setF] = useState({ full_name: "", birth_year: "", htn: "", dm: "", fam: "" });
  useEffect(() => {
    if (!data) return;
    setF({
      full_name: data.profile?.full_name ?? "", birth_year: data.profile?.birth_year?.toString() ?? "",
      htn: tri(data.health?.hypertension_history), dm: tri(data.health?.diabetes_history), fam: tri(data.health?.family_history_ckd),
    });
  }, [data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const by = f.birth_year ? Number(f.birth_year) : null;
    if (by !== null && (by < 1900 || by > 2010)) { toast.error("Enter a birth year between 1900 and 2010."); return; }
    const r1 = await supabase.from("profiles").upsert({ id: user.id, full_name: f.full_name.trim().slice(0, 100) || null, birth_year: by });
    const r2 = await supabase.from("health_profiles").upsert({
      user_id: user.id, hypertension_history: fromTri(f.htn), diabetes_history: fromTri(f.dm), family_history_ckd: fromTri(f.fam),
    }, { onConflict: "user_id" });
    if (r1.error || r2.error) { toast.error("Could not save. Please try again."); return; }
    toast.success("Profile saved.");
    qc.invalidateQueries({ queryKey: ["account", user.id] });
  }

  async function del(id: string) {
    const { error } = await supabase.from("risk_assessments").delete().eq("id", id);
    if (error) { toast.error("Could not delete."); return; }
    qc.invalidateQueries({ queryKey: ["account", user.id] });
  }

  const sel = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5";
  const TriSelect = ({ k, label }: { k: "htn" | "dm" | "fam"; label: string }) => (
    <label className="block text-sm font-medium">{label}
      <select className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
        <option value="">Not sure / prefer not to say</option><option value="yes">Yes</option><option value="no">No</option>
      </select>
    </label>
  );

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl space-y-8 px-5 pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">My account</h1>
          <Link to="/assessment" className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground">New assessment</Link>
        </div>

        <section aria-labelledby="saved-h" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="saved-h" className="text-xl font-semibold">Saved assessments</h2>
          {!data ? <p className="mt-3 text-muted-foreground">Loading…</p> : data.assessments.length === 0 ? (
            <p className="mt-3 text-muted-foreground">No saved assessments yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.assessments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{a.model_output === "pattern_resembles_ckd" ? "Resembles kidney-disease pattern" : "Resembles non-kidney-disease pattern"}</p>
                    <p className="text-sm text-muted-foreground">{new Date(a.assessment_date).toLocaleString()} · {a.confidence} certainty · {a.model_version}</p>
                  </div>
                  <button onClick={() => del(a.id)} className="text-sm text-destructive hover:underline">Delete</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Profile & health history</h2>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}. Leave anything you're unsure of as "Not sure".</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Name
              <input className={sel} value={f.full_name} maxLength={100} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            </label>
            <label className="block text-sm font-medium">Birth year
              <input className={sel} type="number" value={f.birth_year} onChange={(e) => setF({ ...f, birth_year: e.target.value })} />
            </label>
            <TriSelect k="htn" label="High blood pressure history" />
            <TriSelect k="dm" label="Diabetes history" />
            <TriSelect k="fam" label="Family history of kidney disease" />
          </div>
          <button className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground">Save profile</button>
        </form>
      </section>
    </PageShell>
  );
}
