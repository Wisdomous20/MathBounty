"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";

export function useBalance(address: string | null, provider: ethers.BrowserProvider | null) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address || !provider) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(Number(balanceEth).toFixed(4));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [address, provider]);

  useEffect(() => {
    fetchBalance();

    // Poll for balance updates every 15 seconds
    const interval = setInterval(fetchBalance, 15_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
