import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

type BountyMetadata = {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  solverStake?: string;
};

type MetadataStore = Record<string, BountyMetadata>;

const METADATA_FILE_PATH = path.join(
  process.cwd(),
  ".data",
  "bounty-metadata.json"
);
const BLOB_PREFIX = "bounty-metadata";

function getBlobPath(bountyId: string) {
  return `${BLOB_PREFIX}/${bountyId}.json`;
}

function canUseBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function canUseLocalFileFallback() {
  return process.env.VERCEL !== "1";
}

function assertPersistentStoreConfigured() {
  if (!canUseBlobStorage() && !canUseLocalFileFallback()) {
    throw new Error(
      "Persistent metadata storage is not configured. Set BLOB_READ_WRITE_TOKEN in Vercel."
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
  await writeFile(METADATA_FILE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

async function readBlobMetadata(bountyId: string) {
  const result = await get(getBlobPath(bountyId), {
    access: "public",
    useCache: false,
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return (await new Response(result.stream).json()) as BountyMetadata;
}

async function writeBlobMetadata(bountyId: string, metadata: BountyMetadata) {
  await put(getBlobPath(bountyId), JSON.stringify(metadata), {
    access: "public",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function readBountyMetadata(bountyId: string) {
  assertPersistentStoreConfigured();

  if (canUseBlobStorage()) {
    return readBlobMetadata(bountyId);
  }

  if (canUseLocalFileFallback()) {
    const store = await readLocalMetadataStore();
    return store[bountyId] ?? null;
  }

  return null;
}

export async function readManyBountyMetadata(bountyIds: string[]) {
  assertPersistentStoreConfigured();

  if (canUseBlobStorage()) {
    const entries = await Promise.all(
      bountyIds.map(async (id) => [id, await readBlobMetadata(id)] as const)
    );

    return entries.reduce<Record<string, BountyMetadata>>((acc, [id, metadata]) => {
      if (metadata) {
        acc[id] = metadata;
      }

      return acc;
    }, {});
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

export async function writeBountyMetadata(bountyId: string, metadata: BountyMetadata) {
  assertPersistentStoreConfigured();

  if (canUseBlobStorage()) {
    await writeBlobMetadata(bountyId, metadata);
    return;
  }

  if (canUseLocalFileFallback()) {
    const store = await readLocalMetadataStore();
    store[bountyId] = metadata;
    await writeLocalMetadataStore(store);
    return;
  }
}
