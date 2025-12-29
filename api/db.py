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
    
    # Create actual_expense_entries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS actual_expense_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            item TEXT NOT NULL,
            category TEXT NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR'
        )
    """)
    
    # Create debt_entries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS debt_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            initial_amount REAL NOT NULL,
            current_balance REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            linked_fixed_expense_id INTEGER,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (linked_fixed_expense_id) REFERENCES fixed_expense_entries(id) ON DELETE SET NULL
        )
    """)
    
    # Create projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            target_amount REAL NOT NULL,
            target_date TEXT NOT NULL,
            priority TEXT NOT NULL,
            category TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            savings_account_name TEXT UNIQUE NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        )
    """)
    
    # Create project_contributions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    """)
    
    # Create index on project_id for performance
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_project_contributions_project_id 
        ON project_contributions(project_id)
    """)
    
    # Migration: Remove UNIQUE constraint on savings_account_name if it exists
    # Check if the projects table exists and has the UNIQUE constraint
    # SQLite doesn't support DROP CONSTRAINT, so we recreate the table if needed
    cursor.execute("""
        SELECT sql FROM sqlite_master 
        WHERE type='table' 
        AND name='projects'
    """)
    table_sql_result = cursor.fetchone()
    
    if table_sql_result and table_sql_result[0]:
        table_sql = table_sql_result[0].upper()
        # Check if UNIQUE constraint exists in the table definition
        # Look for "SAVINGS_ACCOUNT_NAME TEXT UNIQUE" pattern
        has_unique_constraint = 'SAVINGS_ACCOUNT_NAME' in table_sql and 'UNIQUE' in table_sql
        
        if has_unique_constraint:
            # Check if there are any projects to preserve data
            cursor.execute("SELECT COUNT(*) FROM projects")
            project_count = cursor.fetchone()[0]
            
            if project_count > 0:
                # SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
                # First, create a backup of existing data
                cursor.execute("""
                    CREATE TABLE projects_backup AS 
                    SELECT * FROM projects
                """)
                
                # Drop the old table (CASCADE will handle foreign keys in SQLite)
                cursor.execute("DROP TABLE projects")
                
                # Recreate the table without UNIQUE constraint
                cursor.execute("""
                    CREATE TABLE projects (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        target_amount REAL NOT NULL,
                        target_date TEXT NOT NULL,
                        priority TEXT NOT NULL,
                        category TEXT,
                        status TEXT NOT NULL DEFAULT 'active',
                        savings_account_name TEXT NOT NULL,
                        currency TEXT NOT NULL DEFAULT 'EUR',
                        created_at TEXT NOT NULL DEFAULT (datetime('now')),
                        updated_at TEXT
                    )
                """)
                
                # Restore data from backup
                cursor.execute("""
                    INSERT INTO projects 
                    (id, name, description, target_amount, target_date, priority, category, status, savings_account_name, currency, created_at, updated_at)
                    SELECT id, name, description, target_amount, target_date, priority, category, status, savings_account_name, currency, created_at, updated_at
                    FROM projects_backup
                """)
                
                # Update SQLite sequence to prevent ID conflicts
                cursor.execute("SELECT MAX(id) FROM projects")
                max_id_result = cursor.fetchone()
                if max_id_result and max_id_result[0] is not None:
                    max_id = max_id_result[0]
                    cursor.execute("""
                        UPDATE sqlite_sequence 
                        SET seq = ? 
                        WHERE name = 'projects'
                    """, (max_id,))
                    # If no sequence entry exists, create one
                    if cursor.rowcount == 0:
                        cursor.execute("""
                            INSERT INTO sqlite_sequence (name, seq) 
                            VALUES ('projects', ?)
                        """, (max_id,))
                
                # Drop the backup table
                cursor.execute("DROP TABLE projects_backup")
            else:
                # No data to preserve, just recreate the table
                cursor.execute("DROP TABLE projects")
                cursor.execute("""
                    CREATE TABLE projects (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        target_amount REAL NOT NULL,
                        target_date TEXT NOT NULL,
                        priority TEXT NOT NULL,
                        category TEXT,
                        status TEXT NOT NULL DEFAULT 'active',
                        savings_account_name TEXT NOT NULL,
                        currency TEXT NOT NULL DEFAULT 'EUR',
                        created_at TEXT NOT NULL DEFAULT (datetime('now')),
                        updated_at TEXT
                    )
                """)
            
            print("Migration: Removed UNIQUE constraint on savings_account_name in projects table")
    
    conn.commit()
    conn.close()
    print(f"Database initialized: {DB_PATH}")

