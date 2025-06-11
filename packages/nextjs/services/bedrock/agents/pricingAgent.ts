import { invokeAI } from "../index";

export class PricingAgent {
  async optimizePrice(
    productId: string,
    currentPrice: number,
    marketData: any,
    competitorPrices: number[]
  ) {
    const prompt = `You are an expert AI pricing strategist for a sustainable blockchain marketplace. Provide comprehensive pricing analysis for this product.

PRODUCT DETAILS:
- Product ID: ${productId}
- Current Price: $${currentPrice}
- Competitor Prices: [${competitorPrices.join(", ")}]
- Market Sentiment Index: ${marketData.fearGreedIndex || 'Neutral'}
- Platform: Decentralized sustainable marketplace

ANALYSIS REQUIREMENTS:
Provide detailed pricing optimization considering:

1. COMPETITIVE POSITIONING:
   - How does current price compare to competitors?
   - What price point maximizes market share vs. profit?
   - Optimal positioning strategy (premium/value/competitive)

2. SUSTAINABILITY PREMIUM:
   - Justified premium for eco-friendly features (typically 10-25%)
   - Consumer willingness to pay for sustainability
   - Market acceptance of green pricing

3. BLOCKCHAIN ECONOMICS:
   - Transaction costs on Ethereum vs Avalanche
   - Gas fee impact on final consumer price
   - Cross-chain arbitrage opportunities

4. MARKET DYNAMICS:
   - Current demand trends for sustainable products
   - Price elasticity in eco-conscious segment
   - Seasonal and regional factors

5. STRATEGIC RECOMMENDATIONS:
   - Optimal price point with confidence level
   - Price range (minimum/maximum viable)
   - Reasoning for recommendation
   - Expected impact on sales volume

Format response with clear numerical recommendations and business rationale.`;

    try {
      const response = await invokeAI(prompt);

      if (!response || !response.content || !response.content[0]?.text) {
        throw new Error("Invalid AI response format");
      }

      return this.parseAdvancedPricingStrategy(response.content[0].text, {
        productId,
        currentPrice,
        competitorPrices,
        marketData
      });

    } catch (error) {
      console.error("❌ AI Pricing Optimizer temporarily unavailable:", error);
      throw new Error("AI Pricing Optimizer is temporarily unavailable. Please try again in a moment.");
    }
  }

  private parseAdvancedPricingStrategy(aiText: string, productData: any) {
    try {
      console.log("🤖 Processing AI pricing analysis...");
      console.log("📊 AI Response length:", aiText.length, "characters");

      // Extract key pricing information from AI response
      const suggestedPrice = this.extractPrice(aiText, 'suggested', 'recommended', 'optimal') ||
                            this.calculateIntelligentPrice(productData);

      const minPrice = this.extractPrice(aiText, 'minimum', 'min', 'lowest') ||
                      suggestedPrice * 0.85;

      const maxPrice = this.extractPrice(aiText, 'maximum', 'max', 'highest') ||
                      suggestedPrice * 1.2;

      const confidence = this.extractConfidence(aiText) ||
                        this.calculateConfidenceScore(productData);

      const reasoning = this.extractReasoning(aiText) ||
                       "AI analysis suggests optimal pricing based on market conditions and sustainability factors.";

      const factors = this.extractFactors(aiText);
      const sustainabilityPremium = this.extractSustainabilityPremium(aiText);
      const competitivenessScore = this.calculateCompetitivenessScore(suggestedPrice, productData.competitorPrices);

      const strategy = {
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        reasoning: reasoning.substring(0, 300), // Limit length
        priceRange: {
          min: Math.round(minPrice * 100) / 100,
          max: Math.round(maxPrice * 100) / 100
        },
        competitivenessScore,
        confidence,
        factors,
        sustainabilityPremium,
        marketPosition: this.determineMarketPosition(suggestedPrice, productData.competitorPrices),
        demandForecast: this.extractDemandForecast(aiText)
      };

      console.log("✅ Successfully parsed AI pricing strategy:", {
        price: strategy.suggestedPrice,
        confidence: strategy.confidence,
        factors: strategy.factors.length
      });

      return strategy;

    } catch (error) {
      console.error("❌ Error parsing AI pricing response:", error);
      throw new Error("Failed to process AI pricing analysis");
    }
  }

  private extractPrice(text: string, ...keywords: string[]): number | null {
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}[^$]*\\$([0-9]+(?:\\.[0-9]{2})?)`, 'i'),
        new RegExp(`\\$([0-9]+(?:\\.[0-9]{2})?)[^0-9]*${keyword}`, 'i'),
        new RegExp(`${keyword}[^0-9]*([0-9]+(?:\\.[0-9]{2})?)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const price = parseFloat(match[1]);
          if (price > 0 && price < 10000) { // Reasonable price range
            return price;
          }
        }
      }
    }
    return null;
  }

  private extractConfidence(text: string): number | null {
    const patterns = [
      /confidence[^0-9]*([0-9]+)%?/i,
      /([0-9]+)%?\s*confidence/i,
      /certainty[^0-9]*([0-9]+)%?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const confidence = parseInt(match[1]);
        if (confidence >= 0 && confidence <= 100) {
          return confidence;
        }
      }
    }
    return null;
  }

  private extractReasoning(text: string): string {
    // Look for reasoning sections
    const reasoningPatterns = [
      /reasoning[:\s]*([^.]+(?:\.[^.]+){0,2})/i,
      /rationale[:\s]*([^.]+(?:\.[^.]+){0,2})/i,
      /because[:\s]*([^.]+(?:\.[^.]+){0,2})/i
    ];

    for (const pattern of reasoningPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 20) {
        return match[1].trim();
      }
    }

    // Fallback: extract first substantial sentence
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    return sentences[0]?.trim() || "";
  }

  private extractFactors(text: string): string[] {
    const factors: string[] = [];

    // Look for bulleted or numbered lists
    const listItems = text.match(/(?:^|\n)\s*(?:\d+\.|\*|\-)\s*([^\n]+)/g);
    if (listItems) {
      factors.push(...listItems.map(item =>
        item.replace(/(?:^|\n)\s*(?:\d+\.|\*|\-)\s*/, '').trim()
      ).slice(0, 5));
    }

    // Look for specific factor keywords
    const factorKeywords = [
      'sustainability premium', 'market demand', 'competition', 'regional factors',
      'blockchain costs', 'consumer willingness', 'price elasticity', 'seasonal trends'
    ];

    factorKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword) && factors.length < 5) {
        factors.push(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} considered`);
      }
    });

    return factors.slice(0, 5);
  }

  private extractSustainabilityPremium(text: string): number {
    const premiumMatch = text.match(/sustainability\s+premium[^0-9]*([0-9]+)%?/i) ||
                        text.match(/([0-9]+)%?\s*premium.*sustainability/i);

    if (premiumMatch && premiumMatch[1]) {
      const premium = parseInt(premiumMatch[1]);
      return Math.min(50, Math.max(0, premium)); // Cap at 50%
    }

    return 15; // Default sustainability premium
  }

  private calculateIntelligentPrice(productData: any): number {
    const { currentPrice, competitorPrices } = productData;
    const avgCompetitorPrice = competitorPrices.length > 0 ?
      competitorPrices.reduce((a: number, b: number) => a + b, 0) / competitorPrices.length :
      currentPrice;

    // Intelligent pricing based on market position
    const sustainabilityPremium = 1.15; // 15% premium for sustainability
    const marketAdjustment = avgCompetitorPrice > currentPrice ? 1.05 : 0.98;

    return currentPrice * sustainabilityPremium * marketAdjustment;
  }

  private calculateConfidenceScore(productData: any): number {
    const { competitorPrices, marketData } = productData;

    let confidence = 70; // Base confidence

    // More competitors = higher confidence
    if (competitorPrices.length >= 3) confidence += 15;
    else if (competitorPrices.length >= 1) confidence += 10;

    // Market sentiment factor
    if (marketData.fearGreedIndex) {
      if (marketData.fearGreedIndex > 60) confidence += 10; // Bullish market
      else if (marketData.fearGreedIndex < 40) confidence -= 5; // Bearish market
    }

    return Math.min(95, Math.max(60, confidence));
  }

  private calculateCompetitivenessScore(suggestedPrice: number, competitorPrices: number[]): number {
    if (competitorPrices.length === 0) return 75;

    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const priceRatio = suggestedPrice / avgCompetitorPrice;

    if (priceRatio <= 0.9) return 95; // Very competitive
    if (priceRatio <= 1.0) return 85; // Competitive
    if (priceRatio <= 1.1) return 75; // Moderately competitive
    if (priceRatio <= 1.2) return 65; // Premium positioning
    return 50; // High premium
  }

  private determineMarketPosition(suggestedPrice: number, competitorPrices: number[]): string {
    if (competitorPrices.length === 0) return "Market Leader";

    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const priceRatio = suggestedPrice / avgCompetitorPrice;

    if (priceRatio <= 0.9) return "Value Leader";
    if (priceRatio <= 1.05) return "Competitive";
    if (priceRatio <= 1.15) return "Premium";
    return "Luxury/Specialty";
  }

  private extractDemandForecast(text: string): string {
    const demandKeywords = ['demand', 'sales', 'volume', 'adoption'];
    const forecastKeywords = ['increase', 'decrease', 'stable', 'growth', 'decline'];

    for (const demandWord of demandKeywords) {
      for (const forecastWord of forecastKeywords) {
        if (text.toLowerCase().includes(demandWord) && text.toLowerCase().includes(forecastWord)) {
          if (forecastWord.includes('increase') || forecastWord.includes('growth')) {
            return "Positive - Expected demand increase";
          } else if (forecastWord.includes('decrease') || forecastWord.includes('decline')) {
            return "Cautious - Potential demand softening";
          } else {
            return "Stable - Steady demand expected";
          }
        }
      }
    }

    return "Moderate - Standard market expectations";
  }
}
