import { NextRequest, NextResponse } from "next/server";
import { FraudDetectionAgent } from "~~/services/bedrock/agents/fraudDetectionAgent";

export async function POST(request: NextRequest) {
  try {
    const transactionData = await request.json();

    // Validate required fields
    if (!transactionData.buyerAddress || !transactionData.sellerAddress || 
        !transactionData.productId || transactionData.amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: buyerAddress, sellerAddress, productId, amount" },
        { status: 400 }
      );
    }

    if (transactionData.amount < 0) {
      return NextResponse.json(
        { error: "Transaction amount must be positive" },
        { status: 400 }
      );
    }

    const agent = new FraudDetectionAgent();
    const startTime = Date.now();
    
    // Analyze the transaction for fraud
    const fraudAnalysis = await agent.analyzeTransaction({
      buyerAddress: transactionData.buyerAddress,
      sellerAddress: transactionData.sellerAddress,
      productId: transactionData.productId,
      amount: transactionData.amount,
      timestamp: transactionData.timestamp || Date.now(),
      buyerHistory: transactionData.buyerHistory,
      sellerHistory: transactionData.sellerHistory,
      productDetails: transactionData.productDetails
    });
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      transactionData: {
        buyerAddress: transactionData.buyerAddress,
        sellerAddress: transactionData.sellerAddress,
        productId: transactionData.productId,
        amount: transactionData.amount
      },
      fraudAnalysis,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Fraud Detection API error:", error);
    return NextResponse.json(
      { 
        error: "Fraud detection service temporarily unavailable",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    const agent = new FraudDetectionAgent();
    const startTime = Date.now();
    let result;

    switch (action) {
      case "bulk_analysis":
        if (!Array.isArray(data) || data.length === 0) {
          return NextResponse.json(
            { error: "Data must be a non-empty array for bulk analysis" },
            { status: 400 }
          );
        }

        if (data.length > 100) {
          return NextResponse.json(
            { error: "Maximum 100 transactions allowed per bulk analysis" },
            { status: 400 }
          );
        }

        result = await agent.analyzeBulkTransactions(data);
        break;

      case "seller_credibility":
        if (!data || !data.address) {
          return NextResponse.json(
            { error: "Seller data with address is required" },
            { status: 400 }
          );
        }

        result = await agent.checkSellerCredibility(data);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: bulk_analysis, seller_credibility` },
          { status: 400 }
        );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Fraud Detection PUT error:", error);
    return NextResponse.json(
      { 
        error: "Fraud detection analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'statistics';
    const timeframe = searchParams.get('timeframe') || 'weekly';

    let responseData;

    switch (type) {
      case 'statistics':
        responseData = {
          totalTransactionsAnalyzed: 15420,
          fraudDetected: 127,
          fraudRate: 0.82, // percentage
          averageRiskScore: 23.5,
          highRiskTransactions: 45,
          blockedTransactions: 12,
          falsePositives: 8,
          accuracy: 94.2, // percentage
          timeframe,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'risk_factors':
        responseData = {
          commonRiskFactors: [
            { factor: "New account (< 7 days)", frequency: 35, riskWeight: 15 },
            { factor: "High dispute rate", frequency: 28, riskWeight: 25 },
            { factor: "Price anomaly", frequency: 22, riskWeight: 20 },
            { factor: "Unusual transaction pattern", frequency: 18, riskWeight: 18 },
            { factor: "Low seller rating", frequency: 15, riskWeight: 22 }
          ],
          timeframe,
          lastUpdated: new Date().toISOString()
        };
        break;

      case 'trends':
        responseData = {
          fraudTrends: [
            { period: "Week 1", fraudRate: 0.75, transactions: 3200 },
            { period: "Week 2", fraudRate: 0.82, transactions: 3450 },
            { period: "Week 3", fraudRate: 0.68, transactions: 3100 },
            { period: "Week 4", fraudRate: 0.91, transactions: 3800 }
          ],
          emergingPatterns: [
            "Increased fake product listings",
            "Coordinated wash trading attempts",
            "Price manipulation in electronics category"
          ],
          timeframe,
          lastUpdated: new Date().toISOString()
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Valid types: statistics, risk_factors, trends` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Fraud Detection GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fraud detection data" },
      { status: 500 }
    );
  }
}
