# CORE-2 Implementation Context

## Purpose

This document captures the CORE-2 implementation that was shipped in this repo so teammates can continue development (especially CORE-5) with accurate technical context.

CORE-2 goal delivered: solver submits answer, contract verifies hash, and reward auto-pays in the same transaction.

## Scope Delivered

- Contract submit path hardened with:
  - `ReentrancyGuard` (OpenZeppelin)
  - strict custom-error reverts
  - checks-effects-interactions payout ordering
- Web bounty detail route implemented:
  - `web/app/bounty/[id]/page.tsx`
  - read bounty state on-chain
  - render Open/Paid/Expired states
  - allow solver submit flow
  - block poster self-solve in UI
  - toast-based success/error handling
- Frontend parity fix:
  - answer hashing now trims whitespace in `/new` before commit hash generation

## Naming Decision (Locked)

Per team direction, the implementation keeps the existing names:

- Contract function: `submitAnswer(...)` (not `submitSolution(...)`)
- Success event: `BountySolved(...)` (not `SolutionAccepted(...)`)

This matters for any downstream event query logic (including CORE-5).

## Contract Changes (CORE-2-relevant)

File: `contract/contracts/MathBounty.sol`

- Added OZ guard inheritance:
  - `import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";`
  - `contract MathBounty is ReentrancyGuard`
- Added custom errors used by submit flow:
  - `InvalidAnswer`
  - `Expired`
  - `SelfSolveForbidden`
  - `PayoutFailed`
- Reworked `submitAnswer` behavior:
  - Revert if bounty is not open (`NotOpen`)
  - Revert if expired (`Expired`)
  - Revert if caller is poster (`SelfSolveForbidden`)
  - Revert on hash mismatch (`InvalidAnswer`)
  - Set `status = Paid` and `reward = 0` before external call
  - Transfer reward via `.call`
  - Revert on failed payout (`PayoutFailed`)
  - Emit `BountySolved`

## Test Coverage Added/Updated

File: `contract/test/MathBounty.ts`

`submitAnswer` tests now cover:

- happy path solve + payout event
- solver balance delta assertion after successful solve
- wrong answer reverts (`InvalidAnswer`)
- self-solve reverts (`SelfSolveForbidden`)
- expired submit reverts (`Expired`)
- second solve reverts (`NotOpen`)

CORE-3 reclaim tests remain passing in the same suite.

## Deployment + Runtime Config

Deployed contract (latest CORE-2 deployment):

- Address: `0x9845d883FDf45C597c8dC4E97E1B99AFf1d34707`
- Deploy tx: `0x74b8f40956aacc6a1231be4a850459759b0f5cd5ab90935b4169e3f89258c349`
- Deploy block: `10741726`

Frontend runtime env expected:

- `NEXT_PUBLIC_MATH_BOUNTY_ADDRESS`
- `NEXT_PUBLIC_MATH_BOUNTY_DEPLOY_BLOCK`

## Web Integration Changes

### New/Updated files

- `web/app/bounty/[id]/page.tsx`
- `web/lib/decode-revert.ts`
- `web/lib/read-provider.ts`
- `web/lib/contracts.ts` (ABI + custom errors)
- `web/lib/use-bounty-list.ts` (uses shared read provider helper)
- `web/app/new/page.tsx` (trim before hash)

### Error mapping

`web/lib/decode-revert.ts` maps contract custom errors to user copy used in toasts. Reuse this in future write flows to keep UX consistent.

### Shared read provider

`web/lib/read-provider.ts` is the common public-read provider helper (wallet provider when available, Sepolia RPC fallback otherwise). CORE-5 should reuse it.

## Relation to CORE-3 and CORE-4 (Already Implemented)

Based on project state and context files:

- CORE-3 reclaim flow is implemented in contract and test coverage.
- CORE-4 browse/list logic is implemented and reusable (`useBountyList` etc.).

This means CORE-5 can focus on account-scoped presentation and route-level UX, not rewriting chain interaction primitives.

## CORE-5 Alignment Guide

CORE-5 target: `/me/posts` and `/me/solved` dashboards with wallet-gated views and inline reclaim.

### Reuse for `/me/posts`

- Reuse wallet state from `useWallet`
- Reuse read provider helper from `web/lib/read-provider.ts`
- Reuse/extend existing bounty list/event scan logic from `useBountyList`
- Reuse inline reclaim interaction pattern already established in bounty detail flow

### Reuse for `/me/solved`

Important compatibility note:

- CORE-5 instructions mention `SolutionAccepted`
- Current contract emits `BountySolved`

So `/me/solved` must query `BountySolved` events (not `SolutionAccepted`) unless contract naming is changed in a future migration.

### Suggested query strategy

- Start scans from `NEXT_PUBLIC_MATH_BOUNTY_DEPLOY_BLOCK`
- Filter by connected wallet:
  - posts tab: `BountyPosted` where `poster == connectedAddress`
  - solved tab: `BountySolved` where `solver == connectedAddress`
- Refresh on:
  - wallet account change
  - tab focus
  - periodic interval/new blocks

## Known Technical Notes

- `contract/hardhat.config.ts` accepts `PRIVATE_KEY` fallback, matching current local `.env` style.
- Deployment script prints address + tx + block for easier frontend sync.
- A local background block-scan helper previously failed and was superseded by the improved deploy script output; no action needed.

## Navigation Convention (Updated)

To avoid mixed navigation behavior across pages:

- Use `/bounties` for primary bounty discovery navigation (header links, hero CTA, cross-page links).
- Reserve `#bounties` only for same-page anchor scrolling inside the home page.
- If the home page keeps a `#bounties` section, it should be aligned with the same component system and live on-chain data used by `/bounties` (avoid static/demo-only divergence).

Implemented in this pass:

- `web/app/page.tsx`: header "Bounties" link now routes to `/bounties`
- `web/components/hero/hero-section.tsx`: "View Bounties" CTA now routes to `/bounties`

## Recommended Next Steps for CORE-5

1. Build `web/app/me/posts/page.tsx` and `web/app/me/solved/page.tsx`
2. Add tabs and count badges for both views
3. Gate both routes behind wallet connect
4. Wire `/me/posts` reclaim button to existing reclaim behavior
5. Use `BountySolved` event for `/me/solved` rows
6. Reuse existing toast/error conventions from CORE-2 helpers

## Manual Test Guide (CORE-2 + related flows)

Use Sepolia with two wallets:

- Wallet A = poster
- Wallet B = solver

Pre-checks:

- `web/.env` (or `.env.local`) has valid `NEXT_PUBLIC_MATH_BOUNTY_ADDRESS` and `NEXT_PUBLIC_MATH_BOUNTY_DEPLOY_BLOCK`
- MetaMask is connected to Sepolia
- both wallets have Sepolia ETH for gas, and poster has enough ETH for bounty reward

### 1) Post a bounty

1. Connect Wallet A
2. Open `/new`
3. Enter title/description/answer/reward/expiry and submit
4. Confirm tx in wallet

Expected:

- success toast after confirmation
- route changes to `/bounty/[id]`
- bounty appears on `/bounties` within refresh window

### 2) Incorrect answer (solver path)

1. Switch/connect Wallet B
2. Open target `/bounty/[id]`
3. Submit an incorrect answer

Expected:

- transaction reverts
- error toast indicating wrong answer
- bounty status remains Open
- no payout to solver

### 3) Correct answer + payout

1. Still on Wallet B, submit the correct answer
2. Confirm tx in wallet

Expected:

- success toast with tx reference
- bounty status changes to Paid
- `BountySolved` event emitted on-chain
- Wallet B balance increases (net of gas)

### 4) Poster protection (self-solve blocked)

1. Open same bounty as Wallet A (poster)
2. Attempt to solve from poster view

Expected:

- UI prevents solving (disabled/self-solve blocked state)
- contract-level protection also exists (`SelfSolveForbidden`) if submit is forced externally

### 5) Expired behavior + reclaim

1. Post a bounty with short expiry using Wallet A
2. Wait until `now > expiresAt`
3. Verify expired state in UI
4. Trigger reclaim from eligible poster surface

Expected:

- reclaim only available when all conditions hold:
  - poster is connected caller
  - bounty is Open
  - current time is strictly after expiry
- reclaim success toast after confirmation
- status changes to Expired
- Wallet A receives refund (minus gas)
- `BountyReclaimed` event emitted

### 6) Wallet state handling

1. Disconnect wallet on `/bounty/[id]`
2. Reconnect with different wallet
3. Switch between Wallet A and Wallet B while viewing same bounty

Expected:

- disconnected state shows connect prompt
- reconnect rehydrates view without page break
- poster vs solver action states update correctly after account switch
- no stale actions should remain enabled after wallet change

### Optional on-chain verification checklist

- Etherscan shows:
  - `BountyPosted` for create
  - failed wrong-answer tx (reverted)
  - successful correct-answer tx with `BountySolved`
  - reclaim tx with `BountyReclaimed` for expired case

---

If contract event/function names change in future work, update this file and `web/lib/contracts.ts` first to keep all AI/context consumers aligned.
