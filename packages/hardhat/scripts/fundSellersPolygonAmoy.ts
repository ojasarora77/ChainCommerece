import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("💰 Funding seller wallets on Polygon Amoy...");
  console.log("📍 Network:", hre.network.name);

  // Get the main account (should have funds)
  const [mainAccount] = await ethers.getSigners();
  console.log("🏦 Main account:", mainAccount.address);
  
  const mainBalance = await ethers.provider.getBalance(mainAccount.address);
  console.log("💰 Main account balance:", ethers.formatEther(mainBalance), "MATIC");

  // Seller wallet addresses to fund (these correspond to the private keys in addSellersPolygonAmoy.ts)
  const sellerAddresses = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Seller 1 - matches first private key
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Seller 2 - matches second private key
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Seller 3 - matches third private key
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Seller 4 - matches fourth private key
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Seller 5 - matches fifth private key
  ];

  const fundingAmount = ethers.parseEther("0.2"); // 0.2 MATIC per seller (increased for higher gas costs)

  console.log(`\n🚀 Funding ${sellerAddresses.length} seller wallets with ${ethers.formatEther(fundingAmount)} MATIC each...`);

  for (let i = 0; i < sellerAddresses.length; i++) {
    const sellerAddress = sellerAddresses[i];
    console.log(`\n👤 Funding Seller ${i + 1}: ${sellerAddress}`);
    
    // Check current balance
    const currentBalance = await ethers.provider.getBalance(sellerAddress);
    console.log(`   Current balance: ${ethers.formatEther(currentBalance)} MATIC`);
    
    if (currentBalance < ethers.parseEther("0.1")) {
      try {
        console.log(`   💸 Sending ${ethers.formatEther(fundingAmount)} MATIC...`);
        
        const tx = await mainAccount.sendTransaction({
          to: sellerAddress,
          value: fundingAmount
        });
        
        await tx.wait();
        
        const newBalance = await ethers.provider.getBalance(sellerAddress);
        console.log(`   ✅ Funded! New balance: ${ethers.formatEther(newBalance)} MATIC`);
        console.log(`   📝 Transaction hash: ${tx.hash}`);
        
      } catch (error) {
        console.error(`   ❌ Error funding seller ${i + 1}:`, (error as Error).message);
      }
    } else {
      console.log(`   ✅ Seller already has sufficient balance`);
    }
    
    // Small delay to avoid nonce issues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n🎉 Seller wallet funding completed!");
  console.log("\n📋 Final Balances:");
  
  for (let i = 0; i < sellerAddresses.length; i++) {
    const balance = await ethers.provider.getBalance(sellerAddresses[i]);
    console.log(`   Seller ${i + 1}: ${ethers.formatEther(balance)} MATIC`);
  }
  
  const finalMainBalance = await ethers.provider.getBalance(mainAccount.address);
  console.log(`\n🏦 Main account final balance: ${ethers.formatEther(finalMainBalance)} MATIC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
