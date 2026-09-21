DESTINASI SEIMBANG: DOSM DATATHON 2026 DASHBOARD
================================================

Purpose
-------
A government planning dashboard that balances tourism demand pressure, local prosperity potential and environmental context for Malaysia. It supports state prioritisation, four-quarter demand forecasting, transparent explanations and policy what-if scenarios.

What is included
----------------
- frontend/: Next.js interactive dashboard
- backend/: FastAPI evidence and scenario services
- data/: DOSM/OpenDOSM extracts, forecast-ready history and Malaysia map
- frontend/public/dashboard_data.json: bundled extract for offline rendering
- Destinasi_Seimbang_Dashboard_Static.pdf: static dashboard layout for submission

Run locally
-----------
1. Install Python dependencies:
   pip install -r backend/requirements.txt
2. Start the API from the project root:
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
3. In a second terminal:
   cd frontend
   npm install --legacy-peer-deps
   npm run dev
4. Open http://localhost:3000.

The dashboard loads the bundled extract if the API is unavailable. Scenario simulation, brief export, forecasting and policy copilot use the FastAPI service when it is running.

Navigation
----------
- Command centre: state map, priority queue, pressure/prosperity matrix, forecast and environmental context.
- What-if lab: move promotion, capacity and pressure-cap controls, then run the portfolio simulation.
- Evidence & method: inspect official sources, scoring contract and model caveats.
- Policy copilot: ask a source-aware question about a state or signal.

Data and model
--------------
Tourism data comes from DOSM Domestic Tourism Survey 2025 and the latest DOSM quarterly workbook (through Q1 2026). Population and CPI are official OpenDOSM state extracts. The environmental context uses the official OpenDOSM Monthly Air Pollutants catalogue. State boundaries are bundled locally for reproducible map rendering.

The forecast uses a rolling four-quarter holdout to compare seasonal naive, damped ETS and AutoReg candidates. The two best candidates are ensembled. The dashboard shows the selected model, holdout MAE/RMSE, point forecast and an uncertainty band. Driver explanations describe recent momentum, quarterly seasonality and backtest uncertainty. These are decision-support explanations, not causal claims.

The pressure and prosperity scores are relative screening indices. They are not official carrying-capacity limits, safety thresholds or causal impact estimates. The air-pollution score is national context because the bundled public extract does not provide a comparable state-level monitoring series.

Refresh data
------------
Replace the source files under data/ and run:
   python backend/prepare_data.py
   Copy-Item data/dashboard_data.json frontend/public/dashboard_data.json -Force

Submission notes
----------------
This build includes a working interactive dashboard, static PDF, source data extract, README and reproducible preparation script. For the organiser's accepted interactive format, provide the hosted URL or confirm approval for the Next.js package. No runtime API key or inaccessible external font is required.

Visual layer
------------
All analytical chart visuals use Vega-Lite: KPI sparklines, score bars, the layered forecast with uncertainty band, interactive policy matrix, portfolio composition and evidence flow. These are declarative specifications rendered locally in the browser; no chart CDN is required.
