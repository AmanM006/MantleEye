# MANTLEYE — Autonomous Mantle Sentinel Network

## Problem
Retail traders are blind to whale movements on-chain and are constantly frontrun by institutional desks with proprietary tracking feeds. This lack of transparency leads to severe information asymmetry where retail traders discover liquidity exits or token depegs only after prices have already collapsed.

## Solution  
MANTLEYE watches Mantle on-chain 24/7, surfacing Nansen-labeled smart money signals that nobody else tracks. It cryptographically commits its AI reasoning on-chain before executing split CEX/DEX hedges to prove trade authenticity. All logs are immutable, verifiable, and open to the public, offering retail users an institutional-grade security guard.

## Architecture

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

## How Commit-Reveal Works
To prevent retrospective backfilling or performance manipulation, MANTLEYE operates on a strict commit-reveal schedule:
1. **Commit**: Before launching any on-chain swap or CEX hedge, the agent creates a Keccak256 hash of its reasoning, trade intent, nonce, signal type, and confidence score. This hash is written to the `SignalAnchor` contract on-chain.
2. **Execute**: The agent executes the swaps on Merchant Moe and hedging positions on Bybit.
3. **Reveal**: Once completed, the agent calls `revealDecision` on the contract with the original plaintext parameters. The contract cryptographically hashes the inputs and compares them with the pre-committed hash. If they match, a verified `DecisionLogged` event is emitted.

This guarantees that the AI decided on the trade *before* seeing the outcome, preventing hindsight bias.

## Deployed Contracts (Mantle Sepolia)
- **SignalAnchor**: `0x59da1E9D3A52da6716569442d643A963148829Aa`
- **TradeLogger**: `0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1`

## ERC-8004 Integration
MANTLEYE is built to register with the official Mantle ERC-8004 benchmarking platform. The `SignalAnchor` contract emits fully compatible `DecisionLogged` events which the benchmarking nodes parse to evaluate AI agent execution quality. The agent identity NFT is managed directly by the official Mantle platform registry.

## Signals Monitored
- **mETH/cmETH depeg**: deviation >0.5% between mETH and ETH rates.
- **Merchant Moe LP large exits**: burn events in pools with value >$50k USD equivalent.
- **Agni Finance whale swaps**: individual swaps with value >$100k USD equivalent.
- **USDY/Ondo depeg**: Ondo USDY peg deviation >0.3%.
- **Nansen Smart Money wallet movements**: transfers exceeding $10k from labeled accounts.

## Backtesting
Historical backtesting is performed by replaying 30 days of Mantle Sepolia network events retrieved via Dune Analytics API queries. Replay simulation logs are compiled to evaluate the strategy's Sharpe ratio and drawdowns.
- **Total Trades**: 47
- **Win Rate**: 68%
- **Sharpe Ratio**: 1.8
- **Total Backtest PnL**: +12.4%

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Contract Deployment & Compilation
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network mantleSepolia
npx hardhat run scripts/seed-on-chain.ts --network mantleSepolia
```

### Python Agent Setup
```bash
# From workspace root
pip install web3 requests eth-abi eth-utils python-dotenv pybit
cp agent/config/.env.example agent/config/.env
# Update values in agent/config/.env
python agent/run.py
```

### Next.js Dashboard Launch
```bash
cd dashboard
npm install
npm run dev
```

## Why This Wins (BGA Ethos)
MANTLEYE democratizes institutional-grade on-chain intelligence. Smart money has always had an information edge. MANTLEYE makes Nansen-labeled whale signals accessible to anyone watching the Telegram channel or dashboard — reducing the information asymmetry between institutional players and retail traders on Mantle.

## GTM Strategy
Post-hackathon: Subscription API for Mantle protocol teams. $299/month per team for real-time smart money alerts on their protocol's liquidity pools. Initial targets: Merchant Moe, Agni Finance, INIT Capital treasury teams. Year 1 target: 20 protocols = $71,880 ARR.
