"""Migration to create settings table for global application settings."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create settings table if it doesn't exist."""
    # Check if settings table exists
    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='settings'
    """)
    has_settings = cursor.fetchone()[0] > 0

    if not has_settings:
        cursor.execute("""
            CREATE TABLE settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT
            )
        """)

        # Create index for fast key lookup
        cursor.execute("""
            CREATE INDEX idx_settings_key
            ON settings(key)
        """)

        # Insert default sizeable_item_threshold setting
        cursor.execute("""
            INSERT INTO settings (key, value)
            VALUES ('sizeable_item_threshold', '100.00')
        """)

        print("Migration 016: Created settings table with default threshold")
    else:
        print("Migration 016: Settings table already exists, skipping")
