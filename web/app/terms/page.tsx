import Link from "next/link";

export const metadata = {
  title: "Terms of Service — MathBounty",
  description: "MathBounty terms of service.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-surface text-ink font-body">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-ink">
            MathBounty
          </Link>
          <Link
            href="/"
            className="text-sm font-bold tracking-wide text-ink-muted uppercase hover:text-ink transition-colors duration-fast"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">
            Legal
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-ink mb-12 leading-[0.9] tracking-tight">
            Terms of Service
          </h1>

          <div className="space-y-8 text-ink-muted leading-relaxed">
            <section>
              <h2 className="font-display text-xl font-bold text-ink mb-3 uppercase tracking-wider">1. Acceptance</h2>
              <p>
                By using MathBounty, you agree to these terms. The protocol is open-source software deployed on the
                Sepolia testnet. It is provided as-is without warranties of any kind.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-ink mb-3 uppercase tracking-wider">2. Risks</h2>
              <p>
                Blockchain transactions are irreversible. You are solely responsible for verifying contract addresses,
                reward amounts, and deadlines before posting or claiming a bounty.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-ink mb-3 uppercase tracking-wider">3. Prohibited use</h2>
              <p>
                Do not use MathBounty for illegal activities, harassment, or posting content that violates applicable law.
                The community may flag inappropriate bounties through on-chain governance.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-ink mb-3 uppercase tracking-wider">4. Changes</h2>
              <p>
                These terms may be updated as the protocol evolves. Continued use after changes constitutes acceptance.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t-2 border-border py-8 px-6 bg-surface-sunken">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
            © 2024 MathBounty Protocol
          </div>
          <div className="flex gap-6 font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-ink">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
