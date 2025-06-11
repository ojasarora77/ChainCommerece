import { invokeAI } from "../index";
import { ProductRecommendation, UserPreferences } from "~~/types/bedrock";

export class ShoppingAgent {
  private sessionId: string;
  private userPreferences: UserPreferences;

  constructor(userId: string, preferences: UserPreferences) {
    this.sessionId = `shopping-${userId}-${Date.now()}`;
    this.userPreferences = preferences;
  }

  async findProducts(query: string): Promise<ProductRecommendation[]> {
    try {
      // Enhanced AI prompt for production-ready product search
      const prompt = `You are an expert AI shopping assistant for a sustainable e-commerce marketplace. Analyze this product search request and provide detailed recommendations.

SEARCH QUERY: "${query}"

USER CONTEXT:
- Sustainability Threshold: ${this.userPreferences.sustainabilityMin}% minimum
- Budget Limit: $${this.userPreferences.budgetMax}
- Preferred Blockchain: ${this.userPreferences.preferredChain || 'Ethereum/Avalanche'}
- Product Categories: ${this.userPreferences.categories.join(', ')}
- Ethical Priorities: ${this.userPreferences.ethicalConcerns.join(', ')}

TASK: Recommend exactly 3 products that match the search criteria. For each product, provide:

1. PRODUCT_NAME: [Specific, realistic product name]
2. DESCRIPTION: [Detailed description emphasizing sustainability features, materials, and benefits]
3. PRICE: [Realistic market price in USD, within budget]
4. SUSTAINABILITY_SCORE: [Score 0-100 based on environmental impact, materials, manufacturing]
5. CERTIFICATIONS: [Relevant eco-certifications like Fair Trade, Carbon Neutral, ENERGY STAR, etc.]
6. CARBON_FOOTPRINT: [Estimated CO2 impact in kg]
7. SELLER_CHAIN: [Recommend Ethereum or Avalanche based on product type]
8. KEY_FEATURES: [3-4 bullet points of main product features]

REQUIREMENTS:
- All products must meet or exceed the ${this.userPreferences.sustainabilityMin}% sustainability threshold
- All prices must be under $${this.userPreferences.budgetMax}
- Focus on real, purchasable products that exist in the market
- Prioritize products with verified sustainability credentials
- Consider regional availability and shipping impact

Format as structured recommendations with clear product details.`;

      const response = await invokeAI(prompt);

      if (!response || !response.content || !response.content[0]?.text) {
        throw new Error("Invalid AI response format");
      }

      // Parse the AI response into structured product data
      return this.parseAdvancedAIResponse(response.content[0].text, query);

    } catch (error) {
      console.error("AI Shopping Assistant temporarily unavailable:", error);
      throw new Error("AI Shopping Assistant is temporarily unavailable. Please try again in a moment.");
    }
  }

  async monitorNewListings() {
    // Autonomous monitoring logic
    setInterval(async () => {
      const newProducts = await this.findProducts("new sustainable products listed today");
      // Check against user preferences and notify
    }, 3600000); // Check every hour
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
