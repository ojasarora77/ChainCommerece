import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🔍 Verifying marketplace state after cleanup...");
  console.log("📍 Network:", hre.network.name);

  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  try {
    // Get marketplace stats
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Current Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);

    // Check each product's status
    console.log("\n📋 Product Status Check:");
    for (let i = 1; i <= Number(totalProducts); i++) {
      const product = await productRegistry.products(BigInt(i));
      const status = product.isActive ? "✅ ACTIVE" : "❌ INACTIVE";
      console.log(`   Product ${i}: ${product.name} - ${status} (Seller: ${product.seller.slice(0,8)}...)`);
    }

    // Get batch products (this is what the frontend uses)
    const productIds = Array.from({ length: Number(totalProducts) }, (_, i) => BigInt(i + 1));
    const batchProducts = await productRegistry.getBatchProducts(productIds);
    
    console.log("\n🔥 Frontend Data Simulation:");
    const activeProductsFromBatch = batchProducts.filter((product: any) => product.isActive);
    console.log(`   Total products fetched: ${batchProducts.length}`);
    console.log(`   Active products: ${activeProductsFromBatch.length}`);
    console.log(`   Inactive products: ${batchProducts.length - activeProductsFromBatch.length}`);

    console.log("\n✅ Active Products List:");
    activeProductsFromBatch.forEach((product: any, index: number) => {
      console.log(`   ${index + 1}. ${product.name} - ${ethers.formatEther(product.price)} AVAX`);
    });

  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }

  console.log("\n🎉 Verification completed!");
  console.log("💡 The frontend should now show only the active products.");
  console.log("🔄 If you still see duplicates, try refreshing your browser or clearing cache.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
