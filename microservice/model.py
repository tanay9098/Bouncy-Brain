# import joblib
# import numpy as np

# model = joblib.load("artifacts/priority_model.pkl")
# scaler = joblib.load("artifacts/scaler.pkl")

# PRIORITY_MAP = {0: "Low", 1: "Medium", 2: "High"}

# def predict_priority(payload):
#     features = np.array([[
#         payload["deadline_days"],
#         payload["estimated_time"],
#         payload["difficulty"],
#         payload["urgency_self"],
#         payload["self_reported_procrastination"],
#         payload["energy_mismatch"],
#         payload["historical_procrastination_rate"]
#     ]])

#     features = scaler.transform(features)
#     pred = model.predict(features)[0]

#     return PRIORITY_MAP[pred]

# version 2


# """
# Bouncy-Brain ML Model  –  v2 (Random Forest)
# =============================================

# Key upgrades over v1 (Logistic Regression):
#   • Random Forest instead of Logistic Regression
#   • Real user-history features (completion rate, streaks, patterns)
#   • Cold-start rule-based fallback for new users
#   • Probability scores + ADHD-friendly recommendation labels
#   • Feature-importance introspection
# """

# import os, joblib, math
# import numpy as np
# from datetime import datetime, timezone

# # ── paths ────────────────────────────────────────────────────────────
# ARTIFACTS = os.path.join(os.path.dirname(__file__), "artifacts")
# MODEL_PATH = os.path.join(ARTIFACTS, "priority_model_v2.pkl")
# SCALER_PATH = os.path.join(ARTIFACTS, "scaler_v2.pkl")
# LEGACY_MODEL = os.path.join(ARTIFACTS, "priority_model.pkl")
# LEGACY_SCALER = os.path.join(ARTIFACTS, "scaler.pkl")

# PRIORITY_MAP = {0: "Low", 1: "Medium", 2: "High"}
# FEATURE_NAMES = [
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


# # ── load model (v2 → v1 fallback → cold-start) ─────────────────────
# def _load_model():
#     """Try loading v2 model, fall back to v1 legacy, or return None."""
#     if os.path.exists(MODEL_PATH):
#         bundle = joblib.load(MODEL_PATH)
#         return bundle["model"], bundle.get("scaler"), "v2"

#     # fall back to legacy v1 (Logistic Regression)
#     if os.path.exists(LEGACY_MODEL) and os.path.exists(LEGACY_SCALER):
#         model = joblib.load(LEGACY_MODEL)
#         scaler = joblib.load(LEGACY_SCALER)
#         return model, scaler, "v1"

#     return None, None, "cold-start"


# _model, _scaler, _version = _load_model()


# def _reload():
#     global _model, _scaler, _version
#     _model, _scaler, _version = _load_model()


# # ── feature extraction ───────────────────────────────────────────────
# def _extract_enriched_features(task: dict, history: dict = None) -> list:
#     """
#     Build the 10-feature vector from enriched task + user history.
#     """
#     now = datetime.now(timezone.utc)
#     history = history or {}

#     # completion rate (overall)
#     completed_tasks = history.get("completed_tasks", [])
#     total = history.get("total_tasks", max(len(completed_tasks), 1))
#     completion_rate = len(completed_tasks) / max(total, 1)

#     # similar task completion rate (by rough title keyword match)
#     task_title = (task.get("title") or "").lower()
#     similar = [
#         t for t in completed_tasks
#         if _title_similarity(t.get("title", ""), task_title)
#     ]
#     similar_rate = len(similar) / max(len(completed_tasks), 1) if completed_tasks else 0.5

#     # deadline features
#     due_at = task.get("dueAt") or task.get("due_at")
#     if due_at:
#         if isinstance(due_at, str):
#             try:
#                 due_dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
#             except ValueError:
#                 due_dt = now
#         else:
#             due_dt = due_at
#         hours_until = (due_dt - now).total_seconds() / 3600
#     else:
#         hours_until = 168  # default: 1 week away

#     is_overdue = 1.0 if hours_until < 0 else 0.0
#     deadline_pressure = (
#         3.0 if hours_until < 6 else
#         2.0 if hours_until < 24 else
#         1.0 if hours_until < 72 else
#         0.0
#     )

#     # task nature
#     estimated_minutes = float(task.get("estimateMins") or task.get("estimated_time") or 30)
#     importance = float(task.get("importance", 1))

#     # streak (consecutive completed tasks in recent history)
#     streak = _compute_streak(completed_tasks)

#     # average session duration
#     sessions = history.get("sessions", [])
#     avg_session = (
#         sum(s.get("durationMins", 25) for s in sessions) / len(sessions)
#         if sessions else 25.0
#     )

#     # hour of day (productivity pattern signal)
#     hour_of_day = float(now.hour)

#     return [
#         completion_rate,
#         similar_rate,
#         max(hours_until, -48),  # clip extreme overdue
#         is_overdue,
#         deadline_pressure,
#         estimated_minutes,
#         importance,
#         float(streak),
#         avg_session,
#         hour_of_day,
#     ]


# def _title_similarity(title_a: str, title_b: str) -> bool:
#     """Simple keyword overlap check for 'similar task' detection."""
#     words_a = set(title_a.lower().split())
#     words_b = set(title_b.lower().split())
#     # remove very common words
#     stopwords = {"a", "an", "the", "to", "of", "and", "in", "for", "my", "is", "it", "—", "-", "part"}
#     words_a -= stopwords
#     words_b -= stopwords
#     if not words_a or not words_b:
#         return False
#     overlap = words_a & words_b
#     return len(overlap) >= 1


# def _compute_streak(completed_tasks: list) -> int:
#     """Count consecutive recently-completed tasks (momentum signal)."""
#     if not completed_tasks:
#         return 0
#     # sort by completedAt descending
#     sorted_tasks = sorted(
#         completed_tasks,
#         key=lambda t: t.get("completedAt", ""),
#         reverse=True,
#     )
#     streak = 0
#     for t in sorted_tasks:
#         if t.get("completed") or t.get("completedAt"):
#             streak += 1
#         else:
#             break
#     return min(streak, 20)  # cap at 20


# def _legacy_features(data: dict) -> list:
#     """Extract the 7 features used by v1 Logistic Regression."""
#     return [
#         float(data["deadline_days"]),
#         float(data["estimated_time"]),
#         float(data["difficulty"]),
#         float(data["urgency_self"]),
#         float(data["self_reported_procrastination"]),
#         float(data["energy_mismatch"]),
#         float(data["historical_procrastination_rate"]),
#     ]


# # ── cold-start heuristic ────────────────────────────────────────────
# def _cold_start_score(task: dict) -> tuple:
#     """
#     Rule-based scoring for users with no training data.
#     Returns (priority_label, score, recommendation).
#     """
#     score = 0.5  # base

#     due_at = task.get("dueAt") or task.get("due_at")
#     if due_at:
#         try:
#             if isinstance(due_at, str):
#                 due_dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
#             else:
#                 due_dt = due_at
#             hours_left = (due_dt - datetime.now(timezone.utc)).total_seconds() / 3600
#         except Exception:
#             hours_left = 168
#     else:
#         hours_left = 168

#     # deadline urgency
#     if hours_left < 6:
#         score += 0.3
#     elif hours_left < 24:
#         score += 0.2
#     elif hours_left < 72:
#         score += 0.1

#     # prefer shorter tasks (ADHD: easy wins build momentum)
#     est = float(task.get("estimateMins") or task.get("estimated_time") or 30)
#     if est <= 15:
#         score += 0.15
#     elif est <= 30:
#         score += 0.05

#     # importance boost
#     imp = float(task.get("importance", 1))
#     if imp >= 3:
#         score += 0.1

#     score = min(score, 1.0)

#     if score > 0.7:
#         priority, rec = "High", "do_now"
#     elif score > 0.4:
#         priority, rec = "Medium", "schedule_soon"
#     else:
#         priority, rec = "Low", "break_into_chunks"

#     return priority, score, rec


# # ── prediction ───────────────────────────────────────────────────────
# def predict_priority(data: dict, enriched: bool = False) -> tuple:
#     """
#     Returns (priority_label, score, recommendation).
#     """
#     global _model, _scaler, _version

#     # cold-start fallback
#     if _model is None or _version == "cold-start":
#         return _cold_start_score(data)

#     try:
#         if enriched and _version == "v2":
#             features = np.array([_extract_enriched_features(data, data.get("history", {}))])
#         elif _version == "v1":
#             features = np.array([_legacy_features(data)])
#             features = _scaler.transform(features)
#         else:
#             # v2 model but legacy payload → adapt
#             features = np.array([_extract_enriched_features(data)])

#         # get probability scores
#         if hasattr(_model, "predict_proba"):
#             probas = _model.predict_proba(features)[0]
#             pred = int(np.argmax(probas))
#             # weighted score: higher = more urgent
#             score = float(probas[2]) * 1.0 + float(probas[1]) * 0.5
#         else:
#             pred = int(_model.predict(features)[0])
#             score = {0: 0.2, 1: 0.5, 2: 0.85}.get(pred, 0.5)

#         priority = PRIORITY_MAP.get(pred, "Medium")
#         if score > 0.7:
#             rec = "do_now"
#         elif score > 0.4:
#             rec = "schedule_soon"
#         else:
#             rec = "break_into_chunks"

#         return priority, score, rec

#     except Exception as e:
#         print(f"[model] prediction error: {e}")
#         return _cold_start_score(data)


# # ── batch recommendation ────────────────────────────────────────────
# def recommend_tasks(tasks: list, history: dict) -> list:
#     """
#     Score and rank all pending tasks using user history.
#     Returns list of tasks with priority_score, priority, recommendation.
#     """
#     results = []

#     for task in tasks:
#         task_with_history = {**task, "history": history}
#         priority, score, rec = predict_priority(task_with_history, enriched=True)
#         results.append({
#             **task,
#             "aiPriority": priority,
#             "priority_score": round(score, 3),
#             "recommendation": rec,
#         })

#     # sort: highest score first
#     results.sort(key=lambda x: x["priority_score"], reverse=True)
#     return results


# # ── feature importance ───────────────────────────────────────────────
# def get_feature_importance() -> dict:
#     """Return feature importance from the trained Random Forest."""
#     if _model is None or not hasattr(_model, "feature_importances_"):
#         return {}
#     return dict(zip(FEATURE_NAMES, [round(float(v), 4) for v in _model.feature_importances_]))


# # ── training on real user data ───────────────────────────────────────
# def train_on_user_data(user_id: str, completed_tasks: list, sessions: list) -> dict:
#     """
#     Train a Random Forest on real completed task data.
    
#     Label logic:
#       - completed on time → 2 (High — user can handle these)
#       - completed late     → 1 (Medium — needs more structure)
#       - not completed      → 0 (Low — should be chunked/deferred)
#     """
#     from sklearn.ensemble import RandomForestClassifier
#     from sklearn.model_selection import train_test_split

#     X, y = [], []

#     history = {
#         "completed_tasks": completed_tasks,
#         "total_tasks": len(completed_tasks),
#         "sessions": sessions,
#     }

#     for task in completed_tasks:
#         features = _extract_enriched_features(task, history)

#         # determine label
#         completed_at = task.get("completedAt")
#         due_at = task.get("dueAt") or task.get("due_at")

#         if completed_at and due_at:
#             try:
#                 c_dt = datetime.fromisoformat(str(completed_at).replace("Z", "+00:00"))
#                 d_dt = datetime.fromisoformat(str(due_at).replace("Z", "+00:00"))
#                 if c_dt <= d_dt:
#                     label = 2  # completed on time → High priority tasks user handles well
#                 else:
#                     label = 1  # completed late → Medium
#             except Exception:
#                 label = 1
#         elif completed_at:
#             label = 2  # completed (no deadline) → assume good
#         else:
#             label = 0  # not completed → Low

#         X.append(features)
#         y.append(label)

#     X = np.array(X)
#     y = np.array(y)

#     # need at least 2 classes to train
#     if len(set(y)) < 2:
#         return {"status": "skipped", "reason": "Not enough class diversity"}

#     # train
#     model = RandomForestClassifier(
#         n_estimators=100,
#         max_depth=10,
#         min_samples_split=3,
#         random_state=42,
#         class_weight="balanced",  # handle imbalanced ADHD completion data
#     )

#     # split if enough data, otherwise train on all
#     if len(X) >= 10:
#         X_train, X_test, y_train, y_test = train_test_split(
#             X, y, test_size=0.2, random_state=42
#         )
#         model.fit(X_train, y_train)
#         accuracy = round(float(model.score(X_test, y_test)), 3)
#     else:
#         model.fit(X, y)
#         accuracy = round(float(model.score(X, y)), 3)

#     # save
#     os.makedirs(ARTIFACTS, exist_ok=True)
#     joblib.dump({"model": model, "scaler": None}, MODEL_PATH)

#     # reload globally
#     _reload()

#     return {
#         "accuracy": accuracy,
#         "samples": len(X),
#         "features": FEATURE_NAMES,
#         "importance": get_feature_importance(),
#     }



"""
Bouncy-Brain ML Model  –  v2 (Random Forest)
=============================================

Key upgrades over v1 (Logistic Regression):
  • Random Forest instead of Logistic Regression
  • Real user-history features (completion rate, streaks, patterns)
  • Cold-start rule-based fallback for new users
  • Probability scores + ADHD-friendly recommendation labels
  • Feature-importance introspection
"""

import os, joblib, math
import numpy as np
from datetime import datetime, timezone

# ── paths ────────────────────────────────────────────────────────────
ARTIFACTS = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS, "priority_model_v2.pkl")
SCALER_PATH = os.path.join(ARTIFACTS, "scaler_v2.pkl")
LEGACY_MODEL = os.path.join(ARTIFACTS, "priority_model.pkl")
LEGACY_SCALER = os.path.join(ARTIFACTS, "scaler.pkl")

PRIORITY_MAP = {0: "Low", 1: "Medium", 2: "High"}
FEATURE_NAMES = [
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


# ── load model (v2 → v1 fallback → cold-start) ─────────────────────
def _load_model():
    """Try loading v2 model, fall back to v1 legacy, or return None."""
    if os.path.exists(MODEL_PATH):
        bundle = joblib.load(MODEL_PATH)
        return bundle["model"], bundle.get("scaler"), "v2"

    # fall back to legacy v1 (Logistic Regression)
    if os.path.exists(LEGACY_MODEL) and os.path.exists(LEGACY_SCALER):
        model = joblib.load(LEGACY_MODEL)
        scaler = joblib.load(LEGACY_SCALER)
        return model, scaler, "v1"

    return None, None, "cold-start"


_model, _scaler, _version = _load_model()


def _reload():
    global _model, _scaler, _version
    _model, _scaler, _version = _load_model()


# ── feature extraction ───────────────────────────────────────────────
def _extract_enriched_features(task: dict, history: dict = None) -> list:
    """
    Build the 10-feature vector from enriched task + user history.
    """
    now = datetime.now(timezone.utc)
    history = history or {}

    # completion rate (overall)
    completed_tasks = history.get("completed_tasks", [])
    total = history.get("total_tasks", max(len(completed_tasks), 1))
    completion_rate = len(completed_tasks) / max(total, 1)

    # similar task completion rate (by rough title keyword match)
    task_title = (task.get("title") or "").lower()
    similar = [
        t for t in completed_tasks
        if _title_similarity(t.get("title", ""), task_title)
    ]
    similar_rate = len(similar) / max(len(completed_tasks), 1) if completed_tasks else 0.5

    # deadline features
    due_at = task.get("dueAt") or task.get("due_at")
    if due_at:
        if isinstance(due_at, str):
            try:
                due_dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
            except ValueError:
                due_dt = now
        else:
            due_dt = due_at
        hours_until = (due_dt - now).total_seconds() / 3600
    else:
        hours_until = 168  # default: 1 week away

    is_overdue = 1.0 if hours_until < 0 else 0.0
    deadline_pressure = (
        3.0 if hours_until < 6 else
        2.0 if hours_until < 24 else
        1.0 if hours_until < 72 else
        0.0
    )

    # task nature
    estimated_minutes = float(task.get("estimateMins") or task.get("estimated_time") or 30)
    importance = float(task.get("importance", 1))

    # streak (consecutive completed tasks in recent history)
    streak = _compute_streak(completed_tasks)

    # average session duration
    sessions = history.get("sessions", [])
    avg_session = (
        sum(s.get("durationMins", 25) for s in sessions) / len(sessions)
        if sessions else 25.0
    )

    # hour of day (productivity pattern signal)
    hour_of_day = float(now.hour)

    return [
        completion_rate,
        similar_rate,
        max(hours_until, -48),  # clip extreme overdue
        is_overdue,
        deadline_pressure,
        estimated_minutes,
        importance,
        float(streak),
        avg_session,
        hour_of_day,
    ]


def _title_similarity(title_a: str, title_b: str) -> bool:
    """Simple keyword overlap check for 'similar task' detection."""
    words_a = set(title_a.lower().split())
    words_b = set(title_b.lower().split())
    # remove very common words
    stopwords = {"a", "an", "the", "to", "of", "and", "in", "for", "my", "is", "it", "—", "-", "part"}
    words_a -= stopwords
    words_b -= stopwords
    if not words_a or not words_b:
        return False
    overlap = words_a & words_b
    return len(overlap) >= 1


def _compute_streak(completed_tasks: list) -> int:
    """Count consecutive recently-completed tasks (momentum signal)."""
    if not completed_tasks:
        return 0
    # sort by completedAt descending
    sorted_tasks = sorted(
        completed_tasks,
        key=lambda t: t.get("completedAt", ""),
        reverse=True,
    )
    streak = 0
    for t in sorted_tasks:
        if t.get("completed") or t.get("completedAt"):
            streak += 1
        else:
            break
    return min(streak, 20)  # cap at 20


def _legacy_features(data: dict) -> list:
    """Extract the 7 features used by v1 Logistic Regression."""
    return [
        float(data["deadline_days"]),
        float(data["estimated_time"]),
        float(data["difficulty"]),
        float(data["urgency_self"]),
        float(data["self_reported_procrastination"]),
        float(data["energy_mismatch"]),
        float(data["historical_procrastination_rate"]),
    ]


# ── cold-start heuristic ────────────────────────────────────────────
def _cold_start_score(task: dict) -> tuple:
    """
    Rule-based scoring for users with no training data.
    Returns (priority_label, score, recommendation).
    """
    score = 0.5  # base

    due_at = task.get("dueAt") or task.get("due_at")
    if due_at:
        try:
            if isinstance(due_at, str):
                due_dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
            else:
                due_dt = due_at
            hours_left = (due_dt - datetime.now(timezone.utc)).total_seconds() / 3600
        except Exception:
            hours_left = 168
    else:
        hours_left = 168

    # deadline urgency
    if hours_left < 6:
        score += 0.3
    elif hours_left < 24:
        score += 0.2
    elif hours_left < 72:
        score += 0.1

    # prefer shorter tasks (ADHD: easy wins build momentum)
    est = float(task.get("estimateMins") or task.get("estimated_time") or 30)
    if est <= 15:
        score += 0.15
    elif est <= 30:
        score += 0.05

    # importance boost
    imp = float(task.get("importance", 1))
    if imp >= 3:
        score += 0.1

    score = min(score, 1.0)

    if score > 0.7:
        priority, rec = "High", "do_now"
    elif score > 0.4:
        priority, rec = "Medium", "schedule_soon"
    else:
        priority, rec = "Low", "break_into_chunks"

    return priority, score, rec


# ── prediction ───────────────────────────────────────────────────────
def predict_priority(data: dict, enriched: bool = False) -> tuple:
    """
    Returns (priority_label, score, recommendation).
    """
    global _model, _scaler, _version

    # cold-start fallback
    if _model is None or _version == "cold-start":
        return _cold_start_score(data)

    try:
        if enriched and _version == "v2":
            features = np.array([_extract_enriched_features(data, data.get("history", {}))])
        elif _version == "v1":
            features = np.array([_legacy_features(data)])
            features = _scaler.transform(features)
        else:
            # v2 model but legacy payload → adapt
            features = np.array([_extract_enriched_features(data)])

        # get probability scores
        if hasattr(_model, "predict_proba"):
            probas = _model.predict_proba(features)[0]
            pred = int(np.argmax(probas))
            # weighted score: higher = more urgent
            score = float(probas[2]) * 1.0 + float(probas[1]) * 0.5
        else:
            pred = int(_model.predict(features)[0])
            score = {0: 0.2, 1: 0.5, 2: 0.85}.get(pred, 0.5)

        priority = PRIORITY_MAP.get(pred, "Medium")
        if score > 0.7:
            rec = "do_now"
        elif score > 0.4:
            rec = "schedule_soon"
        else:
            rec = "break_into_chunks"

        return priority, score, rec

    except Exception as e:
        print(f"[model] prediction error: {e}")
        return _cold_start_score(data)


# ── batch recommendation ────────────────────────────────────────────
def recommend_tasks(tasks: list, history: dict) -> list:
    """
    Score and rank all pending tasks using user history.
    Returns list of tasks with priority_score, priority, recommendation.
    """
    results = []

    for task in tasks:
        task_with_history = {**task, "history": history}
        priority, score, rec = predict_priority(task_with_history, enriched=True)
        results.append({
            **task,
            "aiPriority": priority,
            "priority_score": round(score, 3),
            "recommendation": rec,
        })

    # sort: highest score first
    results.sort(key=lambda x: x["priority_score"], reverse=True)
    return results


# ── feature importance ───────────────────────────────────────────────
def get_feature_importance() -> dict:
    """Return feature importance from the trained Random Forest."""
    if _model is None or not hasattr(_model, "feature_importances_"):
        return {}
    return dict(zip(FEATURE_NAMES, [round(float(v), 4) for v in _model.feature_importances_]))


# ── training on real user data ───────────────────────────────────────
def train_on_user_data(user_id: str, completed_tasks: list, sessions: list) -> dict:
    """
    Train a Random Forest on real completed task data.
    
    Label logic:
      - completed on time → 2 (High — user can handle these)
      - completed late     → 1 (Medium — needs more structure)
      - not completed      → 0 (Low — should be chunked/deferred)
    """
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split

    X, y = [], []

    history = {
        "completed_tasks": completed_tasks,
        "total_tasks": len(completed_tasks),
        "sessions": sessions,
    }

    for task in completed_tasks:
        features = _extract_enriched_features(task, history)

        # determine label
        completed_at = task.get("completedAt")
        due_at = task.get("dueAt") or task.get("due_at")

        if completed_at and due_at:
            try:
                c_dt = datetime.fromisoformat(str(completed_at).replace("Z", "+00:00"))
                d_dt = datetime.fromisoformat(str(due_at).replace("Z", "+00:00"))
                if c_dt <= d_dt:
                    label = 2  # completed on time → High priority tasks user handles well
                else:
                    label = 1  # completed late → Medium
            except Exception:
                label = 1
        elif completed_at:
            label = 2  # completed (no deadline) → assume good
        else:
            label = 0  # not completed → Low

        X.append(features)
        y.append(label)

    X = np.array(X)
    y = np.array(y)

    # need at least 2 classes to train
    if len(set(y)) < 2:
        return {"status": "skipped", "reason": "Not enough class diversity"}

    # train
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=3,
        random_state=42,
        class_weight="balanced",  # handle imbalanced ADHD completion data
    )

    # split if enough data, otherwise train on all
    if len(X) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        model.fit(X_train, y_train)
        accuracy = round(float(model.score(X_test, y_test)), 3)
    else:
        model.fit(X, y)
        accuracy = round(float(model.score(X, y)), 3)

    # save
    os.makedirs(ARTIFACTS, exist_ok=True)
    joblib.dump({"model": model, "scaler": None}, MODEL_PATH)

    # reload globally
    _reload()

    return {
        "accuracy": accuracy,
        "samples": len(X),
        "features": FEATURE_NAMES,
        "importance": get_feature_importance(),
    }