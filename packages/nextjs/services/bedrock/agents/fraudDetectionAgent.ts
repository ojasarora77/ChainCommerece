import { invokeAI, invokeClaude } from "../index";
import { FraudDetectionResult } from "~~/types/bedrock";

export class FraudDetectionAgent {
  private sessionId: string;

  constructor() {
    this.sessionId = `fraud-detection-${Date.now()}`;
  }

  async analyzeTransaction(transactionData: {
    buyerAddress: string;
    sellerAddress: string;
    productId: string;
    amount: number;
    timestamp: number;
    buyerHistory?: {
      totalTransactions: number;
      averageAmount: number;
      disputeRate: number;
      accountAge: number; // in days
    };
    sellerHistory?: {
      totalSales: number;
      averageRating: number;
      disputeRate: number;
      accountAge: number;
    };
    productDetails?: {
      category: string;
      isNewListing: boolean;
      priceComparedToMarket: number; // ratio to market average
    };
  }): Promise<FraudDetectionResult> {
    const prompt = `
      As an AI fraud detection specialist for a blockchain marketplace, analyze this transaction for potential fraud indicators.

      TRANSACTION DETAILS:
      - Buyer: ${transactionData.buyerAddress}
      - Seller: ${transactionData.sellerAddress}
      - Product ID: ${transactionData.productId}
      - Amount: $${transactionData.amount}
      - Timestamp: ${new Date(transactionData.timestamp).toISOString()}

      BUYER PROFILE:
      - Total Transactions: ${transactionData.buyerHistory?.totalTransactions || 0}
      - Average Amount: $${transactionData.buyerHistory?.averageAmount || 0}
      - Dispute Rate: ${transactionData.buyerHistory?.disputeRate || 0}%
      - Account Age: ${transactionData.buyerHistory?.accountAge || 0} days

      SELLER PROFILE:
      - Total Sales: ${transactionData.sellerHistory?.totalSales || 0}
      - Average Rating: ${transactionData.sellerHistory?.averageRating || 0}/5
      - Dispute Rate: ${transactionData.sellerHistory?.disputeRate || 0}%
      - Account Age: ${transactionData.sellerHistory?.accountAge || 0} days

      PRODUCT CONTEXT:
      - Category: ${transactionData.productDetails?.category || "Unknown"}
      - New Listing: ${transactionData.productDetails?.isNewListing || false}
      - Price vs Market: ${transactionData.productDetails?.priceComparedToMarket || 1}x market average

      FRAUD INDICATORS TO ANALYZE:
      1. Unusual transaction patterns
      2. Account age and history inconsistencies
      3. Price anomalies (too high/low)
      4. Seller reputation issues
      5. Buyer behavior patterns
      6. Product listing characteristics
      7. Timing patterns
      8. Cross-reference with known fraud patterns

      RISK FACTORS:
      - New accounts with high-value transactions
      - Prices significantly above/below market
      - High dispute rates
      - Unusual transaction timing
      - Suspicious address patterns

      Return JSON with this structure:
      {
        "riskScore": number (0-100),
        "riskLevel": "low|medium|high",
        "flags": ["array of specific risk flags"],
        "recommendation": "approve|review|reject",
        "reasoning": "detailed explanation of the analysis"
      }
    `;

    try {
      const response = await invokeClaude(prompt);
      const content = response.content[0].text;
      
      try {
        const analysis = JSON.parse(content);
        return {
          riskScore: Math.min(100, Math.max(0, analysis.riskScore || 0)),
          riskLevel: analysis.riskLevel || this.calculateRiskLevel(analysis.riskScore || 0),
          flags: Array.isArray(analysis.flags) ? analysis.flags : [],
          recommendation: analysis.recommendation || "review",
          reasoning: analysis.reasoning || "AI fraud analysis completed"
        };
      } catch (parseError) {
        console.error("Failed to parse fraud analysis:", parseError);
        return this.getMockFraudAnalysis(transactionData);
      }
    } catch (error) {
      console.error("Fraud detection AI error:", error);
      return this.getMockFraudAnalysis(transactionData);
    }
  }

  async analyzeBulkTransactions(transactions: Array<{
    id: string;
    buyerAddress: string;
    sellerAddress: string;
    amount: number;
    timestamp: number;
  }>): Promise<{
    suspiciousPatterns: string[];
    highRiskTransactions: string[];
    recommendations: string[];
  }> {
    const prompt = `
      Analyze these bulk transactions for fraud patterns:
      
      ${JSON.stringify(transactions, null, 2)}
      
      Look for:
      1. Wash trading patterns
      2. Price manipulation
      3. Coordinated fraud attempts
      4. Unusual volume spikes
      5. Circular transactions
      
      Return analysis with suspiciousPatterns, highRiskTransactions (IDs), and recommendations.
    `;

    try {
      const response = await invokeAI(prompt);
      const content = response.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("Bulk fraud analysis error:", error);
      return {
        suspiciousPatterns: [],
        highRiskTransactions: [],
        recommendations: ["Manual review recommended due to analysis error"]
      };
    }
  }

  async checkSellerCredibility(sellerData: {
    address: string;
    totalSales: number;
    averageRating: number;
    disputeRate: number;
    accountAge: number;
    productCategories: string[];
    recentActivity: Array<{
      type: "sale" | "listing" | "dispute";
      timestamp: number;
      amount?: number;
    }>;
  }): Promise<{
    credibilityScore: number;
    riskFactors: string[];
    recommendation: "trusted" | "monitor" | "restrict";
    reasoning: string;
  }> {
    const prompt = `
      Evaluate seller credibility for marketplace trust scoring:
      
      SELLER PROFILE:
      - Address: ${sellerData.address}
      - Total Sales: ${sellerData.totalSales}
      - Average Rating: ${sellerData.averageRating}/5
      - Dispute Rate: ${sellerData.disputeRate}%
      - Account Age: ${sellerData.accountAge} days
      - Categories: ${sellerData.productCategories.join(", ")}
      - Recent Activity: ${sellerData.recentActivity.length} events
      
      Analyze:
      1. Sales performance consistency
      2. Customer satisfaction trends
      3. Dispute resolution history
      4. Activity patterns
      5. Category expertise
      
      Return credibilityScore (0-100), riskFactors array, recommendation, and reasoning.
    `;

    try {
      const response = await invokeClaude(prompt);
      const content = response.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("Seller credibility error:", error);
      return {
        credibilityScore: 50,
        riskFactors: ["Analysis unavailable"],
        recommendation: "monitor" as const,
        reasoning: "Unable to complete credibility analysis"
      };
    }
  }

  private calculateRiskLevel(riskScore: number): "low" | "medium" | "high" {
    if (riskScore <= 30) return "low";
    if (riskScore <= 70) return "medium";
    return "high";
  }

  private getMockFraudAnalysis(transactionData: any): FraudDetectionResult {
    const flags: string[] = [];
    let riskScore = 20; // Base low risk

    // Analyze buyer history
    if (transactionData.buyerHistory) {
      if (transactionData.buyerHistory.accountAge < 7) {
        flags.push("New buyer account (< 7 days)");
        riskScore += 15;
      }
      if (transactionData.buyerHistory.disputeRate > 20) {
        flags.push("High buyer dispute rate");
        riskScore += 20;
      }
    }

    // Analyze seller history
    if (transactionData.sellerHistory) {
      if (transactionData.sellerHistory.averageRating < 3.0) {
        flags.push("Low seller rating");
        riskScore += 25;
      }
      if (transactionData.sellerHistory.disputeRate > 15) {
        flags.push("High seller dispute rate");
        riskScore += 20;
      }
    }

    // Analyze product details
    if (transactionData.productDetails) {
      if (transactionData.productDetails.priceComparedToMarket > 2.0) {
        flags.push("Price significantly above market average");
        riskScore += 15;
      }
      if (transactionData.productDetails.priceComparedToMarket < 0.5) {
        flags.push("Price significantly below market average");
        riskScore += 10;
      }
    }

    // High value transaction risk
    if (transactionData.amount > 1000) {
      flags.push("High-value transaction");
      riskScore += 10;
    }

    riskScore = Math.min(100, riskScore);
    const riskLevel = this.calculateRiskLevel(riskScore);
    
    let recommendation: "approve" | "review" | "reject";
    if (riskScore <= 30) recommendation = "approve";
    else if (riskScore <= 70) recommendation = "review";
    else recommendation = "reject";

    return {
      riskScore,
      riskLevel,
      flags,
      recommendation,
      reasoning: `Transaction analyzed with ${flags.length} risk factors identified. ${riskLevel.toUpperCase()} risk level determined based on account history, pricing, and transaction patterns.`
    };
  }
}
