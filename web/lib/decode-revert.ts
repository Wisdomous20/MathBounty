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

export function decodeContractError(error: unknown): RevertMessage {
  const rpcError = error as { code?: string };
  if (rpcError?.code === "ACTION_REJECTED") {
    return {
      title: "Signature Rejected",
      description: "You cancelled the wallet request.",
      variant: "info",
    };
  }

  const revertName = extractErrorName(error);
  if (revertName && ERROR_MESSAGES[revertName]) {
    return ERROR_MESSAGES[revertName];
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
