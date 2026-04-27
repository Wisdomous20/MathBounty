"use client";

import { ethers } from "ethers";

export function getReadProvider() {
  const win = window as unknown as { ethereum?: ethers.Eip1193Provider };
  return win.ethereum
    ? new ethers.BrowserProvider(win.ethereum)
    : new ethers.JsonRpcProvider("https://rpc.sepolia.org");
}
