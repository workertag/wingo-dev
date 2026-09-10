import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import WinGoResult, EngineState, PredictionLog, PendingPrediction, Base

load_dotenv()

def migrate():
    print("Starting migration from PostgreSQL to SQLite...")
    PG_URL = os.getenv("DATABASE_URL")
    if PG_URL and PG_URL.startswith("postgres://"):
        PG_URL = PG_URL.replace("postgres://", "postgresql://", 1)
        
    if not PG_URL:
        print("DATABASE_URL not found in environment.")
        return
        
    pg_engine = create_engine(PG_URL)
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()
    
    SQLITE_URL = "sqlite:///./wingo.db"
    sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=sqlite_engine)
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_db = SqliteSession()
    
    MODELS = [WinGoResult, EngineState, PredictionLog, PendingPrediction]
    
    for model in MODELS:
        print(f"Migrating table: {model.__tablename__}...")
        records = pg_db.query(model).all()
        print(f"  Found {len(records)} records in PostgreSQL.")
        
        count = 0
        for record in records:
            pg_db.expunge(record)
            sqlite_db.merge(record)
            count += 1
            if count % 1000 == 0:
                sqlite_db.commit()
                print(f"  Migrated {count} records...")
                
        sqlite_db.commit()
        print(f"  Finished {model.__tablename__}. Total migrated: {count}")
        
    sqlite_db.close()
    pg_db.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
