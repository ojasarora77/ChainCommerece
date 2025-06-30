import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { cacheService, hashMessage } from '../cache/CacheService';

interface EnhancedProduct {
  id: number;
  originalData: any;
  enhancedData: {
    semanticTags: string[];
    synonyms: string[];
    features: string[];
    useCases: string[];
    targetAudience: string[];
    searchKeywords: string[];
    categoryHierarchy: string[];
    relatedProducts: number[];
    searchableText: string;
    nlpFeatures: {
      sentiment: number;
      complexity: number;
      trustworthiness: number;
    };
  };
  lastEnhanced: Date;
}

interface ProductEnhancementRules {
  categoryRules: Map<string, CategoryRule>;
  featureExtractors: FeatureExtractor[];
  synonymMappings: Map<string, string[]>;
  useCaseMappings: Map<string, string[]>;
}

interface CategoryRule {
  requiredKeywords: string[];
  commonFeatures: string[];
  typicalUseCases: string[];
  relatedCategories: string[];
  searchBoosts: string[];
}

interface FeatureExtractor {
  pattern: RegExp;
  featureType: string;
  confidence: number;
  extractor: (match: RegExpMatchArray, product: any) => string[];
}

export class ProductKnowledgeEnhancer {
  private bedrockClient: BedrockRuntimeClient;
  private enhancementRules: ProductEnhancementRules = {
    categoryRules: new Map(),
    featureExtractors: [],
    synonymMappings: new Map(),
    useCaseMappings: new Map()
  };
  private enhancedProducts: Map<number, EnhancedProduct> = new Map();

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.initializeEnhancementRules();
  }

  private initializeEnhancementRules(): void {
    this.enhancementRules = {
      categoryRules: new Map(),
      featureExtractors: [],
      synonymMappings: new Map(),
      useCaseMappings: new Map()
    };

    this.setupCategoryRules();
    this.setupFeatureExtractors();
    this.setupSynonymMappings();
    this.setupUseCaseMappings();
  }

  private setupCategoryRules(): void {
    this.enhancementRules.categoryRules.set('automotive', {
      requiredKeywords: ['car', 'vehicle', 'driving', 'automotive'],
      commonFeatures: ['wireless', 'recording', 'safety', 'monitoring'],
      typicalUseCases: ['driving safety', 'vehicle monitoring', 'parking assistance', 'evidence recording'],
      relatedCategories: ['electronics', 'safety'],
      searchBoosts: ['dash cam', 'car camera', 'vehicle recorder']
    });

    this.enhancementRules.categoryRules.set('electronics', {
      requiredKeywords: ['electronic', 'device', 'smart', 'digital'],
      commonFeatures: ['wireless', 'bluetooth', 'wifi', 'smart', 'connected'],
      typicalUseCases: ['home automation', 'productivity', 'entertainment', 'communication'],
      relatedCategories: ['home', 'wearables'],
      searchBoosts: ['gadget', 'device', 'tech']
    });

    this.enhancementRules.categoryRules.set('wearables', {
      requiredKeywords: ['watch', 'tracker', 'wearable', 'fitness'],
      commonFeatures: ['health monitoring', 'fitness tracking', 'notifications', 'battery life'],
      typicalUseCases: ['fitness tracking', 'health monitoring', 'notifications', 'time keeping'],
      relatedCategories: ['electronics', 'sports'],
      searchBoosts: ['smartwatch', 'fitness tracker', 'health monitor']
    });

    this.enhancementRules.categoryRules.set('home', {
      requiredKeywords: ['home', 'house', 'indoor', 'room'],
      commonFeatures: ['smart', 'automated', 'energy efficient', 'decorative'],
      typicalUseCases: ['home decoration', 'automation', 'lighting', 'gardening'],
      relatedCategories: ['electronics'],
      searchBoosts: ['home improvement', 'decoration', 'smart home']
    });
  }

  private setupFeatureExtractors(): void {
    this.enhancementRules.featureExtractors = [
      {
        pattern: /(\d+p|4k|hd|uhd|1080p|720p)/gi,
        featureType: 'video_quality',
        confidence: 0.9,
        extractor: (match) => [`${match[1].toUpperCase()} video quality`]
      },
      {
        pattern: /(wireless|bluetooth|wifi|wired|usb|cable)/gi,
        featureType: 'connectivity',
        confidence: 0.8,
        extractor: (match) => [`${match[1]} connectivity`]
      },
      {
        pattern: /(waterproof|water resistant|ip\d+|splash proof)/gi,
        featureType: 'durability',
        confidence: 0.9,
        extractor: (match) => [`${match[1]} protection`]
      },
      {
        pattern: /(solar|battery|rechargeable|usb charging|wireless charging)/gi,
        featureType: 'power',
        confidence: 0.8,
        extractor: (match) => [`${match[1]} power`]
      },
      {
        pattern: /(ai|smart|intelligent|automated|machine learning)/gi,
        featureType: 'intelligence',
        confidence: 0.9,
        extractor: (match) => [`${match[1]} technology`]
      },
      {
        pattern: /(motion detection|night vision|loop recording|gps|tracking)/gi,
        featureType: 'advanced_features',
        confidence: 0.9,
        extractor: (match) => [match[1]]
      },
      {
        pattern: /(bamboo|hemp|organic|recycled|sustainable|eco-friendly)/gi,
        featureType: 'sustainability',
        confidence: 0.9,
        extractor: (match) => [`${match[1]} material`]
      }
    ];
  }

  private setupSynonymMappings(): void {
    this.enhancementRules.synonymMappings.set('dash cam', [
      'dashboard camera', 'car camera', 'driving recorder', 'vehicle camera',
      'road camera', 'traffic camera', 'automotive camera', 'dashcam',
      'car recorder', 'driving cam', 'vehicle recorder'
    ]);

    this.enhancementRules.synonymMappings.set('smart watch', [
      'smartwatch', 'wrist computer', 'fitness watch', 'activity tracker',
      'health monitor', 'wearable device', 'digital watch', 'connected watch'
    ]);

    this.enhancementRules.synonymMappings.set('laptop stand', [
      'computer stand', 'notebook stand', 'laptop holder', 'laptop riser',
      'ergonomic stand', 'desk stand', 'laptop support', 'computer holder'
    ]);

    this.enhancementRules.synonymMappings.set('fitness tracker', [
      'activity tracker', 'health monitor', 'step counter', 'fitness band',
      'activity monitor', 'health tracker', 'fitness device'
    ]);
  }

  private setupUseCaseMappings(): void {
    this.enhancementRules.useCaseMappings.set('recording while driving', [
      'dash cam', 'car camera', 'vehicle recorder', 'driving recorder'
    ]);

    this.enhancementRules.useCaseMappings.set('fitness tracking', [
      'fitness tracker', 'smart watch', 'activity monitor', 'health tracker'
    ]);

    this.enhancementRules.useCaseMappings.set('home lighting', [
      'led strip', 'smart lights', 'home lighting', 'ambient lighting'
    ]);

    this.enhancementRules.useCaseMappings.set('ergonomic workspace', [
      'laptop stand', 'ergonomic stand', 'desk accessories', 'workspace setup'
    ]);
  }

  async enhanceProduct(product: any): Promise<EnhancedProduct> {
    const cacheKey = hashMessage(`product-enhancement-${product.id}-${JSON.stringify(product)}`);
    const cached = await cacheService.get(cacheKey) as EnhancedProduct | null;
    if (cached) {
      return cached;
    }

    console.log(`🔧 Enhancing product: ${product.name}`);

    const enhanced: EnhancedProduct = {
      id: product.id,
      originalData: product,
      enhancedData: {
        semanticTags: [],
        synonyms: [],
        features: [],
        useCases: [],
        targetAudience: [],
        searchKeywords: [],
        categoryHierarchy: [],
        relatedProducts: [],
        searchableText: '',
        nlpFeatures: {
          sentiment: 0,
          complexity: 0,
          trustworthiness: 0
        }
      },
      lastEnhanced: new Date()
    };

    // Extract basic features using rules
    enhanced.enhancedData.features = this.extractFeatures(product);
    
    // Generate semantic tags
    enhanced.enhancedData.semanticTags = this.generateSemanticTags(product);
    
    // Generate synonyms
    enhanced.enhancedData.synonyms = this.generateSynonyms(product);
    
    // Extract use cases
    enhanced.enhancedData.useCases = this.extractUseCases(product);
    
    // Generate search keywords
    enhanced.enhancedData.searchKeywords = this.generateSearchKeywords(product);
    
    // Build category hierarchy
    enhanced.enhancedData.categoryHierarchy = this.buildCategoryHierarchy(product);
    
    // Create searchable text
    enhanced.enhancedData.searchableText = this.createSearchableText(enhanced);

    // Use Claude for advanced enhancement
    try {
      const claudeEnhancement = await this.enhanceWithClaude(product);
      this.mergeClaudeEnhancement(enhanced, claudeEnhancement);
    } catch (error) {
      console.warn('Claude enhancement failed, using rule-based only:', error);
    }

    // Cache the result
    await cacheService.set(cacheKey, enhanced, 3600); // 1 hour cache

    this.enhancedProducts.set(product.id, enhanced);
    console.log(`✅ Enhanced product ${product.name} with ${enhanced.enhancedData.searchKeywords.length} keywords`);

    return enhanced;
  }

  private extractFeatures(product: any): string[] {
    const features = new Set<string>();
    const text = `${product.name} ${product.description}`.toLowerCase();

    // Apply feature extractors
    for (const extractor of this.enhancementRules.featureExtractors) {
      const matches = text.matchAll(extractor.pattern);
      for (const match of matches) {
        const extractedFeatures = extractor.extractor(match, product);
        extractedFeatures.forEach(feature => features.add(feature));
      }
    }

    // Add category-specific features
    const categoryRule = this.enhancementRules.categoryRules.get(product.category.toLowerCase());
    if (categoryRule) {
      categoryRule.commonFeatures.forEach(feature => {
        if (text.includes(feature.toLowerCase())) {
          features.add(feature);
        }
      });
    }

    return Array.from(features);
  }

  private generateSemanticTags(product: any): string[] {
    const tags = new Set<string>();
    const text = `${product.name} ${product.description}`.toLowerCase();

    // Add category-based tags
    tags.add(product.category.toLowerCase());
    
    // Add sustainability tags
    if (product.sustainabilityScore >= 80) {
      tags.add('eco-friendly');
      tags.add('sustainable');
    }
    if (product.sustainabilityScore >= 90) {
      tags.add('premium-eco');
    }

    // Add price-based tags
    const price = product.priceUSD || 0;
    if (price < 50) tags.add('budget-friendly');
    else if (price < 100) tags.add('affordable');
    else if (price < 200) tags.add('mid-range');
    else if (price < 500) tags.add('premium');
    else tags.add('luxury');

    // Add technology tags
    if (text.includes('smart') || text.includes('ai')) tags.add('smart-technology');
    if (text.includes('wireless') || text.includes('bluetooth')) tags.add('wireless-technology');
    if (text.includes('solar') || text.includes('battery')) tags.add('portable-power');

    return Array.from(tags);
  }

  private generateSynonyms(product: any): string[] {
    const synonyms = new Set<string>();
    const name = product.name.toLowerCase();

    // Check for known synonym patterns
    for (const [term, termSynonyms] of this.enhancementRules.synonymMappings) {
      if (name.includes(term)) {
        termSynonyms.forEach(synonym => synonyms.add(synonym));
      }
    }

    // Generate contextual synonyms
    if (name.includes('cam') || name.includes('camera')) {
      synonyms.add('recorder');
      synonyms.add('recording device');
    }

    if (name.includes('watch') || name.includes('tracker')) {
      synonyms.add('wearable');
      synonyms.add('monitor');
    }

    return Array.from(synonyms);
  }

  private extractUseCases(product: any): string[] {
    const useCases = new Set<string>();
    const text = `${product.name} ${product.description}`.toLowerCase();

    // Check use case mappings
    for (const [useCase, keywords] of this.enhancementRules.useCaseMappings) {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        useCases.add(useCase);
      }
    }

    // Category-specific use cases
    const categoryRule = this.enhancementRules.categoryRules.get(product.category.toLowerCase());
    if (categoryRule) {
      categoryRule.typicalUseCases.forEach(useCase => useCases.add(useCase));
    }

    return Array.from(useCases);
  }

  private generateSearchKeywords(product: any): string[] {
    const keywords = new Set<string>();

    // Add product name words
    product.name.toLowerCase().split(' ').forEach((word: string) => {
      if (word.length > 2) keywords.add(word);
    });

    // Add category keywords
    const categoryRule = this.enhancementRules.categoryRules.get(product.category.toLowerCase());
    if (categoryRule) {
      categoryRule.searchBoosts.forEach(keyword => keywords.add(keyword));
    }

    // Add feature-based keywords
    this.extractFeatures(product).forEach(feature => {
      feature.split(' ').forEach(word => {
        if (word.length > 2) keywords.add(word.toLowerCase());
      });
    });

    return Array.from(keywords);
  }

  private buildCategoryHierarchy(product: any): string[] {
    const hierarchy = [product.category.toLowerCase()];
    
    const categoryRule = this.enhancementRules.categoryRules.get(product.category.toLowerCase());
    if (categoryRule) {
      hierarchy.push(...categoryRule.relatedCategories);
    }

    return hierarchy;
  }

  private createSearchableText(enhanced: EnhancedProduct): string {
    const parts = [
      enhanced.originalData.name,
      enhanced.originalData.description,
      enhanced.enhancedData.features.join(' '),
      enhanced.enhancedData.synonyms.join(' '),
      enhanced.enhancedData.useCases.join(' '),
      enhanced.enhancedData.searchKeywords.join(' '),
      enhanced.enhancedData.semanticTags.join(' ')
    ];

    return parts.join(' ').toLowerCase();
  }

  private async enhanceWithClaude(product: any): Promise<any> {
    const prompt = `Analyze this product and provide additional search enhancement data:

Product: ${product.name}
Description: ${product.description}
Category: ${product.category}
Price: $${product.priceUSD}
Sustainability Score: ${product.sustainabilityScore}

Please provide a JSON response with:
1. targetAudience: array of target customer types
2. additionalUseCases: array of use cases not obvious from description
3. searchKeywords: array of additional search terms users might use
4. relatedProducts: array of product types that users might also search for
5. sentiment: number 0-1 (how positive the product description sounds)
6. trustworthiness: number 0-1 (how trustworthy the product seems)

Example response:
{
  "targetAudience": ["tech enthusiasts", "eco-conscious consumers"],
  "additionalUseCases": ["gift giving", "professional use"],
  "searchKeywords": ["innovative", "cutting-edge", "reliable"],
  "relatedProducts": ["accessories", "complementary devices"],
  "sentiment": 0.8,
  "trustworthiness": 0.9
}`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
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

    return {};
  }

  private mergeClaudeEnhancement(enhanced: EnhancedProduct, claudeData: any): void {
    if (claudeData.targetAudience) {
      enhanced.enhancedData.targetAudience = claudeData.targetAudience;
    }

    if (claudeData.additionalUseCases) {
      enhanced.enhancedData.useCases.push(...claudeData.additionalUseCases);
    }

    if (claudeData.searchKeywords) {
      enhanced.enhancedData.searchKeywords.push(...claudeData.searchKeywords);
    }

    if (claudeData.sentiment !== undefined) {
      enhanced.enhancedData.nlpFeatures.sentiment = claudeData.sentiment;
    }

    if (claudeData.trustworthiness !== undefined) {
      enhanced.enhancedData.nlpFeatures.trustworthiness = claudeData.trustworthiness;
    }

    // Recalculate searchable text with new data
    enhanced.enhancedData.searchableText = this.createSearchableText(enhanced);
  }

  async enhanceAllProducts(products: any[]): Promise<EnhancedProduct[]> {
    console.log(`🔧 Enhancing ${products.length} products...`);
    
    const enhanced = [];
    for (const product of products) {
      try {
        const enhancedProduct = await this.enhanceProduct(product);
        enhanced.push(enhancedProduct);
      } catch (error) {
        console.error(`Failed to enhance product ${product.id}:`, error);
        // Create minimal enhancement as fallback
        enhanced.push({
          id: product.id,
          originalData: product,
          enhancedData: {
            semanticTags: [product.category.toLowerCase()],
            synonyms: [],
            features: [],
            useCases: [],
            targetAudience: [],
            searchKeywords: product.name.toLowerCase().split(' '),
            categoryHierarchy: [product.category.toLowerCase()],
            relatedProducts: [],
            searchableText: `${product.name} ${product.description}`.toLowerCase(),
            nlpFeatures: { sentiment: 0.5, complexity: 0.5, trustworthiness: 0.5 }
          },
          lastEnhanced: new Date()
        });
      }
    }

    console.log(`✅ Enhanced ${enhanced.length} products`);
    return enhanced;
  }

  getEnhancedProduct(productId: number): EnhancedProduct | undefined {
    return this.enhancedProducts.get(productId);
  }

  getAllEnhancedProducts(): EnhancedProduct[] {
    return Array.from(this.enhancedProducts.values());
  }
}
