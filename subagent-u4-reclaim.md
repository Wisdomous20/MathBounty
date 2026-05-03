# U4: Fix Reclaim Ethereum Flow — Implementation Summary

## Changed Files

### 1. `web/lib/reclaim-bounty.ts`
- **Simplified** `reclaimBountyEscrow` to call `contract.reclaimExpired(bountyId)` directly.
- **Removed** the confusing `claimRefund` → `reclaimExpired` fallback chain that could throw on the first revert and never reach the second call.
- **Added** a code comment explaining that both `reclaimExpired()` and `claimRefund()` exist on the contract but map to the same internal logic, and we use `reclaimExpired()` as the canonical method.

### 2. `web/lib/bounty-state.ts`
- **Added** `getReclaimErrorReason(bounty, nowSeconds, connectedAddress)` helper.
- Returns a human-readable string for why reclaim is not possible:
  - `"Connect wallet to reclaim"`
  - `"Only poster can reclaim"`
  - `"Already paid to solver"`
  - `"Already reclaimed"`
  - `"Not expired yet"`
  - `null` when reclaim is actually possible.

### 3. `web/app/me/posts/page.tsx`
- **Imported** `getReclaimErrorReason` from `@/lib/bounty-state`.
- **Updated `BountyListItem`**:
  - Reclaim button is now shown for any expired bounty where the connected user is the poster (including already-reclaimed or paid bounties).
  - Button is **disabled** with a `title` tooltip when reclaim is not possible, displaying the exact reason from `getReclaimErrorReason`.
- **Enhanced `handleReclaim` error handling**:
  - After catching a transaction error, the handler now re-fetches the bounty state from the contract.
  - If the bounty status changed to `Expired` while the transaction was pending, it shows a specific toast: **"Already Reclaimed — This bounty was already reclaimed."**
  - Otherwise, it falls back to the standard `decodeContractError` message.

## Validation
- All modified files pass TypeScript type-checking.
- No new dependencies introduced.
- The `isMissingRevertDataError` helper is preserved in `reclaim-bounty.ts` because it is still imported by `decode-revert.ts`.
