import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

async function futureExpiry(secondsFromNow: number) {
  const block = await ethers.provider.getBlock("latest");
  if (!block) throw new Error("No latest block");
  return BigInt(block.timestamp + secondsFromNow);
}

describe("MathBounty", function () {
  describe("postBounty", function () {
    it("reverts with RewardTooLow when msg.value is below 0.0001 ETH", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const expiresAt = await futureExpiry(3600);

      await expect(
        contract.connect(poster).postBounty(answerHash, expiresAt, { value: ethers.parseEther("0.00001") })
      ).to.be.revertedWithCustomError(contract, "RewardTooLow");
    });

    it("allows posting with exactly 0.0001 ETH", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const expiresAt = await futureExpiry(3600);
      const reward = ethers.parseEther("0.0001");

      const tx = await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });
      const receipt = await tx.wait();
      if (!receipt) throw new Error("No receipt");
      const bountyId = (receipt.logs[0] as any).args[0];
      expect(bountyId).to.equal(1n);
    });

    it("reverts with InvalidExpiry when expiresAt is in the past", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const expiresInPast = await futureExpiry(-3600);

      await expect(
        contract.connect(poster).postBounty(answerHash, expiresInPast, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "InvalidExpiry");
    });

    it("creates a bounty and emits BountyPosted event", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      const tx = await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });
      const receipt = await tx.wait();
      if (!receipt) throw new Error("No receipt");

      const bountyId = (receipt.logs[0] as any).args[0];
      expect(bountyId).to.equal(1n);

      const bounty = await contract.getBounty(bountyId);
      expect(bounty.poster).to.equal(poster.address);
      expect(bounty.answerHash).to.equal(answerHash);
      expect(bounty.reward).to.equal(reward);
      expect(bounty.expiresAt).to.equal(expiresAt);
      expect(bounty.status).to.equal(0n); // Open
    });
  });

  describe("submitAnswer", function () {
    it("solves a bounty and pays the solver", async function () {
      const [poster, solver] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      const solverBalanceBefore = await ethers.provider.getBalance(solver.address);
      const solveTx = await contract.connect(solver).submitAnswer(1n, "42");

      await expect(solveTx)
        .to.emit(contract, "BountySolved")
        .withArgs(1n, solver.address, reward);
      const solveReceipt = await solveTx.wait();
      if (!solveReceipt) throw new Error("No solve receipt");
      const solverBalanceAfter = await ethers.provider.getBalance(solver.address);

      const gasCost = solveReceipt.gasUsed * solveReceipt.gasPrice;
      expect(solverBalanceAfter - solverBalanceBefore).to.equal(reward - gasCost);

      const bounty = await contract.getBounty(1n);
      expect(bounty.status).to.equal(1n); // Paid
      expect(bounty.reward).to.equal(0n);
    });

    it("reverts when answer is wrong", async function () {
      const [poster, solver] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await expect(
        contract.connect(solver).submitAnswer(1n, "43")
      ).to.be.revertedWithCustomError(contract, "InvalidAnswer");
    });

    it("reverts when poster tries to solve own bounty", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await expect(
        contract.connect(poster).submitAnswer(1n, "42")
      ).to.be.revertedWithCustomError(contract, "SelfSolveForbidden");
    });

    it("reverts when submitting after expiry", async function () {
      const [poster, solver] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(120);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });
      await ethers.provider.send("evm_increaseTime", [121]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(solver).submitAnswer(1n, "42")
      ).to.be.revertedWithCustomError(contract, "Expired");
    });

    it("reverts when trying to solve an already paid bounty", async function () {
      const [poster, solver, anotherSolver] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });
      await contract.connect(solver).submitAnswer(1n, "42");

      await expect(
        contract.connect(anotherSolver).submitAnswer(1n, "42")
      ).to.be.revertedWithCustomError(contract, "NotOpen");
    });
  });

  describe("reclaimExpired", function () {
    it("allows poster to reclaim after expiry", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      // Advance time past expiry
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const posterBalanceBefore = await ethers.provider.getBalance(poster.address);
      await contract.connect(poster).reclaimExpired(1n);
      const posterBalanceAfter = await ethers.provider.getBalance(poster.address);
      const contractBalance = await ethers.provider.getBalance(contract);

      expect(posterBalanceAfter).to.be.greaterThan(posterBalanceBefore + reward - ethers.parseEther("0.01"));
      expect(contractBalance).to.equal(0n);

      const bounty = await contract.getBounty(1n);
      expect(bounty.status).to.equal(2n); // Expired
      expect(bounty.reward).to.equal(0n);
    });

    it("emits BountyReclaimed", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await expect(contract.connect(poster).reclaimExpired(1n))
        .to.emit(contract, "BountyReclaimed")
        .withArgs(1n, poster.address, reward);
    });

    it("supports claimRefund as a legacy alias", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await contract.connect(poster).claimRefund(1n);

      const bounty = await contract.getBounty(1n);
      expect(bounty.status).to.equal(2n); // Expired
      expect(bounty.reward).to.equal(0n);
    });

    it("reverts with NotPoster when caller is not the poster", async function () {
      const [poster, nonPoster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(nonPoster).reclaimExpired(1n)
      ).to.be.revertedWithCustomError(contract, "NotPoster");
    });

    it("reverts with NotExpired when not yet expired", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(86400);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await expect(
        contract.connect(poster).reclaimExpired(1n)
      ).to.be.revertedWithCustomError(contract, "NotExpired");
    });

    it("reverts with NotOpen when bounty is already paid", async function () {
      const [poster, solver] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });
      await contract.connect(solver).submitAnswer(1n, "42");

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(poster).reclaimExpired(1n)
      ).to.be.revertedWithCustomError(contract, "NotOpen");
    });

    it("reverts with NotOpen when bounty is already reclaimed", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = await futureExpiry(3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await contract.connect(poster).reclaimExpired(1n);

      await expect(
        contract.connect(poster).reclaimExpired(1n)
      ).to.be.revertedWithCustomError(contract, "NotOpen");
    });
  });

  describe("getBounties", function () {
    it("returns multiple bounties in a single read", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const firstReward = ethers.parseEther("1");
      const secondReward = ethers.parseEther("2");
      const firstExpiry = await futureExpiry(3600);
      const secondExpiry = await futureExpiry(7200);
      const firstAnswerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const secondAnswerHash = ethers.keccak256(ethers.toUtf8Bytes("84"));

      await contract.connect(poster).postBounty(firstAnswerHash, firstExpiry, { value: firstReward });
      await contract.connect(poster).postBounty(secondAnswerHash, secondExpiry, { value: secondReward });

      const bounties = await contract.getBounties([1n, 2n]);

      expect(bounties).to.have.lengthOf(2);
      expect(bounties[0].poster).to.equal(poster.address);
      expect(bounties[0].answerHash).to.equal(firstAnswerHash);
      expect(bounties[0].reward).to.equal(firstReward);
      expect(bounties[0].expiresAt).to.equal(firstExpiry);
      expect(bounties[0].status).to.equal(0n);
      expect(bounties[1].poster).to.equal(poster.address);
      expect(bounties[1].answerHash).to.equal(secondAnswerHash);
      expect(bounties[1].reward).to.equal(secondReward);
      expect(bounties[1].expiresAt).to.equal(secondExpiry);
      expect(bounties[1].status).to.equal(0n);
    });
  });
});
