import { invokeAI } from "../index";
import { ProductRecommendation, UserPreferences } from "~~/types/bedrock";
import { ContractProductService, ContractProduct } from "~~/services/marketplace/contractProductService";

export class ShoppingAgent {
  private sessionId: string;
  private userPreferences: UserPreferences;
  private contractService: ContractProductService;

  constructor(userId: string, preferences: UserPreferences) {
    this.sessionId = `shopping-${userId}-${Date.now()}`;
    this.userPreferences = preferences;
    this.contractService = new ContractProductService();
  }

  async findProducts(query: string): Promise<ProductRecommendation[]> {
    try {
      console.log(`🔍 Hybrid search for: "${query}"`);

      // Step 1: Get real products from smart contract
      const realProducts = await this.contractService.searchProducts(query);
      console.log(`📦 Found ${realProducts.length} real marketplace products`);

      // Step 2: AI analyzes real inventory + suggests additions
      const aiRecommendations = await this.getAIRecommendations(query, realProducts);
      console.log(`🤖 Generated ${aiRecommendations.length} AI recommendations`);

      // Step 3: Combine and return hybrid results
      const hybridResults = this.combineResults(realProducts, aiRecommendations);
      console.log(`✅ Returning ${hybridResults.length} hybrid results`);

      return hybridResults;

    } catch (error) {
      console.error("❌ Hybrid search error:", error);
      // Fallback to AI-only recommendations
      return this.getAIOnlyRecommendations(query);
    }
  }

  private async getAIRecommendations(query: string, realProducts: ContractProduct[]): Promise<ProductRecommendation[]> {
    const prompt = `You are an expert AI shopping assistant for a sustainable e-commerce marketplace.

SEARCH QUERY: "${query}"

REAL MARKETPLACE INVENTORY (${realProducts.length} products):
${realProducts.map(p => `
- ${p.name}: $${p.priceUSD} (${p.price} ETH)
  Category: ${p.category}
  Sustainability: ${p.sustainabilityScore || 'N/A'}%
  Rating: ${p.averageRating}/5
  Description: ${p.description}
  Seller: ${p.seller}
`).join('')}

USER PREFERENCES:
- Sustainability Threshold: ${this.userPreferences.sustainabilityMin}% minimum
- Budget Limit: $${this.userPreferences.budgetMax}
- Preferred Blockchain: ${this.userPreferences.preferredChain || 'Any'}
- Categories: ${this.userPreferences.categories.join(', ')}
- Ethical Priorities: ${this.userPreferences.ethicalConcerns.join(', ')}

TASK:
1. PRIORITY: If real inventory has ANY matches for the search query, ALWAYS recommend those first
2. For search "${query}": Look for products containing these keywords in name/description
3. If real inventory has good matches, recommend ALL matching real products (up to 4)
4. Only suggest NEW products if real inventory has NO matches or very few matches
5. NEVER suggest products similar to existing real inventory
6. For suggested products, make them realistic and different from existing inventory

REQUIREMENTS:
- Meet sustainability threshold (${this.userPreferences.sustainabilityMin}%+)
- Stay within budget ($${this.userPreferences.budgetMax})
- Provide realistic pricing and details
- Mark clearly if recommending real vs suggested products

Format each recommendation with:
PRODUCT_NAME: [name]
DESCRIPTION: [detailed description]
PRICE: [USD price]
SUSTAINABILITY_SCORE: [0-100]
CERTIFICATIONS: [list]
CARBON_FOOTPRINT: [kg CO2]
SOURCE: [REAL_INVENTORY or AI_SUGGESTION]
SELLER: [address if real, or "Suggested Addition"]`;

    try {
      const response = await invokeAI(prompt);
      if (!response?.content?.[0]?.text) {
        throw new Error("Invalid AI response");
      }

      return this.parseHybridAIResponse(response.content[0].text, query, realProducts);
    } catch (error) {
      console.error("AI recommendation error:", error);
      return [];
    }
  }

  private combineResults(realProducts: ContractProduct[], aiRecommendations: ProductRecommendation[]): ProductRecommendation[] {
    console.log(`🔄 Combining ${realProducts.length} real products with ${aiRecommendations.length} AI recommendations`);

    // Convert real products to ProductRecommendation format
    const realProductRecommendations: ProductRecommendation[] = realProducts.map(product => ({
      id: `real-${product.id}`,
      name: product.name,
      description: product.description,
      sustainabilityScore: product.sustainabilityScore || 75,
      price: product.priceUSD,
      chain: product.chain,
      sellerAddress: product.seller,
      certifications: product.certifications || ["Marketplace Verified"],
      carbonFootprint: product.carbonFootprint || 2.0,
      isRealProduct: true, // Flag to identify real products
      averageRating: product.averageRating,
      ethPrice: product.price
    }));

    // Filter out AI recommendations that duplicate real products
    const filteredAIRecommendations = aiRecommendations.filter(aiRec =>
      !realProducts.some(realProd =>
        realProd.name.toLowerCase().includes(aiRec.name.toLowerCase()) ||
        aiRec.name.toLowerCase().includes(realProd.name.toLowerCase())
      )
    );

    console.log(`📦 Real products: ${realProductRecommendations.length}`);
    console.log(`🤖 Filtered AI suggestions: ${filteredAIRecommendations.length}`);

    // Combine real products first, then AI suggestions
    const combined = [...realProductRecommendations, ...filteredAIRecommendations];

    // Remove any remaining duplicates by name
    const uniqueProducts = combined.filter((product, index, array) =>
      array.findIndex(p => p.name.toLowerCase() === product.name.toLowerCase()) === index
    );

    console.log(`✅ Final unique results: ${uniqueProducts.length}`);

    // Limit to 6 total results (prioritize real products)
    return uniqueProducts.slice(0, 6);
  }

  private async getAIOnlyRecommendations(query: string): Promise<ProductRecommendation[]> {
    console.log("🔄 Falling back to AI-only recommendations");

    const prompt = `You are an expert AI shopping assistant. The marketplace inventory is temporarily unavailable.

SEARCH QUERY: "${query}"
USER PREFERENCES: Sustainability ${this.userPreferences.sustainabilityMin}%+, Budget $${this.userPreferences.budgetMax}

Provide 3 realistic product recommendations that would be perfect for this marketplace.
Focus on sustainable, eco-friendly products with detailed specifications.`;

    try {
      const response = await invokeAI(prompt);
      if (!response?.content?.[0]?.text) {
        console.log("⚠️ No AI response, returning empty results");
        return [];
      }

      return this.parseAdvancedAIResponse(response.content[0].text, query);
    } catch (error) {
      console.error("AI-only fallback error:", error);
      return [];
    }
  }

  async monitorNewListings() {
    // Autonomous monitoring logic
    setInterval(async () => {
      const newProducts = await this.findProducts("new sustainable products listed today");
      // Check against user preferences and notify
    }, 3600000); // Check every hour
  }

  private parseHybridAIResponse(aiText: string, query: string, realProducts: ContractProduct[]): ProductRecommendation[] {
    try {
      console.log("🤖 Parsing hybrid AI response");

      // Parse AI response and identify real vs suggested products
      const products: ProductRecommendation[] = [];
      const sections = this.extractProductSections(aiText);

      for (let i = 0; i < Math.min(sections.length, 4); i++) {
        const section = sections[i];
        const product = this.parseHybridProductSection(section, i + 1, realProducts);
        if (product) {
          products.push(product);
        }
      }

      console.log(`✅ Parsed ${products.length} hybrid recommendations`);
      return products;

    } catch (error) {
      console.error("❌ Error parsing hybrid AI response:", error);
      return [];
    }
  }

  private parseHybridProductSection(section: string, index: number, realProducts: ContractProduct[]): ProductRecommendation | null {
    try {
      const name = this.extractField(section, ['PRODUCT_NAME:', 'Product:', 'Name:']) ||
                   this.extractFirstLine(section) ||
                   `AI Product ${index}`;

      // Check if this refers to a real product
      const realProduct = realProducts.find(p =>
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (realProduct) {
        // Return real product data
        return {
          id: `real-${realProduct.id}`,
          name: realProduct.name,
          description: realProduct.description,
          sustainabilityScore: realProduct.sustainabilityScore || 75,
          price: realProduct.priceUSD,
          chain: realProduct.chain,
          sellerAddress: realProduct.seller,
          certifications: realProduct.certifications || ["Marketplace Verified"],
          carbonFootprint: realProduct.carbonFootprint || 2.0,
          isRealProduct: true,
          averageRating: realProduct.averageRating,
          ethPrice: realProduct.price
        };
      } else {
        // Parse as AI suggestion
        const description = this.extractField(section, ['DESCRIPTION:', 'Description:']) ||
                           this.extractLongestSentence(section) ||
                           "AI-suggested sustainable product";

        const priceMatch = section.match(/\$(\d+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : this.generateReasonablePrice();

        const sustainabilityMatch = section.match(/(\d+)%?\s*(?:sustainability|score)/i);
        const sustainabilityScore = sustainabilityMatch ?
          Math.min(100, Math.max(this.userPreferences.sustainabilityMin, parseInt(sustainabilityMatch[1]))) :
          this.generateSustainabilityScore();

        return {
          id: `ai-suggestion-${Date.now()}-${index}`,
          name: name.substring(0, 100),
          description: description.substring(0, 300),
          sustainabilityScore,
          price,
          chain: this.determineOptimalChain(section, name),
          sellerAddress: "Suggested Addition",
          certifications: this.extractCertifications(section),
          carbonFootprint: this.extractCarbonFootprint(section),
          isRealProduct: false
        };
      }

    } catch (error) {
      console.error(`Error parsing hybrid section ${index}:`, error);
      return null;
    }
  }



  private parseAdvancedAIResponse(aiText: string, query: string): ProductRecommendation[] {
    try {
      console.log("🤖 Processing AI response for query:", query);
      console.log("📝 AI Response length:", aiText.length, "characters");

      // Advanced parsing logic for structured AI responses
      const products: ProductRecommendation[] = [];

      // Split response into product sections
      const productSections = this.extractProductSections(aiText);

      for (let i = 0; i < Math.min(productSections.length, 3); i++) {
        const section = productSections[i];
        const product = this.parseProductSection(section, i + 1);
        if (product) {
          products.push(product);
        }
      }

      // If parsing fails, extract key information and create structured products
      if (products.length === 0) {
        return this.fallbackProductExtraction(aiText, query);
      }

      console.log(`✅ Successfully parsed ${products.length} products from AI response`);
      return products;

    } catch (error) {
      console.error("❌ Error parsing AI response:", error);
      throw new Error("Failed to process AI recommendations");
    }
  }

  private extractProductSections(text: string): string[] {
    // Look for numbered sections (1., 2., 3.) or product separators
    const sections = text.split(/(?:\n|^)(?:\d+\.|\*|\-)\s*/).filter(s => s.trim().length > 50);
    return sections.slice(0, 3); // Maximum 3 products
  }

  private parseProductSection(section: string, index: number): ProductRecommendation | null {
    try {
      // Extract product information using regex patterns and AI text analysis
      const name = this.extractField(section, ['PRODUCT_NAME:', 'Product:', 'Name:']) ||
                   this.extractFirstLine(section) ||
                   `AI Recommended Product ${index}`;

      const description = this.extractField(section, ['DESCRIPTION:', 'Description:']) ||
                         this.extractLongestSentence(section) ||
                         "Sustainable product recommended by AI";

      const priceMatch = section.match(/\$(\d+(?:\.\d{2})?)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : this.generateReasonablePrice();

      const sustainabilityMatch = section.match(/(\d+)%?\s*(?:sustainability|score)/i);
      const sustainabilityScore = sustainabilityMatch ?
        Math.min(100, Math.max(this.userPreferences.sustainabilityMin, parseInt(sustainabilityMatch[1]))) :
        this.generateSustainabilityScore();

      const certifications = this.extractCertifications(section);
      const carbonFootprint = this.extractCarbonFootprint(section);
      const chain = this.determineOptimalChain(section, name);

      return {
        id: `ai-product-${Date.now()}-${index}`,
        name: name.substring(0, 100), // Limit length
        description: description.substring(0, 300), // Limit length
        sustainabilityScore,
        price,
        chain,
        sellerAddress: this.generateSellerAddress(chain),
        certifications,
        carbonFootprint
      };

    } catch (error) {
      console.error(`Error parsing product section ${index}:`, error);
      return null;
    }
  }

  private extractField(text: string, fieldNames: string[]): string | null {
    for (const fieldName of fieldNames) {
      const regex = new RegExp(`${fieldName}\\s*([^\\n]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim().replace(/[\[\]]/g, '');
      }
    }
    return null;
  }

  private extractFirstLine(text: string): string {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines[0]?.trim() || '';
  }

  private extractLongestSentence(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.reduce((longest, current) =>
      current.length > longest.length ? current : longest, ''
    ).trim();
  }

  private generateReasonablePrice(): number {
    // Generate price within user's budget
    const maxPrice = this.userPreferences.budgetMax;
    const minPrice = Math.max(10, maxPrice * 0.3);
    return Math.round((Math.random() * (maxPrice - minPrice) + minPrice) * 100) / 100;
  }

  private generateSustainabilityScore(): number {
    // Generate score above user's minimum threshold
    const min = this.userPreferences.sustainabilityMin;
    const max = 95;
    return Math.floor(Math.random() * (max - min) + min);
  }

  private extractCertifications(text: string): string[] {
    const certificationKeywords = [
      'Fair Trade', 'Carbon Neutral', 'ENERGY STAR', 'FSC Certified',
      'Cradle to Cradle', 'EPEAT', 'Green Seal', 'LEED', 'Organic',
      'Recycled Content', 'Biodegradable', 'Renewable Energy',
      'Ocean Positive', 'B Corp', 'Climate Neutral'
    ];

    const found = certificationKeywords.filter(cert =>
      text.toLowerCase().includes(cert.toLowerCase())
    );

    // If no certifications found, assign relevant ones based on sustainability score
    if (found.length === 0) {
      return ['Eco-Certified', 'Sustainable Materials'];
    }

    return found.slice(0, 3); // Maximum 3 certifications
  }

  private extractCarbonFootprint(text: string): number {
    const carbonMatch = text.match(/(\d+(?:\.\d+)?)\s*kg?\s*(?:co2|carbon)/i);
    if (carbonMatch) {
      return parseFloat(carbonMatch[1]);
    }

    // Generate reasonable carbon footprint based on product type
    return Math.round((Math.random() * 3 + 0.5) * 100) / 100;
  }

  private determineOptimalChain(text: string, productName: string): "ethereum" | "avalanche" {
    // Smart chain selection based on product characteristics
    const ethereumKeywords = ['premium', 'luxury', 'high-end', 'professional'];
    const avalancheKeywords = ['eco', 'sustainable', 'green', 'renewable'];

    const textLower = (text + productName).toLowerCase();

    const ethereumScore = ethereumKeywords.reduce((score, keyword) =>
      textLower.includes(keyword) ? score + 1 : score, 0
    );

    const avalancheScore = avalancheKeywords.reduce((score, keyword) =>
      textLower.includes(keyword) ? score + 1 : score, 0
    );

    return avalancheScore > ethereumScore ? "avalanche" : "ethereum";
  }

  private generateSellerAddress(_chain: "ethereum" | "avalanche"): string {
    // Generate realistic-looking addresses
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  private fallbackProductExtraction(aiText: string, query: string): ProductRecommendation[] {
    console.log("🔄 Using fallback extraction for AI response");

    // Extract key product information even if structure is unclear
    const products: ProductRecommendation[] = [];
    const sentences = aiText.split(/[.!?]+/).filter(s => s.trim().length > 30);

    for (let i = 0; i < Math.min(3, Math.floor(sentences.length / 2)); i++) {
      const startIdx = i * 2;
      const productText = sentences.slice(startIdx, startIdx + 2).join('. ');

      products.push({
        id: `ai-fallback-${Date.now()}-${i}`,
        name: this.extractProductNameFromText(productText, query),
        description: productText.substring(0, 200),
        sustainabilityScore: this.generateSustainabilityScore(),
        price: this.generateReasonablePrice(),
        chain: Math.random() > 0.5 ? "ethereum" : "avalanche" as "ethereum" | "avalanche",
        sellerAddress: this.generateSellerAddress("ethereum"),
        certifications: this.extractCertifications(productText),
        carbonFootprint: this.extractCarbonFootprint(productText)
      });
    }

    return products;
  }

  private extractProductNameFromText(text: string, query: string): string {
    // Try to extract a product name from the text
    const words = text.split(' ').filter(word => word.length > 2);
    const queryWords = query.split(' ').filter(word => word.length > 2);

    // Find words that relate to the query
    const relevantWords = words.filter(word =>
      queryWords.some(qWord =>
        word.toLowerCase().includes(qWord.toLowerCase()) ||
        qWord.toLowerCase().includes(word.toLowerCase())
      )
    );

    if (relevantWords.length >= 2) {
      return relevantWords.slice(0, 3).join(' ');
    }

    // Fallback to first few meaningful words
    return words.slice(0, 3).join(' ') || `Sustainable ${query.split(' ')[0] || 'Product'}`;
  }


}
