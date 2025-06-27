import { NextRequest, NextResponse } from "next/server";
import { ContractProductService } from "~~/services/marketplace/contractProductService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'ai powered smart watch';

  try {
    console.log(`🔍 Debug search for: "${query}"`);
    
    const service = new ContractProductService();
    
    // Get all products first
    const allProducts = await service.getAllProducts();
    console.log(`📦 Total products available: ${allProducts.length}`);
    
    // Search for products
    const results = await service.searchProducts(query);
    console.log(`✅ Search results: ${results.length}`);

    return NextResponse.json({
      success: true,
      query,
      totalProducts: allProducts.length,
      searchResults: results.length,
      allProducts: allProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description.substring(0, 100) + '...',
        certifications: p.certifications,
        isActive: p.isActive
      })),
      results: results.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.priceUSD,
        sustainabilityScore: p.sustainabilityScore,
        certifications: p.certifications,
        description: p.description.substring(0, 100) + '...'
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Debug search error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      query
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, category } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Debug POST search for: "${query}" in category: "${category || 'all'}"`);
    
    const service = new ContractProductService();
    const results = await service.searchProducts(query, category);

    return NextResponse.json({
      success: true,
      query,
      category: category || 'all',
      results: results.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.priceUSD,
        sustainabilityScore: p.sustainabilityScore,
        certifications: p.certifications,
        description: p.description
      })),
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Debug POST search error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
