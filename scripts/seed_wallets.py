#!/usr/bin/env python3
"""
MANTLEYE — Smart Money Wallet Seeder

Bootstraps a list of known smart money wallets on Mantle Network
with initial scoring data for the wallet tracker.

Usage:
    python scripts/seed_wallets.py
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mantleye:mantleye_pass@localhost:5432/mantleye")

# Known smart money wallets on Mantle (mix of real format addresses)
SMART_WALLETS = [
    {"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16", "label": "Alpha Whale #1"},
    {"address": "0x8894E0a0c962CB723c1ef8a1588E0A37b56dc9F3", "label": "DeFi Strategist"},
    {"address": "0x1aE0EA34a72D944a8C7603FFB3eC30a6669E454C", "label": "Merchant Moe LP King"},
    {"address": "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", "label": "Agni Arbitrageur"},
    {"address": "0xDef1C0ded9bec7F1a1670819833240f027b25EfF", "label": "MEV Bot Alpha"},
    {"address": "0x28C6c06298d514Db089934071355E5743bf21d60", "label": "Institutional Desk"},
    {"address": "0x56Eddb7aa87536c09CCc2793473599fD21A8b17F", "label": "Yield Optimizer"},
    {"address": "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549", "label": "Smart LP Provider"},
    {"address": "0x6B175474E89094C44Da98b954EedeAC495271d0F", "label": "Mantle OG"},
    {"address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "label": "Stablecoin Whale"},
    {"address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "label": "Gas Optimizer"},
    {"address": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", "label": "Token Sniper"},
    {"address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", "label": "Cross-Chain Arb"},
    {"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7", "label": "Momentum Trader"},
    {"address": "0x514910771AF9Ca656af840dff83E8264EcF986CA", "label": "Data-Driven Alpha"},
    {"address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "label": "Governance Player"},
    {"address": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", "label": "Lending Strategist"},
    {"address": "0xD533a949740bb3306d119CC777fa900bA034cd52", "label": "Curve Farmer"},
    {"address": "0xba100000625a3754423978a60c9317c58a424e3D", "label": "DEX Aggregator"},
    {"address": "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", "label": "Vault Strategist"},
    {"address": "0x853d955aCEf822Db058eb8505911ED77F175b99e", "label": "Stablecoin Arb"},
    {"address": "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B", "label": "Protocol Insider"},
    {"address": "0xc00e94Cb662C3520282E6f5717214004A7f26888", "label": "Compound Whale"},
    {"address": "0x111111111117dC0aa78b770fA6A738034120C302", "label": "1inch Arbitrageur"},
    {"address": "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", "label": "SushiSwap OG"},
    {"address": "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", "label": "Synthetix Trader"},
    {"address": "0x0D8775F648430679A709E98d2b0Cb6250d2887EF", "label": "BAT Accumulator"},
    {"address": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", "label": "MKR Governor"},
    {"address": "0xE41d2489571d322189246DaFA5ebDe1F4699F498", "label": "ZRX Market Maker"},
    {"address": "0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD", "label": "Loopring Pro"},
    {"address": "0x408e41876cCCDC0F92210600ef50372656052a38", "label": "REN Bridge Bot"},
    {"address": "0x1985365e9f78359a9B6AD760e32412f4a445E862", "label": "Augur Predictor"},
    {"address": "0xdd974D5C2e2928deA5F71b9825b8b646686BD200", "label": "KNC Staker"},
    {"address": "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942", "label": "MANA Collector"},
    {"address": "0x4Fabb145d64652a948d72533023f6E7A623C7C53", "label": "BUSD Deployer"},
    {"address": "0x45804880De22913dAFE09f4980848ECE6EcbAf78", "label": "Gold Token OG"},
    {"address": "0x8E870D67F660D95d5be530380D0eC0bd388289E1", "label": "PAX Whale"},
    {"address": "0x0000000000085d4780B73119b644AE5ecd22b376", "label": "TUSD Arbitrageur"},
    {"address": "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd", "label": "GUSD Strategist"},
    {"address": "0xA4e8C3Ec456107eA67d3075bF9e3DF3A75823DB0", "label": "Loom Network"},
    {"address": "0x4691937a7508860F876c9c0a2a617E7d9E945D4B", "label": "WOO Trader"},
    {"address": "0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA", "label": "GALA Gamer"},
    {"address": "0xf629cBd94d3791C9250152BD8dfBDF380E2a3B9c", "label": "ENJ Collector"},
    {"address": "0x3845badAde8e6dFF049820680d1F14bD3903a5d0", "label": "SAND Builder"},
    {"address": "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b", "label": "AXS Gamer"},
    {"address": "0x4d224452801ACEd8B2F0aebE155379bb5D594381", "label": "APE Degen"},
    {"address": "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39", "label": "HEX Staker"},
    {"address": "0x3506424F91fD33084466F402d5D97f05F8e3b4AF", "label": "CHZ Fan Token"},
    {"address": "0x0b38210ea11411557c13457D4dA7dC6ea731B88a", "label": "API3 Oracle"},
    {"address": "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32", "label": "Lido Staker"},
]


def generate_wallet_stats() -> dict:
    """Generate realistic wallet statistics."""
    win_rate = round(random.uniform(45, 95), 2)
    avg_return = round(random.uniform(-5, 30), 4)
    total_volume = round(random.uniform(10_000, 50_000_000), 2)
    trade_count = random.randint(20, 2000)
    recency_score = round(random.uniform(0, 100), 2)

    # Higher win rate and volume → higher overall score
    overall_score = round(
        0.4 * win_rate +
        0.3 * min(max(avg_return * 4, 0), 100) +
        0.2 * recency_score +
        0.1 * min(total_volume / 500_000, 100),
        2
    )

    last_active = datetime.utcnow() - timedelta(
        hours=random.randint(0, 168),
        minutes=random.randint(0, 59)
    )

    return {
        "win_rate": win_rate,
        "avg_return": avg_return,
        "total_volume": total_volume,
        "trade_count": trade_count,
        "recency_score": recency_score,
        "overall_score": min(overall_score, 100),
        "last_active": last_active,
    }


def seed_wallets():
    """Seed smart money wallets into the database."""
    print("=" * 50)
    print("MANTLEYE — Smart Money Wallet Seeder")
    print("=" * 50)
    print(f"\nSeeding {len(SMART_WALLETS)} wallets...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        inserted = 0
        skipped = 0

        for wallet in SMART_WALLETS:
            stats = generate_wallet_stats()

            try:
                cursor.execute("""
                    INSERT INTO wallets (address, label, win_rate, avg_return, total_volume,
                                        trade_count, recency_score, overall_score, last_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (address) DO UPDATE SET
                        label = EXCLUDED.label,
                        win_rate = EXCLUDED.win_rate,
                        avg_return = EXCLUDED.avg_return,
                        total_volume = EXCLUDED.total_volume,
                        trade_count = EXCLUDED.trade_count,
                        recency_score = EXCLUDED.recency_score,
                        overall_score = EXCLUDED.overall_score,
                        last_active = EXCLUDED.last_active,
                        updated_at = NOW()
                """, (
                    wallet["address"],
                    wallet["label"],
                    stats["win_rate"],
                    stats["avg_return"],
                    stats["total_volume"],
                    stats["trade_count"],
                    stats["recency_score"],
                    stats["overall_score"],
                    stats["last_active"],
                ))
                inserted += 1
            except Exception as e:
                print(f"  ⚠ Skipped {wallet['address']}: {e}")
                skipped += 1

        conn.commit()
        cursor.close()
        conn.close()

        print(f"\n✅ Seeded {inserted} wallets ({skipped} skipped)")
        print("\nTop wallets by score:")

        # Reconnect to show results
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT address, label, win_rate, overall_score
            FROM wallets ORDER BY overall_score DESC LIMIT 10
        """)
        for row in cursor.fetchall():
            addr = f"{row[0][:6]}...{row[0][-4:]}"
            print(f"  {addr}  {row[1]:<25s} WR: {row[2]:5.1f}%  Score: {row[3]:5.1f}")

        cursor.close()
        conn.close()

    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nRun init_db.py first:")
        print("  python scripts/init_db.py")
        sys.exit(1)


if __name__ == "__main__":
    seed_wallets()
