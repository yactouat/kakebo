"""Service for handling image uploads and URL preview fetching."""
import mimetypes
import os
from pathlib import Path
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from fastapi import UploadFile

from exceptions import ValidationError


ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


async def fetch_url_preview_image(url: str, item_id: int) -> Optional[str]:
    """
    Fetch Open Graph image from URL (best effort).

    Returns relative path if successful, None if failed.
    Does not raise exceptions - saves item even if preview fetch fails.

    Args:
        url: URL to fetch preview from
        item_id: Wishlist item ID for file naming

    Returns:
        Relative path to saved preview image, or None if fetch failed
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Try Open Graph image first
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                image_url = og_image['content']
            else:
                # Fallback to Twitter image
                twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
                if twitter_image and twitter_image.get('content'):
                    image_url = twitter_image['content']
                else:
                    return None

            # Make image URL absolute if relative
            if image_url.startswith('//'):
                image_url = 'https:' + image_url
            elif image_url.startswith('/'):
                from urllib.parse import urlparse
                parsed = urlparse(url)
                image_url = f"{parsed.scheme}://{parsed.netloc}{image_url}"

            # Download image
            img_response = await client.get(image_url, timeout=10.0)
            img_response.raise_for_status()

            # Determine extension from content-type
            content_type = img_response.headers.get('content-type', '')
            ext = mimetypes.guess_extension(content_type) or '.jpg'
            if ext not in ALLOWED_EXTENSIONS:
                ext = '.jpg'

            # Save to uploads directory
            upload_dir = Path(__file__).parent.parent / "uploads" / "wishlist_items" / str(item_id)
            upload_dir.mkdir(parents=True, exist_ok=True)

            file_path = upload_dir / f"url_preview{ext}"
            with open(file_path, 'wb') as f:
                f.write(img_response.content)

            # Return relative path
            return f"uploads/wishlist_items/{item_id}/url_preview{ext}"

    except Exception as e:
        print(f"Failed to fetch URL preview image: {e}")
        return None


async def save_uploaded_image(file: UploadFile, item_id: int) -> str:
    """
    Save uploaded image file.

    Returns relative path if successful.
    Raises ValidationError if file is invalid.

    Args:
        file: Uploaded file object
        item_id: Wishlist item ID for file naming

    Returns:
        Relative path to saved uploaded image

    Raises:
        ValidationError: If file type or size is invalid
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower() if file.filename else ''
    if file_ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Invalid file type '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValidationError(f"File size exceeds {MAX_FILE_SIZE / (1024 * 1024)}MB limit")

    # Save to uploads directory
    upload_dir = Path(__file__).parent.parent / "uploads" / "wishlist_items" / str(item_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"uploaded{file_ext}"
    with open(file_path, 'wb') as f:
        f.write(content)

    return f"uploads/wishlist_items/{item_id}/uploaded{file_ext}"


def delete_item_images(item_id: int):
    """Delete all images for a wishlist item.

    Args:
        item_id: Wishlist item ID whose images to delete
    """
    upload_dir = Path(__file__).parent.parent / "uploads" / "wishlist_items" / str(item_id)
    if upload_dir.exists():
        import shutil
        shutil.rmtree(upload_dir)
