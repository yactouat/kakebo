"""Migration to drop old projects and project_contributions tables."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Drop old projects-related tables if they exist."""
    # Check if projects table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name='projects'
    """)
    projects_table_exists = cursor.fetchone() is not None

    if projects_table_exists:
        # Drop project_contributions table first (due to foreign key)
        cursor.execute("DROP TABLE IF EXISTS project_contributions")
        print("Migration 006: Dropped project_contributions table")

        # Drop projects table
        cursor.execute("DROP TABLE IF EXISTS projects")
        print("Migration 006: Dropped projects table")

