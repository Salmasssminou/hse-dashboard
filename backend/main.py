from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import os
import zipfile
import shutil
import openpyxl
import xml.etree.ElementTree as ET
from openpyxl.utils import get_column_letter
import traceback
import csv
import io
import pathlib

import injuries as inj_module

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXCEL_FILE_PATH = "../data/indicators.xlsx"
MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

# ============= INDICATORS (SQLite-backed) =============
@app.get("/api/indicator/{sheet_name}")
def get_indicator_data(sheet_name: str, year: Optional[int] = None):
    """Read indicators from SQLite. If year is not provided, use the latest year."""
    import sqlite3
    conn = sqlite3.connect(inj_module.DB_PATH)
    cursor = conn.cursor()

    # If year is not specified, find the latest year with data
    if year is None:
        cursor.execute("SELECT MAX(year) FROM indicators WHERE sheet_name=?", (sheet_name,))
        row = cursor.fetchone()
        year = row[0] if row and row[0] else 2026

    cursor.execute(
        "SELECT month, reel, objectif FROM indicators WHERE sheet_name=? AND year=?",
        (sheet_name, year)
    )
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        # Return empty arrays for months so chart renders blank gracefully
        return {
            "indicator": sheet_name,
            "year": year,
            "labels": MONTHS,
            "datasets": {"reel": [None]*12, "objectif": [None]*12}
        }

    # Build dictionaries for fast lookup
    data_map = {row[0]: {"reel": row[1], "objectif": row[2]} for row in rows}
    reel_data = [data_map.get(m, {}).get("reel") for m in MONTHS]
    objectif_data = [data_map.get(m, {}).get("objectif") for m in MONTHS]

    return {
        "indicator": sheet_name,
        "year": year,
        "labels": MONTHS,
        "datasets": {"reel": reel_data, "objectif": objectif_data}
    }

# ============= UPDATE INDICATOR DATA (writes to SQLite) =============
class DataEntry(BaseModel):
    sheet_name: str
    month_index: int
    value: float
    year: Optional[int] = 2026

@app.post("/api/update_data")
def update_excel_data(entry: DataEntry):
    """Update an indicator value in SQLite."""
    import sqlite3
    if not (0 <= entry.month_index < 12):
        raise HTTPException(status_code=400, detail="month_index must be 0-11")

    month = MONTHS[entry.month_index]

    # % sheet is stored as decimal (34% → 0.34)
    value = entry.value
    if entry.sheet_name == '%':
        value = value / 100.0

    conn = sqlite3.connect(inj_module.DB_PATH)
    cursor = conn.cursor()

    # Check if row exists
    cursor.execute(
        "SELECT id FROM indicators WHERE year=? AND month=? AND sheet_name=?",
        (entry.year, month, entry.sheet_name)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            "UPDATE indicators SET reel=?, created_at=CURRENT_TIMESTAMP WHERE id=?",
            (value, existing[0])
        )
    else:
        cursor.execute(
            "INSERT INTO indicators (year, month, sheet_name, reel, objectif) VALUES (?, ?, ?, ?, ?)",
            (entry.year, month, entry.sheet_name, value, 0)
        )

    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Updated {entry.sheet_name} for {month} {entry.year}"}

# ============= EXCEL-BASED EXPORT (for Reports page) =============
# Kept as fallback for legacy uses

# ============= INJURIES ENDPOINTS =============
class InjuryEntry(BaseModel):
    month: str
    year: int
    chart_type: str
    category: str
    value: float

class ActionPlanEntry(BaseModel):
    month: str
    year: int
    indicator: str
    cause: Optional[str] = ""
    action_corrective: Optional[str] = ""
    action_preventive: Optional[str] = ""
    responsible: Optional[str] = ""
    deadline: Optional[str] = ""
    status: Optional[str] = ""
    efficacy: Optional[str] = ""

@app.post("/api/injuries/save")
def save_injury_data(entry: InjuryEntry):
    try:
        inj_module.save_injury(entry.month, entry.year, entry.chart_type, entry.category, entry.value)
        return {"status": "success", "message": "Saved"}
    except Exception as e:
        print("❌ SAVE INJURY ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/injuries/list")
def list_injuries(year: Optional[int] = None, month: Optional[str] = None):
    try:
        return {"injuries": inj_module.get_injuries(year, month)}
    except Exception as e:
        print("❌ LIST INJURIES ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/injuries/delete")
def delete_injury_record(month: str, year: int, chart_type: str, category: str):
    try:
        inj_module.delete_injury(month, year, chart_type, category)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= ACTION PLAN ENDPOINTS =============
@app.post("/api/action_plan/save")
def save_action(entry: ActionPlanEntry):
    try:
        inj_module.save_action_plan(entry.dict())
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/action_plan/list")
def list_actions(year: Optional[int] = None, month: Optional[str] = None, indicator: Optional[str] = None):
    try:
        return {"actions": inj_module.get_action_plans(year, month, indicator)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ActionPlanUpdate(BaseModel):
    id: int
    month: Optional[str] = None
    year: Optional[int] = None
    indicator: Optional[str] = None
    cause: Optional[str] = None
    action_corrective: Optional[str] = None
    action_preventive: Optional[str] = None
    responsible: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None
    efficacy: Optional[str] = None

@app.put("/api/action_plan/update")
def update_action(entry: ActionPlanUpdate):
    try:
        inj_module.update_action_plan(entry.dict())
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/action_plan/delete/{action_id}")
def delete_action(action_id: int):
    try:
        inj_module.delete_action_plan(action_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= CSV IMPORT =============
@app.post("/api/injuries/import")
async def import_injuries(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        imported, skipped = 0, 0
        errors = []

        for i, row in enumerate(reader, start=2):
            try:
                month = (row.get("Month") or row.get("Mois") or "").strip()
                year = row.get("Year") or row.get("Année") or ""
                chart_type = (row.get("ChartType") or row.get("Chart Type") or row.get("Type") or "").strip()
                category = (row.get("Category") or row.get("Catégorie") or "").strip()
                value = row.get("Value") or row.get("Valeur") or "0"

                if not month or not year or not chart_type or not category:
                    errors.append(f"Row {i}: Missing field")
                    skipped += 1
                    continue

                ct_lower = chart_type.lower()
                if "proj" in ct_lower:
                    chart_type = "Project"
                elif "dept" in ct_lower:
                    chart_type = "Department"
                elif "body" in ct_lower:
                    chart_type = "BodyPart"
                else:
                    errors.append(f"Row {i}: Invalid ChartType '{chart_type}'")
                    skipped += 1
                    continue

                inj_module.save_injury(month, int(year), chart_type, category, float(value))
                imported += 1
            except Exception as row_err:
                errors.append(f"Row {i}: {str(row_err)}")
                skipped += 1

        return {"status": "success", "imported": imported, "skipped": skipped, "errors": errors[:10]}
    except Exception as e:
        print("❌ IMPORT ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# ============= SERVE FRONTEND =============
FRONTEND_DIST = pathlib.Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"message": "Frontend not built"}
    print("✅ Frontend will be served from:", FRONTEND_DIST)
else:
    print("⚠️ Frontend dist folder not found.")