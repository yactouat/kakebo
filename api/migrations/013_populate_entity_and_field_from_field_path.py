"""Migration to populate entity and field columns from existing field_path values."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Populate entity and field columns from existing field_path values."""
    # Check if autocomplete_suggestions table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='autocomplete_suggestions'
    """)
    if not cursor.fetchone():
        print("Migration 013: Skipped - autocomplete_suggestions table does not exist")
        return
    
    # Check if entity and field columns exist
    cursor.execute("PRAGMA table_info(autocomplete_suggestions)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'entity' not in columns or 'field' not in columns:
        print("Migration 013: Skipped - entity or field columns do not exist. Run migration 012 first.")
        return
    
    # Get all distinct field_path values
    cursor.execute("""
        SELECT DISTINCT field_path
        FROM autocomplete_suggestions
        WHERE field_path IS NOT NULL AND field_path != ''
    """)
    field_paths = cursor.fetchall()
    
    if not field_paths:
        print("Migration 013: No field_path values found to process")
        return
    
    updated_count = 0
    
    for (field_path,) in field_paths:
        # Parse field_path to extract entity and field
        # Format is typically: "entity.field" (e.g., "actual_expense_entries.item")
        if '.' in field_path:
            parts = field_path.split('.', 1)
            entity = parts[0]
            field = parts[1]
        else:
            # Fallback: if no dot, use the whole field_path as entity and empty field
            entity = field_path
            field = ''
        
        # Update all rows with this field_path
        cursor.execute("""
            UPDATE autocomplete_suggestions
            SET entity = ?, field = ?
            WHERE field_path = ? AND (entity IS NULL OR field IS NULL)
        """, (entity, field, field_path))
        
        updated_count += cursor.rowcount
    
    print(f"Migration 013: Populated entity and field columns for {updated_count} autocomplete suggestions")

