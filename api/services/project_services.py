import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime

from db import get_connection
from dtos.project_dtos import ProjectCreate, ProjectUpdate
from exceptions import ValidationError
from validators.project_validators import (
    validate_unique_savings_account,
    validate_priority,
    validate_status,
    validate_target_date
)


def calculate_current_savings(conn, project_id: int) -> float:
    """Sum all contributions for a project.
    
    Args:
        conn: Database connection
        project_id: ID of the project
    
    Returns:
        Total sum of all contributions for the project (0.0 if no contributions)
    """
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COALESCE(SUM(amount), 0.0) FROM project_contributions WHERE project_id = ?",
        (project_id,)
    )
    result = cursor.fetchone()
    return float(result[0]) if result and result[0] is not None else 0.0


def calculate_progress_percentage(current_savings: float, target_amount: float) -> float:
    """Calculate progress percentage, capped at 100.
    
    Args:
        current_savings: Current total savings
        target_amount: Target amount for the project
    
    Returns:
        Progress percentage (0-100)
    """
    if target_amount <= 0:
        return 0.0
    percentage = (current_savings / target_amount) * 100
    return min(100.0, max(0.0, percentage))


def create_project(project: ProjectCreate) -> Dict[str, Any]:
    """Create a new project and return it with its ID.
    
    Args:
        project: ProjectCreate DTO with validated fields
    
    Returns:
        Dictionary representation of the created project
    
    Raises:
        ValueError: If savings_account_name is not unique
    """
    # Validate priority and status
    validate_priority(project.priority)
    validate_status(project.status)
    validate_target_date(project.target_date)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Validate unique savings_account_name
    validate_unique_savings_account(conn, project.savings_account_name)
    
    created_at = datetime.now().isoformat()
    updated_at = created_at
    
    cursor.execute(
        """INSERT INTO projects 
           (name, description, target_amount, target_date, priority, category, status, savings_account_name, currency, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            project.name,
            project.description,
            project.target_amount,
            project.target_date,
            project.priority,
            project.category,
            project.status,
            project.savings_account_name,
            project.currency,
            created_at,
            updated_at
        )
    )
    project_id = cursor.lastrowid
    
    # Calculate current_savings and progress_percentage
    current_savings = calculate_current_savings(conn, project_id)
    progress_percentage = calculate_progress_percentage(current_savings, project.target_amount)
    
    conn.commit()
    conn.close()
    
    return {
        "id": project_id,
        "name": project.name,
        "description": project.description,
        "target_amount": project.target_amount,
        "target_date": project.target_date,
        "priority": project.priority,
        "category": project.category,
        "status": project.status,
        "savings_account_name": project.savings_account_name,
        "currency": project.currency,
        "created_at": created_at,
        "updated_at": updated_at,
        "current_savings": current_savings,
        "progress_percentage": progress_percentage
    }


def delete_project(project_id: int) -> None:
    """Delete a project by ID. Contributions cascade automatically.
    
    Args:
        project_id: ID of the project to delete
    
    Raises:
        ValueError: If project not found
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if project exists
    cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise ValueError(f"Project with id {project_id} not found")
    
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()


def get_all_projects(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Fetch all projects with optional filters, including calculated fields.
    
    Args:
        status: Optional status filter ('active' or 'completed')
        priority: Optional priority filter ('high', 'medium', or 'low')
        category: Optional category filter
    
    Returns:
        List of project dictionaries with current_savings and progress_percentage
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Build query with optional filters
    query = "SELECT id, name, description, target_amount, target_date, priority, category, status, savings_account_name, currency, created_at, updated_at FROM projects WHERE 1=1"
    params = []
    
    if status is not None:
        query += " AND status = ?"
        params.append(status)
    
    if priority is not None:
        query += " AND priority = ?"
        params.append(priority)
    
    if category is not None:
        query += " AND category = ?"
        params.append(category)
    
    query += " ORDER BY id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    projects = []
    for row in rows:
        project = dict(row)
        project_id = project["id"]
        
        # Calculate current_savings and progress_percentage
        current_savings = calculate_current_savings(conn, project_id)
        progress_percentage = calculate_progress_percentage(current_savings, project["target_amount"])
        
        project["current_savings"] = current_savings
        project["progress_percentage"] = progress_percentage
        
        projects.append(project)
    
    conn.close()
    return projects


def get_project_by_id(project_id: int) -> Dict[str, Any]:
    """Fetch a single project by ID with calculated fields.
    
    Args:
        project_id: ID of the project to fetch
    
    Returns:
        Dictionary representation of the project with current_savings and progress_percentage
    
    Raises:
        ValueError: If project not found
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, name, description, target_amount, target_date, priority, category, status, savings_account_name, currency, created_at, updated_at FROM projects WHERE id = ?",
        (project_id,)
    )
    row = cursor.fetchone()
    
    if row is None:
        conn.close()
        raise ValueError(f"Project with id {project_id} not found")
    
    project = dict(row)
    
    # Calculate current_savings and progress_percentage
    current_savings = calculate_current_savings(conn, project_id)
    progress_percentage = calculate_progress_percentage(current_savings, project["target_amount"])
    
    project["current_savings"] = current_savings
    project["progress_percentage"] = progress_percentage
    
    conn.close()
    return project


def update_project(project_id: int, project_update: ProjectUpdate) -> Dict[str, Any]:
    """Update a project and return the updated project.
    
    Args:
        project_id: ID of the project to update
        project_update: ProjectUpdate DTO with fields to update
    
    Returns:
        Dictionary representation of the updated project with calculated fields
    
    Raises:
        ValueError: If project not found or validation fails
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get existing project
    cursor.execute(
        "SELECT id, name, description, target_amount, target_date, priority, category, status, savings_account_name, currency, created_at, updated_at FROM projects WHERE id = ?",
        (project_id,)
    )
    row = cursor.fetchone()
    
    if row is None:
        conn.close()
        raise ValueError(f"Project with id {project_id} not found")
    
    existing = dict(row)
    
    # Build update values (use provided values or keep existing ones)
    name = project_update.name if project_update.name is not None else existing["name"]
    description = project_update.description if project_update.description is not None else existing["description"]
    target_amount = project_update.target_amount if project_update.target_amount is not None else existing["target_amount"]
    target_date = project_update.target_date if project_update.target_date is not None else existing["target_date"]
    priority = project_update.priority if project_update.priority is not None else existing["priority"]
    category = project_update.category if project_update.category is not None else existing["category"]
    status = project_update.status if project_update.status is not None else existing["status"]
    savings_account_name = project_update.savings_account_name if project_update.savings_account_name is not None else existing["savings_account_name"]
    currency = project_update.currency if project_update.currency is not None else existing["currency"]
    
    # Validate updated values
    validate_priority(priority)
    validate_status(status)
    validate_target_date(target_date)
    
    # Validate unique savings_account_name if it changed
    if savings_account_name != existing["savings_account_name"]:
        validate_unique_savings_account(conn, savings_account_name, exclude_project_id=project_id)
    
    updated_at = datetime.now().isoformat()
    
    cursor.execute(
        """UPDATE projects SET 
           name = ?, description = ?, target_amount = ?, target_date = ?, priority = ?, 
           category = ?, status = ?, savings_account_name = ?, currency = ?, updated_at = ? 
           WHERE id = ?""",
        (
            name,
            description,
            target_amount,
            target_date,
            priority,
            category,
            status,
            savings_account_name,
            currency,
            updated_at,
            project_id
        )
    )
    
    # Calculate current_savings and progress_percentage
    current_savings = calculate_current_savings(conn, project_id)
    progress_percentage = calculate_progress_percentage(current_savings, target_amount)
    
    conn.commit()
    conn.close()
    
    return {
        "id": project_id,
        "name": name,
        "description": description,
        "target_amount": target_amount,
        "target_date": target_date,
        "priority": priority,
        "category": category,
        "status": status,
        "savings_account_name": savings_account_name,
        "currency": currency,
        "created_at": existing["created_at"],
        "updated_at": updated_at,
        "current_savings": current_savings,
        "progress_percentage": progress_percentage
    }

