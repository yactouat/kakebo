"""Migration to create autocomplete_suggestions table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create autocomplete_suggestions table."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS autocomplete_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            field_path TEXT NOT NULL,
            value TEXT NOT NULL,
            usage_count INTEGER NOT NULL DEFAULT 1,
            last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(field_path, value)
        )
    """)
    
    # Create indexes for performance
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_field_path
        ON autocomplete_suggestions(field_path)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_field_path_value
        ON autocomplete_suggestions(field_path, value)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_usage_count
        ON autocomplete_suggestions(usage_count DESC)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_autocomplete_last_used_at
        ON autocomplete_suggestions(last_used_at DESC)
    """)
    
    print("Migration 010: Created autocomplete_suggestions table with indexes")

