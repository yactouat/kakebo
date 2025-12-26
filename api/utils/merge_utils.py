from typing import List, Dict, Any, Callable, Optional
from exceptions import ValidationError


def validate_and_fetch_entries(
    entry_ids: List[int],
    get_entry_func: Callable[[int], Optional[Dict[str, Any]]],
    entity_name: str
) -> List[Dict[str, Any]]:
    """Validate entry IDs and fetch all entries to merge.
    
    Args:
        entry_ids: List of entry IDs to merge (must have at least 2)
        get_entry_func: Function to fetch an entry by ID
        entity_name: Name of the entity type (e.g., "Actual expense entry")
    
    Returns:
        List of entry dictionaries
    
    Raises:
        ValidationError: If less than 2 entries provided or entries not found
    """
    if len(entry_ids) < 2:
        raise ValidationError("At least 2 entries are required to merge")
    
    entries = []
    for entry_id in entry_ids:
        entry = get_entry_func(entry_id)
        if entry is None:
            raise ValidationError(f"{entity_name} with id {entry_id} not found")
        entries.append(entry)
    
    return entries


def calculate_common_merged_values(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate common merged values from a list of entries.
    
    Calculates:
    - Sum of all amounts
    - Combined items (comma-separated)
    - Currency from first entry (defaults to "EUR")
    
    Args:
        entries: List of entry dictionaries
    
    Returns:
        Dictionary with keys: amount, items, currency
    """
    merged_amount = sum(entry["amount"] for entry in entries)
    merged_items = ", ".join(entry["item"] for entry in entries if entry.get("item"))
    merged_currency = entries[0].get("currency", "EUR")
    
    return {
        "amount": merged_amount,
        "items": merged_items,
        "currency": merged_currency
    }

