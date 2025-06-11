import { useState } from "react";
import { ProductRecommendation, UserPreferences } from "~~/types/bedrock";

export const useShoppingAgent = (userId: string, preferences: UserPreferences) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/ai/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, preferences, userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { searchProducts, recommendations, loading, error };
};
