import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding products from multiple sellers to Avalanche Fuji marketplace...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS);

  // Get multiple accounts (or you can use specific private keys)
  const accounts = await ethers.getSigners();
  
  // Define different sellers
  const sellers = [
    {
      signer: accounts[0], // Your main account
      name: "AI Marketplace Owner",
      description: "Official marketplace administrator",
      products: [
        {
          name: "Premium AI Smart Watch",
          description: "Top-tier smartwatch with advanced AI capabilities",
          category: "Electronics",
          price: ethers.parseEther("0.25"), // 0.25 AVAX
          imageHash: "QmPremiumWatch123",
          metadataHash: "QmPremiumWatchMeta123"
        }
      ]
    },
    {
      signer: accounts[1], // Second account
      name: "EcoTech Solutions",
      description: "Sustainable technology products",
      products: [
        {
          name: "Solar Power Bank",
          description: "High-capacity solar power bank for outdoor adventures",
          category: "Electronics",
          price: ethers.parseEther("0.08"), // 0.08 AVAX
          imageHash: "QmSolarPowerBank456",
          metadataHash: "QmSolarPowerBankMeta456"
        },
        {
          name: "Biodegradable Phone Case",
          description: "Eco-friendly phone case made from biodegradable materials",
          category: "Electronics",
          price: ethers.parseEther("0.02"), // 0.02 AVAX
          imageHash: "QmBioCase789",
          metadataHash: "QmBioCaseMeta789"
        }
      ]
    },
    {
      signer: accounts[2], // Third account
      name: "Digital Creators Hub",
      description: "Digital content and NFT marketplace",
      products: [
        {
          name: "Crypto Trading Course",
          description: "Complete cryptocurrency trading masterclass",
          category: "Digital",
          price: ethers.parseEther("0.05"), // 0.05 AVAX
          imageHash: "QmCryptoCourse101",
          metadataHash: "QmCryptoCourseMeta101"
        },
        {
          name: "NFT Creation Toolkit",
          description: "All-in-one toolkit for creating and minting NFTs",
          category: "Digital",
          price: ethers.parseEther("0.03"), // 0.03 AVAX
          imageHash: "QmNFTToolkit202",
          metadataHash: "QmNFTToolkitMeta202"
        }
      ]
    },
    {
      signer: accounts[3], // Fourth account
      name: "Fashion Forward",
      description: "Sustainable fashion and accessories",
      products: [
        {
          name: "Organic Cotton Hoodie",
          description: "Comfortable hoodie made from 100% organic cotton",
          category: "Clothing",
          price: ethers.parseEther("0.06"), // 0.06 AVAX
          imageHash: "QmOrganicHoodie303",
          metadataHash: "QmOrganicHoodieMeta303"
        },
        {
          name: "Recycled Plastic Backpack",
          description: "Durable backpack made from recycled ocean plastic",
          category: "Clothing",
          price: ethers.parseEther("0.09"), // 0.09 AVAX
          imageHash: "QmRecycledBackpack404",
          metadataHash: "QmRecycledBackpackMeta404"
        }
      ]
    }
  ];

  // Process each seller
  for (let i = 0; i < sellers.length; i++) {
    const seller = sellers[i];
    console.log(`\n👤 Processing Seller ${i + 1}: ${seller.name}`);
    console.log(`📧 Address: ${seller.signer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(seller.signer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX`);

    // Connect to contract with this seller's signer
    const sellerProductRegistry = productRegistry.connect(seller.signer);

    // Register seller if not already registered
    try {
      console.log("🔍 Checking seller registration...");
      const sellerInfo = await sellerProductRegistry.sellers(seller.signer.address);
      
      if (!sellerInfo.name) {
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

    // Get categories
    const contractCategories = await productRegistry.getCategories();
    console.log(`   Categories: ${contractCategories.join(", ")}`);
  } catch (error) {
    console.error("Error getting marketplace stats:", (error as Error).message);
  }

  console.log("\n🎉 Multi-seller product addition completed!");
  console.log("🔗 Contract address:", PRODUCT_REGISTRY_ADDRESS);
  console.log("🌐 Network: Avalanche Fuji");
  console.log("📱 Check your frontend to see products from multiple sellers!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
