"""Disease inference wrapper. Returns an explicit 'unavailable' state unless a trained checkpoint is configured.
No predictions are ever invented. EfficientNet/MobileNet training is NOT implemented yet - see docs/STATUS.md."""
import os
CONFIDENCE_THRESHOLD = 0.70   # planned rejection rule; softmax is not a calibrated probability

def analyze(image_bytes: bytes, crop: str | None = None) -> dict:
    path = os.getenv("DISEASE_MODEL_PATH", "")
    if not path or not os.path.exists(path):
        return {"status": "model_unavailable", "message": "Disease model unavailable. No trained model is configured.",
                "advice": "Consult a local agricultural officer or KVK for diagnosis."}
    return {"status": "not_implemented", "message": "Checkpoint found but inference loader is not implemented yet."}
