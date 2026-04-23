import Link from "next/link";

export const metadata = {
  title: "404 — Page Not Found",
  description: "This page does not exist on MathBounty.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-dvh bg-surface text-ink font-body">
      {/* Navigation — minimal for error page */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-ink">
            MathBounty
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Large ghost number */}
          <div className="font-display text-[clamp(6rem,20vw,14rem)] font-bold text-ink opacity-[0.04] leading-none select-none">
            404
          </div>

          <div className="relative -mt-12 md:-mt-20">
            <span className="font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">
              Error
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-ink mb-6 leading-[0.9] tracking-tight">
              Page not found
            </h1>
            <p className="text-lg text-ink-muted max-w-md mx-auto mb-10 leading-relaxed">
              The page you are looking for does not exist or has been moved.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t-2 border-border py-8 px-6 bg-surface-sunken">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
            © 2026 MathBounty Protocol
          </div>
          <div className="flex gap-6 font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
            <Link href="/privacy" className="hover:text-ink active:opacity-70 transition-all">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink active:opacity-70 transition-all">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
