import { NextRequest, NextResponse } from "next/server";
import { ShoppingAgent } from "~~/services/bedrock/agents/shoppingAgent";

export async function POST(request: NextRequest) {
  try {
    const { query, preferences, userId } = await request.json();
    
    const agent = new ShoppingAgent(userId, preferences);
    const recommendations = await agent.findProducts(query);
    
    return NextResponse.json({ 
      success: true, 
      recommendations,
      count: recommendations.length 
    });
  } catch (error: any) {
    console.error("Shopping agent error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
