# DoraHacks Submission Details — MANTLEYE

Use this formatted text for the DoraHacks submission form fields to ensure that all key aspects of the project (such as GTM strategy, ERC-8004 integration, and contract verification details) are cleanly communicated to the hackathon judges.

---

## 1. Project Tagline
**Cryptographically auditable AI quant sentinel and linear hedging engine tracking smart money anomalies on Mantle.**

---

## 2. Problem Statement
Retail traders are blind to whale movements on-chain and are constantly frontrun by institutional desks with proprietary tracking feeds. This lack of transparency leads to severe information asymmetry where retail traders discover liquidity exits or token depegs only after prices have already collapsed.

---

## 3. Solution (BGA Ethos)
MANTLEYE watches the Mantle blockchain 24/7, surfacing Nansen-labeled smart money signals that nobody else tracks. It democratizes institutional-grade intelligence by making labeled whale signals accessible to anyone. 

To guarantee trust and eliminate retrospectively "optimized" results, the sentinel operates a **cryptographic commit-reveal schedule**: it hashes its trading reasoning, confidence score, and intents, anchoring them on-chain BEFORE execution. All execution logs are public, immutable, and fully verifiable.

---

## 4. Architecture Summary
- **Ingestion Layer (`watcher.py`)**: Streams block logs (swaps, burns, depegs) on Mantle Sepolia and labels incoming addresses against a Nansen wallet cache.
- **Decision Layer (`brain.py`)**: Evaluates anomalous flows via Claude 3.5 Sonnet to classify signals and output confidence ratings.
- **Commit-Reveal Layer (`SignalAnchor.sol`)**: Hashes decision parameters, commits them on-chain, and later reveals the plain text to verify the agent acted without hindsight bias.
- **Execution Layer (`executor.py`)**: Executes primary DEX swaps on Merchant Moe and opens short hedging positions on Bybit Futures.

---

## 5. Deployed Contract Addresses (Mantle Sepolia)
Both contracts are fully verified on the explorer:
*   **SignalAnchor**: `0x59da1E9D3A52da6716569442d643A963148829Aa`
    *   *Verifiable commit-reveal registry where decision hashes are anchored.*
*   **TradeLogger**: `0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1`
    *   *Immutable ledger recording execution data (price, quantity, venue) and anchoring signal hashes.*

---

## 6. ERC-8004 Benchmarking Integration
MANTLEYE is built to register with the official Mantle ERC-8004 benchmarking platform. The `SignalAnchor` contract emits fully compatible `DecisionLogged` events which the benchmarking nodes parse to evaluate AI agent execution quality. The agent identity NFT is managed directly by the official Mantle platform registry, discarding custom implementations to ensure full standard compliance.

---

## 7. Go-To-Market (GTM) Strategy
Post-hackathon, we are launching a subscription API for Mantle protocol teams (charging $299/month per team for real-time smart money alerts on their liquidity pools). Our initial targets are the treasury teams of Merchant Moe, Agni Finance, and INIT Capital. We estimate a Year 1 target of 20 protocols, yielding **$71,880 ARR** with zero marginal storage cost.

---

## 8. Sandbox & Fallback Support
For local testing and reviewer ease, if the codebase is launched without active Dune/Nansen API environment variables, the system automatically falls back to clean, deterministic, and fully simulated mock data streams, preventing blank error screens.

---

## 9. Production Roadmap (Addressing Scalability, UX & Tokenomics)

To bridge the gap between our hackathon prototype and a production-ready institutional-grade platform, we have mapped out the following roadmap:

### A. Account Abstraction (AA) & Paymaster Gas Sponsorship
* **The UX Challenge**: Currently, operators must manually sign MetaMask transactions and maintain gas balances in `$MNT` to configure strategies.
* **Production Fix**: Integrate ERC-4337 smart contract wallets (Biconomy/ZeroDev). A Paymaster will sponsor transaction gas fees in `$MNT` or allow users to pay gas in stablecoins (USDT/USDC). Additionally, session keys will allow the agent to execute actions within predetermined limits without requiring manual user approvals for every config update.

### B. Decentralizing the Ingestion & Execution Loop
* **The Trust Challenge**: The watcher loop currently runs on a centralized server, which represents a single point of failure.
* **Production Fix**: Transition from a centralized Python daemon to a decentralized oracle network. We will implement **Gelato Web3 Functions** or **Chainlink Functions** to watch pool events, trigger LLM API calls, and automatically execute the on-chain commit-reveal transactions in a trustless, decentralized manner.

### C. Tokenomics & Revenue Sustainability
* **Value Capture**: We will implement a dual-revenue model:
  1. A SaaS subscription for protocols querying smart money anomaly datasets.
  2. A **10% performance fee** on successful arbitrage/hedging loops executed by the agent, collected directly in `$MNT`.
* **Utility Sink**: Users can lock/stake `$MNT` in the MantleEye vault to receive fee discounts on high-tier delta-neutral strategies, align voting power for treasury execution parameters, and sponsor bot runners.
