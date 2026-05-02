"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { BOUNTY_STATUS } from "@/lib/bounty-state";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
  MATH_BOUNTY_DEPLOY_BLOCK,
} from "@/lib/contracts";
import { decodeContractError } from "@/lib/decode-revert";
import { getReadProvider } from "@/lib/read-provider";
import { type BountyMetadata, useBountyMetadata } from "@/lib/use-bounty-metadata";
import { useWallet } from "@/lib/use-wallet";

type BountyTuple = readonly [
  poster: string,
  answerHash: string,
  reward: bigint,
  expiresAt: bigint,
  status: bigint
];

type Outcome = {
  solver: string;
  txHash: string;
};

type ToastState = {
  visible: boolean;
  variant: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
};

function truncateAddress(value: string) {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatReward(reward: bigint) {
  return `${Number(ethers.formatEther(reward)).toFixed(4)} ETH`;
}

function formatRemaining(remainingSeconds: number) {
  if (remainingSeconds <= 0) return "EXPIRED";
  if (remainingSeconds >= 86_400) {
    const days = Math.floor(remainingSeconds / 86_400);
    const hours = Math.floor((remainingSeconds % 86_400) / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function BountyDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const bountyId = Array.isArray(idParam) ? idParam[0] : idParam;
  const { getMetadataBatch } = useBountyMetadata();
  const { state, address, signer, connect, disconnect, switchNetwork } = useWallet();
  const [bounty, setBounty] = useState<BountyTuple | null>(null);
  const [metadata, setMetadata] = useState<BountyMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    variant: "info",
    title: "",
  });

  const showToast = useCallback((next: Omit<ToastState, "visible">) => {
    setToast({ visible: true, ...next });
  }, []);

  const loadBounty = useCallback(async () => {
    if (!bountyId || Number.isNaN(Number(bountyId))) {
      setError("Invalid bounty id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const provider = getReadProvider();
      await assertMathBountyContract(provider);
      const contract = new ethers.Contract(
        MATH_BOUNTY_ADDRESS,
        MATH_BOUNTY_ABI,
        provider
      );
      const data = (await contract.getBounty(bountyId)) as BountyTuple;
      if (data[0] === ethers.ZeroAddress) {
        setBounty(null);
        setOutcome(null);
        setError("No on-chain record found for this bounty.");
        setLoading(false);
        return;
      }

      setBounty(data);
      setError(null);
      const metadataById = await getMetadataBatch([bountyId]);
      setMetadata(metadataById[bountyId] ?? null);

      const chainBountyId = BigInt(bountyId);
      const solvedEvents = await contract.queryFilter(
        contract.filters.BountySolved(chainBountyId),
        MATH_BOUNTY_DEPLOY_BLOCK || 0
      );
      const latestSolved = solvedEvents.at(-1);
      if (latestSolved && "args" in latestSolved) {
        setOutcome({
          solver: latestSolved.args.solver as string,
          txHash: latestSolved.transactionHash,
        });
      } else {
        setOutcome(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bounty.");
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  }, [bountyId, getMetadataBatch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBounty();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBounty]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const expiresAt = bounty ? Number(bounty[3]) : 0;
  const isExpiredByClock = bounty ? nowSeconds > expiresAt : false;
  const statusNumber = bounty ? Number(bounty[4]) : BOUNTY_STATUS.Expired;
  const isOpen = statusNumber === BOUNTY_STATUS.Open;
  const isPoster = bounty && address ? bounty[0].toLowerCase() === address.toLowerCase() : false;
  const canSubmit = Boolean(
    bounty &&
      isOpen &&
      !isExpiredByClock &&
      state === "connected" &&
      !isPoster &&
      answer.trim().length > 0
  );

  const remaining = Math.max(0, expiresAt - nowSeconds);
  const countdownLabel = formatRemaining(remaining);
  const answerHashPreview = answer.trim()
    ? ethers.keccak256(ethers.toUtf8Bytes(answer.trim()))
    : null;

  const statusUi = (() => {
    if (!bounty) return { label: "Unknown", variant: "default" as const };
    if (statusNumber === BOUNTY_STATUS.Paid) {
      return { label: "Paid", variant: "warning" as const };
    }
    if (statusNumber === BOUNTY_STATUS.Expired || isExpiredByClock) {
      return { label: "Expired", variant: "default" as const };
    }
    return { label: "Open", variant: "success" as const };
  })();

  const submitAnswer = async () => {
    if (!signer || !bountyId) return;
    const cleaned = answer.trim();
    if (!cleaned) return;

    setSubmitting(true);
    showToast({
      variant: "info",
      title: "Submitting",
      description: "Waiting for wallet signature and chain confirmation.",
    });

    try {
      await assertMathBountyContract(signer.provider);
      const contract = new ethers.Contract(MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI, signer);
      const tx = await contract.submitAnswer(BigInt(bountyId), cleaned);
      const receipt = await tx.wait();
      const payout = bounty ? formatReward(bounty[2]) : "0 ETH";
      showToast({
        variant: "success",
        title: "Reward Claimed",
        description: `${payout} received. Tx: ${receipt?.hash ?? tx.hash}`,
      });
      setAnswer("");
      await loadBounty();
    } catch (err: unknown) {
      const decoded = decodeContractError(err);
      showToast({
        variant: decoded.variant,
        title: decoded.title,
        description: decoded.description,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface text-ink p-6">
        <div className="max-w-7xl mx-auto border-2 border-border bg-surface-raised p-10 font-mono text-sm uppercase tracking-[0.2em] text-ink-faint">
          Loading bounty...
        </div>
      </main>
    );
  }

  if (!bounty || error) {
    return (
      <main className="min-h-screen bg-surface text-ink p-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title={error ?? "No on-chain record found for this bounty."}
            actionHref="/bounties"
            actionLabel="Back to bounties"
          />
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 h-[72px] md:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-ink hover:text-brand transition-colors duration-fast"
          >
            MathBounty
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="flex-1 reveal-container">
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="border-2 border-border bg-surface-raised p-6 md:p-8 reveal-item">
              <div className="font-mono text-xs text-brand uppercase tracking-[0.3em] mb-4">
                Bounty #{bountyId}
              </div>
              <h1
                className="font-display font-bold text-ink leading-[0.9] tracking-tight uppercase"
                style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
              >
                {metadata?.title || `Bounty #${bountyId}`}
              </h1>
              <p className="mt-4 max-w-[72ch] text-ink-muted">
                {metadata?.description || "On-chain bounty, solve correctly to receive the escrowed reward."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant={statusUi.variant}>{statusUi.label}</Badge>
                {(metadata?.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-2 border-border bg-surface-raised p-6 md:p-8 reveal-item">
              {statusNumber === BOUNTY_STATUS.Paid ? (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-brand uppercase tracking-[0.2em]">Outcome</div>
                  <h2 className="font-display text-4xl uppercase">Bounty Solved</h2>
                  <p className="text-ink-muted">
                    Solver {truncateAddress(outcome?.solver ?? "")} received {formatReward(bounty[2])}.
                  </p>
                </div>
              ) : isOpen && isExpiredByClock ? (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-brand uppercase tracking-[0.2em]">Outcome</div>
                  <h2 className="font-display text-4xl uppercase">Expired</h2>
                  <p className="text-ink-muted">
                    This bounty expired before a valid solution was submitted.
                  </p>
                </div>
              ) : isPoster ? (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-brand uppercase tracking-[0.2em]">Submission</div>
                  <h2 className="font-display text-4xl uppercase">Poster View</h2>
                  <p className="text-ink-muted">You can&apos;t solve your own bounty.</p>
                  <Button disabled variant="secondary">
                    YOU CAN&apos;T SOLVE YOUR OWN BOUNTY
                  </Button>
                </div>
              ) : state !== "connected" ? (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-brand uppercase tracking-[0.2em]">Submission</div>
                  <h2 className="font-display text-4xl uppercase">Connect Wallet</h2>
                  <p className="text-ink-muted">Connect a Sepolia wallet to submit your answer.</p>
                  <Button onClick={() => void connect()}>CONNECT WALLET REQUIRED</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-brand uppercase tracking-[0.2em]">Submission</div>
                  <h2 className="font-display text-4xl uppercase">Submit Solution</h2>
                  <Input
                    id="answer"
                    label="Answer"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Enter your solution"
                  />
                  <Button
                    onClick={() => void submitAnswer()}
                    isLoading={submitting}
                    disabled={!canSubmit}
                  >
                    {submitting ? "SUBMITTING..." : `CLAIM ${formatReward(bounty[2])}`}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="border-2 border-border bg-surface-sunken p-1 reveal-item">
              <div className="px-3 py-2 border-b border-border bg-surface-raised">
                <span className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                  Chain Readout
                </span>
              </div>
              <div className="p-4 font-mono text-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-ink-faint uppercase tracking-wider">Reward</span>
                  <span className="text-brand tabular-nums">{formatReward(bounty[2])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint uppercase tracking-wider">Poster</span>
                  <span className="text-ink">{truncateAddress(bounty[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint uppercase tracking-wider">Deadline</span>
                  <span className={remaining < 3600 ? "text-brand tabular-nums" : "text-ink tabular-nums"}>
                    {countdownLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-faint uppercase tracking-wider">Answer Hash</span>
                  <span className="text-ink truncate">{truncateAddress(bounty[1])}</span>
                </div>
                {answerHashPreview && (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-faint uppercase tracking-wider">Your Hash</span>
                    <span className="text-brand truncate">{truncateAddress(answerHashPreview)}</span>
                  </div>
                )}
                {outcome && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-faint uppercase tracking-wider">Solver</span>
                      <span className="text-ink">{truncateAddress(outcome.solver)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-faint uppercase tracking-wider">Tx</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${outcome.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand hover:text-brand-dim"
                      >
                        {truncateAddress(outcome.txHash)}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/bounties"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-widest uppercase bg-surface-raised border border-border text-ink hover:border-brand hover:text-brand transition-all duration-normal"
            >
              Back to bounties
            </Link>
          </div>
        </section>
      </main>

      <div className="fixed top-20 right-4 z-50 w-full max-w-sm">
        <Toast
          visible={toast.visible}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      </div>
    </div>
  );
}
