import { NextRequest, NextResponse } from "next/server";
import { MarketIntelligenceAgent } from "~~/services/bedrock/agents/marketIntelligenceAgent";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as "daily" | "weekly" | "monthly" | "quarterly" || "weekly";
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',').map(c => c.trim()) : undefined;

    const agent = new MarketIntelligenceAgent();
    const startTime = Date.now();
    
    // Get market intelligence
    const intelligence = await agent.analyzeMarketTrends(timeframe, categories);
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      intelligence,
      timeframe,
      categories: categories || "all",
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Market Intelligence API error:", error);
    return NextResponse.json(
      { 
        error: "Market intelligence service temporarily unavailable",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      action, 
      category, 
      timeframe = "weekly",
      historicalData,
      priceRange 
    } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    const agent = new MarketIntelligenceAgent();
    const startTime = Date.now();
    let result;

    switch (action) {
      case "predict_growth":
        if (!category) {
          return NextResponse.json(
            { error: "Category is required for growth prediction" },
            { status: 400 }
          );
        }
        result = await agent.predictCategoryGrowth(category, historicalData);
        break;

      case "analyze_competitors":
        if (!category) {
          return NextResponse.json(
            { error: "Category is required for competitor analysis" },
            { status: 400 }
          );
        }
        result = await agent.analyzeCompetitorLandscape(category, priceRange);
        break;

      case "generate_report":
        const categories = category ? [category] : ["Electronics", "Fashion", "Home & Garden"];
        result = await agent.generateMarketReport(categories, timeframe);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: predict_growth, analyze_competitors, generate_report` },
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
    console.error("Market Intelligence POST error:", error);
    return NextResponse.json(
      { 
        error: "Market intelligence analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Get trending products and categories
export async function PUT(request: NextRequest) {
  try {
    const { type = "products", limit = 10, category } = await request.json();

    const validTypes = ["products", "categories", "keywords", "sellers"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    let trendingData;

    switch (type) {
      case "products":
        trendingData = [
          {
            id: "trend-1",
            name: "Solar Power Bank 20000mAh",
            category: "Electronics",
            trendScore: 95,
            growthRate: 25.5,
            searchVolume: 1250,
            averagePrice: 79.99
          },
          {
            id: "trend-2",
            name: "Bamboo Wireless Charger",
            category: "Electronics",
            trendScore: 88,
            growthRate: 18.3,
            searchVolume: 890,
            averagePrice: 34.99
          },
          {
            id: "trend-3",
            name: "Organic Cotton T-Shirt",
            category: "Fashion",
            trendScore: 82,
            growthRate: 15.7,
            searchVolume: 2100,
            averagePrice: 24.99
          }
        ].slice(0, limit);
        break;

      case "categories":
        trendingData = [
          { name: "Solar Energy", trendScore: 92, growthRate: 28.5 },
          { name: "Sustainable Fashion", trendScore: 85, growthRate: 22.1 },
          { name: "Eco Electronics", trendScore: 78, growthRate: 19.8 },
          { name: "Zero Waste Home", trendScore: 75, growthRate: 17.2 }
        ].slice(0, limit);
        break;

      case "keywords":
        trendingData = [
          { keyword: "carbon neutral", searchVolume: 5200, growthRate: 35.2 },
          { keyword: "biodegradable", searchVolume: 3800, growthRate: 28.7 },
          { keyword: "renewable energy", searchVolume: 4100, growthRate: 25.1 },
          { keyword: "sustainable materials", searchVolume: 2900, growthRate: 22.8 }
        ].slice(0, limit);
        break;

      case "sellers":
        trendingData = [
          {
            address: "0x1234...5678",
            name: "EcoTech Solutions",
            category: "Electronics",
            trendScore: 89,
            salesGrowth: 45.2,
            rating: 4.8
          },
          {
            address: "0x8765...4321",
            name: "Green Fashion Co",
            category: "Fashion",
            trendScore: 84,
            salesGrowth: 38.7,
            rating: 4.6
          }
        ].slice(0, limit);
        break;
    }

    // Filter by category if specified
    if (category && type === "products" && trendingData) {
      trendingData = trendingData.filter((item: any) => 
        item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      type,
      category: category || "all",
      limit,
      data: trendingData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Trending data error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch trending data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
