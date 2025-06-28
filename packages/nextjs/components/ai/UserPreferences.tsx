"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  CogIcon,
  HeartIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  TagIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { recommendationEngine } from '~~/services/ai/RecommendationEngine';

interface UserPreferencesProps {
  className?: string;
  onPreferencesUpdate?: (preferences: any) => void;
}

interface Preferences {
  categories: string[];
  priceRange: { min: number; max: number };
  sustainabilityMin: number;
  brands: string[];
  features: string[];
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({ 
  className = '', 
  onPreferencesUpdate 
}) => {
  const { address } = useAccount();
  const [preferences, setPreferences] = useState<Preferences>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    sustainabilityMin: 80,
    brands: [],
    features: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const availableCategories = [
    'Electronics', 'Clothing', 'Accessories', 'Home & Garden', 
    'Sports', 'Books', 'Beauty', 'Automotive'
  ];

  const availableFeatures = [
    'solar charging', 'recycled materials', 'organic', 'waterproof',
    'ergonomic', 'portable', 'fast charge', 'eco-friendly',
    'durable', 'breathable', 'adjustable', 'natural dyes'
  ];

  useEffect(() => {
    loadUserPreferences();
  }, [address]);

  const loadUserPreferences = async () => {
    if (!address) return;

    try {
      // In a real app, you'd load from your backend
      // For now, we'll use default preferences
      console.log('Loading preferences for user:', address);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setPreferences(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    setPreferences(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
  };

  const handleSustainabilityChange = (value: number) => {
    setPreferences(prev => ({
      ...prev,
      sustainabilityMin: value
    }));
  };

  const savePreferences = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      await recommendationEngine.updateUserProfile(address, 'preference_update', preferences);
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      
      if (onPreferencesUpdate) {
        onPreferencesUpdate(preferences);
      }
      
      console.log('✅ Preferences saved successfully');
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className={`text-center text-slate-400 p-8 ${className}`}>
        <CogIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Connect your wallet to customize your shopping preferences</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CogIcon className="h-6 w-6 text-purple-400" />
            Shopping Preferences
          </h3>
          <p className="text-slate-400">Customize your AI shopping experience</p>
        </div>
        <button
          onClick={savePreferences}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isSaved
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {isSaved ? (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              Saved!
            </>
          ) : isLoading ? (
            'Saving...'
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-red-400" />
          Favorite Categories
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableCategories.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                preferences.categories.includes(category)
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
          Price Range
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Minimum Price</label>
            <input
              type="number"
              value={preferences.priceRange.min}
              onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Maximum Price</label>
            <input
              type="number"
              value={preferences.priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              min="0"
              step="1"
            />
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-slate-400">
            Budget: ${preferences.priceRange.min} - ${preferences.priceRange.max}
          </span>
        </div>
      </div>

      {/* Sustainability */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-green-400" />
          Sustainability Preference
        </h4>
        <div>
          <label className="block text-slate-400 text-sm mb-2">
            Minimum Sustainability Score: {preferences.sustainabilityMin}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.sustainabilityMin}
            onChange={(e) => handleSustainabilityChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-700 rounded-lg">
          <p className="text-sm text-slate-300">
            {preferences.sustainabilityMin >= 90 ? "🌟 Eco-Champion: Only the most sustainable products" :
             preferences.sustainabilityMin >= 70 ? "🌱 Eco-Conscious: Prioritizing sustainable options" :
             preferences.sustainabilityMin >= 50 ? "♻️ Eco-Aware: Some focus on sustainability" :
             "🌍 Getting Started: Open to all sustainability levels"}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-blue-400" />
          Preferred Features
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableFeatures.map(feature => (
            <button
              key={feature}
              onClick={() => handleFeatureToggle(feature)}
              className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                preferences.features.includes(feature)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-700/50">
        <h4 className="text-lg font-semibold text-white mb-3">Your Shopping Profile</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Favorite Categories:</span>
            <p className="text-white">
              {preferences.categories.length > 0 
                ? preferences.categories.join(', ') 
                : 'All categories'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Budget Range:</span>
            <p className="text-white">${preferences.priceRange.min} - ${preferences.priceRange.max}</p>
          </div>
          <div>
            <span className="text-slate-400">Sustainability Focus:</span>
            <p className="text-white">{preferences.sustainabilityMin}%+ minimum</p>
          </div>
          <div>
            <span className="text-slate-400">Preferred Features:</span>
            <p className="text-white">
              {preferences.features.length > 0 
                ? `${preferences.features.length} selected` 
                : 'No specific preferences'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
