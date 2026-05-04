# MathBounty Project Memory

## 1. Project Overview
MathBounty is a decentralized application (dApp) where users can post mathematical problems as bounties. Solvers can submit answers, and if correct, they are automatically paid out via smart contracts on the Sepolia testnet.

## 2. Directory Structure & Guide
- `web/`: Next.js frontend application.
  - `app/`: Next.js 13+ App Router pages.
  - `components/`: Reusable UI components.
  - `lib/`: Utility functions, custom hooks, and contract interactions.
  - `public/`: Static assets.
- `contracts/`: (Implied) Smart contract source code (Solidity).

## 3. Core Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS.
- **Blockchain**: ethers.js v6, Sepolia Testnet.
- **State Management**: React Hooks (custom `useWallet`, `useBountyList`, etc.).

## 4. Engineering Rules & Mandates
- **Wallet Persistence**: Explicit disconnection must be persisted using `wallet:userDisconnected` in `localStorage`.
- **Security**: Always use Checks-Effects-Interactions (CEI) pattern in contracts (documented in contract layer).
- **Design**: Follow the "Cyber-Brutalist Bento" design language (raw, high-contrast, sharp corners, grid-based).
- **Typescript**: Strictly avoid `any`. Use proper interfaces for bounty states and wallet objects.

## 5. Common Development Commands
- `npm run dev`: Start the development server.
- `npm run build`: Build the production application.
- `npm run lint`: Run ESLint checks.
- `npm run typecheck`: Run TypeScript compiler checks.

---
*Last Updated: 2026-05-04 - Synced design language with implementation and created Panel Defense Cheatsheet.*
