import json, os, pathlib, re, sys
from dotenv import load_dotenv
load_dotenv(pathlib.Path(__file__).resolve().parents[2] / ".env")
from collections import defaultdict
from time import time
import joblib, pandas as pd
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form, Request
from pydantic import BaseModel, EmailStr, field_validator
from . import security as sec
from .db import Session, User, PriceAlert, init_db

app = FastAPI(title="AgriVision AI", version="0.1.0")
init_db()
BASE = pathlib.Path(__file__).resolve().parents[2]
CSV = pathlib.Path(os.getenv("FORECAST_CSV", BASE / "data/demo_prices.csv"))
ART = pathlib.Path(os.getenv("FORECAST_ARTIFACTS", BASE / "ml/forecasting/artifacts"))
MODE = os.getenv("DATA_MODE", "demo")
sys.path.insert(0, str(BASE / "ml/forecasting")); sys.path.insert(0, str(BASE / "ml/disease"))
_hits: dict = defaultdict(list)

def limit(request: Request, n=30, window=60):
    k = request.client.host if request.client else "x"; now = time()
    _hits[k] = [t for t in _hits[k] if now - t < window]
    if len(_hits[k]) >= n: raise HTTPException(429, "Too many requests")
    _hits[k].append(now)

def prices() -> pd.DataFrame:
    if not CSV.exists(): raise HTTPException(503, f"No price data at {CSV}. Run data/make_demo_data.py or import real data.")
    return pd.read_csv(CSV, parse_dates=["date"])

def current_user(authorization: str = Header(default="")):
    sub = sec.read_token(authorization.removeprefix("Bearer ").strip())
    if not sub: raise HTTPException(401, "Invalid or missing token")
    with Session() as s:
        u = s.get(User, int(sub))
        if not u: raise HTTPException(401, "Unknown user")
        return u

class Register(BaseModel):
    full_name: str; email: EmailStr; password: str; confirm_password: str
    phone: str | None = None; state: str | None = None; district: str | None = None
    preferred_language: str = "en"; accept_terms: bool
    @field_validator("phone")
    @classmethod
    def _p(cls, v):
        if v and not re.fullmatch(r"(\+91)?[6-9]\d{9}", v): raise ValueError("Invalid Indian mobile number")
        return v
    @field_validator("preferred_language")
    @classmethod
    def _l(cls, v):
        if v not in ("en", "te", "hi"): raise ValueError("Language must be en, te or hi")
        return v
class Login(BaseModel): email: EmailStr; password: str

@app.get("/api/health")
def health():
    return {"status": "ok", "data_mode": MODE, "price_data": CSV.exists(),
            "forecast_models": sorted(p.name for p in ART.glob("model_h*.joblib")) if ART.exists() else []}

@app.post("/api/auth/register", status_code=201, dependencies=[Depends(limit)])
def register(b: Register):
    if not b.accept_terms: raise HTTPException(422, "Terms must be accepted")
    if b.password != b.confirm_password: raise HTTPException(422, "Passwords do not match")
    if not sec.password_ok(b.password): raise HTTPException(422, "Password needs 8+ chars with upper, lower, number, special")
    with Session() as s:
        if s.query(User).filter_by(email=b.email.lower()).first(): raise HTTPException(409, "Could not register with these details")
        u = User(full_name=b.full_name, email=b.email.lower(), phone=b.phone, password_hash=sec.hash_password(b.password),
                 state=b.state, district=b.district, preferred_language=b.preferred_language)
        s.add(u); s.commit(); return {"id": u.id}

@app.post("/api/auth/login", dependencies=[Depends(limit)])
def login(b: Login):
    with Session() as s:
        u = s.query(User).filter_by(email=b.email.lower()).first()
        if not u or not sec.verify_password(b.password, u.password_hash): raise HTTPException(401, "Invalid email or password")
        return {"access_token": sec.make_token(str(u.id)), "refresh_token": sec.make_token(str(u.id), "refresh", 60*24*7), "token_type": "bearer"}

@app.post("/api/auth/refresh")
def refresh(refresh_token: str):
    sub = sec.read_token(refresh_token, "refresh")
    if not sub: raise HTTPException(401, "Invalid refresh token")
    return {"access_token": sec.make_token(sub)}

@app.get("/api/auth/me")
def me(u: User = Depends(current_user)): return {"id": u.id, "full_name": u.full_name, "email": u.email, "preferred_language": u.preferred_language}

@app.post("/api/auth/forgot-password")
def forgot(email: EmailStr):  # generic reply; no email provider is connected so nothing is sent
    return {"message": "If the account exists, reset instructions will be sent.", "delivery": "NOT CONFIGURED: no email provider connected"}

@app.get("/api/crops")
def crops(): return sorted(prices()["crop"].unique().tolist())

@app.get("/api/prices/history")
def history(crop: str, market: str | None = None, days: int = 180):
    df = prices(); df = df[df["crop"].str.lower() == crop.lower()]
    if market: df = df[df["market"].str.lower() == market.lower()]
    if df.empty: raise HTTPException(404, "No data for this selection")
    df = df.sort_values("date").tail(days)
    return {"mode": MODE, "label": "DEMO DATA - NOT LIVE" if MODE == "demo" else None, "crop": crop, "unit": df["unit"].iloc[-1],
            "source": df["source"].iloc[-1], "latest_date": str(df["date"].iloc[-1].date()),
            "points": [{"date": str(r.date.date()), "modal_price": r.modal_price} for r in df.itertuples()]}

class ForecastReq(BaseModel): crop: str; horizon: int = 7; market: str | None = None
@app.post("/api/forecast")
def forecast(b: ForecastReq):
    if b.horizon not in (7, 15, 30): raise HTTPException(422, "horizon must be 7, 15 or 30")
    f = ART / f"model_h{b.horizon}.joblib"
    if not f.exists(): raise HTTPException(503, "Forecast model not trained. Run ml/forecasting/train.py")
    from features import clean, make_features, FEATURES
    bundle = joblib.load(f); df = clean(prices()); df = df[df["crop"].str.lower() == b.crop.lower()]
    if b.market: df = df[df["market"].str.lower() == b.market.lower()]
    if len(df) < 60: raise HTTPException(404, "Not enough history for this crop/market")
    feats = make_features(df, b.horizon).dropna(subset=FEATURES).iloc[[-1]]
    pred = float(feats["lag_1"].iloc[0] * (1 + bundle["model"].predict(feats[FEATURES])[0]))
    last_date = feats["date"].iloc[0]; last = float(feats["modal_price"].iloc[0])
    mp = ART / "metrics.json"; metrics = json.loads(mp.read_text())["horizons"].get(str(b.horizon)) if mp.exists() else None
    return {"crop": b.crop, "horizon_days": b.horizon, "forecast_date": str((last_date + pd.Timedelta(days=b.horizon)).date()),
            "predicted_price": round(pred, 2), "latest_actual_price": last, "latest_input_date": str(last_date.date()),
            "lower_bound": None, "upper_bound": None, "uncertainty": "No prediction interval implemented; treat as a rough estimate.",
            "direction": "uncertain" if abs(pred/last - 1) < 0.02 else ("increasing" if pred > last else "decreasing"),
            "model": {"name": bundle["name"], "version": bundle["version"], "strategy": "direct (one model per horizon)"},
            "evaluation": metrics, "is_demo": MODE == "demo",
            "disclaimer": "Forecast is an estimate, not an actual price or a guarantee. Prices change with supply, demand, weather and policy."}

ALLOWED = {"image/jpeg", "image/png", "image/webp"}
@app.post("/api/disease/analyze")
async def analyze(file: UploadFile = File(...), crop: str | None = Form(None)):
    data = await file.read()
    if file.content_type not in ALLOWED: raise HTTPException(415, "Use JPG, PNG or WEBP")
    if not data: raise HTTPException(422, "Empty file")
    if len(data) > 8*1024*1024: raise HTTPException(413, "Image larger than 8 MB")
    from infer import analyze as run
    return run(data, crop)

class AlertIn(BaseModel): crop: str; threshold: float; condition: str; market: str | None = None
@app.get("/api/alerts")
def alerts(u: User = Depends(current_user)):
    with Session() as s:
        return [dict(id=a.id, crop=a.crop, market=a.market, threshold=a.threshold, condition=a.condition, is_active=a.is_active) for a in s.query(PriceAlert).filter_by(user_id=u.id)]
@app.post("/api/alerts", status_code=201)
def add_alert(b: AlertIn, u: User = Depends(current_user)):
    if b.condition not in ("above", "below"): raise HTTPException(422, "condition must be above|below")
    with Session() as s:
        a = PriceAlert(user_id=u.id, **b.model_dump()); s.add(a); s.commit()
        return {"id": a.id, "delivery": "in-app only; email/SMS NOT CONFIGURED"}
@app.delete("/api/alerts/{aid}")
def del_alert(aid: int, u: User = Depends(current_user)):
    with Session() as s:
        a = s.get(PriceAlert, aid)
        if not a or a.user_id != u.id: raise HTTPException(404, "Not found")
        s.delete(a); s.commit(); return {"deleted": aid}
