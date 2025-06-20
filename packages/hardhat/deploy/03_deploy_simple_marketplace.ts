import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys SimpleMarketplace contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySimpleMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get the deployed ProductRegistry address
  const productRegistry = await hre.deployments.get("ProductRegistry");
  
  console.log("📦 Deploying SimpleMarketplace...");
  console.log("🔗 ProductRegistry address:", productRegistry.address);
  console.log("👤 Fee recipient (deployer):", deployer);

  await deploy("SimpleMarketplace", {
    from: deployer,
    // Constructor arguments: (productRegistry, feeRecipient)
    args: [productRegistry.address, deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: process.env.HARDHAT_NETWORK === "localhost",
  });

  // Get the deployed contract to interact with it after deploying.
  const simpleMarketplace = await hre.ethers.getContract<Contract>("SimpleMarketplace", deployer);
  console.log("✅ SimpleMarketplace deployed:", await simpleMarketplace.getAddress());

  // Connect ProductRegistry to the marketplace
  const productRegistryContract = await hre.ethers.getContract<Contract>("ProductRegistry", deployer);
  console.log("🔗 Connecting ProductRegistry to SimpleMarketplace...");
  
  try {
    const tx = await productRegistryContract.setMarketplace(await simpleMarketplace.getAddress());
    await tx.wait();
    console.log("✅ ProductRegistry connected to SimpleMarketplace");
  } catch (error) {
    console.log("⚠️  Error connecting contracts:", error);
  }

  console.log("🎉 SimpleMarketplace deployment completed!");
  console.log("📋 Summary:");
  console.log(`   - SimpleMarketplace: ${await simpleMarketplace.getAddress()}`);
  console.log(`   - ProductRegistry: ${productRegistry.address}`);
  console.log(`   - Platform fee: 2.5%`);
  console.log(`   - Fee recipient: ${deployer}`);
};

export default deploySimpleMarketplace;

// This script can be run directly with `npx hardhat deploy --tags SimpleMarketplace`
deploySimpleMarketplace.tags = ["SimpleMarketplace"];
