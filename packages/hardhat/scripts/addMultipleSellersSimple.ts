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

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Main account:", deployer.address);

  // Create additional test wallets from known private keys (these are standard test keys)
  const testPrivateKeys = [
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103c9c7c6ad8b28df35a0d5e9bb6c8f9e3c8a6e8b1",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
  ];

  // Create wallets for additional sellers
  const additionalWallets = testPrivateKeys.map(pk => new ethers.Wallet(pk, ethers.provider));

  // Define sellers with their wallets and products
  const sellers = [
    {
      wallet: deployer,
      name: "AI Marketplace Premium",
      description: "Premium AI-powered marketplace products",
      products: [
        {
          name: "Advanced Neural Network Module",
          description: "Cutting-edge neural network module for AI applications",
          category: "Digital",
          price: ethers.parseEther("0.35"),
          imageHash: "QmAdvancedNN789",
          metadataHash: "QmAdvancedNNMeta789"
        }
      ]
    },
    {
      wallet: additionalWallets[0],
      name: "EcoTech Innovations",
      description: "Sustainable technology for a better future",
      products: [
        {
          name: "Solar Wireless Charger",
          description: "Portable solar-powered wireless charging pad",
          category: "Electronics",
          price: ethers.parseEther("0.12"),
          imageHash: "QmSolarCharger456",
          metadataHash: "QmSolarChargerMeta456"
        },
        {
          name: "Recycled Plastic Speaker",
          description: "High-quality speaker made from 100% recycled plastic",
          category: "Electronics", 
          price: ethers.parseEther("0.08"),
          imageHash: "QmRecycledSpeaker123",
          metadataHash: "QmRecycledSpeakerMeta123"
        }
      ]
    },
    {
      wallet: additionalWallets[1],
      name: "Digital Creators Collective",
      description: "Supporting digital artists and creators worldwide",
      products: [
        {
          name: "Digital Art Masterclass",
          description: "Complete guide to creating and selling digital art",
          category: "Digital",
          price: ethers.parseEther("0.06"),
          imageHash: "QmDigitalArt654",
          metadataHash: "QmDigitalArtMeta654"
        },
        {
          name: "3D Modeling Tutorial Series",
          description: "Professional 3D modeling techniques for beginners to experts",
          category: "Digital",
          price: ethers.parseEther("0.09"),
          imageHash: "Qm3DModeling321",
          metadataHash: "Qm3DModelingMeta321"
        }
      ]
    }
  ];

  // Process each seller
  for (let i = 0; i < sellers.length; i++) {
    const seller = sellers[i];
    console.log(`\n👤 Processing Seller ${i + 1}: ${seller.name}`);
    console.log(`📧 Address: ${seller.wallet.address}`);
    
    // Check balance for non-deployer accounts
    if (seller.wallet !== deployer) {
      const balance = await ethers.provider.getBalance(seller.wallet.address);
      console.log(`💰 Balance: ${ethers.formatEther(balance)} AVAX`);
      
      // If balance is 0, send some AVAX from deployer
      if (balance === 0n) {
        console.log("💸 Sending AVAX to seller account...");
        try {
          const tx = await deployer.sendTransaction({
            to: seller.wallet.address,
            value: ethers.parseEther("0.1") // Send 0.1 AVAX
          });
          await tx.wait();
          console.log("✅ AVAX sent successfully!");
        } catch (error) {
          console.log("❌ Failed to send AVAX:", (error as Error).message);
          continue;
        }
      }
    }

    // Connect to contract with this seller's wallet
    const sellerProductRegistry = productRegistry.connect(seller.wallet);

    // Register seller if not already registered
    try {
      console.log("🔍 Checking seller registration...");
      const sellerInfo = await sellerProductRegistry.sellers(seller.wallet.address);
      
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
      continue;
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
