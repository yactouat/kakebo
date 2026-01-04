"""Migration to remove UNIQUE constraint on savings_account_name in projects table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Remove UNIQUE constraint on savings_account_name if it exists."""
    # Check if the projects table exists and has the UNIQUE constraint
    cursor.execute("""
        SELECT sql FROM sqlite_master 
        WHERE type='table' 
        AND name='projects'
    """)
    table_sql_result = cursor.fetchone()
    
    if table_sql_result and table_sql_result[0]:
        table_sql = table_sql_result[0].upper()
        # Check if UNIQUE constraint exists in the table definition
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
            
            print("Migration 005: Removed UNIQUE constraint on savings_account_name in projects table")

