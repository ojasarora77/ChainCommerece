import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🔍 Checking accounts and their balances...");
  console.log("📍 Network:", hre.network.name);

  // Your deployed contract addresses on Fuji
  const PRODUCT_REGISTRY_ADDRESS = "0x328118233e846e9c629480F4DE1444cbE7b7189e";

  // Get the contract instance
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(PRODUCT_REGISTRY_ADDRESS) as any;

  // Get all available signers
  const signers = await ethers.getSigners();
  console.log(`\n📋 Available accounts (${signers.length}):`);
  
  for (let i = 0; i < Math.min(signers.length, 5); i++) {
    const signer = signers[i];
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`   Account ${i}: ${signer.address} - Balance: ${ethers.formatEther(balance)} AVAX`);
  }

  // Check who owns the duplicate products
  try {
    console.log("\n🔍 Checking product ownership...");
    const duplicateIds = [6, 7, 8, 9, 10];
    
    for (const productId of duplicateIds) {
      const product = await productRegistry.products(BigInt(productId));
      console.log(`Product ${productId}: ${product.name} - Owner: ${product.seller}`);
    }

    // Check the original products too
    console.log("\n🔍 Checking original products ownership...");
    const originalIds = [1, 2, 3, 4, 5];
    
    for (const productId of originalIds) {
      const product = await productRegistry.products(BigInt(productId));
      console.log(`Product ${productId}: ${product.name} - Owner: ${product.seller}`);
    }

  } catch (error) {
    console.error("Error checking product ownership:", (error as Error).message);
  }

  console.log("\n📊 Summary:");
  console.log("- Products 1-5 are owned by: 0x822c480a0D437b6e6276D0AF69DBe7B19B65B599");
  console.log("- Products 6-10 are owned by: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");  
  console.log("- The hardhat deployer account has no AVAX balance");
  console.log("- Need to use your real account (0x822c48...) to manage the marketplace");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
