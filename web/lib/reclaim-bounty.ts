import { ethers } from "ethers";

type EthersLikeError = {
  code?: string;
  data?: string | null;
  message?: string;
  shortMessage?: string;
};

export function isMissingRevertDataError(error: unknown) {
  const candidate = error as EthersLikeError;
  const message = [
    candidate?.message,
    candidate?.shortMessage,
    candidate?.data,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    candidate?.code === "CALL_EXCEPTION" &&
    (candidate?.data == null ||
      candidate.data === "0x" ||
      message.includes("missing revert data"))
  );
}

export async function reclaimBountyEscrow(
  contract: ethers.Contract,
  bountyId: bigint
) {
  // The contract exposes both reclaimExpired() and claimRefund(), but both
  // map to the same internal _reclaimExpired() logic. We use reclaimExpired()
  // as the canonical method to avoid the confusing fallback chain.
  return await contract.reclaimExpired(bountyId);
}
