// Real-time product tracking service for marketplace analytics
// Tracks product views, searches, purchases, and user interactions

import { userTrackingService } from '../analytics/UserTrackingService';
import { realDataService } from '../analytics/RealDataService';

interface ProductInteraction {
  productId: number;
  productName: string;
  action: 'view' | 'search' | 'add_to_cart' | 'purchase_initiated' | 'purchase_completed';
  userAddress?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ProductAnalytics {
  productId: number;
  views: number;
  addToCarts: number;
  purchases: number;
  conversionRate: number;
  revenue: number;
  lastViewed: number;
}

class RealProductTracker {
  private static instance: RealProductTracker;
  private interactions: ProductInteraction[] = [];
  private productAnalytics: Map<number, ProductAnalytics> = new Map();

  private constructor() {
    // Initialize tracking
    this.setupProductTracking();
  }

  public static getInstance(): RealProductTracker {
    if (!RealProductTracker.instance) {
      RealProductTracker.instance = new RealProductTracker();
    }
    return RealProductTracker.instance;
  }

  // Track product view
  public trackProductView(productId: number, productName: string, userAddress?: string, metadata?: Record<string, any>): void {
    const interaction: ProductInteraction = {
      productId,
      productName,
      action: 'view',
      userAddress,
      timestamp: Date.now(),
      metadata
    };

    this.interactions.push(interaction);
    this.updateProductAnalytics(productId, 'view');

    // Track in user service
    if (userAddress) {
      userTrackingService.trackProductView(productId, productName);
      realDataService.trackUserInteraction(userAddress, 'product_view', { productId, productName });
    }

    console.log('📊 Product view tracked:', productName, userAddress?.slice(0, 6) + '...');
  }

  // Track product search
  public trackProductSearch(query: string, results: any[], userAddress?: string): void {
    const interaction: ProductInteraction = {
      productId: 0, // Search doesn't have specific product ID
      productName: query,
      action: 'search',
      userAddress,
      timestamp: Date.now(),
      metadata: { resultsCount: results.length, results: results.slice(0, 5).map(r => r.id) }
    };

    this.interactions.push(interaction);

    // Track in user service
    if (userAddress) {
      userTrackingService.trackProductSearch(query, results.length);
      realDataService.trackUserInteraction(userAddress, 'product_search', { query, resultsCount: results.length });
    }

    console.log('📊 Product search tracked:', query, `${results.length} results`);
  }

  // Track add to cart
  public trackAddToCart(productId: number, productName: string, price: number, userAddress?: string): void {
    const interaction: ProductInteraction = {
      productId,
      productName,
      action: 'add_to_cart',
      userAddress,
      timestamp: Date.now(),
      metadata: { price }
    };

    this.interactions.push(interaction);
    this.updateProductAnalytics(productId, 'add_to_cart');

    // Track in user service
    if (userAddress) {
      userTrackingService.trackAddToCart(productId, productName, price);
      realDataService.trackUserInteraction(userAddress, 'add_to_cart', { productId, productName, price });
    }

    console.log('📊 Add to cart tracked:', productName, `$${price}`);
  }

  // Track purchase initiated
  public trackPurchaseInitiated(productId: number, productName: string, price: number, userAddress?: string): void {
    const interaction: ProductInteraction = {
      productId,
      productName,
      action: 'purchase_initiated',
      userAddress,
      timestamp: Date.now(),
      metadata: { price }
    };

    this.interactions.push(interaction);

    // Track in user service
    if (userAddress) {
      userTrackingService.trackPurchaseInitiated(productId, productName, price);
      realDataService.trackUserInteraction(userAddress, 'purchase_initiated', { productId, productName, price });
    }

    console.log('📊 Purchase initiated:', productName, `$${price}`);
  }

  // Track purchase completed
  public trackPurchaseCompleted(productId: number, productName: string, price: number, userAddress?: string, transactionHash?: string): void {
    const interaction: ProductInteraction = {
      productId,
      productName,
      action: 'purchase_completed',
      userAddress,
      timestamp: Date.now(),
      metadata: { price, transactionHash }
    };

    this.interactions.push(interaction);
    this.updateProductAnalytics(productId, 'purchase', price);

    // Track in user service
    if (userAddress) {
      userTrackingService.trackPurchaseCompleted(productId, productName, price, transactionHash);
      realDataService.trackUserInteraction(userAddress, 'purchase_completed', { productId, productName, price, transactionHash });
    }

    console.log('📊 Purchase completed:', productName, `$${price}`, transactionHash?.slice(0, 10) + '...');
  }

  // Update product analytics
  private updateProductAnalytics(productId: number, action: 'view' | 'add_to_cart' | 'purchase', revenue?: number): void {
    let analytics = this.productAnalytics.get(productId);
    
    if (!analytics) {
      analytics = {
        productId,
        views: 0,
        addToCarts: 0,
        purchases: 0,
        conversionRate: 0,
        revenue: 0,
        lastViewed: Date.now()
      };
    }

    switch (action) {
      case 'view':
        analytics.views++;
        analytics.lastViewed = Date.now();
        break;
      case 'add_to_cart':
        analytics.addToCarts++;
        break;
      case 'purchase':
        analytics.purchases++;
        if (revenue) analytics.revenue += revenue;
        break;
    }

    // Calculate conversion rate
    analytics.conversionRate = analytics.views > 0 ? (analytics.purchases / analytics.views) * 100 : 0;

    this.productAnalytics.set(productId, analytics);
  }

  // Get product analytics
  public getProductAnalytics(productId: number): ProductAnalytics | null {
    return this.productAnalytics.get(productId) || null;
  }

  // Get all product analytics
  public getAllProductAnalytics(): ProductAnalytics[] {
    return Array.from(this.productAnalytics.values());
  }

  // Get top products by metric
  public getTopProductsByViews(limit: number = 5): ProductAnalytics[] {
    return Array.from(this.productAnalytics.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  public getTopProductsByRevenue(limit: number = 5): ProductAnalytics[] {
    return Array.from(this.productAnalytics.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  public getTopProductsByConversion(limit: number = 5): ProductAnalytics[] {
    return Array.from(this.productAnalytics.values())
      .filter(p => p.views >= 5) // Only products with meaningful view count
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);
  }

  // Get recent interactions
  public getRecentInteractions(limit: number = 10): ProductInteraction[] {
    return this.interactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get interactions by user
  public getUserInteractions(userAddress: string): ProductInteraction[] {
    return this.interactions
      .filter(interaction => interaction.userAddress === userAddress)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get search analytics
  public getSearchAnalytics(): { query: string; count: number; avgResults: number }[] {
    const searchMap = new Map<string, { count: number; totalResults: number }>();
    
    this.interactions
      .filter(i => i.action === 'search')
      .forEach(interaction => {
        const query = interaction.productName.toLowerCase();
        const resultsCount = interaction.metadata?.resultsCount || 0;
        
        if (searchMap.has(query)) {
          const existing = searchMap.get(query)!;
          existing.count++;
          existing.totalResults += resultsCount;
        } else {
          searchMap.set(query, { count: 1, totalResults: resultsCount });
        }
      });

    return Array.from(searchMap.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgResults: data.count > 0 ? data.totalResults / data.count : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Setup automatic tracking
  private setupProductTracking(): void {
    // Track page visibility for engagement metrics
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // User left the page - could affect engagement metrics
          console.log('📊 Page hidden - user engagement paused');
        } else {
          console.log('📊 Page visible - user engagement resumed');
        }
      });
    }
  }

  // Clear old data (for memory management)
  public clearOldData(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.interactions = this.interactions.filter(i => i.timestamp > cutoff);
    console.log('📊 Cleared old interaction data');
  }

  // Get summary statistics
  public getSummaryStats(): {
    totalInteractions: number;
    totalViews: number;
    totalPurchases: number;
    totalRevenue: number;
    avgConversionRate: number;
    uniqueProducts: number;
    uniqueUsers: number;
  } {
    const totalInteractions = this.interactions.length;
    const totalViews = this.interactions.filter(i => i.action === 'view').length;
    const totalPurchases = this.interactions.filter(i => i.action === 'purchase_completed').length;
    
    const totalRevenue = Array.from(this.productAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.revenue, 0);
    
    const conversionRates = Array.from(this.productAnalytics.values())
      .filter(p => p.views > 0)
      .map(p => p.conversionRate);
    const avgConversionRate = conversionRates.length > 0
      ? conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length
      : 0;

    const uniqueProducts = this.productAnalytics.size;
    const uniqueUsers = new Set(this.interactions.map(i => i.userAddress).filter(Boolean)).size;

    return {
      totalInteractions,
      totalViews,
      totalPurchases,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgConversionRate: Math.round(avgConversionRate * 100) / 100,
      uniqueProducts,
      uniqueUsers
    };
  }
}

// Export singleton instance
export const realProductTracker = RealProductTracker.getInstance();
export default RealProductTracker;
