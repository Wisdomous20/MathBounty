export const BOUNTY_STATUS = {
  Open: 0,
  Paid: 1,
  Expired: 2,
} as const;

export type BountyStateView = {
  poster: string;
  expiresAt: bigint;
  status: number;
};

export function canReclaimExpiredBounty(
  bounty: BountyStateView | null,
  connectedAddress: string | null | undefined,
  nowSeconds: number
) {
  if (!bounty || !connectedAddress) return false;

  return (
    bounty.status === BOUNTY_STATUS.Open &&
    nowSeconds > Number(bounty.expiresAt) &&
    connectedAddress.toLowerCase() === bounty.poster.toLowerCase()
  );
}

export function getReclaimErrorReason(
  bounty: BountyStateView | null,
  nowSeconds: number,
  connectedAddress: string | null | undefined
): string | null {
  if (!bounty || !connectedAddress) return "Connect wallet to reclaim";

  if (connectedAddress.toLowerCase() !== bounty.poster.toLowerCase()) {
    return "Only poster can reclaim";
  }

  if (bounty.status === BOUNTY_STATUS.Paid) {
    return "Already paid to solver";
  }

  if (bounty.status === BOUNTY_STATUS.Expired) {
    return "Already reclaimed";
  }

  if (nowSeconds <= Number(bounty.expiresAt)) {
    return "Not expired yet";
  }

  return null;
}
