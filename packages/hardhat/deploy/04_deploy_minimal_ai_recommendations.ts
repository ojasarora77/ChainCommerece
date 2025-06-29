import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a minimal AIRecommendations contract that can be deployed within size limits
 */
const deployMinimalAIRecommendations: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log, get } = hre.deployments;
  const chainId = await hre.getChainId();

  log("\n🤖 Deploying Minimal AIRecommendations...");
  log("==================================================");

  // Get network-specific configurations
  const networkConfig = getNetworkConfig(chainId);
  
  // Get previously deployed contract address
  const productRegistryDeployment = await get("ProductRegistry");
  
  log(`📦 ProductRegistry found at: ${productRegistryDeployment.address}`);

  // Constructor arguments for minimal deployment (AIMarketplace only needs router)
  const constructorArgs = [
    networkConfig.functionsRouter,
  ];

  log("📋 Constructor Arguments:");
  log(`  Functions Router: ${constructorArgs[0]}`);

  // Deploy the AIMarketplace contract (simpler than AIRecommendations)
  const aiDeployment = await deploy("AIMarketplace", {
    from: deployer,
    args: constructorArgs,
    log: true,
    autoMine: true,
    waitConfirmations: networkConfig.blockConfirmations,
    gasLimit: 4000000,
  });

  log(`✅ AIMarketplace deployed to: ${aiDeployment.address}`);
  log(`📍 Transaction hash: ${aiDeployment.transactionHash}`);

  // Post-deployment configuration
  const aiContract: Contract = await hre.ethers.getContract("AIMarketplace", deployer);
  
  try {
    // Set basic configuration
    if (networkConfig.functionsSubscriptionId && networkConfig.functionsSubscriptionId !== 1) {
      log("🔗 Setting subscription ID...");
      const setSubTx = await aiContract.setSubscriptionId(networkConfig.functionsSubscriptionId);
      await setSubTx.wait();
      log("✅ Subscription ID set");
    }

    if (networkConfig.donId && networkConfig.donId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      log("🔗 Setting DON ID...");
      const setDonTx = await aiContract.setDonId(networkConfig.donId);
      await setDonTx.wait();
      log("✅ DON ID set");
    }

    log("✅ AI contract configuration completed");
  } catch (error) {
    log(`⚠️ Configuration partially failed: ${error}`);
  }

  // Verify on Etherscan/Snowtrace if not on local network
  if (networkConfig.verify && aiDeployment.newlyDeployed) {
    log("\n🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: aiDeployment.address,
        constructorArguments: constructorArgs,
      });
      log("✅ Contract verified successfully");
    } catch (error) {
      log(`❌ Verification failed: ${error}`);
    }
  }

  log("\n📋 Deployment Summary:");
  log("==================================================");
  log(`Network: ${hre.network.name} (${chainId})`);
  log(`Contract: AIMarketplace (minimal AI functionality)`);
  log(`Address: ${aiDeployment.address}`);
  log(`Deployer: ${deployer}`);
  log(`Block: ${aiDeployment.receipt?.blockNumber}`);
  log(`Gas Used: ${aiDeployment.receipt?.gasUsed?.toString()}`);

  return true;
};

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
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
      functionsSubscriptionId: process.env.CHAINLINK_SUBSCRIPTION_ID_SEPOLIA || 1,
    },
    // Avalanche Fuji
    "43113": {
      name: "fuji",
      verify: true,
      blockConfirmations: 6,
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
      functionsSubscriptionId: process.env.CHAINLINK_SUBSCRIPTION_ID_FUJI || 1,
    },
     "84532": {
      name: "baseSepolia",
      verify: true,
      blockConfirmations: 6,
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
      functionsSubscriptionId: 390,
    },
    // Local Hardhat
    "31337": {
      name: "localhost",
      verify: false,
      blockConfirmations: 1,
      functionsRouter: "0x0000000000000000000000000000000000000000",
      donId: "0x0000000000000000000000000000000000000000000000000000000000000000",
      functionsSubscriptionId: 1,
    },
  };

  return configs[chainId] || configs["31337"];
}

export default deployMinimalAIRecommendations;

// Unique ID for this deployment script
deployMinimalAIRecommendations.id = "deploy_minimal_ai_recommendations";

// Tags for deployment
deployMinimalAIRecommendations.tags = ["AIMarketplace", "Minimal", "Core"];

// Dependencies
deployMinimalAIRecommendations.dependencies = ["ProductRegistry"];