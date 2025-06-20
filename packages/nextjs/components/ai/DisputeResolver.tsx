import { useState } from "react";
import { DisputeCase } from "~~/types/bedrock";

export const DisputeResolver = () => {
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState<any>(null);
  const [dispute, setDispute] = useState<DisputeCase>({
    orderId: "",
    buyer: "",
    seller: "",
    issue: "",
    evidence: [],
    orderValue: undefined
  });

  const analyzeDispute = async () => {
    if (!dispute.orderId || !dispute.issue) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/ai/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispute),
      });
      
      const data = await response.json();
      if (data.success) {
        setResolution(data.resolution);
      }
    } finally {
      setLoading(false);
    }
  };

  const addEvidence = () => {
    setDispute(prev => ({
      ...prev,
      evidence: [...prev.evidence, ""]
    }));
  };

  const updateEvidence = (index: number, value: string) => {
    setDispute(prev => ({
      ...prev,
      evidence: prev.evidence.map((item, i) => i === index ? value : item)
    }));
  };

  const removeEvidence = (index: number) => {
    setDispute(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title">AI Dispute Resolution</h3>
        <p className="text-sm opacity-70 mb-4">
          Automated dispute analysis powered by Amazon Bedrock AI
        </p>
        
        <div className="space-y-4">
          {/* Order ID */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Order ID</span>
            </label>
            <input
              type="text"
              value={dispute.orderId}
              onChange={(e) => setDispute(prev => ({ ...prev, orderId: e.target.value }))}
              placeholder="Enter order ID"
              className="input input-bordered"
            />
          </div>

          {/* Buyer Address */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Buyer Address</span>
            </label>
            <input
              type="text"
              value={dispute.buyer}
              onChange={(e) => setDispute(prev => ({ ...prev, buyer: e.target.value }))}
              placeholder="0x..."
              className="input input-bordered"
            />
          </div>

          {/* Seller Address */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Seller Address</span>
            </label>
            <input
              type="text"
              value={dispute.seller}
              onChange={(e) => setDispute(prev => ({ ...prev, seller: e.target.value }))}
              placeholder="0x..."
              className="input input-bordered"
            />
          </div>

          {/* Order Value */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Order Value (USD)</span>
            </label>
            <input
              type="number"
              value={dispute.orderValue || ""}
              onChange={(e) => setDispute(prev => ({ 
                ...prev, 
                orderValue: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              placeholder="Enter order value"
              className="input input-bordered"
              min="0"
              step="0.01"
            />
          </div>

          {/* Issue Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Issue Description</span>
            </label>
            <textarea
              value={dispute.issue}
              onChange={(e) => setDispute(prev => ({ ...prev, issue: e.target.value }))}
              placeholder="Describe the dispute..."
              className="textarea textarea-bordered"
              rows={3}
            />
          </div>

          {/* Evidence */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Evidence</span>
              <button 
                type="button"
                onClick={addEvidence}
                className="btn btn-xs btn-outline"
              >
                Add Evidence
              </button>
            </label>
            <div className="space-y-2">
              {dispute.evidence.map((evidence, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={evidence}
                    onChange={(e) => updateEvidence(index, e.target.value)}
                    placeholder="Evidence description..."
                    className="input input-bordered flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeEvidence(index)}
                    className="btn btn-error btn-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button 
            className="btn btn-primary w-full"
            onClick={analyzeDispute}
            disabled={loading || !dispute.orderId || !dispute.issue}
          >
            {loading ? "Analyzing..." : "Analyze Dispute"}
          </button>

          {/* Resolution Results */}
          {resolution && (
            <div className="alert alert-info">
              <div className="w-full">
                <h4 className="font-bold">AI Resolution Recommendation</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Decision:</span>
                    <span className="font-semibold capitalize">{resolution.decision}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Percentage:</span>
                    <span className="font-semibold">{resolution.percentage}%</span>
                  </div>
                  <div>
                    <span className="font-semibold">Reasoning:</span>
                    <p className="text-sm mt-1">{resolution.reasoning}</p>
                  </div>
                  {resolution.additionalActions.length > 0 && (
                    <div>
                      <span className="font-semibold">Additional Actions:</span>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {resolution.additionalActions.map((action: string, index: number) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
