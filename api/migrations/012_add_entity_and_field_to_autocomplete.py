"""Migration to add entity and field columns to autocomplete_suggestions table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Add entity and field columns to autocomplete_suggestions table."""
    # Check if autocomplete_suggestions table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='autocomplete_suggestions'
    """)
    if not cursor.fetchone():
        print("Migration 012: Skipped - autocomplete_suggestions table does not exist")
        return
    
    # Add entity column if it doesn't exist
    try:
        cursor.execute("""
            ALTER TABLE autocomplete_suggestions
            ADD COLUMN entity TEXT
        """)
        print("Migration 012: Added entity column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Migration 012: entity column already exists")
        else:
            raise
    
    # Add field column if it doesn't exist
    try:
        cursor.execute("""
            ALTER TABLE autocomplete_suggestions
            ADD COLUMN field TEXT
        """)
        print("Migration 012: Added field column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Migration 012: field column already exists")
        else:
            raise
    
    # Create indexes for the new columns
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_entity
        ON autocomplete_suggestions(entity)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_entity_field
        ON autocomplete_suggestions(entity, field)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_entity_field_value
        ON autocomplete_suggestions(entity, field, value)
    """)
    
    print("Migration 012: Created indexes for entity and field columns")

