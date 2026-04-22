export const MATH_BOUNTY_ADDRESS = (
  process.env.NEXT_PUBLIC_MATH_BOUNTY_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const MATH_BOUNTY_ABI = [
  "function postBounty(bytes32 answerHash, uint256 expiresAt) external payable returns (uint256)",
  "function submitAnswer(uint256 bountyId, string calldata answer) external",
  "function claimRefund(uint256 bountyId) external",
  "function getBounty(uint256 bountyId) external view returns (tuple(address poster, bytes32 answerHash, uint256 reward, uint256 expiresAt, uint8 status))",
  "function bountyCount() external view returns (uint256)",
  "event BountyPosted(uint256 indexed bountyId, address indexed poster, bytes32 answerHash, uint256 reward, uint256 expiresAt)",
] as const;
