# Subagent U6 Summary: Replace Landing Page Sample Data with On-Chain Data

## Changed Files
- `web/app/page.tsx`

## What Changed

### 1. Real On-Chain Stats (replaced hardcoded `stats` array)
- Added data-fetching logic using `getReadProvider`, `ethers.Contract`, and `MATH_BOUNTY_ABI` to query the MathBounty contract.
- Fetches `bountyCount` and iterates up to the 50 most recent bounties via `getBounties` (with fallback to individual `getBounty` calls).
- Computes four metrics live from chain data:
  - **Total Escrowed** — sum of all bounty rewards
  - **Active Bounties** — count of bounties with `status=Open` and `expiresAt > now`
  - **Proven Solutions** — count of bounties with `status=Paid`
  - **Avg. Reward** — average reward among active bounties
- Stats are stored in component state and rendered dynamically.

### 2. Real Open Bounties Grid (replaced static 4-card sample array)
- Filters the fetched bounties for open, non-expired items.
- Selects the top 4 newest open bounties.
- Fetches metadata titles via `useBountyMetadata().getMetadataBatch`.
- Maps each bounty to the existing card layout, preserving the asymmetric grid sizing (cards 0 and 3 span `md:col-span-7`, cards 1 and 2 span `md:col-span-5`).
- Deadlines are formatted as relative durations (`Xm`, `Xh`, `Xd`).

### 3. Loading States
- Added `Skeleton` components from `@/components/ui/skeleton` for both the stats band and the bounty grid.
- Stats show pulsing skeleton rectangles while loading.
- Bounty grid shows 4 skeleton cards that match the existing layout during loading.

### 4. Error Handling
- Wrapped the entire fetch in `try/catch`.
- On RPC or contract failure, displays a bordered error panel with the message and a **Retry** button that reloads the page.
- The page never crashes on contract misconfiguration or network errors.

### 5. Empty State
- When no bounties exist on-chain (or none are open), the bounty section shows a "BE THE FIRST TO POST" CTA with a prominent link to `/new`.

### 6. Removed Fake Data Footnote
- Deleted the "Example Metrics — On-chain data coming soon" disclaimer from the stats band.

### 7. BountyPylon Left Unchanged
- The decorative scrolling feed in the hero (`BountyPylon`) was kept as-is per the task scope ("if trivial"). Wiring it to real data would require a significant refactor of `use-bounty-feed.ts` with polling/real-time logic, which was out of scope for this unit.

## Validation
- TypeScript compilation passed cleanly (`JavaScript/TypeScript clean`).
- No new dependencies were added; all imports reuse existing project modules.
