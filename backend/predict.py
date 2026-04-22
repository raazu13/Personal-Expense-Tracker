import numpy as np
from datetime import date
from analysis import get_current_month_daily
import os
from dotenv import load_dotenv

load_dotenv()


def predict_end_of_month(month: str) -> dict:
    """
    Use linear regression on daily cumulative spend to predict end-of-month total.
    """
    df = get_current_month_daily(month)

    year, mon = map(int, month.split("-"))
    # Days in this month
    import calendar
    days_in_month = calendar.monthrange(year, mon)[1]
    today = date.today().day
    days_left = days_in_month - today

    if df.empty:
        return {
            "predicted": 0.0,
            "current": 0.0,
            "days_left": days_left,
            "message": "No expense data for this month yet.",
        }

    # Build day-number and cumulative spend arrays
    df = df.copy()
    df["day"] = df["date"].apply(lambda d: int(d.split("-")[2]))
    df = df.sort_values("day")
    df["cumulative"] = df["total"].cumsum()

    current_total = float(df["cumulative"].iloc[-1])

    if len(df) < 2:
        # Simple rate: current / days passed * days_in_month
        rate = current_total / today if today > 0 else 0
        predicted = rate * days_in_month
        message = f"Spending at Rs.{rate:,.0f}/day. Projected: Rs.{predicted:,.0f} this month."
        return {
            "predicted": round(predicted, 2),
            "current": round(current_total, 2),
            "days_left": days_left,
            "message": message,
        }

    # Linear regression: day → cumulative spend
    X = df["day"].values.reshape(-1, 1)
    y = df["cumulative"].values

    from sklearn.linear_model import LinearRegression
    model = LinearRegression()
    model.fit(X, y)

    predicted = float(model.predict([[days_in_month]])[0])
    predicted = max(predicted, current_total)

    slope = float(model.coef_[0])
    message = (
        f"Spending at Rs.{slope:,.0f}/day. "
        f"Projected total: Rs.{predicted:,.0f} this month."
    )

    return {
        "predicted": round(predicted, 2),
        "current": round(current_total, 2),
        "days_left": days_left,
        "message": message,
    }
