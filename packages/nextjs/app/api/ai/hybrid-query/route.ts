import { NextRequest, NextResponse } from 'next/server';
import { HybridQueryRouter } from '../../../../services/ai/HybridQueryRouter';

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      userId, 
      sessionId, 
      userPreferences = {},
      conversationHistory = [],
      currentPage 
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Initialize the hybrid query router
    const router = new HybridQueryRouter();

    // Process the query with full context
    const result = await router.processQuery({
      userQuery: query,
      userId,
      sessionId,
      userPreferences,
      conversationHistory,
      currentPage,
    });

    const totalProcessingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      result: {
        ...result,
        totalProcessingTime,
      },
      metadata: {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        routingStrategy: result.sources.join(' + '),
      },
    });

  } catch (error) {
    console.error('Hybrid Query API error:', error);
    return NextResponse.json(
      {
        error: 'Hybrid query processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Hybrid Query Router API',
    description: 'Intelligent routing between Knowledge Base, Agent, and Smart Contract data',
    endpoints: {
      POST: 'Process queries with intelligent routing',
    },
    routingStrategies: {
      knowledge_base_primary: 'Information and explanation queries',
      agent_primary: 'Transactional and action-oriented queries',
      hybrid_parallel: 'Complex searches requiring multiple data sources',
      smart_contract_primary: 'Real-time blockchain data queries',
      fallback: 'General conversation and unclear queries',
    },
    parameters: {
      query: 'User query or question (required)',
      userId: 'Optional user identifier for personalization',
      sessionId: 'Optional session identifier for conversation continuity',
      userPreferences: 'Optional user preferences object',
      conversationHistory: 'Optional array of previous conversation messages',
      currentPage: 'Optional current page context for better routing',
    },
    queryTypes: [
      'product_search',
      'product_info', 
      'platform_info',
      'order_intent',
      'payment_intent',
      'order_status',
      'dispute_resolution',
      'comparison',
      'recommendation',
      'general_chat'
    ],
    examples: [
      {
        description: 'Knowledge Base primary - Platform information',
        request: {
          query: 'How does the escrow system work?',
          userId: 'user123',
        },
        expectedRouting: 'knowledge_base_primary',
      },
      {
        description: 'Agent primary - Purchase intent',
        request: {
          query: 'I want to buy the AI-Powered Smart Watch',
          userId: 'user123',
          sessionId: 'session456',
        },
        expectedRouting: 'agent_primary',
      },
      {
        description: 'Hybrid parallel - Product search',
        request: {
          query: 'Find sustainable electronics under $300',
          userId: 'user123',
          userPreferences: {
            categories: ['Electronics'],
            maxPrice: 300,
            minSustainabilityScore: 70,
          },
        },
        expectedRouting: 'hybrid_parallel',
      },
      {
        description: 'Smart contract primary - Real-time data',
        request: {
          query: 'What is the current price of product ID 5?',
          userId: 'user123',
        },
        expectedRouting: 'smart_contract_primary',
      },
    ],
    features: [
      'Intelligent query analysis and routing',
      'Parallel processing for complex queries',
      'Context-aware response combination',
      'Caching for performance optimization',
      'Confidence scoring for result quality',
      'Automatic fallback handling',
      'Personalization support',
      'Conversation history integration',
    ],
  });
}
