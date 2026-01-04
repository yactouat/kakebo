"""Migration to add currency column to income_entries table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Add currency column to income_entries if it doesn't exist."""
    # Check if currency column exists
    cursor.execute("""
        SELECT COUNT(*) FROM pragma_table_info('income_entries') WHERE name='currency'
    """)
    has_currency = cursor.fetchone()[0] > 0
    
    if not has_currency:
        cursor.execute("""
            ALTER TABLE income_entries ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR'
        """)
        print("Migration 002: Added currency column to income_entries table")

