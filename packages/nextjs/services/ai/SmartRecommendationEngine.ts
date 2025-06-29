import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { cacheService, hashMessage } from '../cache/CacheService';

interface Product {
  id: number;
  name: string;
  price: number;
  sustainabilityScore: number;
  category: string;
  description: string;
  features: string[];
  inStock: boolean;
  seller: string;
}

interface UserPreferences {
  categories?: string[];
  maxPrice?: number;
  minSustainabilityScore?: number;
  preferredFeatures?: string[];
  previousPurchases?: string[];
  sustainabilityFocus?: boolean;
}

interface RecommendationContext {
  userQuery: string;
  preferences: UserPreferences;
  contextType: 'search' | 'browse' | 'purchase' | 'comparison';
  sessionHistory?: string[];
}

export class SmartRecommendationEngine {
  private client: BedrockAgentRuntimeClient;
  private knowledgeBaseId: string;

  constructor() {
    this.client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    
    this.knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'J8UI0TGPTI';
  }

  async getSmartRecommendations(
    context: RecommendationContext,
    availableProducts: Product[],
    maxRecommendations: number = 5
  ): Promise<{
    recommendations: Product[];
    reasoning: string;
    confidence: number;
    alternativeOptions: Product[];
    knowledgeBaseUsed: boolean;
  }> {
    const cacheKey = hashMessage(`smart-rec-${JSON.stringify(context)}-${availableProducts.length}`);
    
    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      // Get Knowledge Base insights
      const kbInsights = await this.getKnowledgeBaseInsights(context);
      
      // Combine KB insights with smart contract data
      const smartRecommendations = await this.generateSmartRecommendations(
        context,
        availableProducts,
        kbInsights,
        maxRecommendations
      );

      // Cache the result
      await cacheService.set(cacheKey, smartRecommendations, 600); // 10 minutes

      return smartRecommendations;

    } catch (error) {
      console.error('Smart recommendation error:', error);
      
      // Fallback to rule-based recommendations
      return this.getFallbackRecommendations(context, availableProducts, maxRecommendations);
    }
  }

  private async getKnowledgeBaseInsights(context: RecommendationContext): Promise<{
    insights: string;
    productMatches: string[];
    categoryRecommendations: string[];
  }> {
    const query = this.buildKnowledgeBaseQuery(context);
    
    try {
      const command = new RetrieveAndGenerateCommand({
        input: {
          text: query,
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: this.knowledgeBaseId,
            modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
            retrievalConfiguration: {
              vectorSearchConfiguration: {
                numberOfResults: 8,
              },
            },
          },
        },
      });

      const response = await this.client.send(command);
      
      return {
        insights: response.output?.text || '',
        productMatches: this.extractProductNames(response.output?.text || ''),
        categoryRecommendations: this.extractCategories(response.output?.text || ''),
      };
    } catch (error) {
      console.log('KB insights failed, using fallback:', error.message);
      return {
        insights: 'Knowledge base temporarily unavailable',
        productMatches: [],
        categoryRecommendations: [],
      };
    }
  }

  private buildKnowledgeBaseQuery(context: RecommendationContext): string {
    let query = `Recommend sustainable products for a user interested in: ${context.userQuery}`;
    
    if (context.preferences.categories && context.preferences.categories.length > 0) {
      query += ` Categories of interest: ${context.preferences.categories.join(', ')}.`;
    }
    
    if (context.preferences.maxPrice) {
      query += ` Budget limit: $${context.preferences.maxPrice}.`;
    }
    
    if (context.preferences.minSustainabilityScore) {
      query += ` Minimum sustainability score: ${context.preferences.minSustainabilityScore}.`;
    }
    
    if (context.preferences.preferredFeatures && context.preferences.preferredFeatures.length > 0) {
      query += ` Preferred features: ${context.preferences.preferredFeatures.join(', ')}.`;
    }
    
    if (context.preferences.previousPurchases && context.preferences.previousPurchases.length > 0) {
      query += ` Previous purchases: ${context.preferences.previousPurchases.join(', ')}.`;
    }
    
    query += ' Provide specific product recommendations with names, key features, and sustainability benefits.';
    
    return query;
  }

  private async generateSmartRecommendations(
    context: RecommendationContext,
    availableProducts: Product[],
    kbInsights: any,
    maxRecommendations: number
  ): Promise<{
    recommendations: Product[];
    reasoning: string;
    confidence: number;
    alternativeOptions: Product[];
    knowledgeBaseUsed: boolean;
  }> {
    // Score products based on multiple factors
    const scoredProducts = availableProducts.map(product => ({
      ...product,
      score: this.calculateProductScore(product, context, kbInsights),
    }));

    // Sort by score and filter
    const sortedProducts = scoredProducts
      .filter(product => this.meetsUserCriteria(product, context.preferences))
      .sort((a, b) => b.score - a.score);

    const recommendations = sortedProducts.slice(0, maxRecommendations);
    const alternativeOptions = sortedProducts.slice(maxRecommendations, maxRecommendations + 3);

    const reasoning = this.generateReasoning(recommendations, context, kbInsights);
    const confidence = this.calculateConfidence(recommendations, kbInsights);

    return {
      recommendations,
      reasoning,
      confidence,
      alternativeOptions,
      knowledgeBaseUsed: kbInsights.insights !== 'Knowledge base temporarily unavailable',
    };
  }

  private calculateProductScore(product: Product, context: RecommendationContext, kbInsights: any): number {
    let score = 0;

    // Base sustainability score (0-40 points)
    score += (product.sustainabilityScore / 100) * 40;

    // Price attractiveness (0-20 points)
    if (context.preferences.maxPrice) {
      const priceRatio = product.price / context.preferences.maxPrice;
      score += Math.max(0, (1 - priceRatio) * 20);
    } else {
      score += 10; // Default points if no price preference
    }

    // Category match (0-15 points)
    if (context.preferences.categories?.includes(product.category)) {
      score += 15;
    }

    // Feature match (0-15 points)
    if (context.preferences.preferredFeatures) {
      const featureMatches = product.features.filter(feature =>
        context.preferences.preferredFeatures!.some(pref =>
          feature.toLowerCase().includes(pref.toLowerCase())
        )
      ).length;
      score += (featureMatches / Math.max(context.preferences.preferredFeatures.length, 1)) * 15;
    }

    // Knowledge Base relevance (0-10 points)
    if (kbInsights.productMatches.some((match: string) =>
      product.name.toLowerCase().includes(match.toLowerCase()) ||
      match.toLowerCase().includes(product.name.toLowerCase())
    )) {
      score += 10;
    }

    // Stock availability bonus
    if (product.inStock) {
      score += 5;
    }

    return score;
  }

  private meetsUserCriteria(product: Product, preferences: UserPreferences): boolean {
    if (preferences.maxPrice && product.price > preferences.maxPrice) {
      return false;
    }

    if (preferences.minSustainabilityScore && product.sustainabilityScore < preferences.minSustainabilityScore) {
      return false;
    }

    if (preferences.categories && preferences.categories.length > 0) {
      if (!preferences.categories.includes(product.category)) {
        return false;
      }
    }

    return product.inStock; // Only recommend in-stock products
  }

  private generateReasoning(recommendations: Product[], context: RecommendationContext, kbInsights: any): string {
    if (recommendations.length === 0) {
      return "No products match your current criteria. Consider adjusting your preferences.";
    }

    let reasoning = `Based on your interest in "${context.userQuery}", I recommend these products because:\n\n`;

    recommendations.forEach((product, index) => {
      reasoning += `${index + 1}. **${product.name}** - `;
      
      const reasons = [];
      
      if (product.sustainabilityScore >= 80) {
        reasons.push(`excellent sustainability score (${product.sustainabilityScore})`);
      }
      
      if (context.preferences.categories?.includes(product.category)) {
        reasons.push(`matches your preferred ${product.category} category`);
      }
      
      if (context.preferences.maxPrice && product.price <= context.preferences.maxPrice * 0.8) {
        reasons.push(`great value at $${product.price}`);
      }
      
      if (reasons.length === 0) {
        reasons.push(`well-suited for your needs`);
      }
      
      reasoning += reasons.join(', ') + '.\n';
    });

    if (kbInsights.insights && kbInsights.insights !== 'Knowledge base temporarily unavailable') {
      reasoning += `\nAdditional insights: ${kbInsights.insights.substring(0, 200)}...`;
    }

    return reasoning;
  }

  private calculateConfidence(recommendations: Product[], kbInsights: any): number {
    if (recommendations.length === 0) return 0;

    let confidence = 50; // Base confidence

    // Higher confidence with more recommendations
    confidence += Math.min(recommendations.length * 5, 20);

    // Higher confidence with KB insights
    if (kbInsights.insights && kbInsights.insights !== 'Knowledge base temporarily unavailable') {
      confidence += 20;
    }

    // Higher confidence with high-scoring products
    const avgScore = recommendations.reduce((sum, p) => sum + (p as any).score, 0) / recommendations.length;
    confidence += Math.min(avgScore / 2, 10);

    return Math.min(confidence, 95); // Cap at 95%
  }

  private getFallbackRecommendations(
    context: RecommendationContext,
    availableProducts: Product[],
    maxRecommendations: number
  ) {
    // Simple rule-based fallback
    const filtered = availableProducts
      .filter(p => this.meetsUserCriteria(p, context.preferences))
      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
      .slice(0, maxRecommendations);

    return {
      recommendations: filtered,
      reasoning: 'Recommendations based on sustainability scores and your preferences.',
      confidence: 60,
      alternativeOptions: [],
      knowledgeBaseUsed: false,
    };
  }

  private extractProductNames(text: string): string[] {
    const productNames = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for product names in common formats
      const matches = line.match(/(?:^|\s)([A-Z][^.!?]*(?:Smart|Eco|Sustainable|AI|Watch|Tracker|Monitor)[^.!?]*)/g);
      if (matches) {
        productNames.push(...matches.map(m => m.trim()));
      }
    }
    
    return [...new Set(productNames)]; // Remove duplicates
  }

  private extractCategories(text: string): string[] {
    const categories = ['Electronics', 'Digital', 'Clothing', 'Sports', 'Books', 'Home & Garden', 'Beauty', 'Automotive'];
    const found = [];
    
    for (const category of categories) {
      if (text.toLowerCase().includes(category.toLowerCase())) {
        found.push(category);
      }
    }
    
    return found;
  }
}
