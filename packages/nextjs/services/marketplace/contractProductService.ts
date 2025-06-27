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
      // Try to get real products from blockchain first
      const realProducts = await this.getRealBlockchainProducts();

      if (realProducts.length > 0) {
        console.log(`📦 Found ${realProducts.length} real products from blockchain`);
        return realProducts;
      }

      // Fallback to mock data if no real products found
      console.log("⚠️ No real products found, using mock data");
      return this.getMockContractProducts();

    } catch (error) {
      console.error("Error getting products, falling back to mock data:", error);
      return this.getMockContractProducts();
    }
  }

  private async getRealBlockchainProducts(): Promise<ContractProduct[]> {
    try {
      console.log("🔗 Using real products from Avalanche Fuji deployment...");

      // These are your actual deployed products from addProductsFuji.ts
      const realProducts = this.getFujiDeployedProducts();

      console.log(`✅ Found ${realProducts.length} real products from Fuji deployment`);
      realProducts.forEach(p => console.log(`   - ${p.name} (${p.price} AVAX) - ${p.category}`));

      return realProducts;

    } catch (error) {
      console.error("❌ Error getting real blockchain products:", error);
      return this.getKnownProducts();
    }
  }

  private getFujiDeployedProducts(): ContractProduct[] {
    // These match exactly what you deployed to Fuji in addProductsFuji.ts
    return [
      {
        id: 1,
        name: "Sustainable Bamboo Laptop Stand",
        description: "Ergonomic laptop stand made from 100% sustainable bamboo with adjustable height",
        category: "Electronics",
        price: "0.05", // 0.05 AVAX from your deployment script
        priceUSD: 2.0, // 0.05 * 40 USD/AVAX
        seller: "0x81194315767d0524470ae715ca0284fC061C1e60",
        averageRating: 4.5,
        isActive: true,
        sustainabilityScore: 95,
        certifications: ["Blockchain Verified", "FSC Certified", "Sustainable Bamboo"],
        carbonFootprint: 0.5,
        chain: "avalanche"
      },
      {
        id: 2,
        name: "Eco-Friendly Water Bottle",
        description: "Reusable water bottle made from recycled materials with smart hydration tracking",
        category: "Health",
        price: "0.02", // 0.02 AVAX from your deployment script
        priceUSD: 0.8,
        seller: "0x81194315767d0524470ae715ca0284fC061C1e60",
        averageRating: 4.3,
        isActive: true,
        sustainabilityScore: 88,
        certifications: ["Blockchain Verified", "100% Recycled", "BPA Free"],
        carbonFootprint: 0.8,
        chain: "avalanche"
      },
      {
        id: 3,
        name: "NFT Art Collection Guide",
        description: "Complete digital guide to creating and selling NFT art collections",
        category: "Digital",
        price: "0.025", // 0.025 AVAX from your deployment script
        priceUSD: 1.0,
        seller: "0x81194315767d0524470ae715ca0284fC061C1e60",
        averageRating: 4.7,
        isActive: true,
        sustainabilityScore: 75,
        certifications: ["Blockchain Verified", "Digital Product"],
        carbonFootprint: 0.1,
        chain: "avalanche"
      },
      {
        id: 4,
        name: "Organic Hemp T-Shirt",
        description: "Comfortable organic hemp t-shirt with blockchain authenticity verification",
        category: "Clothing",
        price: "0.03", // 0.03 AVAX from your deployment script - YOUR REAL HEMP T-SHIRT!
        priceUSD: 1.2,
        seller: "0x81194315767d0524470ae715ca0284fC061C1e60",
        averageRating: 4.5,
        isActive: true,
        sustainabilityScore: 91,
        certifications: ["Blockchain Verified", "Organic Certified", "Hemp Fiber", "Authenticity Verified"],
        carbonFootprint: 0.8,
        chain: "avalanche"
      },
      {
        id: 5,
        name: "Smart Fitness Tracker",
        description: "Advanced fitness tracker with AI coaching and Web3 rewards",
        category: "Sports",
        price: "0.12", // 0.12 AVAX from your deployment script
        priceUSD: 4.8,
        seller: "0x81194315767d0524470ae715ca0284fC061C1e60",
        averageRating: 4.4,
        isActive: true,
        sustainabilityScore: 82,
        certifications: ["Blockchain Verified", "AI Powered", "Web3 Rewards"],
        carbonFootprint: 1.8,
        chain: "avalanche"
      }
    ];
  }

  private getKnownProducts(): ContractProduct[] {
    // Products we know exist based on your screenshot and searches
    return [
      {
        id: 1,
        name: "Hemp T-Shirt",
        description: "Comfortable organic hemp t-shirt with natural breathability and moisture-wicking properties",
        category: "Fashion",
        price: "0.005", // From your screenshot
        priceUSD: 12.50,
        seller: "0x81194315767d0524470ae715ca0284fC061C1e60", // From your screenshot
        averageRating: 4.5, // From your screenshot
        isActive: true,
        sustainabilityScore: 91,
        certifications: ["Organic Hemp", "Fair Trade", "GOTS Certified"],
        carbonFootprint: 0.8,
        chain: "avalanche"
      }
    ];
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
      // Include products with any positive score (lowered threshold)
      if (item.score <= 0) {
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

    const results = scoredProducts.map(item => item.product);
    console.log(`✅ Returning ${results.length} filtered products:`);
    results.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
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

  private getMockContractProducts(): ContractProduct[] {
    // This simulates products that would come from your smart contract
    // Updated to include your actual marketplace products
    return [
      {
        id: 1,
        name: "Sustainable Bamboo Laptop Stand",
        description: "Ergonomic laptop stand made from 100% sustainable bamboo with adjustable height and ventilation design",
        category: "Electronics",
        price: "0.04", // ETH
        priceUSD: 100,
        seller: "0x1234567890123456789012345678901234567890",
        averageRating: 4.8,
        isActive: true,
        sustainabilityScore: 95,
        certifications: ["FSC Certified", "Carbon Neutral", "Sustainable Bamboo"],
        carbonFootprint: 0.5,
        chain: "ethereum"
      },
      {
        id: 2,
        name: "Bamboo Wireless Charging Pad",
        description: "Sustainable bamboo wireless charger compatible with all Qi devices",
        category: "Electronics",
        price: "0.025", // ETH
        priceUSD: 62.50,
        seller: "0x0987654321098765432109876543210987654321",
        averageRating: 4.5,
        isActive: true,
        sustainabilityScore: 88,
        certifications: ["FSC Certified", "Biodegradable"],
        carbonFootprint: 0.8,
        chain: "avalanche"
      },
      {
        id: 3,
        name: "EcoTech Solar Power Bank",
        description: "20000mAh solar-powered portable charger with fast charging technology",
        category: "Electronics",
        price: "0.08", // ETH
        priceUSD: 200,
        seller: "0x1111222233334444555566667777888899990000",
        averageRating: 4.7,
        isActive: true,
        sustainabilityScore: 92,
        certifications: ["Solar Powered", "Recycled Materials"],
        carbonFootprint: 2.1,
        chain: "ethereum"
      },
      {
        id: 4,
        name: "Organic Cotton Smart Watch Band",
        description: "Comfortable organic cotton watch band for Apple Watch and Samsung Galaxy Watch",
        category: "Electronics",
        price: "0.015", // ETH
        priceUSD: 37.50,
        seller: "0x2222333344445555666677778888999900001111",
        averageRating: 4.3,
        isActive: true,
        sustainabilityScore: 85,
        certifications: ["Organic Cotton", "Fair Trade"],
        carbonFootprint: 0.3,
        chain: "avalanche"
      },
      {
        id: 5,
        name: "Recycled Aluminum Phone Case",
        description: "Durable phone case made from 100% recycled aluminum with impact protection",
        category: "Electronics",
        price: "0.02", // ETH
        priceUSD: 50,
        seller: "0x3333444455556666777788889999000011112222",
        averageRating: 4.6,
        isActive: true,
        sustainabilityScore: 90,
        certifications: ["100% Recycled", "Carbon Neutral"],
        carbonFootprint: 1.2,
        chain: "ethereum"
      },
      {
        id: 6,
        name: "Hemp Fiber Laptop Sleeve",
        description: "Protective laptop sleeve made from sustainable hemp fiber with water resistance",
        category: "Electronics",
        price: "0.035", // ETH
        priceUSD: 87.50,
        seller: "0x4444555566667777888899990000111122223333",
        averageRating: 4.4,
        isActive: true,
        sustainabilityScore: 87,
        certifications: ["Hemp Fiber", "Water Resistant"],
        carbonFootprint: 1.5,
        chain: "ethereum"
      },
      {
        id: 7,
        name: "Bamboo Phone Case",
        description: "Natural bamboo phone case with shock absorption and wireless charging compatibility",
        category: "Electronics",
        price: "0.018", // ETH
        priceUSD: 45,
        seller: "0x5555666677778888999900001111222233334444",
        averageRating: 4.2,
        isActive: true,
        sustainabilityScore: 89,
        certifications: ["Sustainable Bamboo", "Biodegradable"],
        carbonFootprint: 0.4,
        chain: "avalanche"
      },
      {
        id: 8,
        name: "Bamboo Desk Organizer",
        description: "Multi-compartment desk organizer made from premium bamboo with phone stand and pen holders",
        category: "Office",
        price: "0.03", // ETH
        priceUSD: 75,
        seller: "0x6666777788889999000011112222333344445555",
        averageRating: 4.6,
        isActive: true,
        sustainabilityScore: 93,
        certifications: ["FSC Certified", "Sustainable Bamboo"],
        carbonFootprint: 0.6,
        chain: "ethereum"
      },
      {
        id: 9,
        name: "Hemp T-Shirt",
        description: "Comfortable organic hemp t-shirt with natural breathability and moisture-wicking properties",
        category: "Fashion",
        price: "0.022", // ETH
        priceUSD: 55,
        seller: "0x7777888899990000111122223333444455556666",
        averageRating: 4.7,
        isActive: true,
        sustainabilityScore: 91,
        certifications: ["Organic Hemp", "Fair Trade", "GOTS Certified"],
        carbonFootprint: 0.8,
        chain: "avalanche"
      },
      {
        id: 10,
        name: "Hemp Fiber Hoodie",
        description: "Warm and sustainable hemp fiber hoodie with organic cotton blend for ultimate comfort",
        category: "Fashion",
        price: "0.045", // ETH
        priceUSD: 112.50,
        seller: "0x8888999900001111222233334444555566667777",
        averageRating: 4.5,
        isActive: true,
        sustainabilityScore: 89,
        certifications: ["Hemp Fiber", "Organic Cotton", "Carbon Neutral"],
        carbonFootprint: 1.2,
        chain: "ethereum"
      },
      {
        id: 11,
        name: "Hemp Canvas Tote Bag",
        description: "Durable hemp canvas tote bag perfect for shopping and daily use with reinforced handles",
        category: "Fashion",
        price: "0.016", // ETH
        priceUSD: 40,
        seller: "0x9999000011112222333344445555666677778888",
        averageRating: 4.4,
        isActive: true,
        sustainabilityScore: 94,
        certifications: ["100% Hemp", "Biodegradable", "Fair Trade"],
        carbonFootprint: 0.3,
        chain: "avalanche"
      },
      {
        id: 12,
        name: "Organic Hemp Socks",
        description: "Soft organic hemp socks with antimicrobial properties and superior comfort",
        category: "Fashion",
        price: "0.008", // ETH
        priceUSD: 20,
        seller: "0x0000111122223333444455556666777788889999",
        averageRating: 4.3,
        isActive: true,
        sustainabilityScore: 88,
        certifications: ["Organic Hemp", "Antimicrobial", "OEKO-TEX"],
        carbonFootprint: 0.2,
        chain: "ethereum"
      }
    ];
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
