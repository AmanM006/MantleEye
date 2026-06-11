import os
import time
import logging
import requests

logger = logging.getLogger("mantleye-dune")

class DuneClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("DUNE_API_KEY")
        self.is_mock = not self.api_key or self.api_key == "your_key" or self.api_key.startswith("your_")

    def query_historical_dex_trades(self):
        """Fetches last 30d Merchant Moe DEX trades."""
        if self.is_mock:
            logger.info("Running Dune in MOCK mode. Generating simulated historical DEX trades.")
            return self._generate_mock_dex_trades()
            
        try:
            logger.info("Querying Dune Analytics API for Mantle DEX trades...")
            # Execute query on Dune (simplified example using direct execution or query ID)
            # In a real environment, you run a query using Dune API Client or requests
            # For demonstration, we'll request a parameterized query execution.
            headers = {"X-Dune-API-Key": self.api_key}
            query_sql = (
                "SELECT block_time, taker, token_a_symbol, token_b_symbol, amount_usd, tx_hash "
                "FROM mantle.dex_trades "
                "WHERE block_time > NOW() - interval '30' day "
                "AND project = 'merchant-moe' "
                "ORDER BY amount_usd DESC LIMIT 100"
            )
            # Send query to Dune API
            response = requests.post(
                "https://api.dune.com/api/v1/query/execute",
                headers=headers,
                json={"query_sql": query_sql},
                timeout=15
            )
            if response.status_code == 200:
                execution_id = response.json().get("execution_id")
                # Poll results
                for _ in range(5):
                    time.sleep(3)
                    res = requests.get(
                        f"https://api.dune.com/api/v1/execution/{execution_id}/results",
                        headers=headers,
                        timeout=10
                    )
                    if res.status_code == 200:
                        status = res.json().get("state")
                        if status == "QUERY_STATE_COMPLETED":
                            rows = res.json().get("result", {}).get("rows", [])
                            return rows
            logger.warning("Dune query failed or timed out. Falling back to mock data.")
        except Exception as e:
            logger.error(f"Dune query failed: {e}")
            
        return self._generate_mock_dex_trades()

    def query_historical_meth_transfers(self):
        """Fetches last 30d mETH transfers."""
        if self.is_mock:
            logger.info("Running Dune in MOCK mode. Generating simulated historical mETH transfers.")
            return self._generate_mock_meth_transfers()
            
        try:
            logger.info("Querying Dune Analytics API for mETH transfers...")
            headers = {"X-Dune-API-Key": self.api_key}
            query_sql = (
                "SELECT block_time, \"from\", \"to\", value/1e18 as value_eth, tx_hash "
                "FROM mantle.erc20_transfers "
                "WHERE contract_address = '\\xcDA86FAdE79ff6eF95D3430B95bc99a5e8e81566' "
                "AND block_time > NOW() - interval '30' day "
                "ORDER BY value DESC LIMIT 100"
            )
            response = requests.post(
                "https://api.dune.com/api/v1/query/execute",
                headers=headers,
                json={"query_sql": query_sql},
                timeout=15
            )
            if response.status_code == 200:
                execution_id = response.json().get("execution_id")
                for _ in range(5):
                    time.sleep(3)
                    res = requests.get(
                        f"https://api.dune.com/api/v1/execution/{execution_id}/results",
                        headers=headers,
                        timeout=10
                    )
                    if res.status_code == 200:
                        status = res.json().get("state")
                        if status == "QUERY_STATE_COMPLETED":
                            rows = res.json().get("result", {}).get("rows", [])
                            return rows
            logger.warning("Dune query failed. Falling back to mock transfers.")
        except Exception as e:
            logger.error(f"Dune query failed: {e}")
            
        return self._generate_mock_meth_transfers()

    def _generate_mock_dex_trades(self):
        now_ts = int(time.time())
        trades = []
        # Create 40 mock large trades over 30 days
        for i in range(40):
            ts = now_ts - (i * 18 * 3600) # space them out
            trades.append({
                "block_time": time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ts)),
                "sender": "0x1111111111111111111111111111111111111111" if i % 3 == 0 else "0x9d744F795Faa53E3173bAF18783baf51B92b98a5",
                "pool": "USDC/MNT LP",
                "amount_usd": 52000.0 + (i * 2500) if i % 2 == 0 else 12000.0,
                "asset": "MNT/USDT" if i % 2 == 0 else "mETH/USDT",
                "tx_hash": f"0xmockdex{i}..."
            })
        return trades

    def _generate_mock_meth_transfers(self):
        now_ts = int(time.time())
        transfers = []
        for i in range(25):
            ts = now_ts - (i * 28 * 3600)
            transfers.append({
                "block_time": time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ts)),
                "from": "0x2222222222222222222222222222222222222222",
                "to": "0x3333333333333333333333333333333333333333",
                "value_eth": 15.0 + (i * 2.5),
                "tx_hash": f"0xmocktransfer{i}..."
            })
        return transfers
