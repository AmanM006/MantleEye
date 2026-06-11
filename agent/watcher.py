import os
import json
import time
import logging
from web3 import Web3
from nansen import NansenClient

logger = logging.getLogger("mantleye-watcher")
logging.basicConfig(level=logging.INFO)

class MantleWatcher:
    def __init__(self, rpc_url=None, known_contracts_path=None):
        self.rpc_url = rpc_url or os.getenv("MANTLE_RPC_URL", "https://rpc.sepolia.mantle.xyz")
        self.known_contracts_path = known_contracts_path or os.path.join(
            os.path.dirname(__file__), "config", "known_contracts.json"
        )
        
        # Connect to Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.is_connected = self.w3.is_connected()
        if self.is_connected:
            logger.info(f"Connected to Mantle RPC: {self.rpc_url}")
        else:
            logger.warning(f"Failed to connect to Mantle RPC: {self.rpc_url}. Watcher will run in SIMULATED mode.")
            
        # Load watchlist Nansen Client
        self.nansen = NansenClient()
        
        # Load known contracts
        self.known_contracts = self._load_known_contracts()

    def _load_known_contracts(self):
        if os.path.exists(self.known_contracts_path):
            try:
                with open(self.known_contracts_path, "r") as f:
                    return json.load(f).get("contracts", {})
            except Exception as e:
                logger.error(f"Failed to load known contracts: {e}")
        return {}

    def get_meth_price_deviation(self):
        """Simulates/polls mETH price vs ETH price."""
        # In a real setup, we would query the price feed oracle or pool reserves.
        # Let's mock a price query: normal is 1.0, depeg is 0.994 (0.6% deviation)
        # We will return a small normal deviation or occasionally mock a depeg
        return 0.001 # 0.1% normal deviation

    def get_usdy_price_deviation(self):
        """Simulates/polls USDY price vs $1.00 peg."""
        return 0.0005 # 0.05% normal deviation

    def process_on_chain_event(self, event_type, details):
        """Processes a detected event, boosts confidence via Nansen, and passes to brain."""
        confidence = 50
        reasoning = f"Detected {event_type} on Mantle Network."
        trade_intent = "MONITOR"
        
        # Check if address is in Nansen list
        address = details.get("sender") or details.get("from")
        nansen_label = None
        if address:
            nansen_label = self.nansen.check_address(address)
            if nansen_label:
                confidence += 20
                logger.info(f"🔥 Nansen Smart Money detected: {address} ({nansen_label}). Confidence boosted +20.")
                
        details["nansen_label"] = nansen_label
        details["initial_confidence"] = confidence
        
        return {
            "event_type": event_type,
            "details": details,
            "nansen_label": nansen_label,
            "confidence": confidence
        }

    def start_simulated_stream(self, callback):
        """Runs a simulated event stream loop for demonstration and testing."""
        logger.info("Starting simulated live Mantle event stream...")
        
        # Sample simulated events
        simulated_events = [
            {
                "event_type": "mETH_depeg",
                "details": {
                    "asset": "mETH",
                    "deviation": 0.0065, # 0.65% deviation (depeg threshold is 0.5%)
                    "current_price": "0.9935 ETH",
                    "sender": "0x1111111111111111111111111111111111111111"
                }
            },
            {
                "event_type": "merchant_moe_exit",
                "details": {
                    "pool": "USDC/MNT LP",
                    "amount_usd": 68000.0, # $68k exit (exceeds $50k threshold)
                    "sender": "0x9d744F795Faa53E3173bAF18783baf51B92b98a5" # Smart Money signer
                }
            },
            {
                "event_type": "agni_swap",
                "details": {
                    "pool": "WMNT/USDT Concentrated Pool",
                    "amount_usd": 125000.0, # $125k swap (exceeds $100k threshold)
                    "sender": "0x3333333333333333333333333333333333333333"
                }
            },
            {
                "event_type": "usdy_depeg",
                "details": {
                    "asset": "USDY",
                    "deviation": 0.0042, # 0.42% deviation (threshold is 0.3%)
                    "current_price": "$0.9958",
                    "sender": "0x2222222222222222222222222222222222222222"
                }
            }
        ]
        
        idx = 0
        while True:
            # Emit a simulated event every 30 seconds
            event = simulated_events[idx % len(simulated_events)]
            processed = self.process_on_chain_event(event["event_type"], event["details"])
            logger.info(f"📡 Detected simulated anomaly: {event['event_type']}")
            callback(processed)
            idx += 1
            time.sleep(30)

    def start_real_stream(self, callback):
        """Reads real RPC blocks and logs anomalies."""
        logger.info("Starting live Mantle Sepolia RPC polling...")
        last_block = self.w3.eth.block_number
        
        while True:
            try:
                current_block = self.w3.eth.block_number
                if current_block > last_block:
                    for block_num in range(last_block + 1, current_block + 1):
                        block = self.w3.eth.get_block(block_num, full_transactions=True)
                        logger.info(f"Scanning block {block_num} - {len(block.transactions)} txs...")
                        
                        # Process transactions in block
                        for tx in block.transactions:
                            # 1. Watch for large value transfers
                            value_mnt = self.w3.from_wei(tx["value"], "ether")
                            # Simple estimation: value > 10,000 MNT
                            if value_mnt > 10000:
                                details = {
                                    "tx_hash": tx["hash"].hex(),
                                    "sender": tx["from"],
                                    "receiver": tx["to"],
                                    "value": float(value_mnt)
                                }
                                processed = self.process_on_chain_event("whale_movement", details)
                                callback(processed)
                                
                    last_block = current_block
            except Exception as e:
                logger.warning(f"Error polling Mantle blocks: {e}")
                
            time.sleep(10)
            
if __name__ == "__main__":
    watcher = MantleWatcher()
    watcher.start_simulated_stream(lambda e: print(json.dumps(e, indent=2)))
