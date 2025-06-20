import { useState } from "react";
import { useShoppingAgent } from "~~/hooks/bedrock/useShoppingAgent";
import { useAccount } from "wagmi";
import { SparklesIcon, AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const AIShoppingAssistant = () => {
  const { address } = useAccount();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-6 shadow-xl border border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <SparklesIcon className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Shopping Assistant</h2>
            <p className="text-sm opacity-70">Powered by Amazon Bedrock</p>
          </div>
        </div>
        <div className="badge badge-primary">Beta</div>
      </div>

      <div className="space-y-6">
        {/* Search Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">What are you looking for?</span>
            <span className="label-text-alt text-primary">Try: "eco-friendly phone case"</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="input input-bordered w-full pr-24 focus:border-primary focus:ring-2 focus:ring-primary/20"
              onKeyPress={(e) => e.key === 'Enter' && searchProducts(query)}
            />
            <button
              className={`btn btn-primary absolute right-1 top-1 bottom-1 ${loading ? 'loading' : ''}`}
              onClick={() => searchProducts(query)}
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {query && (
            <div className="label">
              <span className="label-text-alt">
                AI will analyze: sustainability, price, reviews, and compatibility
              </span>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="card bg-base-200/50 border border-primary/10">
          <div className="card-body p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">AI Preferences</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-outline badge-sm">
                  {Object.values(preferences).filter(v => v !== "any" && v !== 1000).length} active
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-4 mt-4 pt-4 border-t border-base-300">
                {/* Sustainability Score */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Minimum Sustainability Score</span>
                    <span className="label-text-alt badge badge-success">{preferences.sustainabilityMin}%</span>
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
                  <div className="w-full flex justify-between text-xs px-2 opacity-60">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Budget */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Maximum Budget (USD)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm opacity-60">$</span>
                    <input
                      type="number"
                      value={preferences.budgetMax}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        budgetMax: parseInt(e.target.value)
                      })}
                      className="input input-bordered pl-8"
                      placeholder="1000"
                    />
                  </div>
                </div>

                {/* Preferred Chain */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Preferred Blockchain</span>
                  </label>
                  <select
                    className="select select-bordered focus:border-primary"
                    value={preferences.preferredChain}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      preferredChain: e.target.value as any
                    })}
                  >
                    <option value="any">🌐 Any Chain</option>
                    <option value="ethereum">⟠ Ethereum</option>
                    <option value="avalanche">🔺 Avalanche</option>
                  </select>
                </div>

                {/* Quick Preference Buttons */}
                <div className="space-y-2">
                  <span className="label-text font-medium">Quick Filters</span>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-outline btn-xs">🌱 Eco-Friendly</button>
                    <button className="btn btn-outline btn-xs">⚡ Fast Shipping</button>
                    <button className="btn btn-outline btn-xs">💎 Premium Quality</button>
                    <button className="btn btn-outline btn-xs">💰 Best Value</button>
                  </div>
                </div>
              </div>
            )}
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
