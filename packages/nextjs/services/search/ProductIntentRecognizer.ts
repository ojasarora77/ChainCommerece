import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { cacheService, hashMessage } from '../cache/CacheService';

interface UserIntent {
  primaryIntent: 'buy' | 'browse' | 'compare' | 'learn' | 'recommend';
  confidence: number;
  extractedEntities: {
    productType?: string;
    category?: string;
    features?: string[];
    priceRange?: { min?: number; max?: number };
    brand?: string;
    useCase?: string;
    urgency?: 'immediate' | 'planned' | 'research';
  };
  searchTerms: string[];
  naturalLanguageQuery: string;
  processedQuery: string;
}

interface IntentPattern {
  pattern: RegExp;
  intent: UserIntent['primaryIntent'];
  confidence: number;
  entityExtractor?: (match: RegExpMatchArray) => Partial<UserIntent['extractedEntities']>;
}

export class ProductIntentRecognizer {
  private bedrockClient: BedrockRuntimeClient;
  private intentPatterns: IntentPattern[] = [];
  private categoryMappings: Map<string, string[]> = new Map();
  private featureMappings: Map<string, string[]> = new Map();

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.initializePatterns();
    this.initializeMappings();
  }

  private initializePatterns(): void {
    this.intentPatterns = [
      // Buy intent patterns
      {
        pattern: /(?:i want to|i need to|i'd like to)?\s*(?:buy|purchase|order|get)\s+(.+)/i,
        intent: 'buy',
        confidence: 0.9,
        entityExtractor: (match) => ({ urgency: 'immediate' })
      },
      {
        pattern: /(?:looking for|need|want)\s+(?:a|an|some)?\s*(.+?)(?:\s+to\s+(.+))?/i,
        intent: 'buy',
        confidence: 0.8,
        entityExtractor: (match) => ({ 
          productType: match[1],
          useCase: match[2] || undefined
        })
      },

      // Browse intent patterns
      {
        pattern: /(?:show me|what|find|search for)\s+(.+)/i,
        intent: 'browse',
        confidence: 0.7
      },
      {
        pattern: /(?:browse|explore|see)\s+(.+)/i,
        intent: 'browse',
        confidence: 0.8
      },

      // Compare intent patterns
      {
        pattern: /(?:compare|difference between|vs|versus)\s+(.+)/i,
        intent: 'compare',
        confidence: 0.9
      },
      {
        pattern: /(?:which is better|best)\s+(.+)/i,
        intent: 'compare',
        confidence: 0.8
      },

      // Learn intent patterns
      {
        pattern: /(?:how does|what is|tell me about|explain)\s+(.+)/i,
        intent: 'learn',
        confidence: 0.9
      },
      {
        pattern: /(?:information about|details of|specs for)\s+(.+)/i,
        intent: 'learn',
        confidence: 0.8
      },

      // Recommend intent patterns
      {
        pattern: /(?:recommend|suggest|advice)\s+(.+)/i,
        intent: 'recommend',
        confidence: 0.9
      },
      {
        pattern: /(?:best|top|good)\s+(.+?)(?:\s+for\s+(.+))?/i,
        intent: 'recommend',
        confidence: 0.7,
        entityExtractor: (match) => ({ 
          productType: match[1],
          useCase: match[2] || undefined
        })
      }
    ];
  }

  private initializeMappings(): void {
    // Category mappings for intent recognition
    this.categoryMappings = new Map([
      ['automotive', ['car', 'vehicle', 'driving', 'dashboard', 'dash cam', 'dashcam', 'automotive']],
      ['electronics', ['electronic', 'device', 'gadget', 'tech', 'smart', 'digital']],
      ['wearables', ['watch', 'tracker', 'fitness', 'wearable', 'smartwatch', 'band']],
      ['home', ['home', 'house', 'indoor', 'planter', 'led', 'strip', 'lighting']],
      ['clothing', ['shirt', 'clothes', 'apparel', 'wear', 'joggers', 'hemp']],
      ['sports', ['fitness', 'exercise', 'workout', 'sports', 'resistance', 'band']],
      ['beauty', ['beauty', 'skincare', 'serum', 'cosmetic', 'hydrating']],
      ['books', ['book', 'guide', 'handbook', 'reading', 'crypto']],
      ['digital', ['nft', 'digital', 'virtual', 'online', 'software', 'app']]
    ]);

    // Feature mappings for better understanding
    this.featureMappings = new Map([
      ['recording', ['record', 'recording', 'capture', 'video', 'camera']],
      ['wireless', ['wireless', 'wifi', 'bluetooth', 'cordless', 'remote']],
      ['smart', ['smart', 'ai', 'intelligent', 'automated', 'connected']],
      ['sustainable', ['eco', 'sustainable', 'green', 'bamboo', 'organic', 'hemp']],
      ['fitness', ['fitness', 'health', 'exercise', 'workout', 'activity']],
      ['monitoring', ['monitor', 'track', 'tracking', 'detection', 'sensor']]
    ]);
  }

  async recognizeIntent(query: string): Promise<UserIntent> {
    const cacheKey = hashMessage(`intent-${query}`);
    const cached = await cacheService.get(cacheKey) as UserIntent | null;
    if (cached) {
      return cached;
    }

    console.log(`🧠 Recognizing intent for: "${query}"`);

    // First try pattern matching for quick recognition
    const patternResult = this.recognizeWithPatterns(query);
    
    // If pattern matching has low confidence, use Claude for deeper understanding
    let finalResult = patternResult;
    if (patternResult.confidence < 0.7) {
      try {
        const claudeResult = await this.recognizeWithClaude(query);
        if (claudeResult.confidence > patternResult.confidence) {
          finalResult = claudeResult;
        }
      } catch (error) {
        console.warn('Claude intent recognition failed, using pattern result:', error);
      }
    }

    // Enhance with entity extraction
    finalResult = this.enhanceWithEntityExtraction(query, finalResult);

    // Cache the result
    await cacheService.set(cacheKey, finalResult, 600); // 10 minutes

    console.log(`✅ Intent recognized: ${finalResult.primaryIntent} (${finalResult.confidence})`);
    return finalResult;
  }

  private recognizeWithPatterns(query: string): UserIntent {
    const queryLower = query.toLowerCase().trim();
    let bestMatch: UserIntent | null = null;
    let highestConfidence = 0;

    for (const pattern of this.intentPatterns) {
      const match = queryLower.match(pattern.pattern);
      if (match && pattern.confidence > highestConfidence) {
        highestConfidence = pattern.confidence;
        
        const extractedEntities = pattern.entityExtractor ? 
          pattern.entityExtractor(match) : {};

        bestMatch = {
          primaryIntent: pattern.intent,
          confidence: pattern.confidence,
          extractedEntities,
          searchTerms: this.extractSearchTerms(match[1] || query),
          naturalLanguageQuery: query,
          processedQuery: this.processQuery(match[1] || query)
        };
      }
    }

    // Fallback to browse intent if no pattern matches
    if (!bestMatch) {
      bestMatch = {
        primaryIntent: 'browse',
        confidence: 0.5,
        extractedEntities: {},
        searchTerms: this.extractSearchTerms(query),
        naturalLanguageQuery: query,
        processedQuery: this.processQuery(query)
      };
    }

    return bestMatch;
  }

  private async recognizeWithClaude(query: string): Promise<UserIntent> {
    const prompt = `Analyze this user query and determine their intent and extract relevant information:

Query: "${query}"

Please respond with a JSON object containing:
1. primaryIntent: one of "buy", "browse", "compare", "learn", "recommend"
2. confidence: number between 0 and 1
3. extractedEntities: object with productType, category, features, priceRange, useCase, urgency
4. searchTerms: array of key search terms
5. processedQuery: cleaned version of the query for search

Categories available: automotive, electronics, wearables, home, clothing, sports, beauty, books, digital

Example response:
{
  "primaryIntent": "buy",
  "confidence": 0.9,
  "extractedEntities": {
    "productType": "dash cam",
    "category": "automotive",
    "features": ["wireless", "recording"],
    "useCase": "driving safety",
    "urgency": "immediate"
  },
  "searchTerms": ["dash", "cam", "wireless", "automotive"],
  "processedQuery": "wireless dash cam automotive"
}`;

    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content[0].text;

      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          primaryIntent: result.primaryIntent,
          confidence: result.confidence,
          extractedEntities: result.extractedEntities || {},
          searchTerms: result.searchTerms || [],
          naturalLanguageQuery: query,
          processedQuery: result.processedQuery || query
        };
      }
    } catch (error) {
      console.error('Claude intent recognition error:', error);
    }

    // Fallback
    return {
      primaryIntent: 'browse',
      confidence: 0.3,
      extractedEntities: {},
      searchTerms: this.extractSearchTerms(query),
      naturalLanguageQuery: query,
      processedQuery: this.processQuery(query)
    };
  }

  private enhanceWithEntityExtraction(query: string, intent: UserIntent): UserIntent {
    const enhanced = { ...intent };
    const queryLower = query.toLowerCase();

    // Extract category
    if (!enhanced.extractedEntities.category) {
      for (const [category, keywords] of this.categoryMappings) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
          enhanced.extractedEntities.category = category;
          break;
        }
      }
    }

    // Extract features
    if (!enhanced.extractedEntities.features) {
      enhanced.extractedEntities.features = [];
      for (const [feature, keywords] of this.featureMappings) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
          enhanced.extractedEntities.features.push(feature);
        }
      }
    }

    // Extract price range
    const priceMatch = queryLower.match(/(?:under|below|less than|<)\s*\$?(\d+)|(?:above|over|more than|>)\s*\$?(\d+)|(?:between|from)\s*\$?(\d+)(?:\s*(?:to|and|-)\s*\$?(\d+))?/);
    if (priceMatch && !enhanced.extractedEntities.priceRange) {
      if (priceMatch[1]) {
        enhanced.extractedEntities.priceRange = { max: parseInt(priceMatch[1]) };
      } else if (priceMatch[2]) {
        enhanced.extractedEntities.priceRange = { min: parseInt(priceMatch[2]) };
      } else if (priceMatch[3] && priceMatch[4]) {
        enhanced.extractedEntities.priceRange = { 
          min: parseInt(priceMatch[3]), 
          max: parseInt(priceMatch[4]) 
        };
      }
    }

    // Extract urgency
    if (!enhanced.extractedEntities.urgency) {
      if (/\b(now|immediately|urgent|asap|today)\b/i.test(queryLower)) {
        enhanced.extractedEntities.urgency = 'immediate';
      } else if (/\b(later|future|planning|considering)\b/i.test(queryLower)) {
        enhanced.extractedEntities.urgency = 'planned';
      } else if (/\b(research|learn|understand|compare)\b/i.test(queryLower)) {
        enhanced.extractedEntities.urgency = 'research';
      }
    }

    return enhanced;
  }

  private extractSearchTerms(text: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      'i', 'want', 'to', 'need', 'a', 'an', 'the', 'for', 'with', 'and', 'or',
      'but', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'something', 'that', 'this'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to 10 terms
  }

  private processQuery(query: string): string {
    // Clean and normalize the query for search
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Get intent-based search suggestions
  async getIntentBasedSuggestions(query: string): Promise<string[]> {
    const intent = await this.recognizeIntent(query);
    const suggestions = [];

    // Add category-based suggestions
    if (intent.extractedEntities.category) {
      const categoryKeywords = this.categoryMappings.get(intent.extractedEntities.category) || [];
      suggestions.push(...categoryKeywords.slice(0, 3));
    }

    // Add feature-based suggestions
    if (intent.extractedEntities.features) {
      for (const feature of intent.extractedEntities.features) {
        const featureKeywords = this.featureMappings.get(feature) || [];
        suggestions.push(...featureKeywords.slice(0, 2));
      }
    }

    // Add intent-specific suggestions
    switch (intent.primaryIntent) {
      case 'buy':
        suggestions.push('order', 'purchase', 'buy now');
        break;
      case 'compare':
        suggestions.push('vs', 'comparison', 'difference');
        break;
      case 'recommend':
        suggestions.push('best', 'top rated', 'recommended');
        break;
    }

    return [...new Set(suggestions)].slice(0, 8);
  }
}
