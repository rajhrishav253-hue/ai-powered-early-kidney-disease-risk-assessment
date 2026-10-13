import { useEffect, useRef } from "react";
import { AlertTriangle, CircleCheck, CircleHelp, Info, Phone, ShieldAlert } from "lucide-react";
import type { AssessmentResult } from "@/lib/model/inference";

type Res = AssessmentResult | { status: "error"; modelVersion: string };

const confText = { high: "Higher model certainty", moderate: "Moderate model certainty", low: "Low model certainty" } as const;

export function SeekCareNow() {
  return (
    <section aria-labelledby="urgent-h" className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-5">
      <h3 id="urgent-h" className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Phone className="h-4 w-4 text-destructive" aria-hidden /> Get medical help urgently if you have
      </h3>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-base text-foreground">
        <li>Little or no urine for a day or more</li>
        <li>Sudden swelling of the legs, ankles or face, or shortness of breath</li>
        <li>Chest pain, confusion, severe drowsiness or fainting</li>
        <li>Blood in your urine or severe pain in your side or back</li>
      </ul>
      <p className="mt-3 text-base text-foreground">Call your local emergency number or go to an emergency department. Do not wait for an online tool.</p>
    </section>
  );
}

export function AssessmentResultView({ result, onSave, saveLabel, onRestart }: {
  result: Res; onSave?: () => void; saveLabel?: string; onRestart: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, [result]);

  const ok = result.status === "ok";
  const flagged = ok && result.classification === "pattern_resembles_ckd";
  const unavailable = !ok;

  const title = ok
    ? flagged ? "Your values resemble a kidney-disease pattern" : "Your values resemble a non-kidney-disease pattern"
    : result.status === "insufficient" ? "Insufficient information" : result.status === "invalid" ? "Some values need checking" : "Assessment unavailable right now";

  const Icon = flagged ? ShieldAlert : ok ? CircleCheck : CircleHelp;

  return (
    <div className="space-y-6">
      {/* Polite live region announces the outcome to screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        Assessment finished. {title}. This is not a diagnosis.
      </div>

      <section aria-labelledby="result-h" className={`rounded-2xl border p-6 shadow-[var(--shadow-card)] ${flagged ? "border-warning bg-warning/10" : "border-border bg-card"}`}>
        <p className="text-sm font-medium text-muted-foreground">Educational screening result · not a diagnosis</p>
        <h2 id="result-h" ref={headingRef} tabIndex={-1} className="mt-2 flex items-start gap-3 text-2xl font-semibold outline-none">
          <Icon className={`mt-1 h-6 w-6 shrink-0 ${flagged ? "text-warning" : ok ? "text-success" : "text-muted-foreground"}`} aria-hidden />
          {title}
        </h2>

        {ok && (
          <dl className="mt-5 grid gap-4 text-base sm:grid-cols-3">
            <div><dt className="text-sm text-muted-foreground">Model output (score 0–1)</dt><dd className="font-semibold">{result.score.toFixed(2)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Certainty</dt><dd className="font-semibold">{confText[result.confidence]}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Data completeness · model</dt><dd className="font-semibold">{Math.round(result.completeness * 100)}% · {result.modelVersion}</dd></div>
          </dl>
        )}
        {ok && (
          <p className="mt-4 text-base text-foreground">
            The score shows how closely your values match records of people who <em>already had</em> chronic kidney disease in the training data. It is <strong>not</strong> the chance that you have or will develop kidney disease.
          </p>
        )}
        {result.status === "insufficient" && (
          <p className="mt-4 text-base">We didn't run the model because these were missing: <strong>{result.missing.join(", ")}</strong>. We never guess or fill in missing values. These usually come from a recent blood test, urine test and blood pressure reading.</p>
        )}
        {result.status === "invalid" && (
          <ul className="mt-4 list-disc pl-5 text-base">{Object.values(result.errors).map((e) => <li key={e}>{e}</li>)}</ul>
        )}
        {result.status === "error" && (
          <p className="mt-4 text-base">Something went wrong on our side, so no result was produced. Nothing about your health can be concluded from this. Please try again later.</p>
        )}
      </section>

      {ok && (
        <section aria-labelledby="factors-h" className="rounded-2xl border border-border bg-card p-6">
          <h3 id="factors-h" className="text-lg font-semibold">What influenced the model most</h3>
          <ul className="mt-3 space-y-2 text-base">
            {result.factors.map((f) => (
              <li key={f.feature} className="flex justify-between gap-4">
                <span>{f.label}</span>
                <span className="text-muted-foreground">{f.direction === "toward" ? "pushed toward the CKD pattern" : "pushed away from it"}</span>
              </li>
            ))}
          </ul>
          <h4 className="mt-5 text-base font-semibold">Why certainty is {result.confidence}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-muted-foreground">
            {result.confidenceReasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="next-h" className="rounded-2xl border border-border bg-card p-6">
        <h3 id="next-h" className="flex items-center gap-2 text-lg font-semibold"><Info className="h-5 w-5 text-primary" aria-hidden /> What to do next</h3>
        {flagged && (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
            <li><strong>Book an appointment with your doctor in the coming days or weeks</strong> to talk about this result. It does not mean you have kidney disease.</li>
            <li>Ask whether kidney tests are right for you, such as eGFR (a blood test) and urine albumin-to-creatinine ratio (UACR).</li>
            <li>Bring your recent readings and any lab reports, plus a list of your medicines.</li>
            <li>Don't start, stop or change any medicine because of this result.</li>
          </ul>
        )}
        {ok && !flagged && (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
            <li>This result does not rule out kidney disease. Early kidney disease often has no symptoms.</li>
            <li>If you have diabetes, high blood pressure or a family history of kidney disease, ask your doctor how often you should be checked.</li>
          </ul>
        )}
        {unavailable && (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
            <li>No result is not the same as a good result. If you're worried about your kidneys, talk to a doctor. Don't wait for this tool.</li>
            <li>Ask your doctor about a blood test (creatinine/eGFR) and a urine test (albumin) if you haven't had them recently.</li>
          </ul>
        )}
      </section>

      <SeekCareNow />

      <div className="flex flex-wrap gap-3">
        {ok && onSave && (
          <button onClick={onSave} className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
            {saveLabel ?? "Save Assessment to My Dashboard"}
          </button>
        )}
        <button onClick={onRestart} className="rounded-lg border border-border bg-card px-5 py-3 font-medium hover:bg-muted">
          Start a new assessment
        </button>
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        This is an educational screening estimate, not a diagnosis. It can't replace lab tests, a clinical exam or advice from a qualified healthcare professional.
      </p>
    </div>
  );
}
