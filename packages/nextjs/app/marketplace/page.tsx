// packages/nextjs/app/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { 
  SparklesIcon, 
  ShoppingBagIcon, 
  UserIcon, 
  Cog6ToothIcon,
  ArrowRightIcon,
  FireIcon,
  StarIcon 
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { AIShoppingAssistant } from "~~/components/ai/AIShoppingAssistant";
import { PricingOptimizer } from "~~/components/ai/PricingOptimizer";
import { DisputeResolver } from "~~/components/ai/DisputeResolver";
import { AddProductForm } from "~~/components/marketplace/AddProductForm";
import { MarketplaceSettings } from "~~/components/marketplace/MarketplaceSettings";
import MarketplaceSidebar from "~~/components/marketplace-sidebar";

// Mock product data (replace with actual contract calls)
const mockProducts = [
  {
    id: 1,
    name: "Solar Phone Charger",
    category: "Electronics",
    price: "0.05 ETH",
    rating: 4.8,
    image: "🔋",
    description: "Portable solar-powered charger",
    seller: "0x822c480a0D437b6e6276D0AF69DBe7B19B65B599",
    isRecommended: false
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt",
    category: "Clothing", 
    price: "0.02 ETH",
    rating: 4.6,
    image: "👕",
    description: "100% organic cotton",
    seller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    isRecommended: false
  },
  {
    id: 3,
    name: "Blockchain Dev Guide",
    category: "Digital",
    price: "0.01 ETH", 
    rating: 4.9,
    image: "📚",
    description: "Complete development guide",
    seller: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    isRecommended: false
  },
  {
    id: 4,
    name: "Smart Plant Monitor",
    category: "Electronics",
    price: "0.08 ETH",
    rating: 4.7,
    image: "🌱",
    description: "IoT plant care device",
    seller: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    isRecommended: false
  },
  {
    id: 5,
    name: "Recycled Yoga Mat",
    category: "Sports",
    price: "0.03 ETH",
    rating: 4.5,
    image: "🧘",
    description: "Eco-friendly yoga mat",
    seller: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    isRecommended: false
  }
];

const Marketplace: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [products, setProducts] = useState(mockProducts);
  const [recommendations, setRecommendations] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // 🔥 REAL CONTRACT CALLS - Get marketplace stats
  const { data: marketplaceStats } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getMarketplaceStats",
  });

  // 🔥 REAL CONTRACT CALLS - Get categories  
  const { data: contractCategories } = useScaffoldReadContract({
    contractName: "ProductRegistry", 
    functionName: "getCategories",
  });

  // 🔥 REAL CONTRACT CALLS - Get products by category
  const { data: electronicsProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getProductsByCategory", 
    args: ["Electronics"],
  });

  const { data: clothingProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getProductsByCategory",
    args: ["Clothing"], 
  });

  const { data: digitalProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getProductsByCategory",
    args: ["Digital"],
  });

  const { data: sportsProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getProductsByCategory", 
    args: ["Sports"],
  });

  // 🔥 REAL CONTRACT CALLS - Get batch product details (dynamically fetch all products)
  const { data: totalProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "totalProducts",
  });

  // Generate array of product IDs to fetch
  const productIdsToFetch = totalProducts 
    ? Array.from({ length: Number(totalProducts) }, (_, i) => BigInt(i + 1))
    : [1n, 2n, 3n, 4n, 5n]; // Fallback to first 5

  const { data: batchProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getBatchProducts",
    args: [productIdsToFetch],
  });

  // 🔥 REAL CONTRACT CALLS - Read latest AI recommendations
  const { data: latestRecommendations } = useScaffoldReadContract({
    contractName: "AIRecommendations",
    functionName: "getLatestRecommendations",
    args: [connectedAddress],
  });

  // 🔥 REAL CONTRACT CALLS - Request AI recommendations
  const { writeContractAsync: requestRecommendations } = useScaffoldWriteContract({
    contractName: "AIRecommendations",
  });

  // 🔥 REAL DATA - Update products when contract data loads
  useEffect(() => {
    if (batchProducts && batchProducts.length > 0) {
      const realProducts = batchProducts
        .filter((product: any) => 
          product.id && 
          Number(product.id) > 0 && 
          product.name && 
          product.isActive // ✅ Only show active products
        )
        .map((product: any, index: number) => ({
          id: Number(product.id),
          name: product.name,
          category: product.category,
          price: `${(Number(product.price) / 1e18).toFixed(3)} ETH`,
          rating: Number(product.averageRating) / 100 || 4.5, // Convert from scaled rating
          image: getProductEmoji(product.category),
          description: product.description,
          seller: product.seller,
          isRecommended: false
        }));
      
      // Ensure unique IDs by removing duplicates (extra safety)
      const uniqueProducts = realProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      console.log("🔥 Loaded products from contract:", uniqueProducts.length);
      setProducts(uniqueProducts);
    }
  }, [batchProducts]);

  // 🔥 REAL DATA - Update AI recommendations
  useEffect(() => {
    if (latestRecommendations && latestRecommendations[0]) {
      const productIds = latestRecommendations[0].map((id: bigint) => Number(id));
      setRecommendations(productIds);
      
      // Mark recommended products
      setProducts(prev => prev.map(product => ({
        ...product,
        isRecommended: productIds.includes(product.id)
      })));
    }
  }, [latestRecommendations]);

  // Helper function to get emoji based on category
  const getProductEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      "Electronics": "📱",
      "Clothing": "👕", 
      "Digital": "📚",
      "Sports": "⚽",
      "Books": "📖",
      "Home & Garden": "🏡",
      "Beauty": "💄",
      "Automotive": "🚗"
    };
    return emojiMap[category] || "📦";
  };

  const handleGetAIRecommendations = async () => {
    if (!connectedAddress) return;
    
    setIsGettingRecommendations(true);
    try {
      await requestRecommendations({
        functionName: "requestRecommendations",
        args: [5n],
      });
      
      // Poll for results after a delay
      setTimeout(() => {
        window.location.reload(); // Simple refresh to get new recommendations
      }, 30000); // Wait 30 seconds for AI to process
      
    } catch (error) {
      console.error("Error requesting recommendations:", error);
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  // 🔥 REAL DATA - Use contract categories or fallback
  const categories = contractCategories ? ["All", ...contractCategories] : ["All", "Electronics", "Clothing", "Digital", "Sports"];
  
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const recommendedProducts = products.filter(p => p.isRecommended);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
      case "products":
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative hero min-h-[300px] bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
                <div className="absolute bottom-20 left-32 w-12 h-12 bg-white rounded-full animate-pulse delay-2000"></div>
                <div className="absolute bottom-32 right-10 w-24 h-24 bg-white rounded-full animate-pulse delay-500"></div>
              </div>

              <div className="hero-content text-center text-primary-content relative z-10">
                <div className="max-w-2xl">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                      <SparklesIcon className="h-16 w-16 animate-pulse" />
                    </div>
                  </div>

                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    AI-Powered Shopping
                  </h1>
                  <p className="text-lg mb-6 text-white/90 max-w-lg mx-auto">
                    Discover products tailored just for you using advanced AI recommendations on the blockchain
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {connectedAddress ? (
                      <>
                        <button
                          className={`btn btn-accent btn-lg shadow-lg hover:shadow-xl transition-all ${isGettingRecommendations ? 'loading' : ''}`}
                          onClick={handleGetAIRecommendations}
                          disabled={isGettingRecommendations}
                        >
                          {isGettingRecommendations ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Getting AI Recommendations...
                            </>
                          ) : (
                            <>
                              Get My AI Recommendations
                              <SparklesIcon className="h-5 w-5 ml-2" />
                            </>
                          )}
                        </button>
                        <div className="stats bg-white/20 backdrop-blur-sm">
                          <div className="stat text-center">
                            <div className="stat-value text-white text-lg">{recommendedProducts.length}</div>
                            <div className="stat-desc text-white/80">AI Recommendations</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-info bg-white/20 backdrop-blur-sm border-white/30 text-white">
                        <SparklesIcon className="h-6 w-6" />
                        <span>Connect your wallet to get personalized AI recommendations!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="stats shadow w-full bg-slate-900">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <SparklesIcon className="h-8 w-8" />
                </div>
                <div className="stat-title text-slate-300">AI Recommendations</div>
                <div className="stat-value text-primary">{recommendedProducts.length}</div>
                <div className="stat-desc text-slate-400">Personalized for you</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <ShoppingBagIcon className="h-8 w-8" />
                </div>
                <div className="stat-title text-slate-300">Total Products</div>
                <div className="stat-value text-secondary">
                  {marketplaceStats ? Number(marketplaceStats[0]) : products.length}
                </div>
                <div className="stat-desc text-slate-400">Available in marketplace</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-accent">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div className="stat-title text-slate-300">Total Sellers</div>
                <div className="stat-value text-accent">
                  {marketplaceStats ? Number(marketplaceStats[1]) : "5+"}
                </div>
                <div className="stat-desc text-slate-400">Active sellers</div>
              </div>
            </div>

            {/* AI Recommendations Section */}
            {connectedAddress && recommendedProducts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-white">AI Recommendations for You</h2>
                  <div className="badge badge-primary">Powered by Chainlink Functions</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {recommendedProducts.map((product, index) => (
                    <div key={`recommended-${product.id}-${index}`} className="card bg-base-100 shadow-xl border-2 border-primary">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-4xl">{product.image}</div>
                          <div className="badge badge-primary">
                            <FireIcon className="h-3 w-3 mr-1" />
                            AI Pick
                          </div>
                        </div>
                        <h3 className="card-title text-sm">{product.name}</h3>
                        <p className="text-xs opacity-70">{product.description}</p>
                        <div className="flex items-center gap-1 my-2">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm">{product.rating}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary">{product.price}</span>
                          <button className="btn btn-primary btn-sm">
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline btn-primary'}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              {/* Add Product Button */}
              {connectedAddress && <AddProductForm />}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div key={`product-${product.id}-${index}`} className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all ${product.isRecommended ? 'ring-2 ring-primary' : ''}`}>
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-6xl">{product.image}</div>
                      {product.isRecommended && (
                        <div className="badge badge-primary">
                          <SparklesIcon className="h-3 w-3 mr-1" />
                          AI
                        </div>
                      )}
                    </div>
                    
                    <h2 className="card-title">{product.name}</h2>
                    <div className="badge badge-outline">{product.category}</div>
                    <p className="text-sm opacity-70">{product.description}</p>
                    
                    <div className="flex items-center gap-1 my-2">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{product.rating}</span>
                    </div>
                    
                    <div className="text-xs mb-2">
                      Seller: <Address address={product.seller} size="xs" />
                    </div>
                    
                    <div className="card-actions justify-between items-center">
                      <span className="text-xl font-bold text-primary">{product.price}</span>
                      <button className="btn btn-primary">
                        Buy Now
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Products Message */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBagIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No products found</h3>
                <p className="text-slate-400">
                  {selectedCategory === "All" 
                    ? "No products available yet. Be the first to list a product!" 
                    : `No products found in the ${selectedCategory} category.`
                  }
                </p>
                {connectedAddress && (
                  <div className="mt-4">
                    <AddProductForm />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "ai-assistant":
        return <AIShoppingAssistant />;
      case "pricing-optimizer":
        return <PricingOptimizer productId="demo-product-123" currentPrice={99.99} />;
      case "dispute-resolution":
        return <DisputeResolver />;
      case "settings":
        return <MarketplaceSettings />;
      default:
        return <div className="p-8 text-center text-white">Section under development</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 sm:pt-24">
      <MarketplaceSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        <div className="p-4 sm:p-6">
          {renderSection()}
        </div>
      </MarketplaceSidebar>
    </div>
  );
};

export default Marketplace;