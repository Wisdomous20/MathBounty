# Hardhat 3 Beta MathBounty Project

This is a Hardhat 3 Beta project for the MathBounty smart contract, using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about Hardhat 3 Beta, visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3).

## Project Overview

This project includes:

- A Hardhat configuration with Sepolia testnet support
- MathBounty Solidity smart contract
- Foundry-compatible Solidity unit tests
- TypeScript integration tests using `mocha` and ethers.js v6

## Usage

### Running Tests

```shell
npx hardhat test
```

### Compile Contracts

```shell
npx hardhat compile
```

### Deploy to Sepolia

Set the `SEPOLIA_PRIVATE_KEY` configuration variable:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then deploy the MathBounty contract:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/MathBounty.ts
```
