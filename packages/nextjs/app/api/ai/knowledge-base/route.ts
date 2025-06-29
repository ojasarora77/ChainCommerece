import { NextRequest, NextResponse } from 'next/server';
import { BedrockAgentRuntimeClient, RetrieveCommand, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';

// Initialize Bedrock Agent Runtime Client
const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'J8UI0TGPTI';

// Debug logging
console.log('Environment check:', {
  BEDROCK_KNOWLEDGE_BASE_ID: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
  KNOWLEDGE_BASE_ID_USED: KNOWLEDGE_BASE_ID,
  AWS_REGION: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID
});

export async function POST(request: NextRequest) {
  try {
    const { query, retrieveOnly = false, maxResults = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!KNOWLEDGE_BASE_ID) {
      return NextResponse.json(
        { error: 'Knowledge Base ID not configured' },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    if (retrieveOnly) {
      // Direct retrieval - just get relevant documents
      const retrieveCommand = new RetrieveCommand({
        knowledgeBaseId: KNOWLEDGE_BASE_ID,
        retrievalQuery: {
          text: query,
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: maxResults,
          },
        },
      });

      const response = await client.send(retrieveCommand);
      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        type: 'retrieve',
        query,
        results: response.retrievalResults?.map(result => ({
          content: result.content?.text,
          score: result.score,
          location: result.location,
          metadata: result.metadata,
        })) || [],
        processingTime,
        timestamp: new Date().toISOString(),
      });

    } else {
      // Retrieve and Generate - get documents and generate response
      const ragCommand = new RetrieveAndGenerateCommand({
        input: {
          text: query,
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: KNOWLEDGE_BASE_ID,
            modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
            retrievalConfiguration: {
              vectorSearchConfiguration: {
                numberOfResults: maxResults,
              },
            },
          },
        },
      });

      const response = await client.send(ragCommand);
      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        type: 'retrieve_and_generate',
        query,
        answer: response.output?.text,
        citations: response.citations?.map(citation => ({
          generatedResponsePart: citation.generatedResponsePart,
          retrievedReferences: citation.retrievedReferences?.map(ref => ({
            content: ref.content?.text,
            location: ref.location,
            metadata: ref.metadata,
          })),
        })) || [],
        sessionId: response.sessionId,
        processingTime,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Knowledge Base API error:', error);
    return NextResponse.json(
      {
        error: 'Knowledge Base query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Knowledge Base API is running',
    knowledgeBaseId: KNOWLEDGE_BASE_ID ? `${KNOWLEDGE_BASE_ID.substring(0, 4)}...` : 'Not configured',
    endpoints: {
      POST: 'Query the knowledge base',
    },
    parameters: {
      query: 'Text query to search for',
      retrieveOnly: 'Boolean - true for document retrieval only, false for RAG (default)',
      maxResults: 'Number of results to return (default: 5)',
    },
    examples: [
      {
        description: 'Get AI-generated answer with citations',
        request: {
          query: 'How does the escrow system work?',
          retrieveOnly: false,
          maxResults: 3,
        },
      },
      {
        description: 'Get raw document chunks only',
        request: {
          query: 'What products are available?',
          retrieveOnly: true,
          maxResults: 5,
        },
      },
    ],
  });
}
