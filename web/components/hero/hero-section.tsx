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
    <section className="relative min-h-screen flex flex-col justify-end px-6 pb-16 md:pb-24 pt-32 overflow-hidden bg-grid">
      {/* WebGL Particle Background */}
      <ParticleField ref={particleRef} className="absolute inset-0 z-0" />

      {/* Diagonal accent line */}
      <div className="absolute top-0 right-0 w-[1px] h-[60%] bg-brand opacity-20 origin-top-right rotate-45" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left: Massive typography */}
          <div className="lg:col-span-7 reveal-container">
            <h1
              className="reveal-item font-display font-extrabold leading-[0.85] tracking-tighter text-ink drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)]"
              style={{ fontSize: "clamp(3.5rem, 11vw, 10rem)" }}
            >
              Solve
              <br />
              math.
              <br />
              <span className="text-brand">Earn</span>
              <br />
              <span className="text-brand">ETH.</span>
            </h1>

            <p className="reveal-item mt-10 text-lg md:text-xl text-ink-muted leading-relaxed max-w-lg">
              A trustless marketplace for mathematical bounties. Post a problem,
              escrow ETH, and let the world&apos;s minds compete. No intermediaries.
              Code is law.
            </p>

            <div className="reveal-item flex flex-wrap gap-4 mt-10">
              <Link
                href="#bounties"
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim transition-colors duration-normal"
              >
                View Bounties
              </Link>
              <Link
                href="#mechanism"
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-widest uppercase border-2 border-border-strong text-ink hover:border-brand hover:text-brand transition-colors duration-normal"
              >
                Read Protocol
              </Link>
            </div>
          </div>

          {/* Right: Bounty Pylon */}
          <div className="lg:col-span-5 lg:-ml-12 relative z-20 reveal-right lg:self-center">
            <BountyPylon onNewBounty={handleNewBounty} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-faint">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
          Scroll
        </span>
        <div className="w-[1px] h-8 bg-ink-faint animate-pulse" />
      </div>
    </section>
  );
}
