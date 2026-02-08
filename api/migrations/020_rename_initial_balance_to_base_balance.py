"""Migration to rename savings_accounts.initial_balance to base_balance.

Clarifies semantics: base_balance is the snapshot of your real-world account
balance when you first add the account; current balance = base_balance + SUM(contributions).
Idempotent: skips if column was already renamed (e.g. on re-run or different env).
"""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Rename initial_balance to base_balance in savings_accounts if present."""
    cursor.execute("PRAGMA table_info(savings_accounts)")
    columns = [row[1] for row in cursor.fetchall()]
    if "initial_balance" not in columns:
        print("Migration 020: Skipped - initial_balance column does not exist (already renamed or table has base_balance)")
        return
    cursor.execute(
        "ALTER TABLE savings_accounts RENAME COLUMN initial_balance TO base_balance"
    )
    print("Migration 020: Renamed savings_accounts.initial_balance to base_balance")
