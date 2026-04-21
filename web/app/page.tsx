import Link from "next/link";
import { HeroSection } from "@/components/hero/hero-section";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-ink font-body selection:bg-brand-glow">
      {/* Navigation — stark, no blur, harsh lines */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-ink">
            MathBounty
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-sm font-bold tracking-wide text-ink-muted uppercase">
            <Link href="#bounties" className="hover:text-ink transition-colors duration-fast">Bounties</Link>
            <Link href="#mechanism" className="hover:text-ink transition-colors duration-fast">Mechanism</Link>
            <Link href="#docs" className="hover:text-ink transition-colors duration-fast">Docs</Link>
          </nav>
          <button className="px-5 py-2 text-sm font-bold tracking-wide border-2 border-border-strong hover:border-brand hover:text-brand transition-colors duration-fast uppercase">
            Connect
          </button>
        </div>
      </header>

      <main className="relative">
        {/* Noise overlay across entire page */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-50 mix-blend-overlay"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`
             }}
        />

        {/* Hero — Live Blockchain Pylon */}
        <HeroSection />

        {/* Stats Band — brutalist engineering readout */}
        <section className="border-y-2 border-border bg-surface-sunken relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 reveal-container">
              {[
                { label: "Total Escrowed", value: "18.5", unit: "ETH" },
                { label: "Active Bounties", value: "47", unit: "" },
                { label: "Proven Solutions", value: "12", unit: "" },
                { label: "Avg. Reward", value: "2.1", unit: "ETH" },
              ].map((stat) => (
                <div key={stat.label} className="reveal-item relative">
                  <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-2">
                    {stat.label}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-none">
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="font-mono text-sm text-brand font-bold">{stat.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Decorative horizontal lines */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-brand opacity-10" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-brand opacity-10" />
        </section>

        {/* Mechanism Design — vertical stack with massive ghost numbers */}
        <section id="mechanism" className="py-32 md:py-40 px-6 border-b-2 border-border relative">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 md:mb-28 reveal-container">
              <span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">Protocol</span>
              <h2 className="reveal-item font-display text-5xl md:text-7xl lg:text-8xl font-bold text-ink leading-[0.9] tracking-tight">
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
                { num: "04", title: "Payout", desc: "Upon verification, the escrowed ETH is released atomically to the solver. No human intervention. No dispute resolution. Code is law, math is truth." },
              ].map((step, i) => (
                <div key={step.num} className="relative border-t-2 border-border py-16 md:py-20 group">
                  {/* Massive ghost number */}
                  <div 
                    className="absolute top-0 left-0 font-display font-bold text-ink opacity-[0.025] leading-none select-none pointer-events-none -translate-y-1/4"
                    style={{ fontSize: 'clamp(10rem, 25vw, 22rem)' }}
                  >
                    {step.num}
                  </div>
                  
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                    <div className="md:col-span-2 flex items-baseline gap-3">
                      <span className="font-mono text-sm text-brand font-bold">{step.num}</span>
                      <div className="hidden md:block w-8 h-[2px] bg-brand opacity-30 mt-3" />
                    </div>
                    <div className="md:col-span-3">
                      <h3 className="font-display text-3xl md:text-4xl font-bold text-ink group-hover:text-brand transition-colors duration-normal">
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

        {/* Open Bounties — spec-sheet cards */}
        <section id="bounties" className="py-32 md:py-40 px-6 bg-surface-sunken relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-20 gap-6 reveal-container">
              <div>
                <span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">Live</span>
                <h2 className="reveal-item font-display text-5xl md:text-7xl lg:text-8xl font-bold text-ink leading-[0.9] tracking-tight">
                  Open
                  <br />
                  Bounties
                </h2>
              </div>
              <Link href="/bounties" className="reveal-item font-mono text-sm text-brand font-bold hover:text-ink transition-colors duration-fast uppercase tracking-widest">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 reveal-container">
              {[
                { title: "Prove NP-completeness of Graph Isomorphism under promise constraints", reward: "2.50", status: "Open", deadline: "14 days", id: "#1042" },
                { title: "Novel Zero-Knowledge Proof for Integer Factorization with sub-linear verification", reward: "5.00", status: "Open", deadline: "30 days", id: "#1041" },
                { title: "Closed-form solution for 3D Navier-Stokes existence in bounded domains", reward: "10.00", status: "Open", deadline: "90 days", id: "#1039" },
                { title: "Optimal comparison-based sorting lower bound for partially ordered sets", reward: "1.20", status: "Claimed", deadline: "7 days", id: "#1038" },
              ].map((bounty, i) => (
                <div 
                  key={i} 
                  className="reveal-item group relative border-2 border-border bg-surface p-6 md:p-8 hover:border-brand transition-colors duration-normal"
                >
                  {/* Status badge — top right, stamped style */}
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <span className={`inline-block font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 border ${bounty.status === 'Open' ? 'border-success text-success' : 'border-brand text-brand'}`}>
                      {bounty.status}
                    </span>
                  </div>
                  
                  {/* Bounty ID — top left */}
                  <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-6">
                    Bounty {bounty.id}
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-display text-xl md:text-2xl font-bold text-ink mb-8 leading-tight pr-20">
                    {bounty.title}
                  </h3>
                  
                  {/* Footer info */}
                  <div className="flex items-end justify-between border-t border-border pt-4">
                    <div>
                      <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-1">Reward</div>
                      <div className="font-mono text-2xl md:text-3xl font-bold text-brand">
                        {bounty.reward}
                        <span className="text-sm text-ink-muted ml-1">ETH</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-1">Deadline</div>
                      <div className="font-mono text-sm text-ink-muted">{bounty.deadline}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — thick framed box with corner brackets */}
        <section className="py-32 md:py-40 px-6 border-b-2 border-border">
          <div className="max-w-5xl mx-auto reveal-container">
            <div className="reveal-item relative border-2 border-brand p-8 md:p-16 lg:p-20">
              {/* Corner bracket decorations */}
              <div className="absolute -top-[2px] -left-[2px] w-16 h-16 border-t-2 border-l-2 border-brand bg-surface" />
              <div className="absolute -top-[2px] -right-[2px] w-16 h-16 border-t-2 border-r-2 border-brand bg-surface" />
              <div className="absolute -bottom-[2px] -left-[2px] w-16 h-16 border-b-2 border-l-2 border-brand bg-surface" />
              <div className="absolute -bottom-[2px] -right-[2px] w-16 h-16 border-b-2 border-r-2 border-brand bg-surface" />
              
              {/* Small label */}
              <span className="font-mono text-[10px] text-brand uppercase tracking-[0.3em] block mb-6">Call to Action</span>
              
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-ink mb-8 leading-[0.95] tracking-tight">
                Ready to
                <br />
                <span className="text-brand">prove</span> something?
              </h2>
              
              <p className="text-lg md:text-xl text-ink-muted mb-10 max-w-xl leading-relaxed">
                Whether you&apos;re a researcher with a hard problem or a solver with a sharp mind, the marketplace is open. No permissions. No gatekeepers.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/post"
                  className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim transition-colors duration-normal"
                >
                  Post a Bounty
                </Link>
                <Link
                  href="/bounties"
                  className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase border-2 border-border-strong text-ink hover:border-brand hover:text-brand transition-colors duration-normal"
                >
                  Start Solving
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer — stark, minimal */}
      <footer className="border-t-2 border-border py-16 px-6 bg-surface-sunken">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="font-display text-3xl font-extrabold text-ink mb-2">MathBounty</div>
              <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                Decentralized Mathematics — Sepolia Network
              </div>
            </div>
            <div className="flex gap-10 text-sm font-bold text-ink-muted uppercase tracking-wider">
              <Link href="#" className="hover:text-ink transition-colors">GitHub</Link>
              <Link href="#" className="hover:text-ink transition-colors">Docs</Link>
              <Link href="#" className="hover:text-ink transition-colors">Contract</Link>
            </div>
          </div>
          
          {/* Bottom decorative line */}
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
              © 2024 MathBounty Protocol
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-success animate-pulse" />
              <span className="font-mono text-[10px] text-success uppercase tracking-[0.2em]">Protocol Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
