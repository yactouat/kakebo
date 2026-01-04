"""Migration to create new projects table with updated schema."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create new projects table with different schema and indexes."""
    # Create new projects table with different schema
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            target_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            savings_account_id INTEGER,
            currency TEXT NOT NULL DEFAULT 'EUR',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT,
            FOREIGN KEY (savings_account_id) REFERENCES savings_accounts(id) ON DELETE SET NULL
        )
    """)

    # Create indexes for projects
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_projects_status
        ON projects(status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_projects_savings_account_id
        ON projects(savings_account_id)
    """)
    
    print("Migration 008: Created new projects table with updated schema and indexes")

