import sqlite3

DB_PATH = "kakebo.db"


def get_connection():
    """Get a database connection."""
    return sqlite3.connect(DB_PATH)


def init_db():
    """Initialize SQLite database and create tables if they don't exist."""
    # Create database file if it doesn't exist
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create income_entries table matching IncomeEntry model
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS income_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            item TEXT NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR'
        )
    """)
    
    # Migration: Add currency column if it doesn't exist (for existing databases)
    cursor.execute("""
        SELECT COUNT(*) FROM pragma_table_info('income_entries') WHERE name='currency'
    """)
    has_currency = cursor.fetchone()[0] > 0
    
    if not has_currency:
        cursor.execute("""
            ALTER TABLE income_entries ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR'
        """)
        print("Migration: Added currency column to income_entries table")
    
    conn.commit()
    conn.close()
    print(f"Database initialized: {DB_PATH}")

