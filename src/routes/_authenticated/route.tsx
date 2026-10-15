import { createFileRoute, Outlet } from "@tanstack/react-router";

// Public demo mode: allow visitors to explore assessment pages without signing in.
export const Route = createFileRoute("/_authenticated")({
  component: () => <Outlet />,
});
