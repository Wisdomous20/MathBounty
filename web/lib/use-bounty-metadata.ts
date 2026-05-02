"use client";

import { useCallback } from "react";

export interface BountyMetadata {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  solverStake?: string;
}

type CachedBountyMetadata = BountyMetadata & {
  txHash?: string;
  syncedAt?: number;
};

const STORAGE_KEY = "mathbounty-metadata";

function readAllCachedMetadata(): Record<string, CachedBountyMetadata> {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<
      string,
      CachedBountyMetadata
    >;
  } catch {
    return {};
  }
}

function writeAllCachedMetadata(all: Record<string, CachedBountyMetadata>) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage errors and keep the in-memory flow moving.
  }
}

function toPublicMetadata(
  metadata: CachedBountyMetadata | BountyMetadata | null | undefined
): BountyMetadata | null {
  if (!metadata) return null;

  return {
    title: metadata.title,
    description: metadata.description,
    difficulty: metadata.difficulty,
    tags: metadata.tags,
    solverStake: metadata.solverStake,
  };
}

function cacheMetadataEntry(
  bountyId: string,
  metadata: BountyMetadata,
  txHash?: string,
  syncedAt?: number
) {
  const all = readAllCachedMetadata();
  all[bountyId] = {
    ...metadata,
    txHash: txHash || all[bountyId]?.txHash,
    syncedAt: syncedAt ?? all[bountyId]?.syncedAt,
  };
  writeAllCachedMetadata(all);
}

function toPublicMetadataRecord(
  metadataById: Record<string, CachedBountyMetadata>
) {
  return Object.entries(metadataById).reduce<Record<string, BountyMetadata>>(
    (acc, [id, metadata]) => {
      const publicMetadata = toPublicMetadata(metadata);

      if (publicMetadata) {
        acc[id] = publicMetadata;
      }

      return acc;
    },
    {}
  );
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
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error || "Failed to load shared bounty metadata.");
  }

  const payload = (await response.json()) as {
    metadata?: Record<string, BountyMetadata>;
  };

  return payload.metadata ?? {};
}

export function useBountyMetadata() {
  const getMetadata = useCallback((bountyId: string): BountyMetadata | null => {
    const all = readAllCachedMetadata();
    return toPublicMetadata(all[bountyId]);
  }, []);

  const getMetadataBatch = useCallback(async (bountyIds: string[]) => {
    const uniqueIds = [...new Set(bountyIds.filter(Boolean))];
    const cached = readAllCachedMetadata();
    const cachedForRequestedIds = uniqueIds.reduce<
      Record<string, CachedBountyMetadata>
    >((acc, id) => {
      if (cached[id]) {
        acc[id] = cached[id];
      }

      return acc;
    }, {});

    try {
      const shared = await fetchMetadataBatchFromApi(uniqueIds);

      if (Object.keys(shared).length > 0) {
        const merged = { ...cached };

        Object.entries(shared).forEach(([id, metadata]) => {
          merged[id] = {
            ...metadata,
            txHash: merged[id]?.txHash,
            syncedAt: merged[id]?.syncedAt,
          };
        });

        writeAllCachedMetadata(merged);
      }

      return {
        ...toPublicMetadataRecord(cached),
        ...shared,
      };
    } catch {
      const fallback = toPublicMetadataRecord(cachedForRequestedIds);

      if (Object.keys(fallback).length > 0) {
        return fallback;
      }

      throw new Error("Failed to load shared bounty metadata.");
    }
  }, []);

  const saveMetadata = useCallback(
    async (bountyId: string, txHash: string, metadata: BountyMetadata) => {
      cacheMetadataEntry(bountyId, metadata, txHash);

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

      cacheMetadataEntry(bountyId, metadata, txHash, Date.now());
    },
    []
  );

  const syncMetadataToServer = useCallback(
    async (bountyId: string, txHash?: string) => {
      const cached = readAllCachedMetadata()[bountyId];
      const metadata = toPublicMetadata(cached);
      const resolvedTxHash = txHash || cached?.txHash;

      if (!metadata || !resolvedTxHash) {
        return false;
      }

      await saveMetadata(bountyId, resolvedTxHash, metadata);
      return true;
    },
    [saveMetadata]
  );

  const syncPendingMetadata = useCallback(async () => {
    const cachedEntries = Object.entries(readAllCachedMetadata());

    for (const [bountyId, cached] of cachedEntries) {
      const metadata = toPublicMetadata(cached);

      if (!metadata || !cached.txHash || cached.syncedAt) {
        continue;
      }

      try {
        await saveMetadata(bountyId, cached.txHash, metadata);
      } catch {
        // Keep unsynced metadata cached for a later retry.
      }
    }
  }, [saveMetadata]);

  return {
    getMetadata,
    getMetadataBatch,
    saveMetadata,
    syncMetadataToServer,
    syncPendingMetadata,
  };
}
