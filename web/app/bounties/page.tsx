import { BountyBrowser } from "@/components/bounty/bounty-browser";

export const metadata = {
  title: "Open Bounties - MathBounty",
  description: "Browse open mathematical bounties on Sepolia.",
};

export default function BountiesPage() {
  return <BountyBrowser />;
}
