"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { HeroSection } from "@/components/hero/hero-section";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/use-wallet";
import { useBountyMetadata } from "@/lib/use-bounty-metadata";
import { getReadProvider } from "@/lib/read-provider";
import {
	assertMathBountyContract,
	MATH_BOUNTY_ABI,
	MATH_BOUNTY_ADDRESS,
} from "@/lib/contracts";
import { BOUNTY_STATUS } from "@/lib/bounty-state";

type BountyTuple = readonly [
	poster: string,
	answerHash: string,
	reward: bigint,
	expiresAt: bigint,
	status: bigint,
];

type LandingStats = {
	totalEscrowed: string;
	activeCount: number;
	solvedCount: number;
	avgReward: string;
};

type LandingBounty = {
	id: string;
	title: string;
	reward: string;
	status: string;
	deadline: string;
	size: "large" | "normal";
};

export default function Home() {
	const router = useRouter();
	const { state, address, connect, disconnect, switchNetwork } = useWallet();
	const { getMetadataBatch } = useBountyMetadata();

	const [stats, setStats] = useState<LandingStats | null>(null);
	const [topBounties, setTopBounties] = useState<LandingBounty[] | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [bountiesLoading, setBountiesLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const handleConnect = async () => {
		const connectedAddress = await connect();
		if (connectedAddress) {
			router.push("/new");
		}
	};

	useEffect(() => {
		let cancelled = false;

		async function loadLandingData() {
			try {
				const provider = getReadProvider();
				await assertMathBountyContract(provider);
				const contract = new ethers.Contract(
					MATH_BOUNTY_ADDRESS,
					MATH_BOUNTY_ABI,
					provider,
				);

				const count = (await contract.bountyCount()) as bigint;
				const now = Math.floor(Date.now() / 1000);

				if (count === BigInt(0)) {
					if (!cancelled) {
						setStats({
							totalEscrowed: "0.00",
							activeCount: 0,
							solvedCount: 0,
							avgReward: "0.00",
						});
						setTopBounties([]);
					}
					return;
				}

				// Build IDs from newest down, limit to 50
				const allIds: string[] = [];
				const limit = count > BigInt(50) ? BigInt(50) : count;
				for (let i = BigInt(0); i < limit; i++) {
					allIds.push((count - i).toString());
				}

				// Fetch bounties in batches of 20
				const BATCH_SIZE = 20;
				const allBounties: Array<{ id: string; tuple: BountyTuple }> = [];
				for (let start = 0; start < allIds.length; start += BATCH_SIZE) {
					const chunkIds = allIds.slice(start, start + BATCH_SIZE);
					try {
						const batch = (await contract.getBounties(
							chunkIds,
						)) as BountyTuple[];
						batch.forEach((tuple, idx) => {
							allBounties.push({ id: chunkIds[idx], tuple });
						});
					} catch {
						// Fallback to individual calls
						for (const id of chunkIds) {
							const tuple = (await contract.getBounty(id)) as BountyTuple;
							allBounties.push({ id, tuple });
						}
					}
				}

				if (cancelled) return;

				// Compute stats
				let totalEscrowed = BigInt(0);
				let activeCount = 0;
				let solvedCount = 0;
				const openRewards: bigint[] = [];

				for (const { tuple } of allBounties) {
					const reward = tuple[2];
					const expiresAt = Number(tuple[3]);
					const status = Number(tuple[4]);

					totalEscrowed += reward;

					if (status === BOUNTY_STATUS.Paid) {
						solvedCount++;
					}

					if (status === BOUNTY_STATUS.Open && expiresAt > now) {
						activeCount++;
						openRewards.push(reward);
					}
				}

				const avgReward =
					openRewards.length > 0
						? openRewards.reduce((a, b) => a + b, BigInt(0)) /
							BigInt(openRewards.length)
						: BigInt(0);

				if (!cancelled) {
					setStats({
						totalEscrowed: Number(ethers.formatEther(totalEscrowed)).toFixed(2),
						activeCount,
						solvedCount,
						avgReward: Number(ethers.formatEther(avgReward)).toFixed(2),
					});
				}

				// Get top 4 open bounties (newest first)
				const openBounties = allBounties.filter(({ tuple }) => {
					const status = Number(tuple[4]);
					const expiresAt = Number(tuple[3]);
					return status === BOUNTY_STATUS.Open && expiresAt > now;
				});

				const selectedBounties = openBounties.slice(0, 4);

				if (selectedBounties.length > 0) {
					const metadataById = await getMetadataBatch(
						selectedBounties.map((b) => b.id),
					);
					if (cancelled) return;

					const landingBounties: LandingBounty[] = selectedBounties.map(
						(b, i) => {
							const meta = metadataById[b.id];
							const expiresAt = Number(b.tuple[3]);
							const remaining = expiresAt - now;
							let deadline: string;
							if (remaining <= 0) deadline = "Expired";
							else if (remaining < 3600)
								deadline = `${Math.ceil(remaining / 60)}m`;
							else if (remaining < 86400)
								deadline = `${Math.ceil(remaining / 3600)}h`;
							else deadline = `${Math.ceil(remaining / 86400)}d`;

							return {
								id: b.id,
								title: meta?.title || "",
								reward: Number(ethers.formatEther(b.tuple[2])).toFixed(2),
								status: "Open",
								deadline,
								size: i === 0 || i === 3 ? "large" : "normal",
							};
						},
					);

					setTopBounties(landingBounties);
				} else {
					setTopBounties([]);
				}
			} catch (err: unknown) {
				if (!cancelled) {
					setFetchError(
						err instanceof Error ? err.message : "Failed to load on-chain data",
					);
				}
			} finally {
				if (!cancelled) {
					setStatsLoading(false);
					setBountiesLoading(false);
				}
			}
		}

		void loadLandingData();
		return () => {
			cancelled = true;
		};
	}, [getMetadataBatch]);

	const handleRetry = () => {
		setFetchError(null);
		setStatsLoading(true);
		setBountiesLoading(true);
		setStats(null);
		setTopBounties(null);
		// Re-trigger effect by toggling a dummy state or re-mounting; simpler to reload page
		window.location.reload();
	};

	return (
		<div className="flex flex-col min-h-dvh bg-surface text-ink font-body selection:bg-brand-glow">
			{/* Skip to content — accessibility */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-brand focus:text-surface focus:text-sm focus:font-bold focus:uppercase focus:tracking-widest"
			>
				Skip to content
			</a>

			{/* Navigation — stark, no blur, harsh lines */}
			<header className="sticky top-0 z-50 border-b-2 border-border bg-surface">
				<div className="max-w-7xl mx-auto px-6 h-18 md:h-20 flex items-center justify-between">
					<Link
						href="/"
						className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-ink hover:text-brand transition-colors duration-fast glitch-hover"
					>
						MathBounty
					</Link>
					<nav className="hidden md:flex items-center gap-12 text-sm font-bold tracking-wide text-ink-muted uppercase">
						<Link
							href="/bounties"
							className="hover:text-brand active:opacity-70 transition-all duration-fast"
						>
							Bounties
						</Link>
						<Link
							href="#mechanism"
							className="hover:text-brand active:opacity-70 transition-all duration-fast"
						>
							Mechanism
						</Link>
						<Link
							href="#docs"
							className="hover:text-brand active:opacity-70 transition-all duration-fast"
						>
							Docs
						</Link>
					</nav>
					<div className="flex items-center gap-3">
						<ThemeToggle />
						<WalletConnectState
							state={state}
							address={address ?? undefined}
							onConnect={handleConnect}
							onDisconnect={disconnect}
							onSwitchNetwork={switchNetwork}
						/>
					</div>
				</div>
			</header>

			<main id="main-content" className="relative">
				{/* Noise overlay across entire page */}
				<div
					className="fixed inset-0 pointer-events-none z-[100] opacity-50 mix-blend-overlay"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
					}}
				/>

				{/* Hero — Live Blockchain Pylon */}
				<HeroSection />

				{/* Stats Band — massive engineering readout */}
				<section className="border-y-2 border-border bg-surface-sunken relative overflow-hidden">
					{/* Section label */}
					<div className="absolute top-0 left-0 font-mono text-[11px] text-ink-faint uppercase tracking-[0.3em] px-6 py-2">
						SYSTEM_METRICS_v1.0
					</div>

					<div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
						{fetchError ? (
							<div className="border-2 border-error bg-surface-raised p-8 reveal-container">
								<div className="font-mono text-xs text-error uppercase tracking-[0.2em] mb-3">
									RPC Fetch Failed
								</div>
								<p className="text-ink-muted mb-6">{fetchError}</p>
								<button
									onClick={handleRetry}
									className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-widest uppercase bg-surface-raised border border-border text-ink hover:border-brand hover:text-brand transition-all duration-normal"
								>
									Retry
								</button>
							</div>
						) : (
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8 md:gap-4 reveal-container">
								{[
									{
										label: "Total Escrowed",
										value: statsLoading
											? null
											: (stats?.totalEscrowed ?? "0.00"),
										unit: "ETH",
										row: "R01",
									},
									{
										label: "Active Bounties",
										value: statsLoading ? null : (stats?.activeCount ?? 0),
										unit: "",
										row: "R02",
									},
									{
										label: "Proven Solutions",
										value: statsLoading ? null : (stats?.solvedCount ?? 0),
										unit: "",
										row: "R03",
									},
									{
										label: "Avg. Reward",
										value: statsLoading ? null : (stats?.avgReward ?? "0.00"),
										unit: "ETH",
										row: "R04",
									},
								].map((stat) => (
									<div
										key={stat.label}
										className="reveal-item relative group"
										tabIndex={0}
									>
										{/* Row marker */}
										<div className="absolute -top-6 left-0 font-mono text-[11px] text-ink-faint opacity-40">
											{stat.row}
										</div>
										<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-3">
											{stat.label}
										</div>
										<div className="flex items-baseline gap-3">
											{statsLoading ? (
												<Skeleton className="h-16 w-24" />
											) : (
												<span
													className="font-display font-bold text-ink leading-[0.85] tabular-nums group-hover:text-brand transition-colors duration-slow"
													style={{
														fontSize: "clamp(3.5rem, 10vw, 8rem)",
													}}
												>
													{stat.value}
												</span>
											)}
											{!statsLoading && stat.unit && (
												<span className="font-mono text-sm md:text-base text-brand font-bold">
													{stat.unit}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					{/* Structural horizontal lines */}
					<div className="absolute top-0 left-0 right-0 h-[2px] bg-brand opacity-15" />
					<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand opacity-15" />
					<div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-border hidden lg:block" />
					<div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-border hidden lg:block" />
				</section>

				{/* Mechanism Design — vertical stack with massive ghost numbers */}
				<section
					id="mechanism"
					className="py-40 md:py-56 lg:py-64 px-6 border-b-2 border-border relative overflow-hidden"
				>
					{/* Background structural numbers */}
					<div
						className="absolute top-20 right-0 font-display font-bold text-ink opacity-[0.02] leading-none select-none pointer-events-none whitespace-nowrap"
						style={{ fontSize: "clamp(12rem, 30vw, 26rem)" }}
					>
						PROTOCOL
					</div>

					<div className="max-w-7xl mx-auto">
						<div className="mb-24 md:mb-36 reveal-container">
							<span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">
								Protocol
							</span>
							<h2
								className="reveal-item font-display font-bold text-ink leading-[0.85] tracking-tight"
								style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
							>
								Mechanism
								<br />
								Design
							</h2>
						</div>

						<div className="space-y-0 reveal-container">
							{[
								{
									num: "01",
									title: "Post",
									desc: "Define your mathematical problem and escrow ETH into the smart contract. Set a deadline, difficulty tier, and collateral requirements. The problem hash is immutably recorded on-chain.",
								},
								{
									num: "02",
									title: "Claim",
									desc: "Solvers stake collateral to claim the bounty, committing to deliver a verifiable solution before the clock runs out. Only one solver may claim at a time.",
								},
								{
									num: "03",
									title: "Verify",
									desc: "Submit a cryptographic proof or zero-knowledge argument. The contract verifies correctness deterministically on-chain without human judgment or centralized oracle.",
								},
								{
									num: "04",
									title: "Payout",
									desc: "Upon verification, the escrowed ETH is released atomically to the solver. No human intervention. No dispute resolution. The contract executes exactly what was agreed.",
								},
							].map((step) => (
								<div
									key={step.num}
									className="relative border-t-2 border-border py-20 md:py-28 group"
								>
									{/* Massive ghost number — visible, structural */}
									<div
										className="absolute top-0 left-0 font-display font-bold text-ink opacity-[0.04] leading-none select-none pointer-events-none -translate-y-1/3"
										style={{ fontSize: "clamp(12rem, 28vw, 24rem)" }}
									>
										{step.num}
									</div>

									<div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
										<div className="md:col-span-2 flex items-baseline gap-3">
											<span className="font-mono text-lg text-brand font-bold">
												{step.num}
											</span>
											<div className="hidden md:block w-12 h-[3px] bg-brand opacity-40 mt-4" />
										</div>
										<div className="md:col-span-3">
											<h3
												className="font-display font-bold text-ink group-hover:text-brand transition-colors duration-normal"
												style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
											>
												{step.title}
											</h3>
										</div>
										<div className="md:col-span-7">
											<p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
												{step.desc}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Open Bounties — spec-sheet cards with asymmetric grid */}
				<section
					id="bounties"
					className="py-40 md:py-56 lg:py-64 px-6 bg-surface-sunken relative overflow-hidden"
				>
					{/* Background watermark */}
					<div
						className="absolute bottom-0 right-0 font-display font-bold text-ink opacity-[0.015] leading-none select-none pointer-events-none whitespace-nowrap translate-y-1/4"
						style={{ fontSize: "clamp(10rem, 25vw, 22rem)" }}
					>
						BOUNTIES
					</div>

					<div className="max-w-7xl mx-auto">
						<div className="flex flex-col md:flex-row md:items-end justify-between mb-20 md:mb-28 gap-6 reveal-container">
							<div>
								<span className="reveal-item font-mono text-xs text-brand uppercase tracking-[0.3em] block mb-4">
									Live
								</span>
								<h2
									className="reveal-item font-display font-bold text-ink leading-[0.85] tracking-tight"
									style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
								>
									Open
									<br />
									Bounties
								</h2>
							</div>
							<Link
								href="/bounties"
								className="reveal-item font-mono text-sm text-brand font-bold hover:text-ink active:opacity-70 transition-all duration-fast uppercase tracking-widest"
							>
								View All →
							</Link>
						</div>

						{bountiesLoading ? (
							<div className="grid grid-cols-1 md:grid-cols-12 gap-4 reveal-container">
								{[0, 1, 2, 3].map((i) => (
									<div
										key={i}
										className={`reveal-item relative border-2 border-border bg-surface p-6 md:p-8 ${
											i === 0 || i === 3 ? "md:col-span-7" : "md:col-span-5"
										}`}
									>
										<Skeleton className="h-4 w-16 mb-6" />
										<Skeleton className="h-8 w-3/4 mb-8" />
										<div className="flex items-end justify-between border-t-2 border-border pt-4">
											<Skeleton className="h-8 w-24" />
											<Skeleton className="h-4 w-16" />
										</div>
									</div>
								))}
							</div>
						) : topBounties && topBounties.length === 0 ? (
							<div className="border-2 border-border bg-surface-raised p-12 md:p-20 flex flex-col items-center gap-8 text-center reveal-container">
								<div className="reveal-item">
									<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.3em] mb-4">
										Empty Market
									</div>
									<h3
										className="font-display font-bold text-ink leading-[0.9]"
										style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
									>
										BE THE FIRST
										<br />
										TO POST
									</h3>
								</div>
								<p className="reveal-item text-lg text-ink-muted max-w-md">
									No open bounties on-chain right now. Start the marketplace by
									posting the first mathematical bounty.
								</p>
								<div className="reveal-item">
									<Link
										href="/new"
										className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
									>
										Post a Bounty
									</Link>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-12 gap-4 reveal-container">
								{topBounties?.map((bounty) => (
									<Link
										key={bounty.id}
										href={`/bounty/${bounty.id}`}
										className={`reveal-item group relative block border-2 border-border bg-surface p-6 md:p-8 hover:border-brand hover:-translate-y-1 focus:border-brand focus:-translate-y-1 transition-all duration-normal ${
											bounty.size === "large"
												? "md:col-span-7"
												: "md:col-span-5"
										}`}
									>
										{/* Status badge — top right, stamped style */}
										<div className="absolute top-4 right-4 md:top-6 md:right-6">
											<span
												className={`inline-block font-mono text-xs font-bold uppercase tracking-[0.2em] px-2 py-1 border ${
													bounty.status === "Open"
														? "border-success text-success bg-success/10"
														: bounty.status === "Claimed"
															? "border-brand text-brand bg-brand/10"
															: bounty.status === "Expired"
																? "border-error text-error bg-error/10"
																: bounty.status === "Paid"
																	? "border-success text-success bg-success/10"
																	: "border-brand text-brand"
												}`}
											>
												{bounty.status}
											</span>
										</div>

										{/* Bounty ID — top left */}
										<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-6">
											Bounty #{bounty.id}
										</div>

										{/* Title — larger for large cards */}
										<h3
											className={`font-display font-bold text-ink mb-8 leading-tight pr-20 group-hover:text-brand transition-colors duration-fast ${
												bounty.size === "large"
													? "text-2xl md:text-3xl"
													: "text-xl md:text-2xl"
											}`}
										>
											{bounty.title || (
												<span className="text-ink-faint">
													Bounty #{bounty.id}
												</span>
											)}
										</h3>

										{/* Footer info */}
										<div className="flex items-end justify-between border-t-2 border-border pt-4">
											<div>
												<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-1">
													Reward
												</div>
												<div className="font-mono text-2xl md:text-4xl font-bold text-brand tabular-nums">
													{bounty.reward}
													<span className="text-sm text-ink-muted ml-1">
														ETH
													</span>
												</div>
											</div>
											<div className="text-right">
												<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em] mb-1">
													Deadline
												</div>
												<div className="font-mono text-sm text-ink-muted">
													{bounty.deadline}
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						)}
					</div>
				</section>

				{/* CTA — aggressive framed composition */}
				<section className="py-40 md:py-56 lg:py-64 px-6 border-b-2 border-border relative overflow-hidden">
					{/* Diagonal structural lines */}
					<div className="absolute top-0 left-[10%] w-[1px] h-full bg-border opacity-50" />
					<div className="absolute top-0 right-[20%] w-[1px] h-full bg-border opacity-30" />

					<div className="max-w-6xl mx-auto reveal-container">
						<div className="reveal-item relative border-2 border-brand p-8 md:p-16 lg:p-24">
							{/* Corner bracket decorations — larger, more aggressive */}
							<div className="absolute -top-[2px] -left-[2px] w-20 h-20 md:w-24 md:h-24 border-t-[3px] border-l-[3px] border-brand bg-surface" />
							<div className="absolute -top-[2px] -right-[2px] w-20 h-20 md:w-24 md:h-24 border-t-[3px] border-r-[3px] border-brand bg-surface" />
							<div className="absolute -bottom-[2px] -left-[2px] w-20 h-20 md:w-24 md:h-24 border-b-[3px] border-l-[3px] border-brand bg-surface" />
							<div className="absolute -bottom-[2px] -right-[2px] w-20 h-20 md:w-24 md:h-24 border-b-[3px] border-r-[3px] border-brand bg-surface" />

							<h2
								className="font-display font-bold text-ink mb-8 leading-[0.85] tracking-tight"
								style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
							>
								Ready to
								<br />
								<span className="text-brand">prove</span>
								<br />
								something?
							</h2>

							<p className="text-lg md:text-xl text-ink-muted mb-12 max-w-xl leading-relaxed">
								Whether you&apos;re a researcher with a hard problem or a solver
								with a sharp mind, the marketplace is open. No permissions. No
								gatekeepers.
							</p>

							<div className="flex flex-wrap items-center gap-4">
								<Link
									href="/new"
									className="inline-flex items-center justify-center px-12 py-5 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
								>
									Post a Bounty
								</Link>
								<Link
									href="/bounties"
									className="inline-flex items-center justify-center px-12 py-5 text-sm font-bold tracking-widest uppercase border-2 border-border-strong text-ink hover:border-brand hover:text-brand active:translate-y-[1px] active:scale-[0.98] transition-all duration-normal"
								>
									Start Solving
								</Link>
								<Link
									href="#docs"
									className="font-mono text-sm text-ink-muted hover:text-brand transition-colors duration-fast uppercase tracking-widest hidden sm:inline-flex"
								>
									Read docs →
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer — stark terminal aesthetic */}
			<footer className="border-t-2 border-border py-20 md:py-24 px-6 bg-surface-sunken relative overflow-hidden">
				{/* Massive clipped watermark */}
				<div
					className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display font-bold text-ink opacity-[0.015] leading-none select-none pointer-events-none whitespace-nowrap translate-y-1/3"
					style={{ fontSize: "clamp(10rem, 22vw, 20rem)" }}
				>
					MATHBOUNTY
				</div>

				<div className="max-w-7xl mx-auto relative z-10">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
						<div>
							<div className="font-display text-4xl md:text-5xl font-extrabold text-ink mb-3">
								MathBounty
							</div>
							<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
								Decentralized Mathematics — Sepolia Network
							</div>
						</div>
						<div className="flex flex-wrap gap-10 text-sm font-bold text-ink-muted uppercase tracking-wider">
							<Link
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:text-brand active:opacity-70 transition-all"
							>
								GitHub
							</Link>
							<Link
								href="#docs"
								className="hover:text-brand active:opacity-70 transition-all"
							>
								Docs
							</Link>
							<span
								className="text-ink-faint opacity-50 cursor-not-allowed line-through"
								aria-disabled="true"
							>
								[OFFLINE] Contract
							</span>
						</div>
					</div>

					{/* Bottom line — more aggressive */}
					<div className="mt-16 pt-8 border-t-2 border-border flex flex-col md:flex-row justify-between items-center gap-4">
						<div className="flex flex-wrap items-center gap-6">
							<div className="font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
								© 2026 MathBounty Protocol
							</div>
							<div className="flex gap-6 font-mono text-xs text-ink-faint uppercase tracking-[0.2em]">
								<Link
									href="/privacy"
									className="hover:text-ink active:opacity-70 transition-all"
								>
									Privacy Policy
								</Link>
								<Link
									href="/terms"
									className="hover:text-ink active:opacity-70 transition-all"
								>
									Terms of Service
								</Link>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-2 h-2 bg-success animate-pulse" />
							<span className="font-mono text-xs text-success uppercase tracking-[0.2em]">
								Protocol Active
							</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
