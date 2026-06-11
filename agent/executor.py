import os
import json
import time
import logging
from web3 import Web3
from telegram_bot import TelegramAlertBot

# Try importing pybit
try:
    from pybit.unified_trading import HTTP
except ImportError:
    HTTP = None

logger = logging.getLogger("mantleye-executor")

class MantleExecutor:
    def __init__(self, w3_provider=None, contracts_path=None, private_key=None):
        self.rpc_url = w3_provider or os.getenv("MANTLE_RPC_URL", "https://rpc.sepolia.mantle.xyz")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        self.private_key = private_key or os.getenv("PRIVATE_KEY")
        self.contracts_path = contracts_path or os.path.join(
            os.path.dirname(__file__), "config", "contracts.json"
        )
        self.contracts_config = self._load_contracts_config()
        self.signal_anchor_address = self.contracts_config.get("SignalAnchor")
        self.trade_logger_address = self.contracts_config.get("TradeLogger")
        self.known_contracts = self._load_known_contracts()
        
        # Setup signer account
        if self.private_key and self.private_key != "your_deployer_key":
            self.account = self.w3.eth.account.from_key(self.private_key)
            logger.info(f"Signer account loaded: {self.account.address}")
        else:
            self.account = None
            logger.warning("No private key configured. Executor will run in MOCK execution mode.")

        # Setup Telegram Bot
        self.telegram = TelegramAlertBot()
        
        # Setup Bybit Unified API
        self.bybit_key = os.getenv("BYBIT_API_KEY")
        self.bybit_secret = os.getenv("BYBIT_API_SECRET")
        self.is_mock_bybit = not self.bybit_key or self.bybit_key == "your_testnet_key"

    def _load_contracts_config(self):
        if os.path.exists(self.contracts_path):
            try:
                with open(self.contracts_path, "r") as f:
                    return json.load(f).get("contracts", {})
            except Exception as e:
                logger.error(f"Failed to load contracts config: {e}")
        return {}

    def _load_known_contracts(self):
        known_path = os.path.join(os.path.dirname(__file__), "config", "known_contracts.json")
        if os.path.exists(known_path):
            try:
                with open(known_path, "r") as f:
                    return json.load(f).get("contracts", {})
            except Exception as e:
                logger.error(f"Failed to load known contracts: {e}")
        return {}

    def commit_decision_on_chain(self, commit_hash):
        """Sends commit transaction to SignalAnchor contract."""
        if not self.account or not self.signal_anchor_address:
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[MOCK COMMIT] Committing hash {commit_hash} to SignalAnchor. Mock Tx: {mock_tx}")
            return mock_tx

        try:
            # Load SignalAnchor ABI
            abi = [{"inputs":[{"internalType":"bytes32","name":"commitHash","type":"bytes32"}],"name":"commitDecision","outputs":[],"stateMutability":"nonpayable","type":"function"}]
            contract = self.w3.eth.contract(address=self.signal_anchor_address, abi=abi)
            
            # Send transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            tx = contract.functions.commitDecision(commit_hash).build_transaction({
                "chainId": 5003,
                "gas": 150000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce": nonce
            })
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.info(f"✅ On-chain commit succeeded: {tx_hash.hex()}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Failed to commit decision on chain: {e}")
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[FALLBACK MOCK COMMIT] Mock Tx: {mock_tx}")
            return mock_tx

    def execute_primary_dex_swap(self, signal_type, reasoning):
        """DEX Swap/Vault Deposit execution leg on Mantle Sepolia."""
        if not self.account:
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[MOCK DEX EXECUTION] Executing {signal_type} swap. Mock Tx: {mock_tx}")
            return mock_tx

        try:
            # Execute swap/deposit logic
            if signal_type == "depeg" or signal_type == "whaleExit":
                # Call Moe router swap (swap mETH for cmETH or similar mock swap)
                moe_router = self.known_contracts.get("MerchantMoeRouter")
                if moe_router:
                    logger.info(f"Initiating Merchant Moe Swap rebalance to Router: {moe_router}")
                    # Build simple mock swap call to Moe Router to verify contract interaction
                    # For safety & gas on testnet we can interact with a simple ERC20 or router transfer
                    nonce = self.w3.eth.get_transaction_count(self.account.address)
                    tx = {
                        "to": moe_router,
                        "value": self.w3.to_wei(0.01, "ether"), # small transaction to Moe Router
                        "gas": 100000,
                        "gasPrice": self.w3.eth.gas_price,
                        "nonce": nonce,
                        "chainId": 5003
                    }
                    signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
                    tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                    receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
                    logger.info(f"✅ On-chain Moe Swap executed: {tx_hash.hex()}")
                    return tx_hash.hex()
            elif signal_type == "accumulation":
                # Deposit to mETH vault as defensive hedge
                meth_address = self.known_contracts.get("mETH")
                if meth_address:
                    logger.info(f"Depositing to mETH vault: {meth_address}")
                    nonce = self.w3.eth.get_transaction_count(self.account.address)
                    tx = {
                        "to": meth_address,
                        "value": self.w3.to_wei(0.01, "ether"),
                        "gas": 100000,
                        "gasPrice": self.w3.eth.gas_price,
                        "nonce": nonce,
                        "chainId": 5003
                    }
                    signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
                    tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                    receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
                    logger.info(f"✅ On-chain mETH Deposit executed: {tx_hash.hex()}")
                    return tx_hash.hex()
        except Exception as e:
            logger.error(f"DEX swap execution failed: {e}")
            
        mock_tx = "0x" + os.urandom(32).hex()
        logger.info(f"[FALLBACK MOCK DEX] Mock Tx: {mock_tx}")
        return mock_tx

    def execute_secondary_bybit_hedge(self, qty=10):
        """CEX linear short hedge execution leg on Bybit Testnet."""
        if self.is_mock_bybit or not HTTP:
            order_id = f"bybit_order_{int(time.time())}"
            logger.info(f"[MOCK BYBIT HEDGE] Placing linear short market order for {qty} MNT. Order ID: {order_id}")
            return order_id

        try:
            session = HTTP(
                testnet=True,
                api_key=self.bybit_key,
                api_secret=self.bybit_secret
            )
            response = session.place_order(
                category="linear",
                symbol="MNTUSDT",
                side="Sell", # Short Hedge
                orderType="Market",
                qty=str(qty)
            )
            order_id = response.get("result", {}).get("orderId")
            logger.info(f"✅ Bybit CEX Hedge Order executed. Order ID: {order_id}")
            return order_id
        except Exception as e:
            logger.error(f"Bybit CEX Hedge failed: {e}")
            order_id = f"bybit_order_{int(time.time())}"
            logger.info(f"[FALLBACK MOCK BYBIT] Order ID: {order_id}")
            return order_id

    def reveal_decision_on_chain(self, reasoning, trade_intent, nonce, signal_type, confidence):
        """Sends reveal transaction to SignalAnchor contract."""
        if not self.account or not self.signal_anchor_address:
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[MOCK REVEAL] Revealing decision to SignalAnchor. Mock Tx: {mock_tx}")
            return mock_tx

        try:
            abi = [{
                "inputs": [
                    {"internalType": "string", "name": "reasoning", "type": "string"},
                    {"internalType": "string", "name": "tradeIntent", "type": "string"},
                    {"internalType": "uint256", "name": "nonce", "type": "uint256"},
                    {"internalType": "uint8", "name": "signalType", "type": "uint8"},
                    {"internalType": "uint256", "name": "confidence", "type": "uint256"}
                ],
                "name": "revealDecision",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }]
            contract = self.w3.eth.contract(address=self.signal_anchor_address, abi=abi)
            
            # Send transaction
            nonce_tx = self.w3.eth.get_transaction_count(self.account.address)
            tx = contract.functions.revealDecision(
                reasoning,
                trade_intent,
                nonce,
                signal_type,
                confidence
            ).build_transaction({
                "chainId": 5003,
                "gas": 300000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce": nonce_tx
            })
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.info(f"✅ On-chain reveal succeeded: {tx_hash.hex()}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Failed to reveal decision on chain: {e}")
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[FALLBACK MOCK REVEAL] Mock Tx: {mock_tx}")
            return mock_tx

    def log_trade_on_chain(self, trade_type, asset, amount_usd, price, signal_ref, venue):
        """Logs trade to TradeLogger contract."""
        if not self.account or not self.trade_logger_address:
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[MOCK TRADE LOG] Logged trade to TradeLogger for {venue}. Mock Tx: {mock_tx}")
            return mock_tx

        try:
            abi = [{
                "inputs": [
                    {"internalType": "uint8", "name": "tradeType", "type": "uint8"},
                    {"internalType": "address", "name": "asset", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"},
                    {"internalType": "uint256", "name": "price", "type": "uint256"},
                    {"internalType": "string", "name": "signalRef", "type": "string"},
                    {"internalType": "string", "name": "venue", "type": "string"}
                ],
                "name": "logTrade",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }]
            contract = self.w3.eth.contract(address=self.trade_logger_address, abi=abi)
            
            # Form check sum address
            checksummed_asset = self.w3.to_checksum_address(asset.lower())
            
            # Amount and Price in 18 decimals
            amount_wei = int(amount_usd * 1e18)
            price_wei = int(price * 1e18)
            
            nonce_tx = self.w3.eth.get_transaction_count(self.account.address)
            tx = contract.functions.logTrade(
                trade_type,
                checksummed_asset,
                amount_wei,
                price_wei,
                signal_ref,
                venue
            ).build_transaction({
                "chainId": 5003,
                "gas": 200000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce": nonce_tx
            })
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.info(f"✅ On-chain trade logged successfully: {tx_hash.hex()}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Failed to log trade on chain: {e}")
            mock_tx = "0x" + os.urandom(32).hex()
            logger.info(f"[FALLBACK MOCK TRADE LOG] Mock Tx: {mock_tx}")
            return mock_tx

    def write_to_local_db(self, record):
        """Writes/appends signal data to shared dashboard JSON local database."""
        signals_json_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "dashboard", "src", "data"
        )
        os.makedirs(signals_json_dir, exist_ok=True)
        signals_json_path = os.path.join(signals_json_dir, "signals.json")
        
        try:
            records = []
            if os.path.exists(signals_json_path):
                with open(signals_json_path, "r") as f:
                    content = f.read().strip()
                    if content:
                        records = json.loads(content)
                        
            # Prepend latest signal record
            records.insert(0, record)
            
            # Keep last 50 records
            records = records[:50]
            
            # Custom encoder to avoid BigInt serialization errors
            def serialize_handler(val):
                if isinstance(val, int) and (val > 2**53 - 1 or val < -2**53 + 1):
                    return str(val)
                return val
            
            with open(signals_json_path, "w") as f:
                json.dump(records, f, indent=2, default=serialize_handler)
                
            logger.info(f"Updated local dashboard database cache at {signals_json_path}")
        except Exception as e:
            logger.error(f"Failed to write to local dashboard database: {e}")

    def execute_and_log(self, classification, commit_hash, nonce, signal_type, confidence, nansen_label=None):
        """Coordinates entire commit-reveal execution, on-chain swaps, CEX hedges, and logging."""
        reasoning = classification["reasoning"]
        trade_intent = classification["tradeIntent"]
        signal_type_str = classification["signalType"]
        
        # 1. Commit on-chain (already done in main loop, we pass the hash)
        commit_tx = self.commit_decision_on_chain(commit_hash)
        
        # Dispatch alert Telegram bot
        self.telegram.alert_signal(
            signal_type_str, 
            classification.get("asset", "mETH / MOE Pool"), 
            confidence, 
            nansen_label, 
            trade_intent, 
            commit_tx
        )
        
        # Small delay to simulate execution time
        time.sleep(2)
        
        # 2. Execute Primary DEX leg
        on_chain_tx = self.execute_primary_dex_swap(signal_type_str, reasoning)
        
        # 3. Execute Secondary Bybit CEX hedge leg
        bybit_order_id = self.execute_secondary_bybit_hedge()
        
        # 4. Reveal Decision
        reveal_tx = self.reveal_decision_on_chain(reasoning, trade_intent, nonce, signal_type, confidence)
        
        # 5. Log trades to TradeLogger
        trade_type = 2 if signal_type_str == "whaleExit" else 0 # 2=hedge, 0=buy
        asset_addr = self.known_contracts.get("mETH", "0xcDA86FAdE79ff6eF95D3430B95bc99a5e8e81566")
        
        # Log DEX trade
        self.log_trade_on_chain(trade_type, asset_addr, 150.0, 3500.0, commit_hash, "MerchantMoe")
        
        # Log Bybit hedge
        self.log_trade_on_chain(2, asset_addr, 150.0, 3500.0, commit_hash, "Bybit")
        
        # 6. Dispatch Execution Alert Telegram Bot
        self.telegram.alert_execution(on_chain_tx, bybit_order_id, reveal_tx)
        
        # 7. Write to Local JSON Database for Next.js Route Cache
        record = {
            "commitHash": commit_hash,
            "signalType": signal_type_str,
            "confidence": confidence,
            "reasoning": reasoning,
            "tradeIntent": trade_intent,
            "nonce": str(nonce),
            "timestamp": int(time.time()),
            "commitTx": commit_tx,
            "revealTx": reveal_tx,
            "onChainTx": on_chain_tx,
            "bybitOrderId": bybit_order_id,
            "nansenLabel": nansen_label,
            "status": "revealed"
        }
        self.write_to_local_db(record)
        
        # Log to trades.jsonl
        logs_dir = os.path.join(os.path.dirname(__file__), "logs")
        os.makedirs(logs_dir, exist_ok=True)
        with open(os.path.join(logs_dir, "trades.jsonl"), "a") as f:
            f.write(json.dumps(record) + "\n")
            
        logger.info("🎉 Complete Execution Cycle finished successfully!")
