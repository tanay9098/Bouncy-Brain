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

# version 2
# import os
# import pandas as pd
# import numpy as np
# import joblib
# from sklearn.model_selection import train_test_split, cross_val_score
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.metrics import classification_report

# # ── paths ────────────────────────────────────────────────────────────
# DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "adhd.csv")
# ARTIFACTS = os.path.join(os.path.dirname(__file__), "artifacts")

# os.makedirs(ARTIFACTS, exist_ok=True)

# # ── load dataset ─────────────────────────────────────────────────────
# print("Loading dataset...")
# df = pd.read_csv(DATA_PATH)
# print(f"  rows: {len(df)}, columns: {list(df.columns)}")

# # ── encode categoricals ─────────────────────────────────────────────
# energy_map = {"Low": 1, "Medium": 2, "High": 3}
# priority_map = {"Low": 0, "Medium": 1, "High": 2}

# if "energy_required" in df.columns:
#     df["energy_required"] = df["energy_required"].map(energy_map).fillna(2)
# if "energy_at_attempt" in df.columns:
#     df["energy_at_attempt"] = df["energy_at_attempt"].map(energy_map).fillna(2)

# df["priority"] = df["priority"].map(priority_map)

# # ── derive features to match our 10-feature schema ──────────────────
# # We map existing CSV columns → our standard feature names

# # completion_rate: derive from completion_status
# df["is_completed"] = df["completion_status"].isin([
#     "Completed on time", "Completed but late"
# ]).astype(float)
# df["completion_rate"] = df["is_completed"].expanding().mean()

# # similar_task_completion_rate: use rolling mean as proxy
# df["similar_task_completion_rate"] = df["is_completed"].rolling(
#     window=5, min_periods=1
# ).mean()

# # hours_until_deadline
# df["hours_until_deadline"] = df["deadline_days"].astype(float) * 24

# # is_overdue
# df["is_overdue"] = (df["deadline_days"] <= 0).astype(float)

# # deadline_pressure
# df["deadline_pressure"] = df["hours_until_deadline"].apply(
#     lambda h: 3.0 if h < 6 else (2.0 if h < 24 else (1.0 if h < 72 else 0.0))
# )

# # estimated_minutes
# df["estimated_minutes"] = df["estimated_time"].astype(float)

# # importance: derive from urgency_self
# df["importance"] = df["urgency_self"].astype(float).clip(1, 5)

# # streak_count: simulated from rolling completions
# df["streak_count"] = df["is_completed"].groupby(
#     (df["is_completed"] != df["is_completed"].shift()).cumsum()
# ).cumcount() + 1
# df.loc[df["is_completed"] == 0, "streak_count"] = 0

# # avg_session_mins: use estimated_time as proxy (no session data in CSV)
# df["avg_session_mins"] = df["estimated_time"].rolling(
#     window=10, min_periods=1
# ).mean()

# # hour_of_day: generate realistic distribution (most tasks attempted 8am-10pm)
# np.random.seed(42)
# df["hour_of_day"] = np.random.choice(
#     range(8, 22), size=len(df), p=[0.05, 0.08, 0.1, 0.1, 0.08, 0.07,
#                                     0.06, 0.06, 0.08, 0.1, 0.1, 0.05,
#                                     0.04, 0.03]
# ).astype(float)

# # ── feature matrix ──────────────────────────────────────────────────
# FEATURES = [
#     "completion_rate",
#     "similar_task_completion_rate",
#     "hours_until_deadline",
#     "is_overdue",
#     "deadline_pressure",
#     "estimated_minutes",
#     "importance",
#     "streak_count",
#     "avg_session_mins",
#     "hour_of_day",
# ]

# X = df[FEATURES].values
# y = df["priority"].values

# # drop rows with NaN
# mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
# X, y = X[mask], y[mask].astype(int)

# print(f"\nTraining on {len(X)} samples with {len(FEATURES)} features")
# print(f"Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

# # ── split ────────────────────────────────────────────────────────────
# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42, stratify=y
# )

# # ── train Random Forest ─────────────────────────────────────────────
# print("\nTraining Random Forest...")
# model = RandomForestClassifier(
#     n_estimators=100,
#     max_depth=10,
#     min_samples_split=3,
#     random_state=42,
#     class_weight="balanced",
#     n_jobs=-1,
# )
# model.fit(X_train, y_train)

# # ── evaluate ─────────────────────────────────────────────────────────
# train_acc = model.score(X_train, y_train)
# test_acc = model.score(X_test, y_test)

# print(f"\n  Train accuracy: {train_acc:.3f}")
# print(f"  Test accuracy:  {test_acc:.3f}")

# # cross-validation
# cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
# print(f"  5-fold CV:      {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# print(f"\nClassification Report:\n")
# y_pred = model.predict(X_test)
# print(classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

# # ── feature importance ───────────────────────────────────────────────
# print("Feature Importance:")
# for name, imp in sorted(
#     zip(FEATURES, model.feature_importances_), key=lambda x: x[1], reverse=True
# ):
#     bar = "█" * int(imp * 50)
#     print(f"  {name:35s} {imp:.4f}  {bar}")

# # ── save ─────────────────────────────────────────────────────────────
# bundle = {"model": model, "scaler": None}
# joblib.dump(bundle, os.path.join(ARTIFACTS, "priority_model_v2.pkl"))
# print(f"\n✅ Model saved to artifacts/priority_model_v2.pkl")


"""
Bouncy-Brain  –  Base Model Trainer v2 (Random Forest)
======================================================

Trains on the static adhd.csv dataset to create a base model.
Once real user data accumulates, the /train-user endpoint
fine-tunes a per-user model on top of this.

CSV columns:
  task_type, subject_importance, deadline_days, estimated_time,
  difficulty, urgency_self, energy_required, self_reported_procrastination,
  completion_status, actual_time_vs_estimate, energy_at_attempt, priority

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
print(f"\nSample row:\n{df.iloc[0].to_dict()}\n")

# ── encode categoricals ─────────────────────────────────────────────
energy_map = {"Low": 1, "Medium": 2, "High": 3}
priority_map = {"Low": 0, "Medium": 1, "High": 2}
importance_map = {"Optional": 1, "Secondary": 2, "Core": 3}

df["energy_required_num"] = df["energy_required"].map(energy_map).fillna(2)
df["energy_at_attempt_num"] = df["energy_at_attempt"].map(energy_map).fillna(2)
df["subject_importance_num"] = df["subject_importance"].map(importance_map).fillna(2)
df["priority_label"] = df["priority"].map(priority_map)

# ── derive features to match our 10-feature schema ──────────────────
# These 10 features are the SAME ones model.py extracts from real user data
# at prediction time, so training and inference stay aligned.

# 1. completion_rate: expanding mean of whether task was completed
df["is_completed"] = df["completion_status"].isin([
    "Completed on time", "Completed but late"
]).astype(float)
df["completion_rate"] = df["is_completed"].expanding().mean()

# 2. similar_task_completion_rate: rolling mean within task_type groups
df["similar_task_completion_rate"] = (
    df.groupby("task_type")["is_completed"]
    .transform(lambda x: x.expanding().mean())
)

# 3. hours_until_deadline
df["hours_until_deadline"] = df["deadline_days"].astype(float) * 24.0

# 4. is_overdue
df["is_overdue"] = (df["deadline_days"] <= 0).astype(float)

# 5. deadline_pressure (0=relaxed, 1=soon, 2=urgent, 3=critical)
df["deadline_pressure"] = df["hours_until_deadline"].apply(
    lambda h: 3.0 if h < 6 else (2.0 if h < 24 else (1.0 if h < 72 else 0.0))
)

# 6. estimated_minutes
df["estimated_minutes"] = df["estimated_time"].astype(float)

# 7. importance: from subject_importance (Core=3, Secondary=2, Optional=1)
df["importance"] = df["subject_importance_num"].astype(float)

# 8. streak_count: consecutive completions (momentum signal)
df["streak_count"] = 0.0
streak = 0
for i in range(len(df)):
    if df.iloc[i]["is_completed"] == 1.0:
        streak += 1
    else:
        streak = 0
    df.iloc[i, df.columns.get_loc("streak_count")] = float(min(streak, 20))

# 9. avg_session_mins: rolling average of estimated_time as proxy
df["avg_session_mins"] = df["estimated_time"].rolling(
    window=10, min_periods=1
).mean()

# 10. hour_of_day: simulated realistic distribution (8am-10pm)
np.random.seed(42)
hour_probs = [0.05, 0.08, 0.10, 0.10, 0.08, 0.07,
              0.06, 0.06, 0.08, 0.10, 0.10, 0.05, 0.04, 0.03]
df["hour_of_day"] = np.random.choice(
    range(8, 22), size=len(df), p=hour_probs
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
y = df["priority_label"].values

# drop any NaN rows
mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
X, y = X[mask], y[mask].astype(int)

print(f"Training on {len(X)} samples with {len(FEATURES)} features")
print(f"Class distribution: Low={sum(y==0)}, Medium={sum(y==1)}, High={sum(y==2)}")

# ── split ────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"  Train: {len(X_train)}, Test: {len(X_test)}")

# ── train Random Forest ─────────────────────────────────────────────
print("\nTraining Random Forest...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=3,
    random_state=42,
    class_weight="balanced",  # handles imbalanced ADHD data
    n_jobs=-1,
)
model.fit(X_train, y_train)

# ── evaluate ─────────────────────────────────────────────────────────
train_acc = model.score(X_train, y_train)
test_acc = model.score(X_test, y_test)

print(f"\n{'='*50}")
print(f"  Train accuracy: {train_acc:.3f}")
print(f"  Test accuracy:  {test_acc:.3f}")

# cross-validation
cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
print(f"  5-fold CV:      {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
print(f"{'='*50}")

print(f"\nClassification Report:\n")
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

# ── feature importance ───────────────────────────────────────────────
print("\nFeature Importance:")
print("-" * 60)
for name, imp in sorted(
    zip(FEATURES, model.feature_importances_), key=lambda x: x[1], reverse=True
):
    bar = "█" * int(imp * 50)
    print(f"  {name:35s} {imp:.4f}  {bar}")
print("-" * 60)

# ── test predictions on sample tasks ────────────────────────────────
print("\nSample Predictions:")
PRIORITY_MAP = {0: "Low", 1: "Medium", 2: "High"}

sample_tasks = [
    {"desc": "Urgent core assignment due in 4 hours",
     "features": [0.7, 0.8, 4, 0, 3.0, 60, 3.0, 5, 45, 10]},
    {"desc": "Optional reading due in 2 weeks",
     "features": [0.5, 0.6, 336, 0, 0.0, 30, 1.0, 2, 30, 14]},
    {"desc": "Secondary project due in 2 days",
     "features": [0.6, 0.5, 48, 0, 1.0, 90, 2.0, 3, 60, 11]},
    {"desc": "Overdue core exam prep",
     "features": [0.3, 0.4, -12, 1, 3.0, 120, 3.0, 0, 90, 9]},
]

for s in sample_tasks:
    f = np.array([s["features"]])
    pred = model.predict(f)[0]
    proba = model.predict_proba(f)[0]
    score = float(proba[2]) * 1.0 + float(proba[1]) * 0.5
    rec = "do_now" if score > 0.7 else ("schedule_soon" if score > 0.4 else "break_into_chunks")
    print(f"  {s['desc']}")
    print(f"    -> Priority: {PRIORITY_MAP[pred]}, Score: {score:.3f}")
    print(f"       Probabilities: Low={proba[0]:.2f} Med={proba[1]:.2f} High={proba[2]:.2f}")
    print(f"       Recommendation: {rec}")
    print()

# ── save ─────────────────────────────────────────────────────────────
bundle = {"model": model, "scaler": None}
output_path = os.path.join(ARTIFACTS, "priority_model_v2.pkl")
joblib.dump(bundle, output_path)

print(f"✅ Model saved to {output_path}")
print(f"   File size: {os.path.getsize(output_path) / 1024:.1f} KB")