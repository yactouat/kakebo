# Kakebo

A personal finance management application based on the Japanese Kakebo budgeting method. Track your income, fixed expenses, and actual expenses across categories (essential, comfort, entertainment, extras, unforeseen) while automatically managing monthly balance carry-forwards.

## Tech Stack

- **Backend:** FastAPI (Python) with SQLite
- **Frontend:** React 19 + TypeScript + Vite + Mantine UI
- **State Management:** Zustand with localStorage persistence

## Quick Start

### Backend

```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
yarn install
# Create .env with: VITE_API_BASE_URL=http://localhost:8000
yarn dev
```

Frontend runs at `http://localhost:5173`

## Documentation

- [Automated Database Backup to Google Drive](docs/backup-to-gdrive.md) - Setting up daily automated backups using cron jobs
- [Balance Carry-Forward System](docs/balance-carry-forward.md) - How the automatic monthly balance carry-forward works
- [Frontend State Management](docs/frontend-state-management.md) - How state management works in the React frontend
- [Local Service Setup Guide](docs/local-service-setup.md) - Running the application as a systemd service on Ubuntu

## Running as a Service on Ubuntu

To run the entire stack as a systemd service on Ubuntu 24, always available at `http://kakebo.local`, see the [Local Service Setup Guide](docs/local-service-setup.md).

### Quick Redeploy

> **Note:** The following commands assume you have cloned the repository in your home folder (e.g., `/home/{user}/kakebo`). If your repository is located elsewhere, adjust the paths accordingly.

After making changes to the code, redeploy the application:

**Redeploy everything:**
```bash
# Backend
cd /home/{user}/kakebo/api && source venv/bin/activate && pip install -r requirements.txt && sudo systemctl restart kakebo-api.service

# Frontend
cd /home/{user}/kakebo/frontend && yarn build && sudo systemctl restart kakebo-frontend.service
```

**Check service status:**
```bash
sudo systemctl status kakebo-api.service
sudo systemctl status kakebo-frontend.service
```

## Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

**Have questions or ideas?** Join the discussion at https://github.com/{user}/kakebo/discussions

## License

See [LICENSE](LICENSE) file for details.
