import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the enhanced ProductRegistry contract with escrow integration
 * 
 * Features:
 * - Product listing and management
 * - Seller registration and verification
 * - AI recommendation integration
 * - Escrow system integration
 * - Category management
 * - Rating and review system
 * 
 * @param hre HardhatRuntimeEnvironment
 */
const deployEnhancedProductRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;
  const chainId = await hre.getChainId();

  log("\n📦 Deploying Enhanced ProductRegistry...");
  log("==================================================");

  // Network-specific configurations
  const networkConfig = getNetworkConfig(chainId);
  
  // Initial moderators (deployer by default)
  const initialModerators = [deployer];
  
  // Deploy the enhanced ProductRegistry contract
  const productRegistryDeployment = await deploy("ProductRegistry", {
    from: deployer,
    args: [], // No constructor args needed
    log: true,
    autoMine: true,
    waitConfirmations: networkConfig.blockConfirmations,
  });

  const productRegistry: Contract = await hre.ethers.getContract("ProductRegistry", deployer);
  
  log(`✅ ProductRegistry deployed to: ${productRegistryDeployment.address}`);
  log(`📍 Transaction hash: ${productRegistryDeployment.transactionHash}`);

  // Post-deployment configuration
  await configureProductRegistry(productRegistry, deployer, initialModerators, hre);

  // Verify on Etherscan/Snowtrace if not on local network
  if (networkConfig.verify && productRegistryDeployment.newlyDeployed) {
    log("\n🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: productRegistryDeployment.address,
        constructorArguments: [],
      });
      log("✅ Contract verified successfully");
    } catch (error) {
      log(`❌ Verification failed: ${error}`);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: chainId,
    contractName: "ProductRegistry",
    address: productRegistryDeployment.address,
    deployer: deployer,
    blockNumber: productRegistryDeployment.receipt?.blockNumber,
    gasUsed: productRegistryDeployment.receipt?.gasUsed?.toString(),
    timestamp: new Date().toISOString(),
  };

  log("\n📋 Deployment Summary:");
  log("==================================================");
  log(`Network: ${deploymentInfo.network} (${deploymentInfo.chainId})`);
  log(`Contract: ${deploymentInfo.contractName}`);
  log(`Address: ${deploymentInfo.address}`);
  log(`Deployer: ${deploymentInfo.deployer}`);
  log(`Block: ${deploymentInfo.blockNumber}`);
  log(`Gas Used: ${deploymentInfo.gasUsed}`);
  log(`Timestamp: ${deploymentInfo.timestamp}`);

  return true;
};

/**
 * Configure the ProductRegistry after deployment
 */
async function configureProductRegistry(
  productRegistry: Contract,
  deployer: string,
  moderators: string[],
  hre: HardhatRuntimeEnvironment
) {
  const { log } = hre.deployments;
  
  log("\n⚙️ Configuring ProductRegistry...");

  try {
    // Set up additional moderators if any
    for (const moderator of moderators) {
      if (moderator !== deployer) {
        log(`👥 Adding moderator: ${moderator}`);
        const tx = await productRegistry.setModerator(moderator, true);
        await tx.wait();
      }
    }

    // Add additional categories if needed
    const additionalCategories = [
      "NFTs",
      "Gaming",
      "Software",
      "Services",
      "Art & Collectibles",
      "Health & Wellness",
      "Food & Beverage",
      "Travel & Tourism"
    ];

    log("📂 Adding additional product categories...");
    for (const category of additionalCategories) {
      try {
        const tx = await productRegistry.addCategory(category);
        await tx.wait();
        log(`  ✅ Added category: ${category}`);
      } catch (error: any) {
        if (error.message.includes("Category already exists")) {
          log(`  ⚠️ Category already exists: ${category}`);
        } else {
          log(`  ❌ Failed to add category ${category}: ${error.message}`);
        }
      }
    }

    // Get total stats
    const stats = await productRegistry.getMarketplaceStats();
    log(`\n📊 Initial marketplace stats:`);
    log(`  Total Products: ${stats[0]}`);
    log(`  Total Sellers: ${stats[1]}`);
    log(`  Active Products: ${stats[2]}`);

    // Get categories
    const categories = await productRegistry.getCategories();
    log(`  Total Categories: ${categories.length}`);
    log(`  Categories: ${categories.join(", ")}`);

    log("✅ ProductRegistry configuration completed");

  } catch (error) {
    log(`❌ Configuration failed: ${error}`);
    throw error;
  }
}

/**
 * Get network-specific configuration
 */
function getNetworkConfig(chainId: string) {
  const configs: { [key: string]: any } = {
    // Ethereum Sepolia
    "11155111": {
      name: "sepolia",
      verify: true,
      blockConfirmations: 6,
    },
    // Avalanche Fuji
    "43113": {
      name: "fuji",
      verify: true,
      blockConfirmations: 6,
    },
    // Local Hardhat
    "31337": {
      name: "localhost",
      verify: false,
      blockConfirmations: 1,
    },
  };

  return configs[chainId] || {
    name: "unknown",
    verify: false,
    blockConfirmations: 1,
  };
}

export default deployEnhancedProductRegistry;

// Unique ID for this deployment script
deployEnhancedProductRegistry.id = "deploy_enhanced_product_registry";

// Tags for deployment
deployEnhancedProductRegistry.tags = ["ProductRegistry", "Enhanced", "Core"];

// Dependencies
deployEnhancedProductRegistry.dependencies = [];