import numpy as np
import tensorflow as tf
from tensorflow.keras.metrics import MeanSquaredError

model = tf.keras.models.load_model('expense_predictor_model.h5', custom_objects={'mse': MeanSquaredError()})

max_expense = 1750  # same max as training

def predict_expense(last_month_expense):
    input_norm = np.array([[last_month_expense]]) / max_expense
    predicted_norm = model.predict(input_norm)
    return predicted_norm[0][0] * max_expense

last_month = 1600
predicted = predict_expense(last_month)
print(f"Predicted next month expense for {last_month}: ${predicted:.2f}")
