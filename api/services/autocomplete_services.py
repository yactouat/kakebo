import sqlite3
from datetime import datetime
from typing import List

from db import get_connection


def get_autocomplete_suggestions(entity: str, field: str, limit: int = 10) -> List[str]:
    """Get autocomplete suggestions for an entity and field, ordered by usage frequency and recency.
    
    Args:
        entity: The entity name (e.g., "actual_expense_entries", "projects")
        field: The field name (e.g., "item", "name")
        limit: Maximum number of suggestions to return (default: 10)
    
    Returns:
        List of suggestion values, ordered by usage_count DESC, then last_used_at DESC
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT value
        FROM autocomplete_suggestions
        WHERE entity = ? AND field = ?
        ORDER BY usage_count DESC, last_used_at DESC, value COLLATE NOCASE
        LIMIT ?
    """, (entity, field, limit))
    
    suggestions = [row["value"] for row in cursor.fetchall()]
    conn.close()
    return suggestions


def save_autocomplete_suggestion(entity: str, field: str, value: str) -> None:
    """Save or update an autocomplete suggestion.
    
    If the suggestion already exists, increment its usage_count and update last_used_at.
    Otherwise, create a new suggestion.
    
    Args:
        entity: The entity name (e.g., "actual_expense_entries", "projects")
        field: The field name (e.g., "item", "name")
        value: The suggestion value
    """
    if not value or not value.strip():
        return
    
    value = value.strip()
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if suggestion already exists
    cursor.execute("""
        SELECT id, usage_count
        FROM autocomplete_suggestions
        WHERE entity = ? AND field = ? AND value = ?
    """, (entity, field, value))
    
    existing = cursor.fetchone()
    
    if existing:
        # Update existing suggestion
        new_usage_count = existing[1] + 1
        cursor.execute("""
            UPDATE autocomplete_suggestions
            SET usage_count = ?, last_used_at = ?
            WHERE id = ?
        """, (new_usage_count, datetime.now().isoformat(), existing[0]))
    else:
        # Create new suggestion
        # Generate field_path for backward compatibility (can be removed later)
        field_path = f"{entity}.{field}"
        cursor.execute("""
            INSERT INTO autocomplete_suggestions (entity, field, field_path, value, usage_count, last_used_at)
            VALUES (?, ?, ?, ?, 1, ?)
        """, (entity, field, field_path, value, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

