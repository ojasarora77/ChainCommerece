import { NextRequest, NextResponse } from "next/server";
import { DisputeResolutionAgent } from "~~/services/bedrock/agents/disputeAgent";

export async function POST(request: NextRequest) {
  try {
    const disputeCase = await request.json();
    
    const agent = new DisputeResolutionAgent();
    const resolution = await agent.analyzeDispute(disputeCase);
    
    return NextResponse.json({ 
      success: true, 
      resolution 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
