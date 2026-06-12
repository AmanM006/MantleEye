# MANTLEYE — Autonomous Mantle Sentinel Network

[![Website](https://img.shields.io/badge/Website-Live-00D4A4?style=for-the-badge&logo=vercel&logoColor=black)](https://mantleeye.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github)](https://github.com/AmanM006/MantleEye)
[![Network](https://img.shields.io/badge/Network-Mantle_Sepolia-5003?style=for-the-badge&color=00d4a4)](https://explorer.sepolia.mantle.xyz)

MantleEye is an autonomous, cryptographically auditable AI quantitative sentinel and linear hedging engine tracking smart money anomalies on the Mantle network. It watches DEX pools and whale transfers, formulates trading signals using an LLM cognitive loop, and registers decisions on-chain before executing swaps to eliminate hindsight bias.

---

## 🌐 Live URLs & Deployed Contracts

*   **Production Dashboard**: [https://mantleeye.vercel.app](https://mantleeye.vercel.app)
*   **SignalAnchor Smart Contract**: [`0x59da1E9D3A52da6716569442d643A963148829Aa`](https://explorer.sepolia.mantle.xyz/address/0x59da1E9D3A52da6716569442d643A963148829Aa)
    *   *Verifiable commit-reveal registry where AI decision hashes are anchored.*
*   **TradeLogger Smart Contract**: [`0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1`](https://explorer.sepolia.mantle.xyz/address/0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1)
    *   *Immutable ledger recording trade execution records linked to original signal references.*

---

## 📌 Problem Statement & Vision
Retail traders are blind to whale movements on-chain and are constantly frontrun by institutional desks with proprietary tracking feeds. This information asymmetry leads to retail traders discovering liquidity exits or token depegs only after prices have already collapsed.

MantleEye democratizes institutional-grade intelligence by making Nansen-labeled smart money signals accessible to anyone. To guarantee trust and prevent retrospective backfilling, the sentinel operates a **cryptographic commit-reveal schedule**, anchoring decision intents on-chain before execution to prove the agent acted without hindsight bias.

---

## 🛠️ Key Features

1.  **On-Chain Cryptographic Commit-Reveal**: AI decisions are hashed (`Keccak256`) and committed on-chain *before* any DEX swap occurs. Plaintext parameters are revealed post-execution, enabling public auditability.
2.  **Live AI Chat Sandbox**: A built-in chat window connected to the **Gemini 1.5 Flash API** allowing reviewers to query the agent's cognitive loops.
3.  **Cryptographic Proof Calculator**: Interactive client-side hashing utility verifying that the plain text parameters match the committed hash.
4.  **Mantle ERC-8004 Compliance**: Ready to emit standard benchmarking events for AI Agent evaluation protocols on Mantle.
5.  **Telemetry State Persistence**: Solved serverless read-only write failures on Vercel using browser local storage to guarantee status and timer consistency during tab navigation.

---

## 📐 System Architecture

```
                                  +-----------------------+
                                  |   Mantle Blockchain   |
                                  | (Sepolia Testnet RPC) |
                                  +-----------+-----------+
                                              |
                                              | 1. Stream events (Swaps, Burns, Depegs)
                                              v
+------------------+              +-----------+-----------+
|  Nansen Wallet   | ------------>|       watcher.py      |
|  Labels Cache    |  Check label |   (Ingestion Layer)   |
+------------------+              +-----------+-----------+
                                              |
                                              | 2. Forward Event + Label
                                              v
+------------------+              +-----------+-----------+
|    Claude API    | <------------|        brain.py       |
|  (Sonnet Model)  |  Classify    |   (Decision Layer)    |
+------------------+              +-----------+-----------+
                                              |
                                              | 3. Commit Decision Hash
                                              v
                                  +-----------+-----------+
                                  |   SignalAnchor.sol    | (On-Chain Commit)
                                  +-----------+-----------+
                                              |
                                              | 4. Confirm Tx & execute trade intent
                                              v
                                  +-----------+-----------+
                                  |      executor.py      |
                                  |    (Execution Layer)  |
                                  +-----+-----------+-----+
                                        |           |
                     5a. DEX Swap       |           | 5b. CEX Short Hedge
                                        v           v
                          +-------------+---+   +---+-------------+
                          |  Merchant Moe   |   |  Bybit Futures  |
                          +-----------------+   +-----------------+
                                        |           |
                                        +-----+-----+
                                              |
                                              | 6. Reveal Decision Parameters
                                              v
                                  +-----------+-----------+
                                  |   SignalAnchor.sol    | (On-Chain Reveal & log trade)
                                  +-----------+-----------+
```

---

## 🔒 The Commit-Reveal Mechanism
To prevent retrospective backfitting or performance manipulation, MantleEye operates on a strict commit-reveal schedule:
1.  **Commit**: The agent hashes its trading reasoning, trade intent, nonce, signal type, and confidence score:
    $$\text{Commit Hash} = \text{keccak256}(\text{abi.encodePacked}(\text{reasoning, intent, nonce, type, confidence}))$$
    This hash is written to the `SignalAnchor` contract.
2.  **Execute**: The agent executes the swaps on Merchant Moe and hedging positions on Bybit.
3.  **Reveal**: The agent calls `revealDecision` with plaintext parameters. The contract hashes them, compares it to the committed hash, and emits a verified `DecisionLogged` event if they match.

---

## 📈 Backtesting Performance
*   **Duration**: 90 Days (replaying Mantle Sepolia network events via Dune Analytics API queries)
*   **Total Trades**: 367
*   **Win Rate**: 67.2%
*   **Sharpe Ratio**: 3.20
*   **Sortino Ratio**: 5.35
*   **Total Backtest PnL**: +36.75%
*   **Max Drawdown**: -11.17%

---

## 🚀 Setup & Installation

### 1. Smart Contract Compilation & Verification
```bash
cd contracts
npm install
npx hardhat compile

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy.ts --network mantleSepolia
# Verify contracts on MantleScan
npx hardhat run scripts/verify.ts --network mantleSepolia
```

### 2. Python Agent Ingestion & Cognitive Loop Setup
```bash
# Install dependencies
pip install web3 requests eth-abi eth-utils python-dotenv pybit

# Configure environment keys
cp agent/config/.env.example agent/config/.env
# Update agent/config/.env with RPC endpoints, private keys, and Claude API credentials

# Run agent
python agent/run.py
```

### 3. Next.js Dashboard Setup
```bash
cd dashboard
npm install
npm run dev
```

---

## 🗺️ Production Roadmap

*   **Account Abstraction (AA) & Gasless UX**: Integrate ERC-4337 smart contract wallets (Biconomy/ZeroDev) and Paymaster gas sponsorship. Add session keys to auto-approve strategy parameters within preset bounds.
*   **Gelato Keeper Automation**: Transition the watcher/executor daemon from a centralized server to Gelato Web3 Functions or Chainlink Keepers to achieve a decentralized, trustless execution loop.
*   **Staking & Vaults**: Vault contracts where users stake `$MNT` to sponsor gas/runners and receive a share of the agent's performance yields.
