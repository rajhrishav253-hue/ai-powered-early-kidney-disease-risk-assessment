import { createFileRoute } from "@tanstack/react-router";
import { ProsePage } from "@/components/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AI KidneyGuard" },
      { name: "description", content: "How AI KidneyGuard handles and protects your health information." },
      { property: "og:title", content: "Privacy Policy — AI KidneyGuard" },
      { property: "og:description", content: "Your data is private to you, exportable, and deletable." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProsePage title="Privacy policy" intro="Draft summary — to be reviewed before launch.">
      <h2>What we store</h2>
      <p>Only the profile details, health measurements and assessments you choose to enter.</p>
      <h2>Who can see it</h2>
      <p>Only you. Records are restricted to your account.</p>
      <h2>Your control</h2>
      <p>You can export your data or permanently delete it from your account at any time.</p>
    </ProsePage>
  ),
});
