"""Disease inference wrapper.
This prototype provides a deterministic demo result whenever no trained checkpoint is configured.
It is intentionally transparent about being a heuristic and not a clinical diagnosis.
"""
import hashlib
import os

CONFIDENCE_THRESHOLD = 0.70


def _demo_disease(crop: str | None) -> tuple[str, str, float, str]:
    crop_name = (crop or "crop").strip().lower()
    crop_map = {
        "tomato": ["Early blight", "Leaf spot", "Healthy"],
        "chilli": ["Anthracnose", "Leaf curl", "Healthy"],
        "maize": ["Leaf blight", "Rust", "Healthy"],
        "onion": ["Downy mildew", "Purple blotch", "Healthy"],
        "rice": ["Brown spot", "Blast", "Healthy"],
        "wheat": ["Rust", "Leaf blotch", "Healthy"],
    }
    disease_choices = crop_map.get(crop_name, ["Leaf spot", "Rust", "Healthy"])
    return disease_choices[0], disease_choices[1], disease_choices[2]


def analyze(image_bytes: bytes, crop: str | None = None) -> dict:
    path = os.getenv("DISEASE_MODEL_PATH", "")
    if path and os.path.exists(path):
        return {"status": "not_implemented", "message": "Checkpoint found but inference loader is not implemented yet."}

    digest = hashlib.sha256(image_bytes).hexdigest()
    score = int(digest[:8], 16) % 100
    disease_name, alt_name, healthy_label = _demo_disease(crop)

    if score >= 55:
        status = "healthy"
        disease = healthy_label
        confidence = round(0.58 + (score / 100) * 0.3, 2)
        message = "Demo check suggests the crop looks healthy in this prototype view."
        advice = "Continue to monitor leaf colour and moisture, and check with a local agronomist if symptoms develop."
    else:
        status = "disease_detected"
        disease = disease_name
        confidence = round(0.62 + ((100 - score) / 100) * 0.28, 2)
        message = f"Demo check indicates possible {disease_name} for {crop or 'this crop'}."
        advice = "Inspect the affected leaves, reduce moisture stress, and consult a local agricultural officer for confirmation."

    return {
        "status": status,
        "crop": crop or "crop",
        "disease": disease,
        "confidence": confidence,
        "message": message,
        "advice": advice,
        "demo": True,
        "disclaimer": "This is a prototype heuristic for demo use only, not a medical or agronomic diagnosis."
    }
