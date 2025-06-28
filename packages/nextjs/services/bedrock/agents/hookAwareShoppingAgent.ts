import { invokeAI } from "../index";
import { ProductRecommendation, UserPreferences } from "~~/types/bedrock";
import { ContractProduct } from "~~/services/marketplace/contractProductService";

/**
 * Hook-Aware Shopping Agent that works with the proven useContractProducts hook
 * This version receives products from the React component instead of fetching them directly
 */
export class HookAwareShoppingAgent {
  private sessionId: string;
  private userPreferences: UserPreferences;

  constructor(userId: string, preferences: UserPreferences) {
    this.sessionId = `shopping-${userId}-${Date.now()}`;
    this.userPreferences = preferences;
  }

  /**
   * Find products using pre-fetched contract data from useContractProducts hook
   */
  async findProducts(query: string, contractProducts: ContractProduct[]): Promise<ProductRecommendation[]> {
    try {
      console.log(`🔍 Hook-aware hybrid search for: "${query}"`);
      console.log(`📦 Received ${contractProducts.length} products from hook`);

      // Step 1: Filter real products based on query
      const realProducts = this.filterContractProducts(contractProducts, query);
      console.log(`📦 Found ${realProducts.length} matching real marketplace products`);

      // Step 2: AI analyzes real inventory + suggests additions
      const aiRecommendations = await this.getAIRecommendations(query, realProducts);
      console.log(`🤖 Generated ${aiRecommendations.length} AI recommendations`);

      // Step 3: Combine and return hybrid results
      const hybridResults = this.combineResults(realProducts, aiRecommendations);
      console.log(`✅ Returning ${hybridResults.length} hybrid results`);

      return hybridResults;

    } catch (error) {
      console.error("❌ Hook-aware hybrid search error:", error);
      // Fallback to AI-only recommendations
      return this.getAIOnlyRecommendations(query);
    }
  }

  /**
   * Filter contract products using the proven search algorithm
   */
  private filterContractProducts(products: ContractProduct[], query: string): ContractProduct[] {
    const queryLower = query.toLowerCase().trim();
    console.log(`🔍 Filtering ${products.length} products for query: "${queryLower}"`);

    // Score-based matching for better relevance
    const scoredProducts = products.map(product => ({
      product,
      score: this.calculateRelevanceScore(product, queryLower)
    })).filter(item => {
      // Only include active products
      if (!item.product.isActive) {
        console.log(`   ❌ ${item.product.name}: Product inactive`);
        return false;
      }
      // Only include products with meaningful relevance scores
      if (item.score < 50) {
        console.log(`   ❌ ${item.product.name}: Score too low (${item.score})`);
        return false;
      }
      
      console.log(`   ✅ ${item.product.name}: Included with score ${item.score}`);
      return true;
    });

    // Sort by relevance score (highest first)
    scoredProducts.sort((a, b) => b.score - a.score);

    // Limit to top 3 most relevant results for better user experience
    const topResults = scoredProducts.slice(0, 3);
    const results = topResults.map(item => item.product);
    
    console.log(`✅ Returning top ${results.length} most relevant products:`);
    results.forEach((product, index) => {
      const score = topResults[index].score;
      console.log(`   ${index + 1}. ${product.name} (score: ${score})`);
    });

    return results;
  }

  private calculateRelevanceScore(product: ContractProduct, query: string): number {
    let score = 0;
    const queryWords = query.split(' ').filter(word => word.length > 1);
    const productName = product.name.toLowerCase();
    const productDesc = product.description.toLowerCase();
    const productCerts = product.certifications?.join(' ').toLowerCase() || '';
    const productCategory = product.category.toLowerCase();
    
    // Combine all searchable text
    const allText = `${productName} ${productDesc} ${productCerts} ${productCategory}`;

    console.log(`🔍 Analyzing "${product.name}" for query "${query}"`);

    // Exact phrase match in any field (highest priority)
    if (allText.includes(query)) {
      score += 100;
      console.log(`   ✅ Exact phrase match: +100`);
    }

    // All query words present anywhere (high priority)
    if (queryWords.every(word => allText.includes(word))) {
      score += 80;
      console.log(`   ✅ All words found: +80`);
    }

    // Individual word matches
    queryWords.forEach(word => {
      let wordScore = 0;
      if (productName.includes(word)) {
        wordScore += 40;
        console.log(`   ✅ "${word}" in name: +40`);
      }
      if (productDesc.includes(word)) {
        wordScore += 25;
        console.log(`   ✅ "${word}" in description: +25`);
      }
      if (productCerts.includes(word)) {
        wordScore += 30;
        console.log(`   ✅ "${word}" in certifications: +30`);
      }
      if (productCategory.includes(word)) {
        wordScore += 20;
        console.log(`   ✅ "${word}" in category: +20`);
      }
      score += wordScore;
    });

    // Semantic matching for common synonyms
    const synonyms = {
      'smartwatch': ['smart watch', 'fitness tracker', 'wearable', 'tracker'],
      'smart watch': ['smartwatch', 'fitness tracker', 'wearable', 'tracker'],
      'ai powered': ['ai coaching', 'artificial intelligence', 'smart', 'intelligent'],
      'fitness tracker': ['smartwatch', 'smart watch', 'wearable', 'tracker'],
    };

    Object.entries(synonyms).forEach(([term, syns]) => {
      if (query.includes(term)) {
        syns.forEach(syn => {
          if (allText.includes(syn)) {
            score += 50;
            console.log(`   ✅ Synonym match "${term}" → "${syn}": +50`);
          }
        });
      }
    });

    console.log(`📈 ${product.name}: FINAL SCORE ${score} (query: "${query}")`);
    return score;
  }

  private async getAIRecommendations(query: string, realProducts: ContractProduct[]): Promise<ProductRecommendation[]> {
    const prompt = `You are an expert AI shopping assistant for a sustainable e-commerce marketplace.

SEARCH QUERY: "${query}"

REAL MARKETPLACE INVENTORY (${realProducts.length} products):
${realProducts.map(p => `
- ${p.name}: $${p.priceUSD} (${p.price} ETH)
  Category: ${p.category}
  Sustainability: ${p.sustainabilityScore || 'N/A'}%
  Certifications: ${p.certifications?.join(', ') || 'None'}
  Description: ${p.description}
`).join('')}

USER PREFERENCES:
- Budget: $${this.userPreferences.budgetMax}
- Sustainability minimum: ${this.userPreferences.sustainabilityMin}%
- Preferred chain: ${this.userPreferences.preferredChain}
- Categories: ${this.userPreferences.categories?.join(', ') || 'Any'}
- Ethical concerns: ${this.userPreferences.ethicalConcerns?.join(', ') || 'None'}

TASK: Suggest 2-3 additional products that would complement our marketplace inventory for this search query.
Focus on products that:
1. Match the user's search intent
2. Fill gaps in our current inventory
3. Meet the user's sustainability and budget preferences
4. Would be valuable additions to our marketplace

Return ONLY a JSON array of products in this exact format:
[
  {
    "name": "Product Name",
    "description": "Detailed description",
    "sustainabilityScore": 85,
    "price": 49.99,
    "category": "Electronics",
    "certifications": ["Eco-Certified", "Fair Trade"],
    "carbonFootprint": 2.1,
    "reasoning": "Why this product would be a good addition"
  }
]`;

    try {
      const response = await invokeAI(prompt);
      if (!response?.content?.[0]?.text) {
        console.log("⚠️ No AI response, returning empty AI recommendations");
        return [];
      }

      return this.parseAIResponse(response.content[0].text, query);
    } catch (error) {
      console.error("AI recommendation error:", error);
      return [];
    }
  }

  private parseAIResponse(aiText: string, query: string): ProductRecommendation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log("⚠️ No JSON found in AI response");
        return [];
      }

      const aiProducts = JSON.parse(jsonMatch[0]);
      
      return aiProducts.map((product: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        name: product.name || `AI Suggested Product ${index + 1}`,
        description: product.description || "AI-suggested product",
        sustainabilityScore: product.sustainabilityScore || 75,
        price: product.price || this.generateReasonablePrice(),
        chain: this.userPreferences.preferredChain === "any" ? "ethereum" : this.userPreferences.preferredChain,
        sellerAddress: "0x0000000000000000000000000000000000000000",
        certifications: product.certifications || ["AI Suggested"],
        carbonFootprint: product.carbonFootprint || 2.0,
        isRealProduct: false,
        category: product.category || "General",
        reasoning: product.reasoning || "AI-suggested based on your search"
      }));
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return [];
    }
  }

  private combineResults(realProducts: ContractProduct[], aiRecommendations: ProductRecommendation[]): ProductRecommendation[] {
    // Convert real products to recommendation format
    const realRecommendations: ProductRecommendation[] = realProducts.map(product => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      sustainabilityScore: product.sustainabilityScore || 75,
      price: product.priceUSD,
      chain: product.chain,
      sellerAddress: product.seller,
      certifications: product.certifications || ["Blockchain Verified"],
      carbonFootprint: product.carbonFootprint || 2.0,
      isRealProduct: true,
      category: product.category,
      averageRating: product.averageRating
    }));

    // Combine real products first, then AI suggestions
    return [...realRecommendations, ...aiRecommendations];
  }

  private async getAIOnlyRecommendations(query: string): Promise<ProductRecommendation[]> {
    try {
      const response = await invokeAI(`Generate 2-3 product recommendations for: "${query}"`);
      if (!response?.content?.[0]?.text) {
        console.log("⚠️ No AI response, returning empty results");
        return [];
      }

      return this.parseAIResponse(response.content[0].text, query);
    } catch (error) {
      console.error("AI-only fallback error:", error);
      return [];
    }
  }

  private generateReasonablePrice(): number {
    const min = this.userPreferences.budgetMax * 0.1;
    const max = this.userPreferences.budgetMax * 0.8;
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }
}
