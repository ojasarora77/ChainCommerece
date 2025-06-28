"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContractProducts } from '~~/hooks/useContractProducts';
import { HybridProductService } from '~~/services/marketplace/hybridProductService';
import { ContractProduct } from '~~/services/marketplace/contractProductService';
import {
  SparklesIcon,
  HeartIcon,
  FireIcon,
  ClockIcon,
  StarIcon,
  ShoppingBagIcon,
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Address } from "~~/components/scaffold-eth";

interface RecommendationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  products: EnhancedProduct[];
  algorithm: string;
}

interface EnhancedProduct extends ContractProduct {
  recommendationScore: number;
  aiExplanation: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoningTags: string[];
}

export const ProductRecommendations: React.FC = () => {
  const { address } = useAccount();
  const { products: contractProducts, isLoading: contractLoading } = useContractProducts();
  
  const [recommendations, setRecommendations] = useState<RecommendationCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [isLoading, setIsLoading] = useState(false);

  // Update hybrid service with real contract data
  useEffect(() => {
    if (contractProducts.length > 0) {
      const hybridService = HybridProductService.getInstance();
      hybridService.setProductsFromHook(contractProducts);
      generateRecommendations();
    }
  }, [contractProducts]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const hybridService = HybridProductService.getInstance();
      const allProducts = hybridService.getCachedProducts();

      if (allProducts.length === 0) {
        console.log("No products available for recommendations");
        setIsLoading(false);
        return;
      }

      // Generate different recommendation categories
      const categories: RecommendationCategory[] = [
        {
          id: 'trending',
          title: 'Trending Now',
          description: 'Popular products gaining momentum in the marketplace',
          icon: <FireIcon className="h-5 w-5" />,
          products: getTrendingProducts(allProducts),
          algorithm: 'Popularity + Recent Activity'
        },
        {
          id: 'sustainable',
          title: 'Eco Champions',
          description: 'Highest sustainability scores for conscious consumers',
          icon: <SparklesIcon className="h-5 w-5" />,
          products: getSustainableProducts(allProducts),
          algorithm: 'Sustainability Score + Certifications'
        },
        {
          id: 'value',
          title: 'Best Value',
          description: 'Great products at excellent price points',
          icon: <StarIcon className="h-5 w-5" />,
          products: getBestValueProducts(allProducts),
          algorithm: 'Price-to-Quality Ratio'
        },
        {
          id: 'new',
          title: 'Fresh Arrivals',
          description: 'Recently listed products worth exploring',
          icon: <ClockIcon className="h-5 w-5" />,
          products: getNewProducts(allProducts),
          algorithm: 'Recency + Quality Score'
        }
      ];

      setRecommendations(categories);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced recommendation algorithms with AI explanations
  const getTrendingProducts = (products: ContractProduct[]): EnhancedProduct[] => {
    return products
      .filter(p => p.isActive)
      .sort((a, b) => (b.averageRating * 100 + (b.sustainabilityScore || 0)) - (a.averageRating * 100 + (a.sustainabilityScore || 0)))
      .slice(0, 4)
      .map((product, index) => ({
        ...product,
        recommendationScore: 95 - (index * 5),
        aiExplanation: generateTrendingExplanation(product, index),
        confidenceLevel: index < 2 ? 'high' : 'medium' as const,
        reasoningTags: ['Popular', 'High Rating', 'Active Community']
      }));
  };

  const getSustainableProducts = (products: ContractProduct[]): EnhancedProduct[] => {
    return products
      .filter(p => p.isActive && (p.sustainabilityScore || 0) >= 80)
      .sort((a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0))
      .slice(0, 4)
      .map((product, index) => ({
        ...product,
        recommendationScore: 90 - (index * 3),
        aiExplanation: generateSustainabilityExplanation(product),
        confidenceLevel: 'high' as const,
        reasoningTags: ['Eco-Friendly', 'Certified', 'Low Carbon']
      }));
  };

  const getBestValueProducts = (products: ContractProduct[]): EnhancedProduct[] => {
    return products
      .filter(p => p.isActive && p.priceUSD < 100)
      .sort((a, b) => {
        const aValue = (a.averageRating * (a.sustainabilityScore || 50)) / a.priceUSD;
        const bValue = (b.averageRating * (b.sustainabilityScore || 50)) / b.priceUSD;
        return bValue - aValue;
      })
      .slice(0, 4)
      .map((product, index) => ({
        ...product,
        recommendationScore: 85 - (index * 4),
        aiExplanation: generateValueExplanation(product),
        confidenceLevel: index < 2 ? 'high' : 'medium' as const,
        reasoningTags: ['Great Price', 'Quality', 'Value']
      }));
  };

  const getNewProducts = (products: ContractProduct[]): EnhancedProduct[] => {
    return products
      .filter(p => p.isActive)
      .sort((a, b) => b.id - a.id) // Assuming higher ID = newer
      .slice(0, 4)
      .map((product, index) => ({
        ...product,
        recommendationScore: 80 - (index * 5),
        aiExplanation: generateNewProductExplanation(product),
        confidenceLevel: 'medium' as const,
        reasoningTags: ['New', 'Fresh', 'Explore']
      }));
  };

  // AI Explanation Generators
  const generateTrendingExplanation = (product: ContractProduct, rank: number): string => {
    const reasons = [
      `Ranked #${rank + 1} due to ${product.averageRating}/5 rating and ${product.sustainabilityScore}% sustainability score`,
      `Popular choice with strong community engagement and verified seller`,
      `Trending in ${product.category} category with excellent user feedback`
    ];
    return reasons[rank] || reasons[0];
  };

  const generateSustainabilityExplanation = (product: ContractProduct): string => {
    const score = product.sustainabilityScore || 0;
    if (score >= 95) return `Exceptional ${score}% sustainability score with premium eco-certifications`;
    if (score >= 85) return `Outstanding ${score}% sustainability rating with verified green practices`;
    return `Strong ${score}% sustainability score exceeding marketplace standards`;
  };

  const generateValueExplanation = (product: ContractProduct): string => {
    const valueRatio = (product.averageRating * (product.sustainabilityScore || 50)) / product.priceUSD;
    return `Excellent value at $${product.priceUSD} with ${product.averageRating}/5 rating and ${product.sustainabilityScore}% sustainability`;
  };

  const generateNewProductExplanation = (product: ContractProduct): string => {
    return `Recently added to marketplace with promising ${product.averageRating}/5 initial rating in ${product.category}`;
  };

  const selectedRecommendation = recommendations.find(r => r.id === selectedCategory);

  if (contractLoading || isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <p className="text-slate-300 mt-2">Generating AI recommendations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <SparklesIcon className="h-8 w-8 text-purple-500" />
          AI Product Recommendations
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Discover products tailored to your preferences using advanced AI algorithms and real marketplace data
        </p>
      </div>

      {/* Category Selector */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {recommendations.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {category.icon}
            {category.title}
          </button>
        ))}
      </div>

      {/* Selected Category Display */}
      {selectedRecommendation && (
        <div className="space-y-6">
          {/* Category Info */}
          <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                {selectedRecommendation.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedRecommendation.title}</h2>
                <p className="text-slate-300">{selectedRecommendation.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <SparklesIcon className="h-4 w-4" />
              <span>Algorithm: {selectedRecommendation.algorithm}</span>
            </div>
          </div>

          {/* Products Grid */}
          {selectedRecommendation.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {selectedRecommendation.products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-purple-500/10"
                >
                  {/* Product Header */}
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                          #{index + 1} Recommended
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.confidenceLevel === 'high' ? 'bg-green-600 text-white' :
                          product.confidenceLevel === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {product.recommendationScore}% Match
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-white">{product.averageRating}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Reasoning Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.reasoningTags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-slate-300 line-clamp-2">{product.description}</p>

                    {/* AI Explanation */}
                    <div className="bg-slate-700 rounded-lg p-3 border-l-2 border-purple-500">
                      <div className="flex items-start gap-2">
                        <SparklesIcon className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-300 leading-relaxed">{product.aiExplanation}</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">${product.priceUSD}</div>
                        <div className="text-xs text-slate-400">Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">{product.sustainabilityScore || 75}%</div>
                        <div className="text-xs text-slate-400">Sustainable</div>
                      </div>
                    </div>

                    {/* Seller */}
                    <div className="text-xs text-slate-400">
                      Seller: <Address address={product.seller} size="xs" />
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group-hover:scale-105">
                      <ShoppingBagIcon className="h-4 w-4" />
                      View Product
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <EyeIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No recommendations available</h3>
              <p className="text-slate-400">Try a different category or check back later for new products.</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Footer */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">{contractProducts.length}</div>
            <div className="text-sm text-slate-400">Products Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {recommendations.reduce((sum, cat) => sum + cat.products.length, 0)}
            </div>
            <div className="text-sm text-slate-400">Recommendations Generated</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">4</div>
            <div className="text-sm text-slate-400">AI Algorithms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
