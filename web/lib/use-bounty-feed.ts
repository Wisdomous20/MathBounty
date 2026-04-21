"use client";

import { useState, useEffect, useCallback } from "react";

const PROBLEMS = [
  "Prove NP-completeness of Graph Isomorphism under promise constraints",
  "Novel Zero-Knowledge Proof for Integer Factorization with sub-linear verification",
  "Closed-form solution for 3D Navier-Stokes existence in bounded domains",
  "Optimal comparison-based sorting lower bound for partially ordered sets",
  "Deterministic polynomial-time algorithm for perfect matching in general graphs",
  "Constructive proof of the Erdős discrepancy conjecture for C=3",
  "Linear-time algorithm for minimum vertex cover in planar graphs",
  "Proof that P ≠ NP via algebraic geometry methods",
  "Tight lower bound for distributed consensus in asynchronous networks",
  "Quantum algorithm for element distinctness with optimal query complexity",
  "Sublinear-time approximation for maximum matching in dynamic streams",
  "Provably secure cryptographic protocol for multi-party computation",
];

const ADDRESSES = [
  "0x8a3F2b91", "0x7c2A9d44", "0x3b91Ef22", "0x9d447c2A",
  "0x2b918a3F", "0xEf223b91", "0x4a2F8c11", "0x1c8B3d99",
  "0x5d33Aa77", "0xBb119c4E", "0xFa8822c1", "0x3Ee55d00",
];

const STATUSES = ["OPEN", "CLAIMED", "OPEN", "OPEN", "CLAIMED", "OPEN", "OPEN", "PAID", "OPEN", "EXPIRED"];

export interface BountyFeedItem {
  id: string;
  address: string;
  reward: string;
  status: string;
  deadline: string;
  title: string;
  timestamp: number;
}

function generateItem(): BountyFeedItem {
  const now = Date.now();
  const id = `#${Math.floor(1000 + Math.random() * 9000)}`;
  const problem = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
  const address = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
  const reward = (0.5 + Math.random() * 9.5).toFixed(2);
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const days = Math.floor(7 + Math.random() * 83);
  return {
    id,
    address,
    reward,
    status,
    deadline: `${days}d`,
    title: problem,
    timestamp: now,
  };
}

function createInitialItems(count: number): BountyFeedItem[] {
  return Array.from({ length: count }, generateItem);
}

export function useBountyFeed(interval = 3200) {
  const [items, setItems] = useState<BountyFeedItem[]>(() => createInitialItems(20));
  const [latestItem, setLatestItem] = useState<BountyFeedItem | null>(() => {
    const initial = createInitialItems(20);
    return initial[0] ?? null;
  });

  const generateItemCallback = useCallback((): BountyFeedItem => generateItem(), []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newItem = generateItemCallback();
      setItems(prev => [newItem, ...prev].slice(0, 100));
      setLatestItem(newItem);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, generateItemCallback]);

  return { items, latestItem };
}
