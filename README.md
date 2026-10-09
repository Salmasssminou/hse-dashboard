# HSE Dashboard

A modern web dashboard for tracking Health, Safety & Environment indicators. Built to replace manual Excel-based reporting with a fast, interactive, offline-friendly web tool.

## ✨ Features

- 📊 **6 KPI cards** with trend indicators (TRIR, LTIR, Energy, Water, Waste, Recycling)
- 📈 **6 interactive charts** powered by ApexCharts
- 🩹 **Injuries module** — track first-aid cases by Project, Department, and Body Part
- 📋 **Action Plan tracker** — full CRUD with status workflow (Open / Closed / Late)
- 🔍 **Multi-year support** — filter by year and month
- ✏️ **Data entry** directly from the UI
- 📥 **CSV import/export** for bulk data
- 📷 **Dashboard capture** — export the whole view as PNG
- 🌙 **Dark / Light mode**
- 🎨 **Customizable theme** (company name, location, colors)
- 💾 **Runs entirely offline** — no cloud, no external services

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| Frontend | React 19, Vite, ApexCharts |
| Database | SQLite |
| Excel | pandas, openpyxl, xlwings |
| Image Export | html2canvas |

## 📁 Project Structure


## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+ (only for development)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR-USERNAME/hse-dashboard.git
cd hse-dashboard
