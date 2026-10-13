import { createFileRoute } from "@tanstack/react-router";
import { ProsePage } from "@/components/site";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — AI KidneyGuard" },
      { name: "description", content: "How AI KidneyGuard's educational kidney risk screening works, what it uses, and its limits." },
      { property: "og:title", content: "How It Works — AI KidneyGuard" },
      { property: "og:description", content: "The screening workflow, inputs, outputs and limitations explained." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProsePage title="How it works" intro="A transparent, step-by-step look at the AI KidneyGuard screening workflow.">
      <h2>1. Create a secure account</h2>
      <p>Your health records are tied to your account and visible only to you. Account sign-up is coming in the next release.</p>
      <h2>2. Enter the information you have</h2>
      <p>Age, blood pressure, diabetes and hypertension history, and lab values such as serum creatinine, eGFR and urine albumin-to-creatinine ratio (UACR). Missing values are never replaced with assumed numbers.</p>
      <h2>3. Review the model output</h2>
      <p>You'll see the model's output, the model version, how complete your data was, and which factors contributed. If required information is missing, the result reads “Insufficient information”.</p>
      <h2>4. Track and discuss</h2>
      <p>Save results to your dashboard, follow trends over time, and bring concerning results to a qualified healthcare professional.</p>
      <h2>What the model cannot do</h2>
      <p>It cannot diagnose kidney disease, determine its stage, or predict your future probability of developing it. A classifier trained to distinguish existing CKD cases from controls answers a different question than “will I develop CKD?”.</p>
    </ProsePage>
  ),
});
