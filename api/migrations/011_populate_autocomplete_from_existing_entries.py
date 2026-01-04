"""Migration to populate autocomplete_suggestions from existing actual expense entries."""
import sqlite3
from datetime import datetime


def up(cursor: sqlite3.Cursor):
    """Populate autocomplete_suggestions with existing items from actual_expense_entries if empty."""
    field_path = 'actual_expense_entries.item'
    
    # Check if autocomplete_suggestions table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='autocomplete_suggestions'
    """)
    if not cursor.fetchone():
        print("Migration 011: Skipped - autocomplete_suggestions table does not exist")
        return
    
    # Check if there are any existing suggestions for this field_path
    cursor.execute("""
        SELECT COUNT(*) FROM autocomplete_suggestions
        WHERE field_path = ?
    """, (field_path,))
    existing_count = cursor.fetchone()[0]
    
    if existing_count > 0:
        print(f"Migration 011: Skipped - {existing_count} suggestions already exist for {field_path}")
        return
    
    # Check if actual_expense_entries table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='actual_expense_entries'
    """)
    if not cursor.fetchone():
        print("Migration 011: Skipped - actual_expense_entries table does not exist")
        return
    
    # Get all distinct items from actual_expense_entries with their usage counts
    cursor.execute("""
        SELECT item, COUNT(*) as count
        FROM actual_expense_entries
        WHERE item IS NOT NULL AND item != ''
        GROUP BY item
        ORDER BY count DESC, item ASC
    """)
    items = cursor.fetchall()
    
    if not items:
        print("Migration 011: No items found in actual_expense_entries to populate")
        return
    
    # Insert items into autocomplete_suggestions
    now = datetime.now().isoformat()
    inserted_count = 0
    
    for item, count in items:
        item = item.strip()
        if not item:
            continue
            
        try:
            cursor.execute("""
                INSERT INTO autocomplete_suggestions (field_path, value, usage_count, last_used_at, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (field_path, item, count, now, now))
            inserted_count += 1
        except sqlite3.IntegrityError:
            # Skip if duplicate (shouldn't happen since we checked, but just in case)
            continue
    
    print(f"Migration 011: Populated {inserted_count} autocomplete suggestions from existing actual_expense_entries")

