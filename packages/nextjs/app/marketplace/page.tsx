// packages/nextjs/app/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { 
  SparklesIcon, 
  ShoppingBagIcon, 
  UserIcon, 
  Cog6ToothIcon,
  ArrowRightIcon,
  StarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ScaleIcon
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
import EscrowStatus from "~~/components/marketplace/EscrowStatus";
import DisputeResolution from "~~/components/marketplace/DisputeResolution";
import PaymentModal from "~~/components/marketplace/PaymentModal";
import { useEscrow } from "~~/hooks/useEscrow";



const Marketplace: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedEscrowId, setSelectedEscrowId] = useState<bigint | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<bigint | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [escrowTab, setEscrowTab] = useState<'overview' | 'escrows' | 'disputes'>('overview');
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<any>(null);
  
  const { userEscrows, sellerEscrows, refetchUserEscrows, refetchSellerEscrows } = useEscrow();

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

  // Mock product for escrow testing
  const mockProduct = {
    id: 1n,
    name: "Premium Wireless Headphones",
    description: "High-quality noise-canceling wireless headphones with premium sound quality",
    category: "Electronics",
    price: BigInt("50000000000000000"), // 0.05 ETH
    seller: "0x742d35Cc6634C0532925a3b8D0331d2c0d8Ceb13",
    imageHash: "QmExample123",
    metadataHash: "QmMetadata456",
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000)),
    totalSales: 0n,
    totalReviews: 0n,
    averageRating: 0n,
  };

  const handlePaymentSuccess = (escrowId: bigint) => {
    setSelectedEscrowId(escrowId);
    setEscrowTab('escrows');
    setActiveSection('escrow-manager'); // Switch to escrow manager
    refetchUserEscrows();
    refetchSellerEscrows();
    setShowPaymentModal(false);
    setSelectedProductForPurchase(null);
  };

  const handleBuyNow = (product: any) => {
    // Convert the marketplace product to the expected format
    const formattedProduct = {
      id: BigInt(product.id),
      name: product.name,
      description: product.description,
      category: product.category,
      price: parseEther(product.price.replace(' ETH', '')), // Convert price string to bigint
      seller: product.seller,
      imageHash: "QmExample123",
      metadataHash: "QmMetadata456",
      isActive: true,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      totalSales: 0n,
      totalReviews: 0n,
      averageRating: BigInt(Math.floor(product.rating * 100)), // Convert to scaled rating
    };
    
    setSelectedProductForPurchase(formattedProduct);
    setShowPaymentModal(true);
  };

  // Mock dispute data
  const mockDisputes = [
    {
      id: 1,
      escrowId: 123,
      title: "Product Not as Described",
      description: "The wireless headphones received do not match the product description. They are missing noise cancellation feature.",
      status: "pending",
      createdAt: "2024-01-15",
      buyer: "0x742d35Cc6634C0532925a3b8D0331d2c0d8Ceb13",
      seller: "0x8ba1f109551bD432803012645Hac136c4c11Ba9",
      amount: "0.05 ETH",
      evidence: [
        { type: "text", content: "Product photos show noise cancellation but received basic headphones" },
        { type: "image", content: "evidence1.jpg" }
      ],
      arbitratorVotes: 2,
      totalArbitrators: 5,
      outcome: null
    },
    {
      id: 2,
      escrowId: 124,
      title: "Delayed Delivery",
      description: "Product was supposed to arrive within 3 days but it's been 2 weeks with no delivery.",
      status: "resolved",
      createdAt: "2024-01-10",
      resolvedAt: "2024-01-20",
      buyer: "0x456def789abc012345678901234567890abcdef1",
      seller: "0x789abc012345678901234567890abcdef123456",
      amount: "0.08 ETH",
      evidence: [
        { type: "text", content: "Tracking shows package stuck in transit" }
      ],
      arbitratorVotes: 5,
      totalArbitrators: 5,
      outcome: "favor_buyer",
      resolution: "Full refund issued to buyer due to delivery failure"
    },
    {
      id: 3,
      escrowId: 125,
      title: "Quality Issues",
      description: "Received damaged product with scratches and dents.",
      status: "in_progress",
      createdAt: "2024-01-18",
      buyer: "0xabc123def456789012345678901234567890abcd",
      seller: "0xdef456789012345678901234567890abcdef123",
      amount: "0.12 ETH",
      evidence: [
        { type: "text", content: "Multiple scratches on surface" },
        { type: "image", content: "damage1.jpg" },
        { type: "image", content: "damage2.jpg" }
      ],
      arbitratorVotes: 3,
      totalArbitrators: 5,
      outcome: null
    }
  ];

  // Mock reviews data based on real products
  const generateMockReviews = () => {
    const reviewTemplates = [
      { rating: 5, comment: "Excellent product! Exactly as described and fast shipping." },
      { rating: 4, comment: "Good quality, minor issues with packaging but overall satisfied." },
      { rating: 5, comment: "Outstanding seller, will definitely buy again!" },
      { rating: 3, comment: "Average product, met expectations but nothing special." },
      { rating: 4, comment: "Quick delivery and good communication from seller." },
      { rating: 5, comment: "Perfect condition, highly recommend this seller." },
      { rating: 2, comment: "Product had some defects but seller was responsive." },
      { rating: 4, comment: "Great value for money, would recommend to others." }
    ];

    return products.map(product => ({
      ...product,
      reviews: Array.from({ length: Math.floor(Math.random() * 8) + 2 }, (_, i) => {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        return {
          id: i + 1,
          rating: template.rating,
          comment: template.comment,
          reviewer: `0x${Math.random().toString(16).substring(2, 42)}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          verified: Math.random() > 0.3
        };
      })
    }));
  };

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
                      <h1 className="text-2xl font-bold text-base-content">ChainCommerce</h1>
                      <p className="text-sm text-base-content/70">Blockchain Marketplace</p>
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
                      <div className="text-xs text-base-content/60">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-secondary">
                        {marketplaceStats ? Number(marketplaceStats[1]) : "0"}
                      </div>
                      <div className="text-xs text-base-content/60">Sellers</div>
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
                  className="group bg-base-100 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-base-300 hover:border-primary/50 cursor-pointer"
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
                  <div className="relative h-48 bg-gradient-to-br from-base-200 to-base-300">
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
                    <h3 className="font-bold text-lg text-base-content group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-base-content/70 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Seller Info */}
                    <div className="text-xs text-base-content/60">
                      Seller: <Address address={product.seller} size="xs" />
                    </div>
                    
                    {/* Price and Buy Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-base-300">
                      <div className="flex flex-col">
                        <span className="text-xs text-base-content/60 font-medium">Price</span>
                        <span className="text-2xl font-black text-white bg-primary px-2 py-1 rounded-lg">
                          {product.price}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleBuyNow(product)}
                        className="btn btn-primary hover:btn-secondary transition-all group-hover:scale-105 shadow-lg"
                        disabled={!connectedAddress}
                      >
                        {!connectedAddress ? 'Connect Wallet' : 'Buy Now'}
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
      case "escrow-manager":
        return renderEscrowManager();
      case "dispute-resolution":
        return renderDisputeResolution();
      case "analytics":
        return renderAnalyticsDashboard();
      case "reviews":
        return renderProductReviews();
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

  const renderEscrowManager = () => {
    if (!connectedAddress) {
      return (
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-white">Escrow Management</h1>
            <p className="text-lg text-slate-300 mb-8">
              Connect your wallet to manage your escrows and disputes
            </p>
            <div className="card bg-slate-800 shadow-xl max-w-md mx-auto">
              <div className="card-body text-center">
                <h2 className="card-title justify-center text-white">Connect Wallet</h2>
                <p className="text-slate-300">
                  Please connect your wallet to access escrow features
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Escrow Management</h1>
            <p className="text-slate-300">
              Manage your secure transactions with escrow protection
            </p>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary mt-4 md:mt-0"
          >
            Create Test Purchase
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="tabs tabs-lifted mb-6">
          <button
            onClick={() => setEscrowTab('overview')}
            className={`tab tab-lg ${escrowTab === 'overview' ? 'tab-active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setEscrowTab('escrows')}
            className={`tab tab-lg ${escrowTab === 'escrows' ? 'tab-active' : ''}`}
          >
            My Escrows
          </button>
          <button
            onClick={() => setEscrowTab('disputes')}
            className={`tab tab-lg ${escrowTab === 'disputes' ? 'tab-active' : ''}`}
          >
            Disputes
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {escrowTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* How It Works */}
              <div className="card bg-slate-800 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4 text-white">How Escrow Works</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Payment Held in Escrow</h3>
                        <p className="text-sm text-slate-300">
                          Your payment is securely held in a smart contract until delivery is confirmed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Confirm Delivery</h3>
                        <p className="text-sm text-slate-300">
                          Once you receive your product, confirm delivery to release funds to the seller
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Auto-Release Protection</h3>
                        <p className="text-sm text-slate-300">
                          If no issues are reported, funds are automatically released after 7 days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning text-white flex items-center justify-center font-bold text-sm">
                        !
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Dispute Resolution</h3>
                        <p className="text-sm text-slate-300">
                          If there's an issue, create a dispute for AI-powered resolution with arbitrators
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="card bg-slate-800 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4 text-white">Your Escrow Activity</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat">
                      <div className="stat-value text-2xl text-primary">
                        {userEscrows?.length || 0}
                      </div>
                      <div className="stat-title text-slate-300">As Buyer</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value text-2xl text-success">
                        {sellerEscrows?.length || 0}
                      </div>
                      <div className="stat-title text-slate-300">As Seller</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-info/10 rounded-lg">
                    <p className="text-sm text-slate-300">
                      Connected as: <span className="font-mono">{connectedAddress}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Escrow Details */}
              {selectedEscrowId && (
                <div className="lg:col-span-2">
                  <EscrowStatus escrowId={selectedEscrowId} />
                </div>
              )}
            </div>
          )}

          {escrowTab === 'escrows' && (
            <div className="space-y-6">
              {/* Buyer Escrows */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-white">Your Purchases (As Buyer)</h2>
                {userEscrows && userEscrows.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {userEscrows.map((escrowId) => (
                      <div
                        key={escrowId.toString()}
                        className={`cursor-pointer transition-transform hover:scale-[1.02] ${
                          selectedEscrowId === escrowId ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedEscrowId(escrowId)}
                      >
                        <EscrowStatus escrowId={escrowId} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card bg-slate-800 shadow-xl">
                    <div className="card-body text-center">
                      <p className="text-slate-300">No purchases found</p>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="btn btn-primary btn-sm mt-2"
                      >
                        Make a Test Purchase
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Escrows */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-white">Your Sales (As Seller)</h2>
                {sellerEscrows && sellerEscrows.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sellerEscrows.map((escrowId) => (
                      <div
                        key={escrowId.toString()}
                        className={`cursor-pointer transition-transform hover:scale-[1.02] ${
                          selectedEscrowId === escrowId ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedEscrowId(escrowId)}
                      >
                        <EscrowStatus escrowId={escrowId} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card bg-slate-800 shadow-xl">
                    <div className="card-body text-center">
                      <p className="text-slate-300">No sales found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {escrowTab === 'disputes' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Active Disputes</h2>
              {selectedDisputeId ? (
                <DisputeResolution disputeId={selectedDisputeId} />
              ) : (
                <div className="card bg-slate-800 shadow-xl">
                  <div className="card-body text-center">
                    <p className="text-slate-300 mb-4">
                      No active disputes. Disputes will appear here when created from escrow transactions.
                    </p>
                    <div className="text-sm text-slate-400">
                      To create a dispute, go to an active escrow and click "Report Issue"
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedProductForPurchase(null);
          }}
          product={selectedProductForPurchase || mockProduct}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    );
  };

  const renderDisputeResolution = () => {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Dispute Resolution</h1>
          <p className="text-slate-300">
            Track and manage dispute cases with AI-powered resolution
          </p>
        </div>

        {/* Dispute Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-white">1</div>
                  <div className="text-sm text-slate-300">Pending</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <ScaleIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-white">1</div>
                  <div className="text-sm text-slate-300">In Progress</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-white">1</div>
                  <div className="text-sm text-slate-300">Resolved</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-white">85%</div>
                  <div className="text-sm text-slate-300">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-6">
          {mockDisputes.map((dispute) => (
            <div key={dispute.id} className="card bg-slate-800 shadow-xl">
              <div className="card-body">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{dispute.title}</h3>
                      <div className={`badge ${
                        dispute.status === 'pending' ? 'badge-warning' :
                        dispute.status === 'in_progress' ? 'badge-info' :
                        'badge-success'
                      }`}>
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <p className="text-slate-300 mb-3">{dispute.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Escrow ID:</span>
                        <span className="text-white ml-2">#{dispute.escrowId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Amount:</span>
                        <span className="text-white ml-2">{dispute.amount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Created:</span>
                        <span className="text-white ml-2">{dispute.createdAt}</span>
                      </div>
                      {dispute.resolvedAt && (
                        <div>
                          <span className="text-slate-400">Resolved:</span>
                          <span className="text-white ml-2">{dispute.resolvedAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Arbitrator Votes</div>
                      <div className="text-lg font-bold text-white">
                        {dispute.arbitratorVotes}/{dispute.totalArbitrators}
                      </div>
                    </div>
                    <progress 
                      className="progress progress-primary w-24" 
                      value={dispute.arbitratorVotes} 
                      max={dispute.totalArbitrators}
                    ></progress>
                  </div>
                </div>
                
                {/* Evidence Section */}
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <h4 className="font-semibold text-white mb-2">Evidence ({dispute.evidence.length})</h4>
                  <div className="space-y-2">
                    {dispute.evidence.map((evidence, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className={`badge badge-sm ${
                          evidence.type === 'text' ? 'badge-info' : 'badge-success'
                        }`}>
                          {evidence.type}
                        </span>
                        <span className="text-slate-300">{evidence.content}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Section */}
                {dispute.status === 'resolved' && dispute.resolution && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <h4 className="font-semibold text-white mb-2">Resolution</h4>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-300">{dispute.resolution}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-primary btn-sm">
                    View Details
                  </button>
                  {dispute.status === 'pending' && (
                    <button className="btn btn-outline btn-sm">
                      Add Evidence
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalyticsDashboard = () => {
    // Calculate analytics from real contract data
    const totalProductsCount = Number(totalProducts) || products.length;
    const uniqueSellers = new Set(products.map(p => p.seller)).size;
    const averageRating = products.length > 0 
      ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
      : "0.0";
    
    // Category distribution
    const categoryStats = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Analytics Dashboard</h1>
          <p className="text-slate-300">
            Real-time marketplace insights from smart contract data
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <ShoppingBagIcon className="h-10 w-10 text-primary" />
                <div>
                  <div className="text-3xl font-bold text-white">{totalProductsCount}</div>
                  <div className="text-sm text-slate-300">Total Products</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <UserIcon className="h-10 w-10 text-secondary" />
                <div>
                  <div className="text-3xl font-bold text-white">{uniqueSellers}</div>
                  <div className="text-sm text-slate-300">Active Sellers</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <StarIcon className="h-10 w-10 text-yellow-500" />
                <div>
                  <div className="text-3xl font-bold text-white">{averageRating}</div>
                  <div className="text-sm text-slate-300">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-10 w-10 text-green-500" />
                <div>
                  <div className="text-3xl font-bold text-white">{Object.keys(categoryStats).length}</div>
                  <div className="text-sm text-slate-300">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white mb-4">Products by Category</h2>
              <div className="space-y-3">
                {Object.entries(categoryStats).map(([category, count]) => {
                  const productCount = count as number;
                  const percentage = totalProductsCount > 0 ? (productCount / totalProductsCount * 100).toFixed(1) : 0;
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-slate-300">{category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">{productCount}</span>
                        <div className="w-20 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-400 w-10">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Sellers */}
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-white mb-4">Top Sellers</h2>
              <div className="space-y-3">
                {Array.from(new Set(products.map(p => p.seller))).slice(0, 5).map((seller) => {
                  const sellerProducts = products.filter(p => p.seller === seller);
                  const avgRating = sellerProducts.length > 0 
                    ? (sellerProducts.reduce((sum, p) => sum + p.rating, 0) / sellerProducts.length).toFixed(1)
                    : "0.0";
                  return (
                    <div key={seller} className="flex justify-between items-center">
                      <div>
                        <div className="text-slate-300 font-mono text-sm">
                          {`${seller.slice(0, 6)}...${seller.slice(-4)}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-slate-400">{avgRating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{sellerProducts.length}</div>
                        <div className="text-xs text-slate-400">products</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Product List with Analytics */}
        <div className="card bg-slate-800 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-white mb-4">Product Analytics</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr className="text-slate-300">
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 10).map((product) => (
                    <tr key={product.id} className="text-slate-300">
                      <td className="font-semibold text-white">{product.name}</td>
                      <td>
                        <span className="badge badge-primary badge-sm">{product.category}</span>
                      </td>
                      <td className="font-mono">{product.price}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span>{product.rating}</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">
                        {`${product.seller.slice(0, 6)}...${product.seller.slice(-4)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductReviews = () => {
    const reviewsData = generateMockReviews();
    const totalReviews = reviewsData.reduce((sum, product) => sum + product.reviews.length, 0);
    const averageRating = reviewsData.length > 0 
      ? (reviewsData.reduce((sum, product: any) => {
          const productAvg = product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length;
          return sum + productAvg;
        }, 0) / reviewsData.length).toFixed(1)
      : "0.0";

    return (
      <div className="p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Product Reviews</h1>
          <p className="text-slate-300">
            Customer feedback and ratings for marketplace products
          </p>
        </div>

        {/* Review Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <StarIcon className="h-10 w-10 text-yellow-500" />
                <div>
                  <div className="text-3xl font-bold text-white">{totalReviews}</div>
                  <div className="text-sm text-slate-300">Total Reviews</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-10 w-10 text-green-500" />
                <div>
                  <div className="text-3xl font-bold text-white">{averageRating}</div>
                  <div className="text-sm text-slate-300">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-slate-800 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-10 w-10 text-blue-500" />
                <div>
                  <div className="text-3xl font-bold text-white">
                    {Math.round(reviewsData.reduce((sum, p: any) => 
                      sum + p.reviews.filter((r: any) => r.verified).length, 0
                    ) / totalReviews * 100)}%
                  </div>
                  <div className="text-sm text-slate-300">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews by Product */}
        <div className="space-y-6">
          {reviewsData.slice(0, 5).map((product) => (
            <div key={product.id} className="card bg-slate-800 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge badge-primary">{product.category}</span>
                      <span className="text-slate-400">•</span>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className="text-white">{product.rating}</span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">{product.reviews.length} reviews</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-white">{product.price}</span>
                </div>

                {/* Recent Reviews */}
                <div className="space-y-3">
                  {product.reviews.slice(0, 3).map((review: any) => (
                    <div key={review.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-500' : 'text-slate-500'
                                }`} 
                              />
                            ))}
                          </div>
                          {review.verified && (
                            <span className="badge badge-success badge-xs">Verified</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{review.date}</span>
                      </div>
                      <p className="text-slate-300 mb-2">{review.comment}</p>
                      <div className="text-xs text-slate-400 font-mono">
                        {`${review.reviewer.slice(0, 6)}...${review.reviewer.slice(-4)}`}
                      </div>
                    </div>
                  ))}
                </div>

                {product.reviews.length > 3 && (
                  <button className="btn btn-outline btn-sm mt-4">
                    View All {product.reviews.length} Reviews
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-300 pt-20 sm:pt-24">
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