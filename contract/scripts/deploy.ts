import { network } from "hardhat";

const { ethers } = await network.create({
  network: "sepolia",
  chainType: "l1",
});

async function main() {
  const contract = await ethers.deployContract("MathBounty");
  const deploymentTx = contract.deploymentTransaction();
  const deploymentReceipt = deploymentTx ? await deploymentTx.wait() : null;
  await contract.waitForDeployment();

  console.log("MathBounty deployed to:", await contract.getAddress());
  if (deploymentReceipt) {
    console.log("Deploy tx:", deploymentReceipt.hash);
    console.log("Deploy block:", deploymentReceipt.blockNumber);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
