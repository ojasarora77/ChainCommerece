import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { cacheService, hashMessage } from '../cache/CacheService';

interface ProductEmbedding {
  productId: number;
  embedding: number[];
  metadata: {
    name: string;
    description: string;
    category: string;
    features: string[];
    tags: string[];
    synonyms: string[];
  };
}

interface SearchResult {
  product: any;
  relevanceScore: number;
  semanticScore: number;
  matchType: 'exact' | 'semantic' | 'category' | 'feature' | 'synonym';
  matchedTerms: string[];
}

interface SearchContext {
  query: string;
  userIntent?: 'buy' | 'browse' | 'compare' | 'learn';
  category?: string;
  priceRange?: { min?: number; max?: number };
  sustainabilityMin?: number;
  userId?: string;
}

export class SemanticSearchEngine {
  private bedrockClient: BedrockRuntimeClient;
  private productEmbeddings: Map<number, ProductEmbedding> = new Map();
  private categoryMappings: Map<string, string[]> = new Map();
  private synonymMappings: Map<string, string[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.initializeMappings();
  }

  private initializeMappings(): void {
    // Category mappings for semantic understanding
    this.categoryMappings.set('automotive', [
      'car', 'vehicle', 'driving', 'dashboard', 'parking', 'road', 'traffic',
      'safety', 'recording', 'camera', 'dash cam', 'dashcam'
    ]);

    this.categoryMappings.set('electronics', [
      'device', 'gadget', 'tech', 'smart', 'digital', 'wireless', 'bluetooth',
      'wifi', 'connected', 'iot', 'electronic'
    ]);

    this.categoryMappings.set('wearable', [
      'watch', 'tracker', 'fitness', 'health', 'monitor', 'wearable',
      'smartwatch', 'band', 'wrist'
    ]);

    this.categoryMappings.set('home', [
      'house', 'home', 'indoor', 'room', 'living', 'bedroom', 'kitchen',
      'decoration', 'furniture', 'appliance'
    ]);

    // Synonym mappings for better matching
    this.synonymMappings.set('dash cam', [
      'dashboard camera', 'car camera', 'driving recorder', 'vehicle camera',
      'road camera', 'traffic camera', 'automotive camera', 'dashcam'
    ]);

    this.synonymMappings.set('smart watch', [
      'smartwatch', 'wrist computer', 'fitness watch', 'activity tracker',
      'health monitor', 'wearable device'
    ]);

    this.synonymMappings.set('laptop stand', [
      'computer stand', 'notebook stand', 'laptop holder', 'laptop riser',
      'ergonomic stand', 'desk stand'
    ]);
  }

  async initializeProductEmbeddings(products: any[]): Promise<void> {
    console.log('🔄 Initializing semantic search with product embeddings...');
    
    for (const product of products) {
      try {
        const embedding = await this.generateProductEmbedding(product);
        const enhancedMetadata = this.enhanceProductMetadata(product);
        
        this.productEmbeddings.set(product.id, {
          productId: product.id,
          embedding,
          metadata: enhancedMetadata
        });
      } catch (error) {
        console.error(`Failed to generate embedding for product ${product.id}:`, error);
      }
    }
    
    this.isInitialized = true;
    console.log(`✅ Initialized ${this.productEmbeddings.size} product embeddings`);
  }

  private async generateProductEmbedding(product: any): Promise<number[]> {
    // Create comprehensive text representation of the product
    const productText = this.createProductText(product);
    
    try {
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-embed-text-v1',
        body: JSON.stringify({
          inputText: productText
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  private createProductText(product: any): string {
    const features = Array.isArray(product.features) ? product.features.join(', ') : '';
    const certifications = Array.isArray(product.certifications) ? product.certifications.join(', ') : '';
    
    return `
      Product: ${product.name}
      Description: ${product.description}
      Category: ${product.category}
      Features: ${features}
      Certifications: ${certifications}
      Price: $${product.priceUSD}
      Sustainability Score: ${product.sustainabilityScore}
    `.trim();
  }

  private enhanceProductMetadata(product: any): ProductEmbedding['metadata'] {
    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();
    const category = product.category.toLowerCase();
    
    // Extract features and generate tags
    const features = this.extractFeatures(product);
    const tags = this.generateTags(product);
    const synonyms = this.generateSynonyms(product);

    return {
      name: product.name,
      description: product.description,
      category: product.category,
      features,
      tags,
      synonyms
    };
  }

  private extractFeatures(product: any): string[] {
    const features: string[] = [];
    const text = `${product.name} ${product.description}`.toLowerCase();
    
    // Common feature patterns
    const featurePatterns = [
      /(\d+p|4k|hd|uhd)/g, // Video quality
      /(wireless|bluetooth|wifi|wired)/g, // Connectivity
      /(waterproof|water resistant|ip\d+)/g, // Water resistance
      /(solar|battery|rechargeable|usb)/g, // Power
      /(gps|location|tracking)/g, // Location features
      /(ai|smart|intelligent|automated)/g, // AI features
      /(motion detection|loop recording|night vision)/g, // Camera features
    ];

    featurePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        features.push(...matches);
      }
    });

    return [...new Set(features)]; // Remove duplicates
  }

  private generateTags(product: any): string[] {
    const tags = [];
    const text = `${product.name} ${product.description}`.toLowerCase();
    
    // Add category-based tags
    for (const [category, keywords] of this.categoryMappings) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(category);
      }
    }
    
    // Add sustainability tags
    if (product.sustainabilityScore >= 80) tags.push('eco-friendly', 'sustainable');
    if (product.sustainabilityScore >= 90) tags.push('premium-eco');
    
    // Add price tags
    if (product.priceUSD < 50) tags.push('budget-friendly');
    else if (product.priceUSD > 200) tags.push('premium');
    
    return tags;
  }

  private generateSynonyms(product: any): string[] {
    const synonyms = [];
    const name = product.name.toLowerCase();
    
    // Check for known synonym patterns
    for (const [term, termSynonyms] of this.synonymMappings) {
      if (name.includes(term)) {
        synonyms.push(...termSynonyms);
      }
    }
    
    return synonyms;
  }

  async semanticSearch(context: SearchContext): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Semantic search engine not initialized');
    }

    const cacheKey = hashMessage(`semantic-search-${JSON.stringify(context)}`);
    const cached = await cacheService.get(cacheKey) as SearchResult[] | null;
    if (cached) {
      return cached;
    }

    console.log(`🔍 Semantic search for: "${context.query}"`);
    
    // Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(context.query);
    
    // Get all potential matches
    const results: SearchResult[] = [];
    
    for (const [productId, productEmbedding] of this.productEmbeddings) {
      const semanticScore = this.calculateCosineSimilarity(queryEmbedding, productEmbedding.embedding);
      const relevanceScore = this.calculateRelevanceScore(context, productEmbedding, semanticScore);
      
      if (relevanceScore > 0.1) { // Minimum relevance threshold
        results.push({
          product: { id: productId, ...productEmbedding.metadata },
          relevanceScore,
          semanticScore,
          matchType: this.determineMatchType(context.query, productEmbedding),
          matchedTerms: this.findMatchedTerms(context.query, productEmbedding)
        });
      }
    }
    
    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Cache results
    await cacheService.set(cacheKey, results, 300); // 5 minutes
    
    console.log(`✅ Found ${results.length} semantic matches`);
    return results;
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // Enhance query with synonyms and context
    const enhancedQuery = this.enhanceQuery(query);
    
    try {
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-embed-text-v1',
        body: JSON.stringify({
          inputText: enhancedQuery
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      return new Array(1536).fill(0);
    }
  }

  private enhanceQuery(query: string): string {
    let enhanced = query.toLowerCase();
    
    // Add synonyms
    for (const [term, synonyms] of this.synonymMappings) {
      if (enhanced.includes(term)) {
        enhanced += ' ' + synonyms.join(' ');
      }
    }
    
    // Add category context
    for (const [category, keywords] of this.categoryMappings) {
      if (keywords.some(keyword => enhanced.includes(keyword))) {
        enhanced += ` ${category} category`;
      }
    }
    
    return enhanced;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateRelevanceScore(
    context: SearchContext, 
    productEmbedding: ProductEmbedding, 
    semanticScore: number
  ): number {
    let score = semanticScore * 0.6; // Base semantic score (60% weight)
    
    // Exact name match bonus
    if (productEmbedding.metadata.name.toLowerCase().includes(context.query.toLowerCase())) {
      score += 0.3;
    }
    
    // Category match bonus
    if (context.category && productEmbedding.metadata.category.toLowerCase() === context.category.toLowerCase()) {
      score += 0.2;
    }
    
    // Feature match bonus
    const queryWords = context.query.toLowerCase().split(' ');
    const featureMatches = queryWords.filter(word => 
      productEmbedding.metadata.features.some(feature => feature.includes(word))
    );
    score += featureMatches.length * 0.1;
    
    // Tag match bonus
    const tagMatches = queryWords.filter(word =>
      productEmbedding.metadata.tags.some(tag => tag.includes(word))
    );
    score += tagMatches.length * 0.05;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private determineMatchType(query: string, productEmbedding: ProductEmbedding): SearchResult['matchType'] {
    const queryLower = query.toLowerCase();
    const name = productEmbedding.metadata.name.toLowerCase();
    const description = productEmbedding.metadata.description.toLowerCase();
    
    if (name.includes(queryLower) || description.includes(queryLower)) {
      return 'exact';
    }
    
    if (productEmbedding.metadata.synonyms.some(synonym => 
      synonym.toLowerCase().includes(queryLower) || queryLower.includes(synonym.toLowerCase())
    )) {
      return 'synonym';
    }
    
    if (productEmbedding.metadata.features.some(feature =>
      feature.toLowerCase().includes(queryLower) || queryLower.includes(feature.toLowerCase())
    )) {
      return 'feature';
    }
    
    if (productEmbedding.metadata.category.toLowerCase().includes(queryLower)) {
      return 'category';
    }
    
    return 'semantic';
  }

  private findMatchedTerms(query: string, productEmbedding: ProductEmbedding): string[] {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const matched = [];
    
    const allText = [
      productEmbedding.metadata.name,
      productEmbedding.metadata.description,
      ...productEmbedding.metadata.features,
      ...productEmbedding.metadata.tags,
      ...productEmbedding.metadata.synonyms
    ].join(' ').toLowerCase();
    
    for (const word of queryWords) {
      if (allText.includes(word)) {
        matched.push(word);
      }
    }
    
    return matched;
  }

  // Get search suggestions based on partial input
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    const suggestions: string[] = [];
    const queryLower = partialQuery.toLowerCase();
    
    // Add product name suggestions
    for (const [, productEmbedding] of this.productEmbeddings) {
      const name = productEmbedding.metadata.name.toLowerCase();
      if (name.includes(queryLower) && !suggestions.includes(productEmbedding.metadata.name)) {
        suggestions.push(productEmbedding.metadata.name);
      }
    }
    
    // Add category suggestions
    for (const [category, keywords] of this.categoryMappings) {
      if (category.includes(queryLower) || keywords.some(k => k.includes(queryLower))) {
        suggestions.push(category);
      }
    }
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }
}
