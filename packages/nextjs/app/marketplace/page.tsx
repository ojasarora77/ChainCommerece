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
        .filter((product: any) => product.id && Number(product.id) > 0 && product.name) // Filter out empty/invalid products
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
      
      // Ensure unique IDs by removing duplicates
      const uniqueProducts = realProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            <SparklesIcon className="h-6 w-6 text-primary" />
            AI Marketplace
          </Link>
        </div>
        <div className="flex-none gap-2">
          {connectedAddress && (
            <>
              <button className="btn btn-ghost btn-circle">
                <ShoppingBagIcon className="h-5 w-5" />
              </button>
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                  <UserIcon className="h-5 w-5" />
                </div>
                <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                  <li><Link href="/preferences">Profile & Preferences</Link></li>
                  <li><Link href="/admin">Admin Panel</Link></li>
                  <li><a>My Products</a></li>
                  <li><a>Settings</a></li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="hero min-h-[300px] bg-gradient-to-r from-primary to-secondary rounded-3xl mb-8">
          <div className="hero-content text-center text-primary-content">
            <div className="max-w-md">
              <SparklesIcon className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-5xl font-bold">AI-Powered Shopping</h1>
              <p className="py-6">
                Discover products tailored just for you using advanced AI recommendations on the blockchain
              </p>
              {connectedAddress ? (
                <button 
                  className={`btn btn-accent btn-lg ${isGettingRecommendations ? 'loading' : ''}`}
                  onClick={handleGetAIRecommendations}
                  disabled={isGettingRecommendations}
                >
                  {isGettingRecommendations ? 'Getting AI Recommendations...' : 'Get My AI Recommendations'}
                  <SparklesIcon className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <div className="alert alert-info">
                  <span>Connect your wallet to get personalized AI recommendations!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amazon Bedrock AI Components */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AIShoppingAssistant />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Seller AI Tools</h2>
              <PricingOptimizer productId="demo-product-123" currentPrice={99.99} />

              {/* AI Dispute Resolution */}
              <DisputeResolver />
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {connectedAddress && recommendedProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">AI Recommendations for You</h2>
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
                className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
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

        {/* Stats Section - REAL DATA */}
        <div className="stats shadow w-full mt-12">
          <div className="stat">
            <div className="stat-figure text-primary">
              <SparklesIcon className="h-8 w-8" />
            </div>
            <div className="stat-title">AI Recommendations</div>
            <div className="stat-value text-primary">{recommendedProducts.length}</div>
            <div className="stat-desc">Personalized for you</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <ShoppingBagIcon className="h-8 w-8" />
            </div>
            <div className="stat-title">Total Products</div>
            <div className="stat-value text-secondary">
              {marketplaceStats ? Number(marketplaceStats[0]) : products.length}
            </div>
            <div className="stat-desc">Available in marketplace</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">
              <UserIcon className="h-8 w-8" />
            </div>
            <div className="stat-title">Total Sellers</div>
            <div className="stat-value text-accent">
              {marketplaceStats ? Number(marketplaceStats[1]) : "5+"}
            </div>
            <div className="stat-desc">Active sellers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;