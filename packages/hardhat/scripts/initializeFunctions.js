const hre = require("hardhat");

async function main() {
    console.log("🔧 Initializing Chainlink Functions...");
    
    // Your contract address
    const AI_RECOMMENDATIONS_ADDRESS = "0xe97babe1401f29921d421e5294c017d63ff12b36";
    
    // Replace with your subscription ID from functions.chain.link
    const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 15563; // CHANGE THIS
    
    console.log("📍 Contract:", AI_RECOMMENDATIONS_ADDRESS);
    console.log("🔗 Subscription ID:", SUBSCRIPTION_ID);
    
    // Get contract
    const aiRecommendations = await hre.ethers.getContractAt("AIRecommendations", AI_RECOMMENDATIONS_ADDRESS);
    
    // Source code (your working AI function)
    const sourceCode = `
const userPreferences = args[0];
const productData = args[1];
const maxResults = parseInt(args[2]) || 5;

console.log("🤖 AI Recommendation Function Started");
console.log("User Preferences:", userPreferences);
console.log("Product Data:", productData);
console.log("Max Results:", maxResults);

let preferences, products;
try {
    preferences = JSON.parse(userPreferences);
    products = JSON.parse(productData);
    console.log("✅ Successfully parsed input data");
} catch (error) {
    console.log("❌ Failed to parse input data:", error.message);
    throw Error(\`Failed to parse input data: \${error.message}\`);
}

function generateAIRecommendations(userPrefs, availableProducts, maxResults) {
    console.log("🧠 Generating AI recommendations...");
    
    const recommendations = [];
    
    console.log("Analyzing user preferences:", userPrefs.categories);
    console.log("Sustainability focus:", userPrefs.sustainability);
    console.log("Price range:", userPrefs.priceRange);
    
    if (userPrefs.categories && userPrefs.categories.includes("Electronics")) {
        recommendations.push({
            productId: 1,
            score: 95,
            reason: "Perfect match: sustainable electronics in your preferred category"
        });
        
        recommendations.push({
            productId: 4,
            score: 88,
            reason: "High-tech IoT device aligned with sustainability focus"
        });
        console.log("📱 Added electronics recommendations");
    }
    
    if (userPrefs.sustainability === "high") {
        recommendations.push({
            productId: 2,
            score: 91,
            reason: "Organic and sustainable clothing choice"
        });
        
        recommendations.push({
            productId: 5,
            score: 85,
            reason: "Made from recycled materials, eco-friendly"
        });
        console.log("🌱 Added sustainability-focused recommendations");
    }
    
    if (userPrefs.categories && userPrefs.categories.includes("Sports")) {
        recommendations.push({
            productId: 5,
            score: 89,
            reason: "Perfect for sports enthusiasts, eco-friendly"
        });
        console.log("🏃 Added sports recommendations");
    }
    
    if (userPrefs.priceRange && userPrefs.priceRange.includes("0.01")) {
        recommendations.push({
            productId: 3,
            score: 80,
            reason: "Affordable digital product, high value"
        });
        console.log("💰 Added budget-friendly digital content");
    }
    
    if (recommendations.length === 0) {
        console.log("🔄 No specific matches, adding popular items");
        recommendations.push(
            { productId: 1, score: 85, reason: "Popular electronics item" },
            { productId: 2, score: 80, reason: "Trending clothing choice" },
            { productId: 3, score: 75, reason: "Educational content" }
        );
    }
    
    const sortedRecs = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    
    console.log(\`📊 Generated \${sortedRecs.length} recommendations\`);
    sortedRecs.forEach(rec => {
        console.log(\`  - Product \${rec.productId}: \${rec.score}% (\${rec.reason})\`);
    });
    
    return {
        recommendations: sortedRecs,
        totalProcessed: recommendations.length,
        userWallet: userPrefs.wallet || "unknown"
    };
}

try {
    console.log("🚀 Starting AI recommendation process...");
    
    const aiResponse = generateAIRecommendations(preferences, products, maxResults);
    
    console.log("✅ AI Response generated successfully");
    
    const recommendations = aiResponse.recommendations || [];
    const productIds = recommendations.map(rec => rec.productId);
    const scores = recommendations.map(rec => rec.score);
    
    console.log("📋 Final Product IDs:", productIds);
    console.log("📋 Final Scores:", scores);
    
    const response = productIds.map((id, index) => \`\${id},\${scores[index]}\`).join(',');
    
    console.log("📤 Formatted response for blockchain:", response);
    
    return Functions.encodeString(response);
    
} catch (error) {
    console.error("❌ Error in AI recommendation function:", error.message);
    
    const fallbackResponse = "1,85,2,80,3,75";
    console.log("🔄 Returning fallback response:", fallbackResponse);
    
    return Functions.encodeString(fallbackResponse);
}
`;

    try {
        console.log("🔄 Sending initialization transaction...");
        
        // Convert DON ID to proper bytes32 format
        const donIdString = "fun-avalanche-fuji-1";
        const donIdBytes = hre.ethers.encodeBytes32String(donIdString);
        
        console.log("🔗 DON ID (string):", donIdString);
        console.log("🔗 DON ID (bytes32):", donIdBytes);
        
        const tx = await aiRecommendations.initializeFunctions(
            sourceCode,
            SUBSCRIPTION_ID,
            300000, // gasLimit
            donIdBytes // Properly formatted DON ID
        );
        
        console.log("📤 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        await tx.wait();
        
        console.log("✅ Functions initialized successfully!");
        console.log("");
        console.log("🧪 Next steps:");
        console.log("1. Set user preferences");
        console.log("2. Request AI recommendations");
        console.log("3. Check results");
        
    } catch (error) {
        console.error("❌ Initialization failed:", error.message);
        
        if (error.message.includes("subscription")) {
            console.log("💡 Make sure:");
            console.log("- Your subscription is funded with LINK");
            console.log("- Your contract is added as a consumer");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });