import os
import sqlite3
from datetime import date, datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

from db import init_db, get_connection, DB_PATH
from analysis import get_category_breakdown, detect_anomalies
from charts import monthly_bar_chart, category_pie_chart, category_trend_chart
from predict import predict_end_of_month
from report import generate_monthly_report

load_dotenv()

app = Flask(__name__)
CORS(app)

# ────────────────────────────────────────────────
# Startup
# ────────────────────────────────────────────────
with app.app_context():
    init_db()


def row_to_dict(row):
    return dict(row) if row else None


# ────────────────────────────────────────────────
# Expenses
# ────────────────────────────────────────────────
@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    category = request.args.get("category")
    month = request.args.get("month")
    search = request.args.get("search", "")
    payment = request.args.get("payment_method")

    query = """
        SELECT e.*, c.name as category_name, c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE 1=1
    """
    params = []
    if category:
        query += " AND e.category_id = ?"
        params.append(category)
    if month:
        query += " AND strftime('%Y-%m', e.date) = ?"
        params.append(month)
    if search:
        query += " AND e.description LIKE ?"
        params.append(f"%{search}%")
    if payment:
        query += " AND e.payment_method = ?"
        params.append(payment)
    query += " ORDER BY e.date DESC, e.id DESC"

    conn = get_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/expenses", methods=["POST"])
def add_expense():
    data = request.json
    conn = get_connection()
    cur = conn.execute(
        """INSERT INTO expenses (amount, category_id, description, payment_method, date, note, is_recurring)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            data["amount"],
            data.get("category_id"),
            data.get("description", ""),
            data.get("payment_method", "Cash"),
            data.get("date", str(date.today())),
            data.get("note", ""),
            data.get("is_recurring", 0),
        ),
    )
    conn.commit()
    row = conn.execute(
        "SELECT e.*, c.name as category_name, c.color as category_color FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?",
        (cur.lastrowid,)
    ).fetchone()
    conn.close()
    return jsonify(dict(row)), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    data = request.json
    conn = get_connection()
    conn.execute(
        """UPDATE expenses SET amount=?, category_id=?, description=?, payment_method=?, date=?, note=?, is_recurring=?
           WHERE id=?""",
        (
            data["amount"],
            data.get("category_id"),
            data.get("description", ""),
            data.get("payment_method", "Cash"),
            data.get("date", str(date.today())),
            data.get("note", ""),
            data.get("is_recurring", 0),
            expense_id,
        ),
    )
    conn.commit()
    row = conn.execute(
        "SELECT e.*, c.name as category_name, c.color as category_color FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?",
        (expense_id,)
    ).fetchone()
    conn.close()
    return jsonify(dict(row))


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_connection()
    conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# CSV export
@app.route("/api/expenses/export", methods=["GET"])
def export_csv():
    import io, csv
    month = request.args.get("month", "")
    conn = get_connection()
    query = """
        SELECT e.date, e.description, c.name as category, e.amount, e.payment_method, e.note
        FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
    """
    params = []
    if month:
        query += " WHERE strftime('%Y-%m', e.date) = ?"
        params.append(month)
    query += " ORDER BY e.date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Category", "Amount", "Payment Method", "Note"])
    for r in rows:
        writer.writerow([r["date"], r["description"], r["category"], r["amount"], r["payment_method"], r["note"]])

    output.seek(0)
    return app.response_class(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=expenses_{month or 'all'}.csv"},
    )


# ────────────────────────────────────────────────
# Categories
# ────────────────────────────────────────────────
@app.route("/api/categories", methods=["GET"])
def get_categories():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT c.*, COALESCE(SUM(e.amount), 0) as spent
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.date) = ?
        GROUP BY c.id
        ORDER BY c.name
        """,
        (month,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/categories", methods=["POST"])
def add_category():
    data = request.json
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO categories (name, color, monthly_budget) VALUES (?, ?, ?)",
        (data["name"], data.get("color", "#6366f1"), data.get("monthly_budget", 0)),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM categories WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201


@app.route("/api/categories/<int:cat_id>", methods=["PUT"])
def update_category(cat_id):
    data = request.json
    conn = get_connection()
    conn.execute(
        "UPDATE categories SET name=?, color=?, monthly_budget=? WHERE id=?",
        (data["name"], data.get("color", "#6366f1"), data.get("monthly_budget", 0), cat_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM categories WHERE id = ?", (cat_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))


@app.route("/api/categories/<int:cat_id>", methods=["DELETE"])
def delete_category(cat_id):
    conn = get_connection()
    conn.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ────────────────────────────────────────────────
# Dashboard
# ────────────────────────────────────────────────
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    conn = get_connection()

    total_row = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime('%Y-%m', date) = ?",
        (month,)
    ).fetchone()
    total_spent = total_row["total"]

    budget_row = conn.execute(
        "SELECT total_limit FROM budgets WHERE month = ?", (month,)
    ).fetchone()
    budget_limit = budget_row["total_limit"] if budget_row else 0

    count_row = conn.execute(
        "SELECT COUNT(*) as cnt FROM expenses WHERE strftime('%Y-%m', date) = ?", (month,)
    ).fetchone()
    tx_count = count_row["cnt"]

    # Category data
    cat_rows = conn.execute(
        """
        SELECT c.id, c.name, c.color, c.monthly_budget,
               COALESCE(SUM(e.amount), 0) as spent
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.date) = ?
        GROUP BY c.id ORDER BY spent DESC
        """,
        (month,)
    ).fetchall()
    categories = [dict(r) for r in cat_rows]

    # Budget alerts (≥ 80%)
    alerts = []
    for cat in categories:
        if cat["monthly_budget"] > 0:
            pct = (cat["spent"] / cat["monthly_budget"]) * 100
            if pct >= 80:
                level = "danger" if pct >= 100 else "warning"
                alerts.append({
                    "category": cat["name"],
                    "color": cat["color"],
                    "spent": cat["spent"],
                    "budget": cat["monthly_budget"],
                    "percent": round(pct, 1),
                    "level": level,
                })

    # Recent expenses (last 5)
    recent = conn.execute(
        """
        SELECT e.*, c.name as category_name, c.color as category_color
        FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.date DESC, e.id DESC LIMIT 5
        """,
    ).fetchall()

    # Biggest category
    biggest = categories[0] if categories and categories[0]["spent"] > 0 else None

    conn.close()

    # Anomalies
    anomalies = detect_anomalies()

    return jsonify({
        "total_spent": total_spent,
        "budget_limit": budget_limit,
        "remaining": max(0, budget_limit - total_spent),
        "tx_count": tx_count,
        "top_categories": categories[:5],
        "recent_expenses": [dict(r) for r in recent],
        "budget_alerts": alerts,
        "anomaly_count": len(anomalies),
        "biggest_category": biggest,
    })


# ────────────────────────────────────────────────
# Analytics / Charts
# ────────────────────────────────────────────────
@app.route("/api/charts/monthly", methods=["GET"])
def chart_monthly():
    theme = request.args.get("theme", "light")
    html = monthly_bar_chart(theme)
    return app.response_class(html, mimetype="text/html")


@app.route("/api/charts/category", methods=["GET"])
def chart_category():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    theme = request.args.get("theme", "light")
    html = category_pie_chart(month, theme)
    return app.response_class(html, mimetype="text/html")


@app.route("/api/charts/trend", methods=["GET"])
def chart_trend():
    category_id = request.args.get("category_id", 1, type=int)
    theme = request.args.get("theme", "light")
    conn = get_connection()
    cat = conn.execute("SELECT name FROM categories WHERE id = ?", (category_id,)).fetchone()
    conn.close()
    name = cat["name"] if cat else ""
    html = category_trend_chart(category_id, name, theme)
    return app.response_class(html, mimetype="text/html")


@app.route("/api/predict", methods=["GET"])
def predict():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    result = predict_end_of_month(month)
    return jsonify(result)


@app.route("/api/anomalies", methods=["GET"])
def anomalies():
    data = detect_anomalies()
    return jsonify(data)


# ────────────────────────────────────────────────
# Reports
# ────────────────────────────────────────────────
@app.route("/api/report", methods=["GET"])
def monthly_report():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    filepath = generate_monthly_report(month)
    return send_file(filepath, as_attachment=True, download_name=f"expense_report_{month}.pdf")


# ────────────────────────────────────────────────
# Recurring
# ────────────────────────────────────────────────
@app.route("/api/recurring", methods=["GET"])
def get_recurring():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT r.*, c.name as category_name, c.color as category_color
        FROM recurring r LEFT JOIN categories c ON r.category_id = c.id
        ORDER BY r.day_of_month
        """
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/recurring", methods=["POST"])
def add_recurring():
    data = request.json
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO recurring (category_id, amount, description, day_of_month, active) VALUES (?, ?, ?, ?, 1)",
        (data.get("category_id"), data["amount"], data.get("description", ""), data["day_of_month"]),
    )
    conn.commit()
    row = conn.execute("SELECT r.*, c.name as category_name FROM recurring r LEFT JOIN categories c ON r.category_id = c.id WHERE r.id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201


@app.route("/api/recurring/<int:rec_id>", methods=["PUT"])
def update_recurring(rec_id):
    data = request.json
    conn = get_connection()
    conn.execute(
        "UPDATE recurring SET category_id=?, amount=?, description=?, day_of_month=?, active=? WHERE id=?",
        (data.get("category_id"), data["amount"], data.get("description", ""), data["day_of_month"], data.get("active", 1), rec_id),
    )
    conn.commit()
    row = conn.execute("SELECT r.*, c.name as category_name FROM recurring r LEFT JOIN categories c ON r.category_id = c.id WHERE r.id = ?", (rec_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))


@app.route("/api/recurring/<int:rec_id>", methods=["DELETE"])
def delete_recurring(rec_id):
    conn = get_connection()
    conn.execute("DELETE FROM recurring WHERE id = ?", (rec_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/recurring/process", methods=["POST"])
def process_recurring():
    """Auto-add any recurring expenses due today."""
    today = date.today()
    today_day = today.day
    today_str = str(today)
    month_str = today.strftime("%Y-%m")
    conn = get_connection()

    rules = conn.execute(
        "SELECT * FROM recurring WHERE active = 1 AND day_of_month = ?", (today_day,)
    ).fetchall()

    added = []
    for rule in rules:
        # Check if already added today
        exists = conn.execute(
            "SELECT id FROM expenses WHERE category_id=? AND date=? AND description=? AND amount=?",
            (rule["category_id"], today_str, rule["description"], rule["amount"]),
        ).fetchone()
        if not exists:
            cur = conn.execute(
                "INSERT INTO expenses (amount, category_id, description, payment_method, date, note, is_recurring) VALUES (?, ?, ?, 'Recurring', ?, '', 1)",
                (rule["amount"], rule["category_id"], rule["description"], today_str),
            )
            conn.commit()
            added.append({
                "id": cur.lastrowid,
                "description": rule["description"],
                "amount": rule["amount"],
            })

    conn.close()
    return jsonify({"added": added, "count": len(added)})


# ────────────────────────────────────────────────
# Budgets
# ────────────────────────────────────────────────
@app.route("/api/budgets", methods=["GET"])
def get_budget():
    month = request.args.get("month", datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    row = conn.execute("SELECT * FROM budgets WHERE month = ?", (month,)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {"month": month, "total_limit": 0})


@app.route("/api/budgets", methods=["POST"])
def set_budget():
    data = request.json
    month = data.get("month", datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    conn.execute(
        "INSERT INTO budgets (month, total_limit) VALUES (?, ?) ON CONFLICT(month) DO UPDATE SET total_limit = excluded.total_limit",
        (month, data["total_limit"]),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM budgets WHERE month = ?", (month,)).fetchone()
    conn.close()
    return jsonify(dict(row))


# ────────────────────────────────────────────────
# Health check
# ────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(port=port, debug=debug)
