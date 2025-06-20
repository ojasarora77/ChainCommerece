import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Adding products from specific sellers to Avalanche Fuji marketplace...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS);

  // Define specific sellers with their private keys
  // NOTE: These are test private keys - DO NOT use real private keys with funds!
  const sellers = [
    {
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Test key 1
      name: "Tech Innovators",
      description: "Cutting-edge technology solutions",
      products: [
        {
          name: "AI Home Assistant",
          description: "Smart home AI assistant with blockchain integration",
          category: "Electronics",
          price: ethers.parseEther("0.18")
        }
      ]
    },
    {
      privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Test key 2  
      name: "Green Living Co",
      description: "Sustainable and eco-friendly products",
      products: [
        {
          name: "Solar Garden Light",
          description: "Beautiful solar-powered garden lighting",
          category: "Home & Garden",
          price: ethers.parseEther("0.04")
        }
      ]
    }
  ];

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
    const sellerProductRegistry = productRegistry.connect(wallet);

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
