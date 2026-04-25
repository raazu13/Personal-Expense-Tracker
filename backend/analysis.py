import os
import psycopg2.extras
from db import get_connection

def _conn():
    return get_connection()

def _cur(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_monthly_totals(user_id: int, months: int = 12) -> list:
    """Returns list of {month, total} for last N months."""
    conn = _conn()
    with _cur(conn) as c:
        c.execute(
            """
            SELECT TO_CHAR(date, 'YYYY-MM') as month, ROUND(SUM(amount)::numeric, 2) as total
            FROM expenses
            WHERE user_id = %s AND date >= current_date - (%s || ' months')::interval
            GROUP BY month
            ORDER BY month
            """,
            (user_id, str(months))
        )
        rows = c.fetchall()
    conn.close()
    return [{"month": r["month"], "total": r["total"]} for r in rows]

def get_category_breakdown(user_id: int, month: str) -> list:
    """Returns list of {name, color, monthly_budget, spent} for a given month."""
    conn = _conn()
    with _cur(conn) as c:
        c.execute(
            """
            SELECT c.name, c.color, c.monthly_budget,
                   ROUND(COALESCE(SUM(e.amount), 0)::numeric, 2) as spent
            FROM categories c
            LEFT JOIN expenses e
              ON e.category_id = c.id
              AND TO_CHAR(e.date, 'YYYY-MM') = %s
              AND e.user_id = %s
            WHERE c.user_id = %s
            GROUP BY c.id
            ORDER BY spent DESC
            """,
            (month, user_id, user_id)
        )
        rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_category_trend(user_id: int, category_id: int, months: int = 6) -> list:
    """Returns list of {month, total} for a category."""
    conn = _conn()
    with _cur(conn) as c:
        c.execute(
            """
            SELECT TO_CHAR(date, 'YYYY-MM') as month, ROUND(SUM(amount)::numeric, 2) as total
            FROM expenses
            WHERE user_id = %s AND category_id = %s AND date >= current_date - (%s || ' months')::interval
            GROUP BY month
            ORDER BY month
            """,
            (user_id, category_id, str(months))
        )
        rows = c.fetchall()
    conn.close()
    return [{"month": r["month"], "total": r["total"]} for r in rows]

def get_current_month_daily(user_id: int, month: str) -> list:
    """Returns list of {date, total} for current month."""
    conn = _conn()
    with _cur(conn) as c:
        c.execute(
            """
            SELECT date, ROUND(SUM(amount)::numeric, 2) as total
            FROM expenses
            WHERE user_id = %s AND TO_CHAR(date, 'YYYY-MM') = %s
            GROUP BY date
            ORDER BY date
            """,
            (user_id, month)
        )
        rows = c.fetchall()
    conn.close()
    return [{"date": str(r["date"]), "total": r["total"]} for r in rows]

def detect_anomalies(user_id: int) -> list:
    """IQR-based outlier detection using pure Python."""
    conn = _conn()
    with _cur(conn) as c:
        c.execute(
            """
            SELECT e.id, e.amount, e.description, e.date, e.payment_method,
                   c.name as category_name, c.color
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = %s
            """,
            (user_id,)
        )
        rows = c.fetchall()
    conn.close()

    if not rows:
        return []

    # Group by category
    groups = {}
    for r in rows:
        r_dict = dict(r)
        # Ensure date object is serialized to string safely
        r_dict["date"] = str(r_dict["date"]) 
        key = r_dict["category_name"] or "Uncategorized"
        groups.setdefault(key, []).append(r_dict)

    anomalies = []
    for cat_name, items in groups.items():
        if len(items) < 4:
            continue
        amounts = sorted(float(item["amount"]) for item in items)
        n = len(amounts)
        q1 = amounts[n // 4]
        q3 = amounts[(3 * n) // 4]
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr
        for item in items:
            if float(item["amount"]) > upper:
                anomalies.append(item)

    return anomalies
