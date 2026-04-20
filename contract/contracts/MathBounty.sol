// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MathBounty {
    enum BountyStatus {
        Open,
        Solved,
        Expired,
        Claimed
    }

    struct Bounty {
        uint256 id;
        address poster;
        uint256 reward;
        string problemStatement;
        bytes32 answerHash;
        uint256 deadline;
        address solver;
        BountyStatus status;
    }

    uint256 public bountyCount;
    mapping(uint256 => Bounty) private bounties;
    mapping(address => uint256[]) private posterBounties;
    mapping(address => uint256[]) private solverHistory;

    event BountyCreated(uint256 indexed id, address indexed poster, uint256 reward, uint256 deadline);
    event BountySolved(uint256 indexed id, address indexed solver, uint256 reward);
    event AnswerAttempted(uint256 indexed id, address indexed solver, bool success);
    event BountyRefunded(uint256 indexed id, address indexed poster, uint256 reward);

    modifier onlyOpen(uint256 bountyId) {
        require(bounties[bountyId].status == BountyStatus.Open, "Bounty is not open");
        _;
    }

    modifier notExpired(uint256 bountyId) {
        require(block.timestamp <= bounties[bountyId].deadline, "Bounty has expired");
        _;
    }

    modifier isExpired(uint256 bountyId) {
        require(block.timestamp > bounties[bountyId].deadline, "Bounty has not expired");
        _;
    }

    modifier onlyPoster(uint256 bountyId) {
        require(msg.sender == bounties[bountyId].poster, "Only poster can call");
        _;
    }

    function createBounty(
        string calldata problemStatement,
        bytes32 answerHash,
        uint256 deadline
    ) external payable {
        require(msg.value > 0, "Reward must be greater than zero");
        require(deadline > block.timestamp, "Deadline must be in future");

        bountyCount += 1;
        bounties[bountyCount] = Bounty({
            id: bountyCount,
            poster: msg.sender,
            reward: msg.value,
            problemStatement: problemStatement,
            answerHash: answerHash,
            deadline: deadline,
            solver: address(0),
            status: BountyStatus.Open
        });

        posterBounties[msg.sender].push(bountyCount);
        emit BountyCreated(bountyCount, msg.sender, msg.value, deadline);
    }

    function submitAnswer(uint256 bountyId, string calldata answer) external onlyOpen(bountyId) notExpired(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.poster != address(0), "Bounty does not exist");
        require(msg.sender != bounty.poster, "Poster cannot solve own bounty");

        bool isCorrect = keccak256(abi.encodePacked(answer)) == bounty.answerHash;
        emit AnswerAttempted(bountyId, msg.sender, isCorrect);

        if (isCorrect) {
            bounty.status = BountyStatus.Solved;
            bounty.solver = msg.sender;
            solverHistory[msg.sender].push(bountyId);

            uint256 payout = bounty.reward;
            bounty.reward = 0;
            (bool success, ) = msg.sender.call{value: payout}("");
            require(success, "Reward payout failed");
            emit BountySolved(bountyId, msg.sender, payout);
        }
    }

    function claimRefund(uint256 bountyId) external onlyOpen(bountyId) isExpired(bountyId) onlyPoster(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        bounty.status = BountyStatus.Expired;

        uint256 refundAmount = bounty.reward;
        bounty.reward = 0;
        bounty.status = BountyStatus.Claimed;

        (bool success, ) = bounty.poster.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit BountyRefunded(bountyId, bounty.poster, refundAmount);
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getMyPostedBounties() external view returns (uint256[] memory) {
        return posterBounties[msg.sender];
    }

    function getMySolvedBounties() external view returns (uint256[] memory) {
        return solverHistory[msg.sender];
    }
}
