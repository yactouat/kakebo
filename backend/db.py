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
            item TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"Database initialized: {DB_PATH}")

