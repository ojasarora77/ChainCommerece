import { useState, useCallback } from 'react';

interface PricingStrategy {
  suggestedPrice: number;
  reasoning: string;
  priceRange: { min: number; max: number };
  competitivenessScore: number;
  confidence: number;
  factors: string[];
  sustainabilityPremium: number;
  marketPosition: string;
  demandForecast: string;
}

interface PricingInsights {
  category: string;
  averagePrice: number;
  priceRange: { min: number; max: number };
  sustainabilityPremium: number;
  marketTrends: { direction: string; percentage: number };
  recommendations: string[];
  lastUpdated: string;
}

interface UsePricingAgentReturn {
  pricingStrategy: PricingStrategy | null;
  insights: PricingInsights | null;
  isLoading: boolean;
  error: string | null;
  optimizePrice: (productId: string, currentPrice: number, marketData?: any, competitorPrices?: number[]) => Promise<void>;
  getInsights: (category?: string) => Promise<void>;
  batchOptimize: (products: Array<{ id: string; currentPrice: number; marketData?: any; competitorPrices?: number[] }>) => Promise<any>;
  clearResults: () => void;
}

export const usePricingAgent = (): UsePricingAgentReturn => {
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy | null>(null);
  const [insights, setInsights] = useState<PricingInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizePrice = useCallback(async (
    productId: string,
    currentPrice: number,
    marketData: any = {},
    competitorPrices: number[] = []
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          currentPrice,
          marketData,
          competitorPrices
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPricingStrategy(data.pricingStrategy);
      } else {
        throw new Error(data.error || 'Failed to optimize pricing');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Pricing optimization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInsights = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`/api/ai/pricing?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
      } else {
        throw new Error(data.error || 'Failed to get pricing insights');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Pricing insights error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const batchOptimize = useCallback(async (
    products: Array<{ id: string; currentPrice: number; marketData?: any; competitorPrices?: number[] }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to perform batch pricing optimization');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Batch pricing optimization error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setPricingStrategy(null);
    setInsights(null);
    setError(null);
  }, []);

  return {
    pricingStrategy,
    insights,
    isLoading,
    error,
    optimizePrice,
    getInsights,
    batchOptimize,
    clearResults,
  };
};
