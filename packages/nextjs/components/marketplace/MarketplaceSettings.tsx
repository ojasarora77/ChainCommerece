"use client";

import { useState } from "react";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
// ConnectButton import removed as it's not used in this component
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { 
  PlusIcon, 
  CogIcon, 
  UserGroupIcon,
  TagIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

export const MarketplaceSettings = () => {
  const { address } = useAccount();
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    category: "Electronics",
    price: "",
    imageHash: "",
    metadataHash: ""
  });
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Show notification for 5 seconds
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Contract interactions
  const { writeContractAsync: listProduct } = useScaffoldWriteContract({
    contractName: "ProductRegistry",
  });

  const { writeContractAsync: addCategory } = useScaffoldWriteContract({
    contractName: "ProductRegistry",
  });

  const { writeContractAsync: registerSeller } = useScaffoldWriteContract({
    contractName: "ProductRegistry",
  });

  // Read contract data
  const { data: categories } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getCategories",
  });

  const { data: marketplaceStats } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getMarketplaceStats",
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsLoading(true);
    try {
      await listProduct({
        functionName: "listProduct",
        args: [
          productData.name,
          productData.description,
          productData.category,
          parseEther(productData.price),
          productData.imageHash || `QmHash${Date.now()}`,
          productData.metadataHash || `QmMeta${Date.now()}`
        ],
      });

      // Reset form
      setProductData({
        name: "",
        description: "",
        category: "Electronics",
        price: "",
        imageHash: "",
        metadataHash: ""
      });

      showNotification('success', 'Product added successfully! 🎉');
    } catch (error) {
      console.error("Error adding product:", error);
      showNotification('error', 'Failed to add product. Please try again.');
    }
    setIsLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory || !address) return;

    setIsLoading(true);
    try {
      await addCategory({
        functionName: "addCategory",
        args: [newCategory],
      });

      setNewCategory("");
      showNotification('success', 'Category added successfully! ✨');
    } catch (error) {
      console.error("Error adding category:", error);
      showNotification('error', 'Failed to add category. Please try again.');
    }
    setIsLoading(false);
  };

  const handleRegisterSeller = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      await registerSeller({
        functionName: "registerSeller",
        args: ["My Store", "A great marketplace seller"],
      });

      showNotification('success', 'Successfully registered as seller! 🎊');
    } catch (error) {
      console.error("Error registering seller:", error);
      showNotification('error', 'Failed to register as seller. Please try again.');
    }
    setIsLoading(false);
  };

  if (!address) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-4">
        <div className="card bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/30 shadow-xl w-full max-w-md mx-auto">
          <div className="card-body text-center p-6 sm:p-8">
            <ExclamationTriangleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-warning mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-warning mb-2">Wallet Connection Required</h3>
            <p className="text-sm sm:text-base opacity-80 mb-6 leading-relaxed">
              Please connect your wallet to access marketplace settings and admin functions.
            </p>
            <div className="card-actions justify-center">
              <div className="text-center w-full">
                <p className="text-xs sm:text-sm text-base-content/60 mb-3">
                  Connect your wallet to continue
                </p>
                <div className="flex justify-center">
                  <RainbowKitCustomConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`alert ${
          notification.type === 'success' ? 'alert-success' : 
          notification.type === 'error' ? 'alert-error' : 'alert-info'
        } shadow-lg`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <CheckCircleIcon className="h-6 w-6" />}
            {notification.type === 'error' && <ExclamationTriangleIcon className="h-6 w-6" />}
            {notification.type === 'info' && <InformationCircleIcon className="h-6 w-6" />}
            <span className="text-sm sm:text-base font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl">
            <CogIcon className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
          Marketplace Settings
        </h1>
        <p className="text-base sm:text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed px-4">
          Manage your marketplace presence, add new products, and configure your seller account
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="stats shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="stat">
            <div className="stat-figure text-primary">
              <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="stat-title text-sm sm:text-base font-medium">Total Products</div>
            <div className="stat-value text-primary text-2xl sm:text-3xl">
              {marketplaceStats ? Number(marketplaceStats[0]) : "0"}
            </div>
            <div className="stat-desc text-primary/70 text-xs sm:text-sm">Products listed</div>
          </div>
        </div>
        
        <div className="stats shadow-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="stat-title text-sm sm:text-base font-medium">Total Sellers</div>
            <div className="stat-value text-secondary text-2xl sm:text-3xl">
              {marketplaceStats ? Number(marketplaceStats[1]) : "0"}
            </div>
            <div className="stat-desc text-secondary/70 text-xs sm:text-sm">Registered sellers</div>
          </div>
        </div>
        
        <div className="stats shadow-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 sm:col-span-2 lg:col-span-1">
          <div className="stat">
            <div className="stat-figure text-accent">
              <TagIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="stat-title text-sm sm:text-base font-medium">Active Products</div>
            <div className="stat-value text-accent text-2xl sm:text-3xl">
              {marketplaceStats ? Number(marketplaceStats[2]) : "0"}
            </div>
            <div className="stat-desc text-accent/70 text-xs sm:text-sm">Currently active</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Add Product Form - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="card-body p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-xl w-fit">
                  <PlusIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Add New Product</h2>
                  <p className="text-sm sm:text-base text-base-content/60">List a new product in the marketplace</p>
                </div>
              </div>
              
              <form onSubmit={handleAddProduct} className="space-y-4 sm:space-y-6">
                {/* Product Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold">Product Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered text-sm sm:text-base h-12 sm:h-14"
                    placeholder="Enter your product name..."
                    value={productData.name}
                    onChange={(e) => setProductData({...productData, name: e.target.value})}
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold">Description *</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered text-sm sm:text-base min-h-[100px] sm:min-h-[120px] leading-relaxed"
                    placeholder="Describe your product in detail..."
                    value={productData.description}
                    onChange={(e) => setProductData({...productData, description: e.target.value})}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-xs sm:text-sm text-base-content/60">
                      Tip: Include key features and benefits
                    </span>
                  </label>
                </div>

                {/* Category and Price Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-semibold">Category *</span>
                    </label>
                    <select
                      className="select select-bordered text-sm sm:text-base h-12 sm:h-14"
                      value={productData.category}
                      onChange={(e) => setProductData({...productData, category: e.target.value})}
                    >
                      {categories ? categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      )) : (
                        <>
                          <option value="Electronics">Electronics</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Digital">Digital</option>
                          <option value="Sports">Sports</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-semibold">Price (ETH) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        className="input input-bordered text-sm sm:text-base h-12 sm:h-14 pr-12 sm:pr-16"
                        placeholder="0.001"
                        value={productData.price}
                        onChange={(e) => setProductData({...productData, price: e.target.value})}
                        required
                      />
                      <span className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-base-content/60 font-medium text-sm sm:text-base">
                        ETH
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="divider">
                  <span className="text-sm sm:text-base text-base-content/60">Optional Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-semibold">Image Hash</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered text-sm sm:text-base h-12"
                      placeholder="QmHash... (IPFS hash)"
                      value={productData.imageHash}
                      onChange={(e) => setProductData({...productData, imageHash: e.target.value})}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-semibold">Metadata Hash</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered text-sm sm:text-base h-12"
                      placeholder="QmMeta... (IPFS hash)"
                      value={productData.metadataHash}
                      onChange={(e) => setProductData({...productData, metadataHash: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2 sm:pt-4">
                  <button 
                    type="submit" 
                    className={`btn btn-primary w-full text-sm sm:text-base h-12 sm:h-14 ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm sm:loading-md"></span>
                        <span className="hidden sm:inline">Adding Product...</span>
                        <span className="sm:hidden">Adding...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Add Product to Marketplace</span>
                        <span className="sm:hidden">Add Product</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Admin Actions Sidebar */}
        <div className="space-y-6">
          {/* Add Category */}
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <TagIcon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Add Category</h3>
                  <p className="text-sm text-base-content/60">Create new product category</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="form-control">
                  <input
                    type="text"
                    className="input input-bordered text-base h-12"
                    placeholder="Enter category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                
                <button 
                  className={`btn btn-secondary w-full text-base h-12 ${isLoading ? 'loading' : ''}`}
                  onClick={handleAddCategory}
                  disabled={!newCategory || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <TagIcon className="h-4 w-4" />
                      Add Category
                    </>
                  )}
                </button>

                {/* Current Categories */}
                <div className="pt-2">
                  <h4 className="font-semibold text-sm mb-3 text-base-content/80">Current Categories:</h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {categories ? categories.map(cat => (
                      <div key={cat} className="badge badge-outline badge-lg">{cat}</div>
                    )) : (
                      <div className="text-sm text-base-content/60">Loading categories...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Register as Seller */}
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Seller Registration</h3>
                  <p className="text-sm text-base-content/60">Become a verified seller</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-base-200 p-4 rounded-lg">
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    Register yourself as a verified seller to gain access to advanced marketplace features and build trust with customers.
                  </p>
                </div>
                
                <button 
                  className={`btn btn-accent w-full text-base h-12 ${isLoading ? 'loading' : ''}`}
                  onClick={handleRegisterSeller}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserGroupIcon className="h-4 w-4" />
                      Register as Seller
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20 shadow-xl">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-info/10 rounded-lg">
                  <InformationCircleIcon className="h-6 w-6 text-info" />
                </div>
                <h3 className="text-lg font-bold text-info">Quick Tips</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-base-content/80">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Use clear, descriptive product names</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Include detailed product descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Set competitive pricing in ETH</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></span>
                  <span>Upload images to IPFS for better visibility</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
