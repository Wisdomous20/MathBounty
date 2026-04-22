# CORE-1: postBounty Contract + Poster UI + keccak256 Commit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Poster creates a bounty by locking ETH against a keccak256-hashed answer. Delivers `postBounty(bytes32,uint256) payable` contract function, `/new` page with client-side hashing, and Hardhat tests.

**Architecture:** Solidity contract stores bounties as structs keyed by auto-incrementing ID. The web client computes `keccak256(utf8Bytes(answer))` entirely in-browser — only the `bytes32` hash crosses the wire. No ethers.js/wagmi installed yet; SETUP-2/3 delivered design tokens and components but no blockchain library.

**Tech Stack:** Hardhat 3 + ethers.js v6 (mocha tests), Next.js 16 (web), existing `Button`/`Input`/`Card`/`Toast` design system components.

---

## Pre-Flight: Install Blockchain Library in Web

**Files:**
- Modify: `web/package.json`

**Step 1: Add ethers.js v6 to web workspace**

```json
{
  "dependencies": {
    "ethers": "^6.16.0"
  }
}
```

Run: `cd contract && npm install && cd ../web && npm install ethers@^6.16.0`
Expected: `ethers` present in `web/node_modules`

**Step 2: Verify ethers.js v6 API available**

Run: `cd web && node -e "const { ethers } = require('ethers'); console.log(typeof ethers.keccak256, typeof ethers.toUtf8Bytes)"`
Expected: `function function`

---

## Task 1: Update MathBounty Contract

Refactor existing `createBounty` into `postBounty` per spec. Fix struct/enum names, add custom errors, emit `BountyPosted` instead of `BountyCreated`.

**Files:**
- Modify: `contract/contracts/MathBounty.sol:1-123`
- Test: `contract/test/MathBounty.ts`

### Task 1.1: Write Failing Tests for postBounty

**Step 1: Write the failing test — ZeroReward revert**

```typescript
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("MathBounty", function () {
  describe("postBounty", function () {
    it("reverts with ZeroReward when msg.value is 0", async function () {
      const [poster] = await ethers.getSigners();
      const contract = await ethers.deployContract("MathBounty");
      const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

      await expect(
        contract.connect(poster).postBounty(answerHash, expiresAt)
      ).to.be.revertedWithCustomError(contract, "ZeroReward");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run contract:test -- --grep "ZeroReward"`
Expected: FAIL — `postBounty` not found on contract

---

### Task 1.2: Write Failing Test — InvalidExpiry Revert

**Step 1: Write the failing test**

```typescript
it("reverts with InvalidExpiry when expiresAt is in the past", async function () {
  const [poster] = await ethers.getSigners();
  const contract = await ethers.deployContract("MathBounty");
  const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));
  const expiresInPast = BigInt(Math.floor(Date.now() / 1000) - 3600);

  await expect(
    contract.connect(poster).postBounty(answerHash, expiresInPast, { value: ethers.parseEther("1") })
  ).to.be.revertedWithCustomError(contract, "InvalidExpiry");
});
```

**Step 2: Run test to verify it fails**

Run: `npm run contract:test -- --grep "InvalidExpiry"`
Expected: FAIL — `postBounty` not found

---

### Task 1.3: Write Failing Test — Happy Path

**Step 1: Write the failing test**

```typescript
it("creates a bounty and emits BountyPosted event", async function () {
  const [poster] = await ethers.getSigners();
  const contract = await ethers.deployContract("MathBounty");
  const reward = ethers.parseEther("1");
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

  const tx = await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });
  const receipt = await tx.wait();

  const bountyId = receipt.logs[0].args[0];
  expect(bountyId).to.equal(1n);

  const bounty = await contract.getBounty(bountyId);
  expect(bounty.poster).to.equal(poster.address);
  expect(bounty.answerHash).to.equal(answerHash);
  expect(bounty.reward).to.equal(reward);
  expect(bounty.expiresAt).to.equal(expiresAt);
  expect(bounty.status).to.equal(0n); // Open
});
```

**Step 2: Run test to verify it fails**

Run: `npm run contract:test -- --grep "creates a bounty"`
Expected: FAIL — `postBounty` not found

---

### Task 1.4: Implement postBounty Contract Function

**Step 1: Write minimal implementation — add custom errors and new struct/enum**

Replace the existing `MathBounty.sol` content with:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MathBounty {
    enum BountyStatus {
        Open,
        Paid,
        Expired
    }

    struct Bounty {
        address poster;
        bytes32 answerHash;
        uint256 reward;
        uint256 expiresAt;
        BountyStatus status;
    }

    error ZeroReward();
    error InvalidExpiry();

    uint256 public bountyCount;
    mapping(uint256 => Bounty) private bounties;
    mapping(address => uint256[]) private posterBounties;

    event BountyPosted(
        uint256 indexed bountyId,
        address indexed poster,
        bytes32 answerHash,
        uint256 reward,
        uint256 expiresAt
    );

    modifier onlyOpen(uint256 bountyId) {
        require(bounties[bountyId].status == BountyStatus.Open, "Bounty is not open");
        _;
    }

    modifier notExpired(uint256 bountyId) {
        require(block.timestamp <= bounties[bountyId].expiresAt, "Bounty has expired");
        _;
    }

    function postBounty(bytes32 answerHash, uint256 expiresAt)
        external
        payable
        returns (uint256 bountyId)
    {
        if (msg.value == 0) revert ZeroReward();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        bountyCount += 1;
        bountyId = bountyCount;

        bounties[bountyId] = Bounty({
            poster: msg.sender,
            answerHash: answerHash,
            reward: msg.value,
            expiresAt: expiresAt,
            status: BountyStatus.Open
        });

        posterBounties[msg.sender].push(bountyId);

        emit BountyPosted(bountyId, msg.sender, answerHash, msg.value, expiresAt);
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getMyPostedBounties() external view returns (uint256[] memory) {
        return posterBounties[msg.sender];
    }
}
```

**Step 2: Run tests to verify they pass**

Run: `npm run contract:test -- --grep "postBounty"`
Expected: PASS for all 3 tests

**Step 3: Compile to check for Solidity errors**

Run: `npm run contract:compile`
Expected: Compilation successful

---

## Task 2: Add Hardhat Tests for submitAnswer and claimRefund

The existing `submitAnswer` and `claimRefund` need to be updated to match the new struct (no `solver` or `problemStatement` fields, renamed `deadline` → `expiresAt`).

**Files:**
- Modify: `contract/contracts/MathBounty.sol`
- Test: `contract/test/MathBounty.ts`

### Task 2.1: Write Failing Tests for Updated submitAnswer

**Step 1: Write the failing test**

```typescript
it("solves a bounty and pays the solver", async function () {
  const [poster, solver] = await ethers.getSigners();
  const contract = await ethers.deployContract("MathBounty");
  const reward = ethers.parseEther("1");
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const answerHash = ethers.keccak256(ethers.toUtf8Bytes("42"));

  await contract.connect(poster).postBounty(answerHash, expiresAt, { value: reward });

  const solverBalanceBefore = await ethers.provider.getBalance(solver.address);
  await contract.connect(solver).submitAnswer(1n, "42");
  const solverBalanceAfter = await ethers.provider.getBalance(solver.address);

  const bounty = await contract.getBounty(1n);
  expect(bounty.status).to.equal(1n); // Paid
  expect(bounty.solver).to.equal(solver.address);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run contract:test -- --grep "solves a bounty"`
Expected: FAIL — `submitAnswer` signature changed (needs update too)

---

### Task 2.2: Implement submitAnswer and claimRefund

Add these functions to the contract after `postBounty`:

```solidity
function submitAnswer(uint256 bountyId, string calldata answer)
    external
    onlyOpen(bountyId)
    notExpired(bountyId)
{
    Bounty storage bounty = bounties[bountyId];
    require(bounty.poster != address(0), "Bounty does not exist");
    require(msg.sender != bounty.poster, "Poster cannot solve own bounty");

    bool isCorrect = keccak256(abi.encodePacked(answer)) == bounty.answerHash;

    if (isCorrect) {
        bounty.status = BountyStatus.Paid;

        uint256 payout = bounty.reward;
        bounty.reward = 0;
        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Reward payout failed");
    }
}

function claimRefund(uint256 bountyId) external onlyOpen(bountyId) {
    Bounty storage bounty = bounties[bountyId];
    require(block.timestamp > bounty.expiresAt, "Not yet expired");
    require(msg.sender == bounty.poster, "Only poster can refund");

    bounty.status = BountyStatus.Expired;
    uint256 refundAmount = bounty.reward;
    bounty.reward = 0;

    (bool success, ) = bounty.poster.call{value: refundAmount}("");
    require(success, "Refund transfer failed");
}
```

**Step 3: Run tests to verify they pass**

Run: `npm run contract:test`
Expected: PASS

---

## Task 3: Deploy to Sepolia

**Files:**
- Modify: `contract/.env` (create from `.env.example`)
- Modify: `apps/web/lib/contracts.ts` (create)
- Test: `contract/ignition/modules/MathBounty.ts` (create)

### Task 3.1: Create Ignition Deploy Module

**Step 1: Create ignition module**

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyContract = buildModule("MathBountyModule", (m) => {
  const contract = m.contract("MathBounty");
  return { contract };
});

export default MyContract;
```

**Step 2: Deploy to Sepolia**

Run: `npx hardhat ignition deploy --network sepolia ignition/modules/MathBounty.ts`
Expected: Contract deployed, address printed (e.g., `MathBounty deployed to: 0x...`)

**Step 3: Commit contract address to web/lib/contracts.ts**

```typescript
export const MATH_BOUNTY_ADDRESS = "0xYourDeployedAddress" as const;
export const MATH_BOUNTY_ABI = [
  "function postBounty(bytes32 answerHash, uint256 expiresAt) external payable returns (uint256)",
  "function submitAnswer(uint256 bountyId, string calldata answer) external",
  "function claimRefund(uint256 bountyId) external",
  "function getBounty(uint256 bountyId) external view returns (tuple(address, bytes32, uint256, uint256, uint8))",
  "event BountyPosted(uint256 indexed, address indexed, bytes32, uint256, uint256)",
] as const;
```

---

## Task 4: Build /new Page

**Files:**
- Create: `web/app/new/page.tsx`
- Modify: `web/app/layout.tsx` (add new route metadata)

### Task 4.1: Write the /new Page Skeleton

**Step 1: Create the page with form state management**

```tsx
"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI } from "@/lib/contracts";

type ToastState = {
  visible: boolean;
  variant: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
};

const EXPIRY_OPTIONS = [
  { label: "1 Day", seconds: 86400 },
  { label: "3 Days", seconds: 259200 },
  { label: "7 Days", seconds: 604800 },
];

export default function NewBountyPage() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [reward, setReward] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(86400);
  const [isPending, setIsPending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, variant: "info", title: "" });
  const [errors, setErrors] = useState<{ answer?: string; reward?: string }>({});

  const showToast = (variant: ToastState["variant"], title: string, description?: string) => {
    setToast({ visible: true, variant, title, description });
  };

  const hideToast = () => {
    setToast((t) => ({ ...t, visible: false }));
  };

  const validate = () => {
    const newErrors: { answer?: string; reward?: string } = {};
    if (!answer.trim()) newErrors.answer = "Answer is required";
    if (!reward || parseFloat(reward) <= 0) newErrors.reward = "Reward must be positive";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsPending(true);
    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI, signer);

      const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + expirySeconds);
      const rewardWei = ethers.parseEther(reward);

      const tx = await contract.postBounty(answerHash, expiresAt, { value: rewardWei });
      const receipt = await tx.wait();

      const bountyId = receipt.logs[0].args[0];
      showToast("success", "Bounty Posted", `Bounty #${bountyId} created successfully`);
      router.push(`/bounty/${bountyId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast("error", "Transaction Failed", msg);
      setIsPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-surface">
      <Card className="w-full max-w-md" padding="lg">
        <h1 className="text-3xl font-display uppercase tracking-wider text-ink mb-6">
          Post a Bounty
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="answer"
            label="Answer (hashed privately)"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            error={errors.answer}
            placeholder="e.g. 42"
            required
          />

          <Input
            id="reward"
            label="Reward (ETH)"
            type="number"
            min="0"
            step="0.01"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            error={errors.reward}
            placeholder="1.0"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-muted font-display uppercase tracking-wider">
              Expires In
            </label>
            <select
              value={expirySeconds}
              onChange={(e) => setExpirySeconds(Number(e.target.value))}
              className="h-10 w-full border bg-surface-raised border-border px-3 text-base text-ink"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.seconds} value={opt.seconds}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" size="lg" isLoading={isPending} className="mt-2">
            Post Bounty
          </Button>
        </form>
      </Card>

      <Toast
        visible={toast.visible}
        variant={toast.variant}
        title={toast.title}
        description={toast.description}
        onDismiss={hideToast}
      />
    </main>
  );
}
```

**Step 2: Verify it compiles**

Run: `npm run web:typecheck 2>&1 || npx tsc --noEmit -p web/tsconfig.json`
Expected: No TypeScript errors

---

## Task 5: Build /bounty/[id] Page (Skeleton)

**Files:**
- Create: `web/app/bounty/[id]/page.tsx`

### Task 5.1: Create Bounty Detail Page

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI } from "@/lib/contracts";

type Bounty = {
  poster: string;
  answerHash: string;
  reward: bigint;
  expiresAt: bigint;
  status: number;
};

const STATUS_LABELS = ["Open", "Paid", "Expired"];

export default function BountyPage() {
  const params = useParams();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    const fetchBounty = async () => {
      try {
        if (!window.ethereum) throw new Error("No wallet");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI, provider);
        const data = await contract.getBounty(params.id);
        setBounty({
          poster: data[0],
          answerHash: data[1],
          reward: data[2],
          expiresAt: data[3],
          status: Number(data[4]),
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    };

    fetchBounty();
  }, [params.id]);

  if (loading) return <div className="p-8 text-ink">Loading bounty...</div>;
  if (error) return <div className="p-8 text-error">{error}</div>;
  if (!bounty) return <div className="p-8 text-ink">Bounty not found</div>;

  const expiresAtDate = new Date(Number(bounty.expiresAt) * 1000);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-surface">
      <Card className="w-full max-w-lg" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-display uppercase tracking-wider text-ink">
            Bounty #{params.id}
          </h1>
          <Badge>{STATUS_LABELS[bounty.status]}</Badge>
        </div>

        <dl className="flex flex-col gap-3">
          <div className="flex justify-between">
            <dt className="text-sm font-display uppercase tracking-wider text-ink-muted">Poster</dt>
            <dd className="text-sm font-mono text-ink">{bounty.poster}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-display uppercase tracking-wider text-ink-muted">Reward</dt>
            <dd className="text-sm font-mono text-ink">{ethers.formatEther(bounty.reward)} ETH</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-display uppercase tracking-wider text-ink-muted">Expires</dt>
            <dd className="text-sm font-mono text-ink">{expiresAtDate.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-display uppercase tracking-wider text-ink-muted">Answer Hash</dt>
            <dd className="text-sm font-mono text-ink break-all">{bounty.answerHash}</dd>
          </div>
        </dl>
      </Card>
    </main>
  );
}
```

---

## Task 6: CI Verification

**Step 1: Run contract tests**

Run: `npm run contract:test`
Expected: All tests pass

**Step 2: Run contract compile**

Run: `npm run contract:compile`
Expected: Compilation successful

**Step 3: Run web typecheck**

Run: `npm run web:typecheck 2>&1 || npx tsc --noEmit -p web/tsconfig.json`
Expected: No TypeScript errors

**Step 4: Run web lint**

Run: `npm run web:lint 2>&1 || npx eslint web --ext .ts,.tsx`
Expected: No ESLint errors

---

## Summary of Files Changed

| Action | File |
|--------|------|
| Modify | `contract/contracts/MathBounty.sol` |
| Modify | `contract/test/MathBounty.ts` |
| Create | `contract/ignition/modules/MathBounty.ts` |
| Create | `contract/.env` (from .env.example) |
| Modify | `web/package.json` (add ethers) |
| Create | `web/lib/contracts.ts` |
| Create | `web/app/new/page.tsx` |
| Create | `web/app/bounty/[id]/page.tsx` |

---

## Acceptance Criteria Checklist

- [ ] `postBounty(bytes32, uint256) payable` exists, stores Bounty, emits `BountyPosted`
- [ ] `/new` form hashes the plaintext answer client-side before any network call
- [ ] Submitting valid input creates a bounty on Sepolia and routes to `/bounty/[id]`
- [ ] Submitting `msg.value == 0` reverts with `ZeroReward`
- [ ] Submitting past expiry reverts with `InvalidExpiry`
- [ ] New bounty visible on-chain via Etherscan with the emitted event
- [ ] CI green (contract tests + compile, web typecheck + lint)
