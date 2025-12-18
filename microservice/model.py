import joblib
import numpy as np

model = joblib.load("artifacts/priority_model.pkl")
scaler = joblib.load("artifacts/scaler.pkl")

PRIORITY_MAP = {0: "Low", 1: "Medium", 2: "High"}

def predict_priority(payload):
    features = np.array([[
        payload["deadline_days"],
        payload["estimated_time"],
        payload["difficulty"],
        payload["urgency_self"],
        payload["self_reported_procrastination"],
        payload["energy_mismatch"],
        payload["historical_procrastination_rate"]
    ]])

    features = scaler.transform(features)
    pred = model.predict(features)[0]

    return PRIORITY_MAP[pred]
