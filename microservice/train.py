import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# Load dataset
df = pd.read_csv("data/adhd.csv")

# Encode categorical
energy_map = {"Low": 1, "Medium": 2, "High": 3}
priority_map = {"Low": 0, "Medium": 1, "High": 2}

df["energy_required"] = df["energy_required"].map(energy_map)
df["energy_at_attempt"] = df["energy_at_attempt"].map(energy_map)
df["priority"] = df["priority"].map(priority_map)

# Derived features
df["energy_mismatch"] = (df["energy_required"] - df["energy_at_attempt"]).clip(lower=0)
df["is_delayed"] = df["completion_status"].isin([
    "Completed but late", "Started but not completed", "Did not start"
]).astype(int)

df["historical_procrastination_rate"] = df["is_delayed"].expanding().mean()

FEATURES = [
    "deadline_days",
    "estimated_time",
    "difficulty",
    "urgency_self",
    "self_reported_procrastination",
    "energy_mismatch",
    "historical_procrastination_rate"
]

X = df[FEATURES]
y = df["priority"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)

# Train model
model = LogisticRegression(max_iter=500)
model.fit(X_train, y_train)

# Save artifacts
joblib.dump(model, "artifacts/priority_model.pkl")
joblib.dump(scaler, "artifacts/scaler.pkl")

print("✅ Model trained and saved")
