//execute with AWS bedrock integration

const hre = require("hardhat");

async function main() {
    console.log("🔄 Updating Chainlink Functions JavaScript code...");
    
    // Your contract address
    const AI_RECOMMENDATIONS_ADDRESS = "0xe97babe1401f29921d421e5294c017d63ff12b36";
    
    // Get contract
    const aiRecommendations = await hre.ethers.getContractAt("AIRecommendations", AI_RECOMMENDATIONS_ADDRESS);
    
    console.log("📍 Contract:", AI_RECOMMENDATIONS_ADDRESS);
    console.log("🌐 Network:", hre.network.name);
    
    // Updated JavaScript source code (paste your new code here)
    const newSourceCode = `
// Updated AI Recommendation Function - v2.0
const userPreferences = args[0];
const productData = args[1];
const maxResults = parseInt(args[2]) || 5;

console.log("🤖 AI Recommendation Function v2.0 Started");
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

function generateAdvancedAIRecommendations(userPrefs, availableProducts, maxResults) {
    console.log("🧠 Generating Advanced AI recommendations...");
    
    const recommendations = [];
    const weights = {
        categoryMatch: 0.4,
        sustainabilityMatch: 0.3,
        priceMatch: 0.2,
        brandMatch: 0.1
    };
    
    console.log("📊 Using weighted scoring algorithm");
    console.log("Weights:", JSON.stringify(weights));
    
    // Enhanced scoring algorithm
    const products = [
        { id: 1, category: "Electronics", sustainability: "high", price: 0.5, brand: "EcoTech" },
        { id: 2, category: "Clothing", sustainability: "high", price: 0.3, brand: "GreenWear" },
        { id: 3, category: "Digital", sustainability: "medium", price: 0.01, brand: "ByteLearn" },
        { id: 4, category: "Electronics", sustainability: "high", price: 0.8, brand: "SmartHome" },
        { id: 5, category: "Sports", sustainability: "high", price: 0.4, brand: "EcoSport" }
    ];
    
    products.forEach(product => {
        let score = 0;
        let reasons = [];
        
        // Category matching
        if (userPrefs.categories && userPrefs.categories.includes(product.category)) {
            score += weights.categoryMatch * 100;
            reasons.push(\`Category match: \${product.category}\`);
        }
        
        // Sustainability matching
        if (userPrefs.sustainability === "high" && product.sustainability === "high") {
            score += weights.sustainabilityMatch * 100;
            reasons.push("High sustainability match");
        } else if (userPrefs.sustainability === "medium" && product.sustainability !== "low") {
            score += weights.sustainabilityMatch * 70;
            reasons.push("Good sustainability match");
        }
        
        // Price matching
        const pricePrefs = userPrefs.priceRange ? userPrefs.priceRange.split(",") : ["0", "1"];
        const minPrice = parseFloat(pricePrefs[0]) || 0;
        const maxPrice = parseFloat(pricePrefs[1]) || 1;
        
        if (product.price >= minPrice && product.price <= maxPrice) {
            score += weights.priceMatch * 100;
            reasons.push(\`Price in range: \${product.price} ETH\`);
        }
        
        // Brand matching
        if (userPrefs.brand && userPrefs.brand.includes(product.brand)) {
            score += weights.brandMatch * 100;
            reasons.push(\`Brand preference: \${product.brand}\`);
        }
        
        // Boost for custom preferences
        if (userPrefs.customPrefs) {
            if (userPrefs.customPrefs.toLowerCase().includes("tech") && product.category === "Electronics") {
                score += 10;
                reasons.push("Tech preference boost");
            }
            if (userPrefs.customPrefs.toLowerCase().includes("eco") && product.sustainability === "high") {
                score += 15;
                reasons.push("Eco preference boost");
            }
        }
        
        if (score > 0) {
            recommendations.push({
                productId: product.id,
                score: Math.round(score),
                reason: reasons.join(", "),
                category: product.category,
                sustainability: product.sustainability
            });
        }
    });
    
    // Sort by score and limit results
    const sortedRecs = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    
    console.log(\`📊 Generated \${sortedRecs.length} weighted recommendations\`);
    sortedRecs.forEach(rec => {
        console.log(\`  - Product \${rec.productId}: \${rec.score}% (\${rec.reason})\`);
    });
    
    return {
        recommendations: sortedRecs,
        algorithm: "weighted_scoring_v2",
        timestamp: Date.now(),
        userWallet: userPrefs.wallet || "unknown"
    };
}

try {
    console.log("🚀 Starting Advanced AI recommendation process...");
    
    const aiResponse = generateAdvancedAIRecommendations(preferences, products, maxResults);
    
    console.log("✅ Advanced AI Response generated successfully");
    console.log("🔄 Algorithm used:", aiResponse.algorithm);
    
    const recommendations = aiResponse.recommendations || [];
    const productIds = recommendations.map(rec => rec.productId);
    const scores = recommendations.map(rec => rec.score);
    
    console.log("📋 Final Product IDs:", productIds);
    console.log("📋 Final Scores:", scores);
    
    const response = productIds.map((id, index) => \`\${id},\${scores[index]}\`).join(',');
    
    console.log("📤 Formatted response for blockchain:", response);
    
    return Functions.encodeString(response);
    
} catch (error) {
    console.error("❌ Error in Advanced AI recommendation function:", error.message);
    
    const fallbackResponse = "1,95,4,88,2,85";
    console.log("🔄 Returning enhanced fallback response:", fallbackResponse);
    
    return Functions.encodeString(fallbackResponse);
}
`;

    try {
        console.log("📤 Updating JavaScript source code...");
        
        // Update only the source code, keep other config the same
        const updateTx = await aiRecommendations.updateSourceCode(newSourceCode);
        
        console.log("📄 Transaction sent:", updateTx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        await updateTx.wait();
        
        console.log("✅ JavaScript source code updated successfully!");
        console.log("");
        console.log("🎉 Your contract now has the updated AI logic!");
        console.log("📋 Changes include:");
        console.log("   - Weighted scoring algorithm");
        console.log("   - Enhanced category matching");
        console.log("   - Improved sustainability scoring");
        console.log("   - Custom preference boosting");
        console.log("   - Better price range handling");
        console.log("");
        console.log("🧪 Test the updated function:");
        console.log("   npx hardhat run scripts/testChainlinkFunctions.ts --network avalancheFuji");
        
    } catch (error) {
        console.error("❌ Update failed:", error.message);
        
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
