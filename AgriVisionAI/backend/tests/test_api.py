import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
from fastapi.testclient import TestClient
import app.main as main_module
from app.main import app, _distance_km, _location_name, _nearby_market_list
c = TestClient(app)
GOOD = dict(full_name="Test", email="t@example.com", password="Passw0rd!", confirm_password="Passw0rd!", accept_terms=True)
def test_health(): assert c.get("/api/health").json()["status"] == "ok"
def test_weak_password(): assert c.post("/api/auth/register", json={**GOOD, "email": "a@b.com", "password": "abc", "confirm_password": "abc"}).status_code == 422
def test_auth_flow():
    assert c.post("/api/auth/register", json=GOOD).status_code in (201, 409)
    t = c.post("/api/auth/login", json={"email": GOOD["email"], "password": GOOD["password"]}).json()["access_token"]
    assert c.get("/api/auth/me", headers={"Authorization": f"Bearer {t}"}).status_code == 200
def test_protected(): assert c.get("/api/alerts").status_code == 401
def test_disease_detection_demo():
    r = c.post("/api/disease/analyze", files={"file": ("leaf.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00", "image/jpeg")}, data={"crop": "Tomato"})
    assert r.status_code == 200
    assert r.json()["status"] in {"healthy", "disease_detected"}
def test_bad_image_type(): assert c.post("/api/disease/analyze", files={"file": ("a.txt", b"x", "text/plain")}).status_code == 415

def test_location_name_prefers_village_or_town():
    locality, address = _location_name({"address": {"village": "Village A", "district": "District B", "state": "State C", "country": "Country D"}})
    assert locality == "Village A"
    assert address == "Village A, District B, State C, Country D"

def test_nearby_markets_are_sorted_by_distance():
    markets = _nearby_market_list({"elements": [
        {"lat": 17.5, "lon": 78.5, "tags": {"name": "Far Market"}},
        {"lat": 17.39, "lon": 78.49, "tags": {"name": "Near Market"}},
    ]}, 17.385, 78.4867)
    assert [market["name"] for market in markets] == ["Near Market", "Far Market"]
    assert markets[0]["distance_km"] == round(_distance_km(17.385, 78.4867, 17.39, 78.49), 1)

def test_location_lookup_requires_auth_and_valid_coordinates():
    assert c.get("/api/location/nearby", params={"latitude": 17.3, "longitude": 78.4}).status_code == 401
    token = c.post("/api/auth/login", json={"email": GOOD["email"], "password": GOOD["password"]}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert c.get("/api/location/nearby", params={"latitude": 91, "longitude": 78.4}, headers=headers).status_code == 422

def test_location_lookup_returns_locality_and_markets(monkeypatch):
    class MockResponse:
        def __init__(self, payload): self.payload = payload
        def raise_for_status(self): pass
        def json(self): return self.payload

    class MockAsyncClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def get(self, url, params):
            return MockResponse({"address": {"city": "Guntur", "state": "Andhra Pradesh", "country": "India"}})
        async def post(self, url, data):
            return MockResponse({"elements": [{"lat": 17.39, "lon": 78.49, "tags": {"name": "Nearby Market"}}]})

    monkeypatch.setattr(main_module.httpx, "AsyncClient", MockAsyncClient)
    token = c.post("/api/auth/login", json={"email": GOOD["email"], "password": GOOD["password"]}).json()["access_token"]
    response = c.get("/api/location/nearby", params={"latitude": 17.385, "longitude": 78.4867}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["locality"] == "Guntur"
    assert response.json()["markets"][0]["name"] == "Nearby Market"
