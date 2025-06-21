import { createPublicClient, http, formatEther } from 'viem';
import { hardhat, mainnet, avalancheFuji } from 'viem/chains';

// Your deployed contract addresses
const CONTRACT_ADDRESSES = {
  hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  fuji: "0x328118233e846e9c629480F4DE1444cbE7b7189e",
  mainnet: "" // Add when deployed to mainnet
};

// ProductRegistry ABI (minimal for fetching products)
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
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "uint256", "name": "price", "type": "uint256"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
        {"internalType": "uint256", "name": "totalSales", "type": "uint256"},
        {"internalType": "uint256", "name": "totalReviews", "type": "uint256"},
        {"internalType": "uint256", "name": "averageRating", "type": "uint256"},
        {"internalType": "address", "name": "seller", "type": "address"},
        {"internalType": "bool", "name": "isActive", "type": "bool"},
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "string", "name": "category", "type": "string"},
        {"internalType": "string", "name": "imageHash", "type": "string"},
        {"internalType": "string", "name": "metadataHash", "type": "string"}
      ],
      "internalType": "struct IProductRegistry.Product[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface BlockchainProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string; // in ETH
  priceUSD: number;
  seller: string;
  averageRating: number;
  isActive: boolean;
  totalSales: number;
  totalReviews: number;
  createdAt: number;
  imageHash?: string;
  metadataHash?: string;
}

export class BlockchainProductFetcher {
  private client: any;
  private contractAddress: string;
  private chain: string;

  constructor(network: 'hardhat' | 'fuji' | 'mainnet' = 'hardhat') {
    this.chain = network;
    
    // Initialize the appropriate client based on network
    switch (network) {
      case 'fuji':
        this.client = createPublicClient({
          chain: avalancheFuji,
          transport: http()
        });
        this.contractAddress = CONTRACT_ADDRESSES.fuji;
        break;
      case 'mainnet':
        this.client = createPublicClient({
          chain: mainnet,
          transport: http()
        });
        this.contractAddress = CONTRACT_ADDRESSES.mainnet;
        break;
      default:
        this.client = createPublicClient({
          chain: hardhat,
          transport: http()
        });
        this.contractAddress = CONTRACT_ADDRESSES.hardhat;
    }
  }

  async fetchAllProducts(): Promise<BlockchainProduct[]> {
    try {
      console.log(`🔗 Fetching products from ${this.chain} network...`);
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

      // Fetch all products in batch
      const rawProducts = await this.client.readContract({
        address: this.contractAddress,
        abi: PRODUCT_REGISTRY_ABI,
        functionName: 'getBatchProducts',
        args: [productIds],
      });

      console.log(`📦 Raw products fetched: ${rawProducts.length}`);

      // Convert raw blockchain data to our format
      const products: BlockchainProduct[] = rawProducts.map((product: any) => {
        const priceInEth = formatEther(product.price);
        const priceInUSD = parseFloat(priceInEth) * 2500; // Approximate ETH to USD

        return {
          id: Number(product.id),
          name: product.name || `Product ${product.id}`,
          description: product.description || "No description available",
          category: product.category || "Uncategorized",
          price: priceInEth,
          priceUSD: Math.round(priceInUSD * 100) / 100,
          seller: product.seller,
          averageRating: Number(product.averageRating) / 100, // Convert from basis points
          isActive: product.isActive,
          totalSales: Number(product.totalSales),
          totalReviews: Number(product.totalReviews),
          createdAt: Number(product.createdAt),
          imageHash: product.imageHash,
          metadataHash: product.metadataHash
        };
      }).filter((product: { isActive: any; }) => product.isActive); // Only return active products

      console.log(`✅ Successfully fetched ${products.length} active products`);
      products.forEach(p => console.log(`   - ${p.name} (${p.price} ETH) by ${p.seller.slice(0, 6)}...`));

      return products;

    } catch (error) {
      console.error(`❌ Error fetching products from ${this.chain}:`, error);
      return [];
    }
  }

  async fetchProductsByCategory(category: string): Promise<BlockchainProduct[]> {
    const allProducts = await this.fetchAllProducts();
    return allProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }

  async fetchProductsBySeller(sellerAddress: string): Promise<BlockchainProduct[]> {
    const allProducts = await this.fetchAllProducts();
    return allProducts.filter(product => 
      product.seller.toLowerCase() === sellerAddress.toLowerCase()
    );
  }

  async searchProducts(query: string): Promise<BlockchainProduct[]> {
    const allProducts = await this.fetchAllProducts();
    const queryLower = query.toLowerCase();
    
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(queryLower) ||
      product.description.toLowerCase().includes(queryLower) ||
      product.category.toLowerCase().includes(queryLower)
    );
  }
}

// Export a default instance - using Fuji where your contract is deployed
export const productFetcher = new BlockchainProductFetcher('fuji');
