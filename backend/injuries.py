import sqlite3
import os
from datetime import datetime

# Build an absolute path so it works no matter where uvicorn is started from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.abspath(os.path.join(DATA_DIR, "injuries.db"))

print(f"📁 Injuries database path: {DB_PATH}")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS injuries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            chart_type TEXT NOT NULL,
            category TEXT NOT NULL,
            value REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(month, year, chart_type, category)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_plan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            indicator TEXT NOT NULL,
            cause TEXT,
            action_corrective TEXT,
            action_preventive TEXT,
            responsible TEXT,
            deadline TEXT,
            status TEXT,
            efficacy TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_injury(month, year, chart_type, category, value):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM injuries WHERE month=? AND year=? AND chart_type=? AND category=?",
        (month, int(year), chart_type, category)
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            "UPDATE injuries SET value=?, created_at=? WHERE id=?",
            (float(value), datetime.now().isoformat(), existing["id"])
        )
    else:
        cursor.execute(
            "INSERT INTO injuries (month, year, chart_type, category, value) VALUES (?, ?, ?, ?, ?)",
            (month, int(year), chart_type, category, float(value))
        )
    conn.commit()
    conn.close()

def get_injuries(year=None, month=None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT month, year, chart_type, category, value FROM injuries WHERE 1=1"
    params = []
    if year:
        query += " AND year=?"
        params.append(int(year))
    if month and month != "Tous":
        query += " AND month=?"
        params.append(month)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_injury(month, year, chart_type, category):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM injuries WHERE month=? AND year=? AND chart_type=? AND category=?",
        (month, int(year), chart_type, category)
    )
    conn.commit()
    conn.close()

def save_action_plan(data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO action_plan (month, year, indicator, cause, action_corrective, action_preventive, responsible, deadline, status, efficacy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("month"), data.get("year"), data.get("indicator"),
        data.get("cause", ""), data.get("action_corrective", ""),
        data.get("action_preventive", ""), data.get("responsible", ""),
        data.get("deadline", ""), data.get("status", ""), data.get("efficacy", "")
    ))
    conn.commit()
    conn.close()

def get_action_plans(year=None, month=None, indicator=None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM action_plan WHERE 1=1"
    params = []
    if year:
        query += " AND year=?"
        params.append(int(year))
    if month and month != "Tous":
        query += " AND month=?"
        params.append(month)
    if indicator and indicator != "Tous":
        query += " AND indicator=?"
        params.append(indicator)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Initialize the DB when the module is imported
init_db()
def update_action_plan(data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE action_plan 
        SET month=?, year=?, indicator=?, cause=?, action_corrective=?, 
            action_preventive=?, responsible=?, deadline=?, status=?, efficacy=?
        WHERE id=?
    """, (
        data.get("month"), data.get("year"), data.get("indicator"),
        data.get("cause", ""), data.get("action_corrective", ""),
        data.get("action_preventive", ""), data.get("responsible", ""),
        data.get("deadline", ""), data.get("status", ""),
        data.get("efficacy", ""), data.get("id")
    ))
    conn.commit()
    conn.close()


def delete_action_plan(action_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM action_plan WHERE id=?", (action_id,))
    conn.commit()
    conn.close()