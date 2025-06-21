import { NextRequest, NextResponse } from "next/server";
import { DisputeResolutionAgent } from "~~/services/bedrock/agents/disputeAgent";
import { DisputeCase } from "~~/types/bedrock";

export async function POST(request: NextRequest) {
  try {
    const disputeData = await request.json();

    // Validate required fields
    if (!disputeData.orderId || !disputeData.issue) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, issue" },
        { status: 400 }
      );
    }

    // Ensure evidence is an array
    if (!Array.isArray(disputeData.evidence)) {
      disputeData.evidence = disputeData.evidence ? [disputeData.evidence] : [];
    }

    const disputeCase: DisputeCase = {
      orderId: disputeData.orderId,
      buyer: disputeData.buyer || "",
      seller: disputeData.seller || "",
      issue: disputeData.issue,
      evidence: disputeData.evidence,
      orderValue: disputeData.orderValue,
      suggestedResolution: disputeData.suggestedResolution
    };

    const agent = new DisputeResolutionAgent();
    const startTime = Date.now();
    
    // Analyze the dispute
    const resolution = await agent.analyzeDispute(disputeCase);
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      disputeCase,
      resolution,
      timestamp: new Date().toISOString(),
      processingTime
    });

  } catch (error) {
    console.error("Dispute AI API error:", error);
    return NextResponse.json(
      { 
        error: "AI dispute resolver temporarily unavailable",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const disputeId = searchParams.get('disputeId');
  const status = searchParams.get('status');

  try {
    if (disputeId) {
      // Return specific dispute information
      const mockDispute = {
        orderId: disputeId,
        status: status || "pending",
        buyer: "0x1234...5678",
        seller: "0x8765...4321",
        issue: "Product not as described",
        evidence: ["Photo of received item", "Original product listing"],
        orderValue: 150.00,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        dispute: mockDispute,
        timestamp: new Date().toISOString()
      });
    } else {
      // Return dispute statistics
      const mockStats = {
        totalDisputes: 45,
        pendingDisputes: 12,
        resolvedDisputes: 33,
        averageResolutionTime: "2.5 days",
        resolutionRate: 95.5,
        commonIssues: [
          { issue: "Shipping delays", count: 15 },
          { issue: "Product quality", count: 12 },
          { issue: "Description mismatch", count: 8 },
          { issue: "Payment issues", count: 5 }
        ],
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        statistics: mockStats,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error("Dispute GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispute information" },
      { status: 500 }
    );
  }
}

// Update dispute status
export async function PUT(request: NextRequest) {
  try {
    const { disputeId, status, resolution, notes } = await request.json();

    if (!disputeId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: disputeId, status" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "investigating", "resolved", "closed", "escalated"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    const updatedDispute = {
      disputeId,
      status,
      resolution: resolution || null,
      notes: notes || null,
      updatedAt: new Date().toISOString(),
      updatedBy: "system" // In real app, this would be the user ID
    };

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
      message: `Dispute ${disputeId} status updated to ${status}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Dispute update error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update dispute",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Batch dispute analysis
export async function PATCH(request: NextRequest) {
  try {
    const { disputes } = await request.json();

    if (!Array.isArray(disputes) || disputes.length === 0) {
      return NextResponse.json(
        { error: "Disputes array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (disputes.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 disputes allowed per batch request" },
        { status: 400 }
      );
    }

    const agent = new DisputeResolutionAgent();
    const startTime = Date.now();

    // Process each dispute
    const results = await Promise.allSettled(
      disputes.map(async (dispute: any) => {
        if (!dispute.orderId || !dispute.issue) {
          throw new Error(`Invalid dispute data: ${JSON.stringify(dispute)}`);
        }

        const disputeCase: DisputeCase = {
          orderId: dispute.orderId,
          buyer: dispute.buyer || "",
          seller: dispute.seller || "",
          issue: dispute.issue,
          evidence: Array.isArray(dispute.evidence) ? dispute.evidence : [],
          orderValue: dispute.orderValue
        };

        return {
          disputeId: dispute.orderId,
          resolution: await agent.analyzeDispute(disputeCase)
        };
      })
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        disputeIndex: index,
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
    console.error("Batch dispute analysis error:", error);
    return NextResponse.json(
      { 
        error: "Batch dispute analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
