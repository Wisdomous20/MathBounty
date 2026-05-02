"use client";

import { useCallback } from "react";

export interface BountyMetadata {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  solverStake?: string;
}

const STORAGE_KEY = "mathbounty-metadata";

function readAllCachedMetadata(): Record<string, BountyMetadata> {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<
      string,
      BountyMetadata
    >;
  } catch {
    return {};
  }
}

function writeAllCachedMetadata(all: Record<string, BountyMetadata>) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage errors and keep the in-memory flow moving.
  }
}

function cacheMetadataEntry(bountyId: string, metadata: BountyMetadata) {
  const all = readAllCachedMetadata();
  all[bountyId] = metadata;
  writeAllCachedMetadata(all);
}

async function fetchMetadataBatchFromApi(ids: string[]) {
  if (ids.length === 0) {
    return {} as Record<string, BountyMetadata>;
  }

  const params = new URLSearchParams();
  ids.forEach((id) => params.append("id", id));

  const response = await fetch(`/api/bounty-metadata?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load shared bounty metadata.");
  }

  const payload = (await response.json()) as {
    metadata?: Record<string, BountyMetadata>;
  };

  return payload.metadata ?? {};
}

export function useBountyMetadata() {
  const getMetadata = useCallback((bountyId: string): BountyMetadata | null => {
    const all = readAllCachedMetadata();
    return all[bountyId] ?? null;
  }, []);

  const getMetadataBatch = useCallback(async (bountyIds: string[]) => {
    const uniqueIds = [...new Set(bountyIds.filter(Boolean))];
    const cached = readAllCachedMetadata();
    const missingIds = uniqueIds.filter((id) => !(id in cached));

    if (missingIds.length > 0) {
      try {
        const shared = await fetchMetadataBatchFromApi(missingIds);

        if (Object.keys(shared).length > 0) {
          writeAllCachedMetadata({ ...cached, ...shared });
        }

        return {
          ...cached,
          ...shared,
        } as Record<string, BountyMetadata>;
      } catch {
        return cached;
      }
    }

    return cached;
  }, []);

  const saveMetadata = useCallback(
    async (bountyId: string, txHash: string, metadata: BountyMetadata) => {
      cacheMetadataEntry(bountyId, metadata);

      const response = await fetch("/api/bounty-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bountyId,
          txHash,
          metadata,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(payload?.error || "Failed to persist bounty metadata.");
      }
    },
    []
  );

  return {
    getMetadata,
    getMetadataBatch,
    saveMetadata,
  };
}
