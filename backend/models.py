from sqlalchemy import Column, String, Integer, BigInteger, Boolean
from database import Base

class WinGoResult(Base):
    __tablename__ = "wingo_results"

    timer_type = Column(String, primary_key=True) # "30S" or "1M"
    issue = Column(String, primary_key=True, index=True)
    num = Column(Integer)
    source_time = Column(BigInteger, nullable=True)

class EngineState(Base):
    __tablename__ = "engine_state"
    id = Column(Integer, primary_key=True)
    timer_type = Column(String, unique=True, index=True) # "30S" or "1M"
    bs_level = Column(Integer, default=1)
    rg_level = Column(Integer, default=1)
    bs_shield_cooldown = Column(Integer, default=0)
    rg_shield_cooldown = Column(Integer, default=0)
    bs_shield_armed = Column(Boolean, default=True)
    rg_shield_armed = Column(Boolean, default=True)
    bs_shield_recovery = Column(Boolean, default=False)
    rg_shield_recovery = Column(Boolean, default=False)
    gaps = Column(Integer, default=0)
    missed_rounds = Column(Integer, default=0)
    last_issue = Column(String, nullable=True)
    fresh_baseline_issue = Column(String, nullable=True)

class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    timer_type = Column(String, index=True)
    period = Column(String)
    prediction = Column(String)
    bs_pred = Column(String, nullable=True)
    rg_pred = Column(String, nullable=True)
    actual_side = Column(String, nullable=True)
    actual_colour = Column(String, nullable=True)
    num = Column(Integer)
    bs_status = Column(String)
    rg_status = Column(String)
    bs_layer = Column(String)
    rg_layer = Column(String)
    bs_quality = Column(String)
    rg_quality = Column(String)
    time = Column(BigInteger)
    feed_time = Column(BigInteger, nullable=True)

class PendingPrediction(Base):
    __tablename__ = "pending_predictions"
    timer_type = Column(String, primary_key=True)
    issue = Column(String, primary_key=True)
    source_issue = Column(String)
    bs_pred = Column(String, nullable=True)
    rg_pred = Column(String, nullable=True)
    bs_layer = Column(String)
    rg_layer = Column(String)
    bs_quality = Column(String)
    rg_quality = Column(String)
    created_at = Column(BigInteger)

class SyncQueue(Base):
    __tablename__ = "sync_queue"
    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String, index=True)    # "wingo_results", "prediction_logs", etc.
    operation = Column(String)                 # "INSERT", "UPDATE", "DELETE"
    record_data = Column(String)               # JSON-serialized row data
    created_at = Column(BigInteger)
