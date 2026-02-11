# /*from flask import Flask, request, jsonify
# from flask_cors import CORS
# from model import predict_priority

# app = Flask(__name__)
# CORS(app)

# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({"ok": True})

# @app.route("/predict-priority", methods=["POST"])
# def predict():
#     data = request.json

#     required = [
#         "deadline_days",
#         "estimated_time",
#         "difficulty",
#         "urgency_self",
#         "self_reported_procrastination",
#         "energy_mismatch",
#         "historical_procrastination_rate"
#     ]

#     for r in required:
#         if r not in data:
#             return jsonify({"error": f"Missing field {r}"}), 400

#     priority = predict_priority(data)

#     return jsonify({
#         "priority": priority
#     })

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5001, debug=True)*/

#this is version 2 
# """
# Bouncy-Brain ML Microservice  –  v2 (Random Forest)
# ====================================================
# Upgraded from Logistic Regression to Random Forest.

# Endpoints
# ---------
# POST /predict-priority   – rank ONE task   (backward-compatible)
# POST /recommend          – rank ALL tasks with user history
# POST /train-user         – retrain / fine-tune on a user's real data
# GET  /health             – liveness check
# """

# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from model import (
#     predict_priority,
#     recommend_tasks,
#     train_on_user_data,
#     get_feature_importance,
# )

# app = Flask(__name__)
# CORS(app)


# # ── health ───────────────────────────────────────────────────────────
# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({"ok": True, "model": "RandomForest-v2"})


# # ── legacy single-task endpoint (backward compatible) ────────────────
# @app.route("/predict-priority", methods=["POST"])
# def predict():
#     """
#     Accepts the SAME payload your current priority.js sends,
#     but now also accepts enriched data from the upgraded route.
#     """
#     data = request.json or {}

#     # ── enriched payload (new) ──────────────────────────────────────
#     if "completion_rate" in data:
#         priority, score, recommendation = predict_priority(data, enriched=True)
#         return jsonify({
#             "priority": priority,
#             "score": round(score, 3),
#             "recommendation": recommendation,
#         })

#     # ── legacy payload (old 7-field format) ─────────────────────────
#     legacy_fields = [
#         "deadline_days",
#         "estimated_time",
#         "difficulty",
#         "urgency_self",
#         "self_reported_procrastination",
#         "energy_mismatch",
#         "historical_procrastination_rate",
#     ]
#     for f in legacy_fields:
#         if f not in data:
#             return jsonify({"error": f"Missing field {f}"}), 400

#     priority, score, recommendation = predict_priority(data, enriched=False)
#     return jsonify({
#         "priority": priority,
#         "score": round(score, 3),
#         "recommendation": recommendation,
#     })


# # ── batch recommendation (new) ──────────────────────────────────────
# @app.route("/recommend", methods=["POST"])
# def recommend():
#     """
#     Accepts:
#     {
#       "tasks": [ { task fields ... }, ... ],
#       "history": {
#         "completed_tasks": [...],
#         "sessions": [...]
#       }
#     }
#     Returns tasks ranked by predicted success probability.
#     """
#     data = request.json or {}
#     tasks = data.get("tasks", [])
#     history = data.get("history", {})

#     if not tasks:
#         return jsonify({"tasks": [], "feature_importance": {}})

#     ranked = recommend_tasks(tasks, history)
#     importance = get_feature_importance()

#     return jsonify({
#         "tasks": ranked,
#         "feature_importance": importance,
#     })


# # ── per-user training (new) ─────────────────────────────────────────
# @app.route("/train-user", methods=["POST"])
# def train_user():
#     """
#     Accepts:
#     {
#       "userId": "...",
#       "completed_tasks": [...],
#       "sessions": [...]
#     }
#     Retrains the model with this user's real data blended with
#     the base dataset.
#     """
#     data = request.json or {}
#     user_id = data.get("userId", "global")
#     completed = data.get("completed_tasks", [])
#     sessions = data.get("sessions", [])

#     if len(completed) < 5:
#         return jsonify({
#             "status": "skipped",
#             "reason": "Need at least 5 completed tasks to train",
#         })

#     metrics = train_on_user_data(user_id, completed, sessions)
#     return jsonify({"status": "trained", **metrics})


# # ── run ──────────────────────────────────────────────────────────────
# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5001, debug=True)



"""
Bouncy-Brain ML Microservice  –  v2 (Random Forest)
====================================================
Upgraded from Logistic Regression to Random Forest.

Endpoints
---------
POST /predict-priority   – rank ONE task   (backward-compatible)
POST /recommend          – rank ALL tasks with user history
POST /train-user         – retrain / fine-tune on a user's real data
GET  /health             – liveness check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from model import (
    predict_priority,
    recommend_tasks,
    train_on_user_data,
    get_feature_importance,
)

app = Flask(__name__)
CORS(app)


# ── health ───────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "model": "RandomForest-v2"})


# ── legacy single-task endpoint (backward compatible) ────────────────
@app.route("/predict-priority", methods=["POST"])
def predict():
    """
    Accepts the SAME payload your current priority.js sends,
    but now also accepts enriched data from the upgraded route.
    """
    data = request.json or {}

    # ── enriched payload (new) ──────────────────────────────────────
    if "completion_rate" in data:
        priority, score, recommendation = predict_priority(data, enriched=True)
        return jsonify({
            "priority": priority,
            "score": round(score, 3),
            "recommendation": recommendation,
        })

    # ── legacy payload (old 7-field format) ─────────────────────────
    legacy_fields = [
        "deadline_days",
        "estimated_time",
        "difficulty",
        "urgency_self",
        "self_reported_procrastination",
        "energy_mismatch",
        "historical_procrastination_rate",
    ]
    for f in legacy_fields:
        if f not in data:
            return jsonify({"error": f"Missing field {f}"}), 400

    priority, score, recommendation = predict_priority(data, enriched=False)
    return jsonify({
        "priority": priority,
        "score": round(score, 3),
        "recommendation": recommendation,
    })


# ── batch recommendation (new) ──────────────────────────────────────
@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Accepts:
    {
      "tasks": [ { task fields ... }, ... ],
      "history": {
        "completed_tasks": [...],
        "sessions": [...]
      }
    }
    Returns tasks ranked by predicted success probability.
    """
    data = request.json or {}
    tasks = data.get("tasks", [])
    history = data.get("history", {})

    if not tasks:
        return jsonify({"tasks": [], "feature_importance": {}})

    ranked = recommend_tasks(tasks, history)
    importance = get_feature_importance()

    return jsonify({
        "tasks": ranked,
        "feature_importance": importance,
    })


# ── per-user training (new) ─────────────────────────────────────────
@app.route("/train-user", methods=["POST"])
def train_user():
    """
    Accepts:
    {
      "userId": "...",
      "completed_tasks": [...],
      "sessions": [...]
    }
    Retrains the model with this user's real data blended with
    the base dataset.
    """
    data = request.json or {}
    user_id = data.get("userId", "global")
    completed = data.get("completed_tasks", [])
    sessions = data.get("sessions", [])

    if len(completed) < 5:
        return jsonify({
            "status": "skipped",
            "reason": "Need at least 5 completed tasks to train",
        })

    metrics = train_on_user_data(user_id, completed, sessions)
    return jsonify({"status": "trained", **metrics})


# ── run ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)