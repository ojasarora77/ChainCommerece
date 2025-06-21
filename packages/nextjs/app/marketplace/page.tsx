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

import { AddProductForm } from "~~/components/marketplace/AddProductForm";
import MarketplaceSidebar from "~~/components/marketplace-sidebar";



const Marketplace: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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



  // 🔥 REAL DATA - Use contract categories or fallback
  const categories = contractCategories ? ["All", ...contractCategories] : ["All", "Electronics", "Clothing", "Digital", "Sports"];
  
  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
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
                    Decentralized Marketplace
                  </h1>
                  <p className="text-lg mb-6 text-white/90 max-w-lg mx-auto">
                    Buy and sell products on the blockchain with complete transparency and security
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {connectedAddress ? (
                      <div className="alert alert-success bg-white/20 backdrop-blur-sm border-white/30 text-white">
                        <SparklesIcon className="h-6 w-6" />
                        <span>Wallet connected! Start exploring the marketplace.</span>
                      </div>
                    ) : (
                      <div className="alert alert-info bg-white/20 backdrop-blur-sm border-white/30 text-white">
                        <SparklesIcon className="h-6 w-6" />
                        <span>Connect your wallet to start buying and selling!</span>
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
                  <ShoppingBagIcon className="h-8 w-8" />
                </div>
                <div className="stat-title text-slate-300">Total Products</div>
                <div className="stat-value text-primary">
                  {marketplaceStats ? Number(marketplaceStats[0]) : products.length}
                </div>
                <div className="stat-desc text-slate-400">Available in marketplace</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div className="stat-title text-slate-300">Total Sellers</div>
                <div className="stat-value text-secondary">
                  {marketplaceStats ? Number(marketplaceStats[1]) : "0"}
                </div>
                <div className="stat-desc text-slate-400">Active sellers</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-accent">
                  <SparklesIcon className="h-8 w-8" />
                </div>
                <div className="stat-title text-slate-300">Blockchain Powered</div>
                <div className="stat-value text-accent">100%</div>
                <div className="stat-desc text-slate-400">Decentralized & secure</div>
              </div>
            </div>
          </div>
        );
      case "ai-assistant":
        return <div className="p-8 text-center text-white">AI Shopping Assistant - Coming Soon</div>;
      case "ai-recommendations":
        return <div className="p-8 text-center text-white">AI Recommendations - Coming Soon</div>;
      case "pricing-optimizer":
        return <div className="p-8 text-center text-white">Pricing Optimizer - Coming Soon</div>;
      case "dispute-resolution":
        return <div className="p-8 text-center text-white">Dispute Resolution - Coming Soon</div>;
      case "analytics":
        return <div className="p-8 text-center text-white">Analytics Dashboard - Coming Soon</div>;
      case "reviews":
        return <div className="p-8 text-center text-white">Product Reviews - Coming Soon</div>;
      case "sellers":
        return <div className="p-8 text-center text-white">Seller Management - Coming Soon</div>;
      case "security":
        return <div className="p-8 text-center text-white">Security & Trust - Coming Soon</div>;
      case "settings":
        return <div className="p-8 text-center text-white">Settings - Coming Soon</div>;
      default:
        return <div className="p-8 text-center text-white">Section under development</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24">
      <MarketplaceSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        <div className="p-6">
          {renderSection()}
        </div>
      </MarketplaceSidebar>
    </div>
  );
};

export default Marketplace;