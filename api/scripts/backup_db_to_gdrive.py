from datetime import datetime
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import os
from pathlib import Path

# Load environment variables from .env file (one directory up from this script)
load_dotenv(Path(__file__).parent.parent / ".env")

# 1. SETUP
# The JSON key you downloaded from Cloud Console
# Get absolute path to the credentials file (one directory up from this script)
SCRIPT_DIR = Path(__file__).parent.resolve()
SERVICE_ACCOUNT_FILE = str(SCRIPT_DIR.parent / 'gdrive-sa-creds.json')
BACKUP_LOG_FILE = SCRIPT_DIR.parent / 'backup.log'

def log_message(message):
    """Write a timestamped message to backup.log and print it."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f"[{timestamp}] {message}\n"
    try:
        with open(BACKUP_LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    except Exception as e:
        error_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        error_message = f"Error writing to log file: {e}"
        error_entry = f"[{error_timestamp}] {error_message}\n"
        try:
            with open(BACKUP_LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(error_entry)
        except Exception:
            # If we can't write to the log file at all, just print
            print(f"Error writing to log file: {e}")
        print(error_message)
    print(message)

# The scope you authorized in the Admin Console (requires to be a Workspace Admin)
SCOPES = ['https://www.googleapis.com/auth/drive']

# The email of the ACTUAL USER you want to impersonate (your admin email)
# The script will see the files this user sees.
IMPERSONATED_USER_EMAIL = os.getenv('IMPERSONATED_USER_EMAIL')

def authenticate_drive_headless():
    """
    Authenticates using a Service Account with Domain-Wide Delegation.
    No browser interaction required.
    """
    try:
        # Create credentials with the specific subject (the user to impersonate)
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, 
            scopes=SCOPES
        )
        
        # This acts as the "login" for the specific user
        delegated_creds = creds.with_subject(IMPERSONATED_USER_EMAIL)

        service = build('drive', 'v3', credentials=delegated_creds)
        return service
        
    except Exception as e:
        log_message(f"Authentication Error: {e}")
        return None

def find_folder_by_name(service, folder_name):
    """Find a folder in Google Drive by name."""
    try:
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields='files(id, name)'
        ).execute()
        folders = results.get('files', [])
        if folders:
            return folders[0]['id']
        return None
    except Exception as e:
        log_message(f"Error finding folder: {e}")
        return None

def find_file_by_name(service, filename, parent_folder_id=None):
    """Find a file in Google Drive by name, optionally within a specific folder."""
    try:
        query = f"name='{filename}' and trashed=false"
        if parent_folder_id:
            query += f" and '{parent_folder_id}' in parents"
        results = service.files().list(
            q=query,
            fields='files(id, name)'
        ).execute()
        files = results.get('files', [])
        if files:
            return files[0]['id']
        return None
    except Exception as e:
        log_message(f"Error finding file: {e}")
        return None

def upload_file(service, local_file_path, drive_filename=None, destination_folder_id=None, existing_file_id=None):
    """Upload or update a local file to Google Drive."""
    try:
        if not os.path.exists(local_file_path):
            log_message(f"Error: Local file not found: {local_file_path}")
            return None
        
        media = MediaFileUpload(local_file_path, resumable=True)
        
        if existing_file_id:
            # Update existing file - don't include 'parents' in metadata for updates
            file_metadata = {
                'name': drive_filename or os.path.basename(local_file_path)
            }
            
            # If destination folder is specified and file needs to be moved, use addParents/removeParents
            update_params = {
                'fileId': existing_file_id,
                'body': file_metadata,
                'media_body': media,
                'fields': 'id, name, webViewLink'
            }
            
            # If we need to move the file to a different folder, handle it separately
            if destination_folder_id:
                # Get current parents of the file
                existing_file = service.files().get(
                    fileId=existing_file_id,
                    fields='parents'
                ).execute()
                current_parents = existing_file.get('parents', [])
                
                # Only move if not already in the destination folder
                if destination_folder_id not in current_parents:
                    # Remove from all current parents and add to destination folder
                    update_params['removeParents'] = ','.join(current_parents)
                    update_params['addParents'] = destination_folder_id
            
            updated_file = service.files().update(**update_params).execute()
            log_message(f"Success! File Updated: {updated_file.get('name')} ({updated_file.get('id')})")
            return updated_file
        else:
            # Create new file - can include 'parents' in metadata for new files
            file_metadata = {
                'name': drive_filename or os.path.basename(local_file_path)
            }
            if destination_folder_id:
                file_metadata['parents'] = [destination_folder_id]
            
            uploaded_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink'
            ).execute()
            log_message(f"Success! File Uploaded: {uploaded_file.get('name')} ({uploaded_file.get('id')})")
            return uploaded_file
    except Exception as e:
        log_message(f"Upload Error: {e}")
        return None

def copy_file(service, origin_file_id, new_name=None, destination_folder_id=None):
    """Copy a file in Google Drive."""
    try:
        file_metadata = {}
        if new_name:
            file_metadata['name'] = new_name
        if destination_folder_id:
            file_metadata['parents'] = [destination_folder_id]

        copied_file = service.files().copy(
            fileId=origin_file_id,
            body=file_metadata,
            fields='id, name, webViewLink'
        ).execute()

        log_message(f"Success! File Copied: {copied_file.get('name')} ({copied_file.get('id')})")
        return copied_file

    except Exception as e:
        log_message(f"Copy Error: {e}")
        return None

if __name__ == '__main__':
    log_message("Starting database backup to Google Drive")
    # Full path to your JSON key on the Ubuntu server
    # e.g., /opt/my_app/service_account.json
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        log_message(f"Error: Could not find {SERVICE_ACCOUNT_FILE}")
    else:
        # Authenticate
        service = authenticate_drive_headless()
        
        if service:
            # Find the kakebo folder in Google Drive
            FOLDER_NAME = 'kakebo'
            folder_id = find_folder_by_name(service, FOLDER_NAME)
            
            if not folder_id:
                log_message(f"Error: Could not find folder '{FOLDER_NAME}' in Google Drive")
                exit(1)
            
            log_message(f"Found folder '{FOLDER_NAME}' ({folder_id})")
            
            # Get absolute path to the local database file
            LOCAL_DB_PATH = SCRIPT_DIR.parent / 'kakebo.db'
            
            if not os.path.exists(LOCAL_DB_PATH):
                log_message(f"Error: Database file not found: {LOCAL_DB_PATH}")
            else:
                # First, upload or update the main database file in Google Drive with latest local version
                MAIN_DB_NAME = 'kakebo.db'
                # Search for existing file within the folder first
                existing_file_id = find_file_by_name(service, MAIN_DB_NAME, parent_folder_id=folder_id)
                
                # If not found in folder, search globally (might be in root or elsewhere)
                if not existing_file_id:
                    existing_file_id = find_file_by_name(service, MAIN_DB_NAME)
                
                if existing_file_id:
                    log_message(f"Found existing file in Drive: {MAIN_DB_NAME} ({existing_file_id})")
                    log_message(f"Updating with latest local version...")
                    uploaded = upload_file(service, str(LOCAL_DB_PATH), MAIN_DB_NAME, destination_folder_id=folder_id, existing_file_id=existing_file_id)
                else:
                    log_message(f"Uploading {MAIN_DB_NAME} to Google Drive...")
                    uploaded = upload_file(service, str(LOCAL_DB_PATH), MAIN_DB_NAME, destination_folder_id=folder_id)
                
                if not uploaded:
                    log_message("Failed to upload/update file. Exiting.")
                    exit(1)
                
                source_file_id = uploaded.get('id')
                
                # Create a backup copy with timestamp
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_name = f'kakebo_backup_{timestamp}.db'
                log_message(f"Creating backup copy: {backup_name}")
                copy_file(service, source_file_id, new_name=backup_name, destination_folder_id=folder_id)
                log_message("Backup completed successfully")