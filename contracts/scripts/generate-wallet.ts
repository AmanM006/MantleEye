import { ethers } from "hardhat";

async function main() {
  const wallet = ethers.Wallet.createRandom();
  console.log("GENERATED_PRIVATE_KEY=" + wallet.privateKey);
  console.log("GENERATED_ADDRESS=" + wallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
