"""
Migration script: reads the Excel file and populates the SQLite indicators table.
Run ONCE. After this, the app reads/writes indicators from SQLite.
"""
import sqlite3
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
DB_PATH = os.path.abspath(os.path.join(DATA_DIR, "injuries.db"))
EXCEL_PATH = os.path.abspath(os.path.join(DATA_DIR, "indicators.xlsx"))

SHEET_NAMES = ['TRIR', 'LTIR', 'Kwh', 'm3', 'Kg', '%']
MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

def init_indicators_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS indicators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month TEXT NOT NULL,
            sheet_name TEXT NOT NULL,
            reel REAL,
            objectif REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(year, month, sheet_name)
        )
    """)
    conn.commit()
    conn.close()
    print("✅ 'indicators' table ready")

def parse_value(v):
    s = str(v).strip()
    if s == "" or s.lower() == "nan" or s == "None":
        return None
    try:
        return float(s)
    except:
        return None

def migrate_from_excel(target_year=2026):
    if not os.path.exists(EXCEL_PATH):
        print(f"❌ Excel file not found at {EXCEL_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    total = 0

    for sheet_name in SHEET_NAMES:
        try:
            df = pd.read_excel(EXCEL_PATH, sheet_name=sheet_name, header=None)
            df_str = df.astype(str)

            reel_rows = df[df_str.apply(lambda r: r.str.contains("Réel", case=False).any(), axis=1)]
            objectif_rows = df[df_str.apply(lambda r: r.str.contains("Objectif", case=False).any(), axis=1)]
            header_rows = df[df_str.apply(lambda r: r.str.contains("Janvier", case=False).any(), axis=1)]

            if reel_rows.empty or objectif_rows.empty or header_rows.empty:
                print(f"⚠️  {sheet_name}: missing rows, skipped")
                continue

            reel_row = reel_rows.iloc[0]
            objectif_row = objectif_rows.iloc[0]
            header_row = header_rows.iloc[0]

            # Find the column where "Janvier" is located
            start_col = None
            for idx in range(len(header_row)):
                if "Janvier" in str(header_row.iloc[idx]):
                    start_col = idx
                    break

            if start_col is None:
                print(f"⚠️  {sheet_name}: 'Janvier' not found")
                continue

            for i, month in enumerate(MONTHS):
                col_idx = start_col + i
                if col_idx >= len(reel_row):
                    break
                reel_val = parse_value(reel_row.iloc[col_idx]) if col_idx < len(reel_row) else None
                obj_val = parse_value(objectif_row.iloc[col_idx]) if col_idx < len(objectif_row) else None

                if reel_val is None and obj_val is None:
                    continue

                cursor.execute("""
                    INSERT OR REPLACE INTO indicators (year, month, sheet_name, reel, objectif)
                    VALUES (?, ?, ?, ?, ?)
                """, (target_year, month, sheet_name, reel_val, obj_val))
                total += 1

            print(f"✅ {sheet_name}: {len(MONTHS)} months checked")
        except Exception as e:
            print(f"❌ {sheet_name}: {e}")

    conn.commit()
    conn.close()
    print(f"\n🎉 Migration done: {total} indicator entries inserted for year {target_year}")

if __name__ == "__main__":
    print(f"📁 DB path: {DB_PATH}")
    print(f"📁 Excel path: {EXCEL_PATH}\n")
    init_indicators_table()
    migrate_from_excel(target_year=2026)
    print("\n✅ You can now use the app with the SQLite-backed indicators.")