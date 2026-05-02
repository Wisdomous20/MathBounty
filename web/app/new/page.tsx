"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { useWallet } from "@/lib/use-wallet";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ADDRESS,
  MATH_BOUNTY_ABI,
} from "@/lib/contracts";

/* ------------------------------------------------------------------ */
//  Types
/* ------------------------------------------------------------------ */

type ToastState = {
  visible: boolean;
  variant: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
};

interface FormErrors {
  title?: string;
  description?: string;
  answer?: string;
  reward?: string;
  tags?: string;
}

/* ------------------------------------------------------------------ */
//  Constants
/* ------------------------------------------------------------------ */

const EXPIRY_OPTIONS = [
    { label: "1 Min", seconds: 60 },
  { label: "1 Day", seconds: 86400 },
  { label: "3 Days", seconds: 259200 },
  { label: "7 Days", seconds: 604800 },
  { label: "30 Days", seconds: 2592000 },
] as const;

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"] as const;

const MIN_REWARD_ETH = "0.0001";

/* ------------------------------------------------------------------ */
//  Utilities
/* ------------------------------------------------------------------ */

function formatHash(hash: string | null): string {
  if (!hash) return "—";
  return hash.slice(0, 8) + "…" + hash.slice(-6);
}

function getNowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function getPostedBountyId(receipt: ethers.TransactionReceipt) {
  const contractInterface = new ethers.Interface(MATH_BOUNTY_ABI);

  for (const log of receipt.logs) {
    try {
      const parsedLog = contractInterface.parseLog(log);
      if (parsedLog?.name === "BountyPosted") {
        return parsedLog.args.bountyId.toString();
      }
    } catch {
      // Ignore logs from other contracts in the same transaction.
    }
  }

  throw new Error("BountyPosted event not found in transaction receipt");
}

/* ------------------------------------------------------------------ */
//  Page
/* ------------------------------------------------------------------ */

export default function NewBountyPage() {
  const router = useRouter();
  const {
    state,
    address,
    signer,
    provider,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();
  const { saveMetadata } = useBountyMetadata();
  const isConnected = state === "connected";

  /* ---------- Wallet balance ---------- */
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (!provider || !address) return;
    provider.getBalance(address).then((bal) => {
      setBalance(ethers.formatEther(bal));
    });
  }, [provider, address]);

  /* ---------- Form state ---------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [reward, setReward] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(86400);
  const [difficulty, setDifficulty] = useState("Medium");
  const [tagsRaw, setTagsRaw] = useState("");
  const [solverStake, setSolverStake] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const [isPending, setIsPending] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    variant: "info",
    title: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ---------- Gas estimate ---------- */
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  useEffect(() => {
    if (!signer || !answer.trim() || !reward || parseFloat(reward) <= 0) {
      return;
    }

    signer.provider.getCode(MATH_BOUNTY_ADDRESS).then((bytecode) => {
      if (bytecode === "0x") {
        setGasEstimate(null);
      }
    });

    const contract = new ethers.Contract(
      MATH_BOUNTY_ADDRESS,
      MATH_BOUNTY_ABI,
      signer
    );
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answer.trim()));
    const expiresAt = BigInt(
      Math.floor(Date.now() / 1000) + expirySeconds
    );
    const rewardWei = ethers.parseEther(reward);

    let cancelled = false;
    contract.postBounty
      .estimateGas(answerHash, expiresAt, { value: rewardWei })
      .then((gas) => {
        if (!cancelled) {
          setGasEstimate(ethers.formatEther(gas * BigInt(20_000_000_000))); // 20 gwei fallback
        }
      })
      .catch(() => {
        if (!cancelled) setGasEstimate(null);
      });

    return () => { cancelled = true; };
  }, [signer, answer, reward, expirySeconds]);

  /* ---------- Derived values ---------- */
  const answerHash = useMemo(() => {
    if (!answer.trim()) return null;
    try {
      return ethers.keccak256(ethers.toUtf8Bytes(answer.trim()));
    } catch {
      return null;
    }
  }, [answer]);

  const tagList = useMemo(() => {
    return tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [tagsRaw]);

  const expiryLabel = useMemo(() => {
    return EXPIRY_OPTIONS.find((o) => o.seconds === expirySeconds)?.label ?? "1 Day";
  }, [expirySeconds]);

  const rewardNum = useMemo(() => {
    const n = parseFloat(reward);
    return isNaN(n) ? 0 : n;
  }, [reward]);

  const balanceNum = useMemo(() => parseFloat(balance), [balance]);

  /* ---------- Validation ---------- */
  const errors = useMemo(() => {
    const next: FormErrors = {};

    if (touched.title && !title.trim()) {
      next.title = "Title is required";
    } else if (title.trim().length > 120) {
      next.title = "Title must be under 120 characters";
    }

    if (touched.description && !description.trim()) {
      next.description = "Problem statement is required";
    } else if (description.trim().length > 2000) {
      next.description = "Problem statement must be under 2000 characters";
    }

    if (touched.answer && !answer.trim()) {
      next.answer = "Correct answer is required";
    }

    if (touched.reward && (!reward || parseFloat(reward) < parseFloat(MIN_REWARD_ETH))) {
      next.reward = `Reward must be at least ${MIN_REWARD_ETH} ETH`;
    } else if (touched.reward && rewardNum > balanceNum) {
      next.reward = "Reward exceeds wallet balance";
    }

    if (tagList.length > 5) {
      next.tags = "Maximum 5 tags allowed";
    }

    return next;
  }, [title, description, answer, reward, rewardNum, balanceNum, tagList, touched]);

  /* ---------- Touch handlers ---------- */
  const touch = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  /* ---------- Reset ---------- */
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setAnswer("");
    setReward("");
    setExpirySeconds(86400);
    setDifficulty("Medium");
    setTagsRaw("");
    setSolverStake("");
    setShowAdvanced(false);
    setAcknowledged(false);
    setTouched({});
    setGasEstimate(null);
  }, []);

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      title: true,
      description: true,
      answer: true,
      reward: true,
      tags: true,
    });

    // Inline validation check (state updates are batched, so we can't rely on isValid here)
    const hasTitle = title.trim().length > 0 && title.trim().length <= 120;
    const hasDescription = description.trim().length > 0 && description.trim().length <= 2000;
    const hasAnswer = answer.trim().length > 0;
    const hasReward = reward && parseFloat(reward) >= parseFloat(MIN_REWARD_ETH) && rewardNum <= balanceNum;

    if (!hasTitle || !hasDescription || !hasAnswer || !hasReward) {
      // Scroll to first invalid field after state update
      requestAnimationFrame(() => {
        const firstInvalid =
          !hasTitle ? "title" :
          !hasDescription ? "description" :
          !hasAnswer ? "answer" :
          !hasReward ? "reward" :
          null;
        if (firstInvalid) {
          const el = document.getElementById(firstInvalid);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        }
      });
      return;
    }

    if (!signer) {
      showToast("error", "Wallet Required", "Please connect your wallet first");
      return;
    }

    setIsPending(true);
    try {
      await assertMathBountyContract(signer.provider);
      const contract = new ethers.Contract(
        MATH_BOUNTY_ADDRESS,
        MATH_BOUNTY_ABI,
        signer
      );

      const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answer.trim()));
      const expiresAt = BigInt(getNowSeconds() + expirySeconds);
      const rewardWei = ethers.parseEther(reward);

      const tx = await contract.postBounty(answerHash, expiresAt, {
        value: rewardWei,
      });
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction receipt not available");
      }

      const bountyId = getPostedBountyId(receipt);

      let metadataPersisted = true;

      try {
        await saveMetadata(bountyId, receipt.hash, {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          tags: tagList,
          solverStake: solverStake || undefined,
        });
      } catch {
        metadataPersisted = false;
      }

      showToast(
        metadataPersisted ? "success" : "warning",
        metadataPersisted ? "Bounty Posted" : "Bounty Posted With Warning",
        metadataPersisted
          ? `Bounty #${bountyId} created successfully`
          : `Bounty #${bountyId} was posted on-chain, but shared metadata could not be saved.`
      );

      if (metadataPersisted) {
        router.push(`/bounty/${bountyId}`);
      } else {
        setIsPending(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast("error", "Transaction Failed", msg);
      setIsPending(false);
    }
  };

  const showToast = (
    variant: ToastState["variant"],
    title: string,
    description?: string
  ) => {
    setToast({ visible: true, variant, title, description });
  };

  const hideToast = () => {
    setToast((t) => ({ ...t, visible: false }));
  };

  /* ---------- Render helpers ---------- */
  const sectionLegend = (text: string) => (
    <span className="font-mono text-[11px] text-brand uppercase tracking-[0.2em] px-2">
      {text}
    </span>
  );

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
          {/* Page title */}
          <div className="mb-12 md:mb-20 reveal-container">
            <span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">
              New Transaction
            </span>
            <h1
              className="reveal-item font-display font-bold text-ink leading-[0.85] tracking-tight"
              style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
            >
              POST A
              <br />
              <span className="text-brand">BOUNTY</span>
            </h1>
          </div>

          {!isConnected ? (
            /* ── Wallet gate ── */
            <div className="border-2 border-border bg-surface-raised p-12 md:p-20 flex flex-col items-center gap-8 text-center reveal-container">
              <div className="reveal-item">
                <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.3em] mb-4">
                  Authorization Required
                </div>
                <h2
                  className="font-display font-bold text-ink leading-[0.9]"
                  style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
                >
                  CONNECT WALLET
                  <br />
                  TO CONTINUE
                </h2>
              </div>
              <p className="reveal-item text-lg text-ink-muted max-w-md">
                You need an Ethereum wallet on the Sepolia network to post a
                bounty and escrow ETH.
              </p>
              <div className="reveal-item">
                <Button size="lg" onClick={connect}>
                  Connect Wallet
                </Button>
              </div>
            </div>
          ) : (
            /* ── Form + Preview ── */
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 reveal-container"
            >
              {/* ═══════════════ LEFT: FORM ═══════════════ */}
              <div className="lg:col-span-7 space-y-10">
                {/* ── Problem Definition ── */}
                <fieldset className="border-2 border-border bg-surface-raised p-6 md:p-8 reveal-item">
                  <legend>{sectionLegend("Problem Definition")}</legend>
                  <div className="space-y-6">
                    <Input
                      id="title"
                      label="Title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => touch("title")}
                      error={touched.title ? errors.title : undefined}
                      placeholder="e.g. Prove NP-completeness of Graph Isomorphism"
                      required
                    />

                    <Textarea
                      id="description"
                      label="Problem Statement"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => touch("description")}
                      error={
                        touched.description ? errors.description : undefined
                      }
                      placeholder="Describe the mathematical problem, constraints, and what constitutes a valid solution..."
                      rows={6}
                      required
                    />
                    <div className="flex justify-between">
                      <span
                        className={cn(
                          "text-xs font-mono transition-colors duration-fast",
                          description.length > 1800
                            ? description.length >= 2000
                              ? "text-error"
                              : "text-brand"
                            : "text-ink-faint"
                        )}
                      >
                        {description.length}/2000
                      </span>
                    </div>
                  </div>
                </fieldset>

                {/* ── Solution Parameters ── */}
                <fieldset className="border-2 border-border bg-surface-raised p-6 md:p-8 reveal-item">
                  <legend>{sectionLegend("Solution Parameters")}</legend>
                  <div className="space-y-6">
                    <div>
                      <Input
                        id="answer"
                        label="Correct Answer"
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onBlur={() => touch("answer")}
                        error={touched.answer ? errors.answer : undefined}
                        placeholder="e.g. 42"
                        required
                      />
                      <p className="mt-1.5 text-xs text-ink-faint font-mono leading-relaxed">
                        This value is hashed locally using keccak256 before any
                        network call. Only the hash is stored on-chain.
                      </p>
                    </div>

                    <Input
                      id="reward"
                      label={`Reward (ETH) — min ${MIN_REWARD_ETH}`}
                      type="number"
                      min={MIN_REWARD_ETH}
                      step="0.0001"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      onBlur={() => touch("reward")}
                      error={touched.reward ? errors.reward : undefined}
                      placeholder={MIN_REWARD_ETH}
                      required
                    />

                    {/* Expiry selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-ink-muted font-display uppercase tracking-wider">
                        Expires In
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {EXPIRY_OPTIONS.map((opt) => (
                          <button
                            key={opt.seconds}
                            type="button"
                            aria-pressed={expirySeconds === opt.seconds}
                            onClick={() => setExpirySeconds(opt.seconds)}
                            className={cn(
                              "h-10 border font-mono text-[11px] uppercase tracking-wider transition-all duration-fast",
                              expirySeconds === opt.seconds
                                ? "bg-brand text-surface border-brand"
                                : "bg-surface text-ink-muted border-border hover:border-border-strong hover:text-ink"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* ── Advanced Configuration ── */}
                <div className="border-2 border-border reveal-item">
                  <button
                    type="button"
                    aria-expanded={showAdvanced}
                    aria-controls="advanced-panel"
                    onClick={() => setShowAdvanced((s) => !s)}
                    className="w-full flex items-center justify-between p-4 bg-surface-sunken hover:bg-surface-raised transition-colors"
                  >
                    <span className="font-mono text-[11px] text-ink-muted uppercase tracking-[0.2em]">
                      Advanced Configuration
                    </span>
                    <span className="font-mono text-sm text-brand">
                      {showAdvanced ? "[-]" : "[+]"}
                    </span>
                  </button>
                  <div
                    id="advanced-panel"
                    className={cn(
                      "grid transition-all duration-normal ease-out-expo",
                      showAdvanced
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="p-6 md:p-8 space-y-6 bg-surface-raised border-t-2 border-border">
                        {/* Difficulty */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-ink-muted font-display uppercase tracking-wider">
                            Difficulty
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {DIFFICULTIES.map((d) => (
                              <button
                                key={d}
                                type="button"
                                aria-pressed={difficulty === d}
                                onClick={() => setDifficulty(d)}
                                className={cn(
                                  "h-9 px-4 border font-mono text-[11px] uppercase tracking-wider transition-all duration-fast",
                                  difficulty === d
                                    ? "bg-brand text-surface border-brand"
                                    : "bg-surface text-ink-muted border-border hover:border-border-strong hover:text-ink"
                                )}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <Input
                            id="tags"
                            label="Tags"
                            type="text"
                            value={tagsRaw}
                            onChange={(e) => setTagsRaw(e.target.value)}
                            placeholder="algebra, topology, proof, ..."
                            error={errors.tags}
                          />
                          {tagList.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {tagList.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 border border-border text-ink-muted font-mono text-xs uppercase tracking-wider"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Solver stake */}
                        <Input
                          id="solverStake"
                          label="Minimum Solver Stake (ETH)"
                          type="number"
                          min="0"
                          step="0.0001"
                          value={solverStake}
                          onChange={(e) => setSolverStake(e.target.value)}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-ink-faint font-mono leading-relaxed -mt-4">
                          Amount a solver must escrow to claim this bounty.
                          Enforced at the contract level in future versions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Finality Acknowledgment ── */}
                <div className="border-2 border-border bg-surface-raised p-6 reveal-item">
                  <label className="flex items-start gap-3 cursor-pointer group has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-fast mt-0.5",
                        acknowledged
                          ? "bg-brand border-brand text-surface"
                          : "border-border bg-surface group-hover:border-border-strong"
                      )}
                      aria-hidden="true"
                    >
                      {acknowledged && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="font-mono text-xs text-ink-muted uppercase tracking-[0.15em] leading-relaxed">
                      I understand this transaction is irreversible. Once
                      posted, my ETH will be locked in the bounty contract
                      until the deadline expires or a solver claims it.
                    </span>
                  </label>
                </div>

                {/* ── Submit ── */}
                <div className="flex flex-col sm:flex-row gap-4 reveal-item">
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isPending}
                    disabled={!acknowledged}
                    className="w-full sm:w-auto"
                  >
                    {isPending
                      ? "Submitting…"
                      : rewardNum > 0
                        ? `LOCK ${rewardNum.toFixed(4)} ETH & POST`
                        : "POST BOUNTY"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={resetForm}
                    className="w-full sm:w-auto"
                  >
                    RESET
                  </Button>
                </div>
              </div>

              {/* ═══════════════ RIGHT: PREVIEW & READOUT ═══════════════ */}
              <div className="lg:col-span-5 space-y-6">
                {/* ── Live Preview ── */}
                <div className="border-2 border-border bg-surface-sunken p-1 reveal-item">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-raised">
                    <span className="w-1.5 h-1.5 bg-brand animate-pulse" />
                    <span className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                      Live Preview
                    </span>
                  </div>

                  <div className="p-4 md:p-6">
                    {/* Preview card */}
                    <div className="relative border-2 border-border bg-surface p-5 md:p-6">
                      <div className="absolute top-4 right-4 md:top-5 md:right-5">
                        <span className="inline-block font-mono text-xs font-bold uppercase tracking-[0.2em] px-2 py-1 border border-success text-success">
                          OPEN
                        </span>
                      </div>

                      <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-4">
                        Bounty #PENDING
                      </div>

                      <h3 className="font-display font-bold text-ink mb-4 leading-tight pr-16 text-xl md:text-2xl min-h-[3rem]">
                        {title.trim() || "Untitled Bounty"}
                      </h3>

                      {description.trim() && (
                        <p className="text-sm text-ink-muted font-body line-clamp-3 mb-5 max-w-prose">
                          {description}
                        </p>
                      )}

                      {(tagList.length > 0 || difficulty) && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {difficulty && (
                            <Badge variant="brand" size="sm">
                              {difficulty}
                            </Badge>
                          )}
                          {tagList.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-end justify-between border-t-2 border-border pt-4">
                        <div>
                          <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-1">
                            Reward
                          </div>
                          <div className="font-mono text-2xl md:text-3xl font-bold text-brand tabular-nums">
                            {rewardNum.toFixed(4)}
                            <span className="text-sm text-ink-muted ml-1">
                              ETH
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-1">
                            Deadline
                          </div>
                          <div className="font-mono text-sm text-ink-muted">
                            {expiryLabel}
                          </div>
                        </div>
                      </div>

                      {solverStake && parseFloat(solverStake) > 0 && (
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <span className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                            Min Stake
                          </span>
                          <span className="font-mono text-sm text-ink-muted">
                            {solverStake} ETH
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Transaction Readout ── */}
                <div className="border-2 border-border bg-surface-sunken p-1 reveal-item">
                  <div className="px-3 py-2 border-b border-border bg-surface-raised">
                    <span className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
                      Transaction Readout
                    </span>
                  </div>
                  <div className="p-4 font-mono text-xs space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-ink-faint uppercase tracking-wider">
                        Wallet
                      </span>
                      <span className="text-ink tabular-nums">
                        {parseFloat(balance).toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-ink-faint uppercase tracking-wider">
                        Reward
                      </span>
                      <span className="text-brand tabular-nums">
                        -{rewardNum.toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-ink-faint uppercase tracking-wider">
                        Gas (est.)
                      </span>
                      <span className={cn("tabular-nums", gasEstimate ? "text-ink-muted" : "text-ink-faint italic")}>
                        {gasEstimate ? `-${parseFloat(gasEstimate).toFixed(6)} ETH` : "Unavailable"}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-baseline">
                      <span className="text-ink-faint uppercase tracking-wider">
                        Remaining
                      </span>
                      <span className="text-success tabular-nums">
                        {Math.max(
                          0,
                          balanceNum - rewardNum - parseFloat(gasEstimate || "0")
                        ).toFixed(4)}{" "}
                        ETH
                      </span>
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between items-baseline gap-4">
                        <span className="text-ink-faint uppercase tracking-wider shrink-0">
                          Answer Hash
                        </span>
                        <span className="text-ink-muted truncate text-right">
                          {formatHash(answerHash)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline gap-4">
                        <span className="text-ink-faint uppercase tracking-wider shrink-0">
                          Expires In
                        </span>
                        <span className="text-ink-muted text-right">
                          {expiryLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Security Note ── */}
                <div className="border border-border bg-surface-raised p-5 reveal-item">
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-success text-success text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <div className="font-mono text-xs text-success uppercase tracking-[0.2em] mb-1">
                        Privacy Preserved
                      </div>
                      <p className="text-sm text-ink-muted leading-relaxed">
                        Your answer is hashed using keccak256 entirely in your
                        browser. Only the hash is submitted to the blockchain.
                        Even the contract cannot reverse it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      <div className="fixed top-20 right-4 z-50 w-full max-w-sm">
        <Toast
          visible={toast.visible}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onDismiss={hideToast}
        />
      </div>
    </main>
  );
}
