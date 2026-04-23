"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ParticleField, type ParticleFieldRef } from "./particle-field";
import { BountyPylon } from "./bounty-pylon";

export function HeroSection() {
  const particleRef = useRef<ParticleFieldRef>(null);

  const handleNewBounty = useCallback(() => {
    particleRef.current?.triggerShockwave();
  }, []);

  // Periodic ambient shockwaves for atmosphere
  useEffect(() => {
    const interval = setInterval(() => {
      particleRef.current?.triggerShockwave();
    }, 8500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-dvh flex flex-col justify-end px-6 pb-16 md:pb-24 pt-32 overflow-hidden bg-grid">
      {/* WebGL Particle Background */}
      <ParticleField ref={particleRef} className="absolute inset-0 z-0" />

      {/* Massive clipped background text — structural, not decorative */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 font-display font-bold text-ink opacity-[0.015] leading-none select-none pointer-events-none whitespace-nowrap z-0"
        style={{ fontSize: "clamp(14rem, 35vw, 30rem)" }}
      >
        MATH
      </div>

      {/* Structural diagonal line — thicker, more aggressive */}
      <div className="absolute top-0 right-[15%] w-[2px] h-[80%] bg-brand opacity-25 origin-top-right rotate-45" />
      <div className="absolute top-[20%] right-[25%] w-[1px] h-[40%] bg-ink opacity-5 origin-top-right rotate-45" />

      {/* Horizontal engineering line */}
      <div className="absolute bottom-[30%] left-0 right-0 h-[1px] bg-border" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left: Extreme typography */}
          <div className="lg:col-span-7 xl:col-span-8 reveal-container">
            <h1
              className="reveal-item font-display font-extrabold leading-[0.8] tracking-tighter text-ink"
              style={{ fontSize: "clamp(5rem, 15vw, 14rem)" }}
            >
              Solve
              <br />
              math.
              <br />
              <span className="text-brand">Earn</span>
              <br />
              <span className="text-brand">ETH</span>
              <span className="text-brand animate-pulse">_</span>
            </h1>

            <p className="reveal-item mt-12 md:mt-16 text-lg md:text-xl text-ink-muted leading-relaxed max-w-lg">
              A trustless marketplace for mathematical bounties. Post a problem,
              escrow ETH, and let the world&apos;s minds compete. Smart contracts
              handle escrow and payouts automatically.
            </p>

            <div className="reveal-item flex flex-wrap gap-4 mt-10">
              <Link
                href="#bounties"
                className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
              >
                View Bounties
              </Link>
              <Link
                href="#mechanism"
                className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase border-2 border-border-strong text-ink hover:border-brand hover:text-brand active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
              >
                Read Protocol
              </Link>
            </div>
          </div>

          {/* Right: Bounty Pylon — breaks grid, overlaps */}
          <div className="lg:col-span-5 xl:col-span-4 lg:-ml-20 xl:-ml-32 relative z-20 reveal-right lg:self-center">
            <BountyPylon onNewBounty={handleNewBounty} />
          </div>
        </div>
      </div>

      {/* Scroll indicator — more terminal-like */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-faint">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
          [SCROLL]
        </span>
        <div className="w-[1px] h-10 bg-ink-faint animate-pulse" />
      </div>
    </section>
  );
}
