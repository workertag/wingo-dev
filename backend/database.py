import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# SQLite is always used for the hot path (low latency)
SQLITE_URL = "sqlite:///./wingo.db"
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

# PostgreSQL is used for background sync
PG_URL = os.getenv("DATABASE_URL")
if PG_URL and PG_URL.startswith("postgres://"):
    PG_URL = PG_URL.replace("postgres://", "postgresql://", 1)

pg_engine = create_engine(PG_URL) if PG_URL else None
PgSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine) if pg_engine else None

# engine alias for backward compatibility in main.py where it calls create_all
engine = sqlite_engine

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import time
import json
from sqlalchemy import event

def get_pg_db():
    if not PgSessionLocal:
        raise Exception("PostgreSQL is not configured")
    db = PgSessionLocal()
    try:
        yield db
    finally:
        db.close()

@event.listens_for(SessionLocal, 'before_flush')
def receive_before_flush(session, flush_context, instances):
    from models import SyncQueue
    for obj in list(session.new):
        if isinstance(obj, SyncQueue): continue
        session.add(SyncQueue(
            table_name=obj.__tablename__,
            operation="INSERT",
            record_data=json.dumps({c.name: getattr(obj, c.name) for c in obj.__table__.columns}),
            created_at=int(time.time()*1000)
        ))
    for obj in list(session.dirty):
        if isinstance(obj, SyncQueue): continue
        session.add(SyncQueue(
            table_name=obj.__tablename__,
            operation="UPDATE",
            record_data=json.dumps({c.name: getattr(obj, c.name) for c in obj.__table__.columns}),
            created_at=int(time.time()*1000)
        ))
    for obj in list(session.deleted):
        if isinstance(obj, SyncQueue): continue
        session.add(SyncQueue(
            table_name=obj.__tablename__,
            operation="DELETE",
            record_data=json.dumps({c.name: getattr(obj, c.name) for c in obj.__table__.columns}),
            created_at=int(time.time()*1000)
        ))
