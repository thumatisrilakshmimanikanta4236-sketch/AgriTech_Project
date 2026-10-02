# AgriTech AI — Smart Insights. Healthy Crops. Better Profits.

Prototype for Indian farmers: price history, price forecasting, disease-detection interface, and alerts. Read `docs/STATUS.md` for demo/real/not-implemented boundaries.

## Requirements
- Python 3.10+ (3.11 recommended)
- Node.js 20+ and npm
- Windows, macOS, or Linux

## Run on Windows (PowerShell)
Open a terminal in the extracted `agrivision-ai` project folder.

### 1. Backend
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item ..\.env.example .env
python ..\data\make_demo_data.py
python ..\ml\forecasting\train.py --csv ..\data\demo_prices.csv --out ..\ml\forecasting\artifacts
uvicorn app.main:app --reload
```
Backend API: http://127.0.0.1:8000/docs

### 2. Frontend (open a second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (usually http://localhost:5173). Keep both terminals running.

### macOS/Linux
Use `python3 -m venv .venv`, `source .venv/bin/activate`, and `cp ../.env.example .env` in the backend steps. Use the same pip, training, uvicorn, and frontend commands otherwise.

## Tests
From the project root:
```bash
cd backend
python -m pytest
```

## Deploy on Render
1. Keep the full current project in the repository's `AgriVisionAI/` directory, and put `render.yaml` at the repository root. Do not commit `.env`, local databases, virtual environments, or `node_modules`.
2. In Render, choose **New + → Blueprint**, connect the repository, and deploy the root `render.yaml` Blueprint.
3. Render creates the API and frontend services. Open the `agrivision-web` service URL when both are live; the frontend API host and backend CORS origin are wired from the Blueprint.

The Blueprint uses free services and SQLite for a demo deployment. Render's free service filesystem is ephemeral, so registered accounts and alerts can be lost after a restart or redeploy. Use a persistent database and an appropriately sized paid service before relying on stored user data.

## Data and model limitations
The included CSV is synthetic demo data, not live market data. Demo metrics do not establish real-world accuracy. The forecasting trainer compares XGBoost and LightGBM when installed. Disease inference explicitly reports unavailable until a real trained checkpoint and inference loader are implemented. Do not use this prototype as agricultural, pesticide, or financial advice.
