//dont execute if not needed, the cofig is already set up and correct

const hre = require("hardhat");

async function main() {
    console.log("🔧 Updating Chainlink Functions configuration...");
    
    // Your contract address on Avalanche Fuji
    const AI_RECOMMENDATIONS_ADDRESS = "0xe97babe1401f29921d421e5294c017d63ff12b36";
    
    // Get contract
    const aiRecommendations = await hre.ethers.getContractAt("AIRecommendations", AI_RECOMMENDATIONS_ADDRESS);
    
    console.log("📍 Contract:", AI_RECOMMENDATIONS_ADDRESS);
    console.log("🌐 Network:", hre.network.name);
    
    // Check current config
    console.log("\n📋 Current Configuration:");
    const currentSubId = await aiRecommendations.subscriptionId();
    const currentDonId = await aiRecommendations.donID();
    console.log("   Subscription ID:", currentSubId.toString());
    console.log("   DON ID:", currentDonId);
    
    // Avalanche Fuji configuration
    const AVALANCHE_FUJI_SUBSCRIPTION_ID = 15563; // Your funded subscription
    const AVALANCHE_FUJI_DON_ID = "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000"; // Current one is correct for Fuji
    
    console.log("\n🔄 Updating to:");
    console.log("   New Subscription ID:", AVALANCHE_FUJI_SUBSCRIPTION_ID);
    console.log("   DON ID (keeping current):", AVALANCHE_FUJI_DON_ID);
    
    try {
        // Get current source code to preserve it
        console.log("\n📄 Getting current source code...");
        const currentSourceCode = await aiRecommendations.sourceCode();
        console.log("   Source code length:", currentSourceCode.length);
        
        // Update configuration using initializeFunctions
        console.log("\n📤 Updating Functions configuration...");
        const updateTx = await aiRecommendations.initializeFunctions(
            currentSourceCode, // Keep existing source code
            AVALANCHE_FUJI_SUBSCRIPTION_ID, // New subscription ID
            300000, // Keep current gas limit
            AVALANCHE_FUJI_DON_ID // Keep current DON ID for Fuji
        );
        await updateTx.wait();
        console.log("✅ Configuration updated!");
        
        // Verify the update
        const newSubId = await aiRecommendations.subscriptionId();
        console.log("✅ Verified new subscription ID:", newSubId.toString());
        
        console.log("\n🎉 Configuration updated successfully!");
        console.log("📋 Next steps:");
        console.log("1. Make sure subscription 15563 has your contract as a consumer");
        console.log("2. Add contract address to subscription: 0xe97babe1401f29921d421e5294c017d63ff12b36");
        console.log("3. Test AI recommendations in your frontend");
        console.log("4. Monitor LINK balance usage");
        
    } catch (error) {
        console.log("❌ Update failed:", error.message);
        
        if (error.message.includes("Ownable")) {
            console.log("💡 You need to run this with the contract owner account");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
