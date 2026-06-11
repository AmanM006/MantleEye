/**
 * MANTLEYE — Seed On-Chain Data v3
 * Uses full Hardhat artifacts to anchor signals and log trades.
 * Run: npx hardhat run scripts/seed-on-chain.ts --network mantleSepolia
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`\n🔑 Signer: ${signer.address}`);
  console.log(`⛓  Network: Mantle Sepolia (5003)\n`);

  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Deployed addresses not found. Please run deploy.ts first.");
    process.exit(1);
  }

  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const addresses = deployed.contracts;

  console.log("Loading artifacts...");
  const SignalAnchorArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/SignalAnchor.sol/SignalAnchor.json"), "utf8")
  );
  const TradeLoggerArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/TradeLogger.sol/TradeLogger.json"), "utf8")
  );

  const signalAnchor = new ethers.Contract(addresses.SignalAnchor, SignalAnchorArtifact.abi, signer);
  const tradeLogger = new ethers.Contract(addresses.TradeLogger, TradeLoggerArtifact.abi, signer);

  const results: Record<string, string> = {};

  // ─── Step 1: Commit and Reveal Signals ──────────────────────────────────
  console.log("📡 Committing and Revealing signals on SignalAnchor...\n");

  const mockSignals = [
    {
      reasoning: "mETH/cmETH depeg deviation detected at 0.58%. Executing arbitrage rebalance.",
      tradeIntent: "SWAP mETH FOR cmETH",
      nonce: 12345n,
      signalType: 0, // depeg
      confidence: 91n
    },
    {
      reasoning: "Merchant Moe concentrated pool large withdrawal detected. Whale exit from USDC/MNT.",
      tradeIntent: "SHORT HEDGE MNTUSDT BYBIT",
      nonce: 67890n,
      signalType: 1, // whaleExit
      confidence: 85n
    },
    {
      reasoning: "USDY Ondo RWA depeg deviation detected at 0.35%. Accumulating USDY on-chain.",
      tradeIntent: "BUY USDY ON MERCHANT MOE",
      nonce: 55555n,
      signalType: 0, // depeg
      confidence: 88n
    }
  ];

  for (let i = 0; i < mockSignals.length; i++) {
    const sig = mockSignals[i];
    
    // Calculate commit hash: keccak256(abi.encodePacked(reasoning, tradeIntent, nonce, signalType, confidence))
    const commitHash = ethers.solidityPackedKeccak256(
      ['string', 'string', 'uint256', 'uint8', 'uint256'],
      [sig.reasoning, sig.tradeIntent, sig.nonce, sig.signalType, sig.confidence]
    );

    console.log(`Commit Hash ${i + 1}: ${commitHash}`);

    try {
      // 1. Commit Decision
      console.log(`  -> Committing decision...`);
      const commitTx = await signalAnchor.commitDecision(commitHash);
      const commitReceipt = await commitTx.wait();
      console.log(`  ✅ Committed in tx: ${commitReceipt.hash}`);

      // 2. Reveal Decision
      console.log(`  -> Revealing decision...`);
      const revealTx = await signalAnchor.revealDecision(
        sig.reasoning,
        sig.tradeIntent,
        sig.nonce,
        sig.signalType,
        sig.confidence
      );
      const revealReceipt = await revealTx.wait();
      results[`sig_reveal_${i + 1}`] = revealReceipt.hash;
      console.log(`  ✅ Revealed in tx: ${revealReceipt.hash}\n`);
    } catch (e: any) {
      console.error(`  ❌ Signal ${i + 1} failed: ${e.message?.slice(0, 300)}\n`);
    }
  }

  // ─── Step 2: Log Trades on TradeLogger ──────────────────────────────────
  console.log("\n📊 Logging trades on TradeLogger contract...\n");

  // Authorize signer if owner
  try {
    const owner = await tradeLogger.owner();
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      const isAuth = await tradeLogger.authorizedAgents(signer.address);
      if (!isAuth) {
        const authTx = await tradeLogger.setAgentStatus(signer.address, true);
        await authTx.wait();
        console.log("  ✅ Signer authorized as executor agent\n");
      }
    }
  } catch (e: any) {
    console.warn(`  ⚠️ Authorization check failed: ${e.message}`);
  }

  const mockTrades = [
    {
      tradeType: 0, // buy
      asset: "0xcDA86FAdE79ff6eF95D3430B95bc99a5e8e81566", // mETH
      amount: ethers.parseEther("100"), // 100 USD equivalent (within position limit of 1000)
      price: ethers.parseEther("3500"), // asset price
      signalRef: "sig_reveal_1",
      venue: "MerchantMoe"
    },
    {
      tradeType: 2, // hedge
      asset: "0x3c3aEd1234567890abcdef1234567890abcdef12", // dummy short asset
      amount: ethers.parseEther("200"),
      price: ethers.parseEther("1"),
      signalRef: "sig_reveal_2",
      venue: "Bybit"
    }
  ];

  for (let i = 0; i < mockTrades.length; i++) {
    const trade = mockTrades[i];
    try {
      console.log(`Logging trade ${i + 1}...`);
      const checksummedAsset = ethers.getAddress(trade.asset.toLowerCase());
      const tx = await tradeLogger.logTrade(
        trade.tradeType,
        checksummedAsset,
        trade.amount,
        trade.price,
        trade.signalRef,
        trade.venue
      );
      const receipt = await tx.wait();
      results[`trade_log_${i + 1}`] = receipt.hash;
      console.log(`  ✅ Trade logged in tx: ${receipt.hash}\n`);
    } catch (e: any) {
      console.error(`  ❌ Trade ${i + 1} failed: ${e.message?.slice(0, 300)}\n`);
    }
  }

  // Save hashes
  const outputPath = path.join(__dirname, "..", "on-chain-hashes.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✅ Seed complete. Saved results to on-chain-hashes.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
