<div align="center">

#  Personal Expense Tracker

### A full-stack web application to track expenses, analyze spending patterns, and stay on budget

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-6366f1?style=for-the-badge)](https://personal-expense-tracker-six-sigma.vercel.app)
[![Backend API](https://img.shields.io/badge/🔌_Backend_API-Render-46E3B7?style=for-the-badge)](https://dashboard.render.com/web/srv-d7kl0qvavr4c73ag1vk0)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/raazu13/Personal-Expense-Tracker)

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python_3-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![Plotly](https://img.shields.io/badge/Plotly-3F4F75?style=flat&logo=plotly&logoColor=white)

</div>

---

## ✨ What Makes This App Stand Out

| Feature | Details |
|---------|---------|
| 📊 **Interactive Analytics** | Real-time Plotly charts — monthly trends, category breakdowns, spend-over-time |
| 🧠 **ML Spend Prediction** | Linear regression predicts your end-of-month spend based on current rate |
| 🔍 **Anomaly Detection** | IQR statistical method flags unusual expenses automatically |
| 🔁 **Recurring Expenses** | Auto-adds subscriptions and recurring bills every day at startup |
| 🚨 **Smart Budget Alerts** | Color-coded warnings at 80% and 100% of category budgets |
| 📄 **PDF Reports** | Generates styled monthly expense reports with category breakdowns |
| 🌙 **Dark Mode** | Full dark/light theme persistence — even charts switch themes |
| 📤 **CSV Export** | Export filtered expense data for external use |

---

## 🖥️ App Preview

> Dashboard · Expenses · Analytics · Settings

*(Add your screenshots here)*

---

## 🏗️ Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   React 18 + Vite   │  HTTP   │    Python Flask API       │
│   Tailwind CSS      │◄───────►│    REST Endpoints         │
│   Axios + Router    │  JSON   │    Plotly Charts (HTML)   │
│   Vercel (hosted)   │         │    Render (hosted)        │
└─────────────────────┘         └──────────┬───────────────┘
                                            │ sqlite3
                                 ┌──────────▼───────────────┐
                                 │      SQLite Database      │
                                 │  expenses · categories    │
                                 │  budgets  · recurring     │
                                 └──────────────────────────┘
```

---

## ⚙️ Tech Stack

### Frontend
- **React 18** — component-based UI with hooks
- **Vite** — lightning-fast build tool and dev server
- **Tailwind CSS** — utility-first styling with full dark mode
- **React Router v6** — client-side routing
- **Axios** — HTTP client with interceptors
- **react-hot-toast** — elegant toast notifications

### Backend
- **Python 3 + Flask** — lightweight REST API
- **Plotly** — interactive chart generation (HTML output)
- **fpdf2** — programmatic PDF generation
- **Pure Python analytics** — linear regression & IQR anomaly detection without heavy dependencies
- **SQLite** — embedded relational database (zero config)
- **Gunicorn** — production WSGI server

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard?month=` | Full summary — totals, alerts, recent, anomalies |
| `GET/POST` | `/api/expenses` | List with filters / add expense |
| `PUT/DELETE` | `/api/expenses/:id` | Update or delete |
| `GET` | `/api/charts/monthly` | Plotly bar chart — 12-month trend |
| `GET` | `/api/charts/category?month=` | Plotly pie chart — category split |
| `GET` | `/api/charts/trend?category_id=` | Plotly line — category over time |
| `GET` | `/api/predict` | ML spend prediction for current month |
| `GET` | `/api/anomalies` | IQR-based outlier detection |
| `GET` | `/api/report?month=` | Download PDF report |
| `POST` | `/api/recurring/process` | Auto-add today's due recurring expenses |

---

## 📂 Project Structure

```
expense-tracker/
├── frontend/                   # React app
│   └── src/
│       ├── pages/              # Dashboard, Expenses, Analytics, Settings
│       ├── components/         # Reusable UI (Table, Forms, Charts, Cards)
│       ├── context/            # ThemeContext (dark/light)
│       └── api/client.js       # Axios instance
└── backend/                    # Flask API
    ├── app.py                  # All routes
    ├── db.py                   # Schema + auto-seeding
    ├── analysis.py             # Aggregations (pure Python + SQLite)
    ├── predict.py              # Linear regression prediction
    ├── charts.py               # Plotly chart generators
    └── report.py               # PDF generator
```

---

## 🚀 Run Locally

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/personal-expense-tracker.git
cd personal-expense-tracker

# Backend
cd backend && pip install -r requirements.txt && cd ..

# Frontend
npm install && npm run install:all

# Start both servers
npm run dev
# → http://localhost:5173
```

---

## 💡 Key Engineering Decisions

- **No heavy ML libraries in production** — Implemented linear regression and IQR anomaly detection in pure Python to avoid compilation issues across Python versions, keeping the backend lightweight and fast to deploy.
- **Plotly charts as HTML** — Charts are generated server-side and served as HTML strings, rendered in iframes. This keeps the frontend bundle small while supporting fully interactive charts.
- **Shared SQLite DB path resolution** — A single fallback-aware path resolver ensures the database works across local dev, Docker, and cloud environments (Render free tier with no disk mount).
- **Recurring expense idempotency** — The recurring processor checks for existing entries before inserting to prevent duplicates even if triggered multiple times in a day.

---

<div align="center">

**Built with ❤️ | Open to feedback and contributions**

</div>
