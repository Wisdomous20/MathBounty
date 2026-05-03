"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/lib/use-wallet";
import { useUserBounties, UserBountyItem } from "@/lib/use-user-bounties";
import { BOUNTY_STATUS, canReclaimExpiredBounty } from "@/lib/bounty-state";
import { reclaimBountyEscrow } from "@/lib/reclaim-bounty";
import { Button } from "@/components/ui/button";
import { ConnectWalletPrompt } from "@/components/ui/connect-wallet-prompt";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
} from "@/lib/contracts";
import { decodeContractError } from "@/lib/decode-revert";

function BountyListItem({
  bounty,
  nowSeconds,
  connectedAddress,
  onReclaim,
  reclaiming,
}: {
  bounty: UserBountyItem;
  nowSeconds: number;
  connectedAddress: string | null;
  onReclaim: (id: string) => void;
  reclaiming: string | null;
}) {
  const isExpired = Number(bounty.expiresAt) < nowSeconds;
  const canReclaim = canReclaimExpiredBounty(bounty, connectedAddress, nowSeconds);
  
  const statusConfig = {
    [BOUNTY_STATUS.Open]: isExpired 
      ? { label: "Expired", variant: "default" as const }
      : { label: "Open", variant: "success" as const },
    [BOUNTY_STATUS.Paid]: { label: "Paid", variant: "warning" as const },
    [BOUNTY_STATUS.Expired]: { label: "Reclaimed", variant: "default" as const },
  };

  const config = statusConfig[bounty.status as keyof typeof statusConfig] || { label: "Unknown", variant: "default" as const };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-2 border-border bg-surface-raised gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs text-ink-faint">#{bounty.id}</span>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-ink mb-1">
          {bounty.title}
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-ink-muted">
          <span>Reward: {ethers.formatEther(bounty.reward)} ETH</span>
          <span>
            {bounty.status === BOUNTY_STATUS.Open 
              ? (isExpired ? "Expired" : `Expires in ${Math.ceil((Number(bounty.expiresAt) - nowSeconds) / 3600)}h`)
              : `Status: ${config.label}`}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Link 
          href={`/bounty/${bounty.id}`}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-border hover:border-brand hover:text-brand transition-colors"
        >
          View Details
        </Link>
        {canReclaim && (
          <Button
            size="sm"
            onClick={() => onReclaim(bounty.id)}
            isLoading={reclaiming === bounty.id}
          >
            Reclaim ETH
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyPostsPage() {
  const { state, address, signer } = useWallet();
  const { bounties, loading, error, retry } = useUserBounties(address);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [reclaiming, setReclaiming] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    variant: "success" | "error" | "info";
    title: string;
    description?: string;
  }>({ visible: false, variant: "info", title: "" });

  useEffect(() => {
    const timer = setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReclaim = async (id: string) => {
    if (!signer) return;
    setReclaiming(id);
    setToast({
      visible: true,
      variant: "info",
      title: "Reclaiming Escrow",
      description: "Waiting for wallet signature and confirmation...",
    });

    try {
      await assertMathBountyContract(signer.provider);
      const contract = new ethers.Contract(MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI, signer);
      const tx = await reclaimBountyEscrow(contract, BigInt(id));
      const receipt = await tx.wait();
      
      setToast({
        visible: true,
        variant: "success",
        title: "ETH Reclaimed",
        description: `Bounty #${id} escrow returned to your wallet. Tx: ${receipt.hash.slice(0, 10)}...`,
      });
      void retry();
    } catch (err: unknown) {
      const decoded = decodeContractError(err);
      setToast({
        visible: true,
        variant: "error",
        title: decoded.title,
        description: decoded.description,
      });
    } finally {
      setReclaiming(null);
    }
  };

  if (state !== "connected") {
    return (
      <ConnectWalletPrompt
        title="Connect to see your posts"
        description="We need to connect to your wallet to fetch the bounties you have posted on-chain."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 w-full animate-pulse bg-surface-raised border-2 border-border" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border-2 border-error bg-surface-raised">
        <h3 className="font-display text-xl text-error mb-2">Failed to load posts</h3>
        <p className="text-ink-muted mb-6">{error}</p>
        <Button onClick={() => void retry()}>Retry</Button>
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <EmptyState
        title="You haven't posted any bounties yet"
        actionHref="/new"
        actionLabel="Post your first bounty"
      />
    );
  }

  const openPosts = bounties.filter(b => b.status === BOUNTY_STATUS.Open && Number(b.expiresAt) >= nowSeconds);
  const paidPosts = bounties.filter(b => b.status === BOUNTY_STATUS.Paid);
  const expiredPosts = bounties.filter(b => b.status === BOUNTY_STATUS.Expired || (b.status === BOUNTY_STATUS.Open && Number(b.expiresAt) < nowSeconds));

  return (
    <div className="space-y-12">
      {openPosts.length > 0 && (
        <section>
          <h2 className="font-display text-2xl uppercase tracking-tight mb-6">Open Posts</h2>
          <div className="space-y-4">
            {openPosts.map(b => (
              <BountyListItem 
                key={b.id} 
                bounty={b} 
                nowSeconds={nowSeconds} 
                connectedAddress={address}
                onReclaim={handleReclaim}
                reclaiming={reclaiming}
              />
            ))}
          </div>
        </section>
      )}

      {paidPosts.length > 0 && (
        <section>
          <h2 className="font-display text-2xl uppercase tracking-tight mb-6">Paid Posts</h2>
          <div className="space-y-4">
            {paidPosts.map(b => (
              <BountyListItem 
                key={b.id} 
                bounty={b} 
                nowSeconds={nowSeconds} 
                connectedAddress={address}
                onReclaim={handleReclaim}
                reclaiming={reclaiming}
              />
            ))}
          </div>
        </section>
      )}

      {expiredPosts.length > 0 && (
        <section>
          <h2 className="font-display text-2xl uppercase tracking-tight mb-6">Expired Posts</h2>
          <div className="space-y-4">
            {expiredPosts.map(b => (
              <BountyListItem 
                key={b.id} 
                bounty={b} 
                nowSeconds={nowSeconds} 
                connectedAddress={address}
                onReclaim={handleReclaim}
                reclaiming={reclaiming}
              />
            ))}
          </div>
        </section>
      )}

      <Toast
        visible={toast.visible}
        variant={toast.variant}
        title={toast.title}
        description={toast.description}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
