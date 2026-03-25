"use client";

import { useState, useCallback } from "react";
import {
  initMarket,
  placeBet,
  resolveMarket,
  claimReward,
  getMarket,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendingDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "bet" | "resolve" | "claim" | "market";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("bet");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Bet state
  const [betAmount, setBetAmount] = useState("");
  const [betPrediction, setBetPrediction] = useState<boolean | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Resolve state
  const [resolveOutcome, setResolveOutcome] = useState<boolean | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Claim state
  const [isClaiming, setIsClaiming] = useState(false);

  // Market data
  const [marketData, setMarketData] = useState<{
    resolved: boolean;
    outcome: boolean;
    bets: Array<{ user: string; amount: string; prediction: boolean }>;
  } | null>(null);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Load market data
  const loadMarket = useCallback(async () => {
    setIsLoadingMarket(true);
    try {
      const result = await getMarket(walletAddress || undefined);
      if (result) {
        setMarketData(result as typeof marketData);
      }
    } catch (err) {
      console.error("Failed to load market:", err);
    } finally {
      setIsLoadingMarket(false);
    }
  }, [walletAddress]);

  // Load market on mount and tab change
  useState(() => {
    loadMarket();
  });

  const handlePlaceBet = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!betAmount || isNaN(Number(betAmount)) || Number(betAmount) <= 0) {
      return setError("Enter a valid bet amount");
    }
    if (betPrediction === null) return setError("Select YES or NO");

    setError(null);
    setIsPlacingBet(true);
    setTxStatus("Awaiting signature...");

    try {
      // Convert to stroops (1 XLM = 10^7 stroops)
      const amount = BigInt(Math.floor(Number(betAmount) * 10_000_000));
      await placeBet(walletAddress, amount, betPrediction);
      setTxStatus("Bet placed successfully!");
      setBetAmount("");
      setBetPrediction(null);
      await loadMarket();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsPlacingBet(false);
    }
  }, [walletAddress, betAmount, betPrediction, loadMarket]);

  const handleResolve = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (resolveOutcome === null) return setError("Select outcome");

    setError(null);
    setIsResolving(true);
    setTxStatus("Awaiting signature...");

    try {
      await resolveMarket(walletAddress, resolveOutcome);
      setTxStatus("Market resolved!");
      setResolveOutcome(null);
      await loadMarket();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsResolving(false);
    }
  }, [walletAddress, resolveOutcome, loadMarket]);

  const handleClaim = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");

    setError(null);
    setIsClaiming(true);
    setTxStatus("Awaiting signature...");

    try {
      const result = await claimReward(walletAddress);
      setTxStatus(`Claimed ${result} stroops!`);
      await loadMarket();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsClaiming(false);
    }
  }, [walletAddress, loadMarket]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "bet", label: "Bet", icon: <TrendingUpIcon />, color: "#34d399" },
    { key: "resolve", label: "Resolve", icon: <CheckIcon />, color: "#fbbf24" },
    { key: "claim", label: "Claim", icon: <TrophyIcon />, color: "#7c6cf0" },
    { key: "market", label: "Market", icon: <WalletIcon />, color: "#4fc3f7" },
  ];

  const isResolved = marketData?.resolved ?? false;
  const outcome = marketData?.outcome;

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("success") || txStatus.includes("Claimed") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Prediction Market</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isResolved && (
                <Badge variant={outcome ? "success" : "warning"}>
                  {outcome ? "YES" : "NO"} WINS
                </Badge>
              )}
              <Badge variant="info" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Bet */}
            {activeTab === "bet" && (
              <div className="space-y-5">
                <MethodSignature name="place_bet" params="(user: Address, amount: i128, prediction: bool)" color="#34d399" />
                
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Prediction</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBetPrediction(true)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-95",
                        betPrediction === true
                          ? "border-[#34d399]/50 bg-[#34d399]/10 text-[#34d399]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingUpIcon /> YES
                    </button>
                    <button
                      onClick={() => setBetPrediction(false)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-95",
                        betPrediction === false
                          ? "border-[#f87171]/50 bg-[#f87171]/10 text-[#f87171]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingDownIcon /> NO
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Amount (XLM)</label>
                  <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#34d399]/30 focus-within:shadow-[0_0_20px_rgba(52,211,153,0.08)]">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-white/20">1 XLM = 10,000,000 stroops</p>
                </div>

                {walletAddress ? (
                  <ShimmerButton onClick={handlePlaceBet} disabled={isPlacingBet || isResolved} shimmerColor="#34d399" className="w-full">
                    {isPlacingBet ? <><SpinnerIcon /> Placing Bet...</> : isResolved ? "Market Resolved" : <><TrendingUpIcon /> Place Bet</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to place bet
                  </button>
                )}
              </div>
            )}

            {/* Resolve */}
            {activeTab === "resolve" && (
              <div className="space-y-5">
                <MethodSignature name="resolve" params="(outcome: bool)" color="#fbbf24" />
                
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Market Outcome</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResolveOutcome(true)}
                      disabled={isResolved}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-95 disabled:opacity-50",
                        resolveOutcome === true
                          ? "border-[#fbbf24]/50 bg-[#fbbf24]/10 text-[#fbbf24]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingUpIcon /> YES Won
                    </button>
                    <button
                      onClick={() => setResolveOutcome(false)}
                      disabled={isResolved}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-95 disabled:opacity-50",
                        resolveOutcome === false
                          ? "border-[#f87171]/50 bg-[#f87171]/10 text-[#f87171]"
                          : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:text-white/55 hover:border-white/[0.1]"
                      )}
                    >
                      <TrendingDownIcon /> NO Won
                    </button>
                  </div>
                </div>

                {walletAddress ? (
                  <ShimmerButton onClick={handleResolve} disabled={isResolving || isResolved} shimmerColor="#fbbf24" className="w-full">
                    {isResolving ? <><SpinnerIcon /> Resolving...</> : isResolved ? "Already Resolved" : <><CheckIcon /> Resolve Market</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to resolve
                  </button>
                )}
              </div>
            )}

            {/* Claim */}
            {activeTab === "claim" && (
              <div className="space-y-5">
                <MethodSignature name="claim" params="(user: Address) -> i128" color="#7c6cf0" />
                
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7c6cf0]/10 border border-[#7c6cf0]/20">
                      <TrophyIcon />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white/90 mb-2">Claim Your Rewards</h4>
                  <p className="text-sm text-white/40 mb-6">
                    If you bet on the winning outcome, claim your 2x reward here.
                  </p>

                  {walletAddress ? (
                    <ShimmerButton onClick={handleClaim} disabled={isClaiming || !isResolved} shimmerColor="#7c6cf0" className="w-full">
                      {isClaiming ? <><SpinnerIcon /> Claiming...</> : !isResolved ? "Wait for resolution" : <><TrophyIcon /> Claim Reward</>}
                    </ShimmerButton>
                  ) : (
                    <button
                      onClick={onConnect}
                      disabled={isConnecting}
                      className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      Connect wallet to claim
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Market */}
            {activeTab === "market" && (
              <div className="space-y-5">
                <MethodSignature name="get_market" params="() -> Market" returns="-> {resolved, outcome, bets}" color="#4fc3f7" />
                
                <div className="flex justify-center mb-4">
                  <button
                    onClick={loadMarket}
                    disabled={isLoadingMarket}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs text-white/40 hover:text-white/60 transition-all"
                  >
                    <span className={isLoadingMarket ? "animate-spin" : ""}><RefreshIcon /></span> Refresh
                  </button>
                </div>

                {marketData && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Market Status</span>
                      <Badge variant={marketData.resolved ? (marketData.outcome ? "success" : "warning") : "info"}>
                        {marketData.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Total Bets</span>
                        <span className="font-mono text-sm text-white/80">{marketData.bets.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Resolved</span>
                        <span className="font-mono text-sm text-white/80">{marketData.resolved ? "Yes" : "No"}</span>
                      </div>
                      {marketData.resolved && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/35">Outcome</span>
                          <span className={cn("font-mono text-sm", marketData.outcome ? "text-[#34d399]" : "text-[#f87171]")}>
                            {marketData.outcome ? "YES" : "NO"}
                          </span>
                        </div>
                      )}
                    </div>

                    {marketData.bets.length > 0 && (
                      <>
                        <div className="border-t border-white/[0.06] px-4 py-3">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Bet History</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {marketData.bets.map((bet, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] last:border-0">
                              <span className="font-mono text-xs text-white/50">{truncate(bet.user)}</span>
                              <span className="font-mono text-xs text-white/70">{Number(bet.amount) / 10_000_000} XLM</span>
                              <span className={cn("text-xs font-medium", bet.prediction ? "text-[#34d399]" : "text-[#f87171]")}>
                                {bet.prediction ? "YES" : "NO"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Prediction Market &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[9px] text-white/15">YES</span>
              </span>
              <span className="text-white/10 text-[8px]">&rarr;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#f87171]" />
                <span className="font-mono text-[9px] text-white/15">NO</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
