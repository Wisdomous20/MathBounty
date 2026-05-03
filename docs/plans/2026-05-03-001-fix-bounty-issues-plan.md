---
title: Fix MathBounty Bugs — Wallet Persistence, Bounty Display, Answer Feedback, Reclaim, Landing Page Data, and UI Guidance
type: fix
status: active
date: 2026-05-03
---

# Fix MathBounty Bugs — Wallet Persistence, Bounty Display, Answer Feedback, Reclaim, Landing Page Data, and UI Guidance

## Overview

Fix the set of bugs and UX gaps identified in the MathBounty codebase:

1. **Wallet disconnect does not persist** — after clicking disconnect and refreshing, MetaMask auto-reconnects because the app has no memory of the user's explicit disconnect action.
2. **Bounties display as "Bounty #X" instead of titles** — metadata sync from creator to shared store (Supabase/local JSON) is unreliable; viewers without the creator's localStorage see fallback titles.
3. **Answer validation feedback is invisible** — users see only a brief toast on wrong answers, with no persistent indicator of correctness.
4. **Reclaim Ethereum for expired bounties fails** — the transaction submission path has fragile fallback logic and poor error diagnostics.
5. **No clear navigation after posting a bounty** — after creation, users land on the individual bounty page with no prominent path back to the list.
6. **Landing page uses entirely fake data** — stats and bounty cards are hardcoded sample arrays instead of on-chain data.
7. **UI lacks guidance copy** — users don't understand bounty creation best practices or the consequences of wrong answers.

---

## Problem Frame

MathBounty is a Next.js app (pages router) + Hardhat Solidity contract on Sepolia. The identified bugs span wallet UX, off-chain metadata reliability, on-chain interaction robustness, and landing-page data fidelity. All issues degrade user trust and clarity. Fixing them requires surgical changes across React hooks, contract-interaction utilities, and page components — no architectural overhaul.

---

## Requirements Trace

- **R1.** After a user explicitly disconnects their wallet, refreshing the page must NOT auto-reconnect until the user chooses to connect again.
- **R2.** Every bounty visible to any user must display its real title and description, falling back gracefully only when metadata is genuinely unavailable — never showing "Bounty #X" as the primary title.
- **R3.** After submitting an answer, the user must see a persistent, clear visual indicator of whether their answer was correct (reward claimed) or incorrect (gas fee deducted).
- **R4.** A bounty poster must be able to reclaim escrow from an expired bounty successfully, with clear error messages if the reclaim is not yet possible.
- **R5.** After successfully creating a bounty, the user must have an obvious, immediate way to navigate back to the full bounties list.
- **R6.** The landing page must display actual on-chain statistics and a preview of real open bounties, not fabricated sample data.
- **R7.** The UI must include contextual guidance text explaining: how to write a good bounty problem statement, what happens on correct vs incorrect answers, and how posting works.

---

## Scope Boundaries

- **In scope:** Frontend fixes in `web/` for the seven issues above. Contract redeployment is NOT required — the existing `MathBounty.sol` already supports `reclaimExpired` and `claimRefund`.
- **Out of scope:** Adding new contract features (e.g., on-chain title storage), redesigning the landing page visual layout, adding a full FAQ page, or changing the wallet provider library.
- **Deferred:** Adding email notifications, push notifications, or a leaderboard.

---

## Context & Research

### Relevant Code and Patterns

- **Wallet hook:** `web/lib/use-wallet.ts` — manages connection state, auto-connect via `eth_accounts`, and disconnect. No localStorage persistence.
- **Bounty list:** `web/lib/use-bounty-list.ts` — fetches on-chain bounties and metadata; uses `getFallbackTitle(id)` when metadata missing.
- **Metadata hook:** `web/lib/use-bounty-metadata.ts` — two-tier storage (localStorage + server API). API backed by Supabase or local JSON file.
- **Metadata API:** `web/app/api/bounty-metadata/route.ts` — POST/GET for shared metadata; verifies on-chain `BountyPosted` event.
- **Bounty detail page:** `web/app/bounty/[id]/page.tsx` — displays bounty, handles answer submission, already has `repairSharedMetadata` for syncing local metadata to server.
- **Reclaim utility:** `web/lib/reclaim-bounty.ts` — tries `claimRefund` then `reclaimExpired`; both map to the same `_reclaimExpired` internal in the contract.
- **My posts page:** `web/app/me/posts/page.tsx` — lists user's bounties with reclaim button; uses `canReclaimExpiredBounty` from `web/lib/bounty-state.ts`.
- **Landing page:** `web/app/page.tsx` — hardcoded stats array and hardcoded bounty cards.
- **New bounty page:** `web/app/new/page.tsx` — form with basic validation; navigates to `/bounty/${id}` on success.

### Key Findings from Codebase Review

- The wallet auto-connect `useEffect` unconditionally calls `connect()` when `eth_accounts` returns any account. MetaMask remembers authorized sessions across page loads, so this always reconnects after refresh.
- Metadata is stored off-chain only. The creator's browser POSTs it to the API. If that POST fails (e.g., Supabase unconfigured), only the creator's browser has the title. Other viewers see "Bounty #X".
- The `repairSharedMetadata` function on the bounty detail page can push local metadata to the server, but the bounties LIST page has no equivalent repair.
- Answer submission shows a brief toast on success/error, then reloads the bounty. No persistent result state survives the reload.
- `reclaimBountyEscrow` throws on the first `claimRefund` revert if the revert has data, never reaching `reclaimExpired`. Since both methods do the same thing internally, this fallback is moot for a correctly deployed contract.
- Landing page stats and bounties are entirely static arrays with a footnote admitting they are fake.

---

## Key Technical Decisions

- **Wallet persistence:** Use a `localStorage` flag `mathbounty-wallet-disconnected` set on explicit disconnect, cleared on explicit connect. The auto-connect effect checks this flag before calling `connect()`. This is a minimal, reliable state machine extension.
- **Metadata reliability:** Add a background metadata-repair pass to the bounties list page. For any bounty lacking server metadata, if the current browser has it in localStorage, push it to the server. Also improve the fallback display so "Bounty #X" never appears as the card title.
- **Answer feedback:** Add a submission-result state to the bounty detail page that renders a persistent banner (not a toast) after answer submission, showing "Correct — Reward Claimed" or "Incorrect — Gas Fee Deducted". Survive the `loadBounty` refresh by storing the result in component state before reload.
- **Reclaim fix:** Remove the confusing `claimRefund` → `reclaimExpired` fallback in `reclaimBountyEscrow` and call `reclaimExpired` directly (the contract has it). Add better error diagnostics in `handleReclaim` to surface the exact revert reason.
- **Landing page data:** Create a lightweight `useLandingStats` hook that queries the contract for `bountyCount`, iterates open bounties, and computes aggregate stats. Replace the static bounties section with the top 4 real open bounties from `useBountyList` logic, or render a smaller subset inline.

---

## Open Questions

### Resolved During Planning

- **Q:** Should we redirect to `/bounties` instead of `/bounty/${id}` after creation?  
  **A:** No — keep the existing redirect to the new bounty so the creator can verify it immediately, but add a prominent "← Back to All Bounties" button on that page and on the success toast.
- **Q:** Should the landing page fetch ALL bounties or just a preview?  
  **A:** Fetch a lightweight preview (top 4 open bounties with metadata) using the same read-provider pattern as `useBountyList`. Full list remains on `/bounties`.
- **Q:** Is contract redeployment needed for any fix?  
  **A:** No — all fixes are frontend-only.

### Deferred to Implementation

- **Q:** Exact wording for guidance copy strings.  
  _Deferred — implementer will draft concise copy and can refine in review._
- **Q:** Whether to add a skeleton/loading state for landing-page stats.  
  _Deferred — implementer decides based on perceived load time._

---

## Implementation Units

- [ ] U1. **Fix Wallet Disconnect Persistence**

**Goal:** Prevent auto-reconnect after an explicit disconnect across page refreshes.

**Requirements:** R1

**Dependencies:** None

**Files:**

- Modify: `web/lib/use-wallet.ts`

**Approach:**

- In the `disconnect` callback, set `localStorage.setItem('mathbounty-wallet-disconnected', 'true')`.
- In the `connect` callback, after successful connection, remove the item with `localStorage.removeItem('mathbounty-wallet-disconnected')`.
- In the auto-connect `useEffect` (the `eth_accounts` listener), check `localStorage.getItem('mathbounty-wallet-disconnected')`. If present and `'true'`, skip calling `connect()`.

**Patterns to follow:**

- Existing `useWallet` hook structure in `web/lib/use-wallet.ts`.

**Test scenarios:**

- Happy path: User connects wallet → refreshes page → wallet reconnects automatically (flag absent).
- Happy path: User connects → clicks disconnect → refreshes → wallet stays disconnected (flag present).
- Happy path: User connects → disconnects → reconnects manually → refreshes → wallet reconnects (flag cleared on reconnect).
- Edge case: `localStorage` is unavailable (private mode) — degrade gracefully by allowing auto-connect (no worse than today).

**Verification:**

- After disconnect + refresh, `state` remains `"disconnected"` and `address` is `null`.
- After reconnect + refresh, `state` is `"connected"`.

---

- [ ] U2. **Fix Bounty Metadata Display and Reliability**

**Goal:** Ensure every bounty card and detail page shows the real title/description, and metadata missing from the server is auto-repaired when possible.

**Requirements:** R2

**Dependencies:** None

**Files:**

- Modify: `web/lib/use-bounty-list.ts`
- Modify: `web/components/bounty/bounty-browser.tsx`
- Modify: `web/lib/use-bounty-metadata.ts`

**Approach:**

- In `useBountyList.ts`, after loading bounties and metadata, for each bounty that lacks server metadata, check `readAllCachedMetadata()` for a local entry. If found, trigger a background `syncMetadataToServer` call (fire-and-forget, no await).
- Change `getFallbackTitle(id)` to return an empty string `''` instead of `"Bounty #${id}"`. Update `BountyCard` and list rendering so that when `title` is empty, the bounty ID is shown in a muted style (e.g., "Bounty #14 — metadata loading"), but never as the prominent title.
- In `use-bounty-metadata.ts`, strengthen `getMetadataBatch`: after fetching from API, merge any localStorage entries that are newer/more complete into the returned record, and write them back to localStorage.

**Patterns to follow:**

- `repairSharedMetadata` pattern in `web/app/bounty/[id]/page.tsx`.
- Background sync pattern (fire-and-forget with catch) used in `syncPendingMetadata`.

**Test scenarios:**

- Happy path: Bounty with server metadata → displays real title in list and detail.
- Edge case: Bounty without server metadata but with localStorage metadata → displays real title and silently syncs to server.
- Edge case: Bounty with no metadata anywhere → shows muted fallback with ID, not "Bounty #X" as headline.
- Integration: Creator posts bounty with metadata → metadata is visible to a different browser/session within a few seconds.

**Verification:**

- All bounty cards in `/bounties` show human-readable titles.
- No card shows "Bounty #X" as its primary title.

---

- [ ] U3. **Add Persistent Answer Validation Feedback**

**Goal:** After answer submission, show a clear, persistent visual indicator of whether the answer was correct or incorrect.

**Requirements:** R3

**Dependencies:** None

**Files:**

- Modify: `web/app/bounty/[id]/page.tsx`

**Approach:**

- Add a new piece of component state `submissionResult: { type: 'correct' | 'incorrect'; payout: string } | null`.
- In `submitAnswer`, on success (transaction confirms), set `submissionResult` to `{ type: 'correct', payout }` BEFORE calling `loadBounty()`.
- In the `catch` block, when the decoded error is `"InvalidAnswer"` (or `"Wrong Answer"`), set `submissionResult` to `{ type: 'incorrect', payout: '0' }`.
- Render a persistent banner above the submission section when `submissionResult` is set:
  - Correct: green border, text "Answer correct — [payout] claimed".
  - Incorrect: red border, text "Answer incorrect — gas fee deducted. Try again."
- The banner remains visible until the user navigates away or the component unmounts. Do NOT clear it on `loadBounty()`.

**Patterns to follow:**

- Existing `Toast` component for styling reference, but use a static banner (not a dismissible toast) for persistence.

**Test scenarios:**

- Happy path: Submit correct answer → banner shows "Answer correct — X ETH claimed".
- Error path: Submit wrong answer → banner shows "Answer incorrect — gas fee deducted".
- Edge case: Submit wrong answer, then correct answer → banner updates to correct state.
- Edge case: Refresh page after submission → banner is gone (state is ephemeral by design).

**Verification:**

- Wrong answer shows red persistent banner, not just a fleeting toast.
- Correct answer shows green persistent banner with payout amount.

---

- [ ] U4. **Fix Reclaim Ethereum Flow**

**Goal:** Make reclaiming expired bounty escrow reliable and diagnosable.

**Requirements:** R4

**Dependencies:** None

**Files:**

- Modify: `web/lib/reclaim-bounty.ts`
- Modify: `web/app/me/posts/page.tsx`
- Modify: `web/lib/bounty-state.ts`

**Approach:**

- In `reclaim-bounty.ts`, simplify `reclaimBountyEscrow` to call `contract.reclaimExpired(bountyId)` directly. Remove the `claimRefund` → `reclaimExpired` fallback. Add a code comment explaining both contract methods exist but do the same thing, and we use `reclaimExpired` as the canonical method.
- In `me/posts/page.tsx`, enhance `handleReclaim` error handling: after catching an error, check if the bounty is still reclaimable (re-fetch bounty state). If the status changed to `Expired` while the tx was pending, show a specific message: "This bounty was already reclaimed."
- In `bounty-state.ts`, add a helper `getReclaimErrorReason(bounty, nowSeconds, address)` that returns a human-readable string for WHY reclaim is not possible (e.g., "Not expired yet", "Already reclaimed", "Only poster can reclaim"). Use this in the UI to disable the button with a tooltip/explanation.

**Patterns to follow:**

- Existing `decodeContractError` usage in `bounty/[id]/page.tsx`.

**Test scenarios:**

- Happy path: Expired bounty, poster clicks reclaim → transaction succeeds, toast shows "ETH Reclaimed".
- Error path: Bounty not yet expired → button disabled with tooltip "Not expired yet".
- Error path: User is not poster → button disabled with tooltip "Only poster can reclaim".
- Error path: Bounty already reclaimed → button disabled with tooltip "Already reclaimed".
- Error path: Transaction reverts for other reason → toast shows decoded error message.

**Verification:**

- Reclaim button is only enabled when reclaim is actually possible.
- Clicking reclaim on a valid expired bounty succeeds.
- All failure modes show clear, specific error text.

---

- [ ] U5. **Add Post-Creation Navigation**

**Goal:** After posting a bounty, provide an obvious path back to the full bounties list.

**Requirements:** R5

**Dependencies:** None

**Files:**

- Modify: `web/app/new/page.tsx`

**Approach:**

- After successful bounty creation, keep the redirect to `/bounty/${bountyId}`.
- On the new bounty detail page (`bounty/[id]/page.tsx`), the existing "Back to bounties" link is sufficient, but make it more prominent after a fresh creation.
- Add a query parameter `?from=create` to the redirect: `router.push(`/bounty/${bountyId}?from=create`)`.
- In `bounty/[id]/page.tsx`, read the `from` query param. When `from === 'create'`, render a highlighted banner at the top: "Bounty posted successfully. ← Back to all bounties" with the link styled as a primary button.

**Patterns to follow:**

- Next.js `useSearchParams` for query param reading.
- Existing `Link` and button styling from `web/app/new/page.tsx`.

**Test scenarios:**

- Happy path: Create bounty → redirected to new bounty page with success banner visible.
- Happy path: Click "Back to all bounties" → navigates to `/bounties`.
- Edge case: Visit bounty page without `?from=create` → no banner shown.

**Verification:**

- After creating a bounty, a prominent "Back to all bounties" button is visible on the bounty detail page.

---

- [ ] U6. **Replace Landing Page Sample Data with On-Chain Data**

**Goal:** Display real contract statistics and real open bounties on the landing page.

**Requirements:** R6

**Dependencies:** U2 (metadata reliability improvements help bounty cards display correctly)

**Files:**

- Modify: `web/app/page.tsx`
- Modify: `web/components/hero/bounty-pylon.tsx` (optional — if time, wire to real feed)

**Approach:**

- In `app/page.tsx`, replace the hardcoded `stats` array with fetched on-chain data.
- Create a lightweight inline data fetch (or a small hook) that:
  1. Gets `bountyCount` from the contract.
  2. Iterates recent bounties (up to a small limit, e.g., 50) via `getBounties`.
  3. Computes: total escrowed ETH (sum of all rewards), active count (status=Open AND not expired), solved count (status=Paid), average reward.
  4. Fetches metadata for the top 4 open bounties to display in the "Open Bounties" grid.
- Replace the static 4-card grid with real bounty data. If loading, show skeleton cards. If no bounties exist, show a "Be the first to post" CTA.
- Remove the "Example Metrics — On-chain data coming soon" footnote.
- Keep the `BountyPylon` in the hero section as-is for now (it's decorative); if trivial, wire it to real feed data too.

**Patterns to follow:**

- `useBountyList` in `web/lib/use-bounty-list.ts` for bounty iteration pattern.
- `getReadProvider` in `web/lib/read-provider.ts` for provider access.
- `useBountyMetadata` for metadata batch fetching.

**Test scenarios:**

- Happy path: Landing page loads → stats show real numbers matching the contract.
- Happy path: Active bounties exist → top 4 open bounties render with real titles and rewards.
- Edge case: No bounties on-chain → stats show zeros, bounties section shows "Be the first" CTA.
- Edge case: RPC fails → show fallback placeholder text or retry button, never crash.

**Verification:**

- Landing page stats are not hardcoded.
- Landing page bounty cards match data from `/bounties`.
- No "Example Metrics" footnote remains.

---

- [ ] U7. **Add UI Guidance Copy Throughout**

**Goal:** Add descriptive text and prompts to guide users in creating bounties, submitting answers, and understanding consequences.

**Requirements:** R7

**Dependencies:** None

**Files:**

- Modify: `web/app/new/page.tsx`
- Modify: `web/app/bounty/[id]/page.tsx`

**Approach:**

- **New bounty page (`new/page.tsx`):**
  - Below the "Problem Statement" textarea, add a guidance block: "Tip: Make your problem statement as complete as possible. Include the exact question, any constraints, and what format the answer should be in. Vague bounties are less likely to be solved."
  - Below the "Correct Answer" input, add: "Only the keccak256 hash of this answer is stored on-chain. Make sure your answer is unambiguous — solvers must match it exactly."
  - Below the reward input, add: "This ETH will be locked in the smart contract until the bounty is solved or expires."
- **Bounty detail page (`bounty/[id]/page.tsx`):**
  - In the submission section, above the answer input, add: "Submit the exact answer to claim the reward. Incorrect answers will result in a gas fee deduction with no reward."
  - If the bounty is expired and the user is the poster, show: "This bounty has expired. As the poster, you can reclaim your escrowed ETH."

**Patterns to follow:**

- Existing helper text style in `new/page.tsx` (small muted font-mono text below inputs).

**Test scenarios:**

- Happy path: New bounty page shows all 3 guidance blocks.
- Happy path: Bounty detail page shows submission guidance.
- Happy path: Expired bounty detail page shows reclaim guidance for poster.
- Edge case: Bounty detail page does NOT show reclaim guidance to non-posters.

**Verification:**

- All guidance text is visible in the relevant UI states.
- Text is concise and does not clutter the layout.

---

## System-Wide Impact

- **Interaction graph:** The wallet hook change (U1) affects all pages that use `useWallet` — which is every page. The flag is localStorage-only and has no server impact.
- **Error propagation:** U3's persistent answer feedback and U4's reclaim diagnostics both surface more error states to the UI. Neither changes error propagation across layers.
- **State lifecycle risks:** U2's background metadata sync is fire-and-forget. It must not block bounty list loading or cause infinite re-renders. The implementer must ensure the sync is triggered once per fetch cycle, not on every render.
- **API surface parity:** U6 adds a new data fetch to the landing page. It reuses existing read-provider and contract patterns, so no new API routes or env vars are needed.
- **Unchanged invariants:** The contract ABI, address, and deployment block remain unchanged. No env vars are modified.

---

## Risks & Dependencies

| Risk                                                                | Mitigation                                                                                                                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing page on-chain fetch is slow on first load                   | Fetch only a small batch (≤50 bounties); add skeleton loading state; cache aggressively in component state.                                              |
| Metadata sync (U2) triggers too many API requests                   | Debounce or batch the background sync; only sync once per bounty per session.                                                                            |
| Wallet disconnect flag in `localStorage` is fragile across browsers | Acceptable — worst case is reverting to today's behavior (auto-connect). The flag is a UX enhancement, not a security boundary.                          |
| Reclaim still fails due to contract or chain issues                 | U4 adds better diagnostics. If the issue is on-chain (e.g., refund transfer failing due to out-of-gas), the clearer error message will help identify it. |

---

## Sources & References

- **Investigation report:** Based on direct codebase review of all files in `web/` and `contract/contracts/MathBounty.sol`.
- Related code: `web/lib/use-wallet.ts`, `web/lib/use-bounty-list.ts`, `web/lib/use-bounty-metadata.ts`, `web/app/page.tsx`, `web/app/bounty/[id]/page.tsx`, `web/app/new/page.tsx`, `web/app/me/posts/page.tsx`, `web/lib/reclaim-bounty.ts`, `web/lib/bounty-state.ts`
