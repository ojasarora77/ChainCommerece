import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useEscrow, DisputeOutcome } from "~~/hooks/useEscrow";
import { notification } from "~~/utils/scaffold-eth";

interface DisputeResolutionProps {
  disputeId: bigint;
  className?: string;
}

interface Evidence {
  id: string;
  type: "text" | "image";
  content: string;
  timestamp: number;
  author: string;
}

const DisputeResolution: React.FC<DisputeResolutionProps> = ({ disputeId, className }) => {
  const { address } = useAccount();
  const { dispute, escrow, loading, getOutcomeText, formatAmount } = useEscrow();

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [newEvidenceText, setNewEvidenceText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  // Mock AI analysis results (in real implementation, this would come from the contract)
  const [aiAnalysis, setAiAnalysis] = useState<{
    confidence: number;
    recommendation: string;
    evidenceScore: {
      buyer: number;
      seller: number;
    };
    reasoning: string;
  } | null>(null);

  useEffect(() => {
    // Simulate AI analysis when dispute is created
    if (dispute && !dispute.isResolved && !aiAnalysis) {
      setTimeout(() => {
        setAiAnalysis({
          confidence: 85,
          recommendation: "Favor Buyer",
          evidenceScore: {
            buyer: 75,
            seller: 25,
          },
          reasoning: "Evidence indicates product delivery issues. Buyer provided detailed description of problems with supporting documentation.",
        });
      }, 3000);
    }
  }, [dispute, aiAnalysis]);

  const handleAddTextEvidence = () => {
    if (!newEvidenceText.trim() || !address) return;

    const newEvidence: Evidence = {
      id: Date.now().toString(),
      type: "text",
      content: newEvidenceText.trim(),
      timestamp: Date.now(),
      author: address,
    };

    setEvidence(prev => [...prev, newEvidence]);
    setNewEvidenceText("");
    notification.success("Evidence submitted successfully");
  };

  const handleImageUpload = async (file: File) => {
    if (!address) return;

    setIsSubmittingEvidence(true);
    try {
      // In a real implementation, you would upload to IPFS or similar
      const imageUrl = URL.createObjectURL(file);
      
      const newEvidence: Evidence = {
        id: Date.now().toString(),
        type: "image",
        content: imageUrl,
        timestamp: Date.now(),
        author: address,
      };

      setEvidence(prev => [...prev, newEvidence]);
      setSelectedImage(null);
      notification.success("Image evidence uploaded successfully");
    } catch (error) {
      console.error("Failed to upload image:", error);
      notification.error("Failed to upload image");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const getOutcomeBadgeClass = (outcome: DisputeOutcome): string => {
    switch (outcome) {
      case DisputeOutcome.Pending:
        return "badge-warning";
      case DisputeOutcome.FavorBuyer:
        return "badge-info";
      case DisputeOutcome.FavorSeller:
        return "badge-success";
      case DisputeOutcome.Split:
        return "badge-secondary";
      default:
        return "badge-ghost";
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

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

  if (!dispute) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <div className="text-center py-8 text-base-content/70">
            Dispute not found
          </div>
        </div>
      </div>
    );
  }

  const isBuyer = escrow?.buyer.toLowerCase() === address?.toLowerCase();
  const isSeller = escrow?.seller.toLowerCase() === address?.toLowerCase();
  const isParticipant = isBuyer || isSeller;

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title">Dispute Resolution</h3>
            <p className="text-sm text-base-content/70">
              Dispute #{dispute.id.toString()} • Escrow #{dispute.escrowId.toString()}
            </p>
          </div>
          <div className={`badge ${getOutcomeBadgeClass(dispute.outcome)}`}>
            {getOutcomeText(dispute.outcome)}
          </div>
        </div>

        {/* Dispute Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-base-content/70">Initiated by:</span>
              <p className="font-semibold">
                {dispute.initiator.toLowerCase() === escrow?.buyer.toLowerCase() ? "Buyer" : "Seller"}
                <span className="font-mono text-sm ml-2">
                  {formatAddress(dispute.initiator)}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-base-content/70">Created:</span>
              <p>{new Date(Number(dispute.createdAt) * 1000).toLocaleDateString()}</p>
            </div>
            {dispute.isResolved && (
              <div>
                <span className="text-sm text-base-content/70">Resolved:</span>
                <p>{new Date(Number(dispute.resolvedAt) * 1000).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-base-content/70">Arbitrators:</span>
              <p>{dispute.arbitrators.length} assigned</p>
            </div>
            <div>
              <span className="text-sm text-base-content/70">Votes:</span>
              <p>{dispute.votesCount.toString()} / {dispute.arbitrators.length}</p>
            </div>
            {escrow && (
              <div>
                <span className="text-sm text-base-content/70">Escrow Amount:</span>
                <p className="font-semibold">{formatAmount(escrow.amount, escrow.token)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Dispute Reason</h4>
          <div className="p-4 bg-base-200 rounded-lg">
            <p className="text-sm">{dispute.reason}</p>
          </div>
        </div>

        {/* AI Analysis */}
        {aiAnalysis ? (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">AI Analysis</h4>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">AI Recommendation</span>
                  <div className="badge badge-primary">{aiAnalysis.confidence}% confidence</div>
                </div>
                <p className="text-sm mb-2">
                  <strong>Outcome:</strong> {aiAnalysis.recommendation}
                </p>
                <p className="text-sm text-base-content/70">{aiAnalysis.reasoning}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Buyer Evidence Score</span>
                    <span className="font-bold">{aiAnalysis.evidenceScore.buyer}%</span>
                  </div>
                  <progress
                    className="progress progress-info w-full mt-2"
                    value={aiAnalysis.evidenceScore.buyer}
                    max="100"
                  ></progress>
                </div>
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Seller Evidence Score</span>
                    <span className="font-bold">{aiAnalysis.evidenceScore.seller}%</span>
                  </div>
                  <progress
                    className="progress progress-success w-full mt-2"
                    value={aiAnalysis.evidenceScore.seller}
                    max="100"
                  ></progress>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-3">
              <span className="loading loading-spinner loading-sm"></span>
              <div>
                <p className="font-medium">AI Analysis in Progress</p>
                <p className="text-sm text-base-content/70">
                  Our AI is analyzing the dispute evidence. Results will be available shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">Evidence</h4>
            {isParticipant && !dispute.isResolved && (
              <button
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                className="btn btn-sm btn-outline"
              >
                Add Evidence
              </button>
            )}
          </div>

          {/* Evidence Form */}
          {showEvidenceForm && isParticipant && (
            <div className="mb-4 p-4 bg-base-200 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Text Evidence</label>
                  <textarea
                    value={newEvidenceText}
                    onChange={(e) => setNewEvidenceText(e.target.value)}
                    placeholder="Provide detailed description of the issue..."
                    className="textarea textarea-bordered w-full"
                    rows={3}
                  />
                  <button
                    onClick={handleAddTextEvidence}
                    disabled={!newEvidenceText.trim()}
                    className="btn btn-sm btn-primary mt-2"
                  >
                    Submit Text
                  </button>
                </div>

                <div className="divider">OR</div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image Evidence</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="file-input file-input-bordered w-full"
                  />
                  {selectedImage && (
                    <button
                      onClick={() => handleImageUpload(selectedImage)}
                      disabled={isSubmittingEvidence}
                      className="btn btn-sm btn-primary mt-2"
                    >
                      {isSubmittingEvidence ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        "Upload Image"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Evidence List */}
          <div className="space-y-3">
            {evidence.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                No evidence submitted yet
              </div>
            ) : (
              evidence.map((item) => (
                <div key={item.id} className="p-4 bg-base-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`badge badge-sm ${
                        item.author.toLowerCase() === escrow?.buyer.toLowerCase() 
                          ? "badge-info" 
                          : "badge-success"
                      }`}>
                        {item.author.toLowerCase() === escrow?.buyer.toLowerCase() ? "Buyer" : "Seller"}
                      </div>
                      <span className="text-xs text-base-content/70">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <div className="badge badge-outline badge-xs">
                      {item.type}
                    </div>
                  </div>
                  
                  {item.type === "text" ? (
                    <p className="text-sm">{item.content}</p>
                  ) : (
                    <img
                      src={item.content}
                      alt="Evidence"
                      className="max-w-xs rounded-lg"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Arbitrator Status */}
        {dispute.arbitrators.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Arbitrator Status</h4>
            <div className="space-y-2">
              {dispute.arbitrators.map((arbitrator, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                  <span className="font-mono text-sm">{formatAddress(arbitrator)}</span>
                  <div className="badge badge-success badge-sm">Assigned</div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-info/10 rounded-lg">
              <p className="text-sm text-base-content/70">
                Arbitrators will review the evidence and vote on the resolution. 
                A majority vote is required to resolve the dispute.
              </p>
            </div>
          </div>
        )}

        {/* Resolution Status */}
        {dispute.isResolved && (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-success">Dispute Resolved</p>
                <p className="text-sm text-base-content/70">
                  Outcome: {getOutcomeText(dispute.outcome)}
                  {dispute.resolvedAt > 0n && (
                    <span className="ml-2">
                      • Resolved on {new Date(Number(dispute.resolvedAt) * 1000).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeResolution;