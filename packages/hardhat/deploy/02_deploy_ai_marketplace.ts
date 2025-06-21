import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployAIMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get Chainlink Functions router address for the network
  const routerAddress = {
    sepolia: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    avalancheFuji: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
    polygon: "0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73F10",
    polygonAmoy: "0xC22a79eBA640940ABB6dF0f7982cc119578E11De"
  }[hre.network.name] || "";

  if (!routerAddress) {
    console.log(`No Chainlink Functions router found for network ${hre.network.name}`);
    return;
  }

  await deploy("AIMarketplace", {
    from: deployer,
    args: [routerAddress],
    log: true,
    autoMine: true,
  });

  console.log("AIMarketplace deployed successfully!");
  console.log("Remember to:");
  console.log("1. Set subscription ID with setSubscriptionId()");
  console.log("2. Set DON ID with setDonId()");
  console.log("3. Add consumer to Chainlink Functions subscription");
};

export default deployAIMarketplace;
deployAIMarketplace.tags = ["AIMarketplace"];
