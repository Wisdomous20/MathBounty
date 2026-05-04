# MathBounty Project Memory

## 1. Project Overview
MathBounty is a decentralized application (dApp) where users can post mathematical problems as bounties. Solvers can submit answers, and if correct, they are automatically paid out via smart contracts on the Sepolia testnet. The platform enforces a deterministic state machine for bounty lifecycles: Open, Paid, or Expired.

## 2. Directory Structure & Guide
- `contract/`: Hardhat 3 project for smart contracts.
  - `contracts/`: Solidity source files (`MathBounty.sol`).
  - `test/`: TypeScript/Mocha tests using ethers.js v6.
  - `ignition/`: Deployment modules for Hardhat Ignition.
- `web/`: Next.js frontend application.
  - `app/`: Next.js App Router pages (Home, New Bounty, Bounty Detail).
  - `components/`: UI components using "Cyber-Brutalist Bento" design.
  - `lib/`: Blockchain interaction logic, wallet hooks, and ABI definitions.
- `docs/`: Project documentation and specifications.

## 3. Core Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS.
- **Blockchain**: Solidity (0.8.24+), Hardhat 3, ethers.js v6.
- **Tools**: MetaMask, Vercel, Sepolia Testnet.
- **AI Stack**: Antigravity IDE, Notion AI, Gemini, Opencode.

## 4. Engineering Rules & Mandates
- **State Machine**: Contracts must strictly follow Open -> Paid or Open -> Expired transitions.
- **Security**: Implement Checks-Effects-Interactions (CEI) and non-reentrancy for all ETH transfers.
- **Hashing**: Answers are NEVER stored in plaintext. Use `keccak256(abi.encodePacked(answer))` for on-chain verification.
- **Typescript**: Strictly avoid `any`. Use proper interfaces for bounty states and wallet objects.
- **Design Language**: Follow the "Cyber-Brutalist Bento" design language (raw, high-contrast, sharp corners, grid-based).
- **Wallet Persistence**: Explicit disconnection must be persisted using `wallet:userDisconnected` in `localStorage`.

## 5. Common Development Commands
### Root Commands
- `npm install`: Install all dependencies for the monorepo.

### Frontend (web)
- `npm run web:dev`: Start development server.
- `npm run web:build`: Build for production.
- `npm run web:lint`: Run ESLint checks.

### Contract (contract)
- `npm run contract:compile`: Compile Solidity contracts.
- `npm run contract:test`: Run Mocha/Chai tests.
- `npm run contract:deploy`: Deploy to Sepolia via Ignition.

---
*Last Updated: 2026-05-04 - Initialized root AGENTS.md and updated README.md.*
