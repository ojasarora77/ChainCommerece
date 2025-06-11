import { useState } from "react";
import { useShoppingAgent } from "~~/hooks/bedrock/useShoppingAgent";
import { useAccount } from "wagmi";

export const AIShoppingAssistant = () => {
  const { address } = useAccount();
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState({
    sustainabilityMin: 70,
    budgetMax: 1000,
    preferredChain: "any" as const,
    categories: ["electronics", "fashion"],
    ethicalConcerns: ["fair-trade", "carbon-neutral"]
  });

  const { searchProducts, recommendations, loading, error } = useShoppingAgent(
    address || "",
    preferences
  );

  return (
    <div className="bg-base-100 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">AI Shopping Assistant</h2>
      
      <div className="space-y-4">
        {/* Search Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">What are you looking for?</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., sustainable laptop bag"
              className="input input-bordered w-full"
              onKeyPress={(e) => e.key === 'Enter' && searchProducts(query)}
            />
            <button 
              className="btn btn-primary"
              onClick={() => searchProducts(query)}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" />
          <div className="collapse-title font-medium">
            Preferences
          </div>
          <div className="collapse-content">
            <div className="space-y-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Minimum Sustainability Score</span>
                  <span className="label-text-alt">{preferences.sustainabilityMin}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences.sustainabilityMin}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    sustainabilityMin: parseInt(e.target.value)
                  })}
                  className="range range-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Maximum Budget (USD)</span>
                </label>
                <input
                  type="number"
                  value={preferences.budgetMax}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    budgetMax: parseInt(e.target.value)
                  })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Preferred Chain</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={preferences.preferredChain}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    preferredChain: e.target.value as any
                  })}
                >
                  <option value="any">Any Chain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="avalanche">Avalanche</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              AI Recommendations ({recommendations.length} products)
            </h3>
            {recommendations.map((product) => (
              <div key={product.id} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h4 className="card-title">{product.name}</h4>
                  <p className="text-sm">{product.description}</p>
                  
                  <div className="stats stats-horizontal">
                    <div className="stat">
                      <div className="stat-title">Sustainability</div>
                      <div className="stat-value text-primary">
                        {product.sustainabilityScore}%
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Price</div>
                      <div className="stat-value text-secondary">
                        ${product.price}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Chain</div>
                      <div className="stat-value text-accent text-sm">
                        {product.chain}
                      </div>
                    </div>
                  </div>

                  <div className="card-actions justify-end">
                    <button className="btn btn-primary">View Details</button>
                    <button className="btn btn-secondary">Buy Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
