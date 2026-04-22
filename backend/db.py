import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "../data/expenses.db")

# Ensure the directory exists; fallback to local ./data/ if the configured path fails
try:
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    os.makedirs(db_dir, exist_ok=True)
except (PermissionError, OSError):
    DB_PATH = os.path.join(os.path.dirname(__file__), "data", "expenses.db")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)



def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#6366f1',
            monthly_budget REAL DEFAULT 0
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category_id INTEGER,
            description TEXT,
            payment_method TEXT DEFAULT 'Cash',
            date TEXT NOT NULL,
            note TEXT DEFAULT '',
            is_recurring INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT UNIQUE NOT NULL,
            total_limit REAL DEFAULT 0
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS recurring (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            amount REAL NOT NULL,
            description TEXT,
            day_of_month INTEGER NOT NULL,
            active INTEGER DEFAULT 1,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    # Seed default categories if none exist
    c.execute("SELECT COUNT(*) FROM categories")
    count = c.fetchone()[0]
    if count == 0:
        defaults = [
            ("Food", "#ef4444", 8000),
            ("Transport", "#f97316", 3000),
            ("Rent", "#8b5cf6", 15000),
            ("Entertainment", "#06b6d4", 2000),
            ("Health", "#10b981", 3000),
            ("Shopping", "#f59e0b", 5000),
        ]
        c.executemany(
            "INSERT INTO categories (name, color, monthly_budget) VALUES (?, ?, ?)",
            defaults
        )

    conn.commit()
    conn.close()
