from sqlalchemy import (
    Column, Integer, BigInteger, Float, Text, Date, DateTime,
    UniqueConstraint, Index, func,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class SectorPrice(Base):
    __tablename__ = "sector_prices"

    id = Column(Integer, primary_key=True)
    ticker = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(BigInteger)
    pct_change = Column(Float)  # daily return vs previous close

    __table_args__ = (
        UniqueConstraint("ticker", "date", name="uq_sector_prices_ticker_date"),
        Index("idx_sector_prices_date", "date"),
    )


class EtfFlow(Base):
    __tablename__ = "etf_flows"

    id = Column(Integer, primary_key=True)
    ticker = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    flow_usd = Column(BigInteger)   # positive = inflow, negative = outflow (cents)
    aum_usd = Column(BigInteger)    # cents
    source = Column(Text)

    __table_args__ = (
        UniqueConstraint("ticker", "date", name="uq_etf_flows_ticker_date"),
    )


class FearIndex(Base):
    __tablename__ = "fear_indexes"

    id = Column(Integer, primary_key=True)
    symbol = Column(Text, nullable=False)  # VIX / VVIX / SKEW / PUT_CALL
    date = Column(Date, nullable=False)
    value = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("symbol", "date", name="uq_fear_indexes_symbol_date"),
        Index("idx_fear_indexes_date", "date"),
    )


class CrawlState(Base):
    __tablename__ = "crawl_state"

    source = Column(Text, primary_key=True)  # yfinance / cboe / etf_flow
    last_date = Column(Date)
    last_run_at = Column(DateTime, server_default=func.now())
    last_error = Column(Text)
