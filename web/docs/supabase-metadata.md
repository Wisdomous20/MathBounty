# Supabase Metadata Store

MathBounty stores bounty metadata in Supabase Postgres in production. The API route verifies the on-chain `BountyPosted` event before inserting metadata, then writes through the server-only metadata adapter.

## 1. Create the table

In Supabase, open **SQL Editor** and run:

```sql
create or replace function public.mathbounty_valid_tags(tags text[])
returns boolean
language sql
immutable
as $$
  select coalesce(
    bool_and(tag <> '' and char_length(tag) <= 32),
    true
  )
  from unnest(tags) as tag;
$$;

create table if not exists public.bounty_metadata (
  bounty_id text primary key
    check (bounty_id ~ '^[1-9][0-9]*$'),
  title text not null
    check (char_length(title) between 1 and 120),
  description text not null
    check (char_length(description) between 1 and 2000),
  difficulty text not null
    check (difficulty in ('Easy', 'Medium', 'Hard', 'Expert')),
  tags text[] not null default '{}'::text[]
    check (cardinality(tags) <= 5 and public.mathbounty_valid_tags(tags)),
  solver_stake text
    check (solver_stake is null or solver_stake ~ '^[0-9]+(\.[0-9]+)?$'),
  created_at timestamptz not null default now()
);

alter table public.bounty_metadata enable row level security;
```

Do not add public RLS policies for this table. The app reads and writes it only from the Next.js server using the Supabase service role key.

## 2. Add environment variables

In Vercel, add these to the web project:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-secret-key
```

You can find both values in **Supabase Dashboard -> Project Settings -> API Keys**:

- `SUPABASE_URL`: copy the project URL.
- `SUPABASE_SECRET_KEY`: copy a **Secret key**. If your dashboard shows legacy keys instead, the old `service_role` key also works in this variable.

Keep `SUPABASE_SECRET_KEY` server-side only. Do not prefix it with `NEXT_PUBLIC_`, do not paste it into client components, and do not commit it.

For local development, you can either add the same values to `web/.env.local` or omit them. If they are omitted locally, the app uses `web/.data/bounty-metadata.json` as a local-only fallback.

## 3. Vercel cleanup

After Supabase is working in production:

1. Remove `BLOB_READ_WRITE_TOKEN` from the Vercel project if nothing else uses Vercel Blob.
2. Submit a test bounty and confirm a row appears in `public.bounty_metadata`.
3. Open `/bounties` and an individual bounty page to confirm metadata reads back correctly.

Existing metadata that only exists in Vercel Blob will not automatically move to Supabase. If you need older bounties preserved, export those JSON files and insert them into `public.bounty_metadata` before removing Blob access.
