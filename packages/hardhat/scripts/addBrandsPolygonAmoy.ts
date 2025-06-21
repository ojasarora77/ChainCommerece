import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding products from main account as multiple sellers to Polygon Amoy marketplace...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract address on Polygon Amoy
  const PRODUCT_REGISTRY_ADDRESS = "0xb61bf0b2f9903F4c6b3f9843339CACD4438fe64f";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Get the main account (has enough funds)
  const [mainAccount] = await ethers.getSigners();
  console.log("🏦 Main account:", mainAccount.address);
  
  const mainBalance = await ethers.provider.getBalance(mainAccount.address);
  console.log("💰 Main account balance:", ethers.formatEther(mainBalance), "MATIC");

  // Define sellers with their products (all managed by main account)
  const sellers = [
    {
      name: "TechNova Electronics",
      description: "Cutting-edge electronics and gadgets",
      products: [
        {
          name: "AI-Powered Smartphone",
          description: "Revolutionary smartphone with built-in AI assistant and quantum processor",
          category: "Electronics",
          price: ethers.parseEther("0.5"), // 0.5 MATIC
          imageHash: "QmAISmartphone001",
          metadataHash: "QmAISmartphoneMeta001"
        },
        {
          name: "Wireless Gaming Headset",
          description: "Professional gaming headset with 3D spatial audio and noise cancellation",
          category: "Electronics",
          price: ethers.parseEther("0.15"), // 0.15 MATIC
          imageHash: "QmGamingHeadset002",
          metadataHash: "QmGamingHeadsetMeta002"
        }
      ]
    },
    {
      name: "GreenLife Organics",
      description: "Sustainable and organic lifestyle products",
      products: [
        {
          name: "Organic Bamboo Toothbrush Set",
          description: "Eco-friendly bamboo toothbrushes with biodegradable bristles - Pack of 4",
          category: "Beauty",
          price: ethers.parseEther("0.02"), // 0.02 MATIC
          imageHash: "QmBambooToothbrush003",
          metadataHash: "QmBambooToothbrushMeta003"
        },
        {
          name: "Hemp Fiber Yoga Mat",
          description: "Natural hemp fiber yoga mat with anti-slip surface and carrying strap",
          category: "Sports",
          price: ethers.parseEther("0.08"), // 0.08 MATIC
          imageHash: "QmHempYogaMat004",
          metadataHash: "QmHempYogaMatMeta004"
        }
      ]
    },
    {
      name: "DigitalCraft Studio",
      description: "Digital content, courses, and creative tools",
      products: [
        {
          name: "Blockchain Development Masterclass",
          description: "Complete 40-hour course covering Solidity, Web3, and DApp development",
          category: "Education",
          price: ethers.parseEther("0.25"), // 0.25 MATIC
          imageHash: "QmBlockchainCourse005",
          metadataHash: "QmBlockchainCourseMeta005"
        },
        {
          name: "3D Design Software License",
          description: "Professional 3D modeling and animation software - 1 year license",
          category: "Software",
          price: ethers.parseEther("0.3"), // 0.3 MATIC
          imageHash: "Qm3DSoftware006",
          metadataHash: "Qm3DSoftwareMeta006"
        }
      ]
    },
    {
      name: "Urban Fashion Co.",
      description: "Modern streetwear and sustainable fashion",
      products: [
        {
          name: "Recycled Polyester Hoodie",
          description: "Stylish hoodie made from 100% recycled ocean plastic bottles",
          category: "Clothing",
          price: ethers.parseEther("0.12"), // 0.12 MATIC
          imageHash: "QmRecycledHoodie007",
          metadataHash: "QmRecycledHoodieMeta007"
        },
        {
          name: "Smart Fitness Tracker Band",
          description: "Advanced fitness tracker with heart rate monitoring and sleep analysis",
          category: "Electronics",
          price: ethers.parseEther("0.18"), // 0.18 MATIC
          imageHash: "QmFitnessTracker008",
          metadataHash: "QmFitnessTrackerMeta008"
        }
      ]
    },
    {
      name: "Gourmet Kitchen Essentials",
      description: "Premium kitchen tools and culinary accessories",
      products: [
        {
          name: "Professional Chef Knife Set",
          description: "High-carbon steel chef knives with ergonomic handles - Set of 5",
          category: "Kitchen",
          price: ethers.parseEther("0.22"), // 0.22 MATIC
          imageHash: "QmChefKnives009",
          metadataHash: "QmChefKnivesMeta009"
        },
        {
          name: "Smart Coffee Brewing System",
          description: "IoT-enabled coffee maker with precision temperature control and mobile app",
          category: "Kitchen",
          price: ethers.parseEther("0.35"), // 0.35 MATIC
          imageHash: "QmSmartCoffee010",
          metadataHash: "QmSmartCoffeeMeta010"
        }
      ]
    }
  ];

  // Connect to contract with main account
  const mainProductRegistry = productRegistry.connect(mainAccount) as any;

  // Check if main account is already registered as a seller
  try {
    console.log("🔍 Checking main account seller registration...");
    const sellerInfo = await mainProductRegistry.sellers(mainAccount.address);
    
    if (!sellerInfo.name || sellerInfo.name === "") {
      console.log("📝 Registering main account as first seller...");
      const registerTx = await mainProductRegistry.registerSeller(
        "AI Marketplace Administrator",
        "Official marketplace administrator managing multiple seller accounts"
      );
      await registerTx.wait();
      console.log("✅ Main account registered as seller!");
    } else {
      console.log(`✅ Main account already registered as seller: ${sellerInfo.name}`);
    }
  } catch (error) {
    console.log("⚠️ Error with main account seller registration:", (error as Error).message);
    return;
  }

  let totalProductsAdded = 0;

  // Add products for each "seller" brand
  for (let i = 0; i < sellers.length; i++) {
    const seller = sellers[i];
    console.log(`\n🏪 Adding products for brand: ${seller.name}`);
    console.log(`📝 Description: ${seller.description}`);
    
    // Add products for this seller brand
    console.log(`🛒 Adding ${seller.products.length} products for ${seller.name}...`);
    
    for (let j = 0; j < seller.products.length; j++) {
      const product = seller.products[j];
      console.log(`\n📦 Adding product ${j + 1}: ${product.name}`);

      try {
        const tx = await mainProductRegistry.listProduct(
          `[${seller.name}] ${product.name}`,  // Prefix with seller name
          `${product.description} - Available from ${seller.name}`,
          product.category,
          product.price,
          product.imageHash,
          product.metadataHash
        );
        
        const receipt = await tx.wait();
        totalProductsAdded++;
        console.log(`✅ Product added: ${product.name}`);
        console.log(`   Brand: ${seller.name}`);
        console.log(`   Price: ${ethers.formatEther(product.price)} MATIC`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Transaction hash: ${receipt.hash}`);
        
        // Small delay to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error adding product ${product.name}:`, (error as Error).message);
      }
    }
  }

  // Get final marketplace stats
  try {
    console.log("\n📊 Fetching final marketplace stats...");
    const [totalProducts, totalSellers, activeProducts] = await mainProductRegistry.getMarketplaceStats();
    console.log("\n📊 Final Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);

    // Get categories
    const contractCategories = await mainProductRegistry.getCategories();
    console.log(`   Categories: ${contractCategories.join(", ")}`);
  } catch (error) {
    console.error("Error getting marketplace stats:", (error as Error).message);
  }

  console.log("\n🎉 Multi-brand product addition completed on Polygon Amoy!");
  console.log(`🛍️ Total products added: ${totalProductsAdded}`);
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Polygon Amoy");
  console.log("🔍 View on PolygonScan:", `https://amoy.polygonscan.com/address/${PRODUCT_REGISTRY_ADDRESS}`);
  console.log("📱 Check your frontend to see products from multiple brands!");
  
  console.log("\n📋 Summary of Products Added:");
  let productCount = 0;
  sellers.forEach((seller, index) => {
    console.log(`\n${index + 1}. ${seller.name}:`);
    seller.products.forEach((product, pIndex) => {
      productCount++;
      console.log(`   ${productCount}. [${seller.name}] ${product.name} - ${ethers.formatEther(product.price)} MATIC`);
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
