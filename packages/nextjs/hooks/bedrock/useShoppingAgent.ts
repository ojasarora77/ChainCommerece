import { useState, useCallback } from 'react';
import { ProductRecommendation, UserPreferences } from '~~/types/bedrock';

interface UseShoppingAgentReturn {
  recommendations: ProductRecommendation[];
  personalizedRecommendations: ProductRecommendation[];
  isLoading: boolean;
  error: string | null;
  searchProducts: (query: string, preferences: UserPreferences, userId: string) => Promise<void>;
  getPersonalized: (userId: string, preferences: UserPreferences) => Promise<void>;
  getTrending: (category?: string) => Promise<void>;
  clearResults: () => void;
}

export const useShoppingAgent = (): UseShoppingAgentReturn => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = useCallback(async (
    query: string, 
    preferences: UserPreferences, 
    userId: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/shopping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          preferences,
          userId,
          includePersonalized: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
        setPersonalizedRecommendations(data.personalizedRecommendations || []);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Shopping agent error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPersonalized = useCallback(async (
    userId: string, 
    preferences: UserPreferences
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/shopping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'personalized recommendations',
          preferences,
          userId,
          includePersonalized: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPersonalizedRecommendations(data.personalizedRecommendations || []);
      } else {
        throw new Error(data.error || 'Failed to get personalized recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Personalized recommendations error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrending = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId: 'trending-user',
        ...(category && { category })
      });

      const response = await fetch(`/api/ai/shopping?${params}`, {
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
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.error || 'Failed to get trending products');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Trending products error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setRecommendations([]);
    setPersonalizedRecommendations([]);
    setError(null);
  }, []);

  return {
    recommendations,
    personalizedRecommendations,
    isLoading,
    error,
    searchProducts,
    getPersonalized,
    getTrending,
    clearResults,
  };
};
