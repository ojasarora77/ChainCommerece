import { NextRequest, NextResponse } from "next/server";
import { ShoppingAgent } from "~~/services/bedrock/agents/shoppingAgent";
import { FraudDetectionAgent } from "~~/services/bedrock/agents/fraudDetectionAgent";
import { ProductRecommendation } from "~~/types/bedrock";

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
    let personalizedRecommendations: ProductRecommendation[] = [];
    if (includePersonalized) {
      try {
        // Get personalized recommendations based on user preferences
        personalizedRecommendations = await agent.findProducts(`products for ${preferences.categories.join(', ')} enthusiast`) || [];
        // Limit to top 3 personalized recommendations
        personalizedRecommendations = personalizedRecommendations.slice(0, 3);
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
              category: "Unknown", // Default category since it's not available in ProductRecommendation
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
    // Get real trending products from the contract service
    const { ContractProductService } = await import("~~/services/marketplace/contractProductService");
    const contractService = new ContractProductService();

    let recommendations;
    if (category) {
      recommendations = await contractService.getProductsByCategory(category);
    } else {
      recommendations = await contractService.getTrendingProducts(5);
    }

    // Convert to the expected format
    const formattedRecommendations = recommendations.map(product => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      sustainabilityScore: product.sustainabilityScore || 75,
      price: product.priceUSD,
      chain: product.chain,
      sellerAddress: product.seller,
      certifications: product.certifications || ["Blockchain Verified"],
      carbonFootprint: product.carbonFootprint || 2.0,
      category: product.category
    }));

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations,
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
