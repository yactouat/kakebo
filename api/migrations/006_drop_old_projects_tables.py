"""Migration to drop old projects and project_contributions tables."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Drop old projects-related tables if they exist and have the old schema."""
    # Check if projects table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name='projects'
    """)
    projects_table_exists = cursor.fetchone() is not None

    if projects_table_exists:
        # Check if the table has the old schema by looking for savings_account_name column
        # Old schema has savings_account_name, new schema has savings_account_id
        cursor.execute("PRAGMA table_info(projects)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]  # Column name is at index 1
        
        has_old_schema = 'savings_account_name' in column_names
        
        if has_old_schema:
            # This is the old schema, safe to drop
            # Drop project_contributions table first (due to foreign key)
            cursor.execute("DROP TABLE IF EXISTS project_contributions")
            print("Migration 006: Dropped project_contributions table")

            # Drop old projects table
            cursor.execute("DROP TABLE IF EXISTS projects")
            print("Migration 006: Dropped old projects table (old schema detected)")
        else:
            # This is the new schema, don't drop it
            print("Migration 006: Skipped - projects table already has new schema")

