from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "dashboard_data.json"
DEFAULT_DB_FILE = ROOT / "data" / "dashboard.db"


def database_path() -> Path:
    configured = os.getenv("DOSM_DB_PATH")
    return Path(configured).expanduser() if configured else DEFAULT_DB_FILE


def connect() -> sqlite3.Connection:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    return connection


def _schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS dashboard (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            generated_at TEXT NOT NULL,
            data_as_of TEXT NOT NULL,
            payload TEXT NOT NULL,
            source_hash TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS states (
            state TEXT PRIMARY KEY,
            pressure_score REAL NOT NULL,
            prosperity_score REAL NOT NULL,
            quadrant TEXT NOT NULL,
            payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sources (
            dataset_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            payload TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_states_pressure ON states(pressure_score DESC);
        CREATE INDEX IF NOT EXISTS idx_states_prosperity ON states(prosperity_score DESC);
        CREATE INDEX IF NOT EXISTS idx_states_quadrant ON states(quadrant);
        """
    )


def initialize(force: bool = False) -> Path:
    """Create or refresh the SQLite projection from the generated dashboard extract."""
    raw = DATA_FILE.read_bytes()
    source_hash = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw.decode("utf-8"))
    connection = connect()
    try:
        _schema(connection)
        existing = connection.execute("SELECT source_hash FROM dashboard WHERE id = 1").fetchone()
        if not force and existing and existing["source_hash"] == source_hash:
            return database_path()

        connection.execute("DELETE FROM states")
        connection.execute("DELETE FROM sources")
        connection.execute("DELETE FROM dashboard")
        connection.execute(
            "INSERT INTO dashboard(id, generated_at, data_as_of, payload, source_hash) VALUES(1, ?, ?, ?, ?)",
            (data.get("generated_at", ""), data.get("data_as_of", ""), json.dumps(data), source_hash),
        )
        connection.executemany(
            "INSERT INTO states(state, pressure_score, prosperity_score, quadrant, payload) VALUES(?, ?, ?, ?, ?)",
            [
                (
                    item["state"],
                    item.get("pressure_score", 0),
                    item.get("prosperity_score", 0),
                    item.get("quadrant", ""),
                    json.dumps(item),
                )
                for item in data.get("states", [])
            ],
        )
        connection.executemany(
            "INSERT INTO sources(dataset_id, name, payload) VALUES(?, ?, ?)",
            [
                (item.get("dataset_id", item.get("name", "source")), item.get("name", ""), json.dumps(item))
                for item in data.get("sources", [])
            ],
        )
        connection.commit()
    finally:
        connection.close()
    return database_path()


def _dashboard_row(connection: sqlite3.Connection) -> dict[str, Any]:
    row = connection.execute("SELECT payload FROM dashboard WHERE id = 1").fetchone()
    if row is None:
        initialize(force=True)
        row = connection.execute("SELECT payload FROM dashboard WHERE id = 1").fetchone()
    return json.loads(row["payload"])


def load_dashboard() -> dict[str, Any]:
    initialize()
    connection = connect()
    try:
        return _dashboard_row(connection)
    finally:
        connection.close()


def list_states(quadrant: str | None = None, sort: str = "pressure_score") -> list[dict[str, Any]]:
    initialize()
    allowed = {
        "pressure_score",
        "prosperity_score",
        "visitors_2025_million",
        "visitor_growth_yoy",
        "tourist_mix_pct",
        "cpi_yoy",
    }
    sort_key = sort if sort in allowed else "pressure_score"
    # Sort normalized numeric columns in SQL where possible; the other permitted
    # fields are read from the compact JSON state payload after filtering.
    connection = connect()
    try:
        query = "SELECT payload FROM states"
        params: list[Any] = []
        if quadrant:
            query += " WHERE quadrant = ?"
            params.append(quadrant)
        rows = [json.loads(row["payload"]) for row in connection.execute(query, params)]
        return sorted(rows, key=lambda item: item.get(sort_key, 0), reverse=True)
    finally:
        connection.close()


def get_state(state_name: str) -> dict[str, Any] | None:
    initialize()
    connection = connect()
    try:
        row = connection.execute(
            "SELECT payload FROM states WHERE lower(state) = lower(?)", (state_name,)
        ).fetchone()
        return json.loads(row["payload"]) if row else None
    finally:
        connection.close()


def status() -> dict[str, Any]:
    initialize()
    connection = connect()
    try:
        row = connection.execute(
            "SELECT generated_at, data_as_of, updated_at FROM dashboard WHERE id = 1"
        ).fetchone()
        return {
            "path": str(database_path()),
            "generated_at": row["generated_at"] if row else None,
            "data_as_of": row["data_as_of"] if row else None,
            "updated_at": row["updated_at"] if row else None,
            "state_count": connection.execute("SELECT COUNT(*) AS count FROM states").fetchone()["count"],
        }
    finally:
        connection.close()
