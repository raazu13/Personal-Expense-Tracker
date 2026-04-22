from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Expense:
    id: Optional[int]
    amount: float
    category_id: Optional[int]
    description: str
    payment_method: str
    date: str
    note: str = ""
    is_recurring: int = 0
    created_at: str = ""


@dataclass
class Category:
    id: Optional[int]
    name: str
    color: str
    monthly_budget: float = 0.0


@dataclass
class Budget:
    id: Optional[int]
    month: str
    total_limit: float
