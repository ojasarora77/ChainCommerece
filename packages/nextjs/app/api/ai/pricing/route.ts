import { NextRequest, NextResponse } from "next/server";
import { PricingAgent } from "~~/services/bedrock/agents/pricingAgent";

export async function POST(request: NextRequest) {
  try {
    const { 
      productId, 
      currentPrice, 
      marketData = {}, 
      competitorPrices = [],
      productDetails = {}
    } = await request.json();

    if (!productId || currentPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: productId, currentPrice" },
        { status: 400 }
      );
    }

    if (currentPrice < 0) {
      return NextResponse.json(
        { error: "Current price must be a positive number" },
        { status: 400 }
      );
    }

    const agent = new PricingAgent();
    const startTime = Date.now();
    
    // Get pricing optimization analysis
    const pricingStrategy = await agent.optimizePrice(
      productId,
      currentPrice,
      marketData,
      competitorPrices
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      productId,
      currentPrice,
      pricingStrategy,
      marketData,
      competitorPrices,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Pricing AI API error:", error);
    return NextResponse.json(
      { 
        error: "AI pricing optimizer temporarily unavailable",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const priceRange = searchParams.get('priceRange');

  try {
    // Return market pricing insights
    const mockPricingInsights = {
      category: category || "general",
      averagePrice: category === "electronics" ? 125.50 : 75.25,
      priceRange: {
        min: category === "electronics" ? 25 : 15,
        max: category === "electronics" ? 500 : 200
      },
      sustainabilityPremium: 15, // 15% average premium
      marketTrends: {
        direction: "up" as const,
        percentage: 8.5
      },
      recommendations: [
        "Consider 10-15% sustainability premium",
        "Monitor competitor pricing weekly",
        "Adjust for seasonal demand variations"
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      insights: mockPricingInsights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Pricing insights GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing insights" },
      { status: 500 }
    );
  }
}

// Batch pricing analysis endpoint
export async function PUT(request: NextRequest) {
  try {
    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (products.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 products allowed per batch request" },
        { status: 400 }
      );
    }

    const agent = new PricingAgent();
    const startTime = Date.now();

    // Process each product
    const results = await Promise.allSettled(
      products.map(async (product: any) => {
        if (!product.id || product.currentPrice === undefined) {
          throw new Error(`Invalid product data: ${JSON.stringify(product)}`);
        }

        return {
          productId: product.id,
          currentPrice: product.currentPrice,
          analysis: await agent.optimizePrice(
            product.id,
            product.currentPrice,
            product.marketData || {},
            product.competitorPrices || []
          )
        };
      })
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        productIndex: index,
        error: (result as PromiseRejectedResult).reason.message
      }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      processed: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Batch pricing API error:", error);
    return NextResponse.json(
      { 
        error: "Batch pricing analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
