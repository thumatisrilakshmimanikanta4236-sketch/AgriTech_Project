import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
from fastapi.testclient import TestClient
from app.main import app
c = TestClient(app)
GOOD = dict(full_name="Test", email="t@example.com", password="Passw0rd!", confirm_password="Passw0rd!", accept_terms=True)
def test_health(): assert c.get("/api/health").json()["status"] == "ok"
def test_weak_password(): assert c.post("/api/auth/register", json={**GOOD, "email": "a@b.com", "password": "abc", "confirm_password": "abc"}).status_code == 422
def test_auth_flow():
    assert c.post("/api/auth/register", json=GOOD).status_code in (201, 409)
    t = c.post("/api/auth/login", json={"email": GOOD["email"], "password": GOOD["password"]}).json()["access_token"]
    assert c.get("/api/auth/me", headers={"Authorization": f"Bearer {t}"}).status_code == 200
def test_protected(): assert c.get("/api/alerts").status_code == 401
def test_disease_unavailable():
    assert c.post("/api/disease/analyze", files={"file": ("a.jpg", b"x", "image/jpeg")}).json()["status"] == "model_unavailable"
def test_bad_image_type(): assert c.post("/api/disease/analyze", files={"file": ("a.txt", b"x", "text/plain")}).status_code == 415
