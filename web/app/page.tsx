"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/hero/hero-section";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWallet } from "@/lib/use-wallet";

export default function Home() {
  const router = useRouter();
  const { state, address, connect, disconnect, switchNetwork } = useWallet();

  const handleConnect = async () => {
    const connectedAddress = await connect();
    if (connectedAddress) {
      router.push("/new");
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface text-ink font-body selection:bg-brand-glow">
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-brand focus:text-surface focus:text-sm focus:font-bold focus:uppercase focus:tracking-widest"
      >
        Skip to content
      </a>

      {/* Navigation — stark, no blur, harsh lines */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-18 md:h-20 flex items-center justify-between">
          <Link href="/" className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-ink hover:text-brand transition-colors duration-fast glitch-hover">
            MathBounty
          </Link>
          <nav className="hidden md:flex items-center gap-12 text-sm font-bold tracking-wide text-ink-muted uppercase">
            <Link href="/bounties" className="hover:text-brand active:opacity-70 transition-all duration-fast">Bounties</Link>
            <Link href="#mechanism" className="hover:text-brand active:opacity-70 transition-all duration-fast">Mechanism</Link>
            <Link href="#docs" className="hover:text-brand active:opacity-70 transition-all duration-fast">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WalletConnectState
              state={state}
              address={address ?? undefined}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onSwitchNetwork={switchNetwork}
            />
          </div>
        </div>
      </header>

      <main id="main-content" className="relative">
        {/* Noise overlay across entire page */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-50 mix-blend-overlay"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`
             }}
        />

        {/* Hero — Live Blockchain Pylon */}
        <HeroSection />

        {/* Stats Band — massive engineering readout */}
        <section className="border-y-2 border-border bg-surface-sunken relative overflow-hidden">
          {/* Section label */}
          <div className="absolute top-0 left-0 font-mono text-[11px] text-ink-faint uppercase tracking-[0.3em] px-6 py-2">
            SYSTEM_METRICS_v1.0
          </div>

          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8 md:gap-4 reveal-container">
              {[
                { label: "Total Escrowed", value: "18.5", unit: "ETH", row: "R01" },
                { label: "Active Bounties", value: "47", unit: "", row: "R02" },
                { label: "Proven Solutions", value: "12", unit: "", row: "R03" },
                { label: "Avg. Reward", value: "2.1", unit: "ETH", row: "R04" },
              ].map((stat) => (
                <div key={stat.label} className="reveal-item relative group" tabIndex={0}>
                  {/* Row marker */}
                  <div className="absolute -top-6 left-0 font-mono text-[11px] text-ink-faint opacity-40">
                    {stat.row}
                  </div>
                  <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-3">
                    {stat.label}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-display font-bold text-ink leading-[0.85] tabular-nums group-hover:text-brand transition-colors duration-slow"
                      style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
                    >
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="font-mono text-sm md:text-base text-brand font-bold">{stat.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 md:mt-16 flex items-center justify-end gap-3 reveal-item">
              <span className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.2em]">
                Example Metrics — On-chain data coming soon
              </span>
            </div>
          </div>
          {/* Structural horizontal lines */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand opacity-15" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand opacity-15" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-border hidden lg:block" />
          <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-border hidden lg:block" />
        </section>

        {/* Mechanism Design — vertical stack with massive ghost numbers */}
        <section id="mechanism" className="py-40 md:py-56 lg:py-64 px-6 border-b-2 border-border relative overflow-hidden">
          {/* Background structural numbers */}
          <div
            className="absolute top-20 right-0 font-display font-bold text-ink opacity-[0.02] leading-none select-none pointer-events-none whitespace-nowrap"
            style={{ fontSize: "clamp(12rem, 30vw, 26rem)" }}
          >
            PROTOCOL
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="mb-24 md:mb-36 reveal-container">
              <span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">Protocol</span>
              <h2
                className="reveal-item font-display font-bold text-ink leading-[0.85] tracking-tight"
                style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
              >
                Mechanism
                <br />
                Design
              </h2>
            </div>

            <div className="space-y-0 reveal-container">
              {[
                { num: "01", title: "Post", desc: "Define your mathematical problem and escrow ETH into the smart contract. Set a deadline, difficulty tier, and collateral requirements. The problem hash is immutably recorded on-chain." },
                { num: "02", title: "Claim", desc: "Solvers stake collateral to claim the bounty, committing to deliver a verifiable solution before the clock runs out. Only one solver may claim at a time." },
                { num: "03", title: "Verify", desc: "Submit a cryptographic proof or zero-knowledge argument. The contract verifies correctness deterministically on-chain without human judgment or centralized oracle." },
                { num: "04", title: "Payout", desc: "Upon verification, the escrowed ETH is released atomically to the solver. No human intervention. No dispute resolution. The contract executes exactly what was agreed." },
              ].map((step) => (
                <div key={step.num} className="relative border-t-2 border-border py-20 md:py-28 group">
                  {/* Massive ghost number — visible, structural */}
                  <div
                    className="absolute top-0 left-0 font-display font-bold text-ink opacity-[0.04] leading-none select-none pointer-events-none -translate-y-1/3"
                    style={{ fontSize: 'clamp(12rem, 28vw, 24rem)' }}
                  >
                    {step.num}
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                    <div className="md:col-span-2 flex items-baseline gap-3">
                      <span className="font-mono text-lg text-brand font-bold">{step.num}</span>
                      <div className="hidden md:block w-12 h-[3px] bg-brand opacity-40 mt-4" />
                    </div>
                    <div className="md:col-span-3">
                      <h3
                        className="font-display font-bold text-ink group-hover:text-brand transition-colors duration-normal"
                        style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <div className="md:col-span-7">
                      <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Bounties — spec-sheet cards with asymmetric grid */}
        <section id="bounties" className="py-40 md:py-56 lg:py-64 px-6 bg-surface-sunken relative overflow-hidden">
          {/* Background watermark */}
          <div
            className="absolute bottom-0 right-0 font-display font-bold text-ink opacity-[0.015] leading-none select-none pointer-events-none whitespace-nowrap translate-y-1/4"
            style={{ fontSize: "clamp(10rem, 25vw, 22rem)" }}
          >
            BOUNTIES
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 md:mb-28 gap-6 reveal-container">
              <div>
                <span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">Live</span>
                <h2
                  className="reveal-item font-display font-bold text-ink leading-[0.85] tracking-tight"
                  style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
                >
                  Open
                  <br />
                  Bounties
                </h2>
              </div>
              <Link href="/bounties" className="reveal-item font-mono text-sm text-brand font-bold hover:text-ink active:opacity-70 transition-all duration-fast uppercase tracking-widest">
                View All →
              </Link>
            </div>

            {/* Asymmetric grid — first card spans full width on mobile, large on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 reveal-container">
              {[
                { title: "Prove NP-completeness of Graph Isomorphism under promise constraints", reward: "2.50", status: "Open", deadline: "14 days", id: "#1042", size: "large" },
                { title: "Novel Zero-Knowledge Proof for Integer Factorization with sub-linear verification", reward: "5.00", status: "Open", deadline: "30 days", id: "#1041", size: "normal" },
                { title: "Closed-form solution for 3D Navier-Stokes existence in bounded domains", reward: "10.00", status: "Open", deadline: "90 days", id: "#1039", size: "normal" },
                { title: "Optimal comparison-based sorting lower bound for partially ordered sets", reward: "1.20", status: "Claimed", deadline: "7 days", id: "#1038", size: "large" },
              ].map((bounty, i) => (
                <div
                  key={i}
                  className={`reveal-item group relative border-2 border-border bg-surface p-6 md:p-8 hover:border-brand hover:-translate-y-1 focus-within:border-brand focus-within:-translate-y-1 transition-all duration-normal ${
                    bounty.size === 'large'
                      ? 'md:col-span-7'
                      : 'md:col-span-5'
                  }`}
                >
                  {/* Status badge — top right, stamped style */}
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <span className={`inline-block font-mono text-xs font-bold uppercase tracking-[0.2em] px-2 py-1 border ${
                      bounty.status === 'Open' ? 'border-success text-success bg-success/10' :
                      bounty.status === 'Claimed' ? 'border-brand text-brand bg-brand/10' :
                      bounty.status === 'Expired' ? 'border-error text-error bg-error/10' :
                      bounty.status === 'Paid' ? 'border-success text-success bg-success/10' :
                      'border-brand text-brand'
                    }`}>
                      {bounty.status}
                    </span>
                  </div>

                  {/* Bounty ID — top left */}
                  <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-6">
                    Bounty {bounty.id}
                  </div>

                  {/* Title — larger for large cards, linked for keyboard access */}
                  <h3 className={`font-display font-bold text-ink mb-8 leading-tight pr-20 ${
                    bounty.size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
                  }`}>
                    <Link
                      href={`/bounty/${bounty.id.slice(1)}`}
                      className="hover:text-brand focus-visible:outline-[3px] focus-visible:outline-brand focus-visible:outline-offset-[3px] transition-colors duration-fast"
                    >
                      {bounty.title}
                    </Link>
                  </h3>

                  {/* Footer info */}
                  <div className="flex items-end justify-between border-t-2 border-border pt-4">
                    <div>
                      <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-1">Reward</div>
                      <div className="font-mono text-2xl md:text-4xl font-bold text-brand tabular-nums">
                        {bounty.reward}
                        <span className="text-sm text-ink-muted ml-1">ETH</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-1">Deadline</div>
                      <div className="font-mono text-sm text-ink-muted">{bounty.deadline}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — aggressive framed composition */}
        <section className="py-40 md:py-56 lg:py-64 px-6 border-b-2 border-border relative overflow-hidden">
          {/* Diagonal structural lines */}
          <div className="absolute top-0 left-[10%] w-[1px] h-full bg-border opacity-50" />
          <div className="absolute top-0 right-[20%] w-[1px] h-full bg-border opacity-30" />

          <div className="max-w-6xl mx-auto reveal-container">
            <div className="reveal-item relative border-2 border-brand p-8 md:p-16 lg:p-24">
              {/* Corner bracket decorations — larger, more aggressive */}
              <div className="absolute -top-[2px] -left-[2px] w-20 h-20 md:w-24 md:h-24 border-t-[3px] border-l-[3px] border-brand bg-surface" />
              <div className="absolute -top-[2px] -right-[2px] w-20 h-20 md:w-24 md:h-24 border-t-[3px] border-r-[3px] border-brand bg-surface" />
              <div className="absolute -bottom-[2px] -left-[2px] w-20 h-20 md:w-24 md:h-24 border-b-[3px] border-l-[3px] border-brand bg-surface" />
              <div className="absolute -bottom-[2px] -right-[2px] w-20 h-20 md:w-24 md:h-24 border-b-[3px] border-r-[3px] border-brand bg-surface" />

              <h2
                className="font-display font-bold text-ink mb-8 leading-[0.85] tracking-tight"
                style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
              >
                Ready to
                <br />
                <span className="text-brand">prove</span>
                <br />
                something?
              </h2>

              <p className="text-lg md:text-xl text-ink-muted mb-12 max-w-xl leading-relaxed">
                Whether you&apos;re a researcher with a hard problem or a solver with a sharp mind, the marketplace is open. No permissions. No gatekeepers.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center px-12 py-5 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
                >
                  Post a Bounty
                </Link>
                <Link
                  href="/bounties"
                  className="inline-flex items-center justify-center px-12 py-5 text-sm font-bold tracking-widest uppercase border-2 border-border-strong text-ink hover:border-brand hover:text-brand active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
                >
                  Start Solving
                </Link>
                <Link
                  href="#docs"
                  className="font-mono text-sm text-ink-muted hover:text-brand transition-colors duration-fast uppercase tracking-widest hidden sm:inline-flex"
                >
                  Read docs →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer — stark terminal aesthetic */}
      <footer className="border-t-2 border-border py-20 md:py-24 px-6 bg-surface-sunken relative overflow-hidden">
        {/* Massive clipped watermark */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display font-bold text-ink opacity-[0.015] leading-none select-none pointer-events-none whitespace-nowrap translate-y-1/3"
          style={{ fontSize: "clamp(10rem, 22vw, 20rem)" }}
        >
          MATHBOUNTY
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div>
              <div className="font-display text-4xl md:text-5xl font-extrabold text-ink mb-3">MathBounty</div>
              <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                Decentralized Mathematics — Sepolia Network
              </div>
            </div>
            <div className="flex flex-wrap gap-10 text-sm font-bold text-ink-muted uppercase tracking-wider">
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand active:opacity-70 transition-all">GitHub</Link>
              <Link href="#docs" className="hover:text-brand active:opacity-70 transition-all">Docs</Link>
              <span className="text-ink-faint opacity-50 cursor-not-allowed line-through" aria-disabled="true">[OFFLINE] Contract</span>
            </div>
          </div>

          {/* Bottom line — more aggressive */}
          <div className="mt-16 pt-8 border-t-2 border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                © 2026 MathBounty Protocol
              </div>
              <div className="flex gap-6 font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                <Link href="/privacy" className="hover:text-ink active:opacity-70 transition-all">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-ink active:opacity-70 transition-all">Terms of Service</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-success animate-pulse" />
              <span className="font-mono text-xs text-success uppercase tracking-[0.2em]">Protocol Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
