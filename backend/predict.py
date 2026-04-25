import os
import calendar
from datetime import date
from dotenv import load_dotenv
from analysis import get_current_month_daily

load_dotenv()


def _linear_regression(xs, ys):
    """Simple linear regression: returns (slope, intercept)."""
    n = len(xs)
    if n == 0:
        return 0, 0
    sum_x = sum(xs)
    sum_y = sum(ys)
    sum_xy = sum(x * y for x, y in zip(xs, ys))
    sum_x2 = sum(x * x for x in xs)
    denom = n * sum_x2 - sum_x ** 2
    if denom == 0:
        return 0, sum_y / n
    slope = (n * sum_xy - sum_x * sum_y) / denom
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


def predict_end_of_month(user_id: int, month: str) -> dict:
    rows = get_current_month_daily(user_id, month)

    year, mon = map(int, month.split("-"))
    days_in_month = calendar.monthrange(year, mon)[1]
    today_day = date.today().day
    days_left = days_in_month - today_day

    if not rows:
        return {
            "predicted": 0.0,
            "current": 0.0,
            "days_left": days_left,
            "message": "No expense data for this month yet.",
        }

    # Build cumulative spend by day
    day_nums = []
    cumulative = []
    running = 0
    for r in rows:
        day = int(r["date"].split("-")[2])
        running += r["total"]
        day_nums.append(day)
        cumulative.append(running)

    current_total = cumulative[-1]

    if len(day_nums) < 2:
        rate = current_total / today_day if today_day > 0 else 0
        predicted = rate * days_in_month
        message = f"Spending at Rs.{rate:,.0f}/day. Projected: Rs.{predicted:,.0f} this month."
        return {
            "predicted": round(predicted, 2),
            "current": round(current_total, 2),
            "days_left": days_left,
            "message": message,
        }

    slope, intercept = _linear_regression(day_nums, cumulative)
    predicted = max(slope * days_in_month + intercept, current_total)

    message = f"Spending at Rs.{slope:,.0f}/day. Projected total: Rs.{predicted:,.0f} this month."

    return {
        "predicted": round(predicted, 2),
        "current": round(current_total, 2),
        "days_left": days_left,
        "message": message,
    }
