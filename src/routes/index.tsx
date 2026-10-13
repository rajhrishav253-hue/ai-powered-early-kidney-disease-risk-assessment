import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, BrainCircuit, ClipboardList, History, LineChart, Lock, MessageCircleHeart,
  ShieldCheck, Stethoscope, UserPlus, AlertTriangle, ChevronDown,
} from "lucide-react";
import { PageShell } from "@/components/site";
import kidney from "@/assets/kidney-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI KidneyGuard — Kidney Disease Risk Awareness" },
      { name: "description", content: "Explore kidney disease risk factors, track health measurements, and get educational insights. Not a diagnosis." },
      { property: "og:title", content: "AI KidneyGuard — Kidney Disease Risk Awareness" },
      { property: "og:description", content: "Educational, AI-assisted kidney health screening and tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: UserPlus, title: "Create a secure account", text: "Your records stay private to you." },
  { icon: ClipboardList, title: "Enter available health information", text: "Blood pressure, lab values, and history — only what you have." },
  { icon: BrainCircuit, title: "Review your model-generated estimate", text: "See the output, data completeness, and contributing factors." },
  { icon: Stethoscope, title: "Track and discuss", text: "Monitor trends and talk through concerning results with a clinician." },
];

const features = [
  { icon: BrainCircuit, title: "AI-assisted risk assessment", text: "A machine-learning screening workflow with transparent limitations." },
  { icon: LineChart, title: "Kidney health dashboard", text: "See your latest assessment and key measurements at a glance." },
  { icon: Activity, title: "Longitudinal tracking", text: "Chart blood pressure, eGFR, creatinine and urine albumin over time." },
  { icon: MessageCircleHeart, title: "Educational AI assistant", text: "Ask plain-language questions about kidney health topics." },
  { icon: History, title: "Health record history", text: "Every saved assessment stays interpretable, with its model version." },
  { icon: Lock, title: "Secure personal account", text: "Export or delete your own data whenever you like." },
];

const faqs = [
  ["What is chronic kidney disease?", "Chronic kidney disease (CKD) is a long-term reduction in kidney function or evidence of kidney damage, such as protein in the urine, that persists for months. It is diagnosed by a clinician using laboratory tests."],
  ["Can kidney disease exist without symptoms?", "Yes. Early CKD often causes no noticeable symptoms, which is why people with risk factors such as diabetes or high blood pressure are often advised to discuss screening with their doctor."],
  ["What information is needed for an assessment?", "Typically age, blood pressure, diabetes and hypertension history, and — where available — lab values such as serum creatinine, eGFR and urine albumin-to-creatinine ratio (UACR)."],
  ["Is the result a medical diagnosis?", "No. Results are educational estimates from a screening model. They cannot confirm or rule out kidney disease and do not replace clinical evaluation."],
  ["Can I delete my records?", "Yes. You will be able to export and permanently delete your own data from your account settings."],
  ["Why might the assessment be inconclusive?", "If required measurements are missing, we show “Insufficient information” instead of guessing. We never fill in missing values with assumed normal numbers."],
  ["When should I consult a doctor?", "Whenever you have health concerns, abnormal lab results, symptoms such as swelling or changes in urination, or risk factors like diabetes, high blood pressure or a family history of kidney disease."],
];

function Index() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-2 md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Educational screening tool
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
            Take the First Step Toward Better Kidney Health
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Explore kidney disease risk factors, record important health measurements, and gain educational insights with an AI-assisted health screening platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/how-it-works" className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground shadow-[var(--shadow-card)] transition hover:bg-primary/90">
              Start Risk Assessment
            </Link>
            <Link to="/how-it-works" className="rounded-lg border border-border bg-card px-5 py-3 font-medium text-foreground transition hover:bg-muted">
              Explore How It Works
            </Link>
          </div>
          <p className="mt-6 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            This platform provides educational risk estimates, not a diagnosis. Always consult a qualified healthcare professional.
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-6 rounded-full bg-accent blur-3xl" aria-hidden />
          <img src={kidney} alt="Illustration of a pair of human kidneys" width={1024} height={1024}
            className="relative mx-auto w-full max-w-md rounded-3xl border border-border shadow-[var(--shadow-card)]" />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-semibold text-primary">0{i + 1}</span>
                  <s.icon className="h-5 w-5 text-secondary" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-semibold">Everything in one private place</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why + transparency */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
        <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
          <h2 className="text-2xl font-semibold">Why early awareness matters</h2>
          <p className="mt-4 opacity-90">
            Chronic kidney disease can develop without obvious symptoms in its early stages. Knowing your risk factors helps you have better-informed conversations with your doctor about appropriate screening.
          </p>
          <p className="mt-4 text-sm opacity-80">
            Symptoms or a website assessment alone cannot establish a diagnosis — laboratory tests and clinical evaluation can.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold">Scientific transparency</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><b className="text-foreground">Inputs:</b> age, blood pressure, diabetes & hypertension history, and lab values like creatinine, eGFR and UACR when available.</li>
            <li><b className="text-foreground">Output:</b> a labeled model classification or educational risk indicator — never a diagnosis.</li>
            <li><b className="text-foreground">Cannot determine:</b> whether you have CKD, its stage, or its cause. A classifier trained on existing cases does not predict your future risk.</li>
            <li><b className="text-foreground">Data quality:</b> missing or inaccurate values reduce reliability; incomplete inputs produce “Insufficient information”.</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 pt-20">
        <h2 className="text-3xl font-semibold">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
