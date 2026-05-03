import { ethers } from "ethers";
import { isMissingRevertDataError } from "./reclaim-bounty";

type RevertMessage = {
  title: string;
  description: string;
  variant: "error" | "info";
};

const ERROR_MESSAGES: Record<string, RevertMessage> = {
  InvalidAnswer: {
    title: "Wrong Answer",
    description: "That's not the right answer.",
    variant: "error",
  },
  Expired: {
    title: "Bounty Expired",
    description: "This bounty has expired.",
    variant: "error",
  },
  NotOpen: {
    title: "Already Closed",
    description: "This bounty was already solved or reclaimed.",
    variant: "error",
  },
  SelfSolveForbidden: {
    title: "Self-Solve Blocked",
    description: "You can't solve your own bounty.",
    variant: "error",
  },
  PayoutFailed: {
    title: "Payout Failed",
    description: "Reward transfer failed. Please retry.",
    variant: "error",
  },
  NotPoster: {
    title: "Not Poster",
    description: "Only the bounty poster can reclaim this escrow.",
    variant: "error",
  },
  NotExpired: {
    title: "Not Expired",
    description: "This bounty is not past its expiry yet.",
    variant: "error",
  },
  RefundFailed: {
    title: "Refund Failed",
    description: "Refund transfer failed. Please retry.",
    variant: "error",
  },
};

const REVERT_REASON_MESSAGES: Record<string, RevertMessage> = {
  "Only poster can refund": {
    title: "Not Poster",
    description: "Only the bounty poster can reclaim this escrow.",
    variant: "error",
  },
  "Bounty not expired yet": {
    title: "Not Expired",
    description: "This bounty is not past its expiry yet.",
    variant: "error",
  },
  "Not yet expired": {
    title: "Not Expired",
    description: "This bounty is not past its expiry yet.",
    variant: "error",
  },
  "Bounty is not open": {
    title: "Already Closed",
    description: "This bounty was already solved or reclaimed.",
    variant: "error",
  },
  "Refund transfer failed": {
    title: "Refund Failed",
    description: "Refund transfer failed. Please retry.",
    variant: "error",
  },
};

function extractErrorName(error: unknown) {
  const candidate = error as {
    revert?: { name?: string };
    data?: { errorName?: string };
    info?: { errorName?: string };
  };

  return (
    candidate?.revert?.name ??
    candidate?.data?.errorName ??
    candidate?.info?.errorName ??
    null
  );
}

function extractRevertReason(error: unknown) {
  const candidate = error as {
    reason?: string;
    revert?: { args?: unknown[] };
    data?: string;
  };

  if (candidate?.reason) return candidate.reason;

  const revertArg = candidate?.revert?.args?.[0];
  if (typeof revertArg === "string") return revertArg;

  if (
    typeof candidate?.data === "string" &&
    candidate.data.startsWith("0x08c379a0")
  ) {
    try {
      const errorInterface = new ethers.Interface(["error Error(string)"]);
      const parsed = errorInterface.parseError(candidate.data);
      const reason = parsed?.args?.[0];
      if (typeof reason === "string") return reason;
    } catch {
      return null;
    }
  }

  return null;
}

export function decodeContractError(error: unknown): RevertMessage {
  const rpcError = error as { code?: string };
  if (rpcError?.code === "ACTION_REJECTED") {
    return {
      title: "Signature Rejected",
      description: "You cancelled the wallet request.",
      variant: "info",
    };
  }

  if (isMissingRevertDataError(error)) {
    return {
      title: "Contract Mismatch",
      description:
        "The configured contract did not return a readable revert. Check that the app is pointed at the current MathBounty deployment.",
      variant: "error",
    };
  }

  const revertName = extractErrorName(error);
  if (revertName && ERROR_MESSAGES[revertName]) {
    return ERROR_MESSAGES[revertName];
  }

  const revertReason = extractRevertReason(error);
  if (revertReason && REVERT_REASON_MESSAGES[revertReason]) {
    return REVERT_REASON_MESSAGES[revertReason];
  }

  if (error instanceof Error) {
    const errorWithShortMessage = error as Error & { shortMessage?: string };
    return {
      title: "Transaction Failed",
      description: errorWithShortMessage.shortMessage ?? error.message,
      variant: "error",
    };
  }

  return {
    title: "Transaction Failed",
    description: "Unknown error.",
    variant: "error",
  };
}
