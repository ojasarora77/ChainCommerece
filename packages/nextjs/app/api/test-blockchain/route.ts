import { NextRequest, NextResponse } from "next/server";
import { productFetcher } from "~~/services/blockchain/productFetcher";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing blockchain connection...");
    
    const startTime = Date.now();
    
    // Test fetching products from blockchain
    const products = await productFetcher.fetchAllProducts();
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: "Blockchain connection test completed",
      results: {
        totalProducts: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          seller: p.seller,
          category: p.category,
          isActive: p.isActive
        })),
        processingTime: `${processingTime}ms`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Blockchain test error:", error);
    return NextResponse.json({
      success: false,
      error: "Blockchain connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
