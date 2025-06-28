// AI-powered recommendation engine for personalized shopping experiences
// Uses collaborative filtering, content-based filtering, and user behavior analysis

import { cacheService } from '../cache/CacheService';

interface Product {
  id: number;
  name: string;
  category: string;
  priceUSD: number;
  sustainabilityScore: number;
  averageRating: number;
  description: string;
  tags?: string[];
  features?: string[];
}

interface UserProfile {
  address: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    sustainabilityMin: number;
    brands: string[];
    features: string[];
  };
  orderHistory: Array<{
    productId: number;
    quantity: number;
    rating?: number;
    timestamp: string;
  }>;
  searchHistory: Array<{
    query: string;
    timestamp: string;
    clicked?: number[];
  }>;
  behaviorScore: {
    sustainability: number;
    priceConsciousness: number;
    brandLoyalty: number;
    impulseBuying: number;
  };
}

interface RecommendationResult {
  product: Product;
  score: number;
  reasons: string[];
  type: 'collaborative' | 'content' | 'trending' | 'sustainable' | 'personalized';
}

class RecommendationEngine {
  private static instance: RecommendationEngine;
  private products: Product[] = [];
  private userProfiles: Map<string, UserProfile> = new Map();

  private constructor() {
    this.initializeProducts();
  }

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  private initializeProducts(): void {
    // Initialize with sample products (in production, this would come from your database)
    this.products = [
      {
        id: 1,
        name: "SustainTech Smartwatch",
        category: "Electronics",
        priceUSD: 149,
        sustainabilityScore: 92,
        averageRating: 4.8,
        description: "Eco-friendly smartwatch with solar charging and recycled aluminum casing",
        tags: ["solar", "recycled", "fitness", "health"],
        features: ["heart rate", "GPS", "waterproof", "solar charging"]
      },
      {
        id: 2,
        name: "Bamboo Laptop Stand",
        category: "Electronics",
        priceUSD: 2.00,
        sustainabilityScore: 95,
        averageRating: 4.9,
        description: "100% sustainable bamboo laptop stand with ergonomic design",
        tags: ["bamboo", "ergonomic", "workspace", "sustainable"],
        features: ["adjustable", "portable", "ergonomic", "eco-friendly"]
      },
      {
        id: 3,
        name: "Organic Hemp T-Shirt",
        category: "Clothing",
        priceUSD: 1.20,
        sustainabilityScore: 88,
        averageRating: 4.6,
        description: "100% organic hemp t-shirt with natural dyes",
        tags: ["organic", "hemp", "natural", "comfortable"],
        features: ["breathable", "durable", "organic", "natural dyes"]
      },
      {
        id: 4,
        name: "Solar Power Bank",
        category: "Electronics",
        priceUSD: 45,
        sustainabilityScore: 89,
        averageRating: 4.7,
        description: "Portable solar power bank with fast charging capabilities",
        tags: ["solar", "portable", "charging", "outdoor"],
        features: ["solar charging", "fast charge", "waterproof", "LED flashlight"]
      },
      {
        id: 5,
        name: "Recycled Plastic Backpack",
        category: "Accessories",
        priceUSD: 75,
        sustainabilityScore: 85,
        averageRating: 4.5,
        description: "Durable backpack made from recycled ocean plastic",
        tags: ["recycled", "ocean plastic", "durable", "travel"],
        features: ["water resistant", "laptop compartment", "ergonomic", "recycled materials"]
      }
    ];
  }

  // Get personalized recommendations for a user
  public async getRecommendations(
    userAddress: string, 
    limit: number = 5,
    excludeOwned: boolean = true
  ): Promise<RecommendationResult[]> {
    
    // Check cache first
    const cacheKey = `recommendations:${userAddress}:${limit}:${excludeOwned}`;
    const cached = cacheService.get<RecommendationResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const userProfile = await this.getUserProfile(userAddress);
    const recommendations: RecommendationResult[] = [];

    // 1. Content-based recommendations (40% weight)
    const contentBased = this.getContentBasedRecommendations(userProfile, limit * 2);
    recommendations.push(...contentBased.map(r => ({ ...r, score: r.score * 0.4 })));

    // 2. Collaborative filtering (30% weight)
    const collaborative = this.getCollaborativeRecommendations(userProfile, limit * 2);
    recommendations.push(...collaborative.map(r => ({ ...r, score: r.score * 0.3 })));

    // 3. Trending/Popular items (20% weight)
    const trending = this.getTrendingRecommendations(limit);
    recommendations.push(...trending.map(r => ({ ...r, score: r.score * 0.2 })));

    // 4. Sustainability-focused (10% weight)
    const sustainable = this.getSustainabilityRecommendations(userProfile, limit);
    recommendations.push(...sustainable.map(r => ({ ...r, score: r.score * 0.1 })));

    // Combine and deduplicate
    const combined = this.combineRecommendations(recommendations);

    // Filter out owned products if requested
    let filtered = combined;
    if (excludeOwned && userProfile.orderHistory.length > 0) {
      const ownedProductIds = new Set(userProfile.orderHistory.map(order => order.productId));
      filtered = combined.filter(rec => !ownedProductIds.has(rec.product.id));
    }

    // Sort by score and limit
    const final = filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache the results
    cacheService.set(cacheKey, final, 10 * 60 * 1000); // 10 minutes

    return final;
  }

  // Content-based recommendations based on user preferences and history
  private getContentBasedRecommendations(userProfile: UserProfile, limit: number): RecommendationResult[] {
    const recommendations: RecommendationResult[] = [];

    for (const product of this.products) {
      let score = 0;
      const reasons: string[] = [];

      // Category preference
      if (userProfile.preferences.categories.includes(product.category)) {
        score += 30;
        reasons.push(`Matches your interest in ${product.category}`);
      }

      // Price range preference
      const { min, max } = userProfile.preferences.priceRange;
      if (product.priceUSD >= min && product.priceUSD <= max) {
        score += 20;
        reasons.push('Within your preferred price range');
      }

      // Sustainability preference
      if (product.sustainabilityScore >= userProfile.preferences.sustainabilityMin) {
        score += 25;
        reasons.push(`High sustainability score (${product.sustainabilityScore}%)`);
      }

      // Feature matching
      if (product.features && userProfile.preferences.features.length > 0) {
        const matchingFeatures = product.features.filter(feature => 
          userProfile.preferences.features.includes(feature)
        );
        if (matchingFeatures.length > 0) {
          score += matchingFeatures.length * 5;
          reasons.push(`Has features you like: ${matchingFeatures.join(', ')}`);
        }
      }

      // Rating boost
      score += product.averageRating * 5;

      if (score > 0) {
        recommendations.push({
          product,
          score,
          reasons,
          type: 'content'
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Collaborative filtering based on similar users
  private getCollaborativeRecommendations(userProfile: UserProfile, limit: number): RecommendationResult[] {
    // Simplified collaborative filtering
    // In production, this would use more sophisticated algorithms
    const recommendations: RecommendationResult[] = [];

    // Find products that users with similar preferences have bought
    for (const product of this.products) {
      let score = 0;
      const reasons: string[] = [];

      // Boost products in categories the user has bought from before
      const userCategories = userProfile.orderHistory.map(order => {
        const orderedProduct = this.products.find(p => p.id === order.productId);
        return orderedProduct?.category;
      }).filter(Boolean);

      if (userCategories.includes(product.category)) {
        score += 40;
        reasons.push('Similar to your previous purchases');
      }

      // Boost highly rated products
      if (product.averageRating >= 4.5) {
        score += 30;
        reasons.push('Highly rated by other users');
      }

      // Boost products with similar sustainability scores to user's history
      const avgSustainabilityFromHistory = this.calculateAverageSustainability(userProfile);
      if (Math.abs(product.sustainabilityScore - avgSustainabilityFromHistory) <= 10) {
        score += 20;
        reasons.push('Matches your sustainability preferences');
      }

      if (score > 0) {
        recommendations.push({
          product,
          score,
          reasons,
          type: 'collaborative'
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Trending/popular recommendations
  private getTrendingRecommendations(limit: number): RecommendationResult[] {
    return this.products
      .filter(product => product.averageRating >= 4.5)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit)
      .map(product => ({
        product,
        score: product.averageRating * 20,
        reasons: ['Trending and highly rated'],
        type: 'trending' as const
      }));
  }

  // Sustainability-focused recommendations
  private getSustainabilityRecommendations(userProfile: UserProfile, limit: number): RecommendationResult[] {
    return this.products
      .filter(product => product.sustainabilityScore >= 85)
      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
      .slice(0, limit)
      .map(product => ({
        product,
        score: product.sustainabilityScore,
        reasons: [`Excellent sustainability score (${product.sustainabilityScore}%)`],
        type: 'sustainable' as const
      }));
  }

  // Combine and deduplicate recommendations
  private combineRecommendations(recommendations: RecommendationResult[]): RecommendationResult[] {
    const productMap = new Map<number, RecommendationResult>();

    for (const rec of recommendations) {
      const existing = productMap.get(rec.product.id);
      if (existing) {
        // Combine scores and reasons
        existing.score += rec.score;
        existing.reasons = [...new Set([...existing.reasons, ...rec.reasons])];
        existing.type = 'personalized';
      } else {
        productMap.set(rec.product.id, { ...rec });
      }
    }

    return Array.from(productMap.values());
  }

  // Get or create user profile
  private async getUserProfile(userAddress: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userAddress);
    
    if (!profile) {
      // Create default profile
      profile = {
        address: userAddress,
        preferences: {
          categories: [],
          priceRange: { min: 0, max: 1000 },
          sustainabilityMin: 80,
          brands: [],
          features: []
        },
        orderHistory: [],
        searchHistory: [],
        behaviorScore: {
          sustainability: 80,
          priceConsciousness: 50,
          brandLoyalty: 50,
          impulseBuying: 50
        }
      };
      
      this.userProfiles.set(userAddress, profile);
    }

    return profile;
  }

  // Update user profile based on actions
  public async updateUserProfile(
    userAddress: string, 
    action: 'purchase' | 'search' | 'view' | 'preference_update',
    data: any
  ): Promise<void> {
    const profile = await this.getUserProfile(userAddress);

    switch (action) {
      case 'purchase':
        profile.orderHistory.push({
          productId: data.productId,
          quantity: data.quantity,
          timestamp: new Date().toISOString()
        });
        this.updatePreferencesFromPurchase(profile, data.productId);
        break;

      case 'search':
        profile.searchHistory.push({
          query: data.query,
          timestamp: new Date().toISOString(),
          clicked: data.clicked || []
        });
        break;

      case 'preference_update':
        profile.preferences = { ...profile.preferences, ...data };
        break;
    }

    // Invalidate cache for this user
    cacheService.invalidatePattern(`recommendations:${userAddress}`);
  }

  // Update preferences based on purchase behavior
  private updatePreferencesFromPurchase(profile: UserProfile, productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Update category preferences
    if (!profile.preferences.categories.includes(product.category)) {
      profile.preferences.categories.push(product.category);
    }

    // Update sustainability preference
    const avgSustainability = this.calculateAverageSustainability(profile);
    profile.preferences.sustainabilityMin = Math.max(
      profile.preferences.sustainabilityMin,
      avgSustainability - 10
    );

    // Update price range
    profile.preferences.priceRange.max = Math.max(
      profile.preferences.priceRange.max,
      product.priceUSD * 1.5
    );
  }

  // Calculate average sustainability from user's order history
  private calculateAverageSustainability(profile: UserProfile): number {
    if (profile.orderHistory.length === 0) return 80;

    const sustainabilityScores = profile.orderHistory
      .map(order => {
        const product = this.products.find(p => p.id === order.productId);
        return product?.sustainabilityScore || 80;
      });

    return sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length;
  }
}

// Export singleton instance
export const recommendationEngine = RecommendationEngine.getInstance();
export default RecommendationEngine;
