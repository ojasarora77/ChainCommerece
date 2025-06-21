// packages/nextjs/app/preferences/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { 
  SparklesIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const categories = [
  { id: "Electronics", label: "Electronics", emoji: "📱" },
  { id: "Clothing", label: "Clothing", emoji: "👕" },
  { id: "Books", label: "Books", emoji: "📚" },
  { id: "Home & Garden", label: "Home & Garden", emoji: "🏡" },
  { id: "Sports", label: "Sports", emoji: "⚽" },
  { id: "Beauty", label: "Beauty", emoji: "💄" },
  { id: "Automotive", label: "Automotive", emoji: "🚗" },
  { id: "Digital", label: "Digital", emoji: "💾" }
];

const sustainabilityLevels = [
  { id: "high", label: "High Priority", description: "I only buy eco-friendly products", color: "badge-success" },
  { id: "medium", label: "Medium Priority", description: "I prefer sustainable options when available", color: "badge-warning" },
  { id: "low", label: "Low Priority", description: "Sustainability is nice to have", color: "badge-info" },
  { id: "none", label: "Not Important", description: "I don't consider sustainability", color: "badge-neutral" }
];

const Preferences: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: "0", max: "1" });
  const [sustainability, setSustainability] = useState("medium");
  const [brand, setBrand] = useState("");
  const [customPrefs, setCustomPrefs] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Read current user preferences
  const { data: userPreferences, refetch: refetchPreferences } = useScaffoldReadContract({
    contractName: "AIRecommendations",
    functionName: "userPreferences",
    args: [connectedAddress],
  });

  // Set user preferences
  const { writeContractAsync: setUserPreferences } = useScaffoldWriteContract({
    contractName: "AIRecommendations",
  });

  // Load existing preferences
  useEffect(() => {
    if (userPreferences && userPreferences[6]) { // exists field
      setSelectedCategories(userPreferences[0] ? userPreferences[0].split(",") : []);
      const range = userPreferences[1] ? userPreferences[1].split(",") : ["0", "1000000000000000000"];
      setPriceRange({ 
        min: (parseFloat(range[0]) / 1e18).toString(), 
        max: (parseFloat(range[1]) / 1e18).toString() 
      });
      setSustainability(userPreferences[2] || "medium");
      setBrand(userPreferences[3] || "");
      setCustomPrefs(userPreferences[4] || "");
    }
  }, [userPreferences]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSavePreferences = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      await setUserPreferences({
        functionName: "setUserPreferences",
        args: [
          selectedCategories.join(","),
          `${(parseFloat(priceRange.min) * 1e18).toString()},${(parseFloat(priceRange.max) * 1e18).toString()}`,
          sustainability,
          brand,
          customPrefs
        ],
      });

      setIsSaved(true);
      notification.success("🎉 AI Preferences saved successfully!");
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
      
      await refetchPreferences();
    } catch (error) {
      console.error("Error saving preferences:", error);
      notification.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <UserCircleIcon className="h-16 w-16 mx-auto text-primary" />
            <h2 className="card-title justify-center">Connect Your Wallet</h2>
            <p>Please connect your wallet to set up your AI preferences</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Preferences</h1>
            <Cog6ToothIcon className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Configure your preferences to get personalized AI-powered product recommendations 
            powered by Chainlink Functions
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Categories Section */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                <ShoppingBagIcon className="h-6 w-6" />
                Preferred Categories
              </h2>
              <p className="opacity-70 mb-4">Select the product categories you're most interested in</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                      selectedCategories.includes(category.id)
                        ? 'border-primary bg-primary/20'
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{category.emoji}</div>
                      <div className="font-medium">{category.label}</div>
                      {selectedCategories.includes(category.id) && (
                        <CheckCircleIcon className="h-5 w-5 text-primary mx-auto mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Price Range Section */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Price Range (ETH)</h2>
              <p className="opacity-70 mb-4">Set your preferred spending range</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Minimum Price</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="input input-bordered"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Maximum Price</span>
                  </label>
                  <input
                    type="number"
                    placeholder="1.00"
                    className="input input-bordered"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability Section */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                <HeartIcon className="h-6 w-6" />
                Sustainability Priority
              </h2>
              <p className="opacity-70 mb-4">How important is sustainability to you?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sustainabilityLevels.map((level) => (
                  <div
                    key={level.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      sustainability === level.id
                        ? 'border-primary bg-primary/20'
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => setSustainability(level.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="sustainability"
                        className="radio radio-primary"
                        checked={sustainability === level.id}
                        onChange={() => setSustainability(level.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{level.label}</span>
                          <div className={`badge ${level.color}`}>
                            {level.id}
                          </div>
                        </div>
                        <p className="text-sm opacity-70">{level.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Brand Preferences */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Brand Preferences</h2>
              <p className="opacity-70 mb-4">Any specific brands you prefer? (Optional)</p>
              
              <input
                type="text"
                placeholder="e.g., Apple, Nike, Tesla..."
                className="input input-bordered w-full"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          {/* Custom Preferences */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Additional Preferences</h2>
              <p className="opacity-70 mb-4">Tell our AI anything else about your shopping preferences</p>
              
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="e.g., I prefer products with fast shipping, I like innovative tech gadgets, I value quality over price..."
                value={customPrefs}
                onChange={(e) => setCustomPrefs(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Save Button */}
          <div className="text-center">
            <button
              className={`btn btn-primary btn-lg ${isLoading ? 'loading' : ''} ${isSaved ? 'btn-success' : ''}`}
              onClick={handleSavePreferences}
              disabled={isLoading}
            >
              {isLoading ? (
                'Saving to Blockchain...'
              ) : isSaved ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Preferences Saved!
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Save AI Preferences
                </>
              )}
            </button>
            
            {isSaved && (
              <div className="mt-4 alert alert-success max-w-md mx-auto">
                <SparklesIcon className="h-5 w-5" />
                <span>Your AI preferences are now live on the blockchain!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;