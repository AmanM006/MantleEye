import os
import json
import time
import requests
import logging

logger = logging.getLogger("mantleye-nansen")

class NansenClient:
    def __init__(self, api_key=None, cache_path=None):
        self.api_key = api_key or os.getenv("NANSEN_API_KEY")
        self.cache_path = cache_path or os.path.join(
            os.path.dirname(__file__), "config", "watchlist.json"
        )
        self.is_mock = not self.api_key or self.api_key == "your_nansen_api_key" or self.api_key.startswith("your_")
        
        # Ensure config dir exists
        os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
        
        # Load cache
        self.watchlist = self._load_cache()

    def _load_cache(self):
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r") as f:
                    data = json.load(f)
                    # Check if cache is older than 6 hours
                    if time.time() - data.get("updated_at", 0) < 6 * 3600:
                        logger.info("Loaded Nansen Smart Money watchlist from cache.")
                        return data.get("wallets", {})
            except Exception as e:
                logger.warning(f"Failed to read Nansen cache: {e}")
        
        # If cache expired or not found, refresh
        return self.refresh_watchlist()

    def refresh_watchlist(self):
        if self.is_mock:
            logger.info("Running Nansen in MOCK mode. Seeding mock Smart Money wallets.")
            # Seed 5 mock wallets for simulation/testing
            mock_wallets = {
                "0x9d744F795Faa53E3173bAF18783baf51B92b98a5": "Nansen: Tier-1 Fund (Signer)",
                "0x1111111111111111111111111111111111111111": "Nansen: Smart Money LP",
                "0x2222222222222222222222222222222222222222": "Nansen: High-Frequency Arbitrage",
                "0x3333333333333333333333333333333333333333": "Nansen: Active Whale",
                "0x4444444444444444444444444444444444444444": "Nansen: Tier-2 Yield Farmer"
            }
            self._save_cache(mock_wallets)
            return mock_wallets

        try:
            logger.info("Fetching Smart Money wallets from Nansen API...")
            headers = {"x-api-key": self.api_key}
            response = requests.get(
                "https://api.nansen.ai/v1/portfolio/smartmoney", 
                headers=headers, 
                timeout=10
            )
            if response.status_code == 200:
                wallets_data = response.json().get("data", [])
                wallets = {}
                for w in wallets_data[:50]:
                    addr = w.get("address")
                    label = w.get("label", "Nansen: Smart Money")
                    if addr:
                        wallets[addr.lower()] = label
                self._save_cache(wallets)
                return wallets
            else:
                logger.error(f"Nansen API error: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Nansen API request failed: {e}")
            
        # Fallback to cached or mock if API fails
        return {}

    def _save_cache(self, wallets):
        try:
            with open(self.cache_path, "w") as f:
                json.dump({
                    "updated_at": time.time(),
                    "wallets": wallets
                }, f, indent=2)
            logger.info("Saved Nansen Smart Money watchlist to cache.")
        except Exception as e:
            logger.error(f"Failed to save Nansen cache: {e}")

    def check_address(self, address):
        """Checks if address is in Smart Money list and returns label if present."""
        addr_lower = address.lower()
        
        # Live query check if not in cached top 50 (if API key exists)
        if addr_lower in self.watchlist:
            return self.watchlist[addr_lower]
            
        if not self.is_mock:
            try:
                headers = {"x-api-key": self.api_key}
                response = requests.get(
                    f"https://api.nansen.ai/v1/wallet/{address}/label",
                    headers=headers,
                    timeout=5
                )
                if response.status_code == 200:
                    label = response.json().get("data", {}).get("label")
                    if label:
                        return f"Nansen: {label}"
            except Exception:
                pass
                
        return None
