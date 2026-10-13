import { createFileRoute } from "@tanstack/react-router";
import { ProsePage } from "@/components/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — AI KidneyGuard" },
      { name: "description", content: "Terms for using the AI KidneyGuard educational platform." },
      { property: "og:title", content: "Terms of Use — AI KidneyGuard" },
      { property: "og:description", content: "Terms for using AI KidneyGuard." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProsePage title="Terms of use" intro="Draft summary — to be reviewed before launch.">
      <p>By using AI KidneyGuard you agree that it is provided for educational purposes only and that its outputs are not medical advice.</p>
      <p>You are responsible for the accuracy of the information you enter and for seeking professional care where appropriate.</p>
    </ProsePage>
  ),
});
