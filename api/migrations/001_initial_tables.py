"""Initial table creation migration."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create initial tables."""
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
    
    print("Migration 001: Created initial tables (income_entries, fixed_expense_entries, actual_expense_entries, debt_entries)")

