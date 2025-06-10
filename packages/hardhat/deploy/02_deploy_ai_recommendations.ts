import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import fs from "fs";
import path from "path";

/**
 * Deploys the AIRecommendations contract with Chainlink Functions integration
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAIRecommendations: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  console.log("\n🤖 Deploying AIRecommendations contract...");
  console.log("📍 Network:", hre.network.name);
  console.log("👤 Deployer:", deployer);

  // Get ProductRegistry address from previous deployment
  let productRegistryAddress: string;
  try {
    const productRegistry = await get("ProductRegistry");
    productRegistryAddress = productRegistry.address;
    console.log("📦 ProductRegistry found at:", productRegistryAddress);
  } catch (error) {
    throw new Error("ProductRegistry not deployed. Please deploy ProductRegistry first.");
  }

  // Chainlink Functions router addresses for different networks
  const functionsRouters: { [key: string]: string } = {
    // Avalanche Fuji testnet
    avalancheFuji: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
    // Ethereum Sepolia testnet  
    sepolia: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    // For local development, use a mock address
    localhost: "0x0000000000000000000000000000000000000001",
    hardhat: "0x0000000000000000000000000000000000000001"
  };

  const functionsRouter = functionsRouters[hre.network.name];
  if (!functionsRouter) {
    throw new Error(`Functions router not configured for network: ${hre.network.name}`);
  }

  console.log("🔗 Functions Router:", functionsRouter);

  // Deploy AIRecommendations contract
  await deploy("AIRecommendations", {
    from: deployer,
    args: [functionsRouter, productRegistryAddress],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const aiRecommendations = await hre.ethers.getContract<Contract>("AIRecommendations", deployer);
  const aiAddress = await aiRecommendations.getAddress();
  console.log("✅ AIRecommendations deployed to:", aiAddress);

  // Read the JavaScript source code for Chainlink Functions
  const jsSourcePath = path.join(__dirname, "..", "..", "ai-functions", "src", "recommendations.js");
  let sourceCode: string;

  try {
    // First try to read from ai-functions directory
    sourceCode = fs.readFileSync(jsSourcePath, "utf8");
    console.log("📄 Loaded JavaScript source from ai-functions/");
  } catch (error) {
    // Fallback: use inline source code
    console.log("📄 Using inline JavaScript source (ai-functions not found)");
    sourceCode = `
// Chainlink Functions JavaScript for AI recommendations
const userPreferences = args[0];
const productData = args[1]; 
const maxResults = parseInt(args[2]) || 5;

console.log("AI Recommendation Function Started");

try {
    const preferences = JSON.parse(userPreferences);
    const products = JSON.parse(productData);
    
    // Mock AI logic for demo
    const recommendations = [
        {productId: 1, score: 95, reason: "Perfect sustainability match"},
        {productId: 2, score: 87, reason: "Popular in category"},
        {productId: 3, score: 82, reason: "Budget-friendly option"}
    ].slice(0, maxResults);
    
    const productIds = recommendations.map(r => r.productId);
    const scores = recommendations.map(r => r.score);
    const response = productIds.map((id, i) => id + "," + scores[i]).join(",");
    
    return Functions.encodeString(response);
} catch (error) {
    return Functions.encodeString("1,85,2,80,3,75");
}`;
  }

  // Initialize Functions configuration (for testnets and mainnet)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⚙️ Initializing Chainlink Functions configuration...");
    
    // Note: In production, you need to:
    // 1. Create a Chainlink Functions subscription
    // 2. Fund it with LINK tokens
    // 3. Add your contract as a consumer
    
    const subscriptionId = 1; // Replace with your actual subscription ID
    const gasLimit = 300000;
    
    // DON ID for different networks
    const donIds: { [key: string]: string } = {
      avalancheFuji: "0x66756e2d617661782d66756a692d31000000000000000000000000000000",
      sepolia: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000"
    };
    
    const donId = donIds[hre.network.name];
    
    if (donId) {
      try {
        await aiRecommendations.initializeFunctions(
          sourceCode,
          subscriptionId,
          gasLimit,
          donId
        );
        console.log("✅ Functions configuration initialized");
      } catch (error) {
        console.log("⚠️ Functions initialization failed (expected without subscription):", error);
      }
    }
  } else {
    // For local development, just set the source code
    console.log("\n⚙️ Setting up for local development...");
    try {
      await aiRecommendations.updateSourceCode(sourceCode);
      console.log("✅ Source code updated for local testing");
    } catch (error) {
      console.log("⚠️ Could not update source code:", error);
    }
  }

  // Set up demo user preferences for testing
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n🌱 Setting up demo user preferences...");
    
    try {
      // Set demo user preferences
      await aiRecommendations.setUserPreferences(
        "Electronics,Sports", // categories
        "0,100000000000000000", // price range (0 to 0.1 ETH in wei)
        "high", // sustainability focus
        "GreenTech", // brand preferences
        "I prefer eco-friendly products with fast shipping" // custom preferences
      );
      console.log("✅ Demo user preferences set for:", deployer);
      
      // Test basic recommendation (fallback method)
      const basicRecs = await aiRecommendations.getBasicRecommendations(deployer, 3);
      console.log("📋 Basic recommendations test:", basicRecs.map((id: { toString: () => any; }) => id.toString()));
      
    } catch (error) {
      console.log("⚠️ Error setting up demo data:", error);
    }
  }

  // Display integration instructions
  console.log("\n📋 Next Steps:");
  console.log("1. 🔗 Set up Chainlink Functions subscription (for testnets)");
  console.log("2. 💰 Fund subscription with LINK tokens");
  console.log("3. 🎯 Add contract as consumer to subscription");
  console.log("4. 🧪 Test AI recommendations with requestRecommendations()");
  console.log("5. 🌉 Integrate with CCIP for cross-chain functionality");

  console.log("\n🔧 Useful Commands:");
  console.log(`- Set user preferences: aiRecommendations.setUserPreferences(...)`);
  console.log(`- Request AI recommendations: aiRecommendations.requestRecommendations(5)`);
  console.log(`- Get latest recommendations: aiRecommendations.getLatestRecommendations(userAddress)`);
  console.log(`- Get basic fallback: aiRecommendations.getBasicRecommendations(userAddress, 5)`);

  console.log("\n🎉 AIRecommendations deployment complete!");
  console.log("🤖 Contract address:", aiAddress);
  console.log("📦 ProductRegistry:", productRegistryAddress);
  
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⚠️ IMPORTANT for Testnets:");
    console.log("1. Create Chainlink Functions subscription at functions.chain.link");
    console.log("2. Fund it with LINK tokens");
    console.log("3. Add this contract as a consumer");
    console.log("4. Update subscription ID in the contract");
  }
};

export default deployAIRecommendations;

// Tags for selective deployment
deployAIRecommendations.tags = ["AIRecommendations", "chainlink", "functions", "ai"];
deployAIRecommendations.dependencies = ["ProductRegistry"];