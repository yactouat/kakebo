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

## Running as a Service on Ubuntu

To run the entire stack as a systemd service on Ubuntu 24, always available at `http://kakebo.local`, see the [Local Service Setup Guide](docs/local-service-setup.md).

## Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

**Have questions or ideas?** Join the discussion at https://github.com/yactouat/kakebo/discussions

## License

See [LICENSE](LICENSE) file for details.
