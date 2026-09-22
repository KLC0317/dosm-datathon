# Destinasi Seimbang

DOSM Datathon 2026 dashboard: a Malaysia tourism pressure-to-prosperity intelligence layer for public-sector planning.

The repository contains a Python FastAPI backend, a Next.js frontend, a reproducible DOSM/OpenDOSM data extract, and a Malaysia state GeoJSON map.

## Local run

From the repository root, start the API:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, start the frontend:

```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The dashboard also has a static fallback, so the evidence view still renders if the API is temporarily unavailable. The scenario simulator uses the API when it is running.

## API services

- `GET /api/health` â€” service health
- `GET /api/datasets` â€” data vintage, sources and latest quarterly pulse
- `GET /api/dashboard` â€” full SQLite-backed dashboard extract for the frontend
- `GET /api/overview` â€” national indicators and quadrant counts
- `GET /api/states` â€” sortable/filterable state records
- `GET /api/states/{state}` â€” one state evidence record
- `POST /api/scenario` â€” pressure/prosperity intervention simulation
- `POST /api/brief` â€” source-cited Markdown policy brief for download
- `POST /api/ask` â€” grounded Gemini policy copilot, with deterministic fallback
- `GET /api/ai/status` â€” model configuration and SQLite storage status

## Refresh the data extract

The downloaded files are in `data/`:

- `dts_2025.xlsx` â€” DOSM Domestic Tourism Survey 2025
- `dts_q1_2026.xlsx` â€” DOSM Domestic Tourism Survey Q1 2026 latest quarterly pulse
- `cpi_2d_state.csv` â€” OpenDOSM state CPI
- `population_state.csv` â€” OpenDOSM state population
- `tourism_domestic_2025-q4_en.pdf` â€” DOSM Q4 2025 tourism bulletin
- `malaysia.state.min.geojson` â€” open-licensed Malaysia state boundaries

After replacing a source file with a newer DOSM release, run:

```powershell
python backend/prepare_data.py
Copy-Item data/dashboard_data.json frontend/public/dashboard_data.json -Force
```

`backend/prepare_data.py` reads the official DTS workbook tables, joins the current population and CPI extracts, calculates the relative pressure/prosperity signals, builds a four-quarter rolling-backtest ETS/AutoReg ensemble forecast with uncertainty and driver explanations, summarises OpenDOSM air pollution, and writes `dashboard_data.json`. On API startup, that extract is projected into SQLite at `data/dashboard.db`; the API reads the SQLite projection for state queries and retains the full extract for forecast and policy metadata. The database is refreshed automatically when the extract hash changes.

## Gemini policy copilot

Set `GEMINI_KEY` in a local `.env` file. The backend uses `gemini-3.1-flash-lite` through Gemini's REST `generateContent` API and sends only a compact, approved DOSM context containing the selected state, national indicators, forecast summary, environment summary and source metadata. The model must return structured evidence, interpretation, limitations and next action fields. If the key is absent, the request fails, or the model response is invalid, `/api/ask` returns the auditable deterministic response instead. No key is exposed to the frontend.

## Production shape

Build the frontend with `npm run build` and serve it with `npm start`. Run FastAPI behind the same domain on port 8000. The Next.js rewrite in `frontend/next.config.mjs` forwards `/api/*` requests to the API.

For a VPS, place Nginx or Caddy in front of port 3000, keep port 8000 private, and run both processes with a service manager such as systemd or PM2. Add an HTTPS domain before exposing the policy assistant or any future authenticated features.

## Current model boundary

The pressure and prosperity scores are transparent relative screening indices. They help prioritise investigation and simulate directional trade-offs; they are not official carrying-capacity limits or causal impact estimates. The evidence page in the dashboard makes this limitation visible to judges and future users.

## Submission package

The `submission/` folder contains the organiser README, a static dashboard PDF, and a ZIP package. The ZIP is generated with `submission/package.ps1`.

## Visual grammar

All analytical chart visuals use Vega-Lite through `react-vega`: KPI sparklines, score meters, forecast uncertainty bands, pressure/prosperity matrix, portfolio ranking, evidence-to-action matrix, state-leader lollipop chart and environmental stress bars. The views use layered marks, ranked comparisons, heatmap encoding, quantitative scales, legends, tooltips and interactive state flag selection. The map remains a geographic interaction because it needs direct state selection.

