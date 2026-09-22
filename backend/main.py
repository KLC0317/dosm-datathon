from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend import ai_service, db

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "dashboard_data.json"

app = FastAPI(title="Destinasi Seimbang API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_data():
    return db.load_dashboard()


@app.on_event("startup")
def initialize_storage():
    db.initialize()


class ScenarioRequest(BaseModel):
    promotion_shift: float = Field(10, ge=0, le=30)
    capacity_investment: float = Field(18, ge=0, le=100)
    pressure_cap: float = Field(70, ge=20, le=100)


class BriefRequest(BaseModel):
    state: str | None = None
    scenario: ScenarioRequest | None = None


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


@app.get("/api/health")
def health():
    storage = db.status()
    return {
        "status": "ok",
        "service": "destinasi-seimbang",
        "data_file": DATA_FILE.name,
        "database": storage,
        "ai": ai_service.configuration(),
    }


@app.get("/api/ai/status")
def ai_status():
    return {"ai": ai_service.configuration(), "database": db.status()}


@app.get("/api/datasets")
def datasets():
    data = load_data()
    return {
        "data_as_of": data["data_as_of"],
        "generated_at": data["generated_at"],
        "sources": data["sources"],
        "state_count": len(data["states"]),
        "latest_quarter": data.get("latest_quarter"),
    }


@app.get("/api/dashboard")
def dashboard():
    """Return the SQLite-backed dashboard document for the frontend runtime."""
    return load_data()


@app.get("/api/overview")
def overview():
    data = load_data()
    states = data["states"]
    return {
        "generated_at": data["generated_at"],
        "data_as_of": data["data_as_of"],
        "national": data["national"],
        "state_count": len(states),
        "manage_growth": sum(s["quadrant"] == "Manage growth" for s in states),
        "grow_selectively": sum(s["quadrant"] == "Grow selectively" for s in states),
        "build_readiness": sum(s["quadrant"] == "Build readiness" for s in states),
        "protect_value": sum(s["quadrant"] == "Protect value" for s in states),
        "sources": data["sources"],
        "forecast": data.get("forecast"),
        "environment": data.get("environment"),
    }


@app.get("/api/forecast")
def forecast():
    data = load_data()
    return {"data_as_of": data["data_as_of"], "forecast": data.get("forecast"), "history": data.get("quarterly_history", [])}


@app.get("/api/environment")
def environment():
    data = load_data()
    return data.get("environment", {})


@app.get("/api/states")
def states(
    quadrant: str | None = Query(default=None),
    sort: str = Query(default="pressure_score"),
):
    return db.list_states(quadrant=quadrant, sort=sort)


@app.get("/api/states/{state_name}")
def state_detail(state_name: str):
    state = db.get_state(state_name)
    if state:
        return state
    return {"error": "State not found"}


@app.post("/api/scenario")
def scenario(request: ScenarioRequest):
    data = load_data()
    states = data["states"]
    high_pressure = [s for s in states if s["pressure_score"] >= request.pressure_cap]
    low_pressure = [s for s in states if s["pressure_score"] < request.pressure_cap]
    if not low_pressure:
        low_pressure = states

    results = []
    for state in states:
        is_receiver = state in low_pressure and state["prosperity_score"] >= 50
        is_source = state in high_pressure
        relief = request.promotion_shift * (0.68 if is_source else 0)
        lift = request.promotion_shift * (0.42 if is_receiver else 0)
        capacity_relief = request.capacity_investment * (0.22 if is_source else 0.08)
        pressure_after = max(0, min(100, state["pressure_score"] - relief - capacity_relief + lift * 0.28))
        value_after = max(0, min(100, state["prosperity_score"] + lift * 0.8 + capacity_relief * 0.2))
        results.append(
            {
                "state": state["state"],
                "pressure_before": state["pressure_score"],
                "pressure_after": round(pressure_after, 1),
                "prosperity_before": state["prosperity_score"],
                "prosperity_after": round(value_after, 1),
                "pressure_delta": round(pressure_after - state["pressure_score"], 1),
                "value_delta": round(value_after - state["prosperity_score"], 1),
            }
        )
    return {
        "assumptions": {
            "promotion_shift_pct": request.promotion_shift,
            "capacity_investment_index": request.capacity_investment,
            "pressure_cap": request.pressure_cap,
            "note": "Scenario estimates are directional and use the transparent screening model; they are not causal forecasts.",
        },
        "before_high_pressure": len(high_pressure),
        "after_high_pressure": sum(r["pressure_after"] >= request.pressure_cap for r in results),
        "estimated_pressure_reduction": round(sum(max(0, -r["pressure_delta"]) for r in results), 1),
        "estimated_value_lift": round(sum(max(0, r["value_delta"]) for r in results), 1),
        "states": results,
    }


@app.post("/api/brief")
def brief(request: BriefRequest):
    data = load_data()
    selected = next((s for s in data["states"] if request.state and s["state"].lower() == request.state.lower()), None)
    if selected is None:
        selected = max(data["states"], key=lambda s: s["pressure_score"])
    scenario_note = ""
    if request.scenario:
        scenario_note = (
            f"Scenario assumptions: shift {request.scenario.promotion_shift:.0f}% of promotion, "
            f"capacity index {request.scenario.capacity_investment:.0f}, "
            f"pressure cap {request.scenario.pressure_cap:.0f}."
        )
    lines = [
        "# Destinasi Seimbang: Policy Brief",
        "",
        f"**Destination:** {selected['state']}",
        f"**Data vintage:** {data['data_as_of']}",
        "",
        "## Recommended direction",
        f"**{selected['action']}**: {selected['action_detail']}",
        "",
        "## Evidence",
        f"- Pressure score: {selected['pressure_score']}/100",
        f"- Prosperity potential: {selected['prosperity_score']}/100",
        f"- Domestic visitors: {selected['visitors_2025_million']:.3f} million",
        f"- Visitor growth: {selected['visitor_growth_yoy']:+.1f}% year on year",
        f"- Tourist mix: {selected['tourist_mix_pct']:.1f}%",
        f"- State CPI movement: {selected['cpi_yoy']:+.2f}% year on year",
        f"- Environmental context score: {selected.get('environmental_context_score', 0):.1f}/100 (national air-pollution context)",
        "",
        "## Interpretation",
        "This is a relative screening signal combining demand intensity, growth momentum, tourist mix and CPI. It is not an official carrying-capacity limit or a causal estimate.",
    ]
    forecast = data.get("forecast", {})
    if forecast.get("horizon"):
        lines.extend(["", "## Forward look", f"The {forecast.get('selected_model', 'ensemble')} forecasts {forecast['horizon'][0]['forecast_million']:.1f} million domestic visitors in {forecast['horizon'][0]['period']}. Backtest RMSE: {forecast.get('backtest', {}).get('candidates', {}).get(forecast.get('backtest', {}).get('selected_model', ''), {}).get('rmse', 'n/a')} million."])
    if scenario_note:
        lines.extend(["", "## Scenario", scenario_note])
    lines.extend(["", "## Sources"])
    lines.extend(f"- [{source['name']}]({source['url']})" for source in data["sources"])
    return {"filename": f"destinasi-seimbang-{selected['state'].lower().replace(' ', '-')}-brief.md", "markdown": "\n".join(lines)}


@app.post("/api/ask")
def ask(request: AskRequest):
    data = load_data()
    return ai_service.answer(request.question, data)
