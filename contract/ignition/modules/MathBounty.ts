import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MathBountyModule = buildModule("MathBountyModule", (m) => {
  const contract = m.contract("MathBounty");
  return { contract };
});

export default MathBountyModule;
