// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MathBounty
 * @dev A permissionless bounty contract for math problems.
 * 
 * State Machine:
 * Open -> Paid (via submitSolution)
 * Open -> Expired (via reclaimExpired)
 * 
 * Terminal States: Paid, Expired.
 */
contract MathBounty is ReentrancyGuard {
    enum BountyStatus {
        Open,
        Paid,
        Expired
    }

    struct Bounty {
        address poster;
        bytes32 answerHash;
        uint256 reward;
        uint256 expiresAt;
        BountyStatus status;
    }

    error ZeroReward();
    error InvalidExpiry();
    error NotPoster();
    error NotOpen();
    error NotExpired();
    error RefundFailed();
    error InvalidAnswer();
    error Expired();
    error SelfSolveForbidden();
    error PayoutFailed();

    uint256 public bountyCount;
    mapping(uint256 => Bounty) private bounties;
    mapping(address => uint256[]) private posterBounties;

    event BountyPosted(
        uint256 indexed bountyId,
        address indexed poster,
        bytes32 answerHash,
        uint256 reward,
        uint256 expiresAt
    );

    event BountyReclaimed(
        uint256 indexed bountyId,
        address indexed poster,
        uint256 reward
    );

    event SolutionAccepted(
        uint256 indexed bountyId,
        address indexed solver,
        uint256 reward
    );

    modifier onlyPoster(uint256 bountyId) {
        if (msg.sender != bounties[bountyId].poster) revert NotPoster();
        _;
    }

    modifier onlyOpen(uint256 bountyId) {
        if (bounties[bountyId].status != BountyStatus.Open) revert NotOpen();
        _;
    }

    modifier notSelf(uint256 bountyId) {
        if (msg.sender == bounties[bountyId].poster) revert SelfSolveForbidden();
        _;
    }

    modifier notExpired(uint256 bountyId) {
        if (block.timestamp > bounties[bountyId].expiresAt) revert Expired();
        _;
    }

    modifier isExpired(uint256 bountyId) {
        if (block.timestamp <= bounties[bountyId].expiresAt) revert NotExpired();
        _;
    }

    function postBounty(bytes32 answerHash, uint256 expiresAt)
        external
        payable
        returns (uint256 bountyId)
    {
        if (msg.value == 0) revert ZeroReward();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        bountyCount += 1;
        bountyId = bountyCount;

        bounties[bountyId] = Bounty({
            poster: msg.sender,
            answerHash: answerHash,
            reward: msg.value,
            expiresAt: expiresAt,
            status: BountyStatus.Open
        });

        posterBounties[msg.sender].push(bountyId);

        emit BountyPosted(bountyId, msg.sender, answerHash, msg.value, expiresAt);
    }

    function submitSolution(uint256 bountyId, string calldata answer)
        external
        onlyOpen(bountyId)
        notSelf(bountyId)
        notExpired(bountyId)
        nonReentrant
    {
        Bounty storage bounty = bounties[bountyId];
        if (keccak256(bytes(answer)) != bounty.answerHash) revert InvalidAnswer();

        bounty.status = BountyStatus.Paid;

        uint256 payout = bounty.reward;
        bounty.reward = 0;
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert PayoutFailed();

        emit SolutionAccepted(bountyId, msg.sender, payout);
    }

    function reclaimExpired(uint256 bountyId) 
        external 
        onlyPoster(bountyId)
        onlyOpen(bountyId)
        isExpired(bountyId)
        nonReentrant 
    {
        Bounty storage bounty = bounties[bountyId];

        bounty.status = BountyStatus.Expired;
        uint256 refundAmount = bounty.reward;
        bounty.reward = 0;

        (bool success, ) = payable(bounty.poster).call{value: refundAmount}("");
        if (!success) revert RefundFailed();

        emit BountyReclaimed(bountyId, bounty.poster, refundAmount);
    }

    function claimRefund(uint256 bountyId) 
        external 
        onlyPoster(bountyId)
        onlyOpen(bountyId)
        isExpired(bountyId)
        nonReentrant 
    {
        Bounty storage bounty = bounties[bountyId];

        bounty.status = BountyStatus.Expired;
        uint256 refundAmount = bounty.reward;
        bounty.reward = 0;

        (bool success, ) = payable(bounty.poster).call{value: refundAmount}("");
        if (!success) revert RefundFailed();

        emit BountyReclaimed(bountyId, bounty.poster, refundAmount);
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getBounties(uint256[] calldata bountyIds) external view returns (Bounty[] memory) {
        Bounty[] memory results = new Bounty[](bountyIds.length);

        for (uint256 i = 0; i < bountyIds.length; i++) {
            results[i] = bounties[bountyIds[i]];
        }

        return results;
    }

    function getMyPostedBounties() external view returns (uint256[] memory) {
        return posterBounties[msg.sender];
    }
}

