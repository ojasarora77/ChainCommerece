import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🔍 Checking contract deployment on Base Sepolia...");
  console.log("📍 Network:", hre.network.name);

  const aiMarketplaceAddress = "0xD5E112003F17B536b505e710083B25cf4e9C8c01";
  const productRegistryAddress = "0x8aF3507ccEbB20579196b11e1Ad11FCAb6bae760";
  
  console.log("\n🔍 Checking AIMarketplace:");
  const aiCode = await ethers.provider.getCode(aiMarketplaceAddress);
  console.log("Code length:", aiCode.length);
  console.log("Is deployed:", aiCode !== "0x");
  
  console.log("\n🔍 Checking ProductRegistry:");
  const prCode = await ethers.provider.getCode(productRegistryAddress);
  console.log("Code length:", prCode.length);
  console.log("Is deployed:", prCode !== "0x");
  
}

main().catch(console.error);