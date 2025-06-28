"use client";

import { useState } from "react";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import {
  PlusIcon,
  CogIcon,
  UserGroupIcon,
  TagIcon
} from "@heroicons/react/24/outline";

const AdminPage = () => {
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

      console.log("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory || !address) return;

    try {
      await addCategory({
        functionName: "addCategory",
        args: [newCategory],
      });

      setNewCategory("");
      console.log("Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleRegisterSeller = async () => {
    if (!address) return;

    try {
      await registerSeller({
        functionName: "registerSeller",
        args: ["My Store", "A great marketplace seller"],
      });

      console.log("Seller registered successfully!");
    } catch (error) {
      console.error("Error registering seller:", error);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="alert alert-warning">
          <span>Please connect your wallet to access admin functions</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          <CogIcon className="h-8 w-8 inline mr-2" />
          Marketplace Admin
        </h1>

        {/* Stats Overview */}
        <div className="stats shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Products</div>
            <div className="stat-value text-primary">
              {marketplaceStats ? Number(marketplaceStats[0]) : "0"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Sellers</div>
            <div className="stat-value text-secondary">
              {marketplaceStats ? Number(marketplaceStats[1]) : "0"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Active Products</div>
            <div className="stat-value text-accent">
              {marketplaceStats ? Number(marketplaceStats[2]) : "0"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <PlusIcon className="h-6 w-6" />
                Add New Product
              </h2>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="form-control">
                  <label className="label">Product Name</label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={productData.name}
                    onChange={(e) => setProductData({...productData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">Description</label>
                  <textarea
                    className="textarea textarea-bordered"
                    value={productData.description}
                    onChange={(e) => setProductData({...productData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">Category</label>
                    <select
                      className="select select-bordered"
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
                    <label className="label">Price (ETH)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="input input-bordered"
                      value={productData.price}
                      onChange={(e) => setProductData({...productData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">Image Hash (Optional)</label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="QmHash..."
                      value={productData.imageHash}
                      onChange={(e) => setProductData({...productData, imageHash: e.target.value})}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">Metadata Hash (Optional)</label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="QmMeta..."
                      value={productData.metadataHash}
                      onChange={(e) => setProductData({...productData, metadataHash: e.target.value})}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Add Product
                </button>
              </form>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="space-y-6">
            {/* Add Category */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <TagIcon className="h-6 w-6" />
                  Add New Category
                </h2>
                
                <div className="form-control">
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                
                <button 
                  className="btn btn-secondary"
                  onClick={handleAddCategory}
                  disabled={!newCategory}
                >
                  Add Category
                </button>

                {/* Current Categories */}
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Current Categories:</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories ? categories.map(cat => (
                      <div key={cat} className="badge badge-outline">{cat}</div>
                    )) : (
                      <span className="text-sm opacity-70">Loading...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Register as Seller */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <UserGroupIcon className="h-6 w-6" />
                  Register as Seller
                </h2>
                
                <p className="text-sm opacity-70 mb-4">
                  Register yourself as a verified seller in the marketplace
                </p>
                
                <button 
                  className="btn btn-accent"
                  onClick={handleRegisterSeller}
                >
                  Register as Seller
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
