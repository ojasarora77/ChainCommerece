import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useEscrow, EscrowStatus as EscrowStatusEnum } from "~~/hooks/useEscrow";
import { notification } from "~~/utils/scaffold-eth";

interface EscrowStatusProps {
  escrowId: bigint;
  className?: string;
}

const EscrowStatus: React.FC<EscrowStatusProps> = ({ escrowId, className }) => {
  const { address } = useAccount();
  const {
    escrow,
    loading,
    confirmDelivery,
    createDispute,
    formatAmount,
    getStatusText,
    getTimeRemaining,
    getDaysRemaining,
  } = useEscrow(escrowId);

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  // Update countdown timer
  useEffect(() => {
    if (!escrow || escrow.status !== EscrowStatusEnum.Created) return;

    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(escrow.createdAt));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [escrow, getTimeRemaining]);

  const handleConfirmDelivery = async () => {
    if (!escrow) return;

    try {
      await confirmDelivery(escrow.id);
    } catch (error) {
      console.error("Failed to confirm delivery:", error);
    }
  };

  const handleCreateDispute = async () => {
    if (!escrow || !disputeReason.trim()) {
      notification.error("Please provide a reason for the dispute");
      return;
    }

    try {
      await createDispute(escrow.id, disputeReason);
      setShowDisputeForm(false);
      setDisputeReason("");
    } catch (error) {
      console.error("Failed to create dispute:", error);
    }
  };

  const getStatusBadgeClass = (status: EscrowStatusEnum): string => {
    switch (status) {
      case EscrowStatusEnum.Created:
        return "badge-info";
      case EscrowStatusEnum.Delivered:
        return "badge-success";
      case EscrowStatusEnum.Disputed:
        return "badge-warning";
      case EscrowStatusEnum.Resolved:
        return "badge-success";
      case EscrowStatusEnum.Refunded:
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  const getProgressPercentage = (): number => {
    if (!escrow) return 0;
    
    switch (escrow.status) {
      case EscrowStatusEnum.Created:
        return 33;
      case EscrowStatusEnum.Delivered:
        return 100;
      case EscrowStatusEnum.Disputed:
        return 66;
      case EscrowStatusEnum.Resolved:
      case EscrowStatusEnum.Refunded:
        return 100;
      default:
        return 0;
    }
  };

  const isBuyer = escrow?.buyer.toLowerCase() === address?.toLowerCase();
  const isSeller = escrow?.seller.toLowerCase() === address?.toLowerCase();
  const isParticipant = isBuyer || isSeller;

  if (loading) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <div className="text-center py-8 text-base-content/70">
            Escrow not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title">Escrow #{escrow.id.toString()}</h3>
            <p className="text-sm text-base-content/70">
              {isBuyer ? "You are the buyer" : isSeller ? "You are the seller" : "View only"}
            </p>
          </div>
          <div className={`badge ${getStatusBadgeClass(escrow.status)}`}>
            {getStatusText(escrow.status)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={getProgressPercentage()}
            max="100"
          ></progress>
          <div className="flex justify-between text-xs text-base-content/70 mt-1">
            <span>Created</span>
            <span>In Progress</span>
            <span>Completed</span>
          </div>
        </div>

        {/* Escrow Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-base-content/70">Amount:</span>
            <span className="font-semibold">{formatAmount(escrow.amount, escrow.token)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Product ID:</span>
            <span>#{escrow.productId.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Buyer:</span>
            <span className="font-mono text-sm">
              {escrow.buyer.slice(0, 6)}...{escrow.buyer.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Seller:</span>
            <span className="font-mono text-sm">
              {escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}
            </span>
          </div>
        </div>

        {/* Auto-release Timer (only for Created status) */}
        {escrow.status === EscrowStatusEnum.Created && (
          <div className="mb-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">⏰</span>
              </div>
              <div>
                <p className="font-medium">Auto-release Timer</p>
                <p className="text-sm text-base-content/70">
                  {timeRemaining.days > 0 ? (
                    `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
                  ) : timeRemaining.hours > 0 ? (
                    `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
                  ) : timeRemaining.minutes > 0 ? (
                    `${timeRemaining.minutes}m remaining`
                  ) : (
                    "Funds will be auto-released soon"
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {isParticipant && escrow.status === EscrowStatusEnum.Created && (
          <div className="space-y-3">
            {/* Buyer Actions */}
            {isBuyer && (
              <>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={loading}
                  className="btn btn-success btn-block"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Confirm Delivery"
                  )}
                </button>
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="btn btn-warning btn-outline btn-block"
                >
                  Report Issue
                </button>
              </>
            )}

            {/* Seller Actions */}
            {isSeller && (
              <div className="text-center p-4 bg-info/10 rounded-lg">
                <p className="text-sm text-base-content/70">
                  Waiting for buyer to confirm delivery.
                  <br />
                  Funds will be automatically released in {getDaysRemaining(escrow.createdAt)} days.
                </p>
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="btn btn-warning btn-outline btn-sm mt-3"
                >
                  Report Issue
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dispute Form */}
        {showDisputeForm && (
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <h4 className="font-semibold mb-3">Create Dispute</h4>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="textarea textarea-bordered w-full mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateDispute}
                disabled={loading || !disputeReason.trim()}
                className="btn btn-warning flex-1"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Submit Dispute"
                )}
              </button>
              <button
                onClick={() => {
                  setShowDisputeForm(false);
                  setDisputeReason("");
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {escrow.status === EscrowStatusEnum.Delivered && (
          <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-success">Delivery Confirmed</p>
                <p className="text-sm text-base-content/70">
                  Funds have been released to the seller.
                </p>
              </div>
            </div>
          </div>
        )}

        {escrow.status === EscrowStatusEnum.Disputed && (
          <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">⚠</span>
              </div>
              <div>
                <p className="font-medium text-warning">Dispute Active</p>
                <p className="text-sm text-base-content/70">
                  Arbitrators are reviewing the case. You will be notified of the resolution.
                </p>
              </div>
            </div>
          </div>
        )}

        {(escrow.status === EscrowStatusEnum.Resolved || escrow.status === EscrowStatusEnum.Refunded) && (
          <div className="mt-4 p-4 bg-info/10 rounded-lg border border-info/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">ℹ</span>
              </div>
              <div>
                <p className="font-medium">Escrow Completed</p>
                <p className="text-sm text-base-content/70">
                  {escrow.status === EscrowStatusEnum.Resolved
                    ? "Dispute has been resolved and funds distributed."
                    : "Funds have been refunded."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscrowStatus;