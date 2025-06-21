import { useState, useCallback } from 'react';
import { FraudDetectionResult } from '~~/types/bedrock';

interface FraudStatistics {
  totalTransactionsAnalyzed: number;
  fraudDetected: number;
  fraudRate: number;
  averageRiskScore: number;
  highRiskTransactions: number;
  blockedTransactions: number;
  falsePositives: number;
  accuracy: number;
  timeframe: string;
  lastUpdated: string;
}

interface UseFraudDetectionReturn {
  fraudAnalysis: FraudDetectionResult | null;
  statistics: FraudStatistics | null;
  isLoading: boolean;
  error: string | null;
  analyzeTransaction: (transactionData: any) => Promise<void>;
  getStatistics: (timeframe?: string) => Promise<void>;
  bulkAnalysis: (transactions: any[]) => Promise<any>;
  checkSellerCredibility: (sellerData: any) => Promise<any>;
  clearResults: () => void;
}

export const useFraudDetection = (): UseFraudDetectionReturn => {
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudDetectionResult | null>(null);
  const [statistics, setStatistics] = useState<FraudStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTransaction = useCallback(async (transactionData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/fraud-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFraudAnalysis(data.fraudAnalysis);
      } else {
        throw new Error(data.error || 'Failed to analyze transaction');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Fraud detection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStatistics = useCallback(async (timeframe: string = 'weekly') => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: 'statistics',
        timeframe
      });

      const response = await fetch(`/api/ai/fraud-detection?${params}`, {
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
        setStatistics(data.data);
      } else {
        throw new Error(data.error || 'Failed to get fraud statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Fraud statistics error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkAnalysis = useCallback(async (transactions: any[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/fraud-detection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_analysis',
          data: transactions
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.result;
      } else {
        throw new Error(data.error || 'Failed to perform bulk analysis');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Bulk fraud analysis error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSellerCredibility = useCallback(async (sellerData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/fraud-detection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'seller_credibility',
          data: sellerData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.result;
      } else {
        throw new Error(data.error || 'Failed to check seller credibility');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Seller credibility check error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setFraudAnalysis(null);
    setStatistics(null);
    setError(null);
  }, []);

  return {
    fraudAnalysis,
    statistics,
    isLoading,
    error,
    analyzeTransaction,
    getStatistics,
    bulkAnalysis,
    checkSellerCredibility,
    clearResults,
  };
};
