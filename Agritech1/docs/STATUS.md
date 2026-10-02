# Feature status (honest ledger)

| Feature | Status |
|---|---|
| Forecast feature engineering, leakage prevention, chronological split | FUNCTIONAL AND TESTED (4 tests, executed, pass) |
| Forecast training pipeline (baseline + XGBoost/LightGBM, direct 7/15/30-day models) | FUNCTIONAL BUT NOT FULLY TESTED: executed end-to-end only on SYNTHETIC data, and only with a scikit-learn fallback because xgboost/lightgbm were not installable offline. Synthetic metrics (model beat persistence at all horizons) say nothing about real accuracy. |
| Forecast API `/api/forecast`, price history API | FUNCTIONAL BUT NOT FULLY TESTED (syntax-checked only; FastAPI was not installed in my sandbox) |
| Auth (register/login/refresh/me, password rules, PBKDF2 hashing, JWT, rate limit, generic forgot-password) | FUNCTIONAL BUT NOT FULLY TESTED (tests written in `backend/tests/test_api.py`, NOT run) |
| Alerts API (create/list/delete; in-app only) | FUNCTIONAL BUT NOT FULLY TESTED. No edit/pause, no evaluation against new data, no email/SMS. |
| Disease analyze API: validation + explicit "model unavailable" | FUNCTIONAL BUT NOT FULLY TESTED. No model is trained. |
| Frontend: price chart, forecast, language switch (en/te/hi), demo label | FUNCTIONAL BUT NOT FULLY TESTED (not installed or built; Telugu/Hindi strings need human review) |
| Demo dataset | DEMO ONLY (synthetic, source=SYNTHETIC_DEMO) |
| EfficientNet/MobileNet training + inference | NOT IMPLEMENTED |
| Real data import (AGMARKNET/e-NAM), data-provider layer | NOT IMPLEMENTED (CSV schema in `data/make_demo_data.py`) |
| Treatment guidance & source registry, RAG/LLM layer | NOT IMPLEMENTED (no treatment advice is shown anywhere, by design) |
| Nearby markets / geolocation / Leaflet | NOT IMPLEMENTED |
| Weather | WAITING FOR API |
| Landing page, dashboard, registration/login UI, profile, help pages, Alembic migrations, PostgreSQL testing | NOT IMPLEMENTED (tables auto-created via SQLAlchemy; only Users and PriceAlerts exist) |
| Prediction intervals | NOT IMPLEMENTED (API returns null bounds) |

Next milestones: real data import -> tests run with deps installed -> disease model -> treatment sources -> markets -> weather/alerts.
