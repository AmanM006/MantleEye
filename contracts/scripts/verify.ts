import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeployedAddresses {
  network: string;
  chainId: number;
  deployedAt: string;
  deployer: string;
  contracts: {
    TradeLogger: string;
    SignalAnchor: string;
    AgentRegistry: string;
  };
}

async function verifyContract(name: string, address: string) {
  console.log(`Verifying ${name} at ${address}...`);
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log(`${name} verified successfully!`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`${name} is already verified.`);
    } else {
      console.error(`Failed to verify ${name}:`, error.message);
    }
  }
}

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");

  if (!fs.existsSync(addressesPath)) {
    console.error(
      "deployed-addresses.json not found. Please run the deploy script first."
    );
    process.exit(1);
  }

  const addresses: DeployedAddresses = JSON.parse(
    fs.readFileSync(addressesPath, "utf-8")
  );

  console.log("Verifying MANTLEYE contracts on network:", addresses.network);
  console.log("Chain ID:", addresses.chainId);
  console.log("---");

  // Verify all contracts
  await verifyContract("TradeLogger", addresses.contracts.TradeLogger);
  await verifyContract("SignalAnchor", addresses.contracts.SignalAnchor);
  await verifyContract("AgentRegistry", addresses.contracts.AgentRegistry);

  console.log("---");
  console.log("Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
