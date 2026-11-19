import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Ensure sqlite directory exists & resolve absolute path
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite"):
    if db_url.startswith("sqlite:////"):
        # Absolute path already (e.g. Docker container /app/data/nusajalur.db)
        pass
    elif db_url.startswith("sqlite:///"):
        rel_path = db_url.replace("sqlite:///", "")
        backend_dir = Path(__file__).resolve().parent.parent.parent
        abs_db_file = (backend_dir / rel_path).resolve()
        abs_db_file.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite:///{abs_db_file.as_posix()}"

# Connect args for SQLite to allow multi-threaded access in FastAPI
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=settings.DEBUG,
)

# Enable WAL mode and optimizations for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
