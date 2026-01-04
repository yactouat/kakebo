"""Migration to create savings_accounts and contributions tables."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create savings_accounts and contributions tables with indexes."""
    # Create savings_accounts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS savings_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            initial_balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'EUR',
            bank_institution TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        )
    """)

    # Create contributions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            savings_account_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT,
            FOREIGN KEY (savings_account_id) REFERENCES savings_accounts(id) ON DELETE CASCADE
        )
    """)

    # Create indexes for contributions
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_contributions_savings_account_id
        ON contributions(savings_account_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_contributions_date
        ON contributions(date)
    """)
    
    print("Migration 007: Created savings_accounts and contributions tables with indexes")

