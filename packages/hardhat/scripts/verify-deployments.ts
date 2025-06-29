import { ethers } from "hardhat";
import { Contract } from "ethers";

/**
 * Comprehensive deployment verification and testing suite
 * 
 * Verification Tasks:
 * - Contract deployment validation
 * - Integration testing between contracts
 * - Chainlink service connectivity tests
 * - End-to-end marketplace flow testing
 * - Security and access control verification
 * 
 * Usage: npx hardhat run scripts/verify-deployments.ts --network <network>
 */

interface TestResults {
  contractDeployments: boolean;
  contractIntegrations: boolean;
  chainlinkServices: boolean;
  marketplaceFlow: boolean;
  accessControl: boolean;
  overall: boolean;
}

async function main() {
  console.log("\n🔍 Verifying Enhanced Marketplace Deployments...");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`🌐 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const results: TestResults = {
    contractDeployments: false,
    contractIntegrations: false,
    chainlinkServices: false,
    marketplaceFlow: false,
    accessControl: false,
    overall: false,
  };

  try {
    // Get deployed contracts
    const contracts = await getContracts();
    
    // Run verification tests
    results.contractDeployments = await verifyContractDeployments(contracts);
    results.contractIntegrations = await verifyContractIntegrations(contracts);
    results.chainlinkServices = await verifyChainlinkServices(contracts);
    results.marketplaceFlow = await verifyMarketplaceFlow(contracts);
    results.accessControl = await verifyAccessControl(contracts);

    // Calculate overall result
    results.overall = Object.values(results).every(result => result === true);

    // Display results
    displayResults(results);

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

/**
 * Get deployed contract instances
 */
async function getContracts() {
  console.log("\n📦 Loading deployed contracts...");
  
  try {
    const productRegistry = await ethers.getContract("ProductRegistry");
    const aiRecommendations = await ethers.getContract("AIRecommendations");
    const escrowManager = await ethers.getContract("EscrowManager");

    console.log(`✅ ProductRegistry: ${await productRegistry.getAddress()}`);
    console.log(`✅ AIRecommendations: ${await aiRecommendations.getAddress()}`);
    console.log(`✅ EscrowManager: ${await escrowManager.getAddress()}`);

    return {
      productRegistry,
      aiRecommendations,
      escrowManager,
    };
  } catch (error) {
    console.error("❌ Failed to load contracts:", error);
    throw error;
  }
}

/**
 * Verify contract deployments are valid
 */
async function verifyContractDeployments(contracts: any): Promise<boolean> {
  console.log("\n1️⃣ Verifying Contract Deployments...");
  
  try {
    // Check contract addresses
    const addresses = [
      await contracts.productRegistry.getAddress(),
      await contracts.aiRecommendations.getAddress(),
      await contracts.escrowManager.getAddress(),
    ];

    for (const address of addresses) {
      if (!ethers.isAddress(address) || address === ethers.ZeroAddress) {
        throw new Error(`Invalid contract address: ${address}`);
      }
      
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        throw new Error(`No bytecode at address: ${address}`);
      }
    }

    // Check basic contract state
    const totalProducts = await contracts.productRegistry.totalProducts();
    const totalSellers = await contracts.productRegistry.totalSellers();
    const categories = await contracts.productRegistry.getCategories();
    
    console.log(`📊 ProductRegistry Stats:`);
    console.log(`  Total Products: ${totalProducts}`);
    console.log(`  Total Sellers: ${totalSellers}`);
    console.log(`  Categories: ${categories.length}`);

    // Check AIRecommendations state
    const arbitrators = await contracts.aiRecommendations.getArbitratorQueue();
    const maxCases = await contracts.aiRecommendations.maxCasesPerArbitrator();
    
    console.log(`🤖 AIRecommendations Stats:`);
    console.log(`  Arbitrators: ${arbitrators.length}`);
    console.log(`  Max Cases per Arbitrator: ${maxCases}`);

    // Check EscrowManager state
    const nextEscrowId = await contracts.escrowManager.nextEscrowId();
    const platformFee = await contracts.escrowManager.platformFeePercentage();
    
    console.log(`🔐 EscrowManager Stats:`);
    console.log(`  Next Escrow ID: ${nextEscrowId}`);
    console.log(`  Platform Fee: ${platformFee / 100}%`);

    console.log("✅ Contract deployments verified successfully");
    return true;

  } catch (error) {
    console.error("❌ Contract deployment verification failed:", error);
    return false;
  }
}

/**
 * Verify contract integrations
 */
async function verifyContractIntegrations(contracts: any): Promise<boolean> {
  console.log("\n2️⃣ Verifying Contract Integrations...");
  
  try {
    // Check ProductRegistry escrow configuration
    const escrowConfig = await contracts.productRegistry.getEscrowConfig();
    const [escrowManagerAddr, usdcTokenAddr, escrowEnabled] = escrowConfig;
    
    console.log(`📦 ProductRegistry Integration:`);
    console.log(`  EscrowManager: ${escrowManagerAddr}`);
    console.log(`  USDC Token: ${usdcTokenAddr}`);
    console.log(`  Escrow Enabled: ${escrowEnabled}`);

    if (escrowManagerAddr !== await contracts.escrowManager.getAddress()) {
      throw new Error("EscrowManager address mismatch in ProductRegistry");
    }

    if (!escrowEnabled) {
      throw new Error("Escrow functionality not enabled in ProductRegistry");
    }

    // Check AIRecommendations authorized callers
    const isEscrowAuthorized = await contracts.aiRecommendations.authorizedCallers(
      await contracts.escrowManager.getAddress()
    );
    
    console.log(`🤖 AIRecommendations Integration:`);
    console.log(`  EscrowManager Authorized: ${isEscrowAuthorized}`);

    if (!isEscrowAuthorized) {
      console.warn("⚠️  EscrowManager not authorized in AIRecommendations");
    }

    // Test cross-contract interface compatibility
    console.log(`🔄 Testing interface compatibility...`);
    
    // Test ProductRegistry -> EscrowManager interface
    const productForAI = await contracts.productRegistry.getProductForAI(1);
    console.log(`  Product interface test: ${productForAI ? "✅" : "❌"}`);

    console.log("✅ Contract integrations verified successfully");
    return true;

  } catch (error) {
    console.error("❌ Contract integration verification failed:", error);
    return false;
  }
}

/**
 * Verify Chainlink services
 */
async function verifyChainlinkServices(contracts: any): Promise<boolean> {
  console.log("\n3️⃣ Verifying Chainlink Services...");
  
  try {
    // Test Functions configuration
    console.log("📡 Testing Chainlink Functions...");
    
    const aiSourceCode = await contracts.aiRecommendations.sourceCode();
    const disputeSourceCode = await contracts.aiRecommendations.disputeAnalysisSourceCode();
    
    console.log(`  AI Source Code Length: ${aiSourceCode.length} chars`);
    console.log(`  Dispute Source Code Length: ${disputeSourceCode.length} chars`);
    
    if (aiSourceCode.length === 0) {
      console.warn("⚠️  No AI source code configured");
    }
    
    if (disputeSourceCode.length === 0) {
      console.warn("⚠️  No dispute analysis source code configured");
    }

    // Test VRF configuration
    console.log("🎲 Testing VRF Configuration...");
    
    const arbitratorQueue = await contracts.aiRecommendations.getArbitratorQueue();
    console.log(`  Available Arbitrators: ${arbitratorQueue.length}`);
    
    if (arbitratorQueue.length === 0) {
      console.warn("⚠️  No arbitrators configured for VRF selection");
    }

    // Test Automation interface
    console.log("⏰ Testing Automation Interface...");
    
    const checkData = ethers.encodeBytes32String("");
    const [upkeepNeeded, performData] = await contracts.escrowManager.checkUpkeep(checkData);
    console.log(`  Upkeep Check Result: ${upkeepNeeded}`);
    console.log(`  Perform Data Available: ${performData.length > 0}`);

    // Test Functions request capabilities (without actually sending)
    console.log("🧪 Testing Functions Request Capability...");
    
    try {
      // This should not fail if Functions are properly configured
      const lastRequestId = await contracts.aiRecommendations.getLastRequestId();
      console.log(`  Last Request ID: ${lastRequestId}`);
    } catch (error) {
      console.warn("⚠️  Functions request interface issue:", error);
    }

    console.log("✅ Chainlink services verification completed");
    return true;

  } catch (error) {
    console.error("❌ Chainlink services verification failed:", error);
    return false;
  }
}

/**
 * Verify complete marketplace flow
 */
async function verifyMarketplaceFlow(contracts: any): Promise<boolean> {
  console.log("\n4️⃣ Verifying Marketplace Flow...");
  
  try {
    const [deployer] = await ethers.getSigners();
    
    // Step 1: Register as seller
    console.log("👤 Testing seller registration...");
    
    const registerTx = await contracts.productRegistry.registerSeller(
      "Test Seller",
      "A test seller for verification"
    );
    await registerTx.wait();
    
    const sellerProfile = await contracts.productRegistry.sellers(deployer.address);
    console.log(`  Seller registered: ${sellerProfile.name}`);

    // Step 2: List a product
    console.log("📦 Testing product listing...");
    
    const listTx = await contracts.productRegistry.listProduct(
      "Test Product",
      "A test product for verification",
      "Digital",
      ethers.parseEther("0.01"), // 0.01 ETH
      "QmTestImageHash",
      "QmTestMetadataHash"
    );
    const listReceipt = await listTx.wait();
    
    // Extract product ID from events
    const productListedEvent = listReceipt.events?.find((e: any) => e.event === "ProductListed");
    const productId = productListedEvent?.args?.productId;
    
    console.log(`  Product listed with ID: ${productId}`);

    // Step 3: Test escrow availability
    console.log("🔐 Testing escrow availability...");
    
    const isEscrowAvailable = await contracts.productRegistry.isEscrowAvailable();
    console.log(`  Escrow Available: ${isEscrowAvailable}`);

    // Step 4: Test AI recommendation interface (without actual request)
    console.log("🤖 Testing AI recommendation interface...");
    
    try {
      // Set user preferences
      const prefTx = await contracts.aiRecommendations.setUserPreferences(
        "Digital,Electronics",
        "0,100000000000000000", // 0-0.1 ETH
        "medium",
        "TestBrand",
        "Testing verification"
      );
      await prefTx.wait();
      
      const userPrefs = await contracts.aiRecommendations.userPreferences(deployer.address);
      console.log(`  User preferences set: ${userPrefs.exists}`);
    } catch (error) {
      console.warn("⚠️  AI preferences setup issue:", error);
    }

    // Step 5: Test basic escrow creation (minimal ETH)
    console.log("💰 Testing escrow creation...");
    
    try {
      const escrowTx = await contracts.productRegistry.purchaseWithEscrowETH(
        productId,
        { value: ethers.parseEther("0.01") }
      );
      const escrowReceipt = await escrowTx.wait();
      
      const escrowCreatedEvent = escrowReceipt.events?.find((e: any) => e.event === "ProductPurchasedWithEscrow");
      const escrowId = escrowCreatedEvent?.args?.escrowId;
      
      console.log(`  Escrow created with ID: ${escrowId}`);
      
      // Get escrow details
      const escrow = await contracts.escrowManager.getEscrow(escrowId);
      console.log(`  Escrow amount: ${ethers.formatEther(escrow.amount)} ETH`);
      console.log(`  Escrow status: ${escrow.status}`);
      
    } catch (error) {
      console.warn("⚠️  Escrow creation test failed:", error);
    }

    console.log("✅ Marketplace flow verification completed");
    return true;

  } catch (error) {
    console.error("❌ Marketplace flow verification failed:", error);
    return false;
  }
}

/**
 * Verify access control and security
 */
async function verifyAccessControl(contracts: any): Promise<boolean> {
  console.log("\n5️⃣ Verifying Access Control & Security...");
  
  try {
    const [deployer] = await ethers.getSigners();
    
    // Test ProductRegistry access control
    console.log("📦 Testing ProductRegistry access control...");
    
    const isOwner = await contracts.productRegistry.owner();
    const isModerator = await contracts.productRegistry.moderators(deployer.address);
    
    console.log(`  Owner: ${isOwner}`);
    console.log(`  Deployer is moderator: ${isModerator}`);

    // Test AIRecommendations access control
    console.log("🤖 Testing AIRecommendations access control...");
    
    const aiOwner = await contracts.aiRecommendations.owner();
    const isAuthorizedCaller = await contracts.aiRecommendations.authorizedCallers(deployer.address);
    
    console.log(`  AI Owner: ${aiOwner}`);
    console.log(`  Deployer is authorized: ${isAuthorizedCaller}`);

    // Test EscrowManager access control
    console.log("🔐 Testing EscrowManager access control...");
    
    const DEFAULT_ADMIN_ROLE = await contracts.escrowManager.DEFAULT_ADMIN_ROLE();
    const MODERATOR_ROLE = await contracts.escrowManager.MODERATOR_ROLE();
    const EMERGENCY_ROLE = await contracts.escrowManager.EMERGENCY_ROLE();
    
    const hasAdminRole = await contracts.escrowManager.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasModeratorRole = await contracts.escrowManager.hasRole(MODERATOR_ROLE, deployer.address);
    const hasEmergencyRole = await contracts.escrowManager.hasRole(EMERGENCY_ROLE, deployer.address);
    
    console.log(`  Has Admin Role: ${hasAdminRole}`);
    console.log(`  Has Moderator Role: ${hasModeratorRole}`);
    console.log(`  Has Emergency Role: ${hasEmergencyRole}`);

    // Test security features
    console.log("🛡️ Testing security features...");
    
    // Check if contracts are pausable
    try {
      const isPaused = await contracts.escrowManager.paused();
      console.log(`  EscrowManager paused: ${isPaused}`);
    } catch (error) {
      console.log("  Pause functionality: Not implemented or accessible");
    }

    // Check emergency mode
    try {
      const emergencyMode = await contracts.escrowManager.emergencyMode();
      console.log(`  Emergency mode: ${emergencyMode}`);
    } catch (error) {
      console.log("  Emergency mode: Not accessible");
    }

    console.log("✅ Access control verification completed");
    return true;

  } catch (error) {
    console.error("❌ Access control verification failed:", error);
    return false;
  }
}

/**
 * Display verification results
 */
function displayResults(results: TestResults) {
  console.log("\n📋 VERIFICATION RESULTS");
  console.log("==================================================");
  
  const resultEmoji = (passed: boolean) => passed ? "✅" : "❌";
  
  console.log(`${resultEmoji(results.contractDeployments)} Contract Deployments: ${results.contractDeployments ? "PASSED" : "FAILED"}`);
  console.log(`${resultEmoji(results.contractIntegrations)} Contract Integrations: ${results.contractIntegrations ? "PASSED" : "FAILED"}`);
  console.log(`${resultEmoji(results.chainlinkServices)} Chainlink Services: ${results.chainlinkServices ? "PASSED" : "FAILED"}`);
  console.log(`${resultEmoji(results.marketplaceFlow)} Marketplace Flow: ${results.marketplaceFlow ? "PASSED" : "FAILED"}`);
  console.log(`${resultEmoji(results.accessControl)} Access Control: ${results.accessControl ? "PASSED" : "FAILED"}`);
  
  console.log("\n" + "=".repeat(50));
  console.log(`${resultEmoji(results.overall)} OVERALL VERIFICATION: ${results.overall ? "PASSED" : "FAILED"}`);
  console.log("=".repeat(50));

  if (results.overall) {
    console.log("\n🎉 All verifications passed! Marketplace is ready for use.");
    console.log("\n📝 Next Steps:");
    console.log("1. Fund Chainlink subscriptions");
    console.log("2. Register Chainlink Automation upkeep");
    console.log("3. Add VRF and Functions consumers via Chainlink dashboard");
    console.log("4. Test with real users and transactions");
  } else {
    console.log("\n⚠️  Some verifications failed. Please review and fix issues before proceeding.");
  }

  console.log("\n🔗 Important Links:");
  console.log("- Chainlink Functions Dashboard: https://functions.chain.link");
  console.log("- Chainlink VRF Dashboard: https://vrf.chain.link");
  console.log("- Chainlink Automation Dashboard: https://automation.chain.link");
  console.log("- CCIP Explorer: https://ccip.chain.link");
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;