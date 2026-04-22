import plotly.graph_objects as go
import plotly.express as px
from analysis import get_monthly_totals, get_category_breakdown, get_category_trend


def _template(theme: str) -> str:
    return "plotly_dark" if theme == "dark" else "plotly_white"


def monthly_bar_chart(theme: str = "light") -> str:
    df = get_monthly_totals(12)
    if df.empty:
        fig = go.Figure()
        fig.update_layout(
            title="No data available",
            template=_template(theme),
            paper_bgcolor="rgba(0,0,0,0)",
        )
        return fig.to_html(full_html=False, include_plotlyjs="cdn")

    fig = go.Figure(
        go.Bar(
            x=df["month"],
            y=df["total"],
            marker=dict(
                color=df["total"],
                colorscale="Viridis",
                showscale=False,
            ),
            text=[f"₹{v:,.0f}" for v in df["total"]],
            textposition="outside",
            hovertemplate="<b>%{x}</b><br>Spent: ₹%{y:,.2f}<extra></extra>",
        )
    )
    fig.update_layout(
        title=dict(text="Monthly Spending — Last 12 Months", font=dict(size=18)),
        xaxis_title="Month",
        yaxis_title="Amount (₹)",
        template=_template(theme),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=60, b=40),
        font=dict(family="Inter, sans-serif"),
    )
    return fig.to_html(full_html=False, include_plotlyjs="cdn")


def category_pie_chart(month: str, theme: str = "light") -> str:
    df = get_category_breakdown(month)
    df = df[df["spent"] > 0]

    if df.empty:
        fig = go.Figure()
        fig.update_layout(
            title=f"No expenses for {month}",
            template=_template(theme),
            paper_bgcolor="rgba(0,0,0,0)",
        )
        return fig.to_html(full_html=False, include_plotlyjs="cdn")

    fig = go.Figure(
        go.Pie(
            labels=df["name"],
            values=df["spent"],
            marker=dict(colors=df["color"].tolist()),
            texttemplate="%{label}<br>₹%{value:,.0f}",
            hovertemplate="<b>%{label}</b><br>₹%{value:,.2f} (%{percent})<extra></extra>",
            hole=0.4,
        )
    )
    fig.update_layout(
        title=dict(text=f"Category Breakdown — {month}", font=dict(size=18)),
        template=_template(theme),
        paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=20, r=20, t=60, b=20),
        font=dict(family="Inter, sans-serif"),
    )
    return fig.to_html(full_html=False, include_plotlyjs="cdn")


def category_trend_chart(category_id: int, category_name: str = "", theme: str = "light") -> str:
    df = get_category_trend(category_id, 6)

    if df.empty:
        fig = go.Figure()
        fig.update_layout(
            title="No data for this category",
            template=_template(theme),
            paper_bgcolor="rgba(0,0,0,0)",
        )
        return fig.to_html(full_html=False, include_plotlyjs="cdn")

    fig = go.Figure(
        go.Scatter(
            x=df["month"],
            y=df["total"],
            mode="lines+markers",
            line=dict(color="#6366f1", width=3),
            marker=dict(size=8, color="#6366f1"),
            fill="tozeroy",
            fillcolor="rgba(99,102,241,0.15)",
            hovertemplate="<b>%{x}</b><br>₹%{y:,.2f}<extra></extra>",
        )
    )
    fig.update_layout(
        title=dict(text=f"Spend Trend — {category_name or 'Category'}", font=dict(size=18)),
        xaxis_title="Month",
        yaxis_title="Amount (₹)",
        template=_template(theme),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=60, b=40),
        font=dict(family="Inter, sans-serif"),
    )
    return fig.to_html(full_html=False, include_plotlyjs="cdn")
