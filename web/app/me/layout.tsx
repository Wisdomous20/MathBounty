"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { useWallet } from "@/lib/use-wallet";
import { Tabs } from "@/components/ui/tabs";
import { useUserBounties } from "@/lib/use-user-bounties";
import { useUserSolves } from "@/lib/use-user-solves";
import { useBalance } from "@/lib/use-balance";

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, address, provider, connect, disconnect, switchNetwork } = useWallet();
  const { bounties } = useUserBounties(address);
  const { solves } = useUserSolves(address);
  const { balance, loading: balanceLoading } = useBalance(address, provider);

  const tabs = [
    { label: "My Posts", href: "/me/posts", count: address ? bounties.length : undefined },
    { label: "My Solves", href: "/me/solved", count: address ? solves.length : undefined },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-surface text-ink font-body">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-[72px] md:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-ink hover:text-brand transition-colors duration-fast"
          >
            MathBounty
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/bounties"
              className="hidden sm:inline-flex items-center justify-center px-5 py-3 text-xs font-bold tracking-widest uppercase bg-surface-raised border border-border text-ink hover:border-brand hover:text-brand active:translate-y-[1px] transition-all duration-normal"
            >
              Browse Bounties
            </Link>
            <Link
              href="/new"
              className="hidden sm:inline-flex items-center justify-center px-5 py-3 text-xs font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal"
            >
              Post Bounty
            </Link>
            <ThemeToggle />
            <WalletConnectState
              state={state}
              address={address ?? undefined}
              onConnect={connect}
              onDisconnect={disconnect}
              onSwitchNetwork={switchNetwork}
            />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div>
              <div className="font-mono text-xs text-brand uppercase tracking-[0.3em] mb-4">
                Accountability Dashboard
              </div>
              <h1
                className="font-display font-bold text-ink leading-[0.85] tracking-tight"
                style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}
              >
                Personal
                <br />
                Dashboard
              </h1>
            </div>

            {address && (
              <div className="border-2 border-border bg-surface-raised p-6 md:p-8 lg:min-w-[240px] animate-in fade-in slide-in-from-right-4 duration-slow">
                <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-2">
                  Wallet Balance
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl md:text-5xl font-bold text-ink">
                    {balanceLoading && !balance ? "..." : balance}
                  </span>
                  <span className="font-mono text-sm text-brand font-bold uppercase">ETH</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
                    Sepolia Live
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <Tabs items={tabs} className="mt-8" />

          {children}
        </div>
      </main>
    </div>
  );
}
