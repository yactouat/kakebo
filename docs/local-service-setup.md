# Local Service Setup for Kakebo on Ubuntu 24

This guide explains how to set up the Kakebo application stack as a systemd service on Ubuntu 24, making it always available at `http://kakebo.local`.

## Prerequisites

- Ubuntu 24.04 or later
- Python 3.12+ installed
- Node.js 18+ and Yarn installed
- Nginx installed
- sudo/root access

## Set Up Local DNS

Add `kakebo.local` to your `/etc/hosts` file:

```bash
sudo bash -c 'echo "127.0.0.1 kakebo.local" >> /etc/hosts'
```

## Step 3: Configure the Database Path

The database must be located at `api/kakebo.db`. The application will use this path relative to the project root.

Ensure the database file exists and has proper permissions:

```bash
cd /home/yactouat/kakebo
touch api/kakebo.db
chmod 644 api/kakebo.db
```

**Note:** `chmod 644` sets file permissions using octal notation:
- **6** (owner): read + write permissions (4 + 2)
- **4** (group): read-only permission (4)
- **4** (others): read-only permission (4)

This allows the file owner (the user running the service) to read and write the database, while group members and others can only read it. This is a common permission set for database files that need to be accessible by the service but protected from unauthorized writes.

## Step 4: Set Up Backend Service

### 4.1 Create a systemd service file for the API

Create `/etc/systemd/system/kakebo-api.service`:

```bash
sudo nano /etc/systemd/system/kakebo-api.service
```

Add the following content:

```ini
[Unit]
Description=Kakebo API Service
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
Group=YOUR_USERNAME
WorkingDirectory=/home/{user}/kakebo/api
Environment="PATH=/home/{user}/kakebo/api/venv/bin"
ExecStart=/home/{user}/kakebo/api/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --root-path /api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Important:** We assume you have cloned the repo in your Ubuntu home folder.

Replace `YOUR_USERNAME` and `{user}` with your actual username and primary group.

To find your username and primary group, run:
```bash
whoami          # Shows your username
id -gn          # Shows your primary group name
```

On most Linux systems, your primary group has the same name as your username. For example, if your username is `yactouat`, your primary group is typically also `yactouat`. Use the same value for both `User` and `Group` fields.

### 4.2 Set up Python virtual environment

```bash
cd /home/yactouat/kakebo/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

### 4.3 Enable and start the API service

```bash
sudo systemctl daemon-reload
sudo systemctl enable kakebo-api.service
sudo systemctl start kakebo-api.service
sudo systemctl status kakebo-api.service
```

## Step 5: Build and Set Up Frontend Service

### 5.1 Build the frontend

```bash
cd /home/yactouat/kakebo/frontend
yarn install
yarn build
```

This creates a `dist` folder with the production build.

### 5.2 Create a systemd service file for the frontend

Create `/etc/systemd/system/kakebo-frontend.service`:

```bash
sudo nano /etc/systemd/system/kakebo-frontend.service
```

Add the following content:

```ini
[Unit]
Description=Kakebo Frontend Service
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
Group=YOUR_USERNAME
WorkingDirectory=/home/{user}/kakebo/frontend
Environment="VITE_API_BASE_URL=http://kakebo.local/api"
Environment="PATH=/home/{user}/.nvm/versions/node/v2x.xx.xx/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/{user}/.nvm/versions/node/v2x.xx.xx/bin/yarn preview --host 127.0.0.1 --port 5174
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Important:** We assume you have cloned the repo in your Ubuntu home folder.

Replace `YOUR_USERNAME` and `{user}` with your actual username and primary group.

**Note:** If you're using nvm (Node Version Manager), you need to use the full paths to `node` and `yarn` from your nvm installation. To find these paths, run:
```bash
which node   # Shows the path to node
which yarn   # Shows the path to yarn
```

Then update the `Environment="PATH=..."` and `ExecStart=...` lines in the service file with the correct paths. If your node version is different from `v2x.xx.xx`, update the path accordingly.

**Note:** The `yarn preview` command serves the built frontend. Alternatively, you can use a static file server like `serve`:

```bash
# Install serve globally
sudo npm install -g serve

# Then use this ExecStart instead:
ExecStart=/usr/bin/serve -s /home/yactouat/kakebo/frontend/dist -l 5174
```

## Step 6: Configure Nginx as Reverse Proxy

### 6.1 Create Nginx configuration

Create `/etc/nginx/sites-available/kakebo`:

```bash
sudo nano /etc/nginx/sites-available/kakebo
```

Add the following content:

```nginx
server {
    listen 80;
    server_name kakebo.local;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }
    
    # Handle /api without trailing slash (redirect to /api/)
    location = /api {
        return 301 /api/;
    }
}
```

### 6.2 Enable the site and restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/kakebo /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 7: Enable and Start Frontend Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable kakebo-frontend.service
sudo systemctl start kakebo-frontend.service
sudo systemctl status kakebo-frontend.service
```

## Step 8: Verify Everything is Running

Check all services:

```bash
sudo systemctl status kakebo-api.service
sudo systemctl status kakebo-frontend.service
sudo systemctl status nginx
```

Test the application:

```bash
curl http://kakebo.local/api
```

You should see: `{"data":null,"msg":"kakebo backend is running"}`

Open `http://kakebo.local` in your browser to access the frontend.

## Troubleshooting

### Check service logs

```bash
# API logs
sudo journalctl -u kakebo-api.service -f

# Frontend logs
sudo journalctl -u kakebo-frontend.service -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Fix "404 Not Found" on API routes

If you're getting 404 errors on API routes (e.g., `/api/fixed-expense-entries`) even though the API root (`/api`) works, this is usually a reverse proxy configuration issue.

1. **Update the nginx configuration**: Ensure the `/api/` location block has a trailing slash:
   ```bash
   sudo nano /etc/nginx/sites-available/kakebo
   ```
   
   The location block should be:
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:8001/;
       ...
   }
   ```
   
   And add a redirect for `/api` without trailing slash:
   ```nginx
   location = /api {
       return 301 /api/;
   }
   ```

2. **Update the API service to include root_path**: Edit the service file:
   ```bash
   sudo nano /etc/systemd/system/kakebo-api.service
   ```
   
   Update the ExecStart line to include `--root-path /api`:
   ```ini
   ExecStart=/home/{user}/kakebo/api/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --root-path /api
   ```

3. **Reload services**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart kakebo-api.service
   sudo nginx -t  # Test nginx configuration
   sudo systemctl restart nginx
   ```

4. **Verify the fix**: Test an API route:
   ```bash
   curl http://kakebo.local/api/fixed-expense-entries?month=2025-12
   ```
   
   You should get a JSON response with data, not a 404 error.

### Fix "502 Bad Gateway" error

If you're getting a 502 Bad Gateway error when accessing `http://kakebo.local/api/`, it usually means Nginx can't connect to the backend service. Common causes:

1. **Services not running**: Check if the services are actually running:
   ```bash
   sudo systemctl status kakebo-api.service
   sudo systemctl status kakebo-frontend.service
   ```

2. **Port mismatch**: The services might be running on different ports than expected. Check what's actually listening:
   ```bash
   sudo netstat -tlnp | grep -E ':(8001|5174|8000|5173)'
   # or
   sudo ss -tlnp | grep -E ':(8001|5174|8000|5173)'
   ```
   
   - API should be on port **8001** (not 8000)
   - Frontend should be on port **5174** (not 5173)
   
   If you see processes on 8000 or 5173, they might be manually started processes. Stop them:
   ```bash
   # Find and stop manual processes
   ps aux | grep -E '(uvicorn|vite|yarn preview)' | grep -v grep
   # Kill the PIDs shown (replace PID with actual process ID)
   kill <PID>
   ```

3. **Services failed to start**: If services show as inactive or failed:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart kakebo-api.service
   sudo systemctl restart kakebo-frontend.service
   sudo systemctl status kakebo-api.service
   sudo systemctl status kakebo-frontend.service
   ```

4. **Test direct connection**: Verify the API is responding on the correct port:
   ```bash
   curl http://127.0.0.1:8001/
   # Should return: {"data":null,"msg":"kakebo backend is running"}
   ```

5. **Restart Nginx**: After fixing the services, restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### Fix "203/EXEC" error for frontend service

If you see `status=203/EXEC` when checking the frontend service status, it means systemd couldn't execute the command. This usually happens when:

1. **Node/yarn paths are incorrect**: If you're using nvm, the paths in the service file need to point to your actual nvm installation. Check your paths:
   ```bash
   which node
   which yarn
   ```
   Then update the service file at `/etc/systemd/system/kakebo-frontend.service` with the correct paths.

2. **Executable doesn't exist**: Verify the paths exist:
   ```bash
   ls -la $(which node)
   ls -la $(which yarn)
   ```

3. **Wrong command syntax**: Don't run `yarn` with `node` - yarn is a standalone executable. Use:
   ```ini
   ExecStart=/path/to/yarn preview --host 127.0.0.1 --port 5174
   ```
   Not:
   ```ini
   ExecStart=/path/to/node /path/to/yarn preview ...
   ```

After fixing the service file, reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart kakebo-frontend.service
sudo systemctl status kakebo-frontend.service
```

### Verify database path

Ensure the database is at the correct location:

```bash
ls -la /home/yactouat/kakebo/api/kakebo.db
```

The database path in `api/db.py` uses `"kakebo.db"` which is relative to the `api` directory when the service runs from that working directory.

### Restart services

```bash
sudo systemctl restart kakebo-api.service
sudo systemctl restart kakebo-frontend.service
sudo systemctl restart nginx
```

### Check ports

```bash
sudo netstat -tlnp | grep -E ':(8001|5174|80)'
```

## Updating the Application

After making changes:

1. **Backend changes:**
   ```bash
   cd /home/yactouat/kakebo/api
   source venv/bin/activate
   pip install -r requirements.txt  # If dependencies changed
   sudo systemctl restart kakebo-api.service
   ```

2. **Frontend changes:**
   ```bash
   cd /home/yactouat/kakebo/frontend
   yarn build
   sudo systemctl restart kakebo-frontend.service
   ```

## Alternative: Using Static File Serving for Frontend

If you prefer to serve the frontend as static files through Nginx instead of using a Node.js service:

1. Modify `/etc/nginx/sites-available/kakebo`:

```nginx
server {
    listen 80;
    server_name kakebo.local;
    root /home/yactouat/kakebo/frontend/dist;
    index index.html;

    # Frontend - serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Handle /api without trailing slash (redirect to /api/)
    location = /api {
        return 301 /api/;
    }
}
```

2. Set the API base URL in the frontend build by creating a `.env.production` file:

```bash
cd /home/yactouat/kakebo/frontend
echo "VITE_API_BASE_URL=http://kakebo.local/api" > .env.production
yarn build
```

3. You can then disable the frontend service and only use Nginx:

```bash
sudo systemctl stop kakebo-frontend.service
sudo systemctl disable kakebo-frontend.service
sudo systemctl restart nginx
```

This approach is more efficient as it doesn't require a Node.js process running for the frontend.

