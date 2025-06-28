// AWS Lambda function for Bedrock Agent Action Groups
// This function handles all the shopping operations that the agent can perform

const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Configuration
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'ai-marketplace-orders';
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'ai-marketplace-analytics';
const CACHE_BUCKET = process.env.CACHE_BUCKET || 'ai-marketplace-cache';

// Mock product database (in production, this would connect to your real database)
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "SustainTech Smartwatch",
    category: "Electronics",
    priceUSD: 149,
    sustainabilityScore: 92,
    sustainabilityGrade: "A+",
    averageRating: 4.8,
    description: "Eco-friendly smartwatch with solar charging and recycled aluminum casing",
    carbonFootprint: "2.1 kg CO2",
    valueScore: 95,
    estimatedDelivery: "3-5 business days",
    inStock: true
  },
  {
    id: 2,
    name: "Bamboo Laptop Stand",
    category: "Electronics",
    priceUSD: 2.00,
    sustainabilityScore: 95,
    sustainabilityGrade: "A+",
    averageRating: 4.9,
    description: "100% sustainable bamboo laptop stand with ergonomic design",
    carbonFootprint: "0.5 kg CO2",
    valueScore: 98,
    estimatedDelivery: "2-3 business days",
    inStock: true
  },
  {
    id: 3,
    name: "Organic Hemp T-Shirt",
    category: "Clothing",
    priceUSD: 1.20,
    sustainabilityScore: 88,
    sustainabilityGrade: "A",
    averageRating: 4.6,
    description: "100% organic hemp t-shirt with natural dyes",
    carbonFootprint: "1.2 kg CO2",
    valueScore: 92,
    estimatedDelivery: "4-6 business days",
    inStock: true
  }
];

// Mock orders database
let MOCK_ORDERS = [];
let orderCounter = 1000;

// Analytics helper function
async function logAnalytics(eventType, data) {
  try {
    const analyticsRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      data,
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    };

    await dynamodb.put({
      TableName: ANALYTICS_TABLE,
      Item: analyticsRecord
    }).promise();

    console.log('📊 Analytics logged:', eventType);
  } catch (error) {
    console.error('❌ Analytics logging failed:', error);
    // Don't throw - analytics failure shouldn't break main functionality
  }
}

exports.handler = async (event) => {
  console.log('🤖 Bedrock Agent Function Called:', JSON.stringify(event, null, 2));

  try {
    // Handle both direct invocation and Bedrock agent formats
    let actionGroup, functionName, parameters;

    if (event.actionGroup && event.function) {
      // Bedrock agent format
      ({ actionGroup, function: functionName, parameters } = event);
    } else if (event.httpMethod) {
      // API Gateway format (for testing)
      functionName = event.pathParameters?.function || 'searchProducts';
      parameters = JSON.parse(event.body || '{}');
    } else {
      // Direct invocation format
      ({ functionName, parameters } = event);
    }

    // Log function call analytics
    await logAnalytics('function_called', {
      functionName,
      parameters: Object.keys(parameters || {}),
      timestamp: new Date().toISOString()
    });

    let result;

    switch (functionName) {
      case 'searchProducts':
        result = await searchProducts(parameters);
        break;

      case 'getProductDetails':
        result = await getProductDetails(parameters);
        break;

      case 'createOrder':
        result = await createOrder(parameters);
        break;

      case 'processPayment':
        result = await processPayment(parameters);
        break;

      case 'checkOrderStatus':
        result = await checkOrderStatus(parameters);
        break;

      case 'getUserRecommendations':
        result = await getUserRecommendations(parameters);
        break;

      case 'updateUserPreferences':
        result = await updateUserPreferences(parameters);
        break;

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
    
    console.log('✅ Function result:', result);
    
    return {
      statusCode: 200,
      body: {
        "application/json": {
          body: JSON.stringify(result)
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Lambda function error:', error);
    
    return {
      statusCode: 500,
      body: {
        "application/json": {
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        }
      }
    };
  }
};

// Enhanced product search with caching and analytics
async function searchProducts(params) {
  const { query, category, maxPrice, sustainabilityMin = 80, userAddress } = params;

  console.log(`🔍 Searching products: query="${query}", category="${category}", maxPrice=${maxPrice}, sustainabilityMin=${sustainabilityMin}`);

  // Create cache key for this search
  const cacheKey = `search-${JSON.stringify({ query, category, maxPrice, sustainabilityMin })}`;

  try {
    // Try to get cached results first
    const cachedResult = await s3.getObject({
      Bucket: CACHE_BUCKET,
      Key: cacheKey
    }).promise();

    const cached = JSON.parse(cachedResult.Body.toString());
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minute cache
      console.log('📦 Returning cached search results');

      // Log cache hit analytics
      await logAnalytics('search_cache_hit', {
        query, category, maxPrice, sustainabilityMin, userAddress,
        resultsCount: cached.data.products.length
      });

      return cached;
    }
  } catch (error) {
    console.log('🔍 No cached results found, performing fresh search');
  }

  // Perform search
  let results = MOCK_PRODUCTS.filter(product => {
    // Filter by sustainability score
    if (product.sustainabilityScore < sustainabilityMin) return false;

    // Filter by category
    if (category && category !== 'All' && product.category !== category) return false;

    // Filter by price
    if (maxPrice && product.priceUSD > maxPrice) return false;

    // Filter by query (simple text search with scoring)
    if (query) {
      const searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      const queryLower = query.toLowerCase();
      if (!searchText.includes(queryLower)) return false;

      // Add relevance scoring
      let relevanceScore = 0;
      if (product.name.toLowerCase().includes(queryLower)) relevanceScore += 10;
      if (product.description.toLowerCase().includes(queryLower)) relevanceScore += 5;
      if (product.category.toLowerCase().includes(queryLower)) relevanceScore += 3;

      product.relevanceScore = relevanceScore;
    }

    return true;
  });

  // Sort by relevance if query provided, otherwise by sustainability score
  if (query) {
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  } else {
    results.sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
  }

  const searchResult = {
    success: true,
    data: {
      products: results,
      totalFound: results.length,
      searchCriteria: { query, category, maxPrice, sustainabilityMin },
      cached: false,
      timestamp: Date.now()
    }
  };

  // Cache the results
  try {
    await s3.putObject({
      Bucket: CACHE_BUCKET,
      Key: cacheKey,
      Body: JSON.stringify(searchResult),
      ContentType: 'application/json'
    }).promise();
  } catch (error) {
    console.error('❌ Failed to cache search results:', error);
  }

  // Log search analytics
  await logAnalytics('product_search', {
    query, category, maxPrice, sustainabilityMin, userAddress,
    resultsCount: results.length,
    topResults: results.slice(0, 3).map(p => ({ id: p.id, name: p.name, score: p.sustainabilityScore }))
  });

  return searchResult;
}

async function getProductDetails(params) {
  const { productId } = params;
  
  console.log(`📋 Getting product details for ID: ${productId}`);
  
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  
  if (!product) {
    return {
      success: false,
      error: `Product with ID ${productId} not found`
    };
  }
  
  return {
    success: true,
    data: {
      product: product
    }
  };
}

async function createOrder(params) {
  const { productId, quantity = 1, userAddress } = params;

  console.log(`🛒 Creating order: productId=${productId}, quantity=${quantity}, userAddress=${userAddress}`);

  const product = MOCK_PRODUCTS.find(p => p.id === productId);

  if (!product) {
    await logAnalytics('order_creation_failed', {
      reason: 'product_not_found',
      productId,
      userAddress
    });

    return {
      success: false,
      error: `Product with ID ${productId} not found`
    };
  }

  if (!product.inStock) {
    await logAnalytics('order_creation_failed', {
      reason: 'out_of_stock',
      productId,
      productName: product.name,
      userAddress
    });

    return {
      success: false,
      error: `Product "${product.name}" is currently out of stock`
    };
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const subtotal = product.priceUSD * quantity;
  const platformFee = subtotal * 0.025; // 2.5% platform fee
  const total = subtotal + platformFee;

  const order = {
    orderId,
    productId,
    productName: product.name,
    quantity,
    subtotal,
    platformFee,
    total,
    userAddress,
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    estimatedDelivery: product.estimatedDelivery,
    sustainabilityImpact: `Saved ${(100 - product.sustainabilityScore) * 0.1}kg CO2 vs conventional alternatives`,
    product: product // Include full product details
  };

  try {
    // Store order in DynamoDB
    await dynamodb.put({
      TableName: ORDERS_TABLE,
      Item: {
        ...order,
        pk: `ORDER#${orderId}`,
        sk: `USER#${userAddress}`,
        gsi1pk: `USER#${userAddress}`,
        gsi1sk: `ORDER#${order.createdAt}`,
        ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
      }
    }).promise();

    console.log('✅ Order stored in database:', orderId);
  } catch (error) {
    console.error('❌ Failed to store order in database:', error);
    // Continue with in-memory storage as fallback
    MOCK_ORDERS.push(order);
  }

  // Log order creation analytics
  await logAnalytics('order_created', {
    orderId,
    productId,
    productName: product.name,
    quantity,
    total,
    userAddress,
    sustainabilityScore: product.sustainabilityScore
  });

  return {
    success: true,
    data: {
      order: order
    }
  };
}

async function processPayment(params) {
  const { orderId, paymentMethod, amount } = params;
  
  console.log(`💳 Processing payment: orderId=${orderId}, method=${paymentMethod}, amount=${amount}`);
  
  const order = MOCK_ORDERS.find(o => o.orderId === orderId);
  
  if (!order) {
    return {
      success: false,
      error: `Order ${orderId} not found`
    };
  }
  
  if (order.status !== 'pending_payment') {
    return {
      success: false,
      error: `Order ${orderId} is not pending payment (current status: ${order.status})`
    };
  }
  
  // Simulate payment processing
  const transactionHash = `0x${Math.random().toString(16).substr(2, 40)}`;
  const gasEstimate = 0.005; // ~$5 gas fee
  
  // Update order status
  order.status = 'payment_confirmed';
  order.transactionHash = transactionHash;
  order.paymentMethod = paymentMethod;
  order.paidAmount = amount;
  order.paidAt = new Date().toISOString();
  
  return {
    success: true,
    data: {
      transactionHash,
      amount,
      paymentMethod,
      gasEstimate,
      escrowAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
      estimatedConfirmation: '2-3 minutes',
      order: order
    }
  };
}

async function checkOrderStatus(params) {
  const { orderId } = params;
  
  console.log(`📦 Checking order status: ${orderId}`);
  
  const order = MOCK_ORDERS.find(o => o.orderId === orderId);
  
  if (!order) {
    return {
      success: false,
      error: `Order ${orderId} not found`
    };
  }
  
  // Simulate status progression
  const statusHistory = [
    { status: 'pending_payment', timestamp: order.createdAt },
  ];
  
  if (order.paidAt) {
    statusHistory.push({ status: 'payment_confirmed', timestamp: order.paidAt });
  }
  
  return {
    success: true,
    data: {
      orderId: order.orderId,
      status: order.status,
      lastUpdated: order.paidAt || order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.status === 'shipped' ? `TRK${orderId.slice(-6)}` : null,
      statusHistory
    }
  };
}

// New function: Get AI-powered user recommendations
async function getUserRecommendations(params) {
  const { userAddress, limit = 5 } = params;

  console.log(`🎯 Getting recommendations for user: ${userAddress}`);

  try {
    // Get user's order history
    const userOrders = await dynamodb.query({
      TableName: ORDERS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userAddress}`
      },
      ScanIndexForward: false, // Most recent first
      Limit: 10
    }).promise();

    // Analyze user preferences
    const orderHistory = userOrders.Items || [];
    const categoryPreferences = {};
    const sustainabilityPreference = [];

    orderHistory.forEach(order => {
      if (order.product) {
        // Track category preferences
        const category = order.product.category;
        categoryPreferences[category] = (categoryPreferences[category] || 0) + 1;

        // Track sustainability preferences
        sustainabilityPreference.push(order.product.sustainabilityScore);
      }
    });

    // Calculate average sustainability preference
    const avgSustainabilityPreference = sustainabilityPreference.length > 0
      ? sustainabilityPreference.reduce((a, b) => a + b, 0) / sustainabilityPreference.length
      : 80;

    // Get preferred categories (sorted by frequency)
    const preferredCategories = Object.entries(categoryPreferences)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);

    // Generate recommendations based on preferences
    let recommendations = MOCK_PRODUCTS.filter(product => {
      // Filter by sustainability preference (within 15 points)
      if (Math.abs(product.sustainabilityScore - avgSustainabilityPreference) > 15) return false;

      // Exclude products user has already ordered
      const alreadyOrdered = orderHistory.some(order => order.productId === product.id);
      if (alreadyOrdered) return false;

      return true;
    });

    // Score recommendations
    recommendations = recommendations.map(product => {
      let score = product.sustainabilityScore;

      // Boost score for preferred categories
      if (preferredCategories.includes(product.category)) {
        const categoryIndex = preferredCategories.indexOf(product.category);
        score += (5 - categoryIndex) * 10; // Higher boost for more preferred categories
      }

      // Boost for high ratings
      score += product.averageRating * 5;

      // Boost for value score
      score += product.valueScore * 0.5;

      return { ...product, recommendationScore: score };
    });

    // Sort by recommendation score and limit results
    recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
    recommendations = recommendations.slice(0, limit);

    // Log recommendation analytics
    await logAnalytics('recommendations_generated', {
      userAddress,
      orderHistoryCount: orderHistory.length,
      avgSustainabilityPreference,
      preferredCategories,
      recommendationsCount: recommendations.length,
      topRecommendations: recommendations.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        score: p.recommendationScore
      }))
    });

    return {
      success: true,
      data: {
        recommendations,
        userProfile: {
          orderCount: orderHistory.length,
          avgSustainabilityPreference,
          preferredCategories,
          lastOrderDate: orderHistory[0]?.createdAt
        }
      }
    };

  } catch (error) {
    console.error('❌ Failed to generate recommendations:', error);

    // Fallback to general high-sustainability products
    const fallbackRecommendations = MOCK_PRODUCTS
      .filter(p => p.sustainabilityScore >= 85)
      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
      .slice(0, limit);

    return {
      success: true,
      data: {
        recommendations: fallbackRecommendations,
        userProfile: {
          orderCount: 0,
          avgSustainabilityPreference: 80,
          preferredCategories: [],
          fallback: true
        }
      }
    };
  }
}

// New function: Update user preferences
async function updateUserPreferences(params) {
  const { userAddress, preferences } = params;

  console.log(`⚙️ Updating preferences for user: ${userAddress}`);

  try {
    const preferencesRecord = {
      pk: `USER#${userAddress}`,
      sk: 'PREFERENCES',
      userAddress,
      preferences,
      updatedAt: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    };

    await dynamodb.put({
      TableName: ORDERS_TABLE, // Reusing same table with different SK
      Item: preferencesRecord
    }).promise();

    // Log preference update analytics
    await logAnalytics('preferences_updated', {
      userAddress,
      preferences: Object.keys(preferences),
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        message: 'Preferences updated successfully',
        preferences
      }
    };

  } catch (error) {
    console.error('❌ Failed to update preferences:', error);

    return {
      success: false,
      error: 'Failed to update preferences'
    };
  }
}
