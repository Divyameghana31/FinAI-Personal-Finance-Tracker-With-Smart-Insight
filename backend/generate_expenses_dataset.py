import numpy as np
import pandas as pd

np.random.seed(42)
n_samples = 200

# Synthetic features
total_expense = np.random.randint(1000, 5000, size=n_samples)
transaction_count = np.random.randint(5, 25, size=n_samples)
months = np.random.randint(1, 13, size=n_samples)
food_ratio = np.random.uniform(0.1, 0.4, size=n_samples)
rent_ratio = np.random.uniform(0.2, 0.5, size=n_samples)
travel_ratio = np.random.uniform(0.05, 0.15, size=n_samples)
other_ratio = 1.0 - (food_ratio + rent_ratio + travel_ratio)
other_ratio = np.clip(other_ratio, 0, None)

food_total = total_expense * food_ratio
rent_total = total_expense * rent_ratio
travel_total = total_expense * travel_ratio
other_total = total_expense * other_ratio

last_month = total_expense * np.random.uniform(0.8, 1.2, size=n_samples)
percent_change = (total_expense - last_month) / last_month

# Target column (next month’s expense example)
target_column = (total_expense * np.random.uniform(0.95, 1.1, size=n_samples)) + np.random.normal(0, 100, size=n_samples)

# Build DataFrame
df = pd.DataFrame({
    "total_expense": total_expense,
    "transaction_count": transaction_count,
    "food_total": food_total,
    "rent_total": rent_total,
    "travel_total": travel_total,
    "other_total": other_total,
    "months": months,
    "percent_change": percent_change,
    "target_column": target_column
})

# Save to CSV
df.to_csv("expenses.csv", index=False)
print("expenses.csv file with 200 rows generated.")