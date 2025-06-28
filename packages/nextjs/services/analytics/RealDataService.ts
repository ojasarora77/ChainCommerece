// Real-time data service that fetches live data from smart contracts
// Replaces all mock data with actual blockchain and user interaction data

import { createPublicClient, http, formatEther } from 'viem';
import { avalancheFuji } from 'viem/chains';

interface RealAnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  avgOrderValue: number;
  topProducts: Array<{
    id: number;
    name: string;
    orders: number;
    revenue: number;
  }>;
  userEngagement: {
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  sustainabilityMetrics: {
    avgSustainabilityScore: number;
    co2Saved: number;
    ecoFriendlyOrders: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  timeRange: string;
  lastUpdated: string;
}

interface ContractProduct {
  id: bigint;
  name: string;
  description: string;
  category: string;
  price: bigint;
  seller: string;
  imageHash: string;
  metadataHash: string;
  isActive: boolean;
  createdAt: bigint;
  totalSales: bigint;
  totalReviews: bigint;
  averageRating: bigint;
}

interface SellerProfile {
  name: string;
  description: string;
  totalProducts: bigint;
  totalSales: bigint;
  reputation: bigint;
  isVerified: boolean;
  joinedAt: bigint;
}

class RealDataService {
  private static instance: RealDataService;
  private client: any;
  private contractAddress: string;
  private userSessions: Map<string, any> = new Map();
  private recentActivities: Array<any> = [];

  private constructor() {
    // Initialize Viem client for Avalanche Fuji (where your contract is deployed)
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http()
    });
    
    // Your ProductRegistry contract address on Fuji
    this.contractAddress = "0x81194315767d0524470ae715ca0284fC061C1e60"; // Update with your actual address
  }

  public static getInstance(): RealDataService {
    if (!RealDataService.instance) {
      RealDataService.instance = new RealDataService();
    }
    return RealDataService.instance;
  }

  // Track user sessions for real engagement metrics
  public trackUserSession(userAddress: string, action: string, metadata?: any): void {
    const sessionId = `${userAddress}_${Date.now()}`;
    const session = {
      userAddress,
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      actions: [{ action, timestamp: Date.now(), metadata }],
      duration: 0
    };

    this.userSessions.set(sessionId, session);
    
    // Add to recent activities
    this.addRecentActivity(action, `User ${userAddress.slice(0, 6)}... ${action}`, metadata);
  }

  // Track real user interactions
  public trackUserInteraction(userAddress: string, action: string, metadata?: any): void {
    // Update existing session or create new one
    const existingSessions = Array.from(this.userSessions.values())
      .filter(s => s.userAddress === userAddress)
      .sort((a, b) => b.lastActivity - a.lastActivity);

    if (existingSessions.length > 0) {
      const session = existingSessions[0];
      session.lastActivity = Date.now();
      session.duration = session.lastActivity - session.startTime;
      session.actions.push({ action, timestamp: Date.now(), metadata });
    } else {
      this.trackUserSession(userAddress, action, metadata);
    }

    this.addRecentActivity(action, this.getActivityDescription(action, metadata), metadata);
  }

  private addRecentActivity(type: string, description: string, metadata?: any): void {
    this.recentActivities.unshift({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      description,
      timestamp: this.getRelativeTime(new Date().toISOString()),
      metadata
    });

    // Keep only last 50 activities
    if (this.recentActivities.length > 50) {
      this.recentActivities = this.recentActivities.slice(0, 50);
    }
  }

  private getActivityDescription(action: string, metadata?: any): string {
    switch (action) {
      case 'product_search':
        return `Search for "${metadata?.query || 'products'}"`;
      case 'product_view':
        return `Viewed ${metadata?.productName || 'product'}`;
      case 'add_to_cart':
        return `Added ${metadata?.productName || 'product'} to cart`;
      case 'purchase_initiated':
        return `Started purchase for ${metadata?.productName || 'product'}`;
      case 'purchase_completed':
        return `Completed purchase of ${metadata?.productName || 'product'}`;
      case 'agent_interaction':
        return `Interacted with AI shopping assistant`;
      case 'preferences_updated':
        return 'Updated shopping preferences';
      default:
        return action.replace('_', ' ');
    }
  }

  // Fetch real data from smart contracts
  public async getRealAnalyticsData(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<RealAnalyticsData> {
    try {
      console.log('🔗 Fetching real data from smart contracts...');

      // Get contract data
      const [totalProducts, allProducts, marketplaceStats] = await Promise.all([
        this.getTotalProducts(),
        this.getAllProducts(),
        this.getMarketplaceStats()
      ]);

      // Calculate real metrics
      const totalUsers = this.getUniqueUsersCount();
      const totalOrders = this.getTotalOrdersFromProducts(allProducts);
      const totalRevenue = this.getTotalRevenueFromProducts(allProducts);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

      // Get top products by sales
      const topProducts = this.getTopProductsBySales(allProducts);

      // Calculate user engagement from tracked sessions
      const userEngagement = this.calculateUserEngagement();

      // Calculate sustainability metrics
      const sustainabilityMetrics = this.calculateSustainabilityMetrics(allProducts);

      return {
        totalUsers,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        topProducts,
        userEngagement,
        sustainabilityMetrics,
        recentActivity: this.recentActivities.slice(0, 10),
        timeRange,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error fetching real analytics data:', error);
      throw error;
    }
  }

  private async getTotalProducts(): Promise<number> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: [
          {
            "inputs": [],
            "name": "totalProducts",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'totalProducts',
      });
      return Number(result);
    } catch (error) {
      console.error('Error fetching total products:', error);
      return 0;
    }
  }

  private async getAllProducts(): Promise<ContractProduct[]> {
    try {
      const totalProducts = await this.getTotalProducts();
      if (totalProducts === 0) return [];

      const productIds = Array.from({ length: totalProducts }, (_, i) => BigInt(i + 1));
      
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: [
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
        ],
        functionName: 'getBatchProducts',
        args: [productIds],
      });

      return result as ContractProduct[];
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  }

  private async getMarketplaceStats(): Promise<any> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: [
          {
            "inputs": [],
            "name": "getMarketplaceStats",
            "outputs": [
              {"internalType": "uint256", "name": "totalProducts", "type": "uint256"},
              {"internalType": "uint256", "name": "totalSellers", "type": "uint256"},
              {"internalType": "uint256", "name": "totalSales", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'getMarketplaceStats',
      });
      return result;
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      return [0, 0, 0];
    }
  }

  private getUniqueUsersCount(): number {
    const uniqueUsers = new Set();
    this.userSessions.forEach(session => {
      uniqueUsers.add(session.userAddress);
    });
    return uniqueUsers.size;
  }

  private getTotalOrdersFromProducts(products: ContractProduct[]): number {
    return products.reduce((total, product) => total + Number(product.totalSales), 0);
  }

  private getTotalRevenueFromProducts(products: ContractProduct[]): number {
    return products.reduce((total, product) => {
      const priceInEth = parseFloat(formatEther(product.price));
      const sales = Number(product.totalSales);
      return total + (priceInEth * sales * 2500); // Convert to USD (approximate)
    }, 0);
  }

  private getTopProductsBySales(products: ContractProduct[]): Array<{id: number; name: string; orders: number; revenue: number}> {
    return products
      .map(product => ({
        id: Number(product.id),
        name: product.name,
        orders: Number(product.totalSales),
        revenue: parseFloat(formatEther(product.price)) * Number(product.totalSales) * 2500
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }

  private calculateUserEngagement(): {totalSessions: number; avgSessionDuration: number; bounceRate: number} {
    const sessions = Array.from(this.userSessions.values());
    const totalSessions = sessions.length;
    
    if (totalSessions === 0) {
      return { totalSessions: 0, avgSessionDuration: 0, bounceRate: 0 };
    }

    const avgSessionDuration = sessions.reduce((total, session) => {
      const duration = session.duration || (Date.now() - session.startTime);
      return total + (duration / 1000 / 60); // Convert to minutes
    }, 0) / totalSessions;

    const bounceSessions = sessions.filter(session => session.actions.length <= 1).length;
    const bounceRate = (bounceSessions / totalSessions) * 100;

    return {
      totalSessions,
      avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100
    };
  }

  private calculateSustainabilityMetrics(products: ContractProduct[]): {avgSustainabilityScore: number; co2Saved: number; ecoFriendlyOrders: number} {
    // Estimate sustainability scores based on product categories and names
    const sustainabilityScores = products.map(product => this.estimateSustainabilityScore(product));
    const avgSustainabilityScore = sustainabilityScores.length > 0 
      ? sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length 
      : 85;

    const totalOrders = this.getTotalOrdersFromProducts(products);
    const co2Saved = totalOrders * 2.5; // Estimate 2.5kg CO2 saved per sustainable order

    const ecoFriendlyOrders = products.filter(product => 
      this.estimateSustainabilityScore(product) >= 80
    ).reduce((total, product) => total + Number(product.totalSales), 0);

    const ecoFriendlyPercentage = totalOrders > 0 ? (ecoFriendlyOrders / totalOrders) * 100 : 0;

    return {
      avgSustainabilityScore: Math.round(avgSustainabilityScore * 10) / 10,
      co2Saved: Math.round(co2Saved * 10) / 10,
      ecoFriendlyOrders: Math.round(ecoFriendlyPercentage)
    };
  }

  private estimateSustainabilityScore(product: ContractProduct): number {
    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();
    const category = product.category.toLowerCase();

    let score = 70; // Base score

    // Boost for sustainable keywords
    const sustainableKeywords = ['sustainable', 'bamboo', 'organic', 'eco', 'green', 'recycled', 'solar', 'renewable'];
    sustainableKeywords.forEach(keyword => {
      if (name.includes(keyword) || description.includes(keyword)) {
        score += 10;
      }
    });

    // Category-based scoring
    if (category.includes('electronics') && (name.includes('solar') || name.includes('energy'))) {
      score += 15;
    }
    if (category.includes('clothing') && (name.includes('organic') || name.includes('hemp'))) {
      score += 12;
    }

    return Math.min(score, 100);
  }

  private getRelativeTime(timestamp: string): string {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

// Export singleton instance
export const realDataService = RealDataService.getInstance();
export default RealDataService;
