"""Migration to create old projects and project_contributions tables."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create old projects table schema with UNIQUE constraint on savings_account_name."""
    # Create projects table (old schema)
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
    
    print("Migration 004: Created old projects and project_contributions tables")

