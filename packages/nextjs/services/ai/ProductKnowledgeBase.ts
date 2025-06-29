// Enhanced Product Knowledge Base for AI Agent
// Contains detailed information about all marketplace products for accurate AI responses

export interface ProductKnowledge {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string; // in AVAX
  priceUSD: number;
  sustainabilityScore: number;
  averageRating: number;
  features: string[];
  benefits: string[];
  specifications: Record<string, string>;
  useCases: string[];
  targetAudience: string[];
  keywords: string[];
  alternatives: number[]; // IDs of similar products
  certifications: string[];
  carbonFootprint: number;
  materials: string[];
  brandStory?: string;
  warranty?: string;
  shipping?: string;
  aiRecommendationTags: string[];
}

export class ProductKnowledgeBase {
  private static instance: ProductKnowledgeBase;
  private products: Map<number, ProductKnowledge> = new Map();
  private categoryIndex: Map<string, number[]> = new Map();
  private keywordIndex: Map<string, number[]> = new Map();
  private priceRanges: Map<string, number[]> = new Map();

  private constructor() {
    this.initializeProductKnowledge();
    this.buildIndexes();
  }

  public static getInstance(): ProductKnowledgeBase {
    if (!ProductKnowledgeBase.instance) {
      ProductKnowledgeBase.instance = new ProductKnowledgeBase();
    }
    return ProductKnowledgeBase.instance;
  }

  private initializeProductKnowledge(): void {
    // Based on your actual deployed products
    const products: ProductKnowledge[] = [
      {
        id: 1,
        name: "AI-Powered Smart Watch",
        description: "Advanced smartwatch with AI health monitoring and blockchain integration",
        category: "Electronics",
        price: "0.15",
        priceUSD: 6.0, // 0.15 * 40 USD/AVAX
        sustainabilityScore: 88,
        averageRating: 4.7,
        features: [
          "AI health monitoring", "Heart rate tracking", "Sleep analysis", 
          "Blockchain integration", "Fitness tracking", "Smart notifications",
          "Water resistant", "Long battery life", "GPS tracking"
        ],
        benefits: [
          "Personalized health insights", "Secure data storage on blockchain",
          "Comprehensive fitness tracking", "Smart lifestyle management"
        ],
        specifications: {
          "Display": "1.4 inch AMOLED",
          "Battery": "7 days typical use",
          "Water Resistance": "5ATM",
          "Connectivity": "Bluetooth 5.0, WiFi",
          "Sensors": "Heart rate, SpO2, Accelerometer, Gyroscope",
          "Compatibility": "iOS, Android"
        },
        useCases: [
          "Health monitoring", "Fitness tracking", "Smart notifications",
          "Sleep tracking", "Workout analysis", "Daily activity tracking"
        ],
        targetAudience: [
          "Health enthusiasts", "Fitness lovers", "Tech-savvy users",
          "Blockchain enthusiasts", "Professionals"
        ],
        keywords: [
          "smartwatch", "AI", "health", "fitness", "blockchain", "wearable",
          "heart rate", "sleep", "notifications", "GPS", "waterproof"
        ],
        alternatives: [5], // Smart Fitness Tracker
        certifications: ["Blockchain Verified", "AI Powered", "Health Certified"],
        carbonFootprint: 2.1,
        materials: ["Recycled aluminum", "Sustainable silicone", "Gorilla glass"],
        brandStory: "Combining cutting-edge AI with blockchain security for the ultimate health companion",
        warranty: "2 years international warranty",
        shipping: "Free shipping worldwide, 3-5 business days",
        aiRecommendationTags: ["premium", "health-focused", "tech-advanced", "blockchain"]
      },
      {
        id: 2,
        name: "Sustainable Bamboo Laptop Stand",
        description: "Eco-friendly laptop stand made from sustainable bamboo with ergonomic design",
        category: "Electronics",
        price: "0.04",
        priceUSD: 1.6,
        sustainabilityScore: 95,
        averageRating: 4.5,
        features: [
          "100% sustainable bamboo", "Ergonomic design", "Adjustable height",
          "Ventilation slots", "Anti-slip pads", "Portable design",
          "Tool-free assembly", "Universal compatibility"
        ],
        benefits: [
          "Improved posture", "Better laptop cooling", "Eco-friendly choice",
          "Workspace organization", "Reduced neck strain"
        ],
        specifications: {
          "Material": "FSC Certified Bamboo",
          "Dimensions": "25cm x 20cm x 15cm",
          "Weight": "800g",
          "Compatibility": "11-17 inch laptops",
          "Load Capacity": "5kg",
          "Adjustability": "6 height levels"
        },
        useCases: [
          "Home office setup", "Remote work", "Study sessions",
          "Laptop cooling", "Ergonomic workspace", "Travel work"
        ],
        targetAudience: [
          "Remote workers", "Students", "Eco-conscious users",
          "Office workers", "Digital nomads"
        ],
        keywords: [
          "laptop stand", "bamboo", "sustainable", "ergonomic", "eco-friendly",
          "adjustable", "portable", "workspace", "cooling", "posture"
        ],
        alternatives: [],
        certifications: ["FSC Certified", "Sustainable Materials", "Blockchain Verified"],
        carbonFootprint: 0.5,
        materials: ["FSC Certified Bamboo", "Natural wood finish"],
        brandStory: "Crafted from sustainably sourced bamboo to create the perfect ergonomic workspace",
        warranty: "1 year warranty against manufacturing defects",
        shipping: "Carbon-neutral shipping, 2-4 business days",
        aiRecommendationTags: ["eco-friendly", "workspace", "ergonomic", "affordable"]
      },
      {
        id: 3,
        name: "NFT Art Collection Guide",
        description: "Complete digital guide to creating and selling NFT art collections",
        category: "Digital",
        price: "0.025",
        priceUSD: 1.0,
        sustainabilityScore: 92,
        averageRating: 4.6,
        features: [
          "Step-by-step tutorials", "Market analysis", "Platform comparisons",
          "Legal considerations", "Marketing strategies", "Technical guides",
          "Case studies", "Template resources", "Community access"
        ],
        benefits: [
          "Learn NFT creation", "Understand market dynamics", "Avoid common mistakes",
          "Maximize earnings", "Build sustainable NFT business"
        ],
        specifications: {
          "Format": "Digital PDF + Video",
          "Pages": "150+ pages",
          "Videos": "5 hours of content",
          "Updates": "Lifetime updates",
          "Language": "English",
          "Compatibility": "All devices"
        },
        useCases: [
          "NFT creation", "Digital art monetization", "Blockchain education",
          "Creative business", "Investment guidance"
        ],
        targetAudience: [
          "Digital artists", "NFT beginners", "Crypto enthusiasts",
          "Creative entrepreneurs", "Investors"
        ],
        keywords: [
          "NFT", "digital art", "blockchain", "crypto", "guide", "tutorial",
          "collection", "marketplace", "creation", "selling"
        ],
        alternatives: [],
        certifications: ["Blockchain Verified", "Digital Content"],
        carbonFootprint: 0.1,
        materials: ["Digital content"],
        brandStory: "Empowering artists to succeed in the NFT revolution with comprehensive guidance",
        warranty: "30-day money-back guarantee",
        shipping: "Instant digital download",
        aiRecommendationTags: ["educational", "digital", "blockchain", "creative"]
      },
      {
        id: 4,
        name: "Organic Hemp T-Shirt",
        description: "Comfortable organic hemp t-shirt with blockchain authenticity verification",
        category: "Clothing",
        price: "0.03",
        priceUSD: 1.2,
        sustainabilityScore: 90,
        averageRating: 4.4,
        features: [
          "100% organic hemp", "Blockchain authenticity", "Soft texture",
          "Breathable fabric", "Durable construction", "Natural antimicrobial",
          "UV protection", "Moisture-wicking", "Hypoallergenic"
        ],
        benefits: [
          "Eco-friendly fashion", "Verified authenticity", "Superior comfort",
          "Long-lasting wear", "Sustainable choice"
        ],
        specifications: {
          "Material": "100% Organic Hemp",
          "Weight": "180 GSM",
          "Sizes": "XS to XXL",
          "Colors": "Natural, Black, Navy",
          "Care": "Machine washable",
          "Origin": "Sustainably sourced"
        },
        useCases: [
          "Casual wear", "Eco-fashion", "Everyday comfort",
          "Sustainable wardrobe", "Gift giving"
        ],
        targetAudience: [
          "Eco-conscious consumers", "Fashion enthusiasts", "Sustainability advocates",
          "Comfort seekers", "Blockchain supporters"
        ],
        keywords: [
          "hemp", "organic", "t-shirt", "sustainable", "clothing", "eco-friendly",
          "blockchain", "authentic", "comfortable", "natural"
        ],
        alternatives: [],
        certifications: ["Organic Certified", "Hemp Fiber", "Blockchain Verified"],
        carbonFootprint: 1.2,
        materials: ["100% Organic Hemp"],
        brandStory: "Revolutionizing fashion with sustainable hemp and blockchain verification",
        warranty: "Quality guarantee - 6 months",
        shipping: "Eco-friendly packaging, 3-7 business days",
        aiRecommendationTags: ["sustainable", "fashion", "organic", "comfortable"]
      },
      {
        id: 5,
        name: "Smart Fitness Tracker",
        description: "Advanced fitness tracker with AI coaching and Web3 rewards",
        category: "Sports",
        price: "0.12",
        priceUSD: 4.8,
        sustainabilityScore: 82,
        averageRating: 4.4,
        features: [
          "AI coaching", "Web3 rewards", "Multi-sport tracking", "Heart rate monitoring",
          "Sleep analysis", "Stress tracking", "Workout detection", "Social challenges",
          "Long battery life", "Water resistant"
        ],
        benefits: [
          "Personalized coaching", "Earn crypto rewards", "Comprehensive health tracking",
          "Motivation through gamification", "Community engagement"
        ],
        specifications: {
          "Display": "1.1 inch color LCD",
          "Battery": "10 days typical use",
          "Water Resistance": "5ATM",
          "Sensors": "Heart rate, Accelerometer, Gyroscope",
          "Connectivity": "Bluetooth 5.0",
          "Compatibility": "iOS, Android"
        },
        useCases: [
          "Fitness tracking", "Health monitoring", "Workout coaching",
          "Earning rewards", "Social fitness challenges"
        ],
        targetAudience: [
          "Fitness enthusiasts", "Crypto users", "Health-conscious individuals",
          "Gamification lovers", "Tech adopters"
        ],
        keywords: [
          "fitness tracker", "AI coaching", "Web3", "rewards", "health",
          "sports", "workout", "heart rate", "crypto", "gamification"
        ],
        alternatives: [1], // AI-Powered Smart Watch
        certifications: ["AI Powered", "Web3 Rewards", "Blockchain Verified"],
        carbonFootprint: 1.8,
        materials: ["Recycled plastics", "Sustainable silicone"],
        brandStory: "Merging fitness with Web3 to create the most rewarding health journey",
        warranty: "18 months international warranty",
        shipping: "Express shipping available, 2-5 business days",
        aiRecommendationTags: ["fitness", "rewards", "AI-powered", "gamified"]
      }
    ];

    // Store products in map
    products.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  private buildIndexes(): void {
    // Build category index
    this.products.forEach((product, id) => {
      const category = product.category.toLowerCase();
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, []);
      }
      this.categoryIndex.get(category)!.push(id);
    });

    // Build keyword index
    this.products.forEach((product, id) => {
      product.keywords.forEach(keyword => {
        const key = keyword.toLowerCase();
        if (!this.keywordIndex.has(key)) {
          this.keywordIndex.set(key, []);
        }
        this.keywordIndex.get(key)!.push(id);
      });
    });

    // Build price range index
    this.products.forEach((product, id) => {
      const price = product.priceUSD;
      let range = 'high';
      if (price < 2) range = 'low';
      else if (price < 5) range = 'medium';
      
      if (!this.priceRanges.has(range)) {
        this.priceRanges.set(range, []);
      }
      this.priceRanges.get(range)!.push(id);
    });
  }

  // Public methods for AI agent to use
  public getProduct(id: number): ProductKnowledge | undefined {
    return this.products.get(id);
  }

  public getAllProducts(): ProductKnowledge[] {
    return Array.from(this.products.values());
  }

  public searchByKeywords(keywords: string[]): ProductKnowledge[] {
    const productIds = new Set<number>();
    
    keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      const ids = this.keywordIndex.get(key) || [];
      ids.forEach(id => productIds.add(id));
    });

    return Array.from(productIds).map(id => this.products.get(id)!).filter(Boolean);
  }

  public getByCategory(category: string): ProductKnowledge[] {
    const ids = this.categoryIndex.get(category.toLowerCase()) || [];
    return ids.map(id => this.products.get(id)!).filter(Boolean);
  }

  public getByPriceRange(maxPrice: number): ProductKnowledge[] {
    return Array.from(this.products.values()).filter(p => p.priceUSD <= maxPrice);
  }

  public getBySustainabilityScore(minScore: number): ProductKnowledge[] {
    return Array.from(this.products.values()).filter(p => p.sustainabilityScore >= minScore);
  }

  public getRecommendations(productId: number): ProductKnowledge[] {
    const product = this.products.get(productId);
    if (!product) return [];

    const alternatives = product.alternatives.map(id => this.products.get(id)!).filter(Boolean);
    
    // Also find products in same category
    const categoryProducts = this.getByCategory(product.category)
      .filter(p => p.id !== productId)
      .slice(0, 3);

    return [...alternatives, ...categoryProducts];
  }

  public smartSearch(query: string, filters?: {
    category?: string;
    maxPrice?: number;
    sustainabilityMin?: number;
  }): ProductKnowledge[] {
    let results = Array.from(this.products.values());

    // Apply filters first
    if (filters?.category) {
      results = results.filter(p => 
        p.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters?.maxPrice) {
      results = results.filter(p => p.priceUSD <= filters.maxPrice!);
    }

    if (filters?.sustainabilityMin) {
      results = results.filter(p => p.sustainabilityScore >= filters.sustainabilityMin!);
    }

    // Search by query
    if (query) {
      const queryWords = query.toLowerCase().split(' ');
      results = results.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.keywords.join(' ')} ${product.features.join(' ')}`.toLowerCase();
        return queryWords.some(word => searchText.includes(word));
      });
    }

    // Sort by relevance (sustainability + rating + keyword matches)
    results.sort((a, b) => {
      const scoreA = a.sustainabilityScore + (a.averageRating * 20);
      const scoreB = b.sustainabilityScore + (b.averageRating * 20);
      return scoreB - scoreA;
    });

    return results;
  }
}

// Export singleton instance
export const productKnowledgeBase = ProductKnowledgeBase.getInstance();
