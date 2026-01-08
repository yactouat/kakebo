"""Validator for URL fields."""
import re

from exceptions import ValidationError


URL_REGEX = re.compile(
    r'^https?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
    r'localhost|'  # localhost
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE)


def validate_url(url: str | None) -> str | None:
    """Validate URL format if provided.

    Args:
        url: URL string to validate, or None

    Returns:
        Validated URL string or None if empty/None

    Raises:
        ValidationError: If URL format is invalid or exceeds max length
    """
    if url is None or url == "":
        return None

    url = url.strip()

    if not url:
        return None

    if len(url) > 2000:
        raise ValidationError("URL must be less than 2000 characters")

    if not URL_REGEX.match(url):
        raise ValidationError(f"Invalid URL format: {url}")

    return url
