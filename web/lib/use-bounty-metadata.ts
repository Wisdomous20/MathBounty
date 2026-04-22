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

export function useBountyMetadata() {
  const getMetadata = useCallback((bountyId: string): BountyMetadata | null => {
    if (typeof window === "undefined") return null;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return all[bountyId] ?? null;
    } catch {
      return null;
    }
  }, []);

  const setMetadata = useCallback(
    (bountyId: string, metadata: BountyMetadata) => {
      if (typeof window === "undefined") return;
      try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        all[bountyId] = metadata;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const getAllMetadata = useCallback((): Record<string, BountyMetadata> => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }, []);

  return { getMetadata, setMetadata, getAllMetadata };
}
