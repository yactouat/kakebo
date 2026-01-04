"""Migration to add month and year columns to fixed_expense_entries table."""
import sqlite3
from datetime import datetime


def up(cursor: sqlite3.Cursor):
    """Add month and year columns to fixed_expense_entries if they don't exist."""
    # Check if month column exists
    cursor.execute("""
        SELECT COUNT(*) FROM pragma_table_info('fixed_expense_entries') WHERE name='month'
    """)
    has_month = cursor.fetchone()[0] > 0
    
    if not has_month:
        # Get current month and year
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
        
        print("Migration 003: Added month and year columns to fixed_expense_entries table")

