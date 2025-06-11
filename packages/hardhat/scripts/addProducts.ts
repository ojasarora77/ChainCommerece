import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Adding products to marketplace...");

  // Get the deployed contract address from the deployment
  const productRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From your deployment output
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(productRegistryAddress);

  // Sample products to add
  const products = [
    {
      name: "AI-Powered Smart Watch",
      description: "Advanced smartwatch with AI health monitoring and blockchain integration",
      category: "Electronics",
      price: ethers.parseEther("0.15"), // 0.15 ETH
      imageHash: "QmSmartWatch123",
      metadataHash: "QmSmartWatchMeta123"
    },
    {
      name: "Sustainable Bamboo Laptop Stand",
      description: "Eco-friendly laptop stand made from sustainable bamboo with ergonomic design",
      category: "Electronics",
      price: ethers.parseEther("0.04"), // 0.04 ETH
      imageHash: "QmLaptopStand456",
      metadataHash: "QmLaptopStandMeta456"
    },
    {
      name: "NFT Art Collection Guide",
      description: "Complete digital guide to creating and selling NFT art collections",
      category: "Digital",
      price: ethers.parseEther("0.025"), // 0.025 ETH
      imageHash: "QmNFTGuide789",
      metadataHash: "QmNFTGuideMeta789"
    },
    {
      name: "Organic Hemp T-Shirt",
      description: "Comfortable organic hemp t-shirt with blockchain authenticity verification",
      category: "Clothing",
      price: ethers.parseEther("0.03"), // 0.03 ETH
      imageHash: "QmHempShirt101",
      metadataHash: "QmHempShirtMeta101"
    },
    {
      name: "Smart Fitness Tracker",
      description: "Advanced fitness tracker with AI coaching and Web3 rewards",
      category: "Sports",
      price: ethers.parseEther("0.12"), // 0.12 ETH
      imageHash: "QmFitnessTracker202",
      metadataHash: "QmFitnessTrackerMeta202"
    }
  ];

  // Add categories first (if they don't exist)
  const categories = ["Electronics", "Digital", "Clothing", "Sports"];
  
  for (const category of categories) {
    try {
      console.log(`📂 Adding category: ${category}`);
      const tx = await productRegistry.addCategory(category);
      await tx.wait();
      console.log(`✅ Category added: ${category}`);
    } catch (error) {
      console.log(`⚠️  Category ${category} might already exist`);
    }
  }

  // Add products
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
      
      await tx.wait();
      console.log(`✅ Product added: ${product.name} (${product.category})`);
    } catch (error) {
      console.error(`❌ Error adding product ${product.name}:`, error);
    }
  }

  // Get marketplace stats
  try {
    const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
    console.log("\n📊 Updated Marketplace Stats:");
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Sellers: ${totalSellers}`);
    console.log(`   Active Products: ${activeProducts}`);
  } catch (error) {
    console.error("Error getting marketplace stats:", error);
  }

  console.log("\n🎉 Product addition completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
