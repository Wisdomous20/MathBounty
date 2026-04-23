@../AGENTS.md

# MathBounty Web — Claude Code Instructions

## Stack

- **Framework**: Next.js 16 (App Router) — NOT the Next.js you know. APIs and conventions differ from training data.
- **React**: 19.2.4 (concurrent features enabled)
- **Blockchain**: ethers.js v6 (BrowserProvider, Contract, keccak256)
- **Styling**: Tailwind CSS v4 (no `tailwind.config.js` — v4 uses CSS-first config)
- **Fonts**: Bebas Neue (display), DM Sans (body), JetBrains Mono (mono) via `next/font/google`

## Commands

```bash
npm run dev           # Dev server at localhost:3000
npm run build         # Production build
npm run lint          # ESLint check
npm run typecheck     # TypeScript check (tsc --noEmit)
npm run test:e2e      # Playwright e2e tests
```

## Architecture

### File Layout
```
app/                  # Next.js App Router pages
  new/page.tsx        # Create bounty form
  bounty/[id]/page.tsx # Bounty detail page
  design-system/page.tsx # Component & token documentation
components/
  ui/                 # Design system components (Button, Card, Input, Badge, Toast, Modal)
  hero/               # Hero section components (particle field, bounty pylon)
lib/
  contracts.ts        # Contract address + ABI
  tokens.ts          # Design tokens (colors, spacing, typography)
  use-wallet.ts       # Wallet connection hook
  use-bounty-feed.ts  # Bounty feed mock data
  use-bounty-metadata.ts # Off-chain bounty metadata
```

### Component Patterns

**UI components** (`components/ui/`):
- Functional components with TypeScript interfaces
- Props extend `React.ButtonHTMLAttributes`, etc.
- Use `cn()` from `@/lib/cn` for className merging
- Import design tokens from `@/lib/tokens` — never hardcode color/spacing values

**Pages** (`app/*/page.tsx`):
- Add `"use client"` directive at top
- Extract type definitions from contract ABI structs
- Use `useParams()` from `next/navigation` for route params
- Handle loading/error/null states explicitly
- Use `WalletConnectState` component for wallet UI

### Smart Contract Interface

```typescript
// lib/contracts.ts
export const MATH_BOUNTY_ADDRESS = "0x..." as const;
export const MATH_BOUNTY_ABI = [...] as const;

// Bounty struct (matches Solidity):
type Bounty = {
  poster: string;
  answerHash: string;
  reward: bigint;    // in wei
  expiresAt: bigint;  // Unix timestamp
  status: number;     // 0=Open, 1=Paid, 2=Expired
};
```

### Hashing Answers

The frontend hashes answers client-side before sending to the contract:

```typescript
const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
```

Only the `bytes32` hash crosses the wire. The plaintext answer is NEVER sent to the contract.

## Code Conventions

### TypeScript
- No `any`. Use `unknown` if the type is truly unknowable.
- Prop interfaces named `[Component]Props` (e.g., `ButtonProps`).
- Destructured defaults in function signatures.

### React
- Functional components only. No class components.
- `"use client"` directive on every file using browser APIs (window.ethereum, ethers, hooks).
- Custom hooks live in `lib/` and are named `use*`.
- Use `useParams()` from `next/navigation`, NOT `useRouter` for route params.

### Tailwind CSS v4
- No `tailwind.config.js` — v4 configures via CSS `@import` and `@theme`.
- Use arbitrary values sparingly (`bg-[#ff3b00]` only when no token exists).
- Tailwind v4 processes utility classes differently — avoid raw `rgb()` values in favor of CSS variables.

### Design System (tokens.ts)

Design tokens in `web/lib/tokens.ts` are the **single source of truth** for all visual values:

| Token | CSS Variable | Usage |
|---|---|---|
| `colors.brand` | `--color-brand` | `#ff3b00` — call-to-action, accents |
| `colors.surface` | `--color-surface` | `#0a0a0a` — page background |
| `colors.ink` | `--color-ink` | `#f0f0f0` — primary text |
| `colors.border` | `--color-border` | `#222222` — borders |
| `colors.success` | `--color-success` | `#00c853` — open status |
| `colors.error` | `--color-error` | `#ff1744` — error states |
| `shadows.sm/md/lg` | — | Harsh box shadows (no blur) |
| `radius.*` | — | Always `0px` — brutalist zero-radius |

Never hardcode hex colors in components. Import from `@/lib/tokens`.

### Brutalist Design Rules (enforced)

- **ZERO** `border-radius` anywhere — corners are always sharp
- **NO** gradient text (`background-clip: text`)
- **NO** glassmorphism or `backdrop-filter`
- **NO** side-stripe borders (`border-left`/`border-right` > 1px) on cards
- **NO** soft drop shadows — use harsh shadows from `tokens.ts` (`4px 4px 0 0 rgb(0 0 0 / 1)`)
- **NO** rounded pills or badges — use square badges only
- Fonts: `font-display` (Bebas Neue) for headings/labels, `font-mono` (JetBrains Mono) for addresses/hashes/data, `font-sans` (DM Sans) for body

### Bounty Status Mapping

```typescript
const bountyStatus = {
  Open:   { variant: "success", label: "Open" },
  Paid:   { variant: "warning", label: "Paid" },   // solver earned reward
  Expired: { variant: "default", label: "Expired" }, // poster reclaimed
  Claimed: { variant: "brand", label: "Claimed" },  // solver claimed, working
};
```

## Critical Rules

- **NEVER** commit `contracts.ts` with a placeholder address. The contract must be deployed before the address is valid.
- **NEVER** send the plaintext answer to the contract. Hash with `ethers.keccak256(ethers.toUtf8Bytes(answer))` first.
- **NEVER** use `console.log` for wallet/contract debugging — the codebase has no logger utility; use `console.error` for errors only.
- **MUST** use `ethers.BrowserProvider(window.ethereum)` for wallet-connected calls and `ethers.JsonRpcProvider` for read-only calls.
- **MUST** handle the case where `window.ethereum` is absent (prompt user to install MetaMask).

## Testing Conventions

- E2E tests: Playwright (`web/e2e/*.spec.ts`). Use `page.goto()` with relative paths.
- Test specs follow: `web-e2e-[page-name]--[test-description]` pattern.
- e.g., `web-e2e-bounty--new-page-allows-filling-the-form`
- Run e2e: `npm run test:e2e`

## Next.js 16 Gotchas

- `next/navigation`'s `useParams()` returns `Record<string, string | string[]>`, not a plain object.
- App Router components are server by default; add `"use client"` for browser APIs.
- Route `layout.tsx` and `page.tsx` are siblings in the `app/` tree, not nested.
- Font loading via `next/font/google` in `app/layout.tsx` sets CSS variables (`--font-display`, `--font-body`, `--font-mono`).

## Workflow Guidelines

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
  Before implementing:
  - State your assumptions explicitly. If uncertain, ask.
  - If multiple interpretations exist, present them - don't pick silently.
  - If a simpler approach exists, say so. Push back when warranted.
  - If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
  - No features beyond what was asked.
  - No abstractions for single-use code.
  - No "flexibility" or "configurability" that wasn't requested.
  - No error handling for impossible scenarios.
  - If you write 200 lines and it could be 50, rewrite it.
  Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.
  
## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
  When editing existing code:
  - Don't "improve" adjacent code, comments, or formatting.
  - Don't refactor things that aren't broken.
  - Match existing style, even if you'd do it differently.
  - If you notice unrelated dead code, mention it - don't delete it.
  When your changes create orphans:
  - Remove imports/variables/functions that YOUR changes made unused.
  - Don't remove pre-existing dead code unless asked.
  The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
  Transform tasks into verifiable goals:
  - "Add validation" → "Write tests for invalid inputs, then make them pass"
  - "Fix the bug" → "Write a test that reproduces it, then make it pass"
  - "Refactor X" → "Ensure tests pass before and after"
  For multi-step tasks, state a brief plan:
  ```
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  3. [Step] → verify: [check]
  ```
  Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.