"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import {
  assertMathBountyContract,
  MATH_BOUNTY_ABI,
  MATH_BOUNTY_ADDRESS,
  MATH_BOUNTY_DEPLOY_BLOCK,
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

type BountyPostedLog = {
  bountyId: bigint;
};

const BLOCK_PAGE_SIZE = 5_000;
const REFRESH_INTERVAL_MS = 12_000;

function getReadProvider() {
  const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
  return win.ethereum
    ? new ethers.BrowserProvider(win.ethereum)
    : new ethers.JsonRpcProvider("https://rpc.sepolia.org");
}

async function findDeploymentBlock(provider: ethers.Provider) {
  if (MATH_BOUNTY_DEPLOY_BLOCK > 0) {
    return MATH_BOUNTY_DEPLOY_BLOCK;
  }

  const latest = await provider.getBlockNumber();
  let low = 0;
  let high = latest;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const code = await provider.getCode(MATH_BOUNTY_ADDRESS, mid);
    if (code === "0x") {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

async function getPostedBountyIds(
  provider: ethers.Provider,
  contractInterface: ethers.Interface,
  fromBlock: number,
  toBlock: number
) {
  const event = contractInterface.getEvent("BountyPosted");
  if (!event) return [];

  const topic = event.topicHash;
  const ids: string[] = [];

  for (let start = fromBlock; start <= toBlock; start += BLOCK_PAGE_SIZE) {
    const end = Math.min(start + BLOCK_PAGE_SIZE - 1, toBlock);
    const logs = await provider.getLogs({
      address: MATH_BOUNTY_ADDRESS,
      topics: [topic],
      fromBlock: start,
      toBlock: end,
    });

    for (const log of logs) {
      const parsed = contractInterface.parseLog(log);
      if (!parsed) continue;
      ids.push((parsed.args[0] as BountyPostedLog["bountyId"]).toString());
    }
  }

  return ids;
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

  const contractInterface = useMemo(() => new ethers.Interface(MATH_BOUNTY_ABI), []);

  const fetchBounties = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const provider = getReadProvider();
      await assertMathBountyContract(provider);

      const latestBlock = await provider.getBlockNumber();
      const deploymentBlock = await findDeploymentBlock(provider);
      const ids = await getPostedBountyIds(
        provider,
        contractInterface,
        deploymentBlock,
        latestBlock
      );
      const contract = new ethers.Contract(
        MATH_BOUNTY_ADDRESS,
        MATH_BOUNTY_ABI,
        provider
      );
      const now = Math.floor(Date.now() / 1000);

      const loaded = await Promise.all(
        ids.map(async (id) => {
          const data = await contract.getBounty(id);
          const status = Number(data[4]);
          const expiresAt = data[3] as bigint;

          if (status !== BOUNTY_STATUS.Open || Number(expiresAt) <= now) {
            return null;
          }

          const metadata = getMetadata(id);
          return {
            id,
            poster: data[0] as string,
            reward: data[2] as bigint,
            expiresAt,
            title: metadata?.title || getFallbackTitle(id),
          };
        })
      );

      setBounties(loaded.filter((bounty): bounty is OpenBountyListItem => bounty !== null));
      setError(null);
      setLastUpdatedAt(Date.now());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bounties");
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [contractInterface, getMetadata]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBounties();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [accountAddress, fetchBounties]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchBounties();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [fetchBounties]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      void fetchBounties();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchBounties]);

  return {
    bounties,
    loading,
    error,
    lastUpdatedAt,
    retry: fetchBounties,
  };
}
