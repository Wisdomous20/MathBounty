import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { MATH_BOUNTY_ABI, MATH_BOUNTY_ADDRESS } from "@/lib/contracts";
import {
  readBountyMetadata,
  readManyBountyMetadata,
  writeBountyMetadata,
} from "@/lib/server/bounty-metadata-store";

export const dynamic = "force-dynamic";

type BountyMetadata = {
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  solverStake?: string;
};

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 32;
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard", "Expert"]);
const SERVER_SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";
const RECEIPT_RETRY_ATTEMPTS = 5;
const RECEIPT_RETRY_DELAY_MS = 1_500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const provider = new ethers.JsonRpcProvider(SERVER_SEPOLIA_RPC_URL);
  let receipt = null;

  for (let attempt = 0; attempt < RECEIPT_RETRY_ATTEMPTS; attempt += 1) {
    receipt = await provider.getTransactionReceipt(txHash);

    if (receipt?.status === 1) {
      break;
    }

    if (attempt < RECEIPT_RETRY_ATTEMPTS - 1) {
      await delay(RECEIPT_RETRY_DELAY_MS);
    }
  }

  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction receipt not found yet. Please retry in a few seconds.");
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
  try {
    const ids = request.nextUrl.searchParams
      .getAll("id")
      .filter((id) => /^[1-9]\d*$/.test(id));

    if (ids.length === 0) {
      return NextResponse.json({ metadata: {} });
    }

    const metadata = await readManyBountyMetadata(ids);
    return NextResponse.json({ metadata });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load metadata.";

    console.error("Failed to load bounty metadata", {
      error,
      message,
      url: request.nextUrl.toString(),
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
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

    if (typeof body.txHash !== "string") {
      throw new Error("Transaction hash is required.");
    }

    const bountyId = body.bountyId;
    validateBountyId(bountyId);

    const metadata = validateMetadata(body.metadata);
    await verifyPostedBountyReceipt(bountyId, body.txHash);

    const existing = await readBountyMetadata(bountyId);

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

    await writeBountyMetadata(bountyId, metadata);
    return NextResponse.json({ metadata });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to persist metadata.";

    console.error("Failed to persist bounty metadata", {
      error,
      message,
    });

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
