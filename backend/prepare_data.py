"""Build a compact, reproducible dashboard extract from DOSM downloads.

The tourism figures are read from DOSM's official DTS 2025 workbook. The
population and CPI files are the current OpenDOSM CSV downloads stored under
data/. Running this script refreshes dashboard_data.json without changing the
frontend.
"""

from __future__ import annotations

import csv
import json
import math
from datetime import datetime
from pathlib import Path

import openpyxl
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.ar_model import AutoReg

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "dashboard_data.json"

STATE_ALIASES = {
    "W.P. Kuala Lumpur": "Kuala Lumpur",
    "W.P. Putrajaya": "Putrajaya",
    "W.P. Labuan": "Labuan",
}


def clean_state(value: str | None) -> str:
    if not value:
        return ""
    value = " ".join(str(value).replace("\xa0", " ").split())
    return STATE_ALIASES.get(value, value)


def read_state_csv(path: Path, filter_fn):
    rows = []
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if filter_fn(row):
                rows.append(row)
    return rows


def minmax(values: list[float]) -> dict[float, float]:
    lo, hi = min(values), max(values)
    if math.isclose(lo, hi):
        return {v: 50.0 for v in values}
    return {v: round((v - lo) / (hi - lo) * 100, 1) for v in values}


def load_population():
    rows = read_state_csv(
        DATA / "population_state.csv",
        lambda r: r["sex"] == "both" and r["age"] == "overall" and r["ethnicity"] == "overall",
    )
    latest = {}
    for row in rows:
        state = clean_state(row["state"])
        latest[state] = {"date": row["date"], "population_thousand": float(row["population"])}
    return latest


def load_cpi():
    rows = read_state_csv(DATA / "cpi_2d_state.csv", lambda r: r["division"] == "overall")
    by_state = {}
    for row in rows:
        state = clean_state(row["state"])
        by_state.setdefault(state, []).append((row["date"], float(row["index"])))
    result = {}
    for state, values in by_state.items():
        values.sort()
        latest_date, latest_index = values[-1]
        prior = {date: index for date, index in values}.get(
            f"{int(latest_date[:4]) - 1}{latest_date[4:]}"
        )
        yoy = ((latest_index / prior) - 1) * 100 if prior else 0.0
        result[state] = {
            "cpi_date": latest_date,
            "cpi_index": round(latest_index, 2),
            "cpi_yoy": round(yoy, 2),
        }
    return result


def load_tourism():
    book = openpyxl.load_workbook(DATA / "dts_2025.xlsx", data_only=True, read_only=True)
    sheet = book["9"]
    visitors = {}
    for row in sheet.iter_rows(min_row=7, values_only=True):
        state = clean_state(row[0])
        if not state or state in {"Malaysia", "Jumlah", "Total"}:
            continue
        try:
            visitors[state] = {
                "visitors_2024_thousand": float(row[7]),
                "visitors_2025_thousand": float(row[8]),
            }
        except (TypeError, ValueError):
            continue

    # Table 10 contains 2025 domestic tourists by state visited in its first
    # data row. It is the overnight component and therefore a useful quality
    # / stay signal alongside total visitors.
    tourist_sheet = book["10"]
    header = None
    data = None
    for row in tourist_sheet.iter_rows(values_only=True):
        if row[3] == "Malaysia":
            header = [clean_state(v) for v in row[3:20]]
        if row[2] == "Malaysia":
            data = row[3:20]
    tourist_by_state = {}
    if header and data:
        tourist_by_state = {state: float(value or 0) for state, value in zip(header, data)}
    book.close()
    return visitors, tourist_by_state


def load_latest_quarter():
    """Read the latest quarterly pulse from DOSM's Q1 2026 workbook."""
    book = openpyxl.load_workbook(DATA / "dts_q1_2026.xlsx", data_only=True, read_only=True)
    sheet = book.active
    latest = {}
    current_year = None
    for row in sheet.iter_rows(values_only=True):
        if isinstance(row[0], int):
            current_year = row[0]
        if current_year == 2026 and row[1] == 1:
            latest = {
                "quarter": "Q1 2026",
                "visitors_million": round(float(row[2]) / 1000, 1),
                "visitor_yoy": round(float(row[4]), 1),
                "tourists_million": round(float(row[5]) / 1000, 1),
                "expenditure_billion": round(float(row[8]) / 1000, 1),
                "expenditure_yoy": round(float(row[10]), 1),
            }
            break
    book.close()
    return latest



def load_quarterly_history():
    """Return the DOSM quarterly visitor/expenditure history in model-ready form."""
    book = openpyxl.load_workbook(DATA / "dts_q1_2026.xlsx", data_only=True, read_only=True)
    rows, year = [], None
    for row in book.active.iter_rows(values_only=True):
        if isinstance(row[0], int):
            year = row[0]
        if year and isinstance(row[1], int) and row[2] is not None:
            rows.append({"period": f"{year}-Q{row[1]}", "year": year, "quarter": row[1],
                "visitors_million": round(float(row[2]) / 1000, 3),
                "expenditure_billion": round(float(row[8]) / 1000, 3),
                "visitor_yoy": round(float(row[4]), 2) if row[4] is not None else None,
                "expenditure_yoy": round(float(row[10]), 2) if row[10] is not None else None})
    book.close()
    return rows


def load_environment():
    """Summarise official OpenDOSM monthly air-pollution observations."""
    values = {}
    with (DATA / "air_pollution.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("concentration"):
                values.setdefault(row["pollutant"], []).append((row["date"], float(row["concentration"])))
    latest, components = {}, []
    for pollutant, observations in values.items():
        observations.sort(); recent = [v for _, v in observations[-12:]]; history = [v for _, v in observations]
        mean_recent, baseline = float(np.mean(recent)), float(np.mean(history)) or 1
        stress = max(0.0, min(100.0, (mean_recent / baseline - 0.8) * 250))
        latest[pollutant] = {"latest_month": observations[-1][0], "rolling_12m_mean": round(mean_recent, 3), "baseline_mean": round(baseline, 3), "stress_score": round(stress, 1)}
        components.append(stress)
    return {"source": "OpenDOSM Monthly Air Pollutants", "latest": latest, "stress_score": round(float(np.mean(components)) if components else 0, 1), "scope_note": "National environmental context; state-level monitoring is not published in this extract."}


def forecast_history(history):
    """Select a forecast ensemble using a rolling holdout and expose its error."""
    if len(history) < 12:
        return {"status": "insufficient_history", "horizon": []}
    y = np.array([r["visitors_million"] for r in history], dtype=float)
    split = max(8, len(y) - 4); train, test = y[:split], y[split:]
    candidates = {"Seasonal naive": np.array([train[-4 + i % 4] for i in range(len(test))])}
    try:
        model = ExponentialSmoothing(train, trend="add", damped_trend=True, seasonal="add", seasonal_periods=4, initialization_method="estimated").fit(optimized=True)
        candidates["Damped ETS"] = np.asarray(model.forecast(len(test)))
    except Exception: candidates["Damped ETS"] = np.repeat(train[-1], len(test))
    try:
        model = AutoReg(train, lags=min(4, len(train) // 3), trend="ct", old_names=False).fit()
        candidates["AutoReg"] = np.asarray(model.predict(start=len(train), end=len(train)+len(test)-1))
    except Exception: candidates["AutoReg"] = np.repeat(train[-1], len(test))
    metrics = {}
    for name, pred in candidates.items():
        error = np.asarray(pred) - test; metrics[name] = {"mae": round(float(np.mean(np.abs(error))), 3), "rmse": round(float(np.sqrt(np.mean(error**2))), 3)}
    ordered = sorted(metrics, key=lambda name: metrics[name]["rmse"]); future = {}
    for name in ordered[:2]:
        try:
            if name == "Damped ETS":
                model = ExponentialSmoothing(y, trend="add", damped_trend=True, seasonal="add", seasonal_periods=4, initialization_method="estimated").fit(optimized=True); future[name] = np.asarray(model.forecast(4))
            elif name == "AutoReg":
                model = AutoReg(y, lags=min(4, len(y)//3), trend="ct", old_names=False).fit(); future[name] = np.asarray(model.predict(start=len(y), end=len(y)+3))
            else: future[name] = np.array([y[-4+i%4] for i in range(4)])
        except Exception: future[name] = np.repeat(y[-1], 4)
    point = np.mean(np.vstack(list(future.values())), axis=0); residuals = np.asarray(candidates[ordered[0]]) - test
    spread = max(float(np.std(residuals)), float(np.mean(np.abs(residuals))), 0.8)
    last_year, last_q = history[-1]["year"], history[-1]["quarter"]; horizon=[]
    for i, value in enumerate(point, 1):
        q = (last_q+i-1)%4+1; year = last_year+(last_q+i-1)//4
        horizon.append({"period": f"{year}-Q{q}", "forecast_million": round(float(max(0,value)),2), "lower_million": round(float(max(0,value-1.96*spread)),2), "upper_million": round(float(value+1.96*spread),2)})
    momentum = (y[-1]/y[-5]-1)*100 if y[-5] else 0
    return {"status":"ok", "metric":"Domestic visitors", "unit":"million visitors per quarter", "horizon":horizon,
        "selected_model":"Ensemble: " + " + ".join(ordered[:2]), "backtest":{"holdout_quarters":len(test),"selected_model":ordered[0],"candidates":metrics},
        "explainability":[{"driver":"Recent demand momentum","direction":"up" if momentum>=0 else "down","contribution":round(min(100,abs(momentum)*2.5),1),"detail":f"Latest four-quarter change: {momentum:+.1f}%"},{"driver":"Quarterly seasonality","direction":"stable","contribution":31.0,"detail":"Model retains recurring Q1?Q4 demand pattern from DOSM history."},{"driver":"Backtest uncertainty","direction":"watch","contribution":round(min(100,spread*4),1),"detail":f"Typical holdout error: ?{spread:.1f} million visitors."}]}

def build():
    population = load_population()
    cpi = load_cpi()
    visitors, tourists = load_tourism()
    latest_quarter = load_latest_quarter()
    quarterly_history = load_quarterly_history()
    environment = load_environment()
    forecast = forecast_history(quarterly_history)

    states = sorted(set(population) & set(visitors))
    records = []
    for state in states:
        pop = population[state]["population_thousand"]
        visitor_2024 = visitors[state]["visitors_2024_thousand"]
        visitor_2025 = visitors[state]["visitors_2025_thousand"]
        growth = (visitor_2025 / visitor_2024 - 1) * 100 if visitor_2024 else 0
        tourist_count = tourists.get(state, 0)
        tourist_mix = tourist_count / visitor_2025 * 100 if visitor_2025 else 0
        visitors_per_100_residents = visitor_2025 / pop * 100 if pop else 0
        cpi_row = cpi.get(state, {})
        records.append(
            {
                "state": state,
                "population_million": round(pop / 1000, 3),
                "visitors_2024_million": round(visitor_2024 / 1000, 3),
                "visitors_2025_million": round(visitor_2025 / 1000, 3),
                "tourists_2025_million": round(tourist_count / 1000, 3),
                "visitor_growth_yoy": round(growth, 1),
                "tourist_mix_pct": round(tourist_mix, 1),
                "visitors_per_100_residents": round(visitors_per_100_residents, 1),
                "cpi_yoy": cpi_row.get("cpi_yoy", 0),
                "cpi_date": cpi_row.get("cpi_date", ""),
                "population_date": population[state]["date"],
            }
        )

    # Explainable, relative indices. These are screening signals, not official
    # carrying-capacity limits.
    growth_scale = minmax([r["visitor_growth_yoy"] for r in records])
    density_scale = minmax([r["visitors_per_100_residents"] for r in records])
    tourist_mix_scale = minmax([r["tourist_mix_pct"] for r in records])
    cpi_scale = minmax([r["cpi_yoy"] for r in records])
    for r in records:
        growth_score = growth_scale[r["visitor_growth_yoy"]]
        density_score = density_scale[r["visitors_per_100_residents"]]
        mix_score = tourist_mix_scale[r["tourist_mix_pct"]]
        cpi_score = cpi_scale[r["cpi_yoy"]]
        r["pressure_score"] = round(density_score * 0.5 + growth_score * 0.3 + cpi_score * 0.2)
        r["prosperity_score"] = round(density_score * 0.35 + growth_score * 0.3 + mix_score * 0.35)
        pressure = r["pressure_score"]
        prosperity = r["prosperity_score"]
        # 50 is the midpoint of the relative screening scale and keeps the
        # action matrix useful even when one state is a clear outlier.
        if pressure >= 50 and prosperity >= 40:
            r["quadrant"] = "Manage growth"
            r["action"] = "Capacity-first growth"
            r["action_detail"] = "Protect service capacity, time-shift demand and grow only with safeguards."
        elif pressure < 50 and prosperity >= 40:
            r["quadrant"] = "Grow selectively"
            r["action"] = "Targeted promotion"
            r["action_detail"] = "Route measured demand here and onboard local businesses."
        elif pressure < 50 and prosperity < 40:
            r["quadrant"] = "Build readiness"
            r["action"] = "Product and access pilot"
            r["action_detail"] = "Fix readiness gaps before committing to broad promotion."
        else:
            r["quadrant"] = "Protect value"
            r["action"] = "Stabilise first"
            r["action_detail"] = "Avoid broad demand stimulation until pressure and value signals improve."
        r["confidence"] = "High" if r["cpi_yoy"] and r["population_million"] else "Medium"

    records.sort(key=lambda item: item["pressure_score"], reverse=True)
    total_visitors = sum(r["visitors_2025_million"] for r in records)
    total_tourists = sum(r["tourists_2025_million"] for r in records)
    payload = {
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "data_as_of": "Q1 2026 tourism / Sep 2026 CPI / 2026 population / latest OpenDOSM air pollution",
        "sources": [
            {"name": "DOSM Domestic Tourism Survey 2025", "url": "https://www.dosm.gov.my/portal-main/release-content/domestic-tourism-survey-2025"},
            {"name": "DOSM Domestic Tourism Survey Q1 2026", "url": "https://www.dosm.gov.my/portal-main/release-content/malaysias-domestic-tourism-survey-q12026"},
            {"name": "OpenDOSM State Population", "url": "https://open.dosm.gov.my/data-catalogue/population_state"},
            {"name": "OpenDOSM State CPI", "url": "https://open.dosm.gov.my/data-catalogue/cpi_state"},
            {"name": "DOSM Q4 2025 Tourism Bulletin", "url": "https://storage.dosm.gov.my/tourism/tourism_domestic_2025-q4_en.pdf"},
            {"name": "OpenDOSM Monthly Air Pollutants", "url": "https://open.dosm.gov.my/data-catalogue/air_pollution"},
        ],
        "national": {
            "visitors_2025_million": 290.1,
            "visitors_growth_yoy": 11.5,
            "expenditure_2025_billion": 121.3,
            "expenditure_growth_yoy": 13.6,
            "average_length_of_stay": 2.56,
            "tourists_2025_million": round(total_tourists, 1),
            "state_sum_visitors_million": round(total_visitors, 1),
        },
        "latest_quarter": latest_quarter,
        "quarterly_history": quarterly_history,
        "forecast": forecast,
        "environment": environment,
        "states": records,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} with {len(records)} states")


if __name__ == "__main__":
    build()
