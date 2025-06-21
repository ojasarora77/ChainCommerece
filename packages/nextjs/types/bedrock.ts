export interface ProductRecommendation {
  id: string;
  name: string;
  description: string;
  sustainabilityScore: number;
  price: number;
  chain: "ethereum" | "avalanche";
  sellerAddress: string;
  certifications: string[];
  carbonFootprint: number;
  isRealProduct?: boolean; // Flag to identify real marketplace products
  averageRating?: number; // Rating from smart contract
  ethPrice?: string; // Original ETH price for real products
}

export interface AgentResponse {
  recommendations: ProductRecommendation[];
  reasoning: string;
  alternativeOptions?: ProductRecommendation[];
}

export interface UserPreferences {
  sustainabilityMin: number;
  budgetMax: number;
  preferredChain?: "ethereum" | "avalanche" | "any";
  categories: string[];
  ethicalConcerns: string[];
  brandPreferences?: string[];
  deliverySpeed?: "standard" | "fast" | "eco-friendly";
  qualityMin?: number;
}

export interface DisputeCase {
  orderId: string;
  buyer: string;
  seller: string;
  issue: string;
  evidence: string[];
  orderValue?: number;
  suggestedResolution?: string;
}

// Enhanced AI Response Types
export interface AIShoppingResponse {
  recommendations: ProductRecommendation[];
  query: string;
  totalResults: number;
  processingTime: number;
  confidence: number;
  alternativeQueries?: string[];
}

export interface PricingAnalysis {
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  marketTrends: {
    direction: "up" | "down" | "stable";
    percentage: number;
  };
  competitorPrices: number[];
  demandScore: number;
}

export interface DisputeAnalysis {
  disputeId: string;
  category: "shipping" | "quality" | "description" | "payment" | "other";
  severity: "low" | "medium" | "high";
  recommendation: "favor_buyer" | "favor_seller" | "mediation" | "refund";
  confidence: number;
  reasoning: string;
  suggestedResolution: string;
  estimatedCost: number;
}

export interface MarketIntelligence {
  trendingCategories: string[];
  emergingKeywords: string[];
  priceMovements: {
    category: string;
    change: number;
    timeframe: string;
  }[];
  demandForecast: {
    category: string;
    predicted_growth: number;
    confidence: number;
  }[];
}

export interface FraudDetectionResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  recommendation: "approve" | "review" | "reject";
  reasoning: string;
}
