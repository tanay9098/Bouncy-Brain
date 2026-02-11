# import pandas as pd
# import joblib
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.linear_model import LogisticRegression

# # Load dataset
# df = pd.read_csv("data/adhd.csv")

# # Encode categorical
# energy_map = {"Low": 1, "Medium": 2, "High": 3}
# priority_map = {"Low": 0, "Medium": 1, "High": 2}

# df["energy_required"] = df["energy_required"].map(energy_map)
# df["energy_at_attempt"] = df["energy_at_attempt"].map(energy_map)
# df["priority"] = df["priority"].map(priority_map)

# # Derived features
# df["energy_mismatch"] = (df["energy_required"] - df["energy_at_attempt"]).clip(lower=0)
# df["is_delayed"] = df["completion_status"].isin([
#     "Completed but late", "Started but not completed", "Did not start"
# ]).astype(int)

# df["historical_procrastination_rate"] = df["is_delayed"].expanding().mean()

# FEATURES = [
#     "deadline_days",
#     "estimated_time",
#     "difficulty",
#     "urgency_self",
#     "self_reported_procrastination",
#     "energy_mismatch",
#     "historical_procrastination_rate"
# ]

# X = df[FEATURES]
# y = df["priority"]

# # Split
# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42, stratify=y
# )

# # Scale
# scaler = StandardScaler()
# X_train = scaler.fit_transform(X_train)

# # Train model
# model = LogisticRegression(max_iter=500)
# model.fit(X_train, y_train)

# # Save artifacts
# joblib.dump(model, "artifacts/priority_model.pkl")
# joblib.dump(scaler, "artifacts/scaler.pkl")

# print("✅ Model trained and saved")

"""
Bouncy-Brain  –  Base Model Trainer v2 (Random Forest)
======================================================

Trains on the static adhd.csv dataset to create a base model.
Once real user data accumulates, the /train-user endpoint
fine-tunes a per-user model on top of this.

Usage:
    python train.py
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# ── paths ────────────────────────────────────────────────────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "adhd.csv")
ARTIFACTS = os.path.join(os.path.dirname(__file__), "artifacts")

os.makedirs(ARTIFACTS, exist_ok=True)

# ── load dataset ─────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"  rows: {len(df)}, columns: {list(df.columns)}")

# ── encode categoricals ─────────────────────────────────────────────
energy_map = {"Low": 1, "Medium": 2, "High": 3}
priority_map = {"Low": 0, "Medium": 1, "High": 2}

if "energy_required" in df.columns:
    df["energy_required"] = df["energy_required"].map(energy_map).fillna(2)
if "energy_at_attempt" in df.columns:
    df["energy_at_attempt"] = df["energy_at_attempt"].map(energy_map).fillna(2)

df["priority"] = df["priority"].map(priority_map)

# ── derive features to match our 10-feature schema ──────────────────
# We map existing CSV columns → our standard feature names

# completion_rate: derive from completion_status
df["is_completed"] = df["completion_status"].isin([
    "Completed on time", "Completed but late"
]).astype(float)
df["completion_rate"] = df["is_completed"].expanding().mean()

# similar_task_completion_rate: use rolling mean as proxy
df["similar_task_completion_rate"] = df["is_completed"].rolling(
    window=5, min_periods=1
).mean()

# hours_until_deadline
df["hours_until_deadline"] = df["deadline_days"].astype(float) * 24

# is_overdue
df["is_overdue"] = (df["deadline_days"] <= 0).astype(float)

# deadline_pressure
df["deadline_pressure"] = df["hours_until_deadline"].apply(
    lambda h: 3.0 if h < 6 else (2.0 if h < 24 else (1.0 if h < 72 else 0.0))
)

# estimated_minutes
df["estimated_minutes"] = df["estimated_time"].astype(float)

# importance: derive from urgency_self
df["importance"] = df["urgency_self"].astype(float).clip(1, 5)

# streak_count: simulated from rolling completions
df["streak_count"] = df["is_completed"].groupby(
    (df["is_completed"] != df["is_completed"].shift()).cumsum()
).cumcount() + 1
df.loc[df["is_completed"] == 0, "streak_count"] = 0

# avg_session_mins: use estimated_time as proxy (no session data in CSV)
df["avg_session_mins"] = df["estimated_time"].rolling(
    window=10, min_periods=1
).mean()

# hour_of_day: generate realistic distribution (most tasks attempted 8am-10pm)
np.random.seed(42)
df["hour_of_day"] = np.random.choice(
    range(8, 22), size=len(df), p=[0.05, 0.08, 0.1, 0.1, 0.08, 0.07,
                                    0.06, 0.06, 0.08, 0.1, 0.1, 0.05,
                                    0.04, 0.03]
).astype(float)

# ── feature matrix ──────────────────────────────────────────────────
FEATURES = [
    "completion_rate",
    "similar_task_completion_rate",
    "hours_until_deadline",
    "is_overdue",
    "deadline_pressure",
    "estimated_minutes",
    "importance",
    "streak_count",
    "avg_session_mins",
    "hour_of_day",
]

X = df[FEATURES].values
y = df["priority"].values

# drop rows with NaN
mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
X, y = X[mask], y[mask].astype(int)

print(f"\nTraining on {len(X)} samples with {len(FEATURES)} features")
print(f"Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

# ── split ────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── train Random Forest ─────────────────────────────────────────────
print("\nTraining Random Forest...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=3,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,
)
model.fit(X_train, y_train)

# ── evaluate ─────────────────────────────────────────────────────────
train_acc = model.score(X_train, y_train)
test_acc = model.score(X_test, y_test)

print(f"\n  Train accuracy: {train_acc:.3f}")
print(f"  Test accuracy:  {test_acc:.3f}")

# cross-validation
cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
print(f"  5-fold CV:      {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

print(f"\nClassification Report:\n")
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

# ── feature importance ───────────────────────────────────────────────
print("Feature Importance:")
for name, imp in sorted(
    zip(FEATURES, model.feature_importances_), key=lambda x: x[1], reverse=True
):
    bar = "█" * int(imp * 50)
    print(f"  {name:35s} {imp:.4f}  {bar}")

# ── save ─────────────────────────────────────────────────────────────
bundle = {"model": model, "scaler": None}
joblib.dump(bundle, os.path.join(ARTIFACTS, "priority_model_v2.pkl"))
print(f"\n✅ Model saved to artifacts/priority_model_v2.pkl")
