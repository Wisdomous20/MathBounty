# MathBounty Workspace

Monorepo for the MathBounty dApp with two npm workspaces:

- `contract` - Hardhat 3 smart contract package
- `web` - Next.js frontend package

## Install

```bash
npm install
```

## Common commands

```bash
npm run contract:compile
npm run contract:test
npm run contract:deploy
npm run web:dev
npm run web:build
```

## For contributors

- **Design system (UI)** — After `npm run web:dev`, open [http://localhost:3000/design-system](http://localhost:3000/design-system). On a Vercel preview deployment, append `/design-system` to the preview base URL. That page documents tokens (`web/lib/tokens.ts`), reusable components (`web/components/ui/`), and every documented state variant for humans and AI coding agents.
