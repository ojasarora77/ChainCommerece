import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding products from multiple sellers to Polygon Amoy marketplace...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract address on Polygon Amoy
  const PRODUCT_REGISTRY_ADDRESS = "0xb61bf0b2f9903F4c6b3f9843339CACD4438fe64f";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Different private keys for various sellers (example keys - replace with actual ones)
  const sellerPrivateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Seller 1
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Seller 2
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Seller 3
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Seller 4
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Seller 5
  ];

  // Create wallet instances from private keys
  const sellerWallets = sellerPrivateKeys.map(pk => new ethers.Wallet(pk, ethers.provider));

  // Define different sellers with diverse products
  const sellers = [
    {
      wallet: sellerWallets[0],
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
      wallet: sellerWallets[1],
      name: "GreenLife Organics",
      description: "Sustainable and organic lifestyle products",
      products: [
        {
          name: "Organic Bamboo Toothbrush Set",
          description: "Eco-friendly bamboo toothbrushes with biodegradable bristles - Pack of 4",
          category: "Health",
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
      wallet: sellerWallets[2],
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
      wallet: sellerWallets[3],
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
      wallet: sellerWallets[4],
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

  // Check if we need to fund the seller wallets
  console.log("\n💰 Checking seller wallet balances...");
  for (let i = 0; i < sellerWallets.length; i++) {
    const balance = await ethers.provider.getBalance(sellerWallets[i].address);
    console.log(`Seller ${i + 1} (${sellerWallets[i].address}): ${ethers.formatEther(balance)} MATIC`);
    
    if (balance < ethers.parseEther("0.01")) {
      console.log(`⚠️ Warning: Seller ${i + 1} has low balance. Consider funding this address.`);
    }
  }

  // Process each seller
  for (let i = 0; i < sellers.length; i++) {
    const seller = sellers[i];
    console.log(`\n👤 Processing Seller ${i + 1}: ${seller.name}`);
    console.log(`📧 Address: ${seller.wallet.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(seller.wallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC`);

    if (balance < ethers.parseEther("0.0005")) {
      console.log(`⚠️ Skipping seller ${seller.name} due to insufficient balance`);
      continue;
    }

    // Connect to contract with this seller's wallet
    const sellerProductRegistry = productRegistry.connect(seller.wallet) as any;

    // Register seller if not already registered
    try {
      console.log("🔍 Checking seller registration...");
      const sellerInfo = await sellerProductRegistry.sellers(seller.wallet.address);
      
      if (!sellerInfo.name || sellerInfo.name === "") {
        console.log("📝 Registering seller...");
        const registerTx = await sellerProductRegistry.registerSeller(
          seller.name,
          seller.description
        );
        await registerTx.wait();
        console.log("✅ Seller registered successfully!");
      } else {
        console.log(`✅ Seller already registered: ${sellerInfo.name}`);
      }
    } catch (error) {
      console.log("⚠️ Error with seller registration:", (error as Error).message);
      continue; // Skip to next seller if registration fails
    }

    // Add products for this seller
    console.log(`🛒 Adding ${seller.products.length} products for ${seller.name}...`);
    
    for (let j = 0; j < seller.products.length; j++) {
      const product = seller.products[j];
      console.log(`📦 Adding product ${j + 1}: ${product.name}`);

      try {
        const tx = await sellerProductRegistry.listProduct(
          product.name,
          product.description,
          product.category,
          product.price,
          product.imageHash,
          product.metadataHash
        );
        
        const receipt = await tx.wait();
        console.log(`✅ Product added: ${product.name}`);
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
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Final Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);

    // Get categories
    const contractCategories = await productRegistry.getCategories();
    console.log(`   Categories: ${contractCategories.join(", ")}`);
  } catch (error) {
    console.error("Error getting marketplace stats:", (error as Error).message);
  }

  console.log("\n🎉 Multi-seller product addition completed on Polygon Amoy!");
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Polygon Amoy");
  console.log("🔍 View on PolygonScan:", `https://amoy.polygonscan.com/address/${PRODUCT_REGISTRY_ADDRESS}`);
  console.log("📱 Check your frontend to see products from multiple sellers!");
  
  console.log("\n📋 Summary of Products Added:");
  let productCount = 0;
  sellers.forEach((seller, index) => {
    console.log(`\n${index + 1}. ${seller.name}:`);
    seller.products.forEach((product, pIndex) => {
      productCount++;
      console.log(`   ${productCount}. ${product.name} - ${ethers.formatEther(product.price)} MATIC`);
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
