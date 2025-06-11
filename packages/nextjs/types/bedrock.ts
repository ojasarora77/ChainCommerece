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
}

export interface DisputeCase {
  orderId: string;
  buyer: string;
  seller: string;
  issue: string;
  evidence: string[];
  suggestedResolution?: string;
}
