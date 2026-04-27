"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { ThemeToggle } from "@/components/theme-toggle";
import { BountyCard } from "@/components/ui/bounty-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { ConnectWalletPrompt } from "@/components/ui/connect-wallet-prompt";
import { useBountyList } from "@/lib/use-bounty-list";
import { useWallet } from "@/lib/use-wallet";

function formatReward(reward: bigint) {
  return `${Number(ethers.formatEther(reward)).toFixed(4)} ETH`;
}

function formatCountdown(expiresAt: bigint, nowSeconds: number) {
  const remaining = Number(expiresAt) - nowSeconds;
  if (remaining <= 0) return "Expired";

  const minutes = Math.ceil(remaining / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours}h`;

  return `${Math.ceil(hours / 24)}d`;
}

function BountyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-[220px]" />
      ))}
    </div>
  );
}

export function BountyBrowser() {
  const { state, address, connect, disconnect, switchNetwork } = useWallet();
  const { bounties, loading, error, lastUpdatedAt, retry } = useBountyList(address);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [showErrorToast, setShowErrorToast] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowErrorToast(Boolean(error) && state === "connected");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [error, state]);

  const handleConnect = async () => {
    const connected = await connect();
    if (!connected) return;
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface text-ink font-body selection:bg-brand-glow">
      <a
        href="#open-bounties"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-brand focus:text-surface focus:text-sm focus:font-bold focus:uppercase focus:tracking-widest"
      >
        Skip to bounties
      </a>

      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-[72px] md:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-ink hover:text-brand transition-colors duration-fast"
          >
            MathBounty
          </Link>
          <div className="flex items-center gap-3">
            {state === "connected" && (
              <>
                <Link
                  href="/me/posts"
                  className="hidden sm:inline-flex items-center justify-center px-5 py-3 text-xs font-bold tracking-widest uppercase bg-surface-raised border border-border text-ink hover:border-brand hover:text-brand active:translate-y-[1px] transition-all duration-normal"
                >
                  My Dashboard
                </Link>
                <Link
                  href="/new"
                  className="hidden sm:inline-flex items-center justify-center px-5 py-3 text-xs font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal"
                >
                  Post Bounty
                </Link>
              </>
            )}
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

      <main id="open-bounties" className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-end mb-10 md:mb-14">
            <div>
              <div className="font-mono text-xs text-brand uppercase tracking-[0.3em] mb-4">
                Live Sepolia Market
              </div>
              <h1
                className="font-display font-bold text-ink leading-[0.85] tracking-tight"
                style={{ fontSize: "clamp(4rem, 12vw, 10rem)" }}
              >
                Open
                <br />
                Bounties
              </h1>
            </div>
            {state === "connected" && (
              <div className="border-2 border-border bg-surface-raised p-5">
                <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-2">
                  Chain Status
                </div>
                <div className="font-mono text-sm text-ink-muted">
                  {lastUpdatedAt
                    ? `Updated ${new Date(lastUpdatedAt).toLocaleTimeString()}`
                    : "Waiting for first sync"}
                </div>
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={() => void retry()}>
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>

          {state !== "connected" ? (
            <div className="max-w-2xl mx-auto">
              <ConnectWalletPrompt 
                title="Connect Wallet to Browse"
                description="MathBounty uses the Sepolia testnet. Connect your wallet to view open bounties, submit solutions, and track your progress."
              />
            </div>
          ) : (
            <>
              {loading && <BountyGridSkeleton />}

              {!loading && error && (
                <div className="border-2 border-error bg-surface-raised p-8">
                  <div className="font-mono text-xs text-error uppercase tracking-[0.2em] mb-3">
                    RPC Fetch Failed
                  </div>
                  <p className="text-ink-muted mb-6">{error}</p>
                  <Button type="button" onClick={() => void retry()}>
                    Retry
                  </Button>
                </div>
              )}

              {!loading && !error && bounties.length === 0 && (
                <EmptyState
                  title="No open bounties yet - be the first to post one"
                  actionHref="/new"
                  actionLabel="Post a bounty"
                />
              )}

              {!loading && !error && bounties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {bounties.map((bounty) => (
                    <Link key={bounty.id} href={`/bounty/${bounty.id}`} className="block">
                      <BountyCard
                        status="Open"
                        title={bounty.title}
                        reward={formatReward(bounty.reward)}
                        deadline={formatCountdown(bounty.expiresAt, nowSeconds)}
                        proposer={bounty.poster}
                        className="h-full border-2 hover:border-brand"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <div className="fixed top-20 right-4 z-50 w-full max-w-sm">
        <Toast
          visible={showErrorToast}
          variant="error"
          title="Bounty fetch failed"
          description={error ?? undefined}
          onDismiss={() => setShowErrorToast(false)}
        />
      </div>
    </div>
  );
}
