import logging
import json
from database import SessionLocal as SqliteSessionLocal, get_pg_db
from models import SyncQueue, WinGoResult, EngineState, PredictionLog, PendingPrediction

logger = logging.getLogger(__name__)

MODELS = {
    "wingo_results": WinGoResult,
    "engine_state": EngineState,
    "prediction_logs": PredictionLog,
    "pending_predictions": PendingPrediction
}

def sync_to_postgres():
    """Drains the sync queue and pushes to PostgreSQL."""
    try:
        pg_db_generator = get_pg_db()
        pg_db = next(pg_db_generator)
    except Exception as e:
        # Ignore if PG is not configured
        return
        
    sqlite_db = SqliteSessionLocal()
    
    try:
        pending = sqlite_db.query(SyncQueue).order_by(SyncQueue.id.asc()).limit(500).all()
        if not pending:
            return
        
        for entry in pending:
            model_class = MODELS.get(entry.table_name)
            if not model_class:
                continue
                
            row = json.loads(entry.record_data)
            
            if entry.operation in ("INSERT", "UPDATE"):
                # If id is null (like for autoincrement inserts), we must pop it so PG handles it correctly
                if "id" in row and row["id"] is None:
                    row.pop("id")
                    
                obj = model_class(**row)
                pg_db.merge(obj)
            elif entry.operation == "DELETE":
                # Extract primary key values
                pk_names = [key.name for key in model_class.__mapper__.primary_key]
                pk_vals = tuple(row[name] for name in pk_names)
                obj = pg_db.query(model_class).get(pk_vals)
                if obj:
                    pg_db.delete(obj)
                    
        pg_db.commit()
        
        # Only delete from queue after successful PG commit
        ids = [e.id for e in pending]
        sqlite_db.query(SyncQueue).filter(SyncQueue.id.in_(ids)).delete(synchronize_session=False)
        sqlite_db.commit()
        
    except Exception as e:
        pg_db.rollback()
        logger.warning(f"PG sync failed (will retry): {e}")
    finally:
        sqlite_db.close()
        pg_db.close()
