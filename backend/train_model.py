import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.regularizers import l2
from tensorflow.keras.callbacks import EarlyStopping
import joblib

# ----------------------
# Reproducibility
# ----------------------
np.random.seed(42)
tf.random.set_seed(42)

# ----------------------
# Load Dataset
# ----------------------
df = pd.read_csv('training_data_1000.csv')

# ----------------------
# Stabilize percentage change
# ----------------------
df["percent_change"] = df["percent_change"].clip(-1, 1)

# ----------------------
# Target variable
# ----------------------
y = df["target_column"].values  # next month's expense

# ----------------------
# Feature matrix
# ----------------------
X = df[[
    "total_expense",
    "transaction_count",
    "food_total",
    "rent_total",
    "travel_total",
    "other_total",
    "months",           # match training column
    "percent_change"
]].values

# ----------------------
# Normalize features & target
# ----------------------
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()

X_norm = scaler_X.fit_transform(X)
y_norm = scaler_y.fit_transform(y.reshape(-1, 1))  # keep (n_samples,1) shape

# ----------------------
# Train-test split
# ----------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_norm, y_norm, test_size=0.2, random_state=42
)

# ----------------------
# Build Neural Network
# ----------------------
model = Sequential([
    Dense(32, activation='relu', kernel_regularizer=l2(0.001), input_shape=(8,)),
    Dropout(0.1),  # reduced dropout for small dataset
    Dense(32, activation='relu', kernel_regularizer=l2(0.001)),
    Dropout(0.1),
    Dense(1)
])

model.compile(
    optimizer='adam',
    loss='mse',
    metrics=['mae']
)

# ----------------------
# Early stopping
# ----------------------
early_stopping = EarlyStopping(
    monitor='val_loss',
    patience=20,
    restore_best_weights=True
)

# ----------------------
# Train Model
# ----------------------
history = model.fit(
    X_train,
    y_train,
    validation_split=0.2,
    epochs=100,
    callbacks=[early_stopping],
    verbose=2
)

# ----------------------
# Predictions
# ----------------------
y_test_pred_norm = model.predict(X_test)
y_test_pred = scaler_y.inverse_transform(y_test_pred_norm).flatten()

y_test_actual = scaler_y.inverse_transform(y_test).flatten()

# ----------------------
# Evaluation
# ----------------------
mse = mean_squared_error(y_test_actual, y_test_pred)
mae = mean_absolute_error(y_test_actual, y_test_pred)
r2 = r2_score(y_test_actual, y_test_pred)

print(f"Test MSE: {mse:.3f}")
print(f"Test MAE: {mae:.3f}")
print(f"Test R2 Score: {r2:.3f}")

# ----------------------
# Training Curves
# ----------------------
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.xlabel('Epoch')
plt.ylabel('MSE')
plt.title('Loss Curve')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['mae'], label='Train MAE')
plt.plot(history.history['val_mae'], label='Val MAE')
plt.xlabel('Epoch')
plt.ylabel('MAE')
plt.title('MAE Curve')
plt.legend()

plt.tight_layout()
plt.show()

# ----------------------
# Actual vs Predicted
# ----------------------
plt.figure(figsize=(7, 6))
plt.scatter(y_test_actual, y_test_pred, alpha=0.6)
plt.plot(
    [min(y_test_actual), max(y_test_actual)],
    [min(y_test_actual), max(y_test_actual)],
    'r--'
)
plt.xlabel('Actual Expense')
plt.ylabel('Predicted Expense')
plt.title('Actual vs Predicted Expenses')
plt.show()

# ----------------------
# Error Visualization
# ----------------------
errors = np.abs(y_test_actual - y_test_pred)

plt.figure(figsize=(7, 6))
plt.scatter(y_test_actual, y_test_pred, c=errors, cmap='coolwarm')
plt.colorbar(label='Absolute Error')
plt.plot(
    [min(y_test_actual), max(y_test_actual)],
    [min(y_test_actual), max(y_test_actual)],
    'k--'
)
plt.xlabel('Actual Expense')
plt.ylabel('Predicted Expense')
plt.title('Prediction Error Heatmap')
plt.show()

# ----------------------
# Save model & scalers
# ----------------------
model.save('expense_predictor_model.h5')
joblib.dump(scaler_X, 'scaler_X.pkl')
joblib.dump(scaler_y, 'scaler_y.pkl')

print("✅ Training complete. Model and scalers saved.")
