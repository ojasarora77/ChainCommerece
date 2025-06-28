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

  StarIcon 
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

import { AddProductForm } from "~~/components/marketplace/AddProductForm";
import { MarketplaceSettings } from "~~/components/marketplace/MarketplaceSettings";
import { SellerManagement } from "~~/components/marketplace/SellerManagement";
import MarketplaceSidebar from "~~/components/marketplace-sidebar";
import { AIShoppingAssistant } from "~~/components/ai/AIShoppingAssistant";
import { ProductRecommendations } from "~~/components/ai/ProductRecommendations";
import { realProductTracker } from "~~/services/marketplace/RealProductTracker";



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
          image: getProductImage(product.category),
          description: product.description,
          seller: product.seller,
          isRecommended: false
        }));
      
      // Ensure unique IDs by removing duplicates (extra safety)
      const uniqueProducts = realProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      console.log("🔥 Loaded products from contract:", uniqueProducts.length);
      console.log("🖼️ Product images:", uniqueProducts.map(p => ({ name: p.name, category: p.category, image: p.image })));
      setProducts(uniqueProducts);
    }
  }, [batchProducts]);



  // Helper function to get image source based on category
  const getProductImage = (category: string) => {
    const imageMap: { [key: string]: string } = {
      "Electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Electronics image URL
      "Clothing": "https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "Digital": "https://plus.unsplash.com/premium_photo-1687558246422-e94f0864d467?q=80&w=1065&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Fill in your digital products image URL
      "Sports": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Fill in your sports image URL
      "Books": "https://images.unsplash.com/photo-1577627444534-b38e16c9d796?q=80&w=1036&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Fill in your books image URL
      "Home & Garden": "https://plus.unsplash.com/premium_photo-1678836292816-fdf0ac484cf1?q=80&w=1703&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Fill in your home & garden image URL
      "Beauty": "https://plus.unsplash.com/premium_photo-1684407616442-8d5a1b7c978e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Fill in your beauty image URL
      "Automotive": "https://images.unsplash.com/photo-1624602482469-3cd73308e649?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Fill in your automotive image URL
    };
    return imageMap[category] || ""; // Default empty if category not found
  };



  // 🔥 REAL DATA - Use contract categories or fallback
  const categories = contractCategories ? ["All", ...contractCategories] : ["All", "Electronics", "Clothing", "Digital", "Sports"];
  
  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
      case "products":
        return (
          <div className="space-y-6">
            {/* Compact Header with Quick Actions */}
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Left side - Branding & Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <SparklesIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ChainCommerce</h1>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Blockchain Marketplace</p>
                    </div>
                  </div>
                </div>

                {/* Right side - Quick Stats & Actions */}
                <div className="flex items-center gap-4">
                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">
                        {marketplaceStats ? Number(marketplaceStats[0]) : products.length}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-secondary">
                        {marketplaceStats ? Number(marketplaceStats[1]) : "0"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sellers</div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className="flex items-center gap-2">
                    {connectedAddress ? (
                      <div className="flex items-center gap-2 bg-green-500/20 text-green-700 dark:text-green-300 px-3 py-2 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-orange-500/20 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Connect Wallet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

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

            {/* Products Grid - Uniform Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={`product-${product.id}-${index}`}
                  className="group bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary/50 cursor-pointer"
                  onClick={() => {
                    // Track product view
                    realProductTracker.trackProductView(
                      Number(product.id),
                      product.name,
                      connectedAddress,
                      { category: product.category, price: product.priceUSD }
                    );
                  }}
                >
                  {/* Product Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                    {product.image && product.image.trim() !== "" ? (
                      <img 
                        src={product.image} 
                        alt={`${product.category} product`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-4xl opacity-50">📦</span>
                      </div>
                    )}
                    
                    {/* Category Badge - Top Left */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
                        {product.category}
                      </span>
                    </div>

                    {/* Rating Badge - Top Right */}
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                        <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-white font-medium">{product.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Info Section */}
                  <div className="p-4 space-y-3">
                    {/* Product Name */}
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {product.description}
                    </p>
                    
                    {/* Seller Info */}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Seller: <Address address={product.seller} size="xs" />
                    </div>
                    
                    {/* Price and Buy Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Price</span>
                        <span className="text-2xl font-black text-white bg-primary px-2 py-1 rounded-lg">
                          {product.price}
                        </span>
                      </div>
                      <button className="btn btn-primary hover:btn-secondary transition-all group-hover:scale-105 shadow-lg">
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
      case "ai-recommendations":
        return <ProductRecommendations />;
      case "pricing-optimizer":
        return <div className="p-8 text-center text-white">Pricing Optimizer - Coming Soon</div>;
      case "dispute-resolution":
        return <div className="p-8 text-center text-white">Dispute Resolution - Coming Soon</div>;
      case "analytics":
        return <div className="p-8 text-center text-white">Analytics Dashboard - Coming Soon</div>;
      case "reviews":
        return <div className="p-8 text-center text-white">Product Reviews - Coming Soon</div>;
      case "sellers":
        return <SellerManagement />;
      case "security":
        return <div className="p-8 text-center text-white">Security & Trust - Coming Soon</div>;
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