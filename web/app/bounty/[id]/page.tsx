"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { Badge } from "@/components/ui/badge";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { useWallet } from "@/lib/use-wallet";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import { MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI } from "@/lib/contracts";

type Bounty = {
  poster: string;
  answerHash: string;
  reward: bigint;
  expiresAt: bigint;
  status: number;
};

const STATUS_LABELS = ["Open", "Paid", "Expired"];
const STATUS_VARIANTS: Array<"success" | "warning" | "default"> = [
  "success",
  "warning",
  "default",
];

export default function BountyPage() {
  const params = useParams();
  const { state, address, connect, disconnect, switchNetwork } = useWallet();
  const { getMetadata } = useBountyMetadata();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bountyId = params.id as string;

  // Load off-chain metadata synchronously during render
  const metadata = getMetadata(bountyId);

  useEffect(() => {
    if (!bountyId) return;

    const fetchBounty = async () => {
      try {
        const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
        let provider: ethers.Provider;
        if (win.ethereum) {
          provider = new ethers.BrowserProvider(win.ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
        }
        const contract = new ethers.Contract(
          MATH_BOUNTY_ADDRESS,
          MATH_BOUNTY_ABI,
          provider
        );
        const data = await contract.getBounty(bountyId);
        setBounty({
          poster: data[0],
          answerHash: data[1],
          reward: data[2],
          expiresAt: data[3],
          status: Number(data[4]),
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };

    fetchBounty();
  }, [bountyId, getMetadata]);

  const expiresAtDate = bounty
    ? new Date(Number(bounty.expiresAt) * 1000)
    : null;

  return (
    <main className="flex min-h-screen flex-col bg-surface">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-[72px] md:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-ink hover:text-brand transition-colors duration-fast"
          >
            MathBounty
          </Link>
          <WalletConnectState
            state={state}
            address={address ?? undefined}
            onConnect={connect}
            onDisconnect={disconnect}
            onSwitchNetwork={switchNetwork}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          {loading && (
            <div className="border-2 border-border bg-surface-raised p-12">
              <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.3em] animate-pulse">
                Loading bounty data from chain…
              </div>
            </div>
          )}

          {error && (
            <div className="border-2 border-error bg-surface-raised p-12">
              <div className="font-mono text-xs text-error uppercase tracking-[0.3em] mb-4">
                Error
              </div>
              <p className="text-lg text-ink">{error}</p>
            </div>
          )}

          {!loading && !error && !bounty && (
            <div className="border-2 border-border bg-surface-raised p-12 text-center">
              <div
                className="font-display font-bold text-ink opacity-[0.04] leading-none select-none pointer-events-none mb-6"
                style={{ fontSize: "clamp(6rem, 15vw, 12rem)" }}
              >
                404
              </div>
              <p className="text-lg text-ink-muted mb-6">Bounty not found</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal"
              >
                Return Home
              </Link>
            </div>
          )}

          {bounty && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
              {/* ═══════════════ LEFT: Main info ═══════════════ */}
              <div className="lg:col-span-8 space-y-8">
                {/* Title block */}
                <div className="border-2 border-border bg-surface-raised p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
                      Bounty #{bountyId}
                    </div>
                    <Badge variant={STATUS_VARIANTS[bounty.status]}>
                      {STATUS_LABELS[bounty.status]}
                    </Badge>
                  </div>

                  <h1
                    className="font-display font-bold text-ink leading-[0.9] tracking-tight mb-6"
                    style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                  >
                    {metadata?.title || `Bounty #${bountyId}`}
                  </h1>

                  {metadata?.description ? (
                    <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-3xl">
                      {metadata.description}
                    </p>
                  ) : (
                    <p className="text-base text-ink-faint font-mono leading-relaxed">
                      No problem statement provided for this bounty.
                    </p>
                  )}

                  {(metadata?.tags?.length || metadata?.difficulty) && (
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
                      {metadata?.difficulty && (
                        <Badge variant="brand" size="sm">
                          {metadata.difficulty}
                        </Badge>
                      )}
                      {metadata?.tags?.map((tag) => (
                        <Badge key={tag} variant="default" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-border">
                  {[
                    {
                      label: "Reward",
                      value: `${ethers.formatEther(bounty.reward)} ETH`,
                      accent: true,
                    },
                    {
                      label: "Status",
                      value: STATUS_LABELS[bounty.status],
                      accent: false,
                    },
                    {
                      label: "Expires",
                      value: expiresAtDate
                        ? expiresAtDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—",
                      accent: false,
                    },
                    {
                      label: "Poster",
                      value: `${bounty.poster.slice(0, 6)}…${bounty.poster.slice(-4)}`,
                      accent: false,
                    },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className={`p-4 md:p-5 ${
                        i < 3 ? "border-r-0 md:border-r-2" : ""
                      } border-border ${i < 2 ? "border-b-2 md:border-b-0" : ""}`}
                    >
                      <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em] mb-2">
                        {stat.label}
                      </div>
                      <div
                        className={`font-mono text-sm md:text-base font-bold tabular-nums ${
                          stat.accent ? "text-brand" : "text-ink"
                        }`}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════════════ RIGHT: On-chain data ═══════════════ */}
              <div className="lg:col-span-4 space-y-6">
                <div className="border-2 border-border bg-surface-sunken p-1">
                  <div className="px-3 py-2 border-b border-border bg-surface-raised">
                    <span className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.2em]">
                      On-Chain Data
                    </span>
                  </div>
                  <div className="p-4 font-mono text-xs space-y-4">
                    <div>
                      <div className="text-ink-faint uppercase tracking-wider mb-1">
                        Poster Address
                      </div>
                      <div className="text-ink break-all">{bounty.poster}</div>
                    </div>
                    <div>
                      <div className="text-ink-faint uppercase tracking-wider mb-1">
                        Answer Hash
                      </div>
                      <div className="text-ink-muted break-all text-[10px] leading-relaxed">
                        {bounty.answerHash}
                      </div>
                    </div>
                    <div>
                      <div className="text-ink-faint uppercase tracking-wider mb-1">
                        Expires At
                      </div>
                      <div className="text-ink-muted">
                        {expiresAtDate?.toLocaleString("en-US")}
                      </div>
                    </div>
                    <div>
                      <div className="text-ink-faint uppercase tracking-wider mb-1">
                        Raw Reward (wei)
                      </div>
                      <div className="text-ink-muted">
                        {bounty.reward.toString()}
                      </div>
                    </div>
                  </div>
                </div>

                {metadata?.solverStake && (
                  <div className="border border-border bg-surface-raised p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-brand text-brand text-xs font-bold">
                        i
                      </span>
                      <div>
                        <div className="font-mono text-[10px] text-brand uppercase tracking-[0.2em] mb-1">
                          Solver Requirements
                        </div>
                        <p className="text-sm text-ink-muted">
                          Minimum stake required to claim:{" "}
                          <span className="text-ink font-mono">
                            {metadata.solverStake} ETH
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="border-2 border-brand p-6 bg-surface">
                  <h3 className="font-display font-bold text-ink text-xl mb-3">
                    HAVE A SOLUTION?
                  </h3>
                  <p className="text-sm text-ink-muted mb-6 leading-relaxed">
                    If you can prove the answer, submit it to claim the
                    escrowed reward.
                  </p>
                  <button className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal">
                    Submit Answer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
