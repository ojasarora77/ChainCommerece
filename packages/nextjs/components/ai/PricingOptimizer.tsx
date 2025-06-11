import { useState } from "react";

export const PricingOptimizer = ({ productId, currentPrice }: { 
  productId: string; 
  currentPrice: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);

  const optimizePrice = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          currentPrice,
          marketData: { fearGreedIndex: 65 }, // Mock data
          competitorPrices: [95, 105, 110] // Mock data
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setStrategy(data.strategy);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title">AI Price Optimizer</h3>
        <p>Current Price: ${currentPrice}</p>
        
        <button 
          className="btn btn-primary"
          onClick={optimizePrice}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Optimize Price"}
        </button>

        {strategy && (
          <div className="alert alert-info mt-4">
            <div>
              <h4 className="font-bold">Suggested Price: ${strategy.suggestedPrice}</h4>
              <p>{strategy.reasoning}</p>
              <div className="mt-2">
                <span className="text-sm">
                  Range: ${strategy.priceRange.min} - ${strategy.priceRange.max}
                </span>
                <br />
                <span className="text-sm">
                  Competitiveness Score: {strategy.competitivenessScore}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
