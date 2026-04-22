# 🚀 Deployment Guide

Deploy the frontend to **Vercel** and the backend to **Render** for a publicly accessible URL.

---

## Step 1 — Push Code to GitHub

```bash
cd expense-tracker
git init
git add .
git commit -m "feat: initial Personal Expense Tracker"
git remote add origin https://github.com/<your-username>/expense-tracker.git
git push -u origin main
```

---

## Step 2 — Deploy Backend to Render

1. Go to **[render.com](https://render.com)** → New → Web Service
2. Connect your GitHub repo
3. Set configuration:
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `gunicorn app:app`
4. Add environment variable:
   - `DB_PATH` = `/data/expenses.db`
5. Add a **Disk** (Render → Advanced):
   - Name: `data`, Mount path: `/data`, Size: 1 GB
6. Click **Deploy** — wait for "Deploy live" status
7. **Copy your Render URL** (e.g. `https://expense-tracker-api.onrender.com`)

> ⚠️ **Free tier** on Render spins down after 15 min of inactivity. First request may be slow.

---

## Step 3 — Deploy Frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)** → New Project
2. Import your GitHub repo
3. Set configuration:
   - **Root directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://expense-tracker-api.onrender.com` _(paste your Render URL)_
5. Click **Deploy**
6. **Copy your Vercel URL** (e.g. `https://expense-tracker.vercel.app`)

---

## Step 4 — Update Backend CORS (if needed)

In `backend/app.py`, the CORS is open (`*`) by default.
For production, restrict it to your Vercel domain:

```python
CORS(app, origins=["https://expense-tracker.vercel.app"])
```

Commit and push — Render will auto-redeploy.

---

## Step 5 — Share the Link!

Share your **Vercel URL** with anyone — the app is fully public. 🎉

---

## Local ↔ Production Toggle

| Setting | Local Dev | Production |
|---------|-----------|------------|
| `VITE_API_URL` | `http://localhost:5000` | Your Render URL |
| `DB_PATH` | `../data/expenses.db` | `/data/expenses.db` |
| `FLASK_DEBUG` | `true` | `false` |
