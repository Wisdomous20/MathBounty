"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { useWallet } from "@/lib/use-wallet";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
} from "@/lib/contracts";

type BountyListItem = {
  id: string;
  poster: string;
  reward: bigint;
  expiresAt: bigint;
  status: number;
  title: string;
  difficulty?: string;
};

const STATUS_LABELS = ["Open", "Paid", "Expired"];
const STATUS_VARIANTS: BadgeVariant[] = ["success", "warning", "error"];
const MAX_BOUNTIES_TO_LOAD = 50;

function formatDeadline(expiresAt: bigint, status: number) {
  const expiresMs = Number(expiresAt) * 1000;
  const deltaMs = expiresMs - Date.now();

  if (status === 2) return "Reclaimed";
  if (deltaMs <= 0) return "Expired";

  const minutes = Math.ceil(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours}h`;

  return `${Math.ceil(hours / 24)}d`;
}

function getFallbackTitle(id: string) {
  return `Bounty #${id}`;
}

export default function BountiesPage() {
  const { state, address, connect, disconnect, switchNetwork } = useWallet();
  const { getMetadata } = useBountyMetadata();
  const [bounties, setBounties] = useState<BountyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBounties = useCallback(async () => {
    try {
      setLoading(true);
      const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
      const provider = win.ethereum
        ? new ethers.BrowserProvider(win.ethereum)
        : new ethers.JsonRpcProvider("https://rpc.sepolia.org");
      await assertMathBountyContract(provider);
      const contract = new ethers.Contract(
        MATH_BOUNTY_ADDRESS,
        MATH_BOUNTY_ABI,
        provider
      );
      const count = await contract.bountyCount();
      const total = Number(count);
      const start = Math.max(1, total - MAX_BOUNTIES_TO_LOAD + 1);
      const ids = Array.from(
        { length: total - start + 1 },
        (_, index) => total - index
      );

      const loaded = await Promise.all(
        ids.map(async (id) => {
          const data = await contract.getBounty(id);
          const metadata = getMetadata(String(id));

          return {
            id: String(id),
            poster: data[0],
            reward: data[2],
            expiresAt: data[3],
            status: Number(data[4]),
            title: metadata?.title || getFallbackTitle(String(id)),
            difficulty: metadata?.difficulty,
          };
        })
      );

      setBounties(loaded.filter((bounty) => bounty.poster !== ethers.ZeroAddress));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bounties");
    } finally {
      setLoading(false);
    }
  }, [getMetadata]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBounties();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchBounties]);

  return (
    <main className="min-h-screen bg-surface text-ink">
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
              href="/new"
              className="hidden sm:inline-flex items-center justify-center px-5 py-3 text-xs font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal"
            >
              Post Bounty
            </Link>
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

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-12 md:mb-16">
          <div className="font-mono text-xs text-brand uppercase tracking-[0.3em] mb-4">
            Browse
          </div>
          <h1
            className="font-display font-bold text-ink leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(4rem, 12vw, 10rem)" }}
          >
            All
            <br />
            Bounties
          </h1>
        </div>

        <div className="border-2 border-border">
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_120px] gap-6 border-b-2 border-border bg-surface-sunken px-6 py-4 font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
            <div>Problem</div>
            <div>Reward</div>
            <div>Status</div>
            <div>Deadline</div>
          </div>

          {loading && (
            <div className="px-6 py-10 font-mono text-xs text-ink-faint uppercase tracking-[0.2em] animate-pulse">
              Loading bounties from chain...
            </div>
          )}

          {error && (
            <div className="px-6 py-10">
              <div className="font-mono text-xs text-error uppercase tracking-[0.2em] mb-3">
                Error
              </div>
              <p className="text-ink-muted">{error}</p>
            </div>
          )}

          {!loading && !error && bounties.length === 0 && (
            <div className="px-6 py-10">
              <div className="font-display text-3xl font-bold text-ink mb-3">
                NO BOUNTIES POSTED
              </div>
              <p className="text-ink-muted mb-6">
                The contract has not recorded any bounties yet.
              </p>
              <Link
                href="/new"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal"
              >
                Post First Bounty
              </Link>
            </div>
          )}

          {!loading && !error && bounties.length > 0 && (
            <div className="divide-y-2 divide-border">
              {bounties.map((bounty) => (
                <Link
                  key={bounty.id}
                  href={`/bounty/${bounty.id}`}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px] gap-4 md:gap-6 px-6 py-6 bg-surface hover:bg-surface-raised focus-visible:outline-[3px] focus-visible:outline-brand focus-visible:outline-offset-[-3px] transition-colors duration-fast"
                >
                  <div>
                    <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-2">
                      Bounty #{bounty.id}
                      {bounty.difficulty ? ` / ${bounty.difficulty}` : ""}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight text-ink">
                      {bounty.title}
                    </h2>
                    <div className="mt-3 font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
                      Poster {bounty.poster.slice(0, 6)}...{bounty.poster.slice(-4)}
                    </div>
                  </div>

                  <div>
                    <div className="md:hidden font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-1">
                      Reward
                    </div>
                    <div className="font-mono text-brand font-bold tabular-nums">
                      {ethers.formatEther(bounty.reward)} ETH
                    </div>
                  </div>

                  <div>
                    <div className="md:hidden font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-1">
                      Status
                    </div>
                    <Badge variant={STATUS_VARIANTS[bounty.status] ?? "default"}>
                      {STATUS_LABELS[bounty.status] ?? "Unknown"}
                    </Badge>
                  </div>

                  <div>
                    <div className="md:hidden font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-1">
                      Deadline
                    </div>
                    <div className="font-mono text-sm text-ink-muted">
                      {formatDeadline(bounty.expiresAt, bounty.status)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
