import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MANTLEYE contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "MNT"
  );
  console.log("---");

  // Deploy TradeLogger
  console.log("Deploying TradeLogger...");
  const TradeLogger = await ethers.getContractFactory("TradeLogger");
  const tradeLogger = await TradeLogger.deploy();
  await tradeLogger.waitForDeployment();
  const tradeLoggerAddress = await tradeLogger.getAddress();
  console.log("TradeLogger deployed to:", tradeLoggerAddress);

  // Deploy SignalAnchor
  console.log("Deploying SignalAnchor...");
  const SignalAnchor = await ethers.getContractFactory("SignalAnchor");
  const signalAnchor = await SignalAnchor.deploy();
  await signalAnchor.waitForDeployment();
  const signalAnchorAddress = await signalAnchor.getAddress();
  console.log("SignalAnchor deployed to:", signalAnchorAddress);

  console.log("---");
  console.log("All contracts deployed successfully!");

  // Save deployed addresses to JSON
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TradeLogger: tradeLoggerAddress,
      SignalAnchor: signalAnchorAddress,
    },
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("Deployed addresses saved to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
