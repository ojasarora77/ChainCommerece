import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding diverse marketplace products from multiple sellers to Avalanche Fuji...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Define specific sellers with their private keys and new products
  // NOTE: These are test private keys - DO NOT use real private keys with funds!
  const sellers = [
    {
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Test key 1
      name: "VoltEdge Audio",
      description: "Premium audio equipment and accessories",
      products: [
        {
          name: "VoltEdge Noise-Cancelling Earbuds",
          description: "Enjoy crystal-clear sound with VoltEdge earbuds featuring hybrid ANC technology, up to 24 hours battery life, touch controls, and IPX5 water resistance. Perfect for workouts, commutes, and video calls.",
          category: "Electronics",
          price: ethers.parseEther("0.025") // 0.025 AVAX
        },
        {
          name: "AuroraGlow Smart LED Strip",
          description: "Transform your room with 16M color options, music sync, and voice control (Alexa/Google). Easily installable and perfect for gamers, streamers, or mood lighting lovers.",
          category: "Electronics",
          price: ethers.parseEther("0.032") // 0.032 AVAX
        }
      ]
    },
    {
      privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Test key 2  
      name: "EcoStyle Collective",
      description: "Sustainable fashion and lifestyle products",
      products: [
        {
          name: "EverSoft Bamboo Joggers",
          description: "Lightweight joggers made from eco-friendly bamboo fabric. Ultra-breathable, soft, and anti-odor — ideal for workouts, travel, or lounging.",
          category: "Clothing",
          price: ethers.parseEther("0.018") // 0.018 AVAX
        },
        {
          name: "EcoBloom Smart Planter",
          description: "Self-watering, app-connected planter with light sensors and soil monitors. Perfect for growing herbs indoors with minimal effort.",
          category: "Home & Garden",
          price: ethers.parseEther("0.045") // 0.045 AVAX
        }
      ]
    },
    {
      privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Test key 3
      name: "Digital Creators Hub",
      description: "Digital products and Web3 tools for creators",
      products: [
        {
          name: "MindFuel: The Crypto Hustler's Handbook",
          description: "A must-read book for Web3 builders, traders, and degens — packed with mental models, real-life stories, and productivity hacks to help you thrive in the crypto jungle.",
          category: "Books",
          price: ethers.parseEther("0.012") // 0.012 AVAX
        },
        {
          name: "PixelCraze NFT Creator Suite",
          description: "A digital toolkit for NFT creators with pre-built smart contract templates, AI art prompts, metadata generator, and one-click IPFS uploads.",
          category: "Digital",
          price: ethers.parseEther("0.038") // 0.038 AVAX
        },
        {
          name: "MetaFit VR Boxing Trainer",
          description: "A gamified VR fitness app offering real-time cardio boxing workouts with a leaderboard, avatar coach, and customizable intensity.",
          category: "Digital",
          price: ethers.parseEther("0.028") // 0.028 AVAX
        }
      ]
    },
    {
      privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Test key 4
      name: "FitLife Essentials",
      description: "Health, fitness, and wellness products",
      products: [
        {
          name: "ZenFlex Resistance Band Kit",
          description: "Full-body home workout solution with 5 levels of resistance, door anchors, and ergonomic handles. Compact and travel-friendly.",
          category: "Sports",
          price: ethers.parseEther("0.022") // 0.022 AVAX
        },
        {
          name: "GlowDrip Hydrating Serum",
          description: "Infused with hyaluronic acid, vitamin C, and green tea extract. Revives dull skin, reduces fine lines, and boosts glow — suitable for all skin types.",
          category: "Beauty",
          price: ethers.parseEther("0.035") // 0.035 AVAX
        }
      ]
    },
    {
      privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Test key 5
      name: "AutoTech Solutions",
      description: "Automotive technology and safety equipment",
      products: [
        {
          name: "AutoMate Wireless Dash Cam",
          description: "1080p HD recording, motion detection, loop recording, and WiFi-enabled review. Boost your car's safety and evidence protection.",
          category: "Automotive",
          price: ethers.parseEther("0.055") // 0.055 AVAX
        }
      ]
    }
  ];

  // Add required categories first (if they don't exist)
  const categories = ["Electronics", "Clothing", "Home & Garden", "Books", "Digital", "Sports", "Beauty", "Automotive"];
  
  console.log("\n📂 Adding required categories...");
  for (const category of categories) {
    try {
      console.log(`Adding category: ${category}`);
      const tx = await productRegistry.addCategory(category);
      await tx.wait();
      console.log(`✅ Category added: ${category}`);
    } catch (error) {
      console.log(`⚠️ Category ${category} might already exist:`, (error as Error).message);
    }
  }

  // Process each seller
  for (let i = 0; i < sellers.length; i++) {
    const sellerData = sellers[i];
    console.log(`\n👤 Processing Seller ${i + 1}: ${sellerData.name}`);

    // Create wallet from private key
    const wallet = new ethers.Wallet(sellerData.privateKey, ethers.provider);
    console.log(`📧 Address: ${wallet.address}`);
    
    // Check balance
    try {
      const balance = await ethers.provider.getBalance(wallet.address);
      console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX`);

      // If balance is too low, skip this seller
      if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️ Insufficient balance, skipping this seller");
        continue;
      }
    } catch (error) {
      console.log("⚠️ Could not check balance:", (error as Error).message);
      continue;
    }

    // Connect to contract with this seller's wallet
    const sellerProductRegistry = productRegistry.connect(wallet) as any;

    // Register seller
    try {
      console.log("🔍 Checking seller registration...");
      const sellerInfo = await sellerProductRegistry.sellers(wallet.address);
      
      if (!sellerInfo.name) {
        console.log("📝 Registering seller...");
        const registerTx = await sellerProductRegistry.registerSeller(
          sellerData.name,
          sellerData.description
        );
        await registerTx.wait();
        console.log("✅ Seller registered successfully!");
      } else {
        console.log(`✅ Seller already registered: ${sellerInfo.name}`);
      }
    } catch (error) {
      console.log("⚠️ Error with seller registration:", (error as Error).message);
      continue;
    }

    // Add products for this seller
    console.log(`🛒 Adding ${sellerData.products.length} products for ${sellerData.name}...`);
    
    for (let j = 0; j < sellerData.products.length; j++) {
      const product = sellerData.products[j];
      console.log(`📦 Adding product ${j + 1}: ${product.name}`);

      try {
        const tx = await sellerProductRegistry.listProduct(
          product.name,
          product.description,
          product.category,
          product.price,
          `QmHash${Date.now()}${j}`, // Generate unique image hash
          `QmMeta${Date.now()}${j}`  // Generate unique metadata hash
        );
        
        const receipt = await tx.wait();
        console.log(`✅ Product added: ${product.name}`);
        console.log(`   Price: ${ethers.formatEther(product.price)} AVAX`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Transaction hash: ${receipt.hash}`);
      } catch (error) {
        console.error(`❌ Error adding product ${product.name}:`, (error as Error).message);
      }
    }
  }

  // Get final marketplace stats
  try {
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Final Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);
  } catch (error) {
    console.error("Error getting marketplace stats:", (error as Error).message);
  }

  console.log("\n🎉 Multi-seller setup completed!");
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Avalanche Fuji");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
