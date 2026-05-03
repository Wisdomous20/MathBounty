import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type BountyMetadata = {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  solverStake?: string;
};

type MetadataStore = Record<string, BountyMetadata>;
type SupabaseMetadataRow = {
  bounty_id: string;
  title: string;
  description: string;
  difficulty: string;
  tags: string[] | null;
  solver_stake: string | null;
};

const METADATA_FILE_PATH = path.join(
  process.cwd(),
  ".data",
  "bounty-metadata.json"
);
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/+$/, "");
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";
const SUPABASE_METADATA_SELECT =
  "bounty_id,title,description,difficulty,tags,solver_stake";
const SUPABASE_READ_CHUNK_SIZE = 100;

function canUseSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

function canUseLocalFileFallback() {
  return process.env.VERCEL !== "1";
}

function assertPersistentStoreConfigured() {
  if (!canUseSupabase() && !canUseLocalFileFallback()) {
    throw new Error(
      "Persistent metadata storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel."
    );
  }
}

async function ensureMetadataFile() {
  await mkdir(path.dirname(METADATA_FILE_PATH), { recursive: true });

  try {
    await readFile(METADATA_FILE_PATH, "utf8");
  } catch {
    await writeFile(METADATA_FILE_PATH, "{}\n", "utf8");
  }
}

async function readLocalMetadataStore(): Promise<MetadataStore> {
  await ensureMetadataFile();

  try {
    const raw = await readFile(METADATA_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as MetadataStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLocalMetadataStore(store: MetadataStore) {
  await ensureMetadataFile();
  await writeFile(
    METADATA_FILE_PATH,
    JSON.stringify(store, null, 2) + "\n",
    "utf8"
  );
}

function getSupabaseUrl(params: URLSearchParams) {
  return `${SUPABASE_URL}/rest/v1/bounty_metadata?${params.toString()}`;
}

function getSupabaseHeaders(headers?: HeadersInit): HeadersInit {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    ...headers,
  };
}

function toSupabaseRow(bountyId: string, metadata: BountyMetadata) {
  return {
    bounty_id: bountyId,
    title: metadata.title,
    description: metadata.description,
    difficulty: metadata.difficulty,
    tags: metadata.tags,
    solver_stake: metadata.solverStake ?? null,
  };
}

function fromSupabaseRow(row: SupabaseMetadataRow): BountyMetadata {
  return {
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    tags: Array.isArray(row.tags) ? row.tags : [],
    solverStake: row.solver_stake ?? undefined,
  };
}

async function assertSupabaseResponse(response: Response) {
  if (response.ok) {
    return;
  }

  if (response.status === 409) {
    throw new Error("Metadata already exists for this bounty.");
  }

  throw new Error(`Supabase metadata request failed with status ${response.status}.`);
}

async function readSupabaseMetadata(bountyId: string) {
  const params = new URLSearchParams({
    select: SUPABASE_METADATA_SELECT,
    bounty_id: `eq.${bountyId}`,
    limit: "1",
  });
  const response = await fetch(getSupabaseUrl(params), {
    headers: getSupabaseHeaders(),
    cache: "no-store",
  });

  await assertSupabaseResponse(response);

  const rows = (await response.json()) as SupabaseMetadataRow[];
  return rows[0] ? fromSupabaseRow(rows[0]) : null;
}

async function readManySupabaseMetadata(bountyIds: string[]) {
  const uniqueIds = Array.from(new Set(bountyIds));
  const chunks = Array.from(
    { length: Math.ceil(uniqueIds.length / SUPABASE_READ_CHUNK_SIZE) },
    (_, index) =>
      uniqueIds.slice(
        index * SUPABASE_READ_CHUNK_SIZE,
        (index + 1) * SUPABASE_READ_CHUNK_SIZE
      )
  );

  const rows = (
    await Promise.all(
      chunks.map(async (chunk) => {
        const params = new URLSearchParams({
          select: SUPABASE_METADATA_SELECT,
          bounty_id: `in.(${chunk.join(",")})`,
        });
        const response = await fetch(getSupabaseUrl(params), {
          headers: getSupabaseHeaders(),
          cache: "no-store",
        });

        await assertSupabaseResponse(response);
        return (await response.json()) as SupabaseMetadataRow[];
      })
    )
  ).flat();

  return rows.reduce<Record<string, BountyMetadata>>((acc, row) => {
    acc[row.bounty_id] = fromSupabaseRow(row);
    return acc;
  }, {});
}

async function writeSupabaseMetadata(
  bountyId: string,
  metadata: BountyMetadata
) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/bounty_metadata`, {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify(toSupabaseRow(bountyId, metadata)),
  });

  await assertSupabaseResponse(response);
}

async function assertSupabaseMetadataReadable(bountyId: string) {
  const metadata = await readSupabaseMetadata(bountyId);

  if (!metadata) {
    throw new Error(
      "Metadata was written but could not be read back from Supabase. Check SUPABASE_URL, SUPABASE_SECRET_KEY, and the bounty_metadata table."
    );
  }
}

export async function readBountyMetadata(bountyId: string) {
  assertPersistentStoreConfigured();

  if (canUseSupabase()) {
    return readSupabaseMetadata(bountyId);
  }

  if (canUseLocalFileFallback()) {
    const store = await readLocalMetadataStore();
    return store[bountyId] ?? null;
  }

  return null;
}

export async function readManyBountyMetadata(bountyIds: string[]) {
  assertPersistentStoreConfigured();

  if (canUseSupabase()) {
    return readManySupabaseMetadata(bountyIds);
  }

  if (canUseLocalFileFallback()) {
    const store = await readLocalMetadataStore();
    return bountyIds.reduce<Record<string, BountyMetadata>>((acc, id) => {
      if (store[id]) {
        acc[id] = store[id];
      }

      return acc;
    }, {});
  }

  return {};
}

export async function writeBountyMetadata(
  bountyId: string,
  metadata: BountyMetadata
) {
  assertPersistentStoreConfigured();

  if (canUseSupabase()) {
    await writeSupabaseMetadata(bountyId, metadata);
    await assertSupabaseMetadataReadable(bountyId);
    return;
  }

  if (canUseLocalFileFallback()) {
    const store = await readLocalMetadataStore();
    store[bountyId] = metadata;
    await writeLocalMetadataStore(store);
    return;
  }
}
