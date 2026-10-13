import { createFileRoute } from "@tanstack/react-router";
import { ProsePage } from "@/components/site";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Medical Disclaimer — AI KidneyGuard" },
      { name: "description", content: "AI KidneyGuard is an educational tool and does not provide medical diagnoses." },
      { property: "og:title", content: "Medical Disclaimer — AI KidneyGuard" },
      { property: "og:description", content: "Educational risk estimates only, not a diagnosis." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProsePage title="Medical disclaimer" intro="Please read this before using any assessment feature.">
      <p>AI KidneyGuard is an educational screening and risk-awareness tool. It is not a medical device and does not diagnose, treat, or rule out any condition.</p>
      <p>Model outputs are estimates and may be wrong. They cannot replace clinical evaluation, laboratory testing, or advice from a qualified healthcare professional.</p>
      <p>If you experience urgent symptoms, contact emergency services or a medical professional immediately.</p>
    </ProsePage>
  ),
});
