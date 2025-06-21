import { NextRequest, NextResponse } from "next/server";
import { ShoppingAgent } from "~~/services/bedrock/agents/shoppingAgent";
import { FraudDetectionAgent } from "~~/services/bedrock/agents/fraudDetectionAgent";

export async function POST(request: NextRequest) {
  try {
    const { query, preferences, userId, includePersonalized = false } = await request.json();

    if (!query || !preferences || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: query, preferences, userId" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const agent = new ShoppingAgent(userId, preferences);
    
    // Get product recommendations
    const recommendations = await agent.findProducts(query);
    
    // Optional: Get personalized recommendations if requested
    let personalizedRecommendations = [];
    if (includePersonalized) {
      try {
        // Check if method exists before calling
        if (typeof agent.getPersonalizedRecommendations === 'function') {
          personalizedRecommendations = await agent.getPersonalizedRecommendations(userId, preferences) || [];
        }
      } catch (error) {
        console.warn("Personalized recommendations failed:", error);
      }
    }

    // Optional: Run fraud detection on high-value recommendations
    const fraudChecks = await Promise.allSettled(
      recommendations
        .filter(rec => rec.price > 500)
        .map(async (rec) => {
          const fraudAgent = new FraudDetectionAgent();
          return fraudAgent.analyzeTransaction({
            buyerAddress: userId,
            sellerAddress: rec.sellerAddress,
            productId: rec.id,
            amount: rec.price,
            timestamp: Date.now(),
            productDetails: {
              category: rec.category || "Unknown",
              isNewListing: true,
              priceComparedToMarket: 1.0
            }
          });
        })
    );

    const fraudResults = fraudChecks
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      recommendations,
      personalizedRecommendations,
      fraudAnalysis: fraudResults,
      query,
      userId,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Shopping AI API error:", error);
    return NextResponse.json(
      { 
        error: "AI shopping assistant temporarily unavailable",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const category = searchParams.get('category');

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId parameter" },
      { status: 400 }
    );
  }

  try {
    // Return trending products or category-specific recommendations
    const mockRecommendations = [
      {
        id: "trending-1",
        name: "Solar Power Bank 20000mAh",
        description: "High-capacity solar charger with fast charging technology",
        sustainabilityScore: 92,
        price: 79.99,
        chain: "ethereum",
        sellerAddress: "0x1234567890123456789012345678901234567890",
        certifications: ["Fair Trade", "Carbon Neutral"],
        carbonFootprint: 3.2,
        category: "Electronics"
      },
      {
        id: "trending-2",
        name: "Bamboo Wireless Charging Pad",
        description: "Sustainable bamboo wireless charger",
        sustainabilityScore: 88,
        price: 34.99,
        chain: "avalanche",
        sellerAddress: "0x0987654321098765432109876543210987654321",
        certifications: ["FSC Certified", "Biodegradable"],
        carbonFootprint: 1.1,
        category: "Electronics"
      }
    ];

    const filteredRecommendations = category 
      ? mockRecommendations.filter(rec => rec.category.toLowerCase() === category.toLowerCase())
      : mockRecommendations;

    return NextResponse.json({
      success: true,
      recommendations: filteredRecommendations,
      category: category || "all",
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Shopping AI GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
