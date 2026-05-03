# U2: Bounty Metadata Display and Reliability — Implementation Summary

## Changed Files

1. **`web/lib/use-bounty-metadata.ts`**
   - Exported `readAllCachedMetadata()` so other modules can inspect the local cache directly.
   - Strengthened `getMetadataBatch` to preserve localStorage fields when the API returns incomplete/empty metadata. Instead of letting the server response blindly overwrite the cache, the merge now prefers truthy shared fields but falls back to cached values for `title`, `description`, `difficulty`, `tags`, and `solverStake`.
   - The function now returns the fully merged record rather than a shallow spread that could hide locally-stored titles.

2. **`web/lib/use-bounty-list.ts`**
   - `getFallbackTitle` now returns an empty string `''` instead of `"Bounty #${id}"`.
   - Added background metadata-repair logic: after loading bounties, if a bounty has no title (missing server metadata), the hook checks localStorage via `getMetadata`. If a local title exists, it fires `syncMetadataToServer` once per session per bounty (tracked with `syncedInSessionRef`).
   - Added missing dependencies (`getMetadata`, `syncMetadataToServer`) to the `useCallback` deps array.

3. **`web/lib/use-user-bounties.ts`**
   - Changed the inline fallback from `` `Bounty #${id}` `` to `""` so it matches the new list behavior.

4. **`web/components/ui/bounty-card.tsx`**
   - Added optional `id?: string` prop.
   - When `title` is empty, the card renders `Bounty #${id}` in a muted `text-ink-faint` style instead of a blank headline.

5. **`web/components/bounty/bounty-browser.tsx`**
   - Passed `id={bounty.id}` to `<BountyCard>` so the fallback ID display works.

6. **`web/app/me/posts/page.tsx`**
   - Updated the `<h3>` title in `BountyListItem` to render a muted `Bounty #${id}` fallback when `bounty.title` is empty.

## Verification

- `npx tsc --noEmit` in `web/` passed with zero errors.
- No runtime behavior changes for bounties that already have server metadata.
- Bounties with only localStorage metadata will now display their real title and silently attempt to sync to the server.
