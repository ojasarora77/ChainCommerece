interface UserIntent {
  primaryIntent: 'buy' | 'browse' | 'compare' | 'learn' | 'recommend';
  confidence: number;
  extractedEntities: {
    productType?: string;
    category?: string;
    features?: string[];
    priceRange?: { min?: number; max?: number };
    brand?: string;
    useCase?: string;
    urgency?: 'immediate' | 'planned' | 'research';
  };
  searchTerms: string[];
  naturalLanguageQuery: string;
  processedQuery: string;
}

interface RankingFactors {
  semanticRelevance: number;      // 0-1: How well the product matches the search semantically
  exactMatchBonus: number;        // 0-1: Bonus for exact keyword matches
  categoryRelevance: number;      // 0-1: How well the category matches user intent
  sustainabilityScore: number;    // 0-1: Normalized sustainability score
  popularityScore: number;        // 0-1: Based on ratings and reviews
  priceCompetitiveness: number;   // 0-1: How competitive the price is
  availabilityBonus: number;      // 0-1: In stock bonus
  intentAlignment: number;        // 0-1: How well the product aligns with user intent
  userPreferenceMatch: number;    // 0-1: Match with user's historical preferences
  freshness: number;             // 0-1: How recently the product was added/updated
}

interface RankingWeights {
  semanticRelevance: number;
  exactMatchBonus: number;
  categoryRelevance: number;
  sustainabilityScore: number;
  popularityScore: number;
  priceCompetitiveness: number;
  availabilityBonus: number;
  intentAlignment: number;
  userPreferenceMatch: number;
  freshness: number;
}

interface UserPreferences {
  preferredCategories?: string[];
  maxPrice?: number;
  minSustainabilityScore?: number;
  brandPreferences?: string[];
  featurePreferences?: string[];
  priceRange?: 'budget' | 'mid' | 'premium';
  sustainabilityFocus?: boolean;
}

interface RankedProduct {
  product: any;
  finalScore: number;
  rankingFactors: RankingFactors;
  explanation: string[];
  position: number;
}

export class AdvancedRankingAlgorithm {
  private defaultWeights: RankingWeights;
  private intentBasedWeights: Map<string, Partial<RankingWeights>>;

  constructor() {
    // Default ranking weights (sum should equal 1.0)
    this.defaultWeights = {
      semanticRelevance: 0.25,    // 25% - Most important for search relevance
      exactMatchBonus: 0.15,      // 15% - Exact matches are valuable
      categoryRelevance: 0.12,    // 12% - Category matching
      sustainabilityScore: 0.15,  // 15% - Important for eco-conscious users
      popularityScore: 0.10,      // 10% - Social proof
      priceCompetitiveness: 0.08, // 8% - Price matters
      availabilityBonus: 0.05,    // 5% - In stock bonus
      intentAlignment: 0.05,      // 5% - Intent-specific boost
      userPreferenceMatch: 0.03,  // 3% - Personalization
      freshness: 0.02            // 2% - Slight preference for newer items
    };

    this.initializeIntentBasedWeights();
  }

  private initializeIntentBasedWeights(): void {
    this.intentBasedWeights = new Map([
      ['buy', {
        availabilityBonus: 0.15,     // Higher weight for availability when buying
        priceCompetitiveness: 0.12,  // Price matters more for purchase intent
        popularityScore: 0.12,       // Reviews matter for purchase decisions
        exactMatchBonus: 0.20        // Exact matches more important for buying
      }],
      ['browse', {
        semanticRelevance: 0.30,     // Higher semantic matching for browsing
        categoryRelevance: 0.15,     // Category exploration
        sustainabilityScore: 0.18,   // Sustainability important for browsing
        freshness: 0.05             // Show newer items when browsing
      }],
      ['compare', {
        categoryRelevance: 0.20,     // Same category for comparison
        popularityScore: 0.15,       // Ratings important for comparison
        sustainabilityScore: 0.12,   // Compare sustainability
        priceCompetitiveness: 0.15   // Price comparison
      }],
      ['learn', {
        exactMatchBonus: 0.25,       // Exact matches for learning
        categoryRelevance: 0.20,     // Category-specific learning
        popularityScore: 0.08,       // Less emphasis on popularity
        sustainabilityScore: 0.20    // Learn about sustainability
      }],
      ['recommend', {
        popularityScore: 0.18,       // High-rated items for recommendations
        sustainabilityScore: 0.20,   // Recommend sustainable options
        userPreferenceMatch: 0.08,   // Personalized recommendations
        priceCompetitiveness: 0.10   // Good value recommendations
      }]
    ]);
  }

  rankProducts(
    products: any[],
    searchQuery: string,
    userIntent: UserIntent,
    userPreferences?: UserPreferences,
    semanticScores?: Map<number, number>
  ): RankedProduct[] {
    console.log(`🏆 Ranking ${products.length} products for intent: ${userIntent.primaryIntent}`);

    const weights = this.getWeightsForIntent(userIntent.primaryIntent);
    const rankedProducts: RankedProduct[] = [];

    for (const product of products) {
      const factors = this.calculateRankingFactors(
        product,
        searchQuery,
        userIntent,
        userPreferences,
        semanticScores?.get(product.id) || 0
      );

      const finalScore = this.calculateFinalScore(factors, weights);
      const explanation = this.generateExplanation(factors, weights, product);

      rankedProducts.push({
        product,
        finalScore,
        rankingFactors: factors,
        explanation,
        position: 0 // Will be set after sorting
      });
    }

    // Sort by final score (descending)
    rankedProducts.sort((a, b) => b.finalScore - a.finalScore);

    // Set positions
    rankedProducts.forEach((item, index) => {
      item.position = index + 1;
    });

    console.log(`✅ Ranking complete. Top product: ${rankedProducts[0]?.product.name} (score: ${rankedProducts[0]?.finalScore.toFixed(3)})`);

    return rankedProducts;
  }

  private getWeightsForIntent(intent: string): RankingWeights {
    const intentWeights = this.intentBasedWeights.get(intent) || {};
    return { ...this.defaultWeights, ...intentWeights };
  }

  private calculateRankingFactors(
    product: any,
    searchQuery: string,
    userIntent: UserIntent,
    userPreferences?: UserPreferences,
    semanticScore: number = 0
  ): RankingFactors {
    return {
      semanticRelevance: this.calculateSemanticRelevance(product, searchQuery, semanticScore),
      exactMatchBonus: this.calculateExactMatchBonus(product, searchQuery),
      categoryRelevance: this.calculateCategoryRelevance(product, userIntent),
      sustainabilityScore: this.normalizeSustainabilityScore(product.sustainabilityScore || 0),
      popularityScore: this.calculatePopularityScore(product),
      priceCompetitiveness: this.calculatePriceCompetitiveness(product, userPreferences),
      availabilityBonus: product.isActive ? 1.0 : 0.0,
      intentAlignment: this.calculateIntentAlignment(product, userIntent),
      userPreferenceMatch: this.calculateUserPreferenceMatch(product, userPreferences),
      freshness: this.calculateFreshness(product)
    };
  }

  private calculateSemanticRelevance(product: any, searchQuery: string, semanticScore: number): number {
    // If we have a semantic score from embeddings, use it
    if (semanticScore > 0) {
      return semanticScore;
    }

    // Fallback to keyword-based relevance
    const queryWords = searchQuery.toLowerCase().split(' ').filter(w => w.length > 2);
    const productText = `${product.name} ${product.description}`.toLowerCase();
    
    let matches = 0;
    for (const word of queryWords) {
      if (productText.includes(word)) {
        matches++;
      }
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  private calculateExactMatchBonus(product: any, searchQuery: string): number {
    const query = searchQuery.toLowerCase();
    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();

    // Full query match in name (highest bonus)
    if (name.includes(query)) {
      return 1.0;
    }

    // Full query match in description
    if (description.includes(query)) {
      return 0.8;
    }

    // Partial matches
    const queryWords = query.split(' ').filter(w => w.length > 2);
    let nameMatches = 0;
    let descMatches = 0;

    for (const word of queryWords) {
      if (name.includes(word)) nameMatches++;
      if (description.includes(word)) descMatches++;
    }

    const nameScore = queryWords.length > 0 ? (nameMatches / queryWords.length) * 0.6 : 0;
    const descScore = queryWords.length > 0 ? (descMatches / queryWords.length) * 0.3 : 0;

    return Math.min(nameScore + descScore, 1.0);
  }

  private calculateCategoryRelevance(product: any, userIntent: UserIntent): number {
    const productCategory = product.category.toLowerCase();
    const intentCategory = userIntent.extractedEntities.category?.toLowerCase();

    // Direct category match
    if (intentCategory && productCategory === intentCategory) {
      return 1.0;
    }

    // Related category matching (could be enhanced with category hierarchy)
    const relatedCategories = this.getRelatedCategories(productCategory);
    if (intentCategory && relatedCategories.includes(intentCategory)) {
      return 0.7;
    }

    // Default relevance based on category popularity
    const categoryPopularity = this.getCategoryPopularity(productCategory);
    return categoryPopularity;
  }

  private normalizeSustainabilityScore(score: number): number {
    // Normalize sustainability score from 0-100 to 0-1
    return Math.max(0, Math.min(1, score / 100));
  }

  private calculatePopularityScore(product: any): number {
    const rating = product.averageRating || 0;
    const maxRating = 5;
    
    // Normalize rating to 0-1 scale
    let score = rating / maxRating;
    
    // Boost for products with certifications (social proof)
    if (product.certifications && product.certifications.length > 0) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private calculatePriceCompetitiveness(product: any, userPreferences?: UserPreferences): number {
    const price = product.priceUSD || 0;
    
    // If user has price preferences, score based on that
    if (userPreferences?.maxPrice) {
      if (price <= userPreferences.maxPrice) {
        // Score higher for prices well within budget
        const ratio = price / userPreferences.maxPrice;
        return 1.0 - (ratio * 0.5); // Best score for free, 0.5 for max price
      } else {
        return 0; // Over budget
      }
    }

    // Default price competitiveness based on price ranges
    if (price < 50) return 1.0;      // Budget-friendly
    if (price < 100) return 0.8;     // Affordable
    if (price < 200) return 0.6;     // Mid-range
    if (price < 500) return 0.4;     // Premium
    return 0.2;                      // Luxury
  }

  private calculateIntentAlignment(product: any, userIntent: UserIntent): number {
    let score = 0.5; // Base score

    // Boost based on intent-specific factors
    switch (userIntent.primaryIntent) {
      case 'buy':
        // Boost products that are clearly purchasable
        if (product.isActive && product.priceUSD > 0) score += 0.3;
        break;
      
      case 'browse':
        // Boost diverse, interesting products
        if (product.sustainabilityScore > 70) score += 0.2;
        if (product.certifications?.length > 0) score += 0.1;
        break;
      
      case 'compare':
        // Boost products with clear specifications
        if (product.averageRating > 0) score += 0.2;
        if (product.sustainabilityScore > 0) score += 0.1;
        break;
      
      case 'learn':
        // Boost products with detailed information
        if (product.description.length > 100) score += 0.2;
        if (product.certifications?.length > 0) score += 0.1;
        break;
      
      case 'recommend':
        // Boost high-quality, well-rated products
        if (product.averageRating >= 4.0) score += 0.3;
        if (product.sustainabilityScore >= 80) score += 0.2;
        break;
    }

    return Math.min(score, 1.0);
  }

  private calculateUserPreferenceMatch(product: any, userPreferences?: UserPreferences): number {
    if (!userPreferences) return 0.5; // Neutral score

    let score = 0;
    let factors = 0;

    // Category preference
    if (userPreferences.preferredCategories?.includes(product.category)) {
      score += 1.0;
      factors++;
    }

    // Sustainability preference
    if (userPreferences.sustainabilityFocus && product.sustainabilityScore >= 80) {
      score += 1.0;
      factors++;
    }

    // Price range preference
    if (userPreferences.priceRange) {
      const price = product.priceUSD || 0;
      let inRange = false;
      
      switch (userPreferences.priceRange) {
        case 'budget': inRange = price < 100; break;
        case 'mid': inRange = price >= 100 && price < 300; break;
        case 'premium': inRange = price >= 300; break;
      }
      
      if (inRange) {
        score += 1.0;
        factors++;
      }
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private calculateFreshness(product: any): number {
    // Since we don't have creation dates, use a simple heuristic
    // Products with higher IDs are assumed to be newer
    const id = product.id || 0;
    const maxId = 25; // Approximate max product ID
    
    return Math.min(id / maxId, 1.0);
  }

  private calculateFinalScore(factors: RankingFactors, weights: RankingWeights): number {
    let score = 0;
    
    score += factors.semanticRelevance * weights.semanticRelevance;
    score += factors.exactMatchBonus * weights.exactMatchBonus;
    score += factors.categoryRelevance * weights.categoryRelevance;
    score += factors.sustainabilityScore * weights.sustainabilityScore;
    score += factors.popularityScore * weights.popularityScore;
    score += factors.priceCompetitiveness * weights.priceCompetitiveness;
    score += factors.availabilityBonus * weights.availabilityBonus;
    score += factors.intentAlignment * weights.intentAlignment;
    score += factors.userPreferenceMatch * weights.userPreferenceMatch;
    score += factors.freshness * weights.freshness;

    return Math.max(0, Math.min(1, score));
  }

  private generateExplanation(factors: RankingFactors, weights: RankingWeights, product: any): string[] {
    const explanations = [];
    
    // Find the top contributing factors
    const contributions = [
      { name: 'Semantic Relevance', value: factors.semanticRelevance * weights.semanticRelevance },
      { name: 'Exact Match', value: factors.exactMatchBonus * weights.exactMatchBonus },
      { name: 'Category Match', value: factors.categoryRelevance * weights.categoryRelevance },
      { name: 'Sustainability', value: factors.sustainabilityScore * weights.sustainabilityScore },
      { name: 'Popularity', value: factors.popularityScore * weights.popularityScore },
      { name: 'Price', value: factors.priceCompetitiveness * weights.priceCompetitiveness }
    ].sort((a, b) => b.value - a.value);

    // Add explanations for top 3 factors
    for (let i = 0; i < Math.min(3, contributions.length); i++) {
      const factor = contributions[i];
      if (factor.value > 0.05) { // Only explain significant factors
        explanations.push(`${factor.name}: ${(factor.value * 100).toFixed(1)}%`);
      }
    }

    // Add specific product highlights
    if (factors.sustainabilityScore > 0.8) {
      explanations.push(`High sustainability score (${product.sustainabilityScore})`);
    }
    
    if (factors.popularityScore > 0.8) {
      explanations.push(`Highly rated (${product.averageRating}/5)`);
    }

    return explanations;
  }

  private getRelatedCategories(category: string): string[] {
    const relations = {
      'electronics': ['automotive', 'wearables', 'home'],
      'automotive': ['electronics'],
      'wearables': ['electronics', 'sports'],
      'sports': ['wearables', 'clothing'],
      'home': ['electronics']
    };
    
    return relations[category] || [];
  }

  private getCategoryPopularity(category: string): number {
    const popularity = {
      'electronics': 0.9,
      'automotive': 0.7,
      'wearables': 0.8,
      'home': 0.6,
      'clothing': 0.5,
      'sports': 0.6,
      'beauty': 0.4,
      'books': 0.3,
      'digital': 0.7
    };
    
    return popularity[category] || 0.5;
  }
}
