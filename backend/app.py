import os
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import jwt
import bcrypt
import psycopg2
import psycopg2.extras

from db import init_db, get_connection, seed_default_categories
from analysis import get_category_breakdown, detect_anomalies
from charts import monthly_bar_chart, category_pie_chart, category_trend_chart
from predict import predict_end_of_month
from report import generate_monthly_report

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-please")
JWT_DAYS = 30

app = Flask(__name__)
CORS(app)

with app.app_context():
    init_db()


# ── Auth helper ────────────────────────────────────────────────────────────────
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
        if not token:
            return jsonify({"error": "Authentication required"}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user_id = payload["user_id"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def make_token(user_id):
    exp = datetime.datetime.utcnow() + datetime.timedelta(days=JWT_DAYS)
    return jwt.encode({"user_id": user_id, "exp": exp}, JWT_SECRET, algorithm="HS256")


def cur(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# ── Auth routes ────────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    security_question = data.get("security_question", "").strip()
    security_answer = data.get("security_answer", "").strip().lower()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if not security_question or not security_answer:
        return jsonify({"error": "Security question and answer are tightly required for password recovery"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    ans_hashed = bcrypt.hashpw(security_answer.encode(), bcrypt.gensalt()).decode()

    conn = get_connection()
    try:
        with cur(conn) as c:
            c.execute(
                "INSERT INTO users (email, password_hash, name, security_question, security_answer_hash) VALUES (%s, %s, %s, %s, %s) RETURNING id, email, name",
                (email, hashed, name, security_question, ans_hashed)
            )
            user = dict(c.fetchone())
        conn.commit()
        seed_default_categories(user["id"])
        token = make_token(user["id"])
        return jsonify({"token": token, "user": user}), 201
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already registered"}), 409
    finally:
        conn.close()


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = c.fetchone()
    conn.close()

    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    token = make_token(user["id"])
    return jsonify({"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}})


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_me():
    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT id, email, name FROM users WHERE id = %s", (request.user_id,))
        user = c.fetchone()
    conn.close()
    return jsonify(dict(user)) if user else (jsonify({"error": "Not found"}), 404)


@app.route("/api/auth/account", methods=["DELETE"])
@require_auth
def delete_account():
    conn = get_connection()
    with cur(conn) as c:
        c.execute("DELETE FROM users WHERE id = %s", (request.user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/auth/security-question", methods=["GET"])
def get_security_question():
    email = request.args.get("email", "").strip().lower()
    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT security_question FROM users WHERE email = %s", (email,))
        user = c.fetchone()
    conn.close()
    if not user or not user["security_question"]:
        return jsonify({"error": "No security question formulated for this account."}), 404
    return jsonify({"security_question": user["security_question"]})


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    security_answer = data.get("security_answer", "").strip().lower()
    new_password = data.get("new_password", "")

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT id, security_answer_hash FROM users WHERE email = %s", (email,))
        user = c.fetchone()
        
        if not user or not user["security_answer_hash"] or not bcrypt.checkpw(security_answer.encode(), user["security_answer_hash"].encode()):
            conn.close()
            return jsonify({"error": "Invalid email or security answer"}), 401

        new_hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        c.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hashed, user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Password updated successfully"})


# ── Expenses ───────────────────────────────────────────────────────────────────
@app.route("/api/expenses", methods=["GET"])
@require_auth
def get_expenses():
    uid = request.user_id
    category = request.args.get("category")
    month = request.args.get("month")
    search = request.args.get("search", "")
    payment = request.args.get("payment_method")

    query = """
        SELECT e.*, c.name AS category_name, c.color AS category_color
        FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = %s
    """
    params = [uid]
    if category:
        query += " AND e.category_id = %s"; params.append(category)
    if month:
        query += " AND TO_CHAR(e.date, 'YYYY-MM') = %s"; params.append(month)
    if search:
        query += " AND e.description ILIKE %s"; params.append(f"%{search}%")
    if payment:
        query += " AND e.payment_method = %s"; params.append(payment)
    query += " ORDER BY e.date DESC, e.id DESC"

    conn = get_connection()
    with cur(conn) as c:
        c.execute(query, params)
        rows = [dict(r) for r in c.fetchall()]
    conn.close()
    # Convert date objects to strings
    for r in rows:
        if hasattr(r.get("date"), "isoformat"):
            r["date"] = r["date"].isoformat()
    return jsonify(rows)


@app.route("/api/expenses", methods=["POST"])
@require_auth
def add_expense():
    data = request.json
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            """INSERT INTO expenses (user_id, amount, category_id, description, payment_method, date, note, is_recurring)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (uid, data["amount"], data.get("category_id"), data.get("description", ""),
             data.get("payment_method", "Cash"), data.get("date"), data.get("note", ""), data.get("is_recurring", 0))
        )
        new_id = c.fetchone()["id"]
        c.execute(
            "SELECT e.*, c.name AS category_name, c.color AS category_color FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = %s",
            (new_id,)
        )
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    if hasattr(row.get("date"), "isoformat"):
        row["date"] = row["date"].isoformat()
    return jsonify(row), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
@require_auth
def update_expense(expense_id):
    data = request.json
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            """UPDATE expenses SET amount=%s, category_id=%s, description=%s, payment_method=%s, date=%s, note=%s, is_recurring=%s
               WHERE id=%s AND user_id=%s""",
            (data["amount"], data.get("category_id"), data.get("description",""),
             data.get("payment_method","Cash"), data.get("date"), data.get("note",""), data.get("is_recurring",0), expense_id, uid)
        )
        c.execute(
            "SELECT e.*, c.name AS category_name, c.color AS category_color FROM expenses e LEFT JOIN categories c ON e.category_id=c.id WHERE e.id=%s",
            (expense_id,)
        )
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    if hasattr(row.get("date"), "isoformat"):
        row["date"] = row["date"].isoformat()
    return jsonify(row)


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
@require_auth
def delete_expense(expense_id):
    conn = get_connection()
    with cur(conn) as c:
        c.execute("DELETE FROM expenses WHERE id = %s AND user_id = %s", (expense_id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/expenses/export", methods=["GET"])
@require_auth
def export_csv():
    import io, csv
    uid = request.user_id
    month = request.args.get("month", "")
    conn = get_connection()
    query = """
        SELECT e.date, e.description, c.name AS category, e.amount, e.payment_method, e.note
        FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = %s
    """
    params = [uid]
    if month:
        query += " AND TO_CHAR(e.date, 'YYYY-MM') = %s"; params.append(month)
    query += " ORDER BY e.date DESC"
    with cur(conn) as c:
        c.execute(query, params)
        rows = c.fetchall()
    conn.close()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Category", "Amount", "Payment Method", "Note"])
    for r in rows:
        writer.writerow([str(r["date"]), r["description"], r["category"], r["amount"], r["payment_method"], r["note"]])
    output.seek(0)
    return app.response_class(output.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=expenses_{month or 'all'}.csv"})


# ── Categories ─────────────────────────────────────────────────────────────────
@app.route("/api/categories", methods=["GET"])
@require_auth
def get_categories():
    uid = request.user_id
    month = request.args.get("month", datetime.datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    with cur(conn) as c:
        c.execute("""
            SELECT c.*, COALESCE(SUM(e.amount), 0) AS spent
            FROM categories c
            LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = %s AND TO_CHAR(e.date, 'YYYY-MM') = %s
            WHERE c.user_id = %s
            GROUP BY c.id ORDER BY c.name
        """, (uid, month, uid))
        rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/categories", methods=["POST"])
@require_auth
def add_category():
    data = request.json
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            "INSERT INTO categories (user_id, name, color, monthly_budget) VALUES (%s, %s, %s, %s) RETURNING *",
            (uid, data["name"], data.get("color", "#6366f1"), data.get("monthly_budget", 0))
        )
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    return jsonify(row), 201


@app.route("/api/categories/<int:cat_id>", methods=["PUT"])
@require_auth
def update_category(cat_id):
    data = request.json
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            "UPDATE categories SET name=%s, color=%s, monthly_budget=%s WHERE id=%s AND user_id=%s RETURNING *",
            (data["name"], data.get("color","#6366f1"), data.get("monthly_budget",0), cat_id, uid)
        )
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    return jsonify(row)


@app.route("/api/categories/<int:cat_id>", methods=["DELETE"])
@require_auth
def delete_category(cat_id):
    conn = get_connection()
    with cur(conn) as c:
        c.execute("DELETE FROM categories WHERE id = %s AND user_id = %s", (cat_id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ── Dashboard ──────────────────────────────────────────────────────────────────
@app.route("/api/dashboard", methods=["GET"])
@require_auth
def dashboard():
    uid = request.user_id
    month = request.args.get("month", datetime.datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id=%s AND TO_CHAR(date,'YYYY-MM')=%s", (uid, month))
        total_spent = c.fetchone()["total"]

        c.execute("SELECT total_limit FROM budgets WHERE user_id=%s AND month=%s", (uid, month))
        br = c.fetchone()
        budget_limit = br["total_limit"] if br else 0

        c.execute("SELECT COUNT(*) AS cnt FROM expenses WHERE user_id=%s AND TO_CHAR(date,'YYYY-MM')=%s", (uid, month))
        tx_count = c.fetchone()["cnt"]

        c.execute("""
            SELECT c.id, c.name, c.color, c.monthly_budget, COALESCE(SUM(e.amount),0) AS spent
            FROM categories c
            LEFT JOIN expenses e ON e.category_id=c.id AND e.user_id=%s AND TO_CHAR(e.date,'YYYY-MM')=%s
            WHERE c.user_id=%s GROUP BY c.id ORDER BY spent DESC
        """, (uid, month, uid))
        categories = [dict(r) for r in c.fetchall()]

        c.execute("""
            SELECT e.*, c.name AS category_name, c.color AS category_color
            FROM expenses e LEFT JOIN categories c ON e.category_id=c.id
            WHERE e.user_id=%s ORDER BY e.date DESC, e.id DESC LIMIT 5
        """, (uid,))
        recent = [dict(r) for r in c.fetchall()]
    conn.close()

    for r in recent:
        if hasattr(r.get("date"), "isoformat"):
            r["date"] = r["date"].isoformat()

    alerts = []
    for cat in categories:
        if cat["monthly_budget"] > 0:
            pct = (cat["spent"] / cat["monthly_budget"]) * 100
            if pct >= 80:
                alerts.append({"category": cat["name"], "color": cat["color"],
                                "spent": cat["spent"], "budget": cat["monthly_budget"],
                                "percent": round(pct, 1), "level": "danger" if pct >= 100 else "warning"})

    anomalies = detect_anomalies(uid)
    biggest = categories[0] if categories and categories[0]["spent"] > 0 else None

    return jsonify({
        "total_spent": total_spent, "budget_limit": budget_limit,
        "remaining": max(0, budget_limit - total_spent), "tx_count": tx_count,
        "top_categories": categories[:5], "recent_expenses": recent,
        "budget_alerts": alerts, "anomaly_count": len(anomalies), "biggest_category": biggest,
    })


# ── Analytics / Charts ─────────────────────────────────────────────────────────
@app.route("/api/charts/monthly", methods=["GET"])
@require_auth
def chart_monthly():
    html = monthly_bar_chart(request.user_id, request.args.get("theme", "light"))
    return app.response_class(html, mimetype="text/html")


@app.route("/api/charts/category", methods=["GET"])
@require_auth
def chart_category():
    month = request.args.get("month", datetime.datetime.now().strftime("%Y-%m"))
    html = category_pie_chart(request.user_id, month, request.args.get("theme", "light"))
    return app.response_class(html, mimetype="text/html")


@app.route("/api/charts/trend", methods=["GET"])
@require_auth
def chart_trend():
    cat_id = request.args.get("category_id", 1, type=int)
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT name FROM categories WHERE id=%s AND user_id=%s", (cat_id, uid))
        row = c.fetchone()
    conn.close()
    name = row["name"] if row else ""
    html = category_trend_chart(uid, cat_id, name, request.args.get("theme", "light"))
    return app.response_class(html, mimetype="text/html")


@app.route("/api/predict", methods=["GET"])
@require_auth
def predict():
    month = request.args.get("month", datetime.datetime.now().strftime("%Y-%m"))
    return jsonify(predict_end_of_month(request.user_id, month))


@app.route("/api/anomalies", methods=["GET"])
@require_auth
def anomalies():
    return jsonify(detect_anomalies(request.user_id))


# ── Reports ────────────────────────────────────────────────────────────────────
@app.route("/api/report", methods=["GET"])
@require_auth
def monthly_report():
    month = request.args.get("month", datetime.datetime.now().strftime("%Y-%m"))
    filepath = generate_monthly_report(request.user_id, month)
    return send_file(filepath, as_attachment=True, download_name=f"expense_report_{month}.pdf")


# ── Recurring ──────────────────────────────────────────────────────────────────
@app.route("/api/recurring", methods=["GET"])
@require_auth
def get_recurring():
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute("""
            SELECT r.*, c.name AS category_name, c.color AS category_color
            FROM recurring r LEFT JOIN categories c ON r.category_id=c.id
            WHERE r.user_id=%s ORDER BY r.day_of_month
        """, (uid,))
        rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/recurring", methods=["POST"])
@require_auth
def add_recurring():
    data = request.json
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            "INSERT INTO recurring (user_id, category_id, amount, description, day_of_month, active) VALUES (%s,%s,%s,%s,%s,1) RETURNING id",
            (uid, data.get("category_id"), data["amount"], data.get("description",""), data["day_of_month"])
        )
        new_id = c.fetchone()["id"]
        c.execute("SELECT r.*, c.name AS category_name FROM recurring r LEFT JOIN categories c ON r.category_id=c.id WHERE r.id=%s", (new_id,))
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    return jsonify(row), 201


@app.route("/api/recurring/<int:rec_id>", methods=["PUT"])
@require_auth
def update_recurring(rec_id):
    data = request.json
    uid = request.user_id
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            "UPDATE recurring SET category_id=%s, amount=%s, description=%s, day_of_month=%s, active=%s WHERE id=%s AND user_id=%s RETURNING *",
            (data.get("category_id"), data["amount"], data.get("description",""), data["day_of_month"], data.get("active",1), rec_id, uid)
        )
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    return jsonify(row)


@app.route("/api/recurring/<int:rec_id>", methods=["DELETE"])
@require_auth
def delete_recurring(rec_id):
    conn = get_connection()
    with cur(conn) as c:
        c.execute("DELETE FROM recurring WHERE id=%s AND user_id=%s", (rec_id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/recurring/process", methods=["POST"])
@require_auth
def process_recurring():
    from datetime import date
    uid = request.user_id
    today = date.today()
    today_str = str(today)
    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT * FROM recurring WHERE user_id=%s AND active=1 AND day_of_month=%s", (uid, today.day))
        rules = c.fetchall()
        added = []
        for rule in rules:
            c.execute(
                "SELECT id FROM expenses WHERE user_id=%s AND category_id=%s AND date=%s AND description=%s AND amount=%s",
                (uid, rule["category_id"], today_str, rule["description"], rule["amount"])
            )
            if not c.fetchone():
                c.execute(
                    "INSERT INTO expenses (user_id, amount, category_id, description, payment_method, date, note, is_recurring) VALUES (%s,%s,%s,%s,'Recurring',%s,'',1) RETURNING id",
                    (uid, rule["amount"], rule["category_id"], rule["description"], today_str)
                )
                added.append({"id": c.fetchone()["id"], "description": rule["description"], "amount": rule["amount"]})
    conn.commit()
    conn.close()
    return jsonify({"added": added, "count": len(added)})


# ── Budgets ────────────────────────────────────────────────────────────────────
@app.route("/api/budgets", methods=["GET"])
@require_auth
def get_budget():
    uid = request.user_id
    month = request.args.get("month", datetime.datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    with cur(conn) as c:
        c.execute("SELECT * FROM budgets WHERE user_id=%s AND month=%s", (uid, month))
        row = c.fetchone()
    conn.close()
    return jsonify(dict(row) if row else {"month": month, "total_limit": 0})


@app.route("/api/budgets", methods=["POST"])
@require_auth
def set_budget():
    data = request.json
    uid = request.user_id
    month = data.get("month", datetime.datetime.now().strftime("%Y-%m"))
    conn = get_connection()
    with cur(conn) as c:
        c.execute(
            "INSERT INTO budgets (user_id, month, total_limit) VALUES (%s,%s,%s) ON CONFLICT (user_id, month) DO UPDATE SET total_limit=EXCLUDED.total_limit RETURNING *",
            (uid, month, data["total_limit"])
        )
        row = dict(c.fetchone())
    conn.commit()
    conn.close()
    return jsonify(row)


# ── Health ─────────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(port=port, debug=debug)
