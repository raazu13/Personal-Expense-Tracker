import sqlite3
import os
from db import DB_PATH



def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_monthly_totals(months: int = 12) -> list:
    """Returns list of {month, total} for last N months."""
    conn = _conn()
    rows = conn.execute(
        """
        SELECT strftime('%Y-%m', date) as month, ROUND(SUM(amount), 2) as total
        FROM expenses
        WHERE date >= date('now', ?)
        GROUP BY month
        ORDER BY month
        """,
        (f"-{months} months",)
    ).fetchall()
    conn.close()
    return [{"month": r["month"], "total": r["total"]} for r in rows]


def get_category_breakdown(month: str) -> list:
    """Returns list of {name, color, monthly_budget, spent} for a given month."""
    conn = _conn()
    rows = conn.execute(
        """
        SELECT c.name, c.color, c.monthly_budget,
               ROUND(COALESCE(SUM(e.amount), 0), 2) as spent
        FROM categories c
        LEFT JOIN expenses e
          ON e.category_id = c.id
          AND strftime('%Y-%m', e.date) = ?
        GROUP BY c.id
        ORDER BY spent DESC
        """,
        (month,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_category_trend(category_id: int, months: int = 6) -> list:
    """Returns list of {month, total} for a category."""
    conn = _conn()
    rows = conn.execute(
        """
        SELECT strftime('%Y-%m', date) as month, ROUND(SUM(amount), 2) as total
        FROM expenses
        WHERE category_id = ? AND date >= date('now', ?)
        GROUP BY month
        ORDER BY month
        """,
        (category_id, f"-{months} months")
    ).fetchall()
    conn.close()
    return [{"month": r["month"], "total": r["total"]} for r in rows]


def get_current_month_daily(month: str) -> list:
    """Returns list of {date, total} for current month."""
    conn = _conn()
    rows = conn.execute(
        """
        SELECT date, ROUND(SUM(amount), 2) as total
        FROM expenses
        WHERE strftime('%Y-%m', date) = ?
        GROUP BY date
        ORDER BY date
        """,
        (month,)
    ).fetchall()
    conn.close()
    return [{"date": r["date"], "total": r["total"]} for r in rows]


def detect_anomalies() -> list:
    """IQR-based outlier detection using pure Python."""
    conn = _conn()
    rows = conn.execute(
        """
        SELECT e.id, e.amount, e.description, e.date, e.payment_method,
               c.name as category_name, c.color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        """
    ).fetchall()
    conn.close()

    if not rows:
        return []

    # Group by category
    groups = {}
    for r in rows:
        key = r["category_name"] or "Uncategorized"
        groups.setdefault(key, []).append(dict(r))

    anomalies = []
    for cat_name, items in groups.items():
        if len(items) < 4:
            continue
        amounts = sorted(item["amount"] for item in items)
        n = len(amounts)
        q1 = amounts[n // 4]
        q3 = amounts[(3 * n) // 4]
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr
        for item in items:
            if item["amount"] > upper:
                anomalies.append(item)

    return anomalies
