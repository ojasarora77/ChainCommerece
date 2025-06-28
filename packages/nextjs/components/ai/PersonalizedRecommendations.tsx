"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  SparklesIcon,
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { recommendationEngine } from '~~/services/ai/RecommendationEngine';

interface Product {
  id: number;
  name: string;
  category: string;
  priceUSD: number;
  sustainabilityScore: number;
  averageRating: number;
  description: string;
}

interface RecommendationResult {
  product: Product;
  score: number;
  reasons: string[];
  type: 'collaborative' | 'content' | 'trending' | 'sustainable' | 'personalized';
}

interface PersonalizedRecommendationsProps {
  className?: string;
  limit?: number;
  onProductSelect?: (product: Product) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ 
  className = '', 
  limit = 6,
  onProductSelect 
}) => {
  const { address } = useAccount();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (address) {
      loadRecommendations();
    }
  }, [address, limit]);

  const loadRecommendations = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const recs = await recommendationEngine.getRecommendations(address, limit);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // Fallback to mock data
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  const handleProductView = async (product: Product) => {
    if (address) {
      await recommendationEngine.updateUserProfile(address, 'view', { productId: product.id });
    }
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collaborative': return '👥';
      case 'content': return '🎯';
      case 'trending': return '🔥';
      case 'sustainable': return '🌱';
      case 'personalized': return '✨';
      default: return '🛍️';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'collaborative': return 'Similar Users';
      case 'content': return 'For You';
      case 'trending': return 'Trending';
      case 'sustainable': return 'Eco-Friendly';
      case 'personalized': return 'Personalized';
      default: return 'Recommended';
    }
  };

  const filteredRecommendations = selectedType === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === selectedType);

  if (!address) {
    return (
      <div className={`text-center text-slate-400 p-8 ${className}`}>
        <SparklesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Connect your wallet to see personalized recommendations</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-purple-400" />
            Personalized Recommendations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-4"></div>
              <div className="h-3 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded mb-4"></div>
              <div className="h-8 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-purple-400" />
            Personalized Recommendations
          </h3>
          <p className="text-slate-400">AI-curated products just for you</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          title="Refresh recommendations"
        >
          <ArrowPathIcon className="h-5 w-5 text-slate-300" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'personalized', 'trending', 'sustainable', 'collaborative', 'content'].map(type => {
          const count = type === 'all' ? recommendations.length : recommendations.filter(r => r.type === type).length;
          if (count === 0 && type !== 'all') return null;
          
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {getTypeIcon(type)} {getTypeLabel(type)} ({count})
            </button>
          );
        })}
      </div>

      {/* Recommendations Grid */}
      {filteredRecommendations.length === 0 ? (
        <div className="text-center text-slate-400 p-8">
          <SparklesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recommendations available. Try adjusting your preferences!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.product.id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-purple-500 transition-all cursor-pointer group"
              onClick={() => handleProductView(rec.product)}
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {rec.product.name}
                  </h4>
                  <p className="text-slate-400 text-sm">{rec.product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">${rec.product.priceUSD}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-slate-300">{rec.product.averageRating}</span>
                  </div>
                </div>
              </div>

              {/* Sustainability Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-400">Sustainability</span>
                  <span className="text-green-400 font-semibold">{rec.product.sustainabilityScore}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all"
                    style={{ width: `${rec.product.sustainabilityScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                {rec.product.description}
              </p>

              {/* Recommendation Reasons */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">{getTypeIcon(rec.type)}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {getTypeLabel(rec.type)}
                  </span>
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                    {Math.round(rec.score)}% match
                  </span>
                </div>
                <div className="space-y-1">
                  {rec.reasons.slice(0, 2).map((reason, index) => (
                    <p key={index} className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                      {reason}
                    </p>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <ShoppingCartIcon className="h-4 w-4" />
                  Add to Cart
                </button>
                <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                  <HeartIcon className="h-4 w-4 text-slate-300" />
                </button>
                <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                  <EyeIcon className="h-4 w-4 text-slate-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {filteredRecommendations.length >= limit && (
        <div className="text-center">
          <button
            onClick={() => loadRecommendations()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Load More Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;
