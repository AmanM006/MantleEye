import os
import json
import random
import logging
import requests
from eth_abi.packed import encode_packed
from eth_utils import keccak
from web3 import Web3

# Try importing Anthropic, or mock
try:
    import anthropic
except ImportError:
    anthropic = None

logger = logging.getLogger("mantleye-brain")

# Signal Type Mappings
SIGNAL_MAP = {
    "depeg": 0,
    "whaleExit": 1,
    "accumulation": 2,
    "divergence": 3
}

class MantleBrain:
    def __init__(self, w3_provider=None, contracts_path=None):
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        has_anthropic = self.anthropic_key and self.anthropic_key != "your_key" and not self.anthropic_key.startswith("your_")
        has_gemini = self.gemini_key and self.gemini_key != "your_key" and not self.gemini_key.startswith("your_")
        
        self.is_mock_llm = not (has_anthropic or has_gemini)
        
        # Setup Web3 for contract checks
        self.w3_provider = w3_provider or os.getenv("MANTLE_RPC_URL", "https://rpc.sepolia.mantle.xyz")
        self.w3 = Web3(Web3.HTTPProvider(self.w3_provider))
        
        # Load contracts
        self.contracts_path = contracts_path or os.path.join(
            os.path.dirname(__file__), "config", "contracts.json"
        )
        self.contracts_config = self._load_contracts_config()
        self.trade_logger_address = self.contracts_config.get("TradeLogger")
        self.signal_anchor_address = self.contracts_config.get("SignalAnchor")
        
        # Load TradeLogger ABI for risk check
        self.trade_logger_contract = self._load_trade_logger_contract()

    def _load_contracts_config(self):
        if os.path.exists(self.contracts_path):
            try:
                with open(self.contracts_path, "r") as f:
                    return json.load(f).get("contracts", {})
            except Exception as e:
                logger.error(f"Failed to load contracts.json: {e}")
        return {}

    def _load_trade_logger_contract(self):
        if not self.trade_logger_address:
            return None
        # Minimal ABI for checking emergencyStop and maxPositionSizeUSD
        abi = [
            {
                "inputs": [],
                "name": "emergencyStop",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "maxPositionSizeUSD",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        return self.w3.eth.contract(address=self.trade_logger_address, abi=abi)

    def classify_event(self, event):
        """Classifies on-chain event using Gemini, Claude, or mock fallback."""
        event_type = event.get("event_type")
        details = event.get("details", {})
        nansen_label = event.get("nansen_label")

        if self.is_mock_llm:
            logger.info("Running Brain LLM in MOCK mode (Claude/Gemini offline).")
            return self._mock_classification(event_type, details, nansen_label)

        # 1. Try Gemini if configured
        if self.gemini_key and self.gemini_key != "your_key" and not self.gemini_key.startswith("your_"):
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                system_instruction = (
                    "You are a DeFi anomaly classifier. Analyze on-chain events "
                    "and return JSON only matching this schema: "
                    '{"signalType": "depeg"|"whaleExit"|"accumulation"|"divergence", "confidence": int (0-100), "reasoning": "string description", "tradeIntent": "string intent", "riskLevel": "low"|"medium"|"high"}.'
                )
                prompt = (
                    f"Analyze this on-chain anomaly and classify it:\n"
                    f"Event Type: {event_type}\n"
                    f"Details: {json.dumps(details)}\n"
                    f"Nansen Smart Money Label: {nansen_label or 'None'}\n"
                )
                payload = {
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "systemInstruction": {
                        "parts": [{
                            "text": system_instruction
                        }]
                    },
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.1
                    }
                }
                response = requests.post(url, json=payload, timeout=15)
                if response.status_code == 200:
                    resp_json = response.json()
                    raw_text = resp_json['candidates'][0]['content']['parts'][0]['text']
                    result = json.loads(raw_text.strip())
                    logger.info(f"Gemini Classification Success: {result}")
                    return result
                else:
                    logger.error(f"Gemini API returned error {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Gemini API execution failed: {e}")

        # 2. Try Claude if configured
        if anthropic and self.anthropic_key and self.anthropic_key != "your_key" and not self.anthropic_key.startswith("your_":
            try:
                client = anthropic.Anthropic(api_key=self.anthropic_key)
                prompt = (
                    f"Analyze this on-chain anomaly and classify it:\n"
                    f"Event Type: {event_type}\n"
                    f"Details: {json.dumps(details)}\n"
                    f"Nansen Smart Money Label: {nansen_label or 'None'}\n"
                )
                
                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1000,
                    system=(
                        "You are a DeFi anomaly classifier. Analyze on-chain events "
                        "and return JSON only: {signalType, confidence, reasoning, tradeIntent, riskLevel}. "
                        "signalType options: depeg|whaleExit|accumulation|divergence"
                    ),
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                
                result = json.loads(response.content[0].text)
                logger.info(f"Claude Classification Success: {result}")
                return result
            except Exception as e:
                logger.error(f"Claude API failed: {e}")

        # 3. Fallback to mock
        logger.warning("All LLM providers failed or are unconfigured. Falling back to mock classification.")
        return self._mock_classification(event_type, details, nansen_label)

    def _mock_classification(self, event_type, details, nansen_label):
        """High-fidelity mock classifications for demo simulation."""
        conf_boost = 20 if nansen_label else 0
        
        if event_type == "mETH_depeg" or "depeg" in event_type:
            return {
                "signalType": "depeg",
                "confidence": min(91 + conf_boost, 100),
                "reasoning": f"mETH/cmETH peg deviation detected at {details.get('deviation', 0.0055)*100:.2f}%. Executing arbitrage rebalance.",
                "tradeIntent": "SWAP mETH FOR cmETH ON MERCHANT MOE",
                "riskLevel": "low"
            }
        elif event_type == "merchant_moe_exit" or "exit" in event_type:
            return {
                "signalType": "whaleExit",
                "confidence": min(85 + conf_boost, 100),
                "reasoning": f"Concentrated LP large withdrawal of ${details.get('amount_usd', 60000):,.2f} detected. Capital flight risk.",
                "tradeIntent": "SHORT HEDGE MNTUSDT BYBIT",
                "riskLevel": "medium"
            }
        elif event_type == "agni_swap" or "swap" in event_type:
            return {
                "signalType": "accumulation",
                "confidence": min(82 + conf_boost, 100),
                "reasoning": f"Whale transaction of ${details.get('amount_usd', 120000):,.2f} detected on Agni Finance. Upward momentum.",
                "tradeIntent": "BUY MNT ON AGNI FINANCE",
                "riskLevel": "low"
            }
        else:
            return {
                "signalType": "divergence",
                "confidence": min(75 + conf_boost, 100),
                "reasoning": "Standard deviation z-score alert. Asset price divergence detected.",
                "tradeIntent": "MONITOR POOL RESERVE COEFFICIENTS",
                "riskLevel": "medium"
            }

    def check_risk_and_limits(self, classification, position_size_usd=150):
        """Verifies if classification satisfies risk controls."""
        confidence = classification.get("confidence", 0)
        if confidence < 70:
            logger.warning(f"Aborting: Confidence {confidence}% is below threshold (70%).")
            return False, "Low Confidence"
            
        # Contract checks (fall back to true if contract address not configured)
        if self.trade_logger_contract and self.w3.is_connected():
            try:
                emergency_stop = self.trade_logger_contract.functions.emergencyStop().call()
                if emergency_stop:
                    logger.warning("Aborting: TradeLogger emergency stop circuit breaker active!")
                    return False, "Emergency Stop Active"
                    
                max_pos = self.trade_logger_contract.functions.maxPositionSizeUSD().call()
                # max_pos is 18 decimals
                max_pos_usd = max_pos / 1e18
                if position_size_usd > max_pos_usd:
                    logger.warning(f"Aborting: Position size ${position_size_usd} exceeds max position limit ${max_pos_usd}.")
                    return False, "Position Limit Exceeded"
            except Exception as e:
                logger.warning(f"Contract risk check failed to execute, proceeding: {e}")
                
        return True, "Passed"

    def compute_commit_payload(self, reasoning, trade_intent, signal_type_str, confidence_val):
        """Generates random nonce and Solidity packed keccak256 hash."""
        # Random uint256 nonce
        nonce = random.randint(1, 2**256 - 1)
        signal_type = SIGNAL_MAP.get(signal_type_str, 3) # default divergence=3
        confidence = int(confidence_val)
        
        # abi.encodePacked in Solidity corresponds to encode_packed in python
        packed_data = encode_packed(
            ['string', 'string', 'uint256', 'uint8', 'uint256'],
            [reasoning, trade_intent, nonce, signal_type, confidence]
        )
        commit_hash = keccak(packed_data)
        
        # Convert to bytes32 hex string
        commit_hash_hex = "0x" + commit_hash.hex()
        
        return commit_hash_hex, nonce, signal_type, confidence
