import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site";
import { LabUpload } from "@/components/lab-upload";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "My Health Trends — AI KidneyGuard" },
      { name: "description", content: "Record blood pressure and lab values over time and see trends next to your saved kidney assessments." },
      { property: "og:title", content: "My Health Trends — AI KidneyGuard" },
      { property: "og:description", content: "Track blood pressure and kidney-related lab values over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tracker,
});

type F = { date: string; sys: string; dia: string; sc: string; hemo: string; al: string; notes: string };
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = (): F => ({ date: today(), sys: "", dia: "", sc: "", hemo: "", al: "", notes: "" });
const n = (s: string) => (s.trim() === "" ? null : Number(s));
const fmt = (d: string) => new Date(d).toLocaleDateString();

const LIMITS: Record<string, [number, number, string]> = {
  sys: [60, 260, "Systolic"], dia: [30, 160, "Diastolic"], sc: [0.1, 20, "Creatinine"], hemo: [1, 25, "Hemoglobin"],
};

function Tracker() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState<F>(EMPTY);
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["tracker", user.id],
    queryFn: async () => {
      const [m, a] = await Promise.all([
        supabase.from("health_measurements").select("*").order("measured_at", { ascending: true }),
        supabase.from("risk_assessments").select("id, assessment_date, model_output, confidence").order("assessment_date", { ascending: true }),
      ]);
      return { m: m.data ?? [], a: a.data ?? [] };
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const vals = { sys: n(f.sys), dia: n(f.dia), sc: n(f.sc), hemo: n(f.hemo), al: n(f.al) };
    if (Object.values(vals).every((v) => v === null)) { toast.error("Enter at least one value."); return; }
    for (const [k, [lo, hi, label]] of Object.entries(LIMITS)) {
      const v = vals[k as keyof typeof vals];
      if (v !== null && (Number.isNaN(v) || v < lo || v > hi)) { toast.error(`${label} should be between ${lo} and ${hi}.`); return; }
    }
    if (f.date > today()) { toast.error("Date can't be in the future."); return; }
    setBusy(true);
    const { error } = await supabase.from("health_measurements").insert({
      user_id: user.id, measured_at: new Date(f.date + "T12:00:00").toISOString(),
      systolic_bp: vals.sys, diastolic_bp: vals.dia, serum_creatinine: vals.sc, hemoglobin: vals.hemo, urine_albumin: vals.al,
      notes: f.notes.trim().slice(0, 300) || null,
    });
    setBusy(false);
    if (error) { toast.error("Could not save. Please try again."); return; }
    toast.success("Measurement saved.");
    setF(EMPTY());
    qc.invalidateQueries({ queryKey: ["tracker", user.id] });
  }

  async function del(id: string) {
    const { error } = await supabase.from("health_measurements").delete().eq("id", id);
    if (error) toast.error("Could not delete.");
    else qc.invalidateQueries({ queryKey: ["tracker", user.id] });
  }

  const inp = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-foreground";
  const rows = (data?.m ?? []).map((r) => ({
    t: new Date(r.measured_at).getTime(), sys: r.systolic_bp, dia: r.diastolic_bp,
    sc: r.serum_creatinine == null ? null : Number(r.serum_creatinine), hemo: r.hemoglobin == null ? null : Number(r.hemoglobin), al: r.urine_albumin,
  }));
  const assessTimes = (data?.a ?? []).map((a) => ({ t: new Date(a.assessment_date).getTime(), flag: a.model_output === "pattern_resembles_ckd" }));

  const Chart = ({ title, unit, lines }: { title: string; unit: string; lines: { k: keyof (typeof rows)[number]; name: string; color: string }[] }) => {
    const pts = rows.filter((r) => lines.some((l) => r[l.k] != null));
    return (
      <figure className="rounded-2xl border border-border bg-card p-5">
        <figcaption className="font-display font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">({unit})</span></figcaption>
        {pts.length < 1 ? <p className="mt-3 text-sm text-muted-foreground">No values recorded yet.</p> : (
          <div className="mt-3 h-56" role="img" aria-label={`${title} trend chart with ${pts.length} readings`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pts}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => new Date(t).toLocaleDateString()} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={40} />
                <Tooltip labelFormatter={(t) => new Date(t as number).toLocaleDateString()} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                {assessTimes.map((a, i) => <ReferenceLine key={i} x={a.t} stroke={a.flag ? "var(--destructive)" : "var(--primary)"} strokeDasharray="4 4" />)}
                {lines.map((l) => <Line key={l.k} dataKey={l.k} name={l.name} stroke={l.color} strokeWidth={2} dot connectNulls />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </figure>
    );
  };

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl space-y-8 px-5 pt-12">
        <div>
          <h1 className="text-3xl font-semibold">My health trends</h1>
          <p className="mt-2 text-muted-foreground">Record your readings over time. Dashed lines on the charts mark your saved assessments. Trends are for your own tracking and are not a diagnosis — discuss changes with a healthcare professional.</p>
        </div>

        <LabUpload userId={user.id} onSaved={() => qc.invalidateQueries({ queryKey: ["tracker", user.id] })} />

        <form onSubmit={add} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Add a measurement</h2>
          <p className="text-sm text-muted-foreground">Fill in only what you have.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">Date<input type="date" max={today()} className={inp} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
            <label className="block text-sm font-medium">Systolic BP (mmHg)<input type="number" className={inp} value={f.sys} onChange={(e) => setF({ ...f, sys: e.target.value })} placeholder="e.g. 120" /><span className="mt-1 block text-xs font-normal text-muted-foreground">The higher (first) number of a reading like 120/80. Blood pressure moves through the day — track the trend, not one reading.</span></label>
            <label className="block text-sm font-medium">Diastolic BP (mmHg)<input type="number" className={inp} value={f.dia} onChange={(e) => setF({ ...f, dia: e.target.value })} placeholder="e.g. 80" /><span className="mt-1 block text-xs font-normal text-muted-foreground">The lower (second) number of a reading like 120/80. Compare against your own past readings, not a single value.</span></label>
            <label className="block text-sm font-medium">Serum creatinine (mg/dL)<input type="number" step="0.01" className={inp} value={f.sc} onChange={(e) => setF({ ...f, sc: e.target.value })} /><span className="mt-1 block text-xs font-normal text-muted-foreground">A waste-product blood test linked to how well kidneys filter. Typical values differ by age, sex and muscle mass — compare with the reference range on your lab report.</span></label>
            <label className="block text-sm font-medium">Hemoglobin (g/dL)<input type="number" step="0.1" className={inp} value={f.hemo} onChange={(e) => setF({ ...f, hemo: e.target.value })} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Oxygen-carrying protein in your red blood cells, from a complete blood count. Reference ranges differ by age and sex — your lab report shows the range your lab uses.</span></label>
            <label className="block text-sm font-medium">Urine albumin dipstick
              <select className={inp} value={f.al} onChange={(e) => setF({ ...f, al: e.target.value })}>
                <option value="">Not measured</option><option value="0">Negative (0)</option><option value="1">Trace / 1+</option>
                <option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option>
              </select>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">Checks for protein in a urine sample. A single higher result can be temporary (exercise, fever, dehydration); repeated results are worth discussing with a healthcare professional.</span>
            </label>
          </div>
          <label className="block text-sm font-medium">Notes (optional)<input className={inp} maxLength={300} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
          <button disabled={busy} className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-60">{busy ? "Saving…" : "Save measurement"}</button>
        </form>

        <div className="grid gap-5 md:grid-cols-2">
          <Chart title="Blood pressure" unit="mmHg" lines={[{ k: "sys", name: "Systolic", color: "var(--primary)" }, { k: "dia", name: "Diastolic", color: "var(--accent-foreground)" }]} />
          <Chart title="Serum creatinine" unit="mg/dL" lines={[{ k: "sc", name: "Creatinine", color: "var(--primary)" }]} />
          <Chart title="Hemoglobin" unit="g/dL" lines={[{ k: "hemo", name: "Hemoglobin", color: "var(--primary)" }]} />
          <Chart title="Urine albumin" unit="dipstick 0–5" lines={[{ k: "al", name: "Albumin", color: "var(--primary)" }]} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Readings</h2>
            {!data ? <p className="mt-3 text-muted-foreground">Loading…</p> : data.m.length === 0 ? <p className="mt-3 text-muted-foreground">No readings yet.</p> : (
              <ul className="mt-3 divide-y divide-border">
                {[...data.m].reverse().map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{fmt(r.measured_at)}</p>
                      <p className="text-muted-foreground">
                        {[r.systolic_bp != null || r.diastolic_bp != null ? `BP ${r.systolic_bp ?? "–"}/${r.diastolic_bp ?? "–"}` : null,
                          r.serum_creatinine != null ? `Creatinine ${r.serum_creatinine}` : null,
                          r.hemoglobin != null ? `Hb ${r.hemoglobin}` : null,
                          r.urine_albumin != null ? `Albumin ${r.urine_albumin}` : null].filter(Boolean).join(" · ")}
                      </p>
                      {r.notes && <p className="text-muted-foreground italic">{r.notes}</p>}
                    </div>
                    <button onClick={() => del(r.id)} className="text-destructive hover:underline">Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Saved assessments</h2>
            {!data ? <p className="mt-3 text-muted-foreground">Loading…</p> : data.a.length === 0 ? (
              <p className="mt-3 text-muted-foreground">None yet. <Link to="/assessment" className="text-primary underline">Run an assessment</Link></p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {[...data.a].reverse().map((a) => (
                  <li key={a.id} className="py-3 text-sm">
                    <p className="font-medium">{a.model_output === "pattern_resembles_ckd" ? "Resembles kidney-disease pattern" : "Resembles non-kidney-disease pattern"}</p>
                    <p className="text-muted-foreground">{fmt(a.assessment_date)} · {a.confidence} certainty</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </PageShell>
  );
}
