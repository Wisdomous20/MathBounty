# MathBounty

MathBounty is a decentralized application (dApp) built on Ethereum that enables users to crowdsource solutions to mathematical problems. By leveraging smart contracts, the platform provides a secure, trustless environment where "Posters" can attach ETH rewards to problems and "Solvers" can claim them by providing the correct answer. The project features on-chain verification using Keccak-256 hashing, ensuring that correct answers remain private until a solution is verified and paid out.

## 👥 Group Members & Roles

- **Aljason Javier**: Project Manager
- **Jezerwel Grino**: Full Stack Developer
- **Matthew Ledesma**: Full Stack Developer
- **Jed Mamosto**: Full Stack Developer

## 🚀 Live Demo

- **Frontend URL**: [https://math-bounty-web.vercel.app/](https://math-bounty-web.vercel.app/)
- **Deployed Contract (Sepolia)**: `0x9845d883FDf45C597c8dC4E97E1B99AFf1d34707`

## 📸 Application Screenshot

[Insert Screenshot Here]

## 🛠 Setup and Installation

### Prerequisites

- Node.js (v18 or later)
- MetaMask or any Ethereum-compatible wallet
- Sepolia Testnet ETH (for posting bounties or claiming refunds)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Wisdomous20/MathBounty.git
   cd MathBounty
   ```

2. Install dependencies for the entire monorepo:
   ```bash
   npm install
   ```

## 💻 Running the Project Locally

### Frontend (Next.js)

To run the web application in development mode:
```bash
npm run web:dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### Smart Contract (Hardhat)

To compile the smart contracts:
```bash
npm run contract:compile
```

To run the Hardhat tests:
```bash
npm run contract:test
```

## 📜 Smart Contract Testing

The project includes a comprehensive suite of tests covering:
- **Bounty Creation**: Validating rewards and expiration dates.
- **Answer Submission**: Ensuring correct hashes trigger payouts and incorrect ones are rejected.
- **Refund Logic**: verifying that posters can only reclaim funds after the deadline.
- **Access Control**: Ensuring posters cannot solve their own problems.

Run the tests using:
```bash
cd contract
npx hardhat test
```

## 🛠 Core Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Blockchain**: Solidity, Hardhat 3, ethers.js v6
- **Network**: Ethereum Sepolia Testnet
- **Deployment**: Vercel (Frontend)

## 💎 Credits and References

### AI Tools Used
- **Antigravity IDE**: Primary coding assistant and environment.
- **Notion AI**: Documentation and planning.
- **Gemini**: Logic optimization and research.
- **Opencode**: Code review and debugging.

### Documentation & Tutorials
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Foundation (Sepolia Testnet)](https://ethereum.org/en/developers/docs/networks/#testnets)
