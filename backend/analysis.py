import pandas as pd
import sqlite3
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("DB_PATH", "../data/expenses.db")


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_monthly_totals(months: int = 12) -> pd.DataFrame:
    """Spend per month for the last N months."""
    conn = _conn()
    df = pd.read_sql_query(
        """
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM expenses
        WHERE date >= date('now', ?)
        GROUP BY month
        ORDER BY month
        """,
        conn,
        params=(f"-{months} months",)
    )
    conn.close()
    return df


def get_category_breakdown(month: str) -> pd.DataFrame:
    """Spend per category for a given month (YYYY-MM)."""
    conn = _conn()
    df = pd.read_sql_query(
        """
        SELECT c.name, c.color, c.monthly_budget,
               COALESCE(SUM(e.amount), 0) as spent
        FROM categories c
        LEFT JOIN expenses e
          ON e.category_id = c.id
          AND strftime('%Y-%m', e.date) = ?
        GROUP BY c.id
        ORDER BY spent DESC
        """,
        conn,
        params=(month,)
    )
    conn.close()
    return df


def get_category_trend(category_id: int, months: int = 6) -> pd.DataFrame:
    """Monthly spend for a single category over last N months."""
    conn = _conn()
    df = pd.read_sql_query(
        """
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM expenses
        WHERE category_id = ? AND date >= date('now', ?)
        GROUP BY month
        ORDER BY month
        """,
        conn,
        params=(category_id, f"-{months} months")
    )
    conn.close()
    return df


def get_current_month_daily(month: str) -> pd.DataFrame:
    """Daily cumulative spend for the current month."""
    conn = _conn()
    df = pd.read_sql_query(
        """
        SELECT date, SUM(amount) as total
        FROM expenses
        WHERE strftime('%Y-%m', date) = ?
        GROUP BY date
        ORDER BY date
        """,
        conn,
        params=(month,)
    )
    conn.close()
    return df


def detect_anomalies() -> list:
    """Return expense IDs that are statistical outliers per category (IQR method)."""
    conn = _conn()
    df = pd.read_sql_query(
        """
        SELECT e.id, e.amount, e.description, e.date, e.payment_method,
               c.name as category_name, c.color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        """,
        conn
    )
    conn.close()

    if df.empty:
        return []

    anomalies = []
    for _, group in df.groupby("category_name"):
        if len(group) < 4:
            continue
        q1 = group["amount"].quantile(0.25)
        q3 = group["amount"].quantile(0.75)
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr
        flagged = group[group["amount"] > upper]
        anomalies.extend(flagged.to_dict("records"))

    return anomalies
