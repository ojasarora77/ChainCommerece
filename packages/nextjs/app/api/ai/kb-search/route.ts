import { NextRequest, NextResponse } from 'next/server';
import { BedrockAgentRuntimeClient, RetrieveCommand, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { cacheService, hashMessage } from '~~/services/cache/CacheService';

// Initialize Bedrock Agent Runtime Client
const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'J8UI0TGPTI';

interface SearchFilters {
  category?: string;
  priceRange?: { min?: number; max?: number };
  sustainabilityMin?: number;
  features?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      searchType = 'products', 
      filters = {},
      maxResults = 5,
      useCache = true 
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const cacheKey = hashMessage(`kb-search-${searchType}-${query}-${JSON.stringify(filters)}`);

    // Check cache first
    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    let result;

    switch (searchType) {
      case 'products':
        result = await searchProducts(query, filters, maxResults);
        break;
      case 'recommendations':
        result = await getRecommendations(query, filters, maxResults);
        break;
      case 'information':
        result = await getInformation(query, maxResults);
        break;
      case 'comparison':
        result = await compareProducts(query, filters, maxResults);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown search type: ${searchType}` },
          { status: 400 }
        );
    }

    const processingTime = Date.now() - startTime;
    const response = {
      success: true,
      searchType,
      query,
      filters,
      ...result,
      processingTime,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    if (useCache) {
      await cacheService.set(cacheKey, response, 300); // 5 minutes cache
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('KB Search API error:', error);
    return NextResponse.json(
      {
        error: 'Knowledge Base search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function searchProducts(query: string, filters: SearchFilters, maxResults: number) {
  const enhancedQuery = buildProductSearchQuery(query, filters);
  
  try {
    const command = new RetrieveAndGenerateCommand({
      input: {
        text: enhancedQuery,
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

    const response = await client.send(command);
    
    return {
      type: 'product_search',
      answer: response.output?.text,
      products: extractProductsFromResponse(response.output?.text || ''),
      citations: response.citations?.map(citation => ({
        text: citation.generatedResponsePart?.textResponsePart?.text,
        sources: citation.retrievedReferences?.map(ref => ({
          content: ref.content?.text,
          location: ref.location?.s3Location?.uri,
          metadata: ref.metadata,
        })),
      })) || [],
    };
  } catch (error) {
    console.log('KB search failed, using fallback:', error.message);
    return getFallbackProductSearch(query, filters);
  }
}

async function getRecommendations(query: string, filters: SearchFilters, maxResults: number) {
  const recommendationQuery = `Based on the user's interest in "${query}", recommend the most suitable sustainable products from our catalog. Consider factors like sustainability score, price, and user preferences. ${JSON.stringify(filters)}`;
  
  try {
    const command = new RetrieveAndGenerateCommand({
      input: {
        text: recommendationQuery,
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

    const response = await client.send(command);
    
    return {
      type: 'recommendations',
      recommendations: response.output?.text,
      products: extractProductsFromResponse(response.output?.text || ''),
      reasoning: 'Based on Knowledge Base analysis of product catalog and user preferences',
    };
  } catch (error) {
    return getFallbackRecommendations(query, filters);
  }
}

async function getInformation(query: string, maxResults: number) {
  try {
    const command = new RetrieveAndGenerateCommand({
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

    const response = await client.send(command);
    
    return {
      type: 'information',
      answer: response.output?.text,
      sources: response.citations?.map(citation => 
        citation.retrievedReferences?.map(ref => ref.location?.s3Location?.uri)
      ).flat().filter(Boolean) || [],
    };
  } catch (error) {
    return {
      type: 'information',
      answer: 'I apologize, but I cannot access the knowledge base at the moment. Please try again later or contact support.',
      sources: [],
    };
  }
}

async function compareProducts(query: string, filters: SearchFilters, maxResults: number) {
  const comparisonQuery = `Compare products related to "${query}". Provide a detailed comparison including features, sustainability scores, prices, and recommendations. ${JSON.stringify(filters)}`;
  
  try {
    const command = new RetrieveAndGenerateCommand({
      input: {
        text: comparisonQuery,
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

    const response = await client.send(command);
    
    return {
      type: 'comparison',
      comparison: response.output?.text,
      products: extractProductsFromResponse(response.output?.text || ''),
    };
  } catch (error) {
    return {
      type: 'comparison',
      comparison: 'Product comparison is temporarily unavailable. Please try individual product searches.',
      products: [],
    };
  }
}

function buildProductSearchQuery(query: string, filters: SearchFilters): string {
  let enhancedQuery = `Find sustainable products related to: ${query}`;
  
  if (filters.category) {
    enhancedQuery += ` in the ${filters.category} category`;
  }
  
  if (filters.priceRange) {
    const { min, max } = filters.priceRange;
    if (min && max) {
      enhancedQuery += ` with price between $${min} and $${max}`;
    } else if (min) {
      enhancedQuery += ` with price above $${min}`;
    } else if (max) {
      enhancedQuery += ` with price below $${max}`;
    }
  }
  
  if (filters.sustainabilityMin) {
    enhancedQuery += ` with sustainability score of at least ${filters.sustainabilityMin}`;
  }
  
  if (filters.features && filters.features.length > 0) {
    enhancedQuery += ` with features: ${filters.features.join(', ')}`;
  }
  
  enhancedQuery += '. Include product names, prices, sustainability scores, and key features.';
  
  return enhancedQuery;
}

function extractProductsFromResponse(text: string): any[] {
  // Simple extraction logic - in production, you'd use more sophisticated parsing
  const products = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('$') && (line.includes('Smart') || line.includes('Eco') || line.includes('Sustainable'))) {
      const match = line.match(/([^$]*)\$(\d+(?:\.\d{2})?)/);
      if (match) {
        products.push({
          name: match[1].trim(),
          price: parseFloat(match[2]),
          description: line,
        });
      }
    }
  }
  
  return products;
}

function getFallbackProductSearch(query: string, filters: SearchFilters) {
  return {
    type: 'product_search',
    answer: `I found several sustainable products related to "${query}". However, the knowledge base is currently syncing. Please try again in a few minutes for detailed product information.`,
    products: [],
    citations: [],
    fallback: true,
  };
}

function getFallbackRecommendations(query: string, filters: SearchFilters) {
  return {
    type: 'recommendations',
    recommendations: `Based on your interest in "${query}", I recommend checking our Electronics and Home & Garden categories for sustainable options. The knowledge base is currently updating with the latest product information.`,
    products: [],
    reasoning: 'Fallback recommendation while knowledge base is syncing',
    fallback: true,
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'Knowledge Base-powered Search API',
    knowledgeBaseId: KNOWLEDGE_BASE_ID ? `${KNOWLEDGE_BASE_ID.substring(0, 4)}...` : 'Not configured',
    status: 'Knowledge Base syncing - full functionality available once indexing completes',
    endpoints: {
      POST: 'Perform Knowledge Base-powered searches',
    },
    searchTypes: {
      products: 'Search for specific products',
      recommendations: 'Get personalized product recommendations',
      information: 'Get general information about platform/products',
      comparison: 'Compare multiple products',
    },
    parameters: {
      query: 'Search query or question',
      searchType: 'Type of search (products, recommendations, information, comparison)',
      filters: 'Optional filters (category, priceRange, sustainabilityMin, features)',
      maxResults: 'Maximum number of results (default: 5)',
      useCache: 'Whether to use caching (default: true)',
    },
    examples: [
      {
        description: 'Search for sustainable electronics',
        request: {
          query: 'smart watch',
          searchType: 'products',
          filters: { category: 'Electronics', priceRange: { max: 500 } },
        },
      },
      {
        description: 'Get recommendations for eco-friendly home products',
        request: {
          query: 'eco-friendly home products',
          searchType: 'recommendations',
          filters: { sustainabilityMin: 80 },
        },
      },
    ],
  });
}
