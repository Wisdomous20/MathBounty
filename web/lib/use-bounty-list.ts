"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import {
	assertMathBountyContract,
	MATH_BOUNTY_ABI,
	MATH_BOUNTY_ADDRESS,
} from "@/lib/contracts";
import { BOUNTY_STATUS } from "@/lib/bounty-state";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import { getReadProvider } from "@/lib/read-provider";

export type BountyListItem = {
	id: string;
	poster: string;
	reward: bigint;
	expiresAt: bigint;
	title: string;
	status: number;
};

type BountyTuple = readonly [
	poster: string,
	answerHash: string,
	reward: bigint,
	expiresAt: bigint,
	status: bigint,
];

const BOUNTY_BATCH_SIZE = 50;
const REFRESH_INTERVAL_MS = 45_000;

function getBountyIds(count: bigint) {
	const ids: string[] = [];
	const firstBountyId = BigInt(1);

	for (let id = count; id >= firstBountyId; id -= firstBountyId) {
		ids.push(id.toString());
	}

	return ids;
}

async function getBountyBatch(contract: ethers.Contract, ids: string[]) {
	try {
		return (await contract.getBounties(ids)) as BountyTuple[];
	} catch {
		return Promise.all(
			ids.map((id) => contract.getBounty(id) as Promise<BountyTuple>),
		);
	}
}

function getFallbackTitle() {
	return "";
}

export function useBountyList(accountAddress?: string | null) {
	const { getMetadata, getMetadataBatch, syncMetadataToServer } =
		useBountyMetadata();
	const [bounties, setBounties] = useState<BountyListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
	const hasLoadedRef = useRef(false);
	const inFlightFetchRef = useRef<Promise<void> | null>(null);
	const lastSuccessfulBountiesRef = useRef<BountyListItem[]>([]);
	const syncedInSessionRef = useRef<Set<string>>(new Set());

	const fetchBounties = useCallback(async () => {
		if (inFlightFetchRef.current) {
			return inFlightFetchRef.current;
		}

		const request = (async () => {
			if (!hasLoadedRef.current) {
				setLoading(true);
			}

			try {
				const provider = getReadProvider();
				await assertMathBountyContract(provider);

				const contract = new ethers.Contract(
					MATH_BOUNTY_ADDRESS,
					MATH_BOUNTY_ABI,
					provider,
				);
				const count = (await contract.bountyCount()) as bigint;
				const ids = getBountyIds(count);
				const now = Math.floor(Date.now() / 1000);
				const metadataById = await getMetadataBatch(ids);
				const loaded: BountyListItem[] = [];

				for (let start = 0; start < ids.length; start += BOUNTY_BATCH_SIZE) {
					const chunkIds = ids.slice(start, start + BOUNTY_BATCH_SIZE);
					const chunk = await getBountyBatch(contract, chunkIds);

					chunk.forEach((data, index) => {
						const id = chunkIds[index];
						const status = Number(data[4]);
						const expiresAt = data[3];

						// Keep all bounties for the browser, status will be shown via badge
						// Only filter out invalid records if any
						if (data[0] === ethers.ZeroAddress) {
							return;
						}

						const metadata = metadataById[id];
						const title = metadata?.title || getFallbackTitle();
						loaded.push({
							id,
							poster: data[0],
							reward: data[2],
							expiresAt,
							title,
							status,
						});

						if (!title) {
							const local = getMetadata(id);
							if (local?.title && !syncedInSessionRef.current.has(id)) {
								syncedInSessionRef.current.add(id);
								syncMetadataToServer(id).catch(() => {});
							}
						}
					});
				}

				lastSuccessfulBountiesRef.current = loaded;
				setBounties(loaded);
				setError(null);
				setLastUpdatedAt(Date.now());
			} catch (err: unknown) {
				if (lastSuccessfulBountiesRef.current.length > 0) {
					setBounties(lastSuccessfulBountiesRef.current);
				}

				setError(
					err instanceof Error ? err.message : "Failed to load bounties",
				);
			} finally {
				hasLoadedRef.current = true;
				setLoading(false);
				inFlightFetchRef.current = null;
			}
		})();

		inFlightFetchRef.current = request;
		return request;
	}, [getMetadata, getMetadataBatch, syncMetadataToServer]);

	useEffect(() => {
		return () => {
			inFlightFetchRef.current = null;
		};
	}, []);

	const refreshBounties = useCallback(() => {
		if (document.visibilityState === "hidden") {
			return;
		}

		void fetchBounties();
	}, [fetchBounties]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void fetchBounties();
		}, 0);

		return () => window.clearTimeout(timer);
	}, [accountAddress, fetchBounties]);

	useEffect(() => {
		const interval = window.setInterval(refreshBounties, REFRESH_INTERVAL_MS);

		return () => window.clearInterval(interval);
	}, [refreshBounties]);

	useEffect(() => {
		window.addEventListener("focus", refreshBounties);
		document.addEventListener("visibilitychange", refreshBounties);

		return () => {
			window.removeEventListener("focus", refreshBounties);
			document.removeEventListener("visibilitychange", refreshBounties);
		};
	}, [refreshBounties]);

	return {
		bounties,
		loading,
		error,
		lastUpdatedAt,
		retry: fetchBounties,
	};
}
