import { NextRequest, NextResponse } from "next/server";
import { PricingAgent } from "~~/services/bedrock/agents/pricingAgent";

export async function POST(request: NextRequest) {
  try {
    const { productId, currentPrice, marketData, competitorPrices } = await request.json();
    
    const agent = new PricingAgent();
    const strategy = await agent.optimizePrice(
      productId,
      currentPrice,
      marketData,
      competitorPrices
    );
    
    return NextResponse.json({ 
      success: true, 
      strategy 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
