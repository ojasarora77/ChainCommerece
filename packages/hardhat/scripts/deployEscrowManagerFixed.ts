import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🔐 Deploying EscrowManager with Full Chainlink Integration...");
  console.log("📍 Network:", hre.network.name);
  console.log("🔗 Chain ID:", await hre.getChainId());

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Network-specific configurations
  const networkConfigs: { [key: string]: any } = {
    // Avalanche Fuji
    "43113": {
      name: "fuji",
      productRegistry: "0x09e9F0D5EfCb521Bf76B94E4Fa3c6499985E2878",
      aiRecommendations: "0xe97babe1401F29921D421E5294c017D63Ff12B36",
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      vrfCoordinator: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610",
      ccipRouter: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
      linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
      usdcToken: "0x5425890298aed601595a70AB815c96711a31Bc65",
      gasLane: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
    },
    // Base Sepolia
    "84532": {
      name: "baseSepolia", 
      productRegistry: "0x8aF3507ccEbB20579196b11e1Ad11FCAb6bae760",
      aiRecommendations: "0x0000000000000000000000000000000000000000", // Zero address for now
      functionsRouter: "0xf9B8fc078197181C841c296C876945aaa425B278",
      vrfCoordinator: "0x5CE8D5A2BC84beb22a398CCA51996F7930313D61",
      ccipRouter: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93", 
      linkToken: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
      usdcToken: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
      gasLane: "0x816bedba8a50b294e5cbd47842baf240c2385f2eaaec7edafc44ee316031edea",
    }
  };

  const chainId = await hre.getChainId();
  const config = networkConfigs[chainId];
  
  if (!config) {
    throw new Error(`No configuration found for chain ID: ${chainId}`);
  }

  console.log(`📋 Using configuration for: ${config.name}`);

  // Check if AIRecommendations is deployed
  if (config.aiRecommendations === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  AIRecommendations not deployed on this network yet");
    console.log("📝 Deploy AIRecommendations first, then update the address in this script");
    return;
  }

  // Constructor arguments for EscrowManager
  const constructorArgs = [
    config.productRegistry,        // ProductRegistry contract
    config.aiRecommendations,      // AIRecommendations contract  
    config.usdcToken,              // USDC token address
    config.functionsRouter,        // Chainlink Functions router
    config.vrfCoordinator,         // VRF Coordinator
    1,                             // VRF Subscription ID (update with real ID)
    config.gasLane,                // VRF Gas Lane (Key Hash)
    500000,                        // VRF Callback Gas Limit
    config.ccipRouter,             // CCIP Router
    config.linkToken,              // LINK token address
    deployer.address               // Fee recipient
  ];

  console.log("📋 Constructor Arguments:");
  console.log(`  ProductRegistry: ${constructorArgs[0]}`);
  console.log(`  AIRecommendations: ${constructorArgs[1]}`);
  console.log(`  USDC Token: ${constructorArgs[2]}`);
  console.log(`  Functions Router: ${constructorArgs[3]}`);
  console.log(`  VRF Coordinator: ${constructorArgs[4]}`);
  console.log(`  VRF Subscription ID: ${constructorArgs[5]}`);
  console.log(`  Gas Lane: ${constructorArgs[6]}`);
  console.log(`  VRF Callback Gas Limit: ${constructorArgs[7]}`);
  console.log(`  CCIP Router: ${constructorArgs[8]}`);
  console.log(`  LINK Token: ${constructorArgs[9]}`);
  console.log(`  Fee Recipient: ${constructorArgs[10]}`);

  // Deploy the EscrowManager contract
  console.log("\n🚀 Deploying EscrowManager...");
  const EscrowManager = await ethers.getContractFactory("EscrowManager");
  
  const escrowManager = await EscrowManager.deploy(...constructorArgs, {
    gasLimit: 5000000, // Reduced gas limit
  });

  await escrowManager.waitForDeployment();
  const address = await escrowManager.getAddress();

  console.log(`✅ EscrowManager deployed to: ${address}`);
  console.log(`📍 Transaction hash: ${escrowManager.deploymentTransaction()?.hash}`);

  // Save deployment info
  console.log("\n📋 Deployment Summary:");
  console.log("==================================================");
  console.log(`Network: ${config.name} (${chainId})`);
  console.log(`Contract: EscrowManager`);
  console.log(`Address: ${address}`);
  console.log(`Deployer: ${deployer.address}`);

  console.log("\n🎉 EscrowManager deployment completed!");
  console.log(`🔗 Contract address: ${address}`);
  console.log(`🌐 Network: ${config.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });