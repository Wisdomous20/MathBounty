"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
  MATH_BOUNTY_DEPLOY_BLOCK,
} from "@/lib/contracts";
import { BOUNTY_STATUS } from "@/lib/bounty-state";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import { getReadProvider } from "@/lib/read-provider";

export interface UserBountyItem {
  id: string;
  poster: string;
  reward: bigint;
  expiresAt: bigint;
  status: number;
  title: string;
}

type BountyTuple = readonly [
  poster: string,
  answerHash: string,
  reward: bigint,
  expiresAt: bigint,
  status: bigint
];

const REFRESH_INTERVAL_MS = 45_000;

export function useUserBounties(accountAddress?: string | null) {
  const { getMetadata } = useBountyMetadata();
  const [bounties, setBounties] = useState<UserBountyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const inFlightFetchRef = useRef<Promise<void> | null>(null);

  const fetchBounties = useCallback(async () => {
    if (!accountAddress) {
      setBounties([]);
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

        // Filter BountyPosted by poster
        const filter = contract.filters.BountyPosted(null, accountAddress);
        const events = await contract.queryFilter(filter, MATH_BOUNTY_DEPLOY_BLOCK);
        
        const ids = events.map(e => (e as any).args.bountyId.toString());
        if (ids.length === 0) {
          setBounties([]);
          setError(null);
          return;
        }

        // Fetch current states
        let data: BountyTuple[];
        try {
          data = (await contract.getBounties(ids)) as BountyTuple[];
        } catch {
          data = await Promise.all(ids.map(id => contract.getBounty(id) as Promise<BountyTuple>));
        }

        const loaded: UserBountyItem[] = ids.map((id, index) => {
          const state = data[index];
          const metadata = getMetadata(id);
          return {
            id,
            poster: state[0],
            reward: state[2],
            expiresAt: state[3],
            status: Number(state[4]),
            title: metadata?.title || `Bounty #${id}`,
          };
        });

        setBounties(loaded.reverse()); // Newest first
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load your bounties");
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
    void fetchBounties();
  }, [fetchBounties]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchBounties();
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchBounties]);

  return {
    bounties,
    loading,
    error,
    retry: fetchBounties,
  };
}
