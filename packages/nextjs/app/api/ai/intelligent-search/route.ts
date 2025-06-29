import { NextRequest, NextResponse } from 'next/server';
import { SemanticSearchEngine } from '../../../../services/search/SemanticSearchEngine';
import { ProductIntentRecognizer } from '../../../../services/search/ProductIntentRecognizer';
import { AdvancedRankingAlgorithm } from '../../../../services/search/AdvancedRankingAlgorithm';
import { ProductKnowledgeEnhancer } from '../../../../services/search/ProductKnowledgeEnhancer';
import { QueryProcessingPipeline } from '../../../../services/search/QueryProcessingPipeline';
import { ShoppingAgentFunctions } from '../../../../services/bedrock/agents/shoppingAgentFunctions';
import { cacheService, hashMessage } from '../../../../services/cache/CacheService';
import { trackKBQuery } from '../../../../services/analytics/KnowledgeBaseAnalytics';

interface IntelligentSearchRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  userPreferences?: {
    categories?: string[];
    maxPrice?: number;
    minSustainabilityScore?: number;
    priceRange?: 'budget' | 'mid' | 'premium';
    sustainabilityFocus?: boolean;
  };
  searchOptions?: {
    maxResults?: number;
    includeOutOfStock?: boolean;
    sortBy?: 'relevance' | 'price' | 'sustainability' | 'rating';
    useSemanticSearch?: boolean;
    useCache?: boolean;
  };
}

interface IntelligentSearchResponse {
  success: boolean;
  query: {
    original: string;
    processed: string;
    intent: any;
    confidence: number;
  };
  results: {
    products: any[];
    totalFound: number;
    searchTime: number;
    ranking: {
      algorithm: string;
      factors: string[];
    };
  };
  suggestions: {
    queryCorrections?: string[];
    relatedSearches: string[];
    categoryFilters: string[];
    priceFilters: string[];
  };
  analytics: {
    searchType: string;
    semanticSearchUsed: boolean;
    cacheHit: boolean;
    processingSteps: string[];
  };
  timestamp: string;
}

// Global instances (initialized once)
let searchEngine: SemanticSearchEngine;
let intentRecognizer: ProductIntentRecognizer;
let rankingAlgorithm: AdvancedRankingAlgorithm;
let knowledgeEnhancer: ProductKnowledgeEnhancer;
let queryProcessor: QueryProcessingPipeline;
let agentFunctions: ShoppingAgentFunctions;
let isInitialized = false;

async function initializeSearchSystem() {
  if (isInitialized) return;

  console.log('🚀 Initializing Intelligent Search System...');
  
  searchEngine = new SemanticSearchEngine();
  intentRecognizer = new ProductIntentRecognizer();
  rankingAlgorithm = new AdvancedRankingAlgorithm();
  knowledgeEnhancer = new ProductKnowledgeEnhancer();
  queryProcessor = new QueryProcessingPipeline();
  agentFunctions = new ShoppingAgentFunctions();

  // Load and enhance all products
  try {
    const productsResponse = await agentFunctions.searchProducts({ query: '' });
    if (productsResponse.success && productsResponse.data.products.length > 0) {
      const products = productsResponse.data.products;
      
      // Enhance products with semantic data
      await knowledgeEnhancer.enhanceAllProducts(products);
      
      // Initialize semantic search with enhanced products
      await searchEngine.initializeProductEmbeddings(products);
      
      console.log(`✅ Search system initialized with ${products.length} products`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize search system:', error);
  }

  isInitialized = true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Initialize search system if needed
    await initializeSearchSystem();

    const {
      query,
      userId,
      sessionId,
      userPreferences = {},
      searchOptions = {}
    }: IntelligentSearchRequest = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Query is required and cannot be empty'
      }, { status: 400 });
    }

    // Set default options
    const options = {
      maxResults: 10,
      includeOutOfStock: false,
      sortBy: 'relevance',
      useSemanticSearch: true,
      useCache: true,
      ...searchOptions
    };

    // Check cache first
    const cacheKey = hashMessage(`intelligent-search-${query}-${JSON.stringify(userPreferences)}-${JSON.stringify(options)}`);
    if (options.useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        // Track analytics for cached result
        trackKBQuery(
          query,
          'intelligent_search_cached',
          Date.now() - startTime,
          cached.query.confidence,
          ['cache', 'semantic_search'],
          true,
          { userId, sessionId, cacheHit: true }
        );

        return NextResponse.json({
          ...cached,
          analytics: {
            ...cached.analytics,
            cacheHit: true
          }
        });
      }
    }

    console.log(`🔍 Intelligent search for: "${query}"`);

    // Step 1: Process the query
    const processedQuery = await queryProcessor.processQuery(query);
    
    // Step 2: Recognize user intent
    const userIntent = await intentRecognizer.recognizeIntent(query);
    
    // Step 3: Get products using multiple approaches
    let products: any[] = [];
    let searchType = 'hybrid';
    let semanticSearchUsed = false;

    if (options.useSemanticSearch && isInitialized) {
      try {
        // Use semantic search
        const semanticResults = await searchEngine.semanticSearch({
          query: processedQuery.expandedQuery,
          userId,
          userPreferences,
          category: userIntent.extractedEntities.category
        });
        
        products = semanticResults.map(result => result.product);
        semanticSearchUsed = true;
        searchType = 'semantic';
      } catch (error) {
        console.warn('Semantic search failed, falling back to traditional search:', error);
      }
    }

    // Fallback to traditional search if semantic search failed or not used
    if (products.length === 0) {
      const traditionalSearch = await agentFunctions.searchProducts({
        query: processedQuery.correctedQuery
      });
      
      if (traditionalSearch.success) {
        products = traditionalSearch.data.products;
        searchType = 'traditional';
      }
    }

    // Step 4: Filter products based on options
    if (!options.includeOutOfStock) {
      products = products.filter(product => product.isActive);
    }

    // Apply user preference filters
    if (userPreferences.maxPrice) {
      products = products.filter(product => (product.priceUSD || 0) <= userPreferences.maxPrice!);
    }

    if (userPreferences.minSustainabilityScore) {
      products = products.filter(product => 
        (product.sustainabilityScore || 0) >= userPreferences.minSustainabilityScore!
      );
    }

    if (userPreferences.categories && userPreferences.categories.length > 0) {
      products = products.filter(product => 
        userPreferences.categories!.includes(product.category)
      );
    }

    // Step 5: Rank products using advanced algorithm
    const rankedProducts = rankingAlgorithm.rankProducts(
      products,
      processedQuery.expandedQuery,
      userIntent,
      userPreferences
    );

    // Step 6: Apply sorting and limit results
    let finalProducts = rankedProducts.map(rp => ({
      ...rp.product,
      _ranking: {
        score: rp.finalScore,
        position: rp.position,
        explanation: rp.explanation
      }
    }));

    // Apply additional sorting if requested
    if (options.sortBy !== 'relevance') {
      finalProducts = applySorting(finalProducts, options.sortBy);
    }

    // Limit results
    finalProducts = finalProducts.slice(0, options.maxResults);

    // Step 7: Generate suggestions
    const suggestions = await generateSuggestions(processedQuery, userIntent, products);

    // Step 8: Build response
    const searchTime = Date.now() - startTime;
    const response: IntelligentSearchResponse = {
      success: true,
      query: {
        original: query,
        processed: processedQuery.expandedQuery,
        intent: userIntent,
        confidence: Math.min(processedQuery.confidence, userIntent.confidence)
      },
      results: {
        products: finalProducts,
        totalFound: products.length,
        searchTime,
        ranking: {
          algorithm: 'advanced_multi_factor',
          factors: ['semantic_relevance', 'sustainability', 'popularity', 'price_competitiveness']
        }
      },
      suggestions,
      analytics: {
        searchType,
        semanticSearchUsed,
        cacheHit: false,
        processingSteps: processedQuery.processingSteps
      },
      timestamp: new Date().toISOString()
    };

    // Cache the result
    if (options.useCache) {
      await cacheService.set(cacheKey, response, 300); // 5 minutes
    }

    // Track analytics
    trackKBQuery(
      query,
      'intelligent_search',
      searchTime,
      response.query.confidence,
      semanticSearchUsed ? ['semantic_search', 'ranking'] : ['traditional_search', 'ranking'],
      true,
      {
        userId,
        sessionId,
        knowledgeBaseUsed: semanticSearchUsed,
        cacheHit: false
      }
    );

    console.log(`✅ Search completed: ${finalProducts.length} results in ${searchTime}ms`);
    return NextResponse.json(response);

  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('❌ Intelligent search error:', error);

    // Track error
    trackKBQuery(
      request.url || 'unknown',
      'intelligent_search_error',
      searchTime,
      0,
      [],
      false,
      {
        userId: 'unknown',
        sessionId: 'unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function applySorting(products: any[], sortBy: string): any[] {
  switch (sortBy) {
    case 'price':
      return products.sort((a, b) => (a.priceUSD || 0) - (b.priceUSD || 0));
    case 'sustainability':
      return products.sort((a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0));
    case 'rating':
      return products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    default:
      return products; // Keep relevance ranking
  }
}

async function generateSuggestions(processedQuery: any, userIntent: any, products: any[]) {
  const suggestions = {
    queryCorrections: processedQuery.suggestions,
    relatedSearches: [],
    categoryFilters: [],
    priceFilters: []
  };

  // Generate related searches based on found products
  const categories = [...new Set(products.map(p => p.category))];
  suggestions.categoryFilters = categories.slice(0, 5);

  // Generate price filter suggestions
  const prices = products.map(p => p.priceUSD || 0).filter(p => p > 0);
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const midPrice = Math.round((minPrice + maxPrice) / 2);
    
    suggestions.priceFilters = [
      `Under $${midPrice}`,
      `$${midPrice} - $${maxPrice}`,
      `Over $${maxPrice}`
    ];
  }

  // Generate related searches
  if (userIntent.extractedEntities.category) {
    suggestions.relatedSearches.push(`Best ${userIntent.extractedEntities.category}`);
    suggestions.relatedSearches.push(`Sustainable ${userIntent.extractedEntities.category}`);
  }

  return suggestions;
}

export async function GET() {
  return NextResponse.json({
    message: 'Intelligent Product Search API',
    description: 'Amazon-level intelligent search with semantic understanding, intent recognition, and advanced ranking',
    features: [
      'Semantic search using AWS Bedrock Titan embeddings',
      'Natural language intent recognition',
      'Advanced multi-factor ranking algorithm',
      'Spell correction and query expansion',
      'Real-time product knowledge enhancement',
      'Intelligent caching for sub-3-second responses',
      'Comprehensive search analytics'
    ],
    capabilities: {
      'Natural Language': 'Understands queries like "I need something to record while driving"',
      'Fuzzy Matching': 'Finds products even with typos or partial names',
      'Semantic Understanding': 'Maps user intent to relevant products',
      'Smart Ranking': 'Ranks by relevance, sustainability, popularity, and user preferences',
      'Query Expansion': 'Automatically includes synonyms and related terms',
      'Personalization': 'Adapts results based on user preferences and history'
    },
    endpoints: {
      POST: 'Perform intelligent product search',
      GET: 'Get API documentation and status'
    },
    parameters: {
      query: 'Search query (required) - can be natural language',
      userId: 'Optional user identifier for personalization',
      sessionId: 'Optional session identifier',
      userPreferences: 'Optional user preferences object',
      searchOptions: 'Optional search configuration'
    },
    examples: [
      {
        description: 'Natural language search',
        request: {
          query: 'I need something to record while driving',
          userPreferences: { maxPrice: 200 }
        }
      },
      {
        description: 'Fuzzy product search',
        request: {
          query: 'automat wireles dash cam',
          searchOptions: { maxResults: 5, useSemanticSearch: true }
        }
      },
      {
        description: 'Category-based search',
        request: {
          query: 'sustainable electronics for my car',
          userPreferences: { sustainabilityFocus: true, minSustainabilityScore: 70 }
        }
      }
    ],
    performance: {
      targetResponseTime: '< 3 seconds',
      cacheHitRate: '> 80%',
      searchAccuracy: '> 95%',
      semanticMatchingEnabled: true
    }
  });
}
