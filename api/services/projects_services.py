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

    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'

    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO projects (name, description, target_amount, status, savings_account_id, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (entry.name, entry.description, entry.target_amount, entry.status, entry.savings_account_id, currency, created_at)
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

    query = "SELECT id, name, description, target_amount, status, savings_account_id, currency, created_at, updated_at FROM projects"
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

    query += " ORDER BY id DESC"

    cursor.execute(query, params)
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
    conn.close()
    return entries


def get_project_by_id(project_id: int) -> Optional[Dict[str, Any]]:
    """Get a single project by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, target_amount, status, savings_account_id, currency, created_at, updated_at FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
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

    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    cursor.execute(
        "UPDATE projects SET name = ?, description = ?, target_amount = ?, status = ?, savings_account_id = ?, currency = ?, updated_at = ? WHERE id = ?",
        (name, description, target_amount, status, savings_account_id, currency, updated_at, project_id)
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
            "created_at": existing.get("created_at", datetime.now().isoformat()),
            "updated_at": updated_at
        }
    return None
