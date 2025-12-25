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
    
    # Create fixed_expense_entries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fixed_expense_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            item TEXT NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            month INTEGER NOT NULL,
            year INTEGER NOT NULL
        )
    """)
    
    # Migration: Add month and year columns if they don't exist (for existing databases)
    cursor.execute("""
        SELECT COUNT(*) FROM pragma_table_info('fixed_expense_entries') WHERE name='month'
    """)
    has_month = cursor.fetchone()[0] > 0
    
    if not has_month:
        # Get current month and year
        from datetime import datetime
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Add columns (SQLite will set DEFAULT for existing rows)
        cursor.execute("""
            ALTER TABLE fixed_expense_entries ADD COLUMN month INTEGER
        """)
        cursor.execute("""
            ALTER TABLE fixed_expense_entries ADD COLUMN year INTEGER
        """)
        
        # Update existing rows with current month/year
        cursor.execute("""
            UPDATE fixed_expense_entries SET month = ?, year = ? WHERE month IS NULL OR year IS NULL
        """, (current_month, current_year))
        
        print("Migration: Added month and year columns to fixed_expense_entries table")
    
    conn.commit()
    conn.close()
    print(f"Database initialized: {DB_PATH}")

