# 💰 Personal Expense Tracker

A full-stack web app to track personal expenses, set budgets, and view beautiful analytics charts.

**Stack:** React 18 + Vite + Tailwind CSS (frontend) · Python Flask (backend) · SQLite (database)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd expense-tracker

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install Node.js dependencies (root + frontend)
npm install          # installs concurrently
npm run install:all  # installs frontend dependencies
```

### 2. Configure Environment

```bash
# backend/.env is already preconfigured for local dev:
# DB_PATH=../data/expenses.db
# FLASK_PORT=5000

# frontend/.env is already preconfigured:
# VITE_API_URL=http://localhost:5000
```

### 3. Run Both Servers

```bash
npm run dev
```

This starts:
- 🐍 Flask backend at **http://localhost:5000**
- ⚛️ React frontend at **http://localhost:5173**

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
expense-tracker/
├── frontend/               React app (Vite + Tailwind)
│   └── src/
│       ├── pages/          Dashboard, Expenses, Analytics, Settings
│       ├── components/     Reusable UI components
│       ├── context/        ThemeContext (dark/light mode)
│       └── api/client.js   Axios instance
├── backend/                Python Flask API
│   ├── app.py              All routes
│   ├── db.py               SQLite schema + seeding
│   ├── charts.py           Plotly chart generators
│   ├── predict.py          Spend prediction (scikit-learn)
│   └── report.py           PDF reports (fpdf2)
└── data/
    ├── expenses.db         SQLite database (auto-created)
    └── reports/            PDF reports saved here
```

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Summary cards, budget progress bars, recent expenses, anomaly alerts |
| 💸 Expenses | Sortable table, filters, CSV export, add/edit/delete |
| 📈 Analytics | Plotly charts (monthly trend, category pie, category trend), spend prediction |
| ⚙️ Settings | Category management, monthly budgets, recurring expenses, PDF reports |
| 🌙 Dark Mode | Toggle dark/light theme, persists across sessions |
| 🔁 Recurring | Auto-adds recurring expenses on app load |
| 🔍 Anomalies | IQR-based statistical outlier detection |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/expenses` | List (with filters) / Add expense |
| PUT/DELETE | `/api/expenses/<id>` | Update / Delete expense |
| GET | `/api/categories` | All categories with monthly spend |
| GET | `/api/dashboard?month=` | Full dashboard summary |
| GET | `/api/charts/monthly` | Plotly HTML — 12-month bar chart |
| GET | `/api/charts/category?month=` | Plotly HTML — category pie |
| GET | `/api/charts/trend?category_id=` | Plotly HTML — trend line |
| GET | `/api/predict?month=` | ML spend prediction |
| GET | `/api/report?month=` | Download PDF report |
| POST | `/api/recurring/process` | Auto-add today's recurring expenses |

---

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions (Vercel + Render).

---

## 💡 Default Categories

The database auto-seeds these on first run:
- 🍔 **Food** (₹8,000/month) — red
- 🚌 **Transport** (₹3,000/month) — orange  
- 🏠 **Rent** (₹15,000/month) — purple
- 🎬 **Entertainment** (₹2,000/month) — cyan
- 💊 **Health** (₹3,000/month) — green
- 🛍️ **Shopping** (₹5,000/month) — amber
