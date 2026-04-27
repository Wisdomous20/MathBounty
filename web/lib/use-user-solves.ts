"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
  MATH_BOUNTY_DEPLOY_BLOCK,
} from "@/lib/contracts";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import { getReadProvider } from "@/lib/read-provider";

export interface UserSolveItem {
  bountyId: string;
  reward: bigint;
  solver: string;
  timestamp: number;
  txHash: string;
  title: string;
}

const REFRESH_INTERVAL_MS = 60_000;

export function useUserSolves(accountAddress?: string | null) {
  const { getMetadata } = useBountyMetadata();
  const [solves, setSolves] = useState<UserSolveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const inFlightFetchRef = useRef<Promise<void> | null>(null);

  const fetchSolves = useCallback(async () => {
    if (!accountAddress) {
      setSolves([]);
      setLoading(false);
      return;
    }

    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current;
    }

    const request = (async () => {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      try {
        const provider = getReadProvider();
        await assertMathBountyContract(provider);

        const contract = new ethers.Contract(
          MATH_BOUNTY_ADDRESS,
          MATH_BOUNTY_ABI,
          provider
        );

        const filter = contract.filters.BountySolved(null, accountAddress);
        const events = await contract.queryFilter(filter, MATH_BOUNTY_DEPLOY_BLOCK);

        if (events.length === 0) {
          setSolves([]);
          setError(null);
          return;
        }

        const loaded: UserSolveItem[] = await Promise.all(
          events.map(async (event: any) => {
            const block = await provider.getBlock(event.blockNumber);
            const bountyId = event.args.bountyId.toString();
            const metadata = getMetadata(bountyId);
            
            return {
              bountyId,
              reward: event.args.reward,
              solver: event.args.solver,
              timestamp: block ? block.timestamp * 1000 : 0,
              txHash: event.transactionHash,
              title: metadata?.title || `Bounty #${bountyId}`,
            };
          })
        );

        setSolves(loaded.reverse());
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load your solves");
      } finally {
        hasLoadedRef.current = true;
        setLoading(false);
        inFlightFetchRef.current = null;
      }
    })();

    inFlightFetchRef.current = request;
    return request;
  }, [accountAddress, getMetadata]);

  useEffect(() => {
    void fetchSolves();
  }, [fetchSolves]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchSolves();
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSolves]);

  return {
    solves,
    loading,
    error,
    retry: fetchSolves,
  };
}
