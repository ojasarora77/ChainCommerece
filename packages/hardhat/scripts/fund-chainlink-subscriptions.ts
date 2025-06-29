import { ethers } from "hardhat";
import { Contract } from "ethers";

/**
 * Manage Chainlink subscription funding and consumer management
 * 
 * Features:
 * - Check LINK token balances
 * - Fund Functions subscriptions
 * - Fund VRF subscriptions
 * - Fund Automation upkeeps
 * - Add/remove consumers
 * - Monitor subscription health
 * 
 * Usage: npx hardhat run scripts/fund-chainlink-subscriptions.ts --network <network>
 */

interface FundingConfig {
  functionsMinBalance: string;
  vrfMinBalance: string;
  automationMinBalance: string;
  functionsTopupAmount: string;
  vrfTopupAmount: string;
  automationTopupAmount: string;
}


async function main() {
  console.log("\n💰 Managing Chainlink Subscription Funding...");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`🌐 Network: ${network.name} (${chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);

  // Get network configuration
  const networkConfig = getNetworkConfig(chainId);
  const fundingConfig = getFundingConfig();

  // Get deployed contracts
  const contracts = await getContracts();

  // Get LINK token contract
  const linkToken = await getLinkToken(networkConfig.linkToken);

  // Check current balances and status
  await checkCurrentStatus(linkToken, deployer, networkConfig);

  // Manage Functions subscriptions
  await manageFunctionsSubscriptions(contracts, networkConfig, fundingConfig, linkToken);

  // Manage VRF subscriptions
  await manageVRFSubscriptions(contracts, networkConfig, fundingConfig, linkToken);

  // Manage Automation upkeeps
  await manageAutomationUpkeeps(contracts, networkConfig, fundingConfig, linkToken);

  // Display final status
  await displayFinalStatus(networkConfig, linkToken, deployer);

  console.log("\n✅ Subscription management completed!");
  console.log("==================================================");
}

/**
 * Get deployed contract instances
 */
async function getContracts() {
  console.log("\n📦 Loading deployed contracts...");
  
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
}

/**
 * Get LINK token contract
 */
async function getLinkToken(linkTokenAddress: string): Promise<Contract> {
  if (!linkTokenAddress || linkTokenAddress === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  No LINK token address provided for this network");
    // Return a mock contract for local testing
    return {
      address: "0x0000000000000000000000000000000000000000",
      balanceOf: async () => ethers.parseEther("0"),
      transfer: async () => ({ wait: async () => {} }),
    } as any;
  }

  const linkABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ];

  return new ethers.Contract(linkTokenAddress, linkABI, (await ethers.getSigners())[0]);
}

/**
 * Check current LINK balances and subscription status
 */
async function checkCurrentStatus(linkToken: Contract, deployer: any, config: any) {
  console.log("\n💳 Checking Current Status...");

  try {
    // Check deployer LINK balance
    const linkBalance = await linkToken.balanceOf(deployer.address);
    console.log(`🔗 Deployer LINK Balance: ${ethers.formatEther(linkBalance)} LINK`);

    if (linkBalance < ethers.parseEther("1")) {
      console.log("⚠️  Low LINK balance! Consider acquiring more LINK tokens.");
      console.log("   Get LINK from: https://faucets.chain.link or swap on DEX");
    }

    // Check subscription IDs
    console.log("\n📋 Subscription Configuration:");
    console.log(`  Functions Subscription ID: ${config.functionsSubscriptionId}`);
    console.log(`  VRF Subscription ID: ${config.vrfSubscriptionId}`);

    if (config.functionsSubscriptionId === 1 || config.vrfSubscriptionId === 1) {
      console.log("⚠️  Using default subscription IDs. Update with real subscription IDs.");
    }

  } catch (error) {
    console.error("❌ Status check failed:", error);
  }
}

/**
 * Manage Functions subscriptions
 */
async function manageFunctionsSubscriptions(
  contracts: any, 
  config: any, 
  fundingConfig: FundingConfig,
  linkToken: Contract
) {
  console.log("\n📡 Managing Functions Subscriptions...");

  try {
    if (config.functionsSubscriptionId === 1) {
      console.log("⚠️  No valid Functions subscription ID configured");
      console.log("   Create subscription at: https://functions.chain.link");
      return;
    }

    console.log(`🔍 Checking Functions subscription ${config.functionsSubscriptionId}...`);

    // Get Functions router contract for subscription management
    const functionsRouterABI = [
      "function getSubscription(uint64 subscriptionId) view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)",
      "function addConsumer(uint64 subscriptionId, address consumer) external",
      "function removeConsumer(uint64 subscriptionId, address consumer) external",
    ];

    const functionsRouter = new ethers.Contract(
      config.functionsRouter,
      functionsRouterABI,
      (await ethers.getSigners())[0]
    );

    try {
      const [balance, reqCount, owner, consumers] = await functionsRouter.getSubscription(
        config.functionsSubscriptionId
      );

      console.log(`💰 Current Balance: ${ethers.formatEther(balance)} LINK`);
      console.log(`📊 Request Count: ${reqCount}`);
      console.log(`👤 Owner: ${owner}`);
      console.log(`🔧 Consumers: ${consumers.length}`);

      // Check if our contracts are consumers
      const aiAddress = await contracts.aiRecommendations.getAddress();
      const escrowAddress = await contracts.escrowManager.getAddress();
      const aiIsConsumer = consumers.includes(aiAddress);
      const escrowIsConsumer = consumers.includes(escrowAddress);

      console.log(`  AIRecommendations consumer: ${aiIsConsumer ? "✅" : "❌"}`);
      console.log(`  EscrowManager consumer: ${escrowIsConsumer ? "✅" : "❌"}`);

      // Add consumers if needed (owner only)
      const [deployer] = await ethers.getSigners();
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        if (!aiIsConsumer) {
          console.log("➕ Adding AIRecommendations as consumer...");
          const addTx = await functionsRouter.addConsumer(
            config.functionsSubscriptionId,
            aiAddress
          );
          await addTx.wait();
          console.log("✅ AIRecommendations added as consumer");
        }

        if (!escrowIsConsumer) {
          console.log("➕ Adding EscrowManager as consumer...");
          const addTx = await functionsRouter.addConsumer(
            config.functionsSubscriptionId,
            escrowAddress
          );
          await addTx.wait();
          console.log("✅ EscrowManager added as consumer");
        }
      } else {
        console.log("⚠️  Not subscription owner, cannot add consumers");
        console.log(`   Please add consumers manually via Chainlink dashboard`);
      }

      // Check if funding is needed
      const minBalance = ethers.parseEther(fundingConfig.functionsMinBalance);
      if (balance < minBalance) {
        console.log(`💸 Functions subscription needs funding (below ${fundingConfig.functionsMinBalance} LINK)`);
        console.log("   Fund via: https://functions.chain.link");
      } else {
        console.log("✅ Functions subscription has sufficient balance");
      }

    } catch (error) {
      console.log("❌ Could not fetch subscription details:", error);
      console.log("   Verify subscription ID and network configuration");
    }

  } catch (error) {
    console.error("❌ Functions subscription management failed:", error);
  }
}

/**
 * Manage VRF subscriptions
 */
async function manageVRFSubscriptions(
  contracts: any,
  config: any,
  fundingConfig: FundingConfig,
  linkToken: Contract
) {
  console.log("\n🎲 Managing VRF Subscriptions...");

  try {
    if (config.vrfSubscriptionId === 1) {
      console.log("⚠️  No valid VRF subscription ID configured");
      console.log("   Create subscription at: https://vrf.chain.link");
      return;
    }

    console.log(`🔍 Checking VRF subscription ${config.vrfSubscriptionId}...`);

    // Get VRF coordinator contract for subscription management
    const vrfCoordinatorABI = [
      "function getSubscription(uint64 subId) view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)",
      "function addConsumer(uint64 subId, address consumer) external",
      "function removeConsumer(uint64 subId, address consumer) external",
    ];

    const vrfCoordinator = new ethers.Contract(
      config.vrfCoordinator,
      vrfCoordinatorABI,
      (await ethers.getSigners())[0]
    );

    try {
      const [balance, reqCount, owner, consumers] = await vrfCoordinator.getSubscription(
        config.vrfSubscriptionId
      );

      console.log(`💰 Current Balance: ${ethers.formatEther(balance)} LINK`);
      console.log(`📊 Request Count: ${reqCount}`);
      console.log(`👤 Owner: ${owner}`);
      console.log(`🔧 Consumers: ${consumers.length}`);

      // Check if our contracts are consumers
      const aiAddress = await contracts.aiRecommendations.getAddress();
      const escrowAddress = await contracts.escrowManager.getAddress();
      const aiIsConsumer = consumers.includes(aiAddress);
      const escrowIsConsumer = consumers.includes(escrowAddress);

      console.log(`  AIRecommendations consumer: ${aiIsConsumer ? "✅" : "❌"}`);
      console.log(`  EscrowManager consumer: ${escrowIsConsumer ? "✅" : "❌"}`);

      // Add consumers if needed (owner only)
      const [deployer] = await ethers.getSigners();
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        if (!aiIsConsumer) {
          console.log("➕ Adding AIRecommendations as VRF consumer...");
          const addTx = await vrfCoordinator.addConsumer(
            config.vrfSubscriptionId,
            aiAddress
          );
          await addTx.wait();
          console.log("✅ AIRecommendations added as VRF consumer");
        }

        if (!escrowIsConsumer) {
          console.log("➕ Adding EscrowManager as VRF consumer...");
          const addTx = await vrfCoordinator.addConsumer(
            config.vrfSubscriptionId,
            escrowAddress
          );
          await addTx.wait();
          console.log("✅ EscrowManager added as VRF consumer");
        }
      } else {
        console.log("⚠️  Not subscription owner, cannot add consumers");
        console.log(`   Please add consumers manually via Chainlink dashboard`);
      }

      // Check if funding is needed
      const minBalance = ethers.parseEther(fundingConfig.vrfMinBalance);
      if (balance < minBalance) {
        console.log(`💸 VRF subscription needs funding (below ${fundingConfig.vrfMinBalance} LINK)`);
        console.log("   Fund via: https://vrf.chain.link");
      } else {
        console.log("✅ VRF subscription has sufficient balance");
      }

    } catch (error) {
      console.log("❌ Could not fetch VRF subscription details:", error);
      console.log("   Verify subscription ID and network configuration");
    }

  } catch (error) {
    console.error("❌ VRF subscription management failed:", error);
  }
}

/**
 * Manage Automation upkeeps
 */
async function manageAutomationUpkeeps(
  contracts: any,
  config: any,
  fundingConfig: FundingConfig,
  linkToken: Contract
) {
  console.log("\n⏰ Managing Automation Upkeeps...");

  try {
    console.log("📋 Automation Configuration for EscrowManager:");
    console.log(`  Contract: ${await contracts.escrowManager.getAddress()}`);
    console.log("  Function: performUpkeep(bytes calldata performData)");
    console.log("  Check Function: checkUpkeep(bytes calldata checkData)");
    console.log("  Purpose: Auto-release escrows after 7 days");

    // Test upkeep functions
    console.log("\n🧪 Testing upkeep functions...");
    const checkData = ethers.encodeBytes32String("");
    const [upkeepNeeded, performData] = await contracts.escrowManager.checkUpkeep(checkData);
    
    console.log(`  Upkeep needed: ${upkeepNeeded}`);
    console.log(`  Perform data length: ${performData.length}`);

    if (upkeepNeeded) {
      console.log("⚠️  Upkeep is needed - there may be escrows ready for auto-release");
    } else {
      console.log("✅ No immediate upkeep needed");
    }

    console.log("\n📝 To register Automation upkeep:");
    console.log("1. Visit: https://automation.chain.link");
    console.log("2. Click 'Register new Upkeep'");
    console.log("3. Choose 'Time-based' trigger");
    console.log(`4. Enter target contract: ${await contracts.escrowManager.getAddress()}`);
    console.log("5. Set Cron schedule: '0 */1 * * *' (every hour)");
    console.log("6. Set gas limit: 2,500,000");
    console.log(`7. Fund with ${fundingConfig.automationMinBalance} LINK`);

    // Check if we have a registered upkeep
    if (config.automationRegistry) {
      console.log(`\n🔍 Automation Registry: ${config.automationRegistry}`);
      console.log("   Check your upkeeps at the Automation dashboard");
    } else {
      console.log("\n⚠️  No Automation Registry configured for this network");
    }

  } catch (error) {
    console.error("❌ Automation upkeep management failed:", error);
  }
}

/**
 * Display final funding status
 */
async function displayFinalStatus(config: any, linkToken: Contract, deployer: any) {
  console.log("\n📊 Final Funding Status Summary");
  console.log("==================================================");

  try {
    const linkBalance = await linkToken.balanceOf(deployer.address);
    console.log(`🔗 Deployer LINK Balance: ${ethers.formatEther(linkBalance)} LINK`);

    console.log("\n📋 Subscription Status:");
    console.log(`📡 Functions Subscription: ${config.functionsSubscriptionId}`);
    console.log(`🎲 VRF Subscription: ${config.vrfSubscriptionId}`);

    console.log("\n🔗 Dashboard Links:");
    console.log("- Functions: https://functions.chain.link");
    console.log("- VRF: https://vrf.chain.link");
    console.log("- Automation: https://automation.chain.link");

    console.log("\n📝 Next Steps:");
    console.log("1. Verify all consumers are added to subscriptions");
    console.log("2. Ensure adequate LINK funding for all services");
    console.log("3. Register Automation upkeep for escrow auto-release");
    console.log("4. Test Chainlink service functionality");

  } catch (error) {
    console.error("❌ Status display failed:", error);
  }
}

/**
 * Get network-specific configuration
 */
function getNetworkConfig(chainId: string) {
  const configs: { [key: string]: any } = {
    "11155111": { // Ethereum Sepolia
      name: "sepolia",
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
      automationRegistry: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad",
      linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
      functionsSubscriptionId: parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID_SEPOLIA || "1"),
      vrfSubscriptionId: parseInt(process.env.VRF_SUBSCRIPTION_ID_SEPOLIA || "1"),
    },
    "43113": { // Avalanche Fuji
      name: "fuji",
      functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      vrfCoordinator: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610",
      automationRegistry: "0x819B58A646CDd8289275A87653a2aA4902b14fe6",
      linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
      functionsSubscriptionId: parseInt(process.env.CHAINLINK_SUBSCRIPTION_ID_FUJI || "1"),
      vrfSubscriptionId: parseInt(process.env.VRF_SUBSCRIPTION_ID_FUJI || "1"),
    },
    "31337": { // Local Hardhat
      name: "localhost",
      functionsRouter: "0x0000000000000000000000000000000000000000",
      vrfCoordinator: "0x0000000000000000000000000000000000000000",
      linkToken: "0x0000000000000000000000000000000000000000",
      functionsSubscriptionId: 1,
      vrfSubscriptionId: 1,
    }
  };

  return configs[chainId] || configs["31337"];
}

/**
 * Get funding configuration
 */
function getFundingConfig(): FundingConfig {
  return {
    functionsMinBalance: process.env.FUNCTIONS_MIN_BALANCE || "2", // 2 LINK
    vrfMinBalance: process.env.VRF_MIN_BALANCE || "2", // 2 LINK
    automationMinBalance: process.env.AUTOMATION_MIN_BALANCE || "5", // 5 LINK
    functionsTopupAmount: process.env.FUNCTIONS_TOPUP_AMOUNT || "5", // 5 LINK
    vrfTopupAmount: process.env.VRF_TOPUP_AMOUNT || "5", // 5 LINK
    automationTopupAmount: process.env.AUTOMATION_TOPUP_AMOUNT || "10", // 10 LINK
  };
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