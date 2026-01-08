"""Service for settings management."""
import sqlite3
from datetime import datetime
from typing import Any, Dict, Optional

from db import get_connection
from dtos.setting import SettingUpdate
from exceptions import ValidationError


def get_setting_by_key(key: str) -> Optional[Dict[str, Any]]:
    """Get a single setting by key.

    Args:
        key: Setting key to retrieve

    Returns:
        Setting dictionary or None if not found
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, key, value, created_at, updated_at FROM settings WHERE key = ?",
        (key,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_sizeable_item_threshold() -> float:
    """Get the sizeable item threshold as a float.

    Returns:
        Threshold value as float, defaults to 100.0 if not found
    """
    setting = get_setting_by_key("sizeable_item_threshold")
    if setting is None:
        return 100.0  # Default fallback
    try:
        return float(setting["value"])
    except (ValueError, KeyError):
        return 100.0


def update_setting(key: str, entry_update: SettingUpdate) -> Optional[Dict[str, Any]]:
    """Update a setting value.

    Args:
        key: Setting key to update
        entry_update: New setting value

    Returns:
        Updated setting dictionary or None if not found

    Raises:
        ValidationError: If setting not found or value invalid
    """
    existing = get_setting_by_key(key)
    if existing is None:
        raise ValidationError(f"Setting with key '{key}' not found")

    # For sizeable_item_threshold, validate it's a valid decimal
    if key == "sizeable_item_threshold":
        try:
            threshold = float(entry_update.value)
            if threshold < 0:
                raise ValidationError("Sizeable item threshold must be >= 0")
        except ValueError:
            raise ValidationError("Sizeable item threshold must be a valid number")

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    cursor.execute(
        "UPDATE settings SET value = ?, updated_at = ? WHERE key = ?",
        (entry_update.value, updated_at, key),
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()

    if updated:
        return {
            "id": existing["id"],
            "key": key,
            "value": entry_update.value,
            "created_at": existing["created_at"],
            "updated_at": updated_at,
        }
    return None
