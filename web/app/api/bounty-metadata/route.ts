import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { MATH_BOUNTY_ABI, MATH_BOUNTY_ADDRESS } from "@/lib/contracts";

export const dynamic = "force-dynamic";

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
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 32;
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard", "Expert"]);

async function ensureMetadataFile() {
  await mkdir(path.dirname(METADATA_FILE_PATH), { recursive: true });

  try {
    await readFile(METADATA_FILE_PATH, "utf8");
  } catch {
    await writeFile(METADATA_FILE_PATH, "{}\n", "utf8");
  }
}

async function readMetadataStore(): Promise<MetadataStore> {
  await ensureMetadataFile();

  try {
    const raw = await readFile(METADATA_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as MetadataStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeMetadataStore(store: MetadataStore) {
  await ensureMetadataFile();
  await writeFile(METADATA_FILE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function validateBountyId(bountyId: unknown) {
  if (typeof bountyId !== "string" || !/^[1-9]\d*$/.test(bountyId)) {
    throw new Error("Invalid bounty id.");
  }
}

function validateMetadata(input: unknown): BountyMetadata {
  if (!input || typeof input !== "object") {
    throw new Error("Metadata payload is required.");
  }

  const metadata = input as Partial<BountyMetadata>;
  const title = metadata.title?.trim();
  const description = metadata.description?.trim();
  const difficulty = metadata.difficulty?.trim();
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
    : [];
  const solverStake = metadata.solverStake?.trim();

  if (!title || title.length > MAX_TITLE_LENGTH) {
    throw new Error("Title must be between 1 and 120 characters.");
  }

  if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Description must be between 1 and 2000 characters.");
  }

  if (!difficulty || !ALLOWED_DIFFICULTIES.has(difficulty)) {
    throw new Error("Difficulty is invalid.");
  }

  if (tags.length > MAX_TAGS || tags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    throw new Error("Tags are invalid.");
  }

  if (solverStake && !/^\d+(\.\d+)?$/.test(solverStake)) {
    throw new Error("Solver stake is invalid.");
  }

  return {
    title,
    description,
    difficulty,
    tags,
    solverStake: solverStake || undefined,
  };
}

async function verifyPostedBountyReceipt(bountyId: string, txHash: string) {
  if (!ethers.isHexString(txHash, 32)) {
    throw new Error("Invalid transaction hash.");
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction receipt not found.");
  }

  const contractAddress = MATH_BOUNTY_ADDRESS.toLowerCase();
  const receiptTarget = receipt.to?.toLowerCase();

  if (!receiptTarget || receiptTarget !== contractAddress) {
    throw new Error("Transaction does not target the configured MathBounty contract.");
  }

  const contractInterface = new ethers.Interface(MATH_BOUNTY_ABI);
  const postedBountyLog = receipt.logs.find((log) => {
    if (log.address.toLowerCase() !== contractAddress) {
      return false;
    }

    try {
      const parsed = contractInterface.parseLog(log);
      return (
        parsed?.name === "BountyPosted" &&
        parsed.args.bountyId.toString() === bountyId
      );
    } catch {
      return false;
    }
  });

  if (!postedBountyLog) {
    throw new Error("BountyPosted event not found for this bounty.");
  }
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams
    .getAll("id")
    .filter((id) => /^[1-9]\d*$/.test(id));
  const store = await readMetadataStore();

  if (ids.length === 0) {
    return NextResponse.json({ metadata: {} });
  }

  const metadata = ids.reduce<MetadataStore>((acc, id) => {
    if (store[id]) {
      acc[id] = store[id];
    }

    return acc;
  }, {});

  return NextResponse.json({ metadata });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      bountyId?: string;
      txHash?: string;
      metadata?: unknown;
    };

    if (typeof body.bountyId !== "string") {
      throw new Error("Bounty id is required.");
    }

    const bountyId = body.bountyId;
    validateBountyId(bountyId);

    if (typeof body.txHash !== "string") {
      throw new Error("Transaction hash is required.");
    }

    const metadata = validateMetadata(body.metadata);
    await verifyPostedBountyReceipt(bountyId, body.txHash);

    const store = await readMetadataStore();
    const existing = store[bountyId];

    if (existing) {
      const isSame = JSON.stringify(existing) === JSON.stringify(metadata);

      if (!isSame) {
        return NextResponse.json(
          { error: "Metadata already exists for this bounty." },
          { status: 409 }
        );
      }

      return NextResponse.json({ metadata: existing });
    }

    store[bountyId] = metadata;
    await writeMetadataStore(store);

    return NextResponse.json({ metadata });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to persist metadata.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
