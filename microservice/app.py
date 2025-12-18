from flask import Flask, request, jsonify
from flask_cors import CORS
from model import predict_priority

app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})

@app.route("/predict-priority", methods=["POST"])
def predict():
    data = request.json

    required = [
        "deadline_days",
        "estimated_time",
        "difficulty",
        "urgency_self",
        "self_reported_procrastination",
        "energy_mismatch",
        "historical_procrastination_rate"
    ]

    for r in required:
        if r not in data:
            return jsonify({"error": f"Missing field {r}"}), 400

    priority = predict_priority(data)

    return jsonify({
        "priority": priority
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
