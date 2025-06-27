// No imports needed - using direct product data

export interface ContractProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string; // in ETH
  priceUSD: number; // converted to USD
  seller: string;
  averageRating: number;
  isActive: boolean;
  sustainabilityScore?: number;
  certifications?: string[];
  carbonFootprint?: number;
  chain: "ethereum" | "avalanche";
}

export class ContractProductService {
  constructor() {
    // No need for client initialization - using productFetcher
  }

  async searchProducts(query: string, category?: string): Promise<ContractProduct[]> {
    try {
      console.log(`🔍 Searching contract products for: "${query}"`);

      // Get all products from contract
      const allProducts = await this.getAllProducts();
      console.log(`📦 Total products in contract: ${allProducts.length}`);
      console.log(`📝 All product details:`);
      allProducts.forEach(p => {
        console.log(`   - ${p.name} (${p.category}) - ${p.description.substring(0, 50)}...`);
        if (p.certifications) {
          console.log(`     Certifications: ${p.certifications.join(', ')}`);
        }
      });

      // Filter by search query and category
      const filteredProducts = this.filterProducts(allProducts, query, category);

      console.log(`✅ Found ${filteredProducts.length} matching contract products:`);
      filteredProducts.forEach(p => console.log(`   - ${p.name}`));

      return filteredProducts;

    } catch (error) {
      console.error("❌ Error fetching contract products:", error);
      return [];
    }
  }

  async getAllProducts(): Promise<ContractProduct[]> {
    try {
      // ONLY get real products from blockchain - NO MOCK DATA
      const realProducts = await this.getRealBlockchainProducts();
      console.log(`📦 Found ${realProducts.length} real products from blockchain`);
      return realProducts;

    } catch (error) {
      console.error("❌ Error getting real blockchain products:", error);
      // Return empty array instead of mock data
      return [];
    }
  }

  private async getRealBlockchainProducts(): Promise<ContractProduct[]> {
    try {
      console.log("🔗 Fetching REAL products from blockchain...");

      // Import the blockchain product fetcher
      const { productFetcher } = await import("~~/services/blockchain/productFetcher");

      // Fetch real products from the smart contract
      const blockchainProducts = await productFetcher.fetchAllProducts();

      if (blockchainProducts.length === 0) {
        console.log("⚠️ No products found on blockchain");
        return [];
      }

      // Convert blockchain products to our format
      const contractProducts: ContractProduct[] = blockchainProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price, // Already in ETH/AVAX
        priceUSD: product.priceUSD,
        seller: product.seller,
        averageRating: product.averageRating,
        isActive: product.isActive,
        sustainabilityScore: this.estimateSustainabilityScore(product.name, product.description),
        certifications: this.generateCertifications(product.name, product.description),
        carbonFootprint: this.estimateCarbonFootprint(product.category),
        chain: "avalanche" // Your contract is on Avalanche Fuji
      }));

      console.log(`✅ Found ${contractProducts.length} real products from blockchain`);
      contractProducts.forEach(p => console.log(`   - ${p.name} (${p.price} AVAX) - ${p.category}`));

      return contractProducts;

    } catch (error) {
      console.error("❌ Error fetching real blockchain products:", error);
      return [];
    }
  }





  private estimateSustainabilityScore(name: string, description: string): number {
    const text = (name + " " + description).toLowerCase();
    let score = 70; // Base score

    // Boost score for sustainable keywords
    if (text.includes("organic")) score += 10;
    if (text.includes("hemp")) score += 8;
    if (text.includes("bamboo")) score += 8;
    if (text.includes("sustainable")) score += 10;
    if (text.includes("eco")) score += 8;
    if (text.includes("recycled")) score += 12;
    if (text.includes("solar")) score += 15;

    return Math.min(100, score);
  }

  private generateCertifications(name: string, description: string): string[] {
    const text = (name + " " + description).toLowerCase();
    const certs: string[] = ["Blockchain Verified"];

    if (text.includes("organic")) certs.push("Organic Certified");
    if (text.includes("hemp")) certs.push("Hemp Fiber");
    if (text.includes("bamboo")) certs.push("FSC Certified");
    if (text.includes("solar")) certs.push("Solar Powered");
    if (text.includes("recycled")) certs.push("100% Recycled");

    return certs;
  }

  private estimateCarbonFootprint(category: string): number {
    // Estimate carbon footprint based on category
    switch (category.toLowerCase()) {
      case "fashion": return 1.2;
      case "electronics": return 2.5;
      case "home": return 1.8;
      case "office": return 1.5;
      default: return 2.0;
    }
  }

  private filterProducts(products: ContractProduct[], query: string, category?: string): ContractProduct[] {
    const queryLower = query.toLowerCase().trim();
    console.log(`🔍 Filtering ${products.length} products for query: "${queryLower}"`);

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

    console.log(`📊 Scored products summary:`);
    scoredProducts.forEach(item => {
      console.log(`   📈 ${item.product.name}: ${item.score} points`);
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
    console.log(`   📝 Searchable text: "${allText}"`);

    // Exact phrase match in any field (highest priority)
    if (allText.includes(query)) {
      score += 100;
      console.log(`   ✅ Exact phrase match: +100`);
    }

    // Exact phrase match in name (very high priority)
    if (productName.includes(query)) {
      score += 120;
      console.log(`   ✅ Exact phrase in name: +120`);
    }

    // Exact phrase match in description
    if (productDesc.includes(query)) {
      score += 90;
      console.log(`   ✅ Exact phrase in description: +90`);
    }

    // All query words present anywhere (high priority)
    if (queryWords.every(word => allText.includes(word))) {
      score += 80;
      console.log(`   ✅ All words found: +80`);
    }

    // All query words present in name
    if (queryWords.every(word => productName.includes(word))) {
      score += 100;
      console.log(`   ✅ All words in name: +100`);
    }

    // All query words present in description
    if (queryWords.every(word => productDesc.includes(word))) {
      score += 70;
      console.log(`   ✅ All words in description: +70`);
    }

    // Individual word matches with detailed scoring
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
        wordScore += 30; // Increased from 15 - certifications are important
        console.log(`   ✅ "${word}" in certifications: +30`);
      }
      if (productCategory.includes(word)) {
        wordScore += 20;
        console.log(`   ✅ "${word}" in category: +20`);
      }
      score += wordScore;
    });

    // Enhanced product type matching
    const productTypes = [
      'smartwatch', 'smart watch', 'watch', 'tracker', 'fitness tracker',
      't-shirt', 'tshirt', 'shirt', 'hoodie', 'bag', 'socks', 'case', 'stand', 'pad', 'organizer',
      'phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker', 'charger'
    ];

    productTypes.forEach(type => {
      if (query.includes(type) && allText.includes(type)) {
        score += 60;
        console.log(`   ✅ Product type "${type}" match: +60`);
      }
    });

    // Semantic matching for common synonyms
    const synonyms = {
      'smartwatch': ['smart watch', 'fitness tracker', 'wearable', 'tracker'],
      'smart watch': ['smartwatch', 'fitness tracker', 'wearable', 'tracker'],
      'ai powered': ['ai coaching', 'artificial intelligence', 'smart', 'intelligent'],
      'fitness tracker': ['smartwatch', 'smart watch', 'wearable', 'tracker'],
      'phone': ['mobile', 'smartphone', 'device'],
      'laptop': ['computer', 'notebook', 'pc']
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

  private estimateSustainabilityScore(name: string, description: string): number {
    let score = 50; // Base score
    const text = `${name} ${description}`.toLowerCase();

    // Positive sustainability indicators
    if (text.includes('organic')) score += 20;
    if (text.includes('sustainable')) score += 20;
    if (text.includes('eco')) score += 15;
    if (text.includes('bamboo')) score += 25;
    if (text.includes('recycled')) score += 20;
    if (text.includes('solar')) score += 30;
    if (text.includes('hemp')) score += 15;
    if (text.includes('carbon neutral')) score += 25;
    if (text.includes('fair trade')) score += 15;
    if (text.includes('renewable')) score += 20;

    return Math.min(100, Math.max(0, score));
  }

  private generateCertifications(name: string, description: string): string[] {
    const certs = ["Blockchain Verified"]; // All products have this
    const text = `${name} ${description}`.toLowerCase();

    if (text.includes('organic')) certs.push("Organic Certified");
    if (text.includes('sustainable') || text.includes('bamboo')) certs.push("Sustainable Materials");
    if (text.includes('recycled')) certs.push("100% Recycled");
    if (text.includes('solar')) certs.push("Renewable Energy");
    if (text.includes('hemp')) certs.push("Hemp Fiber");
    if (text.includes('ai') || text.includes('smart')) certs.push("AI Powered");
    if (text.includes('fitness') || text.includes('tracker')) certs.push("Health Certified");
    if (text.includes('carbon')) certs.push("Carbon Neutral");
    if (text.includes('fair')) certs.push("Fair Trade");
    if (text.includes('fsc') || text.includes('bamboo')) certs.push("FSC Certified");

    return certs;
  }

  private estimateCarbonFootprint(category: string): number {
    switch (category.toLowerCase()) {
      case "clothing": case "fashion": return 1.2;
      case "electronics": return 2.5;
      case "digital": return 0.1;
      case "sports": case "health": return 1.8;
      case "home": case "office": return 1.5;
      default: return 2.0;
    }
  }

  async getProductsByCategory(category: string): Promise<ContractProduct[]> {
    const allProducts = await this.getAllProducts();
    const results = allProducts.filter(product =>
      product.category.toLowerCase() === category.toLowerCase() && product.isActive
    );
    console.log(`📂 Found ${results.length} products in category "${category}"`);
    return results;
  }

  async searchInCategory(query: string, category: string): Promise<ContractProduct[]> {
    console.log(`🎯 Searching for "${query}" in category "${category}"`);
    return this.searchProducts(query, category);
  }

  async getProductById(id: number): Promise<ContractProduct | null> {
    const allProducts = await this.getAllProducts();
    return allProducts.find(product => product.id === id) || null;
  }

  // Helper method to convert ETH price to USD (you'd get this from a price oracle)
  private async getETHToUSDRate(): Promise<number> {
    // In production, you'd call a price oracle or API
    // For now, using a mock rate
    return 2500; // $2500 per ETH
  }

  // Method to get trending products
  async getTrendingProducts(limit: number = 5): Promise<ContractProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts
      .filter(product => product.isActive)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  // Method to get products by sustainability score
  async getProductsBySustainability(minScore: number): Promise<ContractProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter(product => 
      product.isActive && 
      (product.sustainabilityScore || 0) >= minScore
    );
  }
}
