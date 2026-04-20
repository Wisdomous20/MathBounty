import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const contract = await ethers.deployContract("MathBounty");
  await contract.waitForDeployment();

  console.log("MathBounty deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
