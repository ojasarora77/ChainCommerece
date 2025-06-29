// Enhanced Shopping Agent with Product Knowledge Base Integration
// Provides accurate, contextual responses about your specific products

import { productKnowledgeBase, ProductKnowledge } from './ProductKnowledgeBase';
import { HybridProductService } from '../marketplace/hybridProductService';
import { ContractProduct } from '../marketplace/contractProductService';

export interface EnhancedAgentResponse {
  message: string;
  products: ProductKnowledge[];
  reasoning: string;
  suggestions: string[];
  confidence: number;
  followUpQuestions: string[];
}

export interface SearchContext {
  query: string;
  category?: string;
  maxPrice?: number;
  sustainabilityMin?: number;
  userPreferences?: {
    interests: string[];
    priceRange: 'low' | 'medium' | 'high';
    sustainabilityFocus: boolean;
  };
}

export class EnhancedShoppingAgent {
  private hybridService: HybridProductService;
  private conversationHistory: Array<{ query: string; response: string }> = [];

  constructor() {
    this.hybridService = HybridProductService.getInstance();
  }

  /**
   * Main method to process user queries with enhanced intelligence
   */
  async processQuery(context: SearchContext): Promise<EnhancedAgentResponse> {
    console.log('🤖 Enhanced Agent processing:', context);

    try {
      // Analyze the query to understand intent
      const intent = this.analyzeIntent(context.query);
      
      // Get relevant products based on intent and context
      const products = await this.findRelevantProducts(context, intent);
      
      // Generate intelligent response
      const response = this.generateResponse(context, products, intent);
      
      // Store in conversation history
      this.conversationHistory.push({
        query: context.query,
        response: response.message
      });

      return response;

    } catch (error) {
      console.error('❌ Enhanced Agent error:', error);
      return this.generateErrorResponse(context);
    }
  }

  /**
   * Analyze user query to understand intent and extract key information
   */
  private analyzeIntent(query: string): {
    type: 'search' | 'compare' | 'recommend' | 'info' | 'price' | 'sustainability';
    keywords: string[];
    category?: string;
    priceRange?: string;
    features?: string[];
  } {
    const lowerQuery = query.toLowerCase();
    
    // Determine intent type
    let type: 'search' | 'compare' | 'recommend' | 'info' | 'price' | 'sustainability' = 'search';
    
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
      type = 'compare';
    } else if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('best')) {
      type = 'recommend';
    } else if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('cheap') || lowerQuery.includes('expensive')) {
      type = 'price';
    } else if (lowerQuery.includes('sustainable') || lowerQuery.includes('eco') || lowerQuery.includes('green') || lowerQuery.includes('environment')) {
      type = 'sustainability';
    } else if (lowerQuery.includes('tell me about') || lowerQuery.includes('what is') || lowerQuery.includes('details')) {
      type = 'info';
    }

    // Extract keywords
    const keywords = this.extractKeywords(query);
    
    // Detect category
    const category = this.detectCategory(lowerQuery);
    
    // Detect price range
    const priceRange = this.detectPriceRange(lowerQuery);
    
    // Extract features
    const features = this.extractFeatures(lowerQuery);

    return { type, keywords, category, priceRange, features };
  }

  /**
   * Extract relevant keywords from query
   */
  private extractKeywords(query: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'find', 'show', 'get', 'want', 'need', 'looking', 'search'];
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''));
  }

  /**
   * Detect product category from query
   */
  private detectCategory(query: string): string | undefined {
    const categoryMap = {
      'electronics': ['electronics', 'tech', 'gadget', 'device', 'smart', 'digital'],
      'clothing': ['clothing', 'shirt', 'apparel', 'fashion', 'wear', 'textile'],
      'sports': ['sports', 'fitness', 'exercise', 'workout', 'health', 'tracker'],
      'digital': ['digital', 'nft', 'guide', 'ebook', 'course', 'tutorial']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return category;
      }
    }
    return undefined;
  }

  /**
   * Detect price range from query
   */
  private detectPriceRange(query: string): string | undefined {
    if (query.includes('cheap') || query.includes('affordable') || query.includes('budget') || query.includes('under')) {
      return 'low';
    }
    if (query.includes('premium') || query.includes('expensive') || query.includes('high-end')) {
      return 'high';
    }
    if (query.includes('mid-range') || query.includes('moderate')) {
      return 'medium';
    }
    return undefined;
  }

  /**
   * Extract feature requirements from query
   */
  private extractFeatures(query: string): string[] {
    const featureKeywords = [
      'ai', 'smart', 'bluetooth', 'wireless', 'waterproof', 'sustainable',
      'organic', 'bamboo', 'hemp', 'blockchain', 'fitness', 'health',
      'tracking', 'monitoring', 'coaching', 'rewards', 'ergonomic'
    ];

    return featureKeywords.filter(feature => query.includes(feature));
  }

  /**
   * Find relevant products based on context and intent
   */
  private async findRelevantProducts(context: SearchContext, intent: any): Promise<ProductKnowledge[]> {
    let products: ProductKnowledge[] = [];

    // Use knowledge base for intelligent search
    if (intent.type === 'sustainability') {
      products = productKnowledgeBase.getBySustainabilityScore(context.sustainabilityMin || 85);
    } else if (intent.type === 'price') {
      products = productKnowledgeBase.getByPriceRange(context.maxPrice || 10);
    } else if (intent.category) {
      products = productKnowledgeBase.getByCategory(intent.category);
    } else {
      // Smart search using keywords
      products = productKnowledgeBase.smartSearch(context.query, {
        category: context.category,
        maxPrice: context.maxPrice,
        sustainabilityMin: context.sustainabilityMin
      });
    }

    // If no products found, try broader search
    if (products.length === 0) {
      products = productKnowledgeBase.smartSearch(context.query);
    }

    // Limit to top 5 results
    return products.slice(0, 5);
  }

  /**
   * Generate intelligent response based on products and intent
   */
  private generateResponse(context: SearchContext, products: ProductKnowledge[], intent: any): EnhancedAgentResponse {
    let message = '';
    let reasoning = '';
    const suggestions: string[] = [];
    const followUpQuestions: string[] = [];
    let confidence = 0.8;

    if (products.length === 0) {
      message = "I couldn't find any products matching your criteria. Let me suggest some alternatives from our marketplace.";
      products = productKnowledgeBase.getAllProducts().slice(0, 3);
      confidence = 0.3;
      reasoning = "No exact matches found, showing general product recommendations.";
    } else {
      // Generate contextual message based on intent
      switch (intent.type) {
        case 'sustainability':
          message = `Here are our most sustainable products with high eco-scores:`;
          reasoning = `Selected products with sustainability scores above ${context.sustainabilityMin || 85}.`;
          suggestions.push("All these products have verified sustainability certifications");
          followUpQuestions.push("Would you like to know more about the sustainability features?");
          break;

        case 'price':
          message = `Here are products within your budget range:`;
          reasoning = `Filtered by price range and value proposition.`;
          suggestions.push("Consider the long-term value and sustainability benefits");
          followUpQuestions.push("Would you like to see financing options?");
          break;

        case 'compare':
          message = `Here are similar products you can compare:`;
          reasoning = `Selected products in the same category for comparison.`;
          suggestions.push("Compare features, sustainability scores, and prices");
          followUpQuestions.push("Which specific features are most important to you?");
          break;

        case 'recommend':
          message = `Based on your query, I recommend these products:`;
          reasoning = `Recommendations based on popularity, ratings, and relevance.`;
          suggestions.push("These are our top-rated products in this category");
          followUpQuestions.push("What's your primary use case for this product?");
          break;

        default:
          message = `I found ${products.length} product${products.length > 1 ? 's' : ''} matching "${context.query}":`;
          reasoning = `Search results based on keyword matching and relevance scoring.`;
      }

      // Add product-specific insights
      if (products.length > 0) {
        const avgSustainability = products.reduce((sum, p) => sum + p.sustainabilityScore, 0) / products.length;
        const avgRating = products.reduce((sum, p) => sum + p.averageRating, 0) / products.length;
        
        suggestions.push(`Average sustainability score: ${avgSustainability.toFixed(1)}/100`);
        suggestions.push(`Average customer rating: ${avgRating.toFixed(1)}/5.0`);
        
        // Add specific product insights
        const topProduct = products[0];
        suggestions.push(`Top recommendation: ${topProduct.name} - ${topProduct.benefits[0]}`);
        
        followUpQuestions.push("Would you like detailed specifications for any product?");
        followUpQuestions.push("Do you need help with the purchase process?");
      }
    }

    return {
      message,
      products,
      reasoning,
      suggestions,
      confidence,
      followUpQuestions
    };
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(context: SearchContext): EnhancedAgentResponse {
    return {
      message: "I'm having trouble processing your request right now. Let me show you some of our popular products instead.",
      products: productKnowledgeBase.getAllProducts().slice(0, 3),
      reasoning: "Error occurred during processing, showing fallback recommendations.",
      suggestions: ["Try rephrasing your query", "Browse by category", "Check our featured products"],
      confidence: 0.2,
      followUpQuestions: ["What specific type of product are you looking for?"]
    };
  }

  /**
   * Get product details with enhanced information
   */
  getProductDetails(productId: number): ProductKnowledge | null {
    return productKnowledgeBase.getProduct(productId) || null;
  }

  /**
   * Get product recommendations based on a product
   */
  getRecommendations(productId: number): ProductKnowledge[] {
    return productKnowledgeBase.getRecommendations(productId);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ query: string; response: string }> {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}

// Export singleton instance
export const enhancedShoppingAgent = new EnhancedShoppingAgent();
