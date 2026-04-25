import plotly.graph_objects as go
from analysis import get_monthly_totals, get_category_breakdown, get_category_trend


def _template(theme: str) -> str:
    return "plotly_dark" if theme == "dark" else "plotly_white"


def monthly_bar_chart(user_id: int, theme: str = "light") -> str:
    data = get_monthly_totals(user_id, 12)

    if not data:
        fig = go.Figure()
        fig.update_layout(title="No data available", template=_template(theme), paper_bgcolor="rgba(0,0,0,0)")
        return fig.to_html(full_html=False, include_plotlyjs="cdn")

    months = [d["month"] for d in data]
    totals = [d["total"] for d in data]

    fig = go.Figure(go.Bar(
        x=months, y=totals,
        marker=dict(color=totals, colorscale="Viridis", showscale=False),
        text=[f"Rs.{v:,.0f}" for v in totals],
        textposition="outside",
        hovertemplate="<b>%{x}</b><br>Spent: Rs.%{y:,.2f}<extra></extra>",
    ))
    fig.update_layout(
        title=dict(text="Monthly Spending — Last 12 Months", font=dict(size=18)),
        xaxis_title="Month", yaxis_title="Amount (Rs.)",
        template=_template(theme),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=60, b=40),
        font=dict(family="Inter, sans-serif"),
    )
    return fig.to_html(full_html=False, include_plotlyjs="cdn")


def category_pie_chart(user_id: int, month: str, theme: str = "light") -> str:
    data = [d for d in get_category_breakdown(user_id, month) if d["spent"] > 0]

    if not data:
        fig = go.Figure()
        fig.update_layout(title=f"No expenses for {month}", template=_template(theme), paper_bgcolor="rgba(0,0,0,0)")
        return fig.to_html(full_html=False, include_plotlyjs="cdn")

    fig = go.Figure(go.Pie(
        labels=[d["name"] for d in data],
        values=[d["spent"] for d in data],
        marker=dict(colors=[d["color"] for d in data]),
        texttemplate="%{label}<br>Rs.%{value:,.0f}",
        hovertemplate="<b>%{label}</b><br>Rs.%{value:,.2f} (%{percent})<extra></extra>",
        hole=0.4,
    ))
    fig.update_layout(
        title=dict(text=f"Category Breakdown — {month}", font=dict(size=18)),
        template=_template(theme),
        paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=20, r=20, t=60, b=20),
        font=dict(family="Inter, sans-serif"),
    )
    return fig.to_html(full_html=False, include_plotlyjs="cdn")


def category_trend_chart(user_id: int, category_id: int, category_name: str = "", theme: str = "light") -> str:
    data = get_category_trend(user_id, category_id, 6)

    if not data:
        fig = go.Figure()
        fig.update_layout(title="No data for this category", template=_template(theme), paper_bgcolor="rgba(0,0,0,0)")
        return fig.to_html(full_html=False, include_plotlyjs="cdn")

    fig = go.Figure(go.Scatter(
        x=[d["month"] for d in data],
        y=[d["total"] for d in data],
        mode="lines+markers",
        line=dict(color="#6366f1", width=3),
        marker=dict(size=8, color="#6366f1"),
        fill="tozeroy", fillcolor="rgba(99,102,241,0.15)",
        hovertemplate="<b>%{x}</b><br>Rs.%{y:,.2f}<extra></extra>",
    ))
    fig.update_layout(
        title=dict(text=f"Spend Trend — {category_name or 'Category'}", font=dict(size=18)),
        xaxis_title="Month", yaxis_title="Amount (Rs.)",
        template=_template(theme),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=60, b=40),
        font=dict(family="Inter, sans-serif"),
    )
    return fig.to_html(full_html=False, include_plotlyjs="cdn")
