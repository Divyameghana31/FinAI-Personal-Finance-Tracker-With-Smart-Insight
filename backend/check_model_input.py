from tensorflow.keras.models import load_model

model = load_model('multi_feature_expense_predictor.h5', compile=False)
print("Model input shape:", model.input_shape)
