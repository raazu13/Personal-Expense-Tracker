import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_connection():
    if not DATABASE_URL:
        raise ValueError("CRITICAL ERROR: 'DATABASE_URL' environment variable is NOT SET! You must add your PostgreSQL Internal Database URL to your Render Environment Variables.")
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def init_db():
    conn = get_connection()
    with conn.cursor() as cur:

        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                monthly_budget REAL DEFAULT 0,
                UNIQUE(user_id, name)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount REAL NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                description TEXT DEFAULT '',
                payment_method TEXT DEFAULT 'Cash',
                date DATE NOT NULL,
                note TEXT DEFAULT '',
                is_recurring INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                month TEXT NOT NULL,
                total_limit REAL DEFAULT 0,
                UNIQUE(user_id, month)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS recurring (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                amount REAL NOT NULL,
                description TEXT DEFAULT '',
                day_of_month INTEGER NOT NULL,
                active INTEGER DEFAULT 1
            )
        """)

    conn.commit()
    conn.close()


def seed_default_categories(user_id: int):
    """Seed default categories for a newly registered user."""
    defaults = [
        ("Food", "#ef4444", 8000),
        ("Transport", "#f97316", 3000),
        ("Rent", "#8b5cf6", 15000),
        ("Entertainment", "#06b6d4", 2000),
        ("Health", "#10b981", 3000),
        ("Shopping", "#f59e0b", 5000),
    ]
    conn = get_connection()
    with conn.cursor() as cur:
        for name, color, budget in defaults:
            cur.execute(
                """INSERT INTO categories (user_id, name, color, monthly_budget)
                   VALUES (%s, %s, %s, %s) ON CONFLICT (user_id, name) DO NOTHING""",
                (user_id, name, color, budget)
            )
    conn.commit()
    conn.close()
