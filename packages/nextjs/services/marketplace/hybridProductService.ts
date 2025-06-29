import { ContractProduct } from "./contractProductService";

/**
 * Hybrid Product Service that can work with both hook-provided data and direct contract calls
 * This service bridges the gap between React components (with hooks) and API routes (without hooks)
 */
export class HybridProductService {
  private static instance: HybridProductService;
  private cachedProducts: ContractProduct[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  static getInstance(): HybridProductService {
    if (!HybridProductService.instance) {
      HybridProductService.instance = new HybridProductService();
    }
    return HybridProductService.instance;
  }

  /**
   * Set products from React hook (for client-side usage)
   */
  setProductsFromHook(products: ContractProduct[]): void {
    console.log(`📦 HybridProductService: Received ${products.length} products from hook`);
    this.cachedProducts = products;
    this.lastFetchTime = Date.now();
  }

  /**
   * Get products for API routes (server-side usage)
   * This uses the real smart contract data via server-side contract reader
   */
  async getProductsForAPI(): Promise<ContractProduct[]> {
    try {
      console.log("🔗 Getting REAL products for API route (server-side)...");

      // Import and use the server-side contract reader
      const { serverSideContractReader } = await import("~~/services/blockchain/serverSideContractReader");

      // Get real products from the smart contract
      const realProducts = await serverSideContractReader.getAllProducts();

      if (realProducts.length > 0) {
        console.log(`✅ Successfully fetched ${realProducts.length} real products from smart contract`);
        return realProducts;
      }

      console.log("⚠️ No real products found from smart contract");

      // Return empty array if no real products are available
      // This ensures we only use real data from smart contracts
      return [];

    } catch (error) {
      console.error("❌ Error getting products for API:", error);
      return [];
    }
  }

  /**
   * Get cached products (for client-side usage)
   */
  getCachedProducts(): ContractProduct[] {
    return this.cachedProducts;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    return Date.now() - this.lastFetchTime < this.CACHE_DURATION;
  }

  /**
   * Search products with enhanced filtering
   */
  searchProducts(products: ContractProduct[], query: string, category?: string): ContractProduct[] {
    const queryLower = query.toLowerCase().trim();
    console.log(`🔍 Searching ${products.length} products for query: "${queryLower}"`);

    // Score-based matching for better relevance
    const scoredProducts = products.map(product => ({
      product,
      score: this.calculateRelevanceScore(product, queryLower)
    })).filter(item => {
      // Filter by category if specified
      if (category && item.product.category.toLowerCase() !== category.toLowerCase()) {
        console.log(`   ❌ ${item.product.name}: Category mismatch (${item.product.category} != ${category})`);
        return false;
      }
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

    // Limit to top 3 most relevant results
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
}
