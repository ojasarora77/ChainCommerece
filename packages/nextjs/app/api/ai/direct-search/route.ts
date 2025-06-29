import { NextRequest, NextResponse } from 'next/server';
import { ShoppingAgentFunctions } from '../../../services/bedrock/agents/shoppingAgentFunctions';

/**
 * Direct Product Search API
 * Bypasses all complex processing and provides reliable product search
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Direct search for: "${query}"`);
    
    const agentFunctions = new ShoppingAgentFunctions();
    
    // Direct product name mappings for exact matches
    const productMappings: { [key: string]: string } = {
      'smart fitness tracker': 'smart fitness tracker',
      'fitness tracker': 'smart fitness tracker',
      'ai powered smart watch': 'ai powered smart watch', 
      'smart watch': 'ai powered smart watch',
      'nft art collection guide': 'nft art collection guide',
      'nft guide': 'nft art collection guide',
      'art collection': 'nft art collection guide',
      'bamboo laptop stand': 'bamboo laptop stand',
      'laptop stand': 'bamboo laptop stand',
      'phone cover': 'phone cover',
      'dash cam': 'dash cam',
      'wireless dash cam': 'dash cam',
      'led strip': 'led strip',
      'hemp shirt': 'hemp shirt',
      'resistance band': 'resistance band',
      'serum': 'serum',
      'planter': 'planter',
      'earbuds': 'earbuds',
      'crypto guide': 'crypto guide'
    };

    // Clean the query
    const cleanQuery = query.toLowerCase()
      .replace(/\b(i|want|to|buy|purchase|get|find|search|for|what|is|the|price|of|a|an)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Find the best matching product search term
    let searchTerm = cleanQuery;
    
    for (const [pattern, productName] of Object.entries(productMappings)) {
      if (cleanQuery.includes(pattern) || query.toLowerCase().includes(pattern)) {
        searchTerm = productName;
        console.log(`🎯 Mapped "${pattern}" → "${productName}"`);
        break;
      }
    }

    // Perform the search
    const result = await agentFunctions.searchProducts({ query: searchTerm });
    
    if (result.success && result.data.products.length > 0) {
      const product = result.data.products[0];
      
      return NextResponse.json({
        success: true,
        query: {
          original: query,
          processed: searchTerm,
          mapped: searchTerm !== cleanQuery
        },
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          priceUSD: product.priceUSD,
          category: product.category,
          description: product.description,
          averageRating: product.averageRating,
          sustainabilityScore: product.sustainabilityScore
        },
        formatted: `**${product.name}** - ${product.price} ETH ($${product.priceUSD})
- Category: ${product.category}
- Rating: ${product.averageRating}/5 stars
- Description: ${product.description}
- Sustainability Score: ${product.sustainabilityScore}%

Would you like me to help you place an order for this ${product.name.toLowerCase()}?`
      });
    } else {
      // Try fallback searches
      const fallbackTerms = ['nft', 'smart', 'fitness', 'laptop', 'phone'];
      
      for (const term of fallbackTerms) {
        if (cleanQuery.includes(term)) {
          const fallbackResult = await agentFunctions.searchProducts({ query: term });
          if (fallbackResult.success && fallbackResult.data.products.length > 0) {
            const product = fallbackResult.data.products[0];
            return NextResponse.json({
              success: true,
              query: {
                original: query,
                processed: term,
                mapped: true,
                fallback: true
              },
              product: {
                id: product.id,
                name: product.name,
                price: product.price,
                priceUSD: product.priceUSD,
                category: product.category,
                description: product.description,
                averageRating: product.averageRating,
                sustainabilityScore: product.sustainabilityScore
              },
              formatted: `**${product.name}** - ${product.price} ETH ($${product.priceUSD})
- Category: ${product.category}
- Rating: ${product.averageRating}/5 stars
- Description: ${product.description}
- Sustainability Score: ${product.sustainabilityScore}%

Would you like me to help you place an order for this ${product.name.toLowerCase()}?`
            });
          }
        }
      }
      
      return NextResponse.json({
        success: false,
        query: {
          original: query,
          processed: searchTerm
        },
        message: `No products found for "${query}". Try searching for specific product names like "smart fitness tracker", "nft art collection guide", or "bamboo laptop stand".`
      });
    }
    
  } catch (error) {
    console.error('❌ Direct search error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
