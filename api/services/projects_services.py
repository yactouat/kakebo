import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional

from db import get_connection
from dtos.project import ProjectCreate, ProjectUpdate
from exceptions import ValidationError
from services.contributions_services import get_all_contributions
from services.savings_accounts_services import get_savings_account_by_id
from validators.status_validator import validate_project_status


def calculate_project_progress(project_id: int) -> Dict[str, Any]:
    """Calculate and return project progress.

    Progress is calculated as: current_balance / target_amount
    where current_balance = initial_balance + SUM(contributions)

    Args:
        project_id: The ID of the project

    Returns:
        Dictionary with project_id, target_amount, current_balance, progress_percentage, status
    """
    project = get_project_by_id(project_id)
    if project is None:
        raise ValidationError(f"Project with id {project_id} not found")

    current_balance = 0.0

    # If project has a linked savings account, calculate balance
    if project.get("savings_account_id") is not None:
        account = get_savings_account_by_id(project["savings_account_id"])
        if account is not None:
            # Start with initial balance
            current_balance = account["initial_balance"]

            # Add all contributions
            contributions = get_all_contributions(account["id"])
            for contribution in contributions:
                current_balance += contribution["amount"]

    # Calculate progress percentage
    target_amount = project["target_amount"]
    progress_percentage = (current_balance / target_amount * 100) if target_amount > 0 else 0

    return {
        "project_id": project_id,
        "target_amount": target_amount,
        "current_balance": current_balance,
        "progress_percentage": progress_percentage,
        "status": project["status"]
    }


def create_project(entry: ProjectCreate) -> Dict[str, Any]:
    """Create a new project and return it with its ID.

    The ProjectCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.target_amount < 0:
        raise ValidationError("Project target_amount cannot be negative")

    # Validate status
    validate_project_status(entry.status)

    # Validate savings_account_id exists if provided
    if entry.savings_account_id is not None:
        account = get_savings_account_by_id(entry.savings_account_id)
        if account is None:
            raise ValidationError(f"Savings account with id {entry.savings_account_id} not found")

    # Validate priority_order uniqueness
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects WHERE priority_order = ?", (entry.priority_order,))
    if cursor.fetchone() is not None:
        conn.close()
        raise ValidationError(f"Priority order {entry.priority_order} is already in use. Each project must have a unique priority order.")

    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'

    created_at = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO projects (name, description, target_amount, status, savings_account_id, currency, priority_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (entry.name, entry.description, entry.target_amount, entry.status, entry.savings_account_id, currency, entry.priority_order, created_at)
    )
    project_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": project_id,
        "name": entry.name,
        "description": entry.description,
        "target_amount": entry.target_amount,
        "status": entry.status,
        "savings_account_id": entry.savings_account_id,
        "currency": currency,
        "priority_order": entry.priority_order,
        "created_at": created_at,
        "updated_at": None
    }


def delete_project(project_id: int) -> bool:
    """Delete a project by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_projects(status: str | None = None, savings_account_id: int | None = None) -> List[Dict[str, Any]]:
    """Get all projects with optional filters.

    Args:
        status: Optional filter by project status
        savings_account_id: Optional filter by linked savings account

    Returns:
        List of projects matching the filters, ordered by id descending
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT id, name, description, target_amount, status, savings_account_id, currency, priority_order, created_at, updated_at FROM projects"
    conditions = []
    params = []

    if status is not None:
        # Validate status
        validate_project_status(status)
        conditions.append("status = ?")
        params.append(status)

    if savings_account_id is not None:
        conditions.append("savings_account_id = ?")
        params.append(savings_account_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY priority_order ASC"

    cursor.execute(query, params)
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    # Ensure priority_order defaults to id if NULL (shouldn't happen after migration, but handle edge cases)
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        if 'priority_order' not in entry or entry['priority_order'] is None:
            # Fix NULL priority_order in database and use id as fallback
            entry['priority_order'] = entry['id']
            cursor.execute("UPDATE projects SET priority_order = ? WHERE id = ?", (entry['id'], entry['id']))
    if entries:
        conn.commit()
    conn.close()
    return entries


def get_project_by_id(project_id: int) -> Optional[Dict[str, Any]]:
    """Get a single project by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, target_amount, status, savings_account_id, currency, priority_order, created_at, updated_at FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        # Ensure priority_order defaults to id if NULL (shouldn't happen after migration, but handle edge cases)
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        if 'priority_order' not in entry or entry['priority_order'] is None:
            # Fix NULL priority_order in database and use id as fallback
            entry['priority_order'] = entry['id']
            cursor.execute("UPDATE projects SET priority_order = ? WHERE id = ?", (entry['id'], entry['id']))
            conn.commit()
        conn.close()
        return entry
    conn.close()
    return None


def update_project(project_id: int, entry_update: ProjectUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a project and return the updated project.

    The ProjectUpdate DTO is validated automatically by Pydantic,
    ensuring that if fields are provided, they cannot be None.

    Args:
        project_id: The ID of the project to update
        entry_update: The update DTO with validated fields
        existing: The existing project data to fill in missing fields
    """
    # Use provided values or keep existing ones
    name = entry_update.name if entry_update.name is not None else existing["name"]
    description = entry_update.description if entry_update.description is not None else existing.get("description")
    target_amount = entry_update.target_amount if entry_update.target_amount is not None else existing["target_amount"]
    status = entry_update.status if entry_update.status is not None else existing["status"]
    savings_account_id = entry_update.savings_account_id if entry_update.savings_account_id is not None else existing.get("savings_account_id")
    priority_order = entry_update.priority_order if entry_update.priority_order is not None else existing.get("priority_order")

    # Validate target_amount
    if target_amount < 0:
        raise ValidationError("Project target_amount cannot be negative")

    # Validate status
    validate_project_status(status)

    # Validate savings_account_id exists if provided and changed
    if savings_account_id is not None and savings_account_id != existing.get("savings_account_id"):
        account = get_savings_account_by_id(savings_account_id)
        if account is None:
            raise ValidationError(f"Savings account with id {savings_account_id} not found")

    # Validate priority_order uniqueness if it's being changed
    # Check if priority_order is provided in the update and differs from existing
    if entry_update.priority_order is not None:
        new_priority_order = entry_update.priority_order
        existing_priority_order = existing.get("priority_order")
        # Only validate uniqueness if the value is actually changing
        if new_priority_order != existing_priority_order:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM projects WHERE priority_order = ? AND id != ?", (new_priority_order, project_id))
            if cursor.fetchone() is not None:
                conn.close()
                raise ValidationError(f"Priority order {new_priority_order} is already in use. Each project must have a unique priority order.")
            conn.close()

    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    cursor.execute(
        "UPDATE projects SET name = ?, description = ?, target_amount = ?, status = ?, savings_account_id = ?, currency = ?, priority_order = ?, updated_at = ? WHERE id = ?",
        (name, description, target_amount, status, savings_account_id, currency, priority_order, updated_at, project_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {
            "id": project_id,
            "name": name,
            "description": description,
            "target_amount": target_amount,
            "status": status,
            "savings_account_id": savings_account_id,
            "currency": currency,
            "priority_order": priority_order,
            "created_at": existing.get("created_at", datetime.now().isoformat()),
            "updated_at": updated_at
        }
    return None


def swap_project_priorities(project_id: int, direction: str) -> Optional[Dict[str, Any]]:
    """Swap a project's priority with the adjacent project (up or down).
    
    Args:
        project_id: The ID of the project to move
        direction: Either 'up' (decrease priority) or 'down' (increase priority)
    
    Returns:
        The updated project, or None if the swap couldn't be performed
    """
    if direction not in ['up', 'down']:
        raise ValidationError("Direction must be 'up' or 'down'")
    
    # Get the current project
    current_project = get_project_by_id(project_id)
    if current_project is None:
        raise ValidationError(f"Project with id {project_id} not found")
    
    current_priority = current_project.get("priority_order")
    if current_priority is None:
        raise ValidationError(f"Project {project_id} has no priority_order set")
    
    # Determine the target priority
    if direction == 'up':
        target_priority = current_priority - 1
        if target_priority < 1:
            raise ValidationError("Project is already at the highest priority")
    else:  # direction == 'down'
        target_priority = current_priority + 1
    
    # Find the project with the target priority
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, priority_order FROM projects WHERE priority_order = ?", (target_priority,))
    adjacent_project = cursor.fetchone()
    
    if adjacent_project is None:
        conn.close()
        raise ValidationError(f"No project found with priority {target_priority}")
    
    adjacent_project_id = adjacent_project["id"]
    
    # Swap priorities atomically using a transaction
    # Use a temporary priority value to avoid uniqueness conflicts
    temp_priority = 1000000 + project_id  # Large number to avoid conflicts
    
    try:
        # Move current project to temporary priority
        cursor.execute("UPDATE projects SET priority_order = ?, updated_at = ? WHERE id = ?",
                       (temp_priority, datetime.now().isoformat(), project_id))
        
        # Move adjacent project to current project's priority
        cursor.execute("UPDATE projects SET priority_order = ?, updated_at = ? WHERE id = ?",
                       (current_priority, datetime.now().isoformat(), adjacent_project_id))
        
        # Move current project to adjacent project's priority
        cursor.execute("UPDATE projects SET priority_order = ?, updated_at = ? WHERE id = ?",
                       (target_priority, datetime.now().isoformat(), project_id))
        
        conn.commit()
        
        # Return the updated current project
        updated_project = get_project_by_id(project_id)
        conn.close()
        return updated_project
    except Exception as e:
        conn.rollback()
        conn.close()
        raise ValidationError(f"Failed to swap priorities: {str(e)}")
