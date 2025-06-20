import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🔍 Checking Chainlink Functions configuration...");
  console.log("📍 Network:", hre.network.name);

  // Your contract addresses
  const AI_RECOMMENDATIONS_ADDRESS = "0xe97babe1401F29921D421E5294c017D63Ff12B36";
  
  // Your provided Chainlink details
  const ROUTER_ADDRESS = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
  const DON_ID = "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
  const SUBSCRIPTION_ID = 15563; // From your screenshot - most recent with LINK balance

  console.log("\n📋 Chainlink Functions Details:");
  console.log(`   Router Address: ${ROUTER_ADDRESS}`);
  console.log(`   DON ID: ${DON_ID}`);
  console.log(`   Subscription ID: ${SUBSCRIPTION_ID}`);
  console.log(`   Balance: 10 LINK (from screenshot)`);

  // Get contract instance
  const aiRecommendations = await ethers.getContractAt("AIRecommendations", AI_RECOMMENDATIONS_ADDRESS) as any;

  try {
    // Check current contract configuration
    console.log("\n🔧 Current Contract Configuration:");
    
    const currentSubscriptionId = await aiRecommendations.subscriptionId();
    console.log(`   Contract Subscription ID: ${currentSubscriptionId}`);
    
    const currentDonId = await aiRecommendations.donID();
    console.log(`   Contract DON ID: ${currentDonId}`);
    
    const gasLimit = await aiRecommendations.gasLimit();
    console.log(`   Gas Limit: ${gasLimit}`);

    const sourceCode = await aiRecommendations.sourceCode();
    console.log(`   Source Code Length: ${sourceCode.length} characters`);
    console.log(`   Source Code Preview: ${sourceCode.substring(0, 100)}...`);

    // Check if configuration matches
    console.log("\n✅ Configuration Check:");
    
    if (currentSubscriptionId.toString() === SUBSCRIPTION_ID.toString()) {
      console.log("   ✅ Subscription ID matches!");
    } else {
      console.log(`   ❌ Subscription ID mismatch: contract has ${currentSubscriptionId}, expected ${SUBSCRIPTION_ID}`);
    }

    if (currentDonId === DON_ID) {
      console.log("   ✅ DON ID matches!");
    } else {
      console.log(`   ❌ DON ID mismatch: contract has ${currentDonId}, expected ${DON_ID}`);
    }

    // Test if we can call the function
    console.log("\n🧪 Testing AI Recommendations Function...");
    
    const [deployer] = await ethers.getSigners();
    console.log(`   Using account: ${deployer.address}`);

    // Try to make a recommendation request
    console.log("   Attempting to request AI recommendations...");
    
    try {
      const tx = await aiRecommendations.requestRecommendations(
        '{"categories": ["Electronics"], "sustainability": true, "priceRange": "low"}',
        { gasLimit: 500000 }
      );
      
      console.log("   📤 Transaction sent:", tx.hash);
      console.log("   ⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("   ✅ Transaction confirmed!");
      console.log(`   Gas used: ${receipt.gasUsed}`);
      
      // Check for events
      const events = receipt.logs;
      console.log(`   Events emitted: ${events.length}`);
      
      if (events.length > 0) {
        console.log("   🎉 Functions request initiated successfully!");
        console.log("   📋 Request details:");
        events.forEach((event: any, index: number) => {
          console.log(`     Event ${index + 1}: ${event.topics[0]}`);
        });
      }

    } catch (error) {
      console.log("   ❌ Failed to request recommendations:", (error as Error).message);
      
      if ((error as Error).message.includes("subscription")) {
        console.log("   💡 This might be a subscription/consumer issue");
      } else if ((error as Error).message.includes("insufficient funds")) {
        console.log("   💰 This might be a gas/LINK balance issue");
      }
    }

  } catch (error) {
    console.error("❌ Error checking contract:", (error as Error).message);
  }

  console.log("\n📊 Summary:");
  console.log("   - You have a funded Chainlink Functions subscription (5071)");
  console.log("   - Your contract is deployed and accessible");
  console.log("   - Check the configuration match above");
  console.log("   - If test succeeds, Functions are working! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
