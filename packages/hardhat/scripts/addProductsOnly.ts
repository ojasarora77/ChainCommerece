import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding products only (no categories)...");
  console.log("📍 Network:", hre.network.name);

  // Network-specific contract addresses
  const networkAddresses: { [key: string]: { productRegistry: string, aiRecommendations?: string } } = {
    "avalancheFuji": {
      productRegistry: "0x09e9F0D5EfCb521Bf76B94E4Fa3c6499985E2878",
      aiRecommendations: "0xe97babe1401F29921D421E5294c017D63Ff12B36"
    },
    "baseSepolia": {
      productRegistry: "0x8aF3507ccEbB20579196b11e1Ad11FCAb6bae760",
      // Add AIRecommendations address when deployed on Base
    }
  };

  const addresses = networkAddresses[hre.network.name];
  if (!addresses) {
    throw new Error(`No addresses configured for network: ${hre.network.name}`);
  }

  console.log(`📦 Using ProductRegistry: ${addresses.productRegistry}`);
  
  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(addresses.productRegistry) as any;

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Sample products to add (same as before)
  const products = [
    {
      name: "AI-Powered Smart Watch",
      description: "Advanced smartwatch with AI health monitoring and blockchain integration",
      category: "Electronics",
      price: ethers.parseEther("0.15"),
      imageHash: "QmSmartWatch123",
      metadataHash: "QmSmartWatchMeta123"
    },
    {
      name: "Sustainable Bamboo Laptop Stand",
      description: "Eco-friendly laptop stand made from sustainable bamboo with ergonomic design",
      category: "Electronics", 
      price: ethers.parseEther("0.04"),
      imageHash: "QmLaptopStand456",
      metadataHash: "QmLaptopStandMeta456"
    },
    {
      name: "NFT Art Collection Guide",
      description: "Complete digital guide to creating and selling NFT art collections",
      category: "Digital",
      price: ethers.parseEther("0.025"),
      imageHash: "QmNFTGuide789",
      metadataHash: "QmNFTGuideMeta789"
    },
    {
      name: "Organic Hemp T-Shirt", 
      description: "Comfortable organic hemp t-shirt with blockchain authenticity verification",
      category: "Clothing",
      price: ethers.parseEther("0.03"),
      imageHash: "QmHempShirt101",
      metadataHash: "QmHempShirtMeta101"
    },
    {
      name: "Smart Fitness Tracker",
      description: "Advanced fitness tracker with AI coaching and Web3 rewards",
      category: "Sports",
      price: ethers.parseEther("0.12"),
      imageHash: "QmFitnessTracker202", 
      metadataHash: "QmFitnessTrackerMeta202"
    }
  ];

  // Check if deployer is registered as seller
  try {
    console.log("🔍 Checking seller registration...");
    const sellerInfo = await productRegistry.sellers(deployer.address);
    
    if (!sellerInfo.name) {
      console.log("📝 Registering as seller...");
      const registerTx = await productRegistry.registerSeller(
        "Cross-Chain Marketplace", 
        "Multi-chain product seller"
      );
      await registerTx.wait();
      console.log("✅ Seller registered successfully!");
    } else {
      console.log("✅ Already registered as seller:", sellerInfo.name);
    }
  } catch (error) {
    console.log("⚠️ Error with seller registration:", (error as Error).message);
  }

  // Get current marketplace stats
  try {
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Current Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);
  } catch (error) {
    console.log("⚠️ Could not get marketplace stats:", (error as Error).message);
  }

  // Add products (skip categories since they already exist)
  console.log("\n🛒 Adding products...");
  let successCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`📦 Adding product ${i + 1}/${products.length}: ${product.name}`);

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
      console.log(`✅ Success: ${product.name}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${product.name} - ${(error as Error).message}`);
    }
  }

  // Final stats
  try {
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Final Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);
  } catch (error) {
    console.error("Error getting final stats:", (error as Error).message);
  }

  console.log("\n🎉 Product addition completed!");
  console.log(`✅ Successfully added: ${successCount}/${products.length} products`);
  console.log(`🔗 ProductRegistry: ${addresses.productRegistry}`);
  console.log(`🌐 Network: ${hre.network.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });