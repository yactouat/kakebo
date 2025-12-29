from datetime import datetime
import sqlite3
from typing import List, Dict, Any

from db import get_connection
from dtos.contribution_dtos import ContributionCreate


def create_contribution(contribution: ContributionCreate) -> Dict[str, Any]:
    """Create a new contribution and return it with its ID.
    
    Args:
        contribution: ContributionCreate DTO with validated fields
    
    Returns:
        Dictionary representation of the created contribution
    
    Raises:
        ValueError: If project does not exist
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Validate project exists
    cursor.execute("SELECT id FROM projects WHERE id = ?", (contribution.project_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise ValueError(f"Project with id {contribution.project_id} not found")
    
    created_at = datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO project_contributions (project_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)",
        (
            contribution.project_id,
            contribution.amount,
            contribution.date,
            contribution.notes,
            created_at
        )
    )
    contribution_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return {
        "id": contribution_id,
        "project_id": contribution.project_id,
        "amount": contribution.amount,
        "date": contribution.date,
        "notes": contribution.notes,
        "created_at": created_at
    }


def delete_contribution(contribution_id: int) -> None:
    """Delete a contribution by ID.
    
    Args:
        contribution_id: ID of the contribution to delete
    
    Raises:
        ValueError: If contribution not found
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if contribution exists
    cursor.execute("SELECT id FROM project_contributions WHERE id = ?", (contribution_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise ValueError(f"Contribution with id {contribution_id} not found")
    
    cursor.execute("DELETE FROM project_contributions WHERE id = ?", (contribution_id,))
    conn.commit()
    conn.close()


def get_contribution_history_by_month(project_id: int) -> Dict[str, float]:
    """Aggregate contributions by month (YYYY-MM) for a project.
    
    Args:
        project_id: ID of the project
    
    Returns:
        Dictionary with months (YYYY-MM) as keys and total amounts as values
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """SELECT 
            strftime('%Y-%m', date) as month,
            SUM(amount) as total_amount
        FROM project_contributions
        WHERE project_id = ?
        GROUP BY month
        ORDER BY month DESC""",
        (project_id,)
    )
    rows = cursor.fetchall()
    
    conn.close()
    
    return {row[0]: float(row[1]) for row in rows}


def get_contributions_by_project(project_id: int) -> List[Dict[str, Any]]:
    """Fetch all contributions for a project, ordered by date DESC.
    
    Args:
        project_id: ID of the project
    
    Returns:
        List of contribution dictionaries ordered by date DESC
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        """SELECT id, project_id, amount, date, notes, created_at
        FROM project_contributions
        WHERE project_id = ?
        ORDER BY date DESC, id DESC""",
        (project_id,)
    )
    rows = cursor.fetchall()
    
    conn.close()
    
    return [dict(row) for row in rows]

