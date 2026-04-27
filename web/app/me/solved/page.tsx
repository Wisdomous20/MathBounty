"use client";

import { useWallet } from "@/lib/use-wallet";
import { useUserSolves } from "@/lib/use-user-solves";
import { ethers } from "ethers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectWalletPrompt } from "@/components/ui/connect-wallet-prompt";
import { EmptyState } from "@/components/ui/empty-state";

function truncateHash(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export default function MySolvedPage() {
  const { state, address } = useWallet();
  const { solves, loading, error, retry } = useUserSolves(address);

  if (state !== "connected") {
    return (
      <ConnectWalletPrompt
        title="Connect to see your wins"
        description="We need to connect to your wallet to fetch the bounties you have successfully solved on-chain."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-full bg-surface-sunken border-2 border-border" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 w-full animate-pulse bg-surface-raised border-2 border-border" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border-2 border-error bg-surface-raised">
        <h3 className="font-display text-xl text-error mb-2">Failed to load solves</h3>
        <p className="text-ink-muted mb-6">{error}</p>
        <Button onClick={() => void retry()}>Retry</Button>
      </div>
    );
  }

  if (solves.length === 0) {
    return (
      <EmptyState
        title="You haven't solved any bounties yet"
        actionHref="/bounties"
        actionLabel="Browse open bounties"
      />
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-border bg-surface-raised">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-sunken border-b-2 border-border">
            <th className="px-6 py-4 font-display text-xs uppercase tracking-widest text-ink-faint">Bounty</th>
            <th className="px-6 py-4 font-display text-xs uppercase tracking-widest text-ink-faint text-right">Reward</th>
            <th className="px-6 py-4 font-display text-xs uppercase tracking-widest text-ink-faint">Date</th>
            <th className="px-6 py-4 font-display text-xs uppercase tracking-widest text-ink-faint">Transaction</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-border font-mono text-sm">
          {solves.map((solve) => (
            <tr key={solve.txHash} className="hover:bg-surface transition-colors">
              <td className="px-6 py-4">
                <Link 
                  href={`/bounty/${solve.bountyId}`}
                  className="text-ink font-bold hover:text-brand transition-colors"
                >
                  {solve.title}
                </Link>
                <div className="text-[10px] text-ink-faint mt-1">ID: {solve.bountyId}</div>
              </td>
              <td className="px-6 py-4 text-right text-brand font-bold tabular-nums">
                {ethers.formatEther(solve.reward)} ETH
              </td>
              <td className="px-6 py-4 text-ink-muted whitespace-nowrap">
                {new Date(solve.timestamp).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <a
                  href={`https://sepolia.etherscan.io/tx/${solve.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-ink-muted hover:text-brand transition-colors"
                >
                  {truncateHash(solve.txHash)}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
