from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np

from tensorflow.keras.metrics import MeanSquaredError
from tensorflow.keras.models import load_model
import joblib

from sqlalchemy import Column, Integer, Float, String, Date, create_engine, extract
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import date

# ============================
# DATABASE SETUP
# ============================
SQLALCHEMY_DATABASE_URL = "sqlite:///./transactions.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# ============================
# FASTAPI SETUP
# ============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# LOAD MODEL & SCALERS
# ============================
model = load_model(
    "expense_predictor_model.h5",
    custom_objects={"mse": MeanSquaredError()}
)

scaler_X = joblib.load("scaler_X.pkl")
scaler_y = joblib.load("scaler_y.pkl")

EXPECTED_FEATURES = 8

# ============================
# Pydantic Schemas
# ============================
class ExpenseInput(BaseModel):
    features: List[float]

class TransactionInput(BaseModel):
    date: str
    category: str
    amount: float
    description: str | None = None

# ============================
# DEPENDENCY
# ============================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================
# 1️⃣ PREDICT NEXT MONTH EXPENSE
# ============================
@app.post("/predict")
def predict_expense(data: ExpenseInput):
    features = np.array(data.features)
    if features.shape[0] != EXPECTED_FEATURES:
        raise HTTPException(status_code=400, detail=f"Expected {EXPECTED_FEATURES} features")

    features[-1] = np.clip(features[-1], -1, 1)
    features_norm = scaler_X.transform(features.reshape(1, -1))
    pred_norm = model.predict(features_norm, verbose=0)
    pred = scaler_y.inverse_transform(pred_norm)[0][0]
    return {"predicted_expense": float(pred)}

# ============================
# 2️⃣ ADD TRANSACTION
# ============================
@app.post("/transactions")
def add_transaction(tx: TransactionInput, db: Session = Depends(get_db)):
    t = Transaction(
        date=date.fromisoformat(tx.date),
        category=tx.category.lower(),
        amount=tx.amount,
        description=tx.description
    )
    db.add(t)
    db.commit()
    db.refresh(t)  # ✅ Ensures the ID is available
    return {
        "status": "success",
        "id": t.id,
        "date": str(t.date),
        "category": t.category,
        "amount": t.amount,
        "description": t.description
    }

# ============================
# 3️⃣ GET MONTH TRANSACTIONS
# ============================
@app.get("/transactions/{year_month}")
def get_transactions(year_month: str, db: Session = Depends(get_db)):
    year, month = map(int, year_month.split("-"))
    txs = db.query(Transaction).filter(
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == month
    ).all()
    return [
        {
            "id": t.id,
            "date": str(t.date),
            "category": t.category,
            "amount": t.amount,
            "description": t.description
        }
        for t in txs
    ]

# ============================
# 4️⃣ MONTHLY SUMMARY
# ============================
@app.get("/summary/{year_month}")
def summary(year_month: str, db: Session = Depends(get_db)):
    year, month = map(int, year_month.split("-"))
    txs = db.query(Transaction).filter(
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == month
    ).all()
    total = sum(t.amount for t in txs)

    # Previous month calculation
    prev_year, prev_month = (year-1, 12) if month == 1 else (year, month-1)
    prev_txs = db.query(Transaction).filter(
        extract("year", Transaction.date) == prev_year,
        extract("month", Transaction.date) == prev_month
    ).all()
    prev_total = sum(t.amount for t in prev_txs)
    percent_change = (total - prev_total) / prev_total if prev_total else 0
    percent_change = max(min(percent_change, 1), -1)

    return {"total_expense": total, "percent_change": percent_change}

# ============================
# 5️⃣ AUTOFILL FEATURES
# ============================
@app.get("/autofill/{year_month}")
def autofill(year_month: str, db: Session = Depends(get_db)):
    year, month = map(int, year_month.split("-"))

    txs = db.query(Transaction).filter(
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == month
    ).all()

    total_expense = sum(t.amount for t in txs)
    transaction_count = len(txs)
    food_total = sum(t.amount for t in txs if t.category.lower() == "food")
    rent_total = sum(t.amount for t in txs if t.category.lower() == "rent")
    travel_total = sum(t.amount for t in txs if t.category.lower() == "travel")
    other_total = sum(t.amount for t in txs if t.category.lower() not in ["food", "rent", "travel"])

    # Previous month
    prev_year, prev_month = (year-1, 12) if month == 1 else (year, month-1)
    prev_txs = db.query(Transaction).filter(
        extract("year", Transaction.date) == prev_year,
        extract("month", Transaction.date) == prev_month
    ).all()
    prev_total = sum(t.amount for t in prev_txs)
    percent_change = (total_expense - prev_total) / prev_total if prev_total else 0
    percent_change = max(min(percent_change, 1), -1)

    features = [
        total_expense,
        transaction_count,
        food_total,
        rent_total,
        travel_total,
        other_total,
        month,
        percent_change
    ]

    return {"features": features, "percent_change": percent_change}
