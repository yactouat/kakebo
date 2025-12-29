# Automated Database Backup to Google Drive

This guide explains how to set up automated daily backups of the `kakebo.db` database file to Google Drive using a cron job on Ubuntu 24.

## Overview

The backup system uses the `api/scripts/backup_db_to_gdrive.py` script to:
1. Upload the latest `kakebo.db` file to a Google Drive folder named `kakebo`
2. Create a timestamped backup copy (e.g., `kakebo_backup_20240115_143022.db`) for historical retention

The script runs headlessly using Google Service Account authentication with Domain-Wide Delegation, which requires **Google Workspace Admin privileges**.

## Prerequisites

### System Requirements

This guide assumes:
- **Operating System**: Ubuntu 24
- **Repository Location**: The `kakebo` repository has been downloaded/cloned to your home folder (e.g., `/home/{user}/kakebo`)

`{user}` is to be replaced with your Ubuntu username.

All paths in this guide are relative to this location. If your repository is located elsewhere, adjust the paths accordingly.

### 1. Google Workspace Admin Access

You must be a **Google Workspace Administrator** to set up Domain-Wide Delegation, which is required for the service account to impersonate a user and access their Google Drive.

**Why?** The script uses Domain-Wide Delegation to access Google Drive on behalf of a Workspace user. This is a security feature that only admins can configure.

### 2. Python Virtual Environment

The cron job will use the Python binary from the project's virtual environment at `api/venv/bin/python`. Ensure the virtual environment is set up and all dependencies are installed:

```bash
cd /home/{user}/kakebo/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Required packages (from `requirements.txt`):
- `google-api-python-client`
- `google-auth-httplib2`
- `google-auth-oauthlib`
- `python-dotenv`

### 3. Google Drive Folder

Create a folder named `kakebo` in your Google Drive (or ensure it exists). The script will:
- Upload/update `kakebo.db` in this folder
- Create timestamped backup copies in the same folder

## Setup Steps

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Note your project ID for later use

### Step 2: Enable Google Drive API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**

### Step 3: Create a Service Account

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in:
   - **Service account name**: e.g., `kakebo-backup-service`
   - **Service account ID**: (auto-generated, or customize)
   - **Description**: "Service account for Kakebo database backups"
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Skip user access (click **Done**)

### Step 4: Create and Download Service Account Key

1. In the **Credentials** page, find your service account
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Select **JSON** format
6. Click **Create** - the JSON file will download automatically
7. **Save this file** as `api/gdrive-sa-creds.json` in your project directory

**Security Note:** This JSON file contains sensitive credentials. Ensure it's:
- Not committed to version control (should be in `.gitignore`)
- Stored with appropriate file permissions (e.g., `chmod 600 api/gdrive-sa-creds.json`)

  **What `chmod 600` does:** This command sets file permissions so that only the file owner can read and write the file. The `600` permission means:
  - **6** (owner): read (4) + write (2) = 6
  - **0** (group): no permissions
  - **0** (others): no permissions
  
  This ensures that only you (the file owner) can access the credentials file, preventing other users on the system from reading your sensitive service account keys.

### Step 5: Enable Domain-Wide Delegation

1. Still in the service account details page, check the box **Enable Google Workspace Domain-wide Delegation**
2. Note the **Client ID** that appears (you'll need this in the next step)

### Step 6: Authorize Domain-Wide Delegation in Google Workspace Admin Console

**This step requires Workspace Admin privileges.**

1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to **Security** > **API Controls** > **Domain-wide Delegation**
3. Click **Add new** (or **Add**)
4. Fill in:
   - **Client ID**: The Client ID from Step 5
   - **OAuth Scopes**: `https://www.googleapis.com/auth/drive`
5. Click **Authorize**

**Important:** The OAuth scope must be entered exactly as shown above. This grants the service account permission to access Google Drive on behalf of users in your domain.

### Step 7: Configure Environment Variables

The script requires an environment variable to specify which Workspace user to impersonate (the user whose Drive will be accessed).

1. Create or edit `.env` file in the `api/` directory:
   ```bash
   cd /home/{user}/kakebo/api
   nano .env
   ```

2. Add the following line (replace with your actual Workspace admin email):
   ```
   IMPERSONATED_USER_EMAIL=your-admin-email@yourdomain.com
   ```

3. Save and exit

**Note:** The script uses `python-dotenv` to load this variable. The `.env` file should be in the `api/` directory (one level up from the script).

### Step 8: Test the Backup Script Manually

Before setting up the cron job, test the script manually to ensure everything works:

```bash
cd /home/{user}/kakebo/api
source venv/bin/activate
python scripts/backup_db_to_gdrive.py
```

**Expected output:**
- "Found folder 'kakebo' (...)"
- "Found existing file in Drive: kakebo.db (...)" or "Uploading kakebo.db to Google Drive..."
- "Success! File Updated: kakebo.db (...)" or "Success! File Uploaded: kakebo.db (...)"
- "Creating backup copy: kakebo_backup_YYYYMMDD_HHMMSS.db"
- "Success! File Copied: kakebo_backup_YYYYMMDD_HHMMSS.db (...)"

If you encounter errors, see the [Troubleshooting](#troubleshooting) section below.

### Step 9: Set Up the Cron Job

Once the script works manually, set up a daily cron job to run it automatically.

1. Open your crontab for editing:
   ```bash
   crontab -e
   ```

2. Add the following line to run the backup every six hours:
   ```cron
   0 */6 * * * /home/{user}/kakebo/api/venv/bin/python /home/{user}/kakebo/api/scripts/backup_db_to_gdrive.py >> /home/{user}/kakebo/api/backup.log 2>&1
   ```

   **Explanation:**
   - `0 */6 * * *` - Runs every six hours
   - `/home/{user}/kakebo/api/venv/bin/python` - Absolute path to Python in virtual environment
   - `/home/{user}/kakebo/api/scripts/backup_db_to_gdrive.py` - Absolute path to the script
   - `>> /home/{user}/kakebo/api/backup.log 2>&1` - Redirects both stdout and stderr to a log file

3. Save and exit (in `nano`: `Ctrl+X`, then `Y`, then `Enter`)

4. Verify the cron job was added:
   ```bash
   crontab -l
   ```

For more cron schedule examples, see [crontab.guru](https://crontab.guru/).

### Step 10: Verify Cron Job Execution

1. Wait for the scheduled time, or manually trigger a test:
   ```bash
   # Test immediately (if using user crontab)
   /home/{user}/kakebo/api/venv/bin/python /home/{user}/kakebo/api/scripts/backup_db_to_gdrive.py
   ```

2. Check the log file for output:
   ```bash
   tail -f /home/{user}/kakebo/api/backup.log
   ```

3. Verify files in Google Drive:
   - Open Google Drive
   - Navigate to the `kakebo` folder
   - Confirm `kakebo.db` and timestamped backup files are present

## Troubleshooting

### Error: "Could not find gdrive-sa-creds.json"

**Solution:** Ensure the service account JSON file is located at `api/gdrive-sa-creds.json` (relative to the project root).

### Error: "Authentication Error" or "Access Denied"

**Possible causes:**
1. Domain-wide delegation not properly configured
   - Verify the Client ID matches in both Google Cloud Console and Admin Console
   - Ensure the OAuth scope is exactly: `https://www.googleapis.com/auth/drive`
   - Check that Domain-Wide Delegation is enabled for the service account

2. Incorrect `IMPERSONATED_USER_EMAIL`
   - Verify the email in `.env` is correct and belongs to your Workspace domain
   - Ensure the user has access to Google Drive

3. Service account key file is corrupted or invalid
   - Re-download the JSON key from Google Cloud Console

### Error: "Could not find folder 'kakebo' in Google Drive"

**Solution:** Create a folder named `kakebo` in your Google Drive (the folder should be accessible by the user specified in `IMPERSONATED_USER_EMAIL`).

### Error: "Database file not found"

**Solution:** Ensure `api/kakebo.db` exists. The script looks for the database file in the `api/` directory.

### Cron Job Not Running

**Checklist:**
1. Verify cron service is running:
   ```bash
   sudo systemctl status cron
   ```

2. Check cron logs:
   ```bash
   grep CRON /var/log/syslog
   ```

3. Verify the cron job syntax:
   ```bash
   crontab -l
   ```

4. Check file permissions:
   - Script should be executable: `chmod +x api/scripts/backup_db_to_gdrive.py`
   - Python binary should be executable: `chmod +x api/venv/bin/python`

5. Test the command manually with full paths:
   ```bash
   /home/{user}/kakebo/api/venv/bin/python /home/{user}/kakebo/api/scripts/backup_db_to_gdrive.py
   ```

6. Check the log file for errors:
   ```bash
   cat /home/{user}/kakebo/api/backup.log
   ```

### Environment Variables Not Loading

**Solution:** The script uses `python-dotenv` to load `.env` from the `api/` directory. Ensure:
- The `.env` file exists in `api/.env`
- The file contains `IMPERSONATED_USER_EMAIL=your-email@domain.com`
- There are no extra spaces or quotes around the value

### Permission Denied Errors

**Solution:** Ensure proper file permissions:
```bash
chmod 600 api/gdrive-sa-creds.json  # Service account credentials
chmod 644 api/.env                  # Environment file
chmod +x api/scripts/backup_db_to_gdrive.py  # Script
```

## Maintenance

### Viewing Backup Logs

Check the backup log file to monitor successful runs:
```bash
tail -n 50 /home/{user}/kakebo/api/backup.log
```

### Managing Old Backups in Google Drive

The script creates a new timestamped backup file each time it runs. Over time, this can accumulate many backup files. Consider:

1. Periodically reviewing and deleting old backups manually in Google Drive
2. Using Google Drive's storage management tools to set retention policies
3. Modifying the script to implement automatic cleanup of backups older than a certain number of days

### Updating the Cron Schedule

To change when the backup runs:
1. Edit crontab: `crontab -e`
2. Modify the schedule expression
3. Save and exit

## Security Considerations

1. **Service Account Credentials**: The `gdrive-sa-creds.json` file contains sensitive credentials. Never commit it to version control. Ensure it's listed in `.gitignore`.

2. **File Permissions**: Restrict access to sensitive files:
   ```bash
   chmod 600 api/gdrive-sa-creds.json
   chmod 600 api/.env
   ```

3. **Log Files**: The backup log may contain sensitive information. Consider restricting access:
   ```bash
   chmod 600 api/backup.log
   ```

4. **Domain-Wide Delegation**: This grants broad access. Only authorize the minimum required scope (`https://www.googleapis.com/auth/drive`).

## Additional Resources

- [Google Service Account Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Domain-Wide Delegation Guide](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)
- [Cron Job Tutorial](https://www.cyberciti.biz/faq/how-do-i-add-jobs-to-cron-under-linux-or-unix-oses/)

