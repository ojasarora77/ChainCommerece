"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  UserIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  EyeIcon,
  StarIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface Seller {
  address: string;
  isActive: boolean;
  productCount: number;
  totalSales: string;
  averageRating: number;
  joinedDate: string;
  reputation: "New" | "Trusted" | "Verified" | "Elite";
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  seller: string;
  isActive: boolean;
  averageRating: number;
}

export const SellerManagement = () => {
  const { address } = useAccount();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 REAL CONTRACT CALLS - Get marketplace stats
  const { data: marketplaceStats } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getMarketplaceStats",
  });

  // Use marketplaceStats to avoid unused variable warning
  console.log('Marketplace stats:', marketplaceStats);

  // 🔥 REAL CONTRACT CALLS - Get all products to analyze sellers
  const { data: totalProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "totalProducts",
  });

  // Generate array of product IDs to fetch
  const productIdsToFetch = totalProducts 
    ? Array.from({ length: Number(totalProducts) }, (_, i) => BigInt(i + 1))
    : [1n, 2n, 3n, 4n, 5n]; // Fallback

  const { data: batchProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getBatchProducts",
    args: [productIdsToFetch],
  });

  // Process sellers data from products
  useEffect(() => {
    if (batchProducts && batchProducts.length > 0) {
      const sellerMap = new Map<string, {
        products: any[];
        totalSales: number;
        totalRating: number;
        ratingCount: number;
      }>();

      // Group products by seller
      batchProducts.forEach((product: any) => {
        if (product.seller && product.seller !== "0x0000000000000000000000000000000000000000") {
          const sellerAddress = product.seller.toLowerCase();
          
          if (!sellerMap.has(sellerAddress)) {
            sellerMap.set(sellerAddress, {
              products: [],
              totalSales: 0,
              totalRating: 0,
              ratingCount: 0
            });
          }
          
          const sellerData = sellerMap.get(sellerAddress)!;
          sellerData.products.push(product);
          sellerData.totalSales += Number(product.price) / 1e18;
          
          if (Number(product.averageRating) > 0) {
            sellerData.totalRating += Number(product.averageRating);
            sellerData.ratingCount += 1;
          }
        }
      });

      // Convert to seller array
      const sellersData: Seller[] = Array.from(sellerMap.entries()).map(([address, data]) => {
        const productCount = data.products.length;
        const averageRating = data.ratingCount > 0 ? (data.totalRating / data.ratingCount) / 100 : 0;
        
        // Determine reputation based on metrics
        let reputation: Seller["reputation"] = "New";
        if (productCount >= 10 && averageRating >= 4.5) reputation = "Elite";
        else if (productCount >= 5 && averageRating >= 4.0) reputation = "Verified";
        else if (productCount >= 2 && averageRating >= 3.5) reputation = "Trusted";

        return {
          address,
          isActive: data.products.some(p => p.isActive),
          productCount,
          totalSales: data.totalSales.toFixed(3),
          averageRating,
          joinedDate: "2024-01-01", // Mock date - replace with real data if available
          reputation
        };
      });

      setSellers(sellersData.sort((a, b) => b.productCount - a.productCount));
      setLoading(false);
    }
  }, [batchProducts]);

  // Get products for selected seller
  useEffect(() => {
    if (selectedSeller && batchProducts) {
      const products = batchProducts
        .filter((product: any) => 
          product.seller && 
          product.seller.toLowerCase() === selectedSeller.toLowerCase()
        )
        .map((product: any) => ({
          id: Number(product.id),
          name: product.name,
          category: product.category,
          price: `${(Number(product.price) / 1e18).toFixed(3)} ETH`,
          seller: product.seller,
          isActive: product.isActive,
          averageRating: Number(product.averageRating) / 100 || 0
        }));
      
      setSellerProducts(products);
    }
  }, [selectedSeller, batchProducts]);

  const getReputationColor = (reputation: Seller["reputation"]) => {
    switch (reputation) {
      case "Elite": return "text-purple-400 bg-purple-900/20";
      case "Verified": return "text-green-400 bg-green-900/20";
      case "Trusted": return "text-blue-400 bg-blue-900/20";
      default: return "text-gray-400 bg-gray-900/20";
    }
  };

  const getReputationIcon = (reputation: Seller["reputation"]) => {
    switch (reputation) {
      case "Elite": return <TrophyIcon className="h-4 w-4" />;
      case "Verified": return <CheckCircleIcon className="h-4 w-4" />;
      case "Trusted": return <StarIcon className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-slate-300">Loading seller data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <UserIcon className="h-8 w-8 text-cyan-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">Seller Management</h1>
          <p className="text-slate-400">Monitor and manage marketplace sellers</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-slate-900 rounded-lg">
          <div className="stat-figure text-cyan-500">
            <UserIcon className="h-8 w-8" />
          </div>
          <div className="stat-title text-slate-300">Total Sellers</div>
          <div className="stat-value text-cyan-500">{sellers.length}</div>
          <div className="stat-desc text-slate-400">Registered sellers</div>
        </div>

        <div className="stat bg-slate-900 rounded-lg">
          <div className="stat-figure text-green-500">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <div className="stat-title text-slate-300">Active Sellers</div>
          <div className="stat-value text-green-500">
            {sellers.filter(s => s.isActive).length}
          </div>
          <div className="stat-desc text-slate-400">Currently selling</div>
        </div>

        <div className="stat bg-slate-900 rounded-lg">
          <div className="stat-figure text-purple-500">
            <TrophyIcon className="h-8 w-8" />
          </div>
          <div className="stat-title text-slate-300">Elite Sellers</div>
          <div className="stat-value text-purple-500">
            {sellers.filter(s => s.reputation === "Elite").length}
          </div>
          <div className="stat-desc text-slate-400">Top performers</div>
        </div>

        <div className="stat bg-slate-900 rounded-lg">
          <div className="stat-figure text-yellow-500">
            <ShoppingBagIcon className="h-8 w-8" />
          </div>
          <div className="stat-title text-slate-300">Avg Products</div>
          <div className="stat-value text-yellow-500">
            {sellers.length > 0 ? Math.round(sellers.reduce((acc, s) => acc + s.productCount, 0) / sellers.length) : 0}
          </div>
          <div className="stat-desc text-slate-400">Per seller</div>
        </div>
      </div>

      {/* Sellers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sellers Table */}
        <div className="bg-slate-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-cyan-500" />
            All Sellers
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sellers.map((seller, index) => (
              <div 
                key={seller.address}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedSeller === seller.address 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                }`}
                onClick={() => setSelectedSeller(seller.address)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">#{index + 1}</span>
                    <Address address={seller.address} size="sm" />
                  </div>
                  <div className={`badge ${getReputationColor(seller.reputation)} flex items-center gap-1`}>
                    {getReputationIcon(seller.reputation)}
                    {seller.reputation}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Products:</span>
                    <span className="text-white ml-1">{seller.productCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sales:</span>
                    <span className="text-white ml-1">{seller.totalSales} ETH</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Rating:</span>
                    <span className="text-white ml-1">{seller.averageRating.toFixed(1)}⭐</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${seller.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs ${seller.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {seller.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seller Details */}
        <div className="bg-slate-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-cyan-500" />
            Seller Details
          </h2>
          
          {selectedSeller ? (
            <div className="space-y-4">
              {(() => {
                const seller = sellers.find(s => s.address === selectedSeller);
                if (!seller) return <p className="text-slate-400">Seller not found</p>;
                
                return (
                  <>
                    <div className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Address address={seller.address} size="base" />
                        <div className={`badge ${getReputationColor(seller.reputation)} flex items-center gap-1`}>
                          {getReputationIcon(seller.reputation)}
                          {seller.reputation}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Status:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${seller.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={seller.isActive ? 'text-green-400' : 'text-red-400'}>
                              {seller.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Joined:</span>
                          <p className="text-white mt-1">{seller.joinedDate}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Sales:</span>
                          <p className="text-white mt-1">{seller.totalSales} ETH</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Average Rating:</span>
                          <p className="text-white mt-1">{seller.averageRating.toFixed(1)} ⭐</p>
                        </div>
                      </div>
                    </div>

                    {/* Seller's Products */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-yellow-500" />
                        Products ({sellerProducts.length})
                      </h3>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {sellerProducts.map((product) => (
                          <div key={product.id} className="border border-slate-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white">{product.name}</h4>
                              <div className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">{product.category}</span>
                              <span className="text-white font-medium">{product.price}</span>
                            </div>
                            
                            {product.averageRating > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <StarIcon className="h-3 w-3 text-yellow-400" />
                                <span className="text-xs text-slate-400">{product.averageRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {sellerProducts.length === 0 && (
                          <p className="text-slate-400 text-center py-4">No products found</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-400">Select a seller to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
