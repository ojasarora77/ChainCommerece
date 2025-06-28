import { HybridProductService } from '../../marketplace/hybridProductService';
import { ContractProduct } from '../../marketplace/contractProductService';
import { ServerSideContractReader } from '../../blockchain/serverSideContractReader';

export interface FunctionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class ShoppingAgentFunctions {
  private hybridService: HybridProductService;
  private contractReader: ServerSideContractReader;

  constructor() {
    this.hybridService = HybridProductService.getInstance();
    this.contractReader = new ServerSideContractReader();
  }

  /**
   * Search for products based on user criteria
   */
  async searchProducts(parameters: {
    query: string;
    category?: string;
    maxPrice?: number;
    sustainabilityMin?: number;
  }): Promise<FunctionResult> {
    try {
      console.log('🔍 Agent Function: searchProducts', parameters);

      // Get all products from the hybrid service
      const allProducts = this.hybridService.getCachedProducts();
      
      if (allProducts.length === 0) {
        // Try to fetch fresh data
        await this.refreshProductData();
      }

      // Apply filters
      let filteredProducts = this.hybridService.getCachedProducts();

      // Category filter
      if (parameters.category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category.toLowerCase().includes(parameters.category!.toLowerCase())
        );
      }

      // Price filter
      if (parameters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.priceUSD <= parameters.maxPrice!);
      }

      // Sustainability filter
      if (parameters.sustainabilityMin) {
        filteredProducts = filteredProducts.filter(p => 
          (p.sustainabilityScore || 0) >= parameters.sustainabilityMin!
        );
      }

      // Search by query
      if (parameters.query) {
        const allProducts = await this.contractReader.getAllProducts();
        const searchResults = await this.hybridService.searchProducts(allProducts, parameters.query, parameters.category);
        // Combine with filters
        const searchIds = new Set(searchResults.map(p => p.id));
        filteredProducts = filteredProducts.filter(p => searchIds.has(p.id));
      }

      // Sort by relevance (sustainability score + rating)
      filteredProducts.sort((a, b) => {
        const scoreA = (a.sustainabilityScore || 0) + (a.averageRating * 20);
        const scoreB = (b.sustainabilityScore || 0) + (b.averageRating * 20);
        return scoreB - scoreA;
      });

      // Limit to top 5 results
      const topResults = filteredProducts.slice(0, 5);

      return {
        success: true,
        data: {
          products: topResults,
          totalFound: filteredProducts.length,
          query: parameters.query,
          filters: {
            category: parameters.category,
            maxPrice: parameters.maxPrice,
            sustainabilityMin: parameters.sustainabilityMin
          }
        },
        message: `Found ${topResults.length} products matching your criteria`
      };

    } catch (error) {
      console.error('❌ searchProducts error:', error);
      return {
        success: false,
        error: 'Failed to search products',
        message: 'Sorry, I encountered an error while searching for products. Please try again.'
      };
    }
  }

  /**
   * Get detailed information about a specific product
   */
  async getProductDetails(parameters: { productId: number }): Promise<FunctionResult> {
    try {
      console.log('📋 Agent Function: getProductDetails', parameters);

      const products = this.hybridService.getCachedProducts();
      const product = products.find(p => p.id === parameters.productId);

      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          message: `Sorry, I couldn't find a product with ID ${parameters.productId}`
        };
      }

      // Get additional details from contract if needed
      const allProducts = await this.contractReader.getAllProducts();
      const contractDetails = allProducts.find(p => Number(p.id) === parameters.productId);

      return {
        success: true,
        data: {
          product: {
            ...product,
            ...contractDetails,
            // Add computed fields
            valueScore: this.calculateValueScore(product),
            sustainabilityGrade: this.getSustainabilityGrade(product.sustainabilityScore || 0),
            estimatedDelivery: this.getEstimatedDelivery(),
            carbonFootprint: this.calculateCarbonFootprint(product)
          }
        },
        message: `Here are the complete details for ${product.name}`
      };

    } catch (error) {
      console.error('❌ getProductDetails error:', error);
      return {
        success: false,
        error: 'Failed to get product details',
        message: 'Sorry, I encountered an error while fetching product details.'
      };
    }
  }

  /**
   * Create a new order for the user
   */
  async createOrder(parameters: {
    productId: number;
    quantity: number;
    userAddress: string;
  }): Promise<FunctionResult> {
    try {
      console.log('🛒 Agent Function: createOrder', parameters);

      // Validate product exists
      const products = this.hybridService.getCachedProducts();
      const product = products.find(p => p.id === parameters.productId);

      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          message: `Sorry, I couldn't find the product you want to order.`
        };
      }

      // Validate quantity
      if (parameters.quantity <= 0) {
        return {
          success: false,
          error: 'Invalid quantity',
          message: 'Please specify a valid quantity (greater than 0).'
        };
      }

      // Calculate totals
      const subtotal = product.priceUSD * parameters.quantity;
      const platformFee = subtotal * 0.025; // 2.5% platform fee
      const total = subtotal + platformFee;

      // Create order object
      const order = {
        orderId: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: parameters.productId,
        productName: product.name,
        quantity: parameters.quantity,
        pricePerUnit: product.priceUSD,
        subtotal,
        platformFee,
        total,
        userAddress: parameters.userAddress,
        sellerAddress: product.seller,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        estimatedDelivery: this.getEstimatedDelivery(),
        sustainabilityImpact: this.calculateSustainabilityImpact(product, parameters.quantity)
      };

      // In a real implementation, you would save this to your database
      // For now, we'll return the order details

      return {
        success: true,
        data: { order },
        message: `Order created successfully! Total: $${total.toFixed(2)} (including $${platformFee.toFixed(2)} platform fee)`
      };

    } catch (error) {
      console.error('❌ createOrder error:', error);
      return {
        success: false,
        error: 'Failed to create order',
        message: 'Sorry, I encountered an error while creating your order. Please try again.'
      };
    }
  }

  /**
   * Process payment for an order
   */
  async processPayment(parameters: {
    orderId: string;
    paymentMethod: string;
    amount: string;
  }): Promise<FunctionResult> {
    try {
      console.log('💳 Agent Function: processPayment', parameters);

      // Validate payment method
      const supportedMethods = ['ETH', 'USDC', 'USDT', 'MATIC'];
      if (!supportedMethods.includes(parameters.paymentMethod.toUpperCase())) {
        return {
          success: false,
          error: 'Unsupported payment method',
          message: `Sorry, we currently support: ${supportedMethods.join(', ')}`
        };
      }

      // Simulate payment processing
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const gasEstimate = this.estimateGasFee(parameters.paymentMethod);

      // In a real implementation, you would:
      // 1. Validate the order exists and is pending payment
      // 2. Create a smart contract transaction
      // 3. Return transaction details for user approval
      // 4. Monitor transaction status

      return {
        success: true,
        data: {
          transactionHash,
          paymentMethod: parameters.paymentMethod,
          amount: parameters.amount,
          gasEstimate,
          status: 'pending_approval',
          approvalRequired: true,
          escrowAddress: '0x742d35Cc6634C0532925a3b8D4C9db96DfbB8E24', // Example escrow contract
          estimatedConfirmation: '2-5 minutes'
        },
        message: `Payment transaction prepared! Please approve the transaction in your wallet. Gas fee: ~$${gasEstimate.toFixed(2)}`
      };

    } catch (error) {
      console.error('❌ processPayment error:', error);
      return {
        success: false,
        error: 'Failed to process payment',
        message: 'Sorry, I encountered an error while processing your payment. Please try again.'
      };
    }
  }

  /**
   * Check the status of an existing order
   */
  async checkOrderStatus(parameters: { orderId: string }): Promise<FunctionResult> {
    try {
      console.log('📦 Agent Function: checkOrderStatus', parameters);

      // In a real implementation, you would query your database/blockchain
      // For now, we'll simulate different order statuses

      const mockStatuses = [
        'pending_payment',
        'payment_confirmed',
        'processing',
        'shipped',
        'delivered',
        'completed'
      ];

      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
      
      const statusDetails = {
        orderId: parameters.orderId,
        status: randomStatus,
        lastUpdated: new Date().toISOString(),
        trackingNumber: randomStatus === 'shipped' ? `TRK${Math.random().toString().substr(2, 10)}` : null,
        estimatedDelivery: this.getEstimatedDelivery(),
        statusHistory: [
          { status: 'created', timestamp: new Date(Date.now() - 86400000).toISOString() },
          { status: 'payment_confirmed', timestamp: new Date(Date.now() - 43200000).toISOString() },
          { status: randomStatus, timestamp: new Date().toISOString() }
        ]
      };

      return {
        success: true,
        data: statusDetails,
        message: `Your order is currently: ${randomStatus.replace('_', ' ').toUpperCase()}`
      };

    } catch (error) {
      console.error('❌ checkOrderStatus error:', error);
      return {
        success: false,
        error: 'Failed to check order status',
        message: 'Sorry, I encountered an error while checking your order status.'
      };
    }
  }

  // Helper methods
  private async refreshProductData(): Promise<void> {
    try {
      const products = await this.contractReader.getAllProducts();
      this.hybridService.setProductsFromHook(products);
    } catch (error) {
      console.error('Failed to refresh product data:', error);
    }
  }

  private calculateValueScore(product: ContractProduct): number {
    return Math.round(((product.averageRating * 20) + (product.sustainabilityScore || 0)) / product.priceUSD);
  }

  private getSustainabilityGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  }

  private getEstimatedDelivery(): string {
    const days = Math.floor(Math.random() * 7) + 3; // 3-10 days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString();
  }

  private calculateCarbonFootprint(product: ContractProduct): string {
    const baseFootprint = product.priceUSD * 0.1; // Mock calculation
    const sustainabilityReduction = (product.sustainabilityScore || 0) / 100;
    const finalFootprint = baseFootprint * (1 - sustainabilityReduction);
    return `${finalFootprint.toFixed(2)} kg CO2`;
  }

  private calculateSustainabilityImpact(product: ContractProduct, quantity: number): string {
    const impact = (product.sustainabilityScore || 0) * quantity * 0.01;
    return `+${impact.toFixed(1)} sustainability points`;
  }

  private estimateGasFee(paymentMethod: string): number {
    const baseFees = {
      'ETH': 0.005,
      'USDC': 0.008,
      'USDT': 0.008,
      'MATIC': 0.001
    };
    return baseFees[paymentMethod as keyof typeof baseFees] || 0.005;
  }
}
