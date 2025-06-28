"use client";

import React, { useState, useEffect } from 'react';
import { useShoppingAgent } from '~~/hooks/bedrock';
import { useContractProducts } from '~~/hooks/useContractProducts';
import { UserPreferences } from '~~/types/bedrock';
import { useAccount } from 'wagmi';
import { HybridProductService } from '~~/services/marketplace/hybridProductService';
// Icons removed since tabs are no longer needed

interface AIShoppingAssistantProps {
  className?: string;
}

export const AIShoppingAssistant: React.FC<AIShoppingAssistantProps> = ({ className = "" }) => {
  const { address } = useAccount();
  const { recommendations, isLoading, error, searchProducts, getTrending } = useShoppingAgent();

  // 🔥 NEW: Use the proven contract products hook
  const { products: contractProducts } = useContractProducts();

  // Tab state for switching between assistant modes
  // Removed autonomous tab - now only search assistant

  // Update the hybrid service with real contract data
  useEffect(() => {
    if (contractProducts.length > 0) {
      const hybridService = HybridProductService.getInstance();
      hybridService.setProductsFromHook(contractProducts);
      console.log(`🔥 AI Assistant: Updated hybrid service with ${contractProducts.length} real products`);
    }
  }, [contractProducts]);
  
  const [query, setQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    sustainabilityMin: 70,
    budgetMax: 500,
    preferredChain: "any",
    categories: ["Electronics", "Fashion"],
    ethicalConcerns: ["Fair Trade", "Carbon Neutral"]
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const userId = address || `guest-${Date.now()}`;
    await searchProducts(query, preferences, userId);
  };

  const handleTrendingProducts = async () => {
    await getTrending();
  };

  // handleKeyPress removed - using inline onKeyDown instead

  // Autonomous agent moved to floating chat widget

  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      {/* Note: Autonomous Agent now available via floating chat widget */}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          🤖 AI Shopping Assistant
        </h2>
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          ⚙️ Preferences
        </button>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Shopping Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sustainability Minimum: {preferences.sustainabilityMin}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.sustainabilityMin}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  sustainabilityMin: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget Maximum: ${preferences.budgetMax}
              </label>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={preferences.budgetMax}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  budgetMax: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preferred Blockchain
              </label>
              <select
                value={preferences.preferredChain}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  preferredChain: e.target.value as any 
                }))}
                className="w-full bg-slate-600 text-white rounded-lg px-3 py-2"
              >
                <option value="any">Any Chain</option>
                <option value="ethereum">Ethereum</option>
                <option value="avalanche">Avalanche</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {["Electronics", "Fashion", "Home", "Sports", "Books"].map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      const newCategories = preferences.categories.includes(category)
                        ? preferences.categories.filter(c => c !== category)
                        : [...preferences.categories, category];
                      setPreferences(prev => ({ ...prev, categories: newCategories }));
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      preferences.categories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Interface */}
      <div className="mb-6">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ask me to find sustainable products... (e.g., 'eco-friendly phone chargers under $50')"
            className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? '🔍' : 'Search'}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleTrendingProducts}
            disabled={isLoading}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            🔥 Trending Products
          </button>
          <button
            onClick={() => setQuery("sustainable electronics")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            💚 Eco Electronics
          </button>
          <button
            onClick={() => setQuery("solar powered gadgets")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            ☀️ Solar Products
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-slate-300 mt-2">AI is analyzing products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-200">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {recommendations.length > 0 && !isLoading && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            🎯 Hybrid Search Results ({recommendations.length} products)
          </h3>

          {/* Real Products Section */}
          {recommendations.filter(p => p.isRealProduct).length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-green-400 mb-3 flex items-center">
                📦 Available in Marketplace ({recommendations.filter(p => p.isRealProduct).length} products)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.filter(p => p.isRealProduct).map((product) => (
                  <div key={product.id} className="bg-slate-700 border-l-4 border-green-500 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-white">{product.name}</h5>
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">REAL</span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{product.description}</p>

                    <div className="flex justify-between items-center mb-3">
                      <div className="flex flex-col">
                        <span className="text-green-400 font-bold">${product.price}</span>
                        {product.ethPrice && (
                          <span className="text-xs text-slate-400">{product.ethPrice} ETH</span>
                        )}
                      </div>
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        {product.sustainabilityScore}% Sustainable
                      </span>
                    </div>

                    {product.averageRating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-slate-300">{product.averageRating}/5</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.certifications?.slice(0, 2).map((cert, index) => (
                        <span key={index} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          {cert}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                      <span>⛓️ {product.chain}</span>
                      <span>🌱 {product.carbonFootprint}kg CO₂</span>
                    </div>

                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions Section */}
          {recommendations.filter(p => !p.isRealProduct).length > 0 && (
            <div>
              <h4 className="text-md font-medium text-blue-400 mb-3 flex items-center">
                🤖 AI Suggestions ({recommendations.filter(p => !p.isRealProduct).length} products)
                <span className="text-xs text-slate-400 ml-2">Products that would enhance the marketplace</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.filter(p => !p.isRealProduct).map((product) => (
                  <div key={product.id} className="bg-slate-700 border-l-4 border-blue-500 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-white">{product.name}</h5>
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">SUGGESTED</span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{product.description}</p>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-blue-400 font-bold">${product.price}</span>
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        {product.sustainabilityScore}% Sustainable
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.certifications?.slice(0, 2).map((cert, index) => (
                        <span key={index} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                          {cert}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                      <span>⛓️ {product.chain}</span>
                      <span>🌱 {product.carbonFootprint}kg CO₂</span>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                      Request Addition
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">
            👋 Hi! I'm your AI shopping assistant. Ask me to find sustainable products for you!
          </p>
          <p className="text-slate-500 text-sm">
            Try: "Find eco-friendly phone accessories under $100"
          </p>
        </div>
      )}
    </div>
  );
};
