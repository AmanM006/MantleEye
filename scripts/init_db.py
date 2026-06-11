#!/usr/bin/env python3
"""
MANTLEYE — Database Initialization Script

Creates all required PostgreSQL tables for the MANTLEYE system.
Run this once before starting services.

Usage:
    python scripts/init_db.py
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mantleye:mantleye_pass@localhost:5432/mantleye")

SCHEMA = """
-- ============================================
-- MANTLEYE Database Schema
-- ============================================

-- Blocks table: raw Mantle block data
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL,
    tx_count INTEGER NOT NULL DEFAULT 0,
    gas_price BIGINT,
    base_fee BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp DESC);

-- Swaps table: DEX swap events
CREATE TABLE IF NOT EXISTS swaps (
    id SERIAL PRIMARY KEY,
    protocol VARCHAR(50) NOT NULL,
    pair VARCHAR(30) NOT NULL,
    amount_in NUMERIC(38, 18) NOT NULL,
    amount_out NUMERIC(38, 18) NOT NULL,
    price NUMERIC(38, 18),
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    sender VARCHAR(42),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_swaps_protocol ON swaps(protocol);
CREATE INDEX IF NOT EXISTS idx_swaps_timestamp ON swaps(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_swaps_tx_hash ON swaps(tx_hash);
CREATE INDEX IF NOT EXISTS idx_swaps_sender ON swaps(sender);

-- Prices table: live price ticks
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    price NUMERIC(38, 8) NOT NULL,
    volume_24h NUMERIC(38, 8),
    change_pct NUMERIC(10, 4),
    timestamp TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) DEFAULT 'bybit',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prices_symbol_time ON prices(symbol, timestamp DESC);

-- Signals table: generated trading signals
CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    asset VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'WATCH')),
    confidence NUMERIC(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning TEXT,
    source VARCHAR(50),
    wallet_address VARCHAR(42),
    tx_hash VARCHAR(66),
    on_chain_proof VARCHAR(66),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_signals_asset ON signals(asset);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence DESC);

-- Wallets table: smart money wallets
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    label VARCHAR(100),
    win_rate NUMERIC(5, 2) DEFAULT 0,
    avg_return NUMERIC(10, 4) DEFAULT 0,
    total_volume NUMERIC(38, 8) DEFAULT 0,
    trade_count INTEGER DEFAULT 0,
    recency_score NUMERIC(5, 2) DEFAULT 0,
    overall_score NUMERIC(5, 2) DEFAULT 0,
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_score ON wallets(overall_score DESC);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES wallets(address),
    tx_hash VARCHAR(66) NOT NULL,
    action VARCHAR(10) NOT NULL,
    asset VARCHAR(20) NOT NULL,
    amount NUMERIC(38, 18),
    price NUMERIC(38, 8),
    timestamp TIMESTAMPTZ NOT NULL,
    pnl NUMERIC(38, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_address ON wallet_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_timestamp ON wallet_transactions(timestamp DESC);

-- Trades table: executed trades
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    asset VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    size NUMERIC(38, 8) NOT NULL,
    entry_price NUMERIC(38, 8) NOT NULL,
    exit_price NUMERIC(38, 8),
    strategy_id VARCHAR(50),
    signal_id INTEGER REFERENCES signals(id),
    bybit_order_id VARCHAR(100),
    mantle_tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED', 'FAILED')),
    pnl NUMERIC(38, 8),
    fees NUMERIC(38, 8) DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trades_asset ON trades(asset);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_id);

-- Anomalies table: detected anomaly events
CREATE TABLE IF NOT EXISTS anomalies (
    id SERIAL PRIMARY KEY,
    protocol VARCHAR(50) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    value NUMERIC(38, 8) NOT NULL,
    z_score NUMERIC(10, 4) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp DESC);

-- Agent status table
CREATE TABLE IF NOT EXISTS agent_status (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'PAUSED' CHECK (status IN ('ACTIVE', 'PAUSED', 'ERROR')),
    started_at TIMESTAMPTZ,
    last_action TEXT,
    last_action_at TIMESTAMPTZ,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    total_pnl NUMERIC(38, 8) DEFAULT 0,
    uptime_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategy config table
CREATE TABLE IF NOT EXISTS strategy_config (
    id SERIAL PRIMARY KEY,
    strategy_type VARCHAR(20) NOT NULL DEFAULT 'momentum',
    max_position_pct NUMERIC(5, 4) DEFAULT 0.10,
    stop_loss_pct NUMERIC(5, 4) DEFAULT 0.03,
    max_drawdown_pct NUMERIC(5, 4) DEFAULT 0.15,
    min_confidence NUMERIC(5, 2) DEFAULT 70.0,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent execution log
CREATE TABLE IF NOT EXISTS agent_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(200) NOT NULL,
    details TEXT,
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_log_timestamp ON agent_log(timestamp DESC);

-- Insert default agent status and strategy config
INSERT INTO agent_status (status) VALUES ('PAUSED') ON CONFLICT DO NOTHING;
INSERT INTO strategy_config (strategy_type) VALUES ('momentum') ON CONFLICT DO NOTHING;
"""


def init_database():
    """Initialize the MANTLEYE database schema."""
    print("=" * 50)
    print("MANTLEYE — Database Initialization")
    print("=" * 50)
    print(f"\nConnecting to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected successfully.\n")
        print("Creating tables...")

        cursor.execute(SCHEMA)

        print("✓ blocks")
        print("✓ swaps")
        print("✓ prices")
        print("✓ signals")
        print("✓ wallets")
        print("✓ wallet_transactions")
        print("✓ trades")
        print("✓ anomalies")
        print("✓ agent_status")
        print("✓ strategy_config")
        print("✓ agent_log")

        print("\n✅ Database initialized successfully!")

        cursor.close()
        conn.close()

    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nMake sure PostgreSQL is running:")
        print("  docker compose up -d postgres")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    init_database()
