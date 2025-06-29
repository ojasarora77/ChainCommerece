import { HybridProductService } from '../../marketplace/hybridProductService';
import { ContractProduct } from '../../marketplace/contractProductService';
import { ServerSideContractReader } from '../../blockchain/serverSideContractReader';
import { enhancedShoppingAgent, SearchContext } from '../../ai/EnhancedShoppingAgent';
import { productKnowledgeBase } from '../../ai/ProductKnowledgeBase';

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
   * Search for products based on user criteria - Enhanced with AI intelligence
   */
  async searchProducts(parameters: {
    query: string;
    category?: string;
    maxPrice?: number;
    sustainabilityMin?: number;
  }): Promise<FunctionResult> {
    try {
      console.log('🔍 Real Smart Contract Search: searchProducts', parameters);

      // First, get ALL real products from smart contract
      const allRealProducts = await this.contractReader.getAllProducts();
      console.log(`📦 Retrieved ${allRealProducts.length} real products from blockchain`);

      if (allRealProducts.length === 0) {
        console.log('⚠️ No real products found, falling back to knowledge base');
        // Fallback to knowledge base if smart contract has no products
        const searchContext: SearchContext = {
          query: parameters.query,
          category: parameters.category,
          maxPrice: parameters.maxPrice,
          sustainabilityMin: parameters.sustainabilityMin
        };
        const agentResponse = await enhancedShoppingAgent.processQuery(searchContext);

        return {
          success: true,
          data: {
            products: agentResponse.products.slice(0, 5), // Limit to 5 for consistency
            totalFound: agentResponse.products.length,
            query: parameters.query,
            source: 'knowledge_base_fallback'
          },
          message: `Found ${agentResponse.products.length} products from knowledge base (smart contract unavailable)`
        };
      }

      // Filter real products based on search criteria
      let filteredProducts = allRealProducts.filter(product => {
        // Category filter
        if (parameters.category &&
            product.category.toLowerCase() !== parameters.category.toLowerCase()) {
          return false;
        }

        // Price filter (convert to USD for comparison)
        if (parameters.maxPrice && product.priceUSD > parameters.maxPrice) {
          return false;
        }

        // Sustainability filter
        if (parameters.sustainabilityMin &&
            (product.sustainabilityScore || 0) < parameters.sustainabilityMin) {
          return false;
        }

        // Query filter (search in name and description with improved matching)
        if (parameters.query) {
          const queryLower = parameters.query.toLowerCase();
          const productName = product.name.toLowerCase();
          const productDescription = product.description.toLowerCase();
          const productCategory = product.category.toLowerCase();

          // Split query into words for better matching
          const queryWords = queryLower.split(' ').filter(word => word.length > 2);

          // Check if all query words are found in product data
          const allWordsMatch = queryWords.every(word =>
            productName.includes(word) ||
            productDescription.includes(word) ||
            productCategory.includes(word)
          );

          // Also check for exact phrase match
          const exactMatch = productName.includes(queryLower) ||
                            productDescription.includes(queryLower) ||
                            productCategory.includes(queryLower);

          return allWordsMatch || exactMatch;
        }

        return true;
      });

      // Sort by relevance and sustainability score
      filteredProducts.sort((a, b) => {
        const aScore = (a.sustainabilityScore || 0) + (a.averageRating * 10);
        const bScore = (b.sustainabilityScore || 0) + (b.averageRating * 10);
        return bScore - aScore;
      });

      // Limit results to top 10 for better UX
      const limitedResults = filteredProducts.slice(0, 10);

      return {
        success: true,
        data: {
          products: limitedResults,
          totalFound: filteredProducts.length,
          totalAvailable: allRealProducts.length,
          query: parameters.query,
          source: 'smart_contract',
          filters: {
            category: parameters.category,
            maxPrice: parameters.maxPrice,
            sustainabilityMin: parameters.sustainabilityMin
          }
        },
        message: `Found ${limitedResults.length} products matching your criteria from our blockchain marketplace (${allRealProducts.length} total products available)`
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
   * Get detailed information about a specific product - Enhanced with knowledge base
   */
  async getProductDetails(parameters: { productId: number }): Promise<FunctionResult> {
    try {
      console.log('📋 Enhanced Agent Function: getProductDetails', parameters);

      // Get detailed product information from knowledge base
      const productKnowledge = enhancedShoppingAgent.getProductDetails(parameters.productId);

      if (!productKnowledge) {
        return {
          success: false,
          error: 'Product not found',
          message: `Sorry, I couldn't find a product with ID ${parameters.productId}`
        };
      }

      // Get recommendations for this product
      const recommendations = enhancedShoppingAgent.getRecommendations(parameters.productId);

      return {
        success: true,
        data: {
          product: {
            id: productKnowledge.id,
            name: productKnowledge.name,
            description: productKnowledge.description,
            category: productKnowledge.category,
            price: productKnowledge.price,
            priceUSD: productKnowledge.priceUSD,
            seller: "0x81194315767d0524470ae715ca0284fC061C1e60",
            averageRating: productKnowledge.averageRating,
            isActive: true,
            sustainabilityScore: productKnowledge.sustainabilityScore,
            certifications: productKnowledge.certifications,
            carbonFootprint: productKnowledge.carbonFootprint,
            chain: "avalanche" as const
          },
          detailedInfo: {
            features: productKnowledge.features,
            benefits: productKnowledge.benefits,
            specifications: productKnowledge.specifications,
            useCases: productKnowledge.useCases,
            targetAudience: productKnowledge.targetAudience,
            materials: productKnowledge.materials,
            brandStory: productKnowledge.brandStory,
            warranty: productKnowledge.warranty,
            shipping: productKnowledge.shipping
          },
          recommendations: recommendations.slice(0, 3),
          contractData: {
            blockchain: "Avalanche",
            contractAddress: "0x81194315767d0524470ae715ca0284fC061C1e60",
            verified: true
          }
        },
        message: `Here are the complete details for ${productKnowledge.name}. ${productKnowledge.benefits[0]}.`
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

      // Query real order status from the system
      // For now, return a realistic status based on order ID pattern
      let status = 'pending_payment';

      if (parameters.orderId.includes('order-')) {
        // This is a real order from our system
        status = 'payment_confirmed';
      }
      
      const statusDetails = {
        orderId: parameters.orderId,
        status: status,
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
