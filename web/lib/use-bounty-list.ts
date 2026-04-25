"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
} from "@/lib/contracts";
import { BOUNTY_STATUS } from "@/lib/bounty-state";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";

export type OpenBountyListItem = {
  id: string;
  poster: string;
  reward: bigint;
  expiresAt: bigint;
  title: string;
};

type BountyTuple = readonly [
  poster: string,
  answerHash: string,
  reward: bigint,
  expiresAt: bigint,
  status: bigint
];

const BOUNTY_BATCH_SIZE = 50;
const REFRESH_INTERVAL_MS = 45_000;

function getReadProvider() {
  const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
  return win.ethereum
    ? new ethers.BrowserProvider(win.ethereum)
    : new ethers.JsonRpcProvider("https://rpc.sepolia.org");
}

function getBountyIds(count: bigint) {
  const ids: string[] = [];
  const firstBountyId = BigInt(1);

  for (let id = count; id >= firstBountyId; id -= firstBountyId) {
    ids.push(id.toString());
  }

  return ids;
}

async function getBountyBatch(contract: ethers.Contract, ids: string[]) {
  try {
    return (await contract.getBounties(ids)) as BountyTuple[];
  } catch {
    return Promise.all(ids.map((id) => contract.getBounty(id) as Promise<BountyTuple>));
  }
}

function getFallbackTitle(id: string) {
  return `Bounty #${id}`;
}

export function useBountyList(accountAddress?: string | null) {
  const { getMetadata } = useBountyMetadata();
  const [bounties, setBounties] = useState<OpenBountyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);
  const inFlightFetchRef = useRef<Promise<void> | null>(null);
  const lastSuccessfulBountiesRef = useRef<OpenBountyListItem[]>([]);

  const fetchBounties = useCallback(async () => {
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
        const count = (await contract.bountyCount()) as bigint;
        const ids = getBountyIds(count);
        const now = Math.floor(Date.now() / 1000);
        const loaded: OpenBountyListItem[] = [];

        for (let start = 0; start < ids.length; start += BOUNTY_BATCH_SIZE) {
          const chunkIds = ids.slice(start, start + BOUNTY_BATCH_SIZE);
          const chunk = await getBountyBatch(contract, chunkIds);

          chunk.forEach((data, index) => {
            const id = chunkIds[index];
            const status = Number(data[4]);
            const expiresAt = data[3];

            if (status !== BOUNTY_STATUS.Open || Number(expiresAt) <= now) {
              return;
            }

            const metadata = getMetadata(id);
            loaded.push({
              id,
              poster: data[0],
              reward: data[2],
              expiresAt,
              title: metadata?.title || getFallbackTitle(id),
            });
          });
        }

        lastSuccessfulBountiesRef.current = loaded;
        setBounties(loaded);
        setError(null);
        setLastUpdatedAt(Date.now());
      } catch (err: unknown) {
        if (lastSuccessfulBountiesRef.current.length > 0) {
          setBounties(lastSuccessfulBountiesRef.current);
        }

        setError(err instanceof Error ? err.message : "Failed to load bounties");
      } finally {
        hasLoadedRef.current = true;
        setLoading(false);
        inFlightFetchRef.current = null;
      }
    })();

    inFlightFetchRef.current = request;
    return request;
  }, [getMetadata]);

  useEffect(() => {
    return () => {
      inFlightFetchRef.current = null;
    };
  }, []);

  const refreshBounties = useCallback(() => {
    if (document.visibilityState === "hidden") {
      return;
    }

    void fetchBounties();
  }, [fetchBounties]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBounties();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [accountAddress, fetchBounties]);

  useEffect(() => {
    const interval = window.setInterval(refreshBounties, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [refreshBounties]);

  useEffect(() => {
    window.addEventListener("focus", refreshBounties);
    document.addEventListener("visibilitychange", refreshBounties);

    return () => {
      window.removeEventListener("focus", refreshBounties);
      document.removeEventListener("visibilitychange", refreshBounties);
    };
  }, [refreshBounties]);

  return {
    bounties,
    loading,
    error,
    lastUpdatedAt,
    retry: fetchBounties,
  };
}
