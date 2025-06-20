import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🧹 Cleaning up duplicate products from Avalanche Fuji marketplace...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  try {
    // Get current marketplace stats
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Current Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);

    // Get all products and identify duplicates
    const allProducts: Array<{id: number, name: string, seller: string, isActive: boolean}> = [];
    const productNames = new Set<string>();
    const duplicateIds: number[] = [];

    console.log("\n🔍 Scanning for duplicate products...");
    
    for (let i = 1; i <= Number(totalProducts); i++) {
      try {
        const product = await productRegistry.products(BigInt(i));
        const productInfo = {
          id: i,
          name: product.name,
          seller: product.seller,
          isActive: product.isActive
        };
        
        console.log(`Product ${i}: ${product.name} (Seller: ${product.seller.slice(0,8)}...)`);
        
        if (productNames.has(product.name) && product.isActive) {
          duplicateIds.push(i);
          console.log(`   ⚠️  DUPLICATE FOUND: ${product.name}`);
        } else if (product.isActive) {
          productNames.add(product.name);
        }
        
        allProducts.push(productInfo);
      } catch (error) {
        console.log(`   ❌ Error getting product ${i}:`, (error as Error).message);
      }
    }

    console.log(`\n📊 Found ${duplicateIds.length} duplicate products to remove:`);
    duplicateIds.forEach(id => {
      const product = allProducts.find(p => p.id === id);
      if (product) {
        console.log(`   - Product ${id}: ${product.name}`);
      }
    });

    if (duplicateIds.length === 0) {
      console.log("✅ No duplicates found! Your marketplace is clean.");
      return;
    }

    // Remove duplicates (only the seller can remove their own products)
    console.log("\n🗑️  Deactivating duplicate products...");
    
    for (const productId of duplicateIds) {
      try {
        const product = await productRegistry.products(BigInt(productId));
        
        // Connect with the seller's account to deactivate the product
        if (product.seller.toLowerCase() === deployer.address.toLowerCase()) {
          console.log(`🗑️  Deactivating product ${productId}: ${product.name}`);
          
          // Use updateProduct to set isActive to false, keeping the same price
          const tx = await productRegistry.updateProduct(
            BigInt(productId), 
            product.price, 
            false // Set to inactive
          );
          const receipt = await tx.wait();
          
          console.log(`   ✅ Product deactivated successfully!`);
          console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
          console.log(`   Transaction hash: ${receipt.hash}`);
        } else {
          console.log(`   ⚠️  Cannot deactivate product ${productId} - owned by different seller`);
        }
      } catch (error) {
        console.log(`   ❌ Error deactivating product ${productId}:`, (error as Error).message);
      }
    }

    // Get updated stats
    const [newTotalProducts, newTotalSellers, newActiveProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Updated Marketplace Stats:");
    console.log(`   Total Products: ${newTotalProducts}`);
    console.log(`   Total Sellers: ${newTotalSellers}`);
    console.log(`   Active Products: ${newActiveProducts}`);
    console.log(`   Products Removed: ${Number(activeProducts) - Number(newActiveProducts)}`);

  } catch (error) {
    console.error("❌ Error during cleanup:", (error as Error).message);
  }

  console.log("\n🎉 Cleanup completed!");
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Avalanche Fuji");
  console.log("📱 Refresh your frontend to see the cleaned marketplace!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
