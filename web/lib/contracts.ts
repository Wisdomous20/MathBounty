export const MATH_BOUNTY_ADDRESS = (
  process.env.NEXT_PUBLIC_MATH_BOUNTY_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const MATH_BOUNTY_DEPLOY_BLOCK = Number(
  process.env.NEXT_PUBLIC_MATH_BOUNTY_DEPLOY_BLOCK ?? "0"
);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function hasConfiguredMathBountyAddress() {
  return MATH_BOUNTY_ADDRESS.toLowerCase() !== ZERO_ADDRESS;
}

export async function assertMathBountyContract(provider: {
  getCode: (address: string) => Promise<string>;
}) {
  if (!hasConfiguredMathBountyAddress()) {
    throw new Error(
      "MathBounty contract address is not configured. Set NEXT_PUBLIC_MATH_BOUNTY_ADDRESS in web/.env.local and restart the dev server."
    );
  }

  const bytecode = await provider.getCode(MATH_BOUNTY_ADDRESS);
  if (bytecode === "0x") {
    throw new Error(
      `No contract found at ${MATH_BOUNTY_ADDRESS}. Check that NEXT_PUBLIC_MATH_BOUNTY_ADDRESS points to the deployed MathBounty contract on Sepolia.`
    );
  }
}

export const MATH_BOUNTY_ABI = [
  "function postBounty(bytes32 answerHash, uint256 expiresAt) external payable returns (uint256)",
  "function submitAnswer(uint256 bountyId, string calldata answer) external",
  "function reclaimExpired(uint256 bountyId) external",
  "function claimRefund(uint256 bountyId) external",
  "function getBounty(uint256 bountyId) external view returns (tuple(address poster, bytes32 answerHash, uint256 reward, uint256 expiresAt, uint8 status))",
  "function bountyCount() external view returns (uint256)",
  "event BountyPosted(uint256 indexed bountyId, address indexed poster, bytes32 answerHash, uint256 reward, uint256 expiresAt)",
  "event BountyReclaimed(uint256 indexed bountyId, address indexed poster, uint256 reward)",
] as const;
