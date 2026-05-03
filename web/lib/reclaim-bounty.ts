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
  try {
    return await contract.claimRefund(bountyId);
  } catch (claimRefundError) {
    if (!isMissingRevertDataError(claimRefundError)) {
      throw claimRefundError;
    }
  }

  try {
    return await contract.reclaimExpired(bountyId);
  } catch (reclaimExpiredError) {
    if (isMissingRevertDataError(reclaimExpiredError)) {
      throw new Error(
        "The configured MathBounty contract does not support this reclaim method. Check NEXT_PUBLIC_MATH_BOUNTY_ADDRESS and redeploy or point the app at a compatible contract."
      );
    }

    throw reclaimExpiredError;
  }
}
