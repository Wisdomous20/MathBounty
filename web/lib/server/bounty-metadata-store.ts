import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, list, put } from "@vercel/blob";

type BountyMetadata = {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  solverStake?: string;
};

type MetadataStore = Record<string, BountyMetadata>;
type BlobAccess = "public" | "private";

const METADATA_FILE_PATH = path.join(
  process.cwd(),
  ".data",
  "bounty-metadata.json"
);
const BLOB_PREFIX = "bounty-metadata";
const DEFAULT_BLOB_ACCESS: BlobAccess =
  process.env.BLOB_ACCESS === "private" ? "private" : "public";

function getBlobPath(bountyId: string) {
  return `${BLOB_PREFIX}/${bountyId}.json`;
}

function getAlternateBlobAccess(access: BlobAccess): BlobAccess {
  return access === "private" ? "public" : "private";
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

async function readBlobMetadataWithAccess(bountyId: string, access: BlobAccess) {
  const pathname = getBlobPath(bountyId);
  const listing = await list({
    limit: 10,
    prefix: pathname,
  });
  const blob = listing.blobs.find((entry) => entry.pathname === pathname);

  if (!blob) {
    return null;
  }

  const result = await get(blob.url, {
    access,
    useCache: false,
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return (await new Response(result.stream).json()) as BountyMetadata;
}

async function readBlobMetadata(bountyId: string) {
  try {
    const metadata = await readBlobMetadataWithAccess(
      bountyId,
      DEFAULT_BLOB_ACCESS
    );

    if (metadata) {
      return metadata;
    }
  } catch {
    // Try the alternate access mode below.
  }

  try {
    const metadata = await readBlobMetadataWithAccess(
      bountyId,
      getAlternateBlobAccess(DEFAULT_BLOB_ACCESS)
    );

    if (metadata) {
      return metadata;
    }
  } catch {
    // Treat blob fetch failures as missing metadata so one bad read
    // does not break the entire metadata batch request.
  }

  return null;
}

async function writeBlobMetadataWithAccess(
  bountyId: string,
  metadata: BountyMetadata,
  access: BlobAccess
) {
  await put(getBlobPath(bountyId), JSON.stringify(metadata), {
    access,
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function writeBlobMetadata(bountyId: string, metadata: BountyMetadata) {
  try {
    await writeBlobMetadataWithAccess(bountyId, metadata, DEFAULT_BLOB_ACCESS);
  } catch {
    await writeBlobMetadataWithAccess(
      bountyId,
      metadata,
      getAlternateBlobAccess(DEFAULT_BLOB_ACCESS)
    );
  }
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
    const entries = await Promise.allSettled(
      bountyIds.map(async (id) => [id, await readBlobMetadata(id)] as const)
    );

    return entries.reduce<Record<string, BountyMetadata>>((acc, entry) => {
      if (entry.status !== "fulfilled") {
        return acc;
      }

      const [id, metadata] = entry.value;
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
