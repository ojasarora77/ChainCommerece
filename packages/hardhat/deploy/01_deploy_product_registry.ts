import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the ProductRegistry contract
 * This is the foundation of our AI-powered marketplace
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProductRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 Deploying ProductRegistry contract...");
  console.log("📍 Network:", hre.network.name);
  console.log("👤 Deployer:", deployer);

  await deploy("ProductRegistry", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying
  const productRegistry = await hre.ethers.getContract<Contract>("ProductRegistry", deployer);
  console.log("✅ ProductRegistry deployed to:", await productRegistry.getAddress());

  // Initialize the contract with some demo data for development
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n🌱 Setting up demo data...");
    
    try {
      // Register some demo sellers
      const demoSellers = [
        {
          name: "GreenTech Solutions",
          description: "Sustainable technology products for a better future"
        },
        {
          name: "Fashion Forward",
          description: "Trendy and eco-friendly clothing"
        },
        {
          name: "Book Nook",
          description: "Curated selection of digital and physical books"
        }
      ];

      // Register sellers
      for (let i = 0; i < demoSellers.length; i++) {
        const seller = demoSellers[i];
        await productRegistry.registerSeller(seller.name, seller.description);
        console.log(`📝 Registered seller: ${seller.name}`);
      }

      // List some demo products
      const demoProducts = [
        {
          name: "Solar Phone Charger",
          description: "Portable solar-powered charger with fast charging capabilities. Perfect for outdoor activities and emergency use.",
          category: "Electronics",
          price: hre.ethers.parseEther("0.05"), // 0.05 ETH
          imageHash: "QmSolarCharger123",
          metadataHash: "QmSolarMeta123"
        },
        {
          name: "Organic Cotton T-Shirt",
          description: "100% organic cotton t-shirt made with sustainable practices. Available in multiple colors.",
          category: "Clothing", 
          price: hre.ethers.parseEther("0.02"), // 0.02 ETH
          imageHash: "QmTshirt456",
          metadataHash: "QmTshirtMeta456"
        },
        {
          name: "Blockchain Development Guide",
          description: "Comprehensive digital guide to smart contract development with practical examples and best practices.",
          category: "Digital",
          price: hre.ethers.parseEther("0.01"), // 0.01 ETH
          imageHash: "QmBook789",
          metadataHash: "QmBookMeta789"
        },
        {
          name: "Smart Plant Monitor",
          description: "IoT device that monitors soil moisture, light levels, and temperature for optimal plant care.",
          category: "Electronics",
          price: hre.ethers.parseEther("0.08"), // 0.08 ETH
          imageHash: "QmPlantMonitor101",
          metadataHash: "QmPlantMeta101"
        },
        {
          name: "Recycled Yoga Mat",
          description: "Eco-friendly yoga mat made from recycled materials. Non-slip surface with excellent grip.",
          category: "Sports",
          price: hre.ethers.parseEther("0.03"), // 0.03 ETH
          imageHash: "QmYogaMat202",
          metadataHash: "QmYogaMeta202"
        }
      ];

      // List products (all from the deployer for demo purposes)
      for (let i = 0; i < demoProducts.length; i++) {
        const product = demoProducts[i];
        const tx = await productRegistry.listProduct(
          product.name,
          product.description,
          product.category,
          product.price,
          product.imageHash,
          product.metadataHash
        );
        
        await tx.wait();
        console.log(`📦 Listed product: ${product.name} (${product.category})`);
      }

      // Get marketplace stats
      const [totalProducts, totalSellers, activeProducts] = await productRegistry.getMarketplaceStats();
      console.log("\n📊 Marketplace Stats:");
      console.log(`   Total Products: ${totalProducts}`);
      console.log(`   Total Sellers: ${totalSellers}`);
      console.log(`   Active Products: ${activeProducts}`);

      // Display categories
      const categories = await productRegistry.getCategories();
      console.log(`   Categories: ${categories.join(", ")}`);

    } catch (error) {
      console.error("❌ Error setting up demo data:", error);
    }
  }

  console.log("\n🎉 ProductRegistry deployment complete!");
  console.log("🔗 Contract address:", await productRegistry.getAddress());
  
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n📝 Next steps:");
    console.log("1. Verify the contract on block explorer");
    console.log("2. Set up moderators if needed");
    console.log("3. Add more product categories");
    console.log("4. Deploy AI recommendation system");
  }
};

export default deployProductRegistry;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags ProductRegistry
deployProductRegistry.tags = ["ProductRegistry", "marketplace", "core"];