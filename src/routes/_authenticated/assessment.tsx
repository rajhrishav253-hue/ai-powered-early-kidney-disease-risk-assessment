import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/site";
import { AssessmentResultView } from "@/components/assessment-result";
import { predictAssessment, saveAssessment } from "@/lib/assessment.functions";
import { assessmentSchema, type AssessmentResult } from "@/lib/model/inference";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({
    meta: [
      { title: "Kidney Risk Assessment — AI KidneyGuard" },
      { name: "description", content: "Enter your health values for an educational kidney disease screening estimate." },
      { property: "og:title", content: "Kidney Risk Assessment — AI KidneyGuard" },
      { property: "og:description", content: "Educational kidney screening estimate. Not a diagnosis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssessmentPage,
});

type Form = { age: string; bp: string; sc: string; al: string; hemo: string; htn: string; dm: string };
const EMPTY: Form = { age: "", bp: "", sc: "", al: "", hemo: "", htn: "", dm: "" };
type Res = AssessmentResult | { status: "error"; modelVersion: string };

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const bool = (s: string) => (s === "" ? undefined : s === "yes");
const toInput = (f: Form) => {
  const o: Record<string, number | boolean> = {};
  const vals = { age: num(f.age), bp: num(f.bp), sc: num(f.sc), al: num(f.al), hemo: num(f.hemo), htn: bool(f.htn), dm: bool(f.dm) };
  for (const [k, v] of Object.entries(vals)) if (v !== undefined) o[k] = v;
  return o;
};

function AssessmentPage() {
  const [form, setForm] = useState<Form>(EMPTY); // clean form every time
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [result, setResult] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const predict = useServerFn(predictAssessment);
  const save = useServerFn(saveAssessment);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = toInput(form);
    // Client-side check only on values that were entered; blanks become "Insufficient information".
    const errs: typeof errors = {};
    const shape = assessmentSchema.shape;
    for (const [k, v] of Object.entries(input)) {
      const r = shape[k as keyof typeof shape].safeParse(v);
      if (!r.success) errs[k as keyof Form] = r.error.issues[0]?.message ?? "Check this value";
      else if (typeof v === "number" && Number.isNaN(v)) errs[k as keyof Form] = "Enter a number";
    }
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error("Please fix the highlighted fields."); return; }
    setBusy(true);
    try { setResult(await predict({ data: input })); }
    catch { setResult({ status: "error", modelVersion: "unknown" }); }
    finally { setBusy(false); }
  }

  async function onSave() {
    const r = await save({ data: toInput(form) }).catch(() => ({ ok: false as const, reason: "Could not save right now." }));
    if (r.ok) { setSaved(true); toast.success("Saved to your account."); } else toast.error(r.reason);
  }

  function restart() { setForm(EMPTY); setErrors({}); setResult(null); setSaved(false); window.scrollTo(0, 0); }

  const field = (k: keyof Form) =>
    `mt-1 w-full rounded-lg border bg-card px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring ${errors[k] ? "border-destructive" : "border-input"}`;
  const Err = (k: keyof Form) => errors[k] ? <p id={`${k}-err`} className="mt-1 text-sm text-destructive">{errors[k]}</p> : null;
  const Field = ({ k, label, hint, unit, step }: { k: keyof Form; label: string; hint: string; unit: string; step: string }) => (
    <div>
      <label htmlFor={k} className="text-sm font-medium">{label} <span className="text-muted-foreground">({unit})</span></label>
      <input id={k} inputMode="decimal" type="number" step={step} value={form[k]} onChange={set(k)} className={field(k)}
        aria-invalid={!!errors[k]} aria-describedby={`${k}-hint${errors[k] ? ` ${k}-err` : ""}`} />
      <p id={`${k}-hint`} className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {Err(k)}
    </div>
  );
  const YesNo = ({ k, label, hint }: { k: keyof Form; label: string; hint?: string }) => (
    <div>
      <label htmlFor={k} className="text-sm font-medium">{label}</label>
      <select id={k} value={form[k]} onChange={set(k)} className={field(k)} aria-invalid={!!errors[k]}
        aria-describedby={`${k}-hint${errors[k] ? ` ${k}-err` : ""}`}>
        <option value="">Choose…</option><option value="yes">Yes</option><option value="no">No</option>
      </select>
      {hint && <p id={`${k}-hint`} className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {Err(k)}
    </div>
  );

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-5 pt-12">
        {result ? (
          <>
            <AssessmentResultView result={result} onRestart={restart}
              onSave={saved ? undefined : onSave} />
            {saved && <p className="mt-4 text-base">Saved. <Link to="/account" className="text-primary underline">View your saved assessments</Link></p>}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold">Kidney risk assessment</h1>
            <p className="mt-2 text-muted-foreground">
              Enter the values you have from a recent check-up or lab report. Leave a field blank if you don't know it. We'll tell you if there isn't enough information instead of guessing.
            </p>
            <form onSubmit={submit} noValidate className="mt-8 space-y-8">
              <fieldset className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
                <legend className="px-2 font-display font-semibold">About you</legend>
                {Field({ k: "age", label: "Age", unit: "years", step: "1", hint: "Your age in whole years (18 or over). Age affects typical lab values but is not a diagnosis on its own." })}
                {Field({ k: "bp", label: "Diastolic blood pressure", unit: "mmHg", step: "1", hint: "The lower number in a reading like 120/80. Blood pressure varies through the day — use a recent reading taken while seated and rested." })}
                {YesNo({ k: "htn", label: "Have you been told you have high blood pressure?", hint: "Answer based on what a healthcare professional has told you." })}
                {YesNo({ k: "dm", label: "Have you been told you have diabetes?", hint: "Answer based on what a healthcare professional has told you." })}
              </fieldset>
              <fieldset className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
                <legend className="px-2 font-display font-semibold">Lab results</legend>
                {Field({ k: "sc", label: "Serum creatinine", unit: "mg/dL", step: "0.01", hint: "A waste product your kidneys filter from blood. Typical values differ by age, sex and muscle mass — compare with the reference range on your lab report. If your report uses µmol/L, divide by 88.4." })}
                {Field({ k: "hemo", label: "Hemoglobin", unit: "g/dL", step: "0.1", hint: "The oxygen-carrying protein in your blood, from a complete blood count. Typical values differ by age and sex — your lab report shows the range your lab uses." })}
                <div>
                  <label htmlFor="al" className="text-sm font-medium">Urine albumin dipstick</label>
                  <select id="al" value={form.al} onChange={set("al")} className={field("al")} aria-describedby={errors.al ? "al-hint al-err" : "al-hint"}>
                    <option value="">Choose…</option>
                    <option value="0">Negative (0)</option><option value="1">Trace / 1+</option><option value="2">2+</option>
                    <option value="3">3+</option><option value="4">4+</option><option value="5">5+</option>
                  </select>
                  <p id="al-hint" className="mt-1 text-sm text-muted-foreground">A urine dipstick for protein (albumin). Negative or trace is common, and one higher reading can be temporary — exercise, fever or dehydration can affect it. Repeated results are worth discussing with a healthcare professional.</p>
                </div>
              </fieldset>
              <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {busy ? "Running assessment…" : "Run assessment"}
              </button>
            </form>
          </>
        )}
      </section>
    </PageShell>
  );
}
