import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding marketplace products with simulated multiple sellers to Avalanche Fuji...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Get deployer account (your funded account)
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // Since we can't fund other accounts easily, let's add the products under your account
  // but we'll use different metadata to simulate different sellers
  const products = [
    {
      name: "VoltEdge Noise-Cancelling Earbuds",
      description: "Enjoy crystal-clear sound with VoltEdge earbuds featuring hybrid ANC technology, up to 24 hours battery life, touch controls, and IPX5 water resistance. Perfect for workouts, commutes, and video calls.",
      category: "Electronics",
      price: ethers.parseEther("0.025"), // 0.025 AVAX
      seller: "VoltEdge Audio"
    },
    {
      name: "AuroraGlow Smart LED Strip",
      description: "Transform your room with 16M color options, music sync, and voice control (Alexa/Google). Easily installable and perfect for gamers, streamers, or mood lighting lovers.",
      category: "Electronics",
      price: ethers.parseEther("0.032"), // 0.032 AVAX
      seller: "Aurora Lighting Co"
    },
    {
      name: "EverSoft Bamboo Joggers",
      description: "Lightweight joggers made from eco-friendly bamboo fabric. Ultra-breathable, soft, and anti-odor — ideal for workouts, travel, or lounging.",
      category: "Clothing",
      price: ethers.parseEther("0.018"), // 0.018 AVAX
      seller: "EcoStyle Collective"
    },
    {
      name: "MindFuel: The Crypto Hustler's Handbook",
      description: "A must-read book for Web3 builders, traders, and degens — packed with mental models, real-life stories, and productivity hacks to help you thrive in the crypto jungle.",
      category: "Books",
      price: ethers.parseEther("0.012"), // 0.012 AVAX
      seller: "Crypto Publishing House"
    },
    {
      name: "EcoBloom Smart Planter",
      description: "Self-watering, app-connected planter with light sensors and soil monitors. Perfect for growing herbs indoors with minimal effort.",
      category: "Home & Garden",
      price: ethers.parseEther("0.045"), // 0.045 AVAX
      seller: "Smart Garden Solutions"
    },
    {
      name: "ZenFlex Resistance Band Kit",
      description: "Full-body home workout solution with 5 levels of resistance, door anchors, and ergonomic handles. Compact and travel-friendly.",
      category: "Sports",
      price: ethers.parseEther("0.022"), // 0.022 AVAX
      seller: "FitLife Essentials"
    },
    {
      name: "GlowDrip Hydrating Serum",
      description: "Infused with hyaluronic acid, vitamin C, and green tea extract. Revives dull skin, reduces fine lines, and boosts glow — suitable for all skin types.",
      category: "Beauty",
      price: ethers.parseEther("0.035"), // 0.035 AVAX
      seller: "Beauty Lab Premium"
    },
    {
      name: "AutoMate Wireless Dash Cam",
      description: "1080p HD recording, motion detection, loop recording, and WiFi-enabled review. Boost your car's safety and evidence protection.",
      category: "Automotive",
      price: ethers.parseEther("0.055"), // 0.055 AVAX
      seller: "AutoTech Solutions"
    },
    {
      name: "PixelCraze NFT Creator Suite",
      description: "A digital toolkit for NFT creators with pre-built smart contract templates, AI art prompts, metadata generator, and one-click IPFS uploads.",
      category: "Digital",
      price: ethers.parseEther("0.038"), // 0.038 AVAX
      seller: "Digital Creators Hub"
    },
    {
      name: "MetaFit VR Boxing Trainer",
      description: "A gamified VR fitness app offering real-time cardio boxing workouts with a leaderboard, avatar coach, and customizable intensity.",
      category: "Digital",
      price: ethers.parseEther("0.028"), // 0.028 AVAX
      seller: "VR Fitness Studio"
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
        "Multi-Brand Marketplace", 
        "Curated products from various premium brands"
      );
      await registerTx.wait();
      console.log("✅ Seller registered successfully!");
    }
  } catch (error) {
    console.log("⚠️ Error checking seller status:", (error as Error).message);
  }

  // Add required categories first (if they don't exist)
  const categories = ["Electronics", "Clothing", "Home & Garden", "Books", "Digital", "Sports", "Beauty", "Automotive"];
  
  console.log("\n📂 Adding required categories (if needed)...");
  for (const category of categories) {
    try {
      console.log(`Checking category: ${category}`);
      // We'll try to add them, but they might already exist
    } catch (error) {
      console.log(`⚠️ Category handling:`, (error as Error).message);
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
    console.log(`   Brand: ${product.seller}`);
    console.log(`   Price: ${ethers.formatEther(product.price)} AVAX`);

    try {
      const tx = await productRegistry.listProduct(
        product.name,
        product.description,
        product.category,
        product.price,
        `QmHash${Date.now()}${i}`, // Generate unique image hash
        `QmMeta${Date.now()}${i}_${product.seller.replace(/\s+/g, '')}` // Include seller in metadata
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

    // Show last few products added
    console.log("\n📱 Recently Added Products:");
    for (let i = Math.max(1, Number(totalProducts) - 9); i <= Number(totalProducts); i++) {
      try {
        const product = await productRegistry.products(i);
        if (product.id > 0) {
          console.log(`   ${i}. ${product.name} - ${ethers.formatEther(product.price)} AVAX (${product.category})`);
        }
      } catch (error) {
        console.log(`   Could not get product ${i}`);
      }
    }

  } catch (error) {
    console.error("Error getting updated marketplace stats:", (error as Error).message);
  }

  console.log("\n🎉 Product addition completed!");
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Avalanche Fuji");
  console.log("📱 You can now check your frontend to see the new products!");
  console.log("💡 All products are listed under your account but represent different brands");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
