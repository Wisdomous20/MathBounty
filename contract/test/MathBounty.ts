import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("MathBounty", function () {
  describe("postBounty", function () {
    it("reverts with RewardTooLow when msg.value is below 0.0001 ETH", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await expect(
        contract.connect(poster).postBounty(answerHash, expiresAt, { value: ethers.parseEther("0.00001") })
      ).to.be.revertedWithCustomError(contract, "RewardTooLow");
    });

    it("allows posting with exactly 0.0001 ETH", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
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
      const expiresInPast = BigInt(Math.floor(Date.now() / 1000) - 3600);

      await expect(
        contract.connect(poster).postBounty(answerHash, expiresInPast, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "InvalidExpiry");
    });

    it("creates a bounty and emits BountyPosted event", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
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
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await contract.connect(solver).submitAnswer(1n, "42");

      const bounty = await contract.getBounty(1n);
      expect(bounty.status).to.equal(1n); // Paid
      expect(bounty.reward).to.equal(0n);
    });

    it("reverts when answer is wrong", async function () {
      const [poster, solver] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await contract.connect(solver).submitAnswer(1n, "43");

      const bounty = await contract.getBounty(1n);
      expect(bounty.status).to.equal(0n); // Still Open
    });

    it("reverts when poster tries to solve own bounty", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await expect(
        contract.connect(poster).submitAnswer(1n, "42")
      ).to.be.revertedWith("Poster cannot solve own bounty");
    });
  });

  describe("claimRefund", function () {
    it("allows poster to refund after expiry", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      // Advance time past expiry
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await contract.connect(poster).claimRefund(1n);

      const bounty = await contract.getBounty(1n);
      expect(bounty.status).to.equal(2n); // Expired
      expect(bounty.reward).to.equal(0n);
    });

    it("reverts when not yet expired", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const reward = ethers.parseEther("1");
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400);
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

      await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

      await expect(
        contract.connect(poster).claimRefund(1n)
      ).to.be.revertedWith("Not yet expired");
    });
  });
});
