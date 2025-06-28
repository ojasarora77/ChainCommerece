import { createPublicClient, http, formatEther } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { ContractProduct } from '../marketplace/contractProductService';

// Your contract ABI - using the same ABI that works for the marketplace
const PRODUCT_REGISTRY_ABI = [
  {
    "inputs": [],
    "name": "totalProducts",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256[]", "name": "_productIds", "type": "uint256[]"}],
    "name": "getBatchProducts",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "string", "name": "category", "type": "string"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "string", "name": "imageHash", "type": "string"},
          {"internalType": "string", "name": "metadataHash", "type": "string"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "totalSales", "type": "uint256"},
          {"internalType": "uint256", "name": "totalReviews", "type": "uint256"},
          {"internalType": "uint256", "name": "averageRating", "type": "uint256"}
        ],
        "internalType": "struct ProductRegistry.Product[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * Server-side contract reader that can access the real 21 products
 * This works in API routes without React hooks
 */
export class ServerSideContractReader {
  private client;
  private contractAddress = '0x328118233e846e9c629480F4DE1444cbE7b7189e' as const;

  constructor() {
    // Create a public client for reading from Avalanche Fuji
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http()
    });
  }

  /**
   * Get all products from the smart contract (server-side)
   */
  async getAllProducts(): Promise<ContractProduct[]> {
    try {
      console.log("🔗 ServerSideContractReader: Fetching products from Avalanche Fuji...");
      console.log(`📍 Contract address: ${this.contractAddress}`);

      // Get total number of products
      const totalProducts = await this.client.readContract({
        address: this.contractAddress,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: 'totalProducts',
      });

      console.log(`📊 Total products on blockchain: ${totalProducts}`);

      if (!totalProducts || totalProducts === 0n) {
        console.log("⚠️ No products found on blockchain");
        return [];
      }

      // Create array of product IDs (assuming they start from 1)
      const productIds = Array.from({ length: Number(totalProducts) }, (_, i) => BigInt(i + 1));
      console.log(`🔢 Fetching product IDs: ${productIds.map(id => id.toString()).join(', ')}`);

      // Fetch all products in batch
      const rawProducts = await this.client.readContract({
        address: this.contractAddress,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: 'getBatchProducts',
        args: [productIds],
      });

      console.log(`📦 Raw products fetched: ${rawProducts.length}`);

      // Convert raw blockchain data to our format
      const products: ContractProduct[] = rawProducts
        .filter((product: any) => 
          product.id && 
          Number(product.id) > 0 && 
          product.name && 
          product.isActive // Only active products
        )
        .map((product: any) => {
          const priceInWei = product.price ? Number(product.price) : 0;
          const priceInEth = priceInWei / 1e18; // Convert wei to ETH
          const priceInUSD = priceInEth * 2500; // Approximate ETH to USD conversion

          return {
            id: Number(product.id),
            name: product.name || `Product ${product.id}`,
            description: product.description || "No description available",
            category: product.category || "Uncategorized",
            price: priceInEth.toFixed(6), // ETH price as string
            priceUSD: Math.round(priceInUSD * 100) / 100, // USD price rounded to 2 decimals
            seller: product.seller,
            averageRating: Number(product.averageRating) / 100 || 4.5, // Convert from scaled rating
            isActive: product.isActive,
            sustainabilityScore: this.estimateSustainabilityScore(product.name, product.description),
            certifications: this.generateCertifications(product.name, product.description),
            carbonFootprint: this.estimateCarbonFootprint(product.category),
            chain: "avalanche" as const // Your contract is on Avalanche Fuji
          } as ContractProduct;
        });

      console.log(`✅ Successfully processed ${products.length} active products`);
      products.forEach(p => console.log(`   - ${p.name} (${p.price} ETH) - ${p.category}`));

      return products;

    } catch (error) {
      console.error(`❌ ServerSideContractReader error:`, error);
      return [];
    }
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
      case "home": case "office": case "home & garden": return 1.5;
      case "beauty": return 1.0;
      case "automotive": return 3.0;
      case "books": return 0.5;
      default: return 2.0;
    }
  }
}

// Export a singleton instance
export const serverSideContractReader = new ServerSideContractReader();
