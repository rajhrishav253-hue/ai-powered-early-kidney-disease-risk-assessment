import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ShieldPlus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function SiteHeader() {
  const { session } = useSession();
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldPlus className="h-4 w-4" aria-hidden />
          </span>
          AI KidneyGuard
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/how-it-works" className="hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>How it works</Link>
          <Link to="/disclaimer" className="hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Medical disclaimer</Link>
          <Link to="/privacy" className="hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Privacy</Link>
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link to="/account" className="text-sm font-medium text-foreground hover:underline">My account</Link>
              <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
            </>
          ) : (
            <Link to="/auth" className="text-sm font-medium text-foreground hover:underline">Sign in</Link>
          )}
          <Link to="/assessment" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            Start Risk Assessment
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3">
        <div>
          <p className="font-display font-semibold text-foreground">AI KidneyGuard</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Understand Your Risk. Track Your Health. Take Informed Action.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">About</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How It Works</Link>
          <Link to="/disclaimer" className="hover:text-foreground">Medical Disclaimer</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Use</Link>
        </div>
      </div>
      <p className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        Educational risk-awareness tool only — not a diagnosis. Always consult a qualified healthcare professional.
      </p>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function ProsePage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-5 pt-16">
        <h1 className="text-4xl font-semibold">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        <div className="mt-10 space-y-6 leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold">
          {children}
        </div>
      </section>
    </PageShell>
  );
}
