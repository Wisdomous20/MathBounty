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
