import sqlite3
import importlib
import os
from pathlib import Path

DB_PATH = "kakebo.db"


def get_connection():
    """Get a database connection."""
    return sqlite3.connect(DB_PATH)


def run_migrations():
    """Run all migrations in order."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get migrations directory
    migrations_dir = Path(__file__).parent / "migrations"
    
    # Get all migration files sorted by number
    migration_files = sorted(
        [f for f in os.listdir(migrations_dir) if f.startswith("0") and f.endswith(".py")],
        key=lambda x: int(x.split("_")[0])
    )
    
    # Run each migration
    for migration_file in migration_files:
        module_name = f"migrations.{migration_file[:-3]}"  # Remove .py extension
        try:
            # Import the migration module
            # Try relative import first, then absolute
            try:
                if __package__:
                    module = importlib.import_module(f".{module_name}", package=__package__)
                else:
                    raise ImportError("No package context")
            except (ImportError, ValueError):
                # Fallback to absolute import
                import sys
                api_dir = str(Path(__file__).parent)
                if api_dir not in sys.path:
                    sys.path.insert(0, api_dir)
                module = importlib.import_module(module_name)
            
            if hasattr(module, "up"):
                module.up(cursor)
        except Exception as e:
            print(f"Error running migration {migration_file}: {e}")
            raise
    
    conn.commit()
    conn.close()


def init_db():
    """Initialize SQLite database and run migrations."""
    # Create database file if it doesn't exist
    conn = sqlite3.connect(DB_PATH)
    conn.close()
    
    # Run all migrations in order
    run_migrations()
    
    print(f"Database initialized: {DB_PATH}")

