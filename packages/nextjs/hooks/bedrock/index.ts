// AWS Bedrock AI Hooks
export { useShoppingAgent } from './useShoppingAgent';
export { usePricingAgent } from './usePricingAgent';
export { useFraudDetection } from './useFraudDetection';

// Re-export types for convenience
export type { 
  ProductRecommendation, 
  UserPreferences, 
  FraudDetectionResult,
  PricingAnalysis,
  DisputeAnalysis,
  MarketIntelligence
} from '~~/types/bedrock';
