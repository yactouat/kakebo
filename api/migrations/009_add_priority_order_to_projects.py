"""Migration to add priority_order column to projects table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Add priority_order column to projects table with UNIQUE constraint."""
    # Check if column already exists
    cursor.execute("PRAGMA table_info(projects)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'priority_order' not in columns:
        # Add priority_order column (temporarily nullable)
        cursor.execute("""
            ALTER TABLE projects
            ADD COLUMN priority_order INTEGER
        """)
        
        # Set default priority_order values for existing projects using their ID
        # This ensures uniqueness
        cursor.execute("""
            UPDATE projects
            SET priority_order = id
            WHERE priority_order IS NULL
        """)
        
        # Now make it NOT NULL and add UNIQUE constraint
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='projects'")
        table_sql = cursor.fetchone()
        
        if table_sql:
            # Get all existing data
            cursor.execute("""
                SELECT id, name, description, target_amount, status, savings_account_id, 
                       currency, created_at, updated_at, priority_order
                FROM projects
            """)
            existing_data = cursor.fetchall()
            
            # Drop the old table
            cursor.execute("DROP TABLE projects")
            
            # Recreate with priority_order as NOT NULL and UNIQUE
            cursor.execute("""
                CREATE TABLE projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    target_amount REAL NOT NULL,
                    status TEXT NOT NULL DEFAULT 'Active',
                    savings_account_id INTEGER,
                    currency TEXT NOT NULL DEFAULT 'EUR',
                    priority_order INTEGER NOT NULL UNIQUE,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT,
                    FOREIGN KEY (savings_account_id) REFERENCES savings_accounts(id) ON DELETE SET NULL
                )
            """)
            
            # Recreate indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_projects_status
                ON projects(status)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_projects_savings_account_id
                ON projects(savings_account_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_projects_priority_order
                ON projects(priority_order)
            """)
            
            # Reinsert all data, handling NULL values for created_at and currency
            # Only process if there's existing data (handles empty database case)
            if existing_data:
                from datetime import datetime
                processed_data = []
                for row in existing_data:
                    # Column order from SELECT: id, name, description, target_amount, status, 
                    # savings_account_id, currency, created_at, updated_at, priority_order
                    # Ensure created_at is not NULL - use current time if missing
                    created_at = row[7] if row[7] is not None else datetime.now().isoformat()
                    updated_at = row[8] if len(row) > 8 else None
                    priority_order = row[9] if len(row) > 9 else row[0]  # fallback to id if missing
                    currency = row[6] if row[6] is not None else 'EUR'  # default to EUR if missing
                    processed_data.append((
                        row[0],  # id
                        row[1],  # name
                        row[2],  # description
                        row[3],  # target_amount
                        row[4],  # status
                        row[5],  # savings_account_id
                        currency,  # currency (with default)
                        priority_order,  # priority_order
                        created_at,  # created_at (with default)
                        updated_at  # updated_at
                    ))
                
                cursor.executemany("""
                    INSERT INTO projects (id, name, description, target_amount, status, 
                                         savings_account_id, currency, priority_order, 
                                         created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, processed_data)
            
            # Update sqlite_sequence to maintain auto-increment
            cursor.execute("SELECT MAX(id) FROM projects")
            max_id_result = cursor.fetchone()
            if max_id_result and max_id_result[0] is not None:
                max_id = max_id_result[0]
                cursor.execute("""
                    UPDATE sqlite_sequence 
                    SET seq = ? 
                    WHERE name = 'projects'
                """, (max_id,))
                if cursor.rowcount == 0:
                    cursor.execute("""
                        INSERT INTO sqlite_sequence (name, seq) 
                        VALUES ('projects', ?)
                    """, (max_id,))
        
        print("Migration 009: Added priority_order column to projects table with UNIQUE constraint")
    else:
        print("Migration 009: Skipped - priority_order column already exists")

