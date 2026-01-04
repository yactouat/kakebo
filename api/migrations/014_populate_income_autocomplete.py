"""Migration to populate autocomplete_suggestions from existing income entries."""
import sqlite3
from datetime import datetime


def up(cursor: sqlite3.Cursor):
    """Populate autocomplete_suggestions with existing items from income_entries if empty."""
    entity = 'income_entries'
    field = 'item'
    field_path = f'{entity}.{field}'
    
    # Check if autocomplete_suggestions table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='autocomplete_suggestions'
    """)
    if not cursor.fetchone():
        print("Migration 014: Skipped - autocomplete_suggestions table does not exist")
        return
    
    # Check if entity and field columns exist
    cursor.execute("PRAGMA table_info(autocomplete_suggestions)")
    columns = [row[1] for row in cursor.fetchall()]
    has_entity_field = 'entity' in columns and 'field' in columns
    
    # Check if there are any existing suggestions for this entity and field
    if has_entity_field:
        cursor.execute("""
            SELECT COUNT(*) FROM autocomplete_suggestions
            WHERE entity = ? AND field = ?
        """, (entity, field))
    else:
        # Fallback to field_path if entity/field columns don't exist
        cursor.execute("""
            SELECT COUNT(*) FROM autocomplete_suggestions
            WHERE field_path = ?
        """, (field_path,))
    
    existing_count = cursor.fetchone()[0]
    
    if existing_count > 0:
        print(f"Migration 014: Skipped - {existing_count} suggestions already exist for {entity}.{field}")
        return
    
    # Check if income_entries table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='income_entries'
    """)
    if not cursor.fetchone():
        print("Migration 014: Skipped - income_entries table does not exist")
        return
    
    # Get all distinct items from income_entries with their usage counts
    cursor.execute("""
        SELECT item, COUNT(*) as count
        FROM income_entries
        WHERE item IS NOT NULL AND item != ''
        GROUP BY item
        ORDER BY count DESC, item ASC
    """)
    items = cursor.fetchall()
    
    if not items:
        print("Migration 014: No items found in income_entries to populate")
        return
    
    # Insert items into autocomplete_suggestions
    now = datetime.now().isoformat()
    inserted_count = 0
    
    for item, count in items:
        item = item.strip()
        if not item:
            continue
            
        try:
            if has_entity_field:
                # Use entity and field columns (preferred)
                cursor.execute("""
                    INSERT INTO autocomplete_suggestions (entity, field, field_path, value, usage_count, last_used_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (entity, field, field_path, item, count, now, now))
            else:
                # Fallback to field_path only (for backward compatibility)
                cursor.execute("""
                    INSERT INTO autocomplete_suggestions (field_path, value, usage_count, last_used_at, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (field_path, item, count, now, now))
            inserted_count += 1
        except sqlite3.IntegrityError:
            # Skip if duplicate (shouldn't happen since we checked, but just in case)
            continue
    
    print(f"Migration 014: Populated {inserted_count} autocomplete suggestions from existing income_entries")

