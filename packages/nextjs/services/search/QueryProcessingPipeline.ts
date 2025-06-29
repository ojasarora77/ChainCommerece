import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { cacheService, hashMessage } from '../cache/CacheService';

interface ProcessedQuery {
  originalQuery: string;
  cleanedQuery: string;
  expandedQuery: string;
  correctedQuery: string;
  extractedTerms: string[];
  synonyms: string[];
  categories: string[];
  features: string[];
  priceFilters: { min?: number; max?: number };
  brandFilters: string[];
  confidence: number;
  processingSteps: string[];
  suggestions: string[];
}

interface QueryExpansion {
  synonyms: string[];
  relatedTerms: string[];
  categoryTerms: string[];
  featureTerms: string[];
}

interface SpellCorrection {
  correctedQuery: string;
  corrections: Array<{ original: string; corrected: string; confidence: number }>;
  confidence: number;
}

export class QueryProcessingPipeline {
  private bedrockClient: BedrockRuntimeClient;
  private synonymDictionary: Map<string, string[]>;
  private categoryMappings: Map<string, string[]>;
  private commonTypos: Map<string, string>;
  private stopWords: Set<string>;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.initializeDictionaries();
  }

  private initializeDictionaries(): void {
    // Comprehensive synonym dictionary
    this.synonymDictionary = new Map([
      ['camera', ['cam', 'recorder', 'recording device', 'video device']],
      ['dash cam', ['dashboard camera', 'car camera', 'driving recorder', 'vehicle camera', 'dashcam', 'auto cam']],
      ['smart watch', ['smartwatch', 'wrist computer', 'fitness watch', 'activity tracker', 'digital watch']],
      ['laptop stand', ['computer stand', 'notebook stand', 'laptop holder', 'laptop riser', 'desk stand']],
      ['wireless', ['cordless', 'bluetooth', 'wifi', 'remote', 'untethered']],
      ['fitness', ['exercise', 'workout', 'health', 'activity', 'training']],
      ['tracker', ['monitor', 'sensor', 'detector', 'counter', 'measurer']],
      ['sustainable', ['eco-friendly', 'green', 'environmentally friendly', 'eco', 'sustainable']],
      ['bamboo', ['eco-wood', 'sustainable wood', 'green material']],
      ['hemp', ['organic fiber', 'natural fiber', 'eco fabric']],
      ['led', ['light', 'lighting', 'illumination', 'lamp']],
      ['strip', ['band', 'tape', 'ribbon', 'line']],
      ['planter', ['pot', 'container', 'garden pot', 'plant holder']],
      ['serum', ['treatment', 'essence', 'concentrate', 'formula']],
      ['resistance', ['strength', 'training', 'exercise', 'workout']],
      ['band', ['strap', 'belt', 'tie', 'loop']],
      ['guide', ['handbook', 'manual', 'book', 'tutorial']],
      ['crypto', ['cryptocurrency', 'digital currency', 'blockchain']],
      ['nft', ['non-fungible token', 'digital asset', 'crypto art']],
      ['earbuds', ['earphones', 'headphones', 'ear pieces', 'audio devices']]
    ]);

    // Category mappings for better understanding
    this.categoryMappings = new Map([
      ['automotive', ['car', 'vehicle', 'driving', 'dashboard', 'auto', 'motor', 'transport']],
      ['electronics', ['device', 'gadget', 'tech', 'electronic', 'digital', 'smart']],
      ['wearables', ['watch', 'tracker', 'wearable', 'fitness', 'health', 'monitor']],
      ['home', ['house', 'indoor', 'room', 'decoration', 'furniture', 'living']],
      ['clothing', ['apparel', 'wear', 'clothes', 'garment', 'fashion']],
      ['sports', ['fitness', 'exercise', 'workout', 'training', 'athletic']],
      ['beauty', ['skincare', 'cosmetic', 'beauty', 'care', 'treatment']],
      ['books', ['reading', 'literature', 'guide', 'manual', 'handbook']],
      ['digital', ['virtual', 'online', 'digital', 'cyber', 'electronic']]
    ]);

    // Common typos and corrections
    this.commonTypos = new Map([
      ['dashcam', 'dash cam'],
      ['smartwatch', 'smart watch'],
      ['laptp', 'laptop'],
      ['wireles', 'wireless'],
      ['fitnes', 'fitness'],
      ['sustanible', 'sustainable'],
      ['bambo', 'bamboo'],
      ['earbud', 'earbuds'],
      ['resistence', 'resistance'],
      ['plater', 'planter'],
      ['guid', 'guide'],
      ['cryto', 'crypto'],
      ['automat', 'automate'],
      ['cam', 'camera'],
      ['devic', 'device'],
      ['electonic', 'electronic'],
      ['moniter', 'monitor'],
      ['recoder', 'recorder'],
      ['wirless', 'wireless']
    ]);

    // Stop words to filter out
    this.stopWords = new Set([
      'i', 'want', 'to', 'need', 'a', 'an', 'the', 'for', 'with', 'and', 'or',
      'but', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'something', 'that', 'this', 'get',
      'find', 'search', 'show', 'me', 'buy', 'order', 'purchase'
    ]);
  }

  async processQuery(query: string): Promise<ProcessedQuery> {
    const cacheKey = hashMessage(`query-processing-${query}`);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    console.log(`🔄 Processing query: "${query}"`);
    
    const processingSteps: string[] = [];
    let currentQuery = query;

    // Step 1: Basic cleaning
    const cleanedQuery = this.cleanQuery(currentQuery);
    processingSteps.push(`Cleaned: "${cleanedQuery}"`);
    currentQuery = cleanedQuery;

    // Step 2: Spell correction
    const spellCorrection = await this.correctSpelling(currentQuery);
    if (spellCorrection.correctedQuery !== currentQuery) {
      processingSteps.push(`Spell corrected: "${spellCorrection.correctedQuery}"`);
      currentQuery = spellCorrection.correctedQuery;
    }

    // Step 3: Extract structured information
    const extractedTerms = this.extractTerms(currentQuery);
    const categories = this.extractCategories(currentQuery);
    const features = this.extractFeatures(currentQuery);
    const priceFilters = this.extractPriceFilters(currentQuery);
    const brandFilters = this.extractBrandFilters(currentQuery);

    // Step 4: Query expansion
    const expansion = await this.expandQuery(currentQuery);
    const expandedQuery = this.buildExpandedQuery(currentQuery, expansion);
    processingSteps.push(`Expanded with ${expansion.synonyms.length} synonyms`);

    // Step 5: Generate suggestions
    const suggestions = await this.generateSuggestions(currentQuery);

    // Step 6: Calculate confidence
    const confidence = this.calculateProcessingConfidence(
      query, 
      currentQuery, 
      extractedTerms, 
      spellCorrection
    );

    const result: ProcessedQuery = {
      originalQuery: query,
      cleanedQuery,
      expandedQuery,
      correctedQuery: spellCorrection.correctedQuery,
      extractedTerms,
      synonyms: expansion.synonyms,
      categories,
      features,
      priceFilters,
      brandFilters,
      confidence,
      processingSteps,
      suggestions
    };

    // Cache the result
    await cacheService.set(cacheKey, result, 300); // 5 minutes

    console.log(`✅ Query processed with confidence: ${confidence.toFixed(2)}`);
    return result;
  }

  private cleanQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s$-]/g, ' ') // Keep alphanumeric, spaces, $ and -
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private async correctSpelling(query: string): Promise<SpellCorrection> {
    const words = query.split(' ');
    const corrections: SpellCorrection['corrections'] = [];
    let correctedWords = [...words];
    let hasCorrections = false;

    // Check for common typos first
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (this.commonTypos.has(word)) {
        const correction = this.commonTypos.get(word)!;
        corrections.push({ original: word, corrected: correction, confidence: 0.9 });
        correctedWords[i] = correction;
        hasCorrections = true;
      }
    }

    // Use Claude for more complex spell checking if needed
    if (!hasCorrections && query.length > 3) {
      try {
        const claudeCorrection = await this.correctSpellingWithClaude(query);
        if (claudeCorrection.correctedQuery !== query) {
          return claudeCorrection;
        }
      } catch (error) {
        console.warn('Claude spell correction failed:', error);
      }
    }

    return {
      correctedQuery: correctedWords.join(' '),
      corrections,
      confidence: hasCorrections ? 0.9 : 1.0
    };
  }

  private async correctSpellingWithClaude(query: string): Promise<SpellCorrection> {
    const prompt = `Correct any spelling errors in this product search query. Only fix obvious typos, don't change the meaning or add words.

Query: "${query}"

If there are spelling errors, respond with JSON:
{
  "correctedQuery": "corrected version",
  "corrections": [{"original": "typo", "corrected": "fixed", "confidence": 0.9}],
  "confidence": 0.9
}

If no corrections needed, respond with:
{
  "correctedQuery": "${query}",
  "corrections": [],
  "confidence": 1.0
}`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      correctedQuery: query,
      corrections: [],
      confidence: 1.0
    };
  }

  private extractTerms(query: string): string[] {
    return query
      .split(' ')
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .slice(0, 10); // Limit to 10 terms
  }

  private extractCategories(query: string): string[] {
    const categories = [];
    const queryLower = query.toLowerCase();

    for (const [category, keywords] of this.categoryMappings) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        categories.push(category);
      }
    }

    return categories;
  }

  private extractFeatures(query: string): string[] {
    const features = [];
    const queryLower = query.toLowerCase();

    const featurePatterns = [
      { pattern: /wireless|bluetooth|wifi/i, feature: 'wireless' },
      { pattern: /smart|ai|intelligent/i, feature: 'smart' },
      { pattern: /sustainable|eco|green|bamboo|hemp/i, feature: 'sustainable' },
      { pattern: /fitness|health|exercise/i, feature: 'fitness' },
      { pattern: /recording|camera|video/i, feature: 'recording' },
      { pattern: /solar|battery|rechargeable/i, feature: 'power' },
      { pattern: /waterproof|water resistant/i, feature: 'waterproof' },
      { pattern: /led|light|lighting/i, feature: 'lighting' }
    ];

    for (const { pattern, feature } of featurePatterns) {
      if (pattern.test(queryLower)) {
        features.push(feature);
      }
    }

    return features;
  }

  private extractPriceFilters(query: string): { min?: number; max?: number } {
    const priceFilters: { min?: number; max?: number } = {};

    // Match patterns like "under $100", "below 50", "less than $200"
    const underMatch = query.match(/(?:under|below|less than|<)\s*\$?(\d+)/i);
    if (underMatch) {
      priceFilters.max = parseInt(underMatch[1]);
    }

    // Match patterns like "over $100", "above 50", "more than $200"
    const overMatch = query.match(/(?:over|above|more than|>)\s*\$?(\d+)/i);
    if (overMatch) {
      priceFilters.min = parseInt(overMatch[1]);
    }

    // Match patterns like "between $50 and $100", "$50-$100"
    const rangeMatch = query.match(/(?:between|from)\s*\$?(\d+)(?:\s*(?:to|and|-)\s*\$?(\d+))?/i);
    if (rangeMatch && rangeMatch[2]) {
      priceFilters.min = parseInt(rangeMatch[1]);
      priceFilters.max = parseInt(rangeMatch[2]);
    }

    return priceFilters;
  }

  private extractBrandFilters(query: string): string[] {
    // For now, return empty array. Could be enhanced with brand recognition
    return [];
  }

  private async expandQuery(query: string): Promise<QueryExpansion> {
    const synonyms = new Set<string>();
    const relatedTerms = new Set<string>();
    const categoryTerms = new Set<string>();
    const featureTerms = new Set<string>();

    const words = query.toLowerCase().split(' ');

    // Add synonyms from dictionary
    for (const word of words) {
      // Check for exact matches
      if (this.synonymDictionary.has(word)) {
        this.synonymDictionary.get(word)!.forEach(syn => synonyms.add(syn));
      }

      // Check for partial matches in compound terms
      for (const [term, termSynonyms] of this.synonymDictionary) {
        if (query.includes(term)) {
          termSynonyms.forEach(syn => synonyms.add(syn));
        }
      }
    }

    // Add category-related terms
    for (const [category, keywords] of this.categoryMappings) {
      if (keywords.some(keyword => query.includes(keyword))) {
        keywords.forEach(term => categoryTerms.add(term));
      }
    }

    return {
      synonyms: Array.from(synonyms),
      relatedTerms: Array.from(relatedTerms),
      categoryTerms: Array.from(categoryTerms),
      featureTerms: Array.from(featureTerms)
    };
  }

  private buildExpandedQuery(originalQuery: string, expansion: QueryExpansion): string {
    const parts = [originalQuery];
    
    // Add top synonyms (limit to avoid query explosion)
    if (expansion.synonyms.length > 0) {
      parts.push(expansion.synonyms.slice(0, 5).join(' '));
    }

    // Add category terms
    if (expansion.categoryTerms.length > 0) {
      parts.push(expansion.categoryTerms.slice(0, 3).join(' '));
    }

    return parts.join(' ');
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Add synonym-based suggestions
    for (const [term, synonyms] of this.synonymDictionary) {
      if (queryLower.includes(term)) {
        synonyms.slice(0, 2).forEach(syn => suggestions.add(syn));
      }
    }

    // Add category-based suggestions
    for (const [category, keywords] of this.categoryMappings) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        suggestions.add(category);
        keywords.slice(0, 2).forEach(keyword => suggestions.add(keyword));
      }
    }

    // Add completion suggestions
    if (queryLower.includes('dash')) suggestions.add('dash cam');
    if (queryLower.includes('smart')) suggestions.add('smart watch');
    if (queryLower.includes('laptop')) suggestions.add('laptop stand');
    if (queryLower.includes('fitness')) suggestions.add('fitness tracker');

    return Array.from(suggestions).slice(0, 8);
  }

  private calculateProcessingConfidence(
    originalQuery: string,
    processedQuery: string,
    extractedTerms: string[],
    spellCorrection: SpellCorrection
  ): number {
    let confidence = 0.8; // Base confidence

    // Boost for successful term extraction
    if (extractedTerms.length > 0) {
      confidence += 0.1;
    }

    // Reduce confidence if major spell corrections were needed
    if (spellCorrection.corrections.length > 0) {
      confidence -= 0.1 * spellCorrection.corrections.length;
    }

    // Boost for longer, more specific queries
    if (originalQuery.length > 10) {
      confidence += 0.05;
    }

    // Boost for recognized patterns
    if (originalQuery.includes('dash cam') || originalQuery.includes('smart watch')) {
      confidence += 0.1;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  // Get query suggestions for autocomplete
  async getQuerySuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = partialQuery.toLowerCase();

    // Add matching terms from synonym dictionary
    for (const [term, synonyms] of this.synonymDictionary) {
      if (term.startsWith(queryLower)) {
        suggestions.add(term);
      }
      synonyms.forEach(syn => {
        if (syn.startsWith(queryLower)) {
          suggestions.add(syn);
        }
      });
    }

    // Add matching category terms
    for (const [category, keywords] of this.categoryMappings) {
      if (category.startsWith(queryLower)) {
        suggestions.add(category);
      }
      keywords.forEach(keyword => {
        if (keyword.startsWith(queryLower)) {
          suggestions.add(keyword);
        }
      });
    }

    return Array.from(suggestions).slice(0, 8);
  }
}
