import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWriteContract, useAccount, useWatchContractEvent } from "wagmi";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import EscrowManagerABI from "~~/contracts/EscrowManager";
import { notification } from "~~/utils/scaffold-eth";

// Contract addresses (replace with your deployed addresses)
const ESCROW_MANAGER_ADDRESS = "0x959591Bab069599cAbb2A72AA371503ba2d042FF" as const;
const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65" as const;

export enum EscrowStatus {
  Created = 0,
  Delivered = 1,
  Disputed = 2,
  Resolved = 3,
  Refunded = 4,
}

export enum DisputeOutcome {
  Pending = 0,
  FavorBuyer = 1,
  FavorSeller = 2,
  Split = 3,
}

export interface Escrow {
  id: bigint;
  buyer: string;
  seller: string;
  productId: bigint;
  amount: bigint;
  token: string;
  status: EscrowStatus;
  createdAt: bigint;
  disputeId: bigint;
  sourceChainSelector: bigint;
  isActive: boolean;
}

export interface Dispute {
  id: bigint;
  escrowId: bigint;
  initiator: string;
  reason: string;
  outcome: DisputeOutcome;
  arbitrators: string[];
  votesCount: bigint;
  createdAt: bigint;
  resolvedAt: bigint;
  aiAnalysis: string;
  isResolved: boolean;
}

export const useEscrow = (escrowId?: bigint) => {
  const { address } = useAccount();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read escrow data
  const { data: escrowData, refetch: refetchEscrow } = useReadContract({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    functionName: "getEscrow",
    args: escrowId ? [escrowId] : undefined,
    query: {
      enabled: !!escrowId,
    },
  });

  // Get user's escrows
  const { data: userEscrows, refetch: refetchUserEscrows } = useReadContract({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    functionName: "getUserEscrows",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get seller's escrows
  const { data: sellerEscrows, refetch: refetchSellerEscrows } = useReadContract({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    functionName: "getSellerEscrows",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Create ETH escrow
  const { writeContractAsync: createEscrowETH } = useWriteContract();

  // Create USDC escrow
  const { writeContractAsync: createEscrowUSDC } = useWriteContract();

  // Confirm delivery
  const { writeContractAsync: confirmDelivery } = useWriteContract();

  // Create dispute
  const { writeContractAsync: createDispute } = useWriteContract();

  // Read dispute data
  const { data: disputeData, refetch: refetchDispute } = useReadContract({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    functionName: "getDispute",
    args: escrow?.disputeId ? [escrow.disputeId] : undefined,
    query: {
      enabled: !!escrow?.disputeId && escrow.disputeId > 0n,
    },
  });

  // Watch for escrow events
  useWatchContractEvent({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    eventName: "EscrowCreated",
    onLogs: (logs) => {
      logs.forEach((_log) => {
        notification.success("Escrow created successfully!");
        refetchUserEscrows();
        refetchSellerEscrows();
      });
    },
  });

  useWatchContractEvent({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    eventName: "EscrowDelivered",
    onLogs: (logs) => {
      logs.forEach((_log) => {
        notification.success("Delivery confirmed!");
        refetchEscrow();
      });
    },
  });

  useWatchContractEvent({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    eventName: "DisputeCreated",
    onLogs: (logs) => {
      logs.forEach((_log) => {
        notification.info("Dispute created. Arbitrators are being assigned.");
        refetchEscrow();
        refetchDispute();
      });
    },
  });

  useWatchContractEvent({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    eventName: "DisputeResolved",
    onLogs: (logs) => {
      logs.forEach((_log) => {
        notification.success("Dispute resolved!");
        refetchEscrow();
        refetchDispute();
      });
    },
  });

  useWatchContractEvent({
    address: ESCROW_MANAGER_ADDRESS,
    abi: EscrowManagerABI,
    eventName: "FundsReleased",
    onLogs: (logs) => {
      logs.forEach((_log) => {
        notification.success("Funds released!");
        refetchEscrow();
      });
    },
  });

  // Update escrow state when data changes
  useEffect(() => {
    if (escrowData && Array.isArray(escrowData)) {
      const [id, buyer, seller, productId, amount, token, status, createdAt, disputeId, sourceChainSelector, isActive] = escrowData;
      setEscrow({
        id,
        buyer,
        seller,
        productId,
        amount,
        token,
        status,
        createdAt,
        disputeId,
        sourceChainSelector,
        isActive,
      });
    }
  }, [escrowData]);

  // Update dispute state when data changes
  useEffect(() => {
    if (disputeData && Array.isArray(disputeData)) {
      const [id, escrowId, initiator, reason, outcome, arbitrators, votesCount, createdAt, resolvedAt, aiAnalysis, isResolved] = disputeData;
      setDispute({
        id,
        escrowId,
        initiator,
        reason,
        outcome,
        arbitrators: Array.from(arbitrators),
        votesCount,
        createdAt,
        resolvedAt,
        aiAnalysis,
        isResolved,
      });
    }
  }, [disputeData]);

  const handleCreateEscrowETH = useCallback(async (productId: bigint, ethAmount: bigint) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await createEscrowETH({
        address: ESCROW_MANAGER_ADDRESS,
        abi: EscrowManagerABI,
        functionName: "createEscrowETH",
        args: [productId],
        value: ethAmount,
      });
      notification.success("Transaction submitted! Creating escrow...");
      return tx;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create escrow";
      setError(errorMsg);
      notification.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createEscrowETH]);

  const handleCreateEscrowUSDC = useCallback(async (productId: bigint, usdcAmount: bigint) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await createEscrowUSDC({
        address: ESCROW_MANAGER_ADDRESS,
        abi: EscrowManagerABI,
        functionName: "createEscrowUSDC",
        args: [productId, usdcAmount],
      });
      notification.success("Transaction submitted! Creating escrow...");
      return tx;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create escrow";
      setError(errorMsg);
      notification.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createEscrowUSDC]);

  const handleConfirmDelivery = useCallback(async (escrowId: bigint) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await confirmDelivery({
        address: ESCROW_MANAGER_ADDRESS,
        abi: EscrowManagerABI,
        functionName: "confirmDelivery",
        args: [escrowId],
      });
      notification.success("Transaction submitted! Confirming delivery...");
      return tx;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to confirm delivery";
      setError(errorMsg);
      notification.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [confirmDelivery]);

  const handleCreateDispute = useCallback(async (escrowId: bigint, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const tx = await createDispute({
        address: ESCROW_MANAGER_ADDRESS,
        abi: EscrowManagerABI,
        functionName: "createDispute",
        args: [escrowId, reason],
      });
      notification.success("Transaction submitted! Creating dispute...");
      return tx;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create dispute";
      setError(errorMsg);
      notification.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createDispute]);

  const getStatusText = (status: EscrowStatus): string => {
    switch (status) {
      case EscrowStatus.Created: return "Created";
      case EscrowStatus.Delivered: return "Delivered";
      case EscrowStatus.Disputed: return "Disputed";
      case EscrowStatus.Resolved: return "Resolved";
      case EscrowStatus.Refunded: return "Refunded";
      default: return "Unknown";
    }
  };

  const getOutcomeText = (outcome: DisputeOutcome): string => {
    switch (outcome) {
      case DisputeOutcome.Pending: return "Pending";
      case DisputeOutcome.FavorBuyer: return "Favor Buyer";
      case DisputeOutcome.FavorSeller: return "Favor Seller";
      case DisputeOutcome.Split: return "Split";
      default: return "Unknown";
    }
  };

  const formatAmount = (amount: bigint, token: string): string => {
    if (token === "0x0000000000000000000000000000000000000000") {
      return `${formatEther(amount)} ETH`;
    } else {
      return `${formatUnits(amount, 6)} USDC`;
    }
  };

  const getDaysRemaining = (createdAt: bigint): number => {
    const now = Math.floor(Date.now() / 1000);
    const releaseTime = Number(createdAt) + (7 * 24 * 60 * 60); // 7 days
    const secondsRemaining = releaseTime - now;
    return Math.max(0, Math.ceil(secondsRemaining / (24 * 60 * 60)));
  };

  const getTimeRemaining = (createdAt: bigint): { days: number; hours: number; minutes: number } => {
    const now = Math.floor(Date.now() / 1000);
    const releaseTime = Number(createdAt) + (7 * 24 * 60 * 60); // 7 days
    const secondsRemaining = Math.max(0, releaseTime - now);
    
    const days = Math.floor(secondsRemaining / (24 * 60 * 60));
    const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
    
    return { days, hours, minutes };
  };

  return {
    // State
    escrow,
    dispute,
    loading,
    error,
    userEscrows: userEscrows as bigint[] | undefined,
    sellerEscrows: sellerEscrows as bigint[] | undefined,
    
    // Actions
    createEscrowETH: handleCreateEscrowETH,
    createEscrowUSDC: handleCreateEscrowUSDC,
    confirmDelivery: handleConfirmDelivery,
    createDispute: handleCreateDispute,
    
    // Utilities
    getStatusText,
    getOutcomeText,
    formatAmount,
    getDaysRemaining,
    getTimeRemaining,
    
    // Refetch functions
    refetchEscrow,
    refetchDispute,
    refetchUserEscrows,
    refetchSellerEscrows,
    
    // Constants
    ESCROW_MANAGER_ADDRESS,
    USDC_ADDRESS,
  };
};