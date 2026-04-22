"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

export type WalletState = "disconnected" | "connecting" | "connected" | "wrong-network";

const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

export function useWallet() {
  const [state, setState] = useState<WalletState>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const connect = useCallback(async (): Promise<string | null> => {
    const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
    if (!win.ethereum) {
      alert("No Ethereum wallet detected. Please install MetaMask.");
      return null;
    }

    setState("connecting");
    try {
      const browserProvider = new ethers.BrowserProvider(win.ethereum);
      const network = await browserProvider.getNetwork();
      const chainId = "0x" + network.chainId.toString(16);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        setState("wrong-network");
        setProvider(browserProvider);
        return null;
      }

      const accounts = (await win.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const userSigner = await browserProvider.getSigner();

      setAddress(accounts[0] ?? null);
      setProvider(browserProvider);
      setSigner(userSigner);
      setState("connected");
      return accounts[0] ?? null;
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setState("disconnected");
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState("disconnected");
    setAddress(null);
    setProvider(null);
    setSigner(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
    if (!win.ethereum) return;

    try {
      await win.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      // After switching, try connecting again
      await connect();
    } catch (err: unknown) {
      // If the chain hasn't been added to MetaMask, add it
      if ((err as { code?: number }).code === 4902) {
        await win.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Test Network",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
        await connect();
      } else {
        console.error("Failed to switch network:", err);
      }
    }
  }, [connect]);

  // Listen for account/chain changes
  useEffect(() => {
    const win = window as unknown as { ethereum?: ethers.Eip1193Provider & { on?: (event: string, handler: (args: unknown) => void) => void; removeListener?: (event: string, handler: (args: unknown) => void) => void } };
    if (!win.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setState("disconnected");
        setAddress(null);
        setSigner(null);
      } else {
        setAddress(accs[0]);
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    win.ethereum.on?.("accountsChanged", handleAccountsChanged);
    win.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      win.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      win.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [connect]);

  // Auto-connect if already authorized
  useEffect(() => {
    const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
    if (!win.ethereum) return;

    win.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length > 0) {
          connect();
        }
      })
      .catch(() => {});
  }, [connect]);

  return { state, address, provider, signer, connect, disconnect, switchNetwork };
}
