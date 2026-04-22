# MathBounty

Decentralized Math Problem-Solving Platform

**Development Documentation**

Cryptography & Blockchain — Final Project
Smart Contract dApp on Ethereum
Team Size: 4 Members

# 1. Project Overview

MathBounty is a decentralized application built on Ethereum that enables users to post math problems with ETH bounties attached and solve problems posted by others to earn those bounties. The platform operates as a two-way system where every participant can act as both a problem poster and a solver. There are no fixed roles. Any wallet address can create a bounty or submit a solution.

The concept draws from early Bitcoin-era computation bounty systems: attach a reward to a problem, and whoever provides the correct answer claims the reward. All bounty funds are held in the smart contract as escrow. No intermediary is involved in the transfer of funds.

## 1.1 Core Premise

- A user posts a math problem along with a hashed correct answer and sends ETH as the bounty reward.
- Any other user can attempt to solve the problem by submitting an answer on-chain.
- If the submitted answer matches the stored hash, the solver receives the bounty automatically.
- If the bounty expires without a correct answer, the poster reclaims their funds.

## 1.2 Project Classification

| Attribute | Value |
| :--- | :--- |
| Project Type | Smart Contract dApp (Solidity + Hardhat + React) |
| Blockchain | Ethereum (Sepolia Testnet) |
| Category | Incentives & Gamification / Crowdsourcing |
| Team Size | 4 developers |
| Timeline | 3 weeks |
| Course Weight | 15% of final grade |

# 2. Functional Requirements

## 2.1 User Capabilities

Every connected wallet has equal permissions. The system enforces two constraints: a user cannot solve their own problem, and a user cannot submit to an expired or already-solved bounty.

### 2.1.1 As a Problem Poster

- Connect a MetaMask wallet to the application.
- Create a new bounty by providing: the keccak256 hash of the correct answer, a deadline, and ETH sent as the reward.
- View all bounties they have posted and their current statuses.
- Reclaim ETH from their expired, unsolved bounties.

### 2.1.2 As a Solver

- Browse all open bounties on the platform.
- Submit an answer to any open bounty they did not create.
- If the answer is correct (hash matches), receive the bounty reward immediately via the smart contract.
- If the answer is incorrect, the bounty remains open for other solvers.

## 2.2 Bounty Lifecycle

Each bounty follows a deterministic state machine with three terminal states:

| State | Description | Transitions To |
| :--- | :--- | :--- |
| Open | Bounty is active. Solvers can submit answers. ETH is locked in contract. | Paid, Expired |
| Paid | A correct answer was submitted. ETH transferred to solver. Terminal state. | None |
| Expired | Deadline passed with no correct answer. Poster can reclaim ETH. Terminal state. | None |

## 2.3 Answer Verification Mechanism

Answers are verified on-chain using hash comparison. When a poster creates a bounty, they store keccak256(abi.encodePacked(answer)) as the answer hash. When a solver submits, the contract hashes the submitted answer and compares it to the stored hash. If they match, the bounty is marked as Paid and funds transfer.

This approach means the correct answer is never stored in plaintext on-chain. However, once a solver submits the correct answer, it becomes visible in the transaction input data. For the scope of this project, this is an accepted trade-off. The answer is hidden until someone solves it.

# 3. Smart Contract Specification

## 3.1 Contract: MathBounty.sol

### 3.1.1 State Variables

| Variable | Type | Purpose |
| :--- | :--- | :--- |
| bountyCount | uint256 | Auto-incrementing bounty ID counter. |
| bounties | mapping(uint256 => Bounty) | Stores all bounty data by ID. |
| posterBounties | mapping(address => uint256[]) | Tracks bounty IDs created by each address. |

### 3.1.2 Struct: Bounty

| Field | Type | Description |
| :--- | :--- | :--- |
| id | uint256 | Unique bounty identifier. |
| poster | address | Wallet address of the bounty creator. |
| answerHash | bytes32 | keccak256 hash of the correct answer. |
| reward | uint256 | ETH amount locked as reward (in wei). |
| expiresAt | uint256 | Unix timestamp after which the bounty expires. |
| status | BountyStatus | Current state in the lifecycle. |

### 3.1.3 Enum: BountyStatus

| Value | Integer | Meaning |
| :--- | :--- | :--- |
| Open | 0 | Active and accepting submissions. |
| Paid | 1 | Correct answer submitted. Reward paid out. |
| Expired | 2 | Deadline passed. No correct submission. Poster can reclaim. |

### 3.1.4 Functions

**postBounty(bytes32 answerHash, uint256 expiresAt)**

- Payable. Requires msg.value > 0.
- Requires expiresAt > block.timestamp.
- Creates a new Bounty struct, stores it in the mapping, increments bountyCount.
- Pushes the bounty ID to posterBounties[msg.sender].
- Emits BountyPosted event.

**submitAnswer(uint256 bountyId, string calldata answer)**

- Requires bounty status == Open.
- Requires block.timestamp <= expiresAt.
- Requires msg.sender != bounty.poster.
- Computes keccak256(abi.encodePacked(answer)) and compares to answerHash.
- If match: sets status to Paid, transfers reward to msg.sender, emits BountySolved.
- If no match: emits AnswerAttempted with success = false. Bounty remains Open.

**claimRefund(uint256 bountyId)**

- Requires bounty status == Open.
- Requires block.timestamp > expiresAt.
- Requires msg.sender == bounty.poster.
- Sets status to Expired, transfers reward back to poster.

**getBounty(uint256 bountyId) — view**

Returns the full Bounty struct for a given ID.

**getMyPostedBounties() — view**

Returns the array of bounty IDs created by msg.sender.

### 3.1.5 Events

| Event | Parameters | Emitted When |
| :--- | :--- | :--- |
| BountyPosted | id (indexed), poster (indexed), answerHash, reward, expiresAt | A new bounty is created. |
| BountySolved | id (indexed), solver (indexed), reward | A correct answer is submitted. |
| AnswerAttempted | id (indexed), solver (indexed), success | Any answer submission (correct or not). |
| BountyRefunded | id (indexed), poster (indexed), reward | Poster reclaims expired bounty funds. |

### 3.1.6 Custom Errors

| Error | Thrown When |
| :--- | :--- |
| ZeroReward | postBounty called with msg.value == 0 |
| InvalidExpiry | postBounty called with expiresAt <= block.timestamp |

### 3.1.7 Modifiers and Access Control

| Modifier | Applied To | Logic |
| :--- | :--- | :--- |
| onlyOpen | submitAnswer, claimRefund | require(bounty.status == BountyStatus.Open) |
| notExpired | submitAnswer | require(block.timestamp <= bounty.expiresAt) |

# 4. Frontend Specification

## 4.1 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Framework | Next.js 16 | Component-based UI with App Router. |
| Blockchain Interaction | ethers.js v6 | Wallet connection, contract calls, event listeners. |
| Wallet | MetaMask | User authentication and transaction signing. |
| Styling | Tailwind CSS v4 | Responsive layout and utility classes. |
| Deployment | Vercel | Static hosting with CI/CD from GitHub. |

## 4.2 Page Structure

### 4.2.1 Bounty Board (Home Page)

- Displays all open bounties in a list or card layout.
- Each card shows: reward amount in ETH, time remaining, and poster address (truncated).
- Filter controls: All, Open Only, Solved, Expired.
- Sort options: Newest, Highest Reward, Expiring Soon.
- "Create Bounty" button in the header area.

### 4.2.2 Create Bounty Page (/new)

A form with the following fields:

| Field | Input Type | Validation |
| :--- | :--- | :--- |
| Answer | Text input | Required. Hashed client-side before sending to contract. |
| Reward Amount | Number input | Required. Must be > 0 ETH. |
| Expiry | Select dropdown | Required. Options: 1 Day, 3 Days, 7 Days. |

On submit, the frontend computes keccak256(ethers.toUtf8Bytes(answer)) using ethers.js, then calls postBounty with the hash. The plaintext answer is never sent to the contract.

### 4.2.3 Bounty Detail Page (/bounty/[id])

Displays the full bounty details, reward, deadline countdown, status, and poster address. Behavior changes based on the viewer and state:

| Viewer | Bounty State | Available Actions |
| :--- | :--- | :--- |
| Any user (not poster) | Open | Text input to submit answer. Submit button. |
| Any user | Paid | Displays solver address and "Paid" badge. No actions. |
| Poster | Open (not expired) | No actions. Waits for solver. |
| Poster | Expired | "Reclaim Funds" button. |

### 4.2.4 My Activity Page (/activity)

Two tabs:

**Posted:** Lists all bounties created by the connected wallet. Shows status of each. Allows refund action on expired bounties.

**Solved:** Lists all bounties the connected wallet has solved. Shows reward earned for each.

## 4.3 Wallet Integration

- Detect MetaMask via window.ethereum.
- Prompt connection on first interaction that requires a wallet.
- Display connected address in the navigation bar (truncated).
- Handle chain switching — prompt user to switch to Sepolia if on wrong network.
- Listen for account and chain change events to update UI state.

# 5. Testing Requirements

## 5.1 Hardhat Test Coverage

All tests use Hardhat with ethers.js v6 and Chai. The following scenarios must be covered:

| Test Category | Scenario | Expected Result |
| :--- | :--- | :--- |
| Bounty Creation | Create with valid parameters and ETH | Bounty stored. Event emitted. Contract balance increases. |
| Bounty Creation | Create with 0 ETH | Transaction reverts with ZeroReward. |
| Bounty Creation | Create with expiry in the past | Transaction reverts with InvalidExpiry. |
| Answer Submission | Submit correct answer | Status changes to Paid. ETH sent to solver. |
| Answer Submission | Submit incorrect answer | Status remains Open. No ETH transferred. |
| Answer Submission | Submit to expired bounty | Transaction reverts. |
| Answer Submission | Poster tries to solve own bounty | Transaction reverts. |
| Answer Submission | Submit to already-solved bounty | Transaction reverts. |
| Refund | Poster claims refund after expiry | ETH returned. Status changes to Expired. |
| Refund | Non-poster tries to claim refund | Transaction reverts. |
| Refund | Claim refund before deadline | Transaction reverts. |
| View Functions | getMyPostedBounties returns correct IDs | Array matches created bounty IDs. |

## 5.2 Time Manipulation

Use Hardhat's time helpers to test deadline-dependent logic:

- ethers.provider.send("evm_increaseTime", [seconds]) advances the block timestamp.
- ethers.provider.send("evm_mine", []) mines the next block.

These are required for testing expiration and refund flows.

# 6. Deployment

## 6.1 Smart Contract Deployment

| Item | Detail |
| :--- | :--- |
| Network | Sepolia Testnet |
| Tool | Hardhat 3 with hardhat-ignition |
| Script Location | ignition/modules/MathBounty.ts |
| Verification | Etherscan verification via hardhat-etherscan plugin |
| Funded Wallet | At least 0.1 Sepolia ETH for deployment gas |

## 6.2 Frontend Deployment

| Item | Detail |
| :--- | :--- |
| Host | Vercel |
| Build | npm run web:build |
| Environment Variables | MATH_BOUNTY_ADDRESS, MATH_BOUNTY_ABI |
| CI/CD | Auto-deploy on push to main branch via GitHub integration |
