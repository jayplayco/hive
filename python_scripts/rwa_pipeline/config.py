"""Pipeline configuration — loaded from environment variables."""

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TokenConfig:
    symbol: str
    contract_address: str
    decimals: int
    chainlink_por_feed: Optional[str] = None  # Proof-of-Reserve feed address


@dataclass
class Config:
    # ── Ethereum RPC ─────────────────────────────────────────────────────────
    eth_rpc_url: str = field(
        default_factory=lambda: os.environ.get(
            "ETH_RPC_URL", "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
        )
    )

    # ── API keys ──────────────────────────────────────────────────────────────
    etherscan_api_key: str = field(
        default_factory=lambda: os.environ.get("ETHERSCAN_API_KEY", "")
    )
    alpha_vantage_api_key: str = field(
        default_factory=lambda: os.environ.get("ALPHA_VANTAGE_API_KEY", "")
    )
    # AllTick is the fallback gold-price source when Alpha Vantage is unavailable.
    alltick_api_key: str = field(
        default_factory=lambda: os.environ.get("ALLTICK_API_KEY", "")
    )

    # ── PostgreSQL ────────────────────────────────────────────────────────────
    db_dsn: str = field(
        default_factory=lambda: os.environ.get(
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/rwa_pipeline",
        )
    )

    # ── Token registry ────────────────────────────────────────────────────────
    tokens: list = field(
        default_factory=lambda: [
            TokenConfig(
                symbol="PAXG",
                contract_address="0x45804880De22913dAFE09f4980848ECE6EcbAf78",
                decimals=18,
                # Chainlink PAXG/ETH PoR feed (Ethereum mainnet)
                chainlink_por_feed="0x54a0A96C41f77B1Bb92e21d6Ad69Bd7c7b70F94c",
            ),
            TokenConfig(
                symbol="XAUT",
                contract_address="0x68749665FF8D2d112Fa859AA293F07A622782F38",
                decimals=6,
                # Chainlink XAUT PoR feed (Ethereum mainnet)
                chainlink_por_feed="0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6",
            ),
            TokenConfig(
                symbol="AGX",
                contract_address=os.environ.get("AGX_CONTRACT_ADDRESS", ""),
                decimals=18,
                chainlink_por_feed=None,  # custom token — PoR not yet deployed
            ),
        ]
    )

    # ── Weekend detection (CMX closure window) ────────────────────────────────
    # CMX closes Friday 17:00 EST → reopens Sunday 18:00 EST.
    weekend_close_hour_est: int = 17   # Friday
    weekend_open_hour_est: int = 18    # Sunday

    # ── Scheduling ────────────────────────────────────────────────────────────
    poll_interval_seconds: int = int(
        os.environ.get("POLL_INTERVAL_SECONDS", "300")  # 5 min default
    )


# Module-level singleton
config = Config()
