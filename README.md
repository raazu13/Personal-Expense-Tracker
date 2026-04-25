<div align="center">

#  Personal Expense Tracker

### A full-stack, secure, multi-tenant web application to track expenses, analyze spending patterns, and maintain budgets.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-6366f1?style=for-the-badge)](https://personal-expense-tracker-six-sigma.vercel.app)
[![Backend API](https://img.shields.io/badge/🔌_Backend_API-Render-46E3B7?style=for-the-badge)](https://dashboard.render.com/web/srv-d7kl0qvavr4c73ag1vk0)

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python_3-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

</div>

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 **Multi-Tenant Security** | Stateless JWT authentication with strict `user_id` PostgreSQL data isolation |
| 🛡️ **Account Recovery** | SMTP-less cryptographically hashed "Security Question" workflow for self-contained password resets |
| 📊 **Interactive Analytics** | Real-time Plotly charts (injected securely via token-authenticated Axios HTML blobs) |
| 🧠 **ML Spend Prediction** | Scikit-free linear regression predicts your end-of-month spend based on user-specific datasets |
| 🔍 **Anomaly Detection** | IQR statistical method computes and flags unusual outliers automatically |
| 🔁 **Recurring Expenses** | Auto-adds subscriptions and recurring bills dynamically using idempotency checks |
| 🚨 **Smart Budget Alerts** | Color-coded capacity warnings at 80% and 100% of defined category budgets |
| 📄 **Reports & Exports** | Programmatic PDF report generation (`fpdf2`) and filtered CSV data dumps |

---

## 🏗️ System Architecture

```text
┌─────────────────────┐          ┌──────────────────────────┐
│   React 18 + Vite   │   HTTP   │    Python Flask API       │
│   Tailwind CSS      │◄────────►│    JWT Auth Middleware    │
│   Axios Interceptor │   JSON   │    RESTful Endpoints      │
│   Vercel (Frontend) │          │    Render (Web Service)   │
└─────────────────────┘          └──────────┬───────────────┘
                                            │ psycopg2
                                 ┌──────────▼───────────────┐
                                 │    Neon PostgreSQL        │
                                 │  users · expenses         │
                                 │  categories · budgets     │
                                 │  ON DELETE CASCADE        │
                                 └──────────────────────────┘
```

---

## ⚙️ Tech Stack

### Frontend
- **React 18** — Component-based UI Architecture hooks and functional logic
- **Vite** — High-performance build tool and dev server
- **Tailwind CSS** — Utility-first styling enabling a seamless Dark/Light overarching design system
- **React Router v6** — Client-side private routing wrapped with `<ProtectedRoute>` logic
- **Axios** — Centralized HTTP client configured with automatic Bearer token request interceptors

### Backend
- **Python 3 / Flask** — Lightweight, highly scalable REST API logic
- **PostgreSQL (`psycopg2`)** — Robust relational database replacing ephemeral SQLite storage
- **PyJWT & Bcrypt** — Cryptographic password hashing and stateless token issuance
- **Plotly** — Interactive chart formulation securely shipped as embedded HTML structures
- **Pure Python Data Science** — Custom linear regression & IQR calculations bypassing standard heavy `scikit-learn` dependencies

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Issues JWT, salts passwords, registers security questions |
| `POST` | `/api/auth/login` | Validates bcrypt hashes to issue authentication tokens |
| `DELETE`| `/api/auth/account` | Triggers absolute cascading teardown of user arrays/metrics |
| `POST` | `/api/auth/reset-password` | Evaluates security question hashes against provided metrics |
| `GET` | `/api/dashboard` | JSON payload delivering summarized telemetry, anomalies, and alerts |
| `GET/POST` | `/api/expenses` | Fetches filtered expenses or securely stores new transactions |
| `GET` | `/api/charts/monthly` | Delivers protected Plotly HTML nodes |
| `GET` | `/api/predict` | Computes live linear extrapolations based off current monthly datasets |

---

## 💡 Key Engineering Decisions

- **SQLite to PostgreSQL Scalability Shift**: Escaped Render's ephemeral storage limitations by decoupling persistent state data into a designated Neon server, establishing connection pools using robust `psycopg2` structures mapped to `.env` identifiers.
- **Secure Chart Delivery Protocol**: While Plotly normally encourages raw `iframe src` implementations, doing so publicly bypassed local JWT checks. Re-architected `ChartPanel.jsx` to fetch raw HTML strings via authenticated Axios requests, subsequently injecting them locally into the DOM.
- **Stateless Account Recovery Mechanism**: Circumvented external SMTP/Email grid dependencies (SendGrid/Mailgun) by engineering an offline "Security Question" pipeline. Hashed security answers are verified server-side via `bcrypt.checkpw()`, ensuring user autonomy and rapid reset functionalities seamlessly matching standard auth security parameters.
- **Strict Multi-Tenant Database Isolation**: Discarded global database calls in favor of precise, parameter-driven `user_id` validation logic at the `@require_auth` decorator level to eliminate cross-session data leakage potentials across API domains.

---

<div align="center">

**Built with ❤️ | Open to feedback and contributions**

</div>
