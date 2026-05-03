This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Fonts ([Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue), [DM Sans](https://fonts.google.com/specimen/DM+Sans), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)) load via `next/font/google` in `app/layout.tsx`.

## For contributors

- **Design system** — With the dev server running, open [http://localhost:3000/design-system](http://localhost:3000/design-system). That route is the living documentation for tokens (`lib/tokens.ts`) and UI components (`components/ui/`); use it before building new UI. On Vercel previews, append `/design-system` to the deployment URL.

## Metadata storage

Bounty metadata is stored in Supabase Postgres in production. See [docs/supabase-metadata.md](docs/supabase-metadata.md) for the SQL, Vercel environment variables, and migration notes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
