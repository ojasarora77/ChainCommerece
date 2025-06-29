import { ethers } from "hardhat";
import { EscrowManager } from "../typechain-types";

async function main() {
  console.log("Configuring CCIP supported chains...");

  // Get the deployed EscrowManager contract
  const escrowManagerAddress = "0x959591Bab069599cAbb2A72AA371503ba2d042FF"; // Update with actual address
  const escrowManager = await ethers.getContractAt("EscrowManager", escrowManagerAddress) as EscrowManager;

  // CCIP Chain Selectors for testnet
  const ETHEREUM_SEPOLIA_SELECTOR = 16015286601757825753n;
  const AVALANCHE_FUJI_SELECTOR = 14767482510784806043n;
  const BASE_SEPOLIA_SELECTOR = 10344971235874465080n;

  // Configure supported destination chains
  const configurations = [
    {
      chainSelector: ETHEREUM_SEPOLIA_SELECTOR,
      escrowManagerAddress: "0x0000000000000000000000000000000000000000", // Update when deployed on Ethereum
      name: "Ethereum Sepolia"
    },
    {
      chainSelector: BASE_SEPOLIA_SELECTOR,
      escrowManagerAddress: "0x0000000000000000000000000000000000000000", // Update when deployed on Base
      name: "Base Sepolia"
    }
  ];

  for (const config of configurations) {
    try {
      console.log(`Configuring ${config.name} (${config.chainSelector})...`);
      
      // Check if we have a valid escrow manager address for this chain
      if (config.escrowManagerAddress === "0x0000000000000000000000000000000000000000") {
        console.log(`⚠️  Skipping ${config.name} - No EscrowManager deployed yet`);
        continue;
      }

      const tx = await escrowManager.setSupportedDestinationChain(
        config.chainSelector,
        true,
        config.escrowManagerAddress
      );
      
      await tx.wait();
      console.log(`✅ ${config.name} configured successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to configure ${config.name}:`, error);
    }
  }

  console.log("CCIP chain configuration completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});