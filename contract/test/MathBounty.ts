import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("MathBounty", function () {
  it("creates a bounty with valid parameters", async function () {
    const [poster] = await ethers.getSigners();
    const contract = await ethers.deployContract("MathBounty");
    const reward = ethers.parseEther("1");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

    await expect(
      contract.connect(poster).createBounty("What is 6*7?", answerHash, deadline, { value: reward })
    ).to.emit(contract, "BountyCreated");

    const bounty = await contract.getBounty(1n);
    expect(bounty.poster).to.equal(poster.address);
    expect(bounty.reward).to.equal(reward);
  });
});
