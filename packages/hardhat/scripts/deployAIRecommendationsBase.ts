import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🤖 Deploying AIRecommendations on Base Sepolia...");
  console.log("📍 Network:", hre.network.name);
  console.log("🔗 Chain ID:", await hre.getChainId());

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Base Sepolia addresses
  const productRegistryAddress = "0x8aF3507ccEbB20579196b11e1Ad11FCAb6bae760";
  const functionsRouter = "0xf9B8fc078197181C841c296C876945aaa425B278";
  const vrfCoordinator = "0x5CE8D5A2BC84beb22a398CCA51996F7930313D61";
  const gasLane = "0x816bedba8a50b294e5cbd47842baf240c2385f2eaaec7edafc44ee316031edea";
  
  console.log(`📦 Using ProductRegistry: ${productRegistryAddress}`);

  // Constructor arguments for AIRecommendations
  // We'll use zero address for escrowManager since it's not deployed yet
  const constructorArgs = [
    functionsRouter,           // router
    productRegistryAddress,    // _productRegistry
    ethers.ZeroAddress,       // _escrowManager (not deployed yet)
    vrfCoordinator,           // _vrfCoordinator
    1,                        // _vrfSubscriptionId
    gasLane,                  // _gasLane
    500000                    // _callbackGasLimit
  ];

  console.log("📋 Constructor Arguments:");
  console.log(`  Functions Router: ${constructorArgs[0]}`);
  console.log(`  ProductRegistry: ${constructorArgs[1]}`);
  console.log(`  EscrowManager: ${constructorArgs[2]}`);
  console.log(`  VRF Coordinator: ${constructorArgs[3]}`);
  console.log(`  VRF Subscription ID: ${constructorArgs[4]}`);
  console.log(`  Gas Lane: ${constructorArgs[5]}`);
  console.log(`  Callback Gas Limit: ${constructorArgs[6]}`);

  // Deploy the AIRecommendations contract
  console.log("\n🚀 Deploying AIRecommendations...");
  const AIRecommendations = await ethers.getContractFactory("AIRecommendations");
  
  const aiRecommendations = await AIRecommendations.deploy(...constructorArgs, {
    gasLimit: 3000000,
  });

  await aiRecommendations.waitForDeployment();
  const address = await aiRecommendations.getAddress();

  console.log(`✅ AIRecommendations deployed to: ${address}`);
  console.log(`📍 Transaction hash: ${aiRecommendations.deploymentTransaction()?.hash}`);

  console.log("\n📋 Deployment Summary:");
  console.log("==================================================");
  console.log(`Network: Base Sepolia (84532)`);
  console.log(`Contract: AIRecommendations`);
  console.log(`Address: ${address}`);
  console.log(`Deployer: ${deployer.address}`);

  console.log("\n🎉 AIRecommendations deployment completed!");
  console.log(`🔗 Contract address: ${address}`);
  console.log(`🌐 Network: Base Sepolia`);
  
  console.log("\n📝 Next step: Update EscrowManager deployment script with this address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });