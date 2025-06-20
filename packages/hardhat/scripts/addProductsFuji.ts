import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding products to Avalanche Fuji marketplace...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";
  const AI_RECOMMENDATIONS_ADDRESS = "0xe97babe1401F29921D421E5294c017D63Ff12B36";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Get deployer account (your address)
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // Sample products to add
  const products = [
    {
      name: "AI-Powered Smart Watch",
      description: "Advanced smartwatch with AI health monitoring and blockchain integration",
      category: "Electronics",
      price: ethers.parseEther("0.15"), // 0.15 AVAX
      imageHash: "QmSmartWatch123",
      metadataHash: "QmSmartWatchMeta123"
    },
    {
      name: "Sustainable Bamboo Laptop Stand",
      description: "Eco-friendly laptop stand made from sustainable bamboo with ergonomic design",
      category: "Electronics",
      price: ethers.parseEther("0.04"), // 0.04 AVAX
      imageHash: "QmLaptopStand456",
      metadataHash: "QmLaptopStandMeta456"
    },
    {
      name: "NFT Art Collection Guide",
      description: "Complete digital guide to creating and selling NFT art collections",
      category: "Digital",
      price: ethers.parseEther("0.025"), // 0.025 AVAX
      imageHash: "QmNFTGuide789",
      metadataHash: "QmNFTGuideMeta789"
    },
    {
      name: "Organic Hemp T-Shirt",
      description: "Comfortable organic hemp t-shirt with blockchain authenticity verification",
      category: "Clothing",
      price: ethers.parseEther("0.03"), // 0.03 AVAX
      imageHash: "QmHempShirt101",
      metadataHash: "QmHempShirtMeta101"
    },
    {
      name: "Smart Fitness Tracker",
      description: "Advanced fitness tracker with AI coaching and Web3 rewards",
      category: "Sports",
      price: ethers.parseEther("0.12"), // 0.12 AVAX
      imageHash: "QmFitnessTracker202",
      metadataHash: "QmFitnessTrackerMeta202"
    }
  ];

  // Check if deployer is registered as seller
  try {
    console.log("🔍 Checking seller registration...");
    const sellerInfo = await productRegistry.sellers(deployer.address);
    console.log("📊 Seller info:", {
      name: sellerInfo.name,
      isVerified: sellerInfo.isVerified,
      totalProducts: sellerInfo.totalProducts.toString()
    });

    if (!sellerInfo.name) {
      console.log("📝 Registering as seller...");
      const registerTx = await productRegistry.registerSeller(
        "AI Marketplace Owner", 
        "Official marketplace administrator"
      );
      await registerTx.wait();
      console.log("✅ Seller registered successfully!");
    }
  } catch (error) {
    console.log("⚠️ Error checking seller status, will try to register:", (error as Error).message);
    try {
      const registerTx = await productRegistry.registerSeller(
        "AI Marketplace Owner", 
        "Official marketplace administrator"
      );
      await registerTx.wait();
      console.log("✅ Seller registered successfully!");
    } catch (regError) {
      console.log("❌ Registration failed:", (regError as Error).message);
    }
  }

  // Add categories first (if they don't exist)
  const categories = ["Electronics", "Digital", "Clothing", "Sports"];
  
  for (const category of categories) {
    try {
      console.log(`📂 Adding category: ${category}`);
      const tx = await productRegistry.addCategory(category);
      await tx.wait();
      console.log(`✅ Category added: ${category}`);
    } catch (error) {
      console.log(`⚠️ Category ${category} might already exist or error:`, (error as Error).message);
    }
  }

  // Get current marketplace stats before adding products
  try {
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Current Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);
  } catch (error) {
    console.log("⚠️ Could not get marketplace stats:", (error as Error).message);
  }

  // Add products
  console.log("\n🛒 Adding products...");
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`📦 Adding product ${i + 1}: ${product.name}`);

    try {
      const tx = await productRegistry.listProduct(
        product.name,
        product.description,
        product.category,
        product.price,
        product.imageHash,
        product.metadataHash
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Product added: ${product.name} (${product.category})`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   Transaction hash: ${receipt.hash}`);
    } catch (error) {
      console.error(`❌ Error adding product ${product.name}:`, (error as Error).message);
    }
  }

  // Get updated marketplace stats
  try {
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Updated Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);

    // Get categories
    const contractCategories = await productRegistry.getCategories();
    console.log(`   Categories: ${contractCategories.join(", ")}`);
  } catch (error) {
    console.error("Error getting updated marketplace stats:", (error as Error).message);
  }

  console.log("\n🎉 Product addition completed!");
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Avalanche Fuji");
  console.log("📱 You can now check your frontend to see the new products!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
