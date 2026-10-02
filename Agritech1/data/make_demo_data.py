"""SYNTHETIC demo data. Not real market observations."""
import numpy as np, pandas as pd, pathlib
rng = np.random.default_rng(42)
rows = []
for crop, base in [("Chilli", 14000), ("Tomato", 2200), ("Onion", 1800), ("Maize", 2100)]:
    dates = pd.date_range("2022-01-01", "2024-12-31", freq="D")
    t = np.arange(len(dates))
    p = base * (1 + 0.15*np.sin(2*np.pi*t/365) + 0.0002*t) + np.cumsum(rng.normal(0, base*0.004, len(t)))
    for d, v in zip(dates, p):
        rows.append(dict(date=d.date(), state="Andhra Pradesh", district="Guntur", market="Guntur",
                         crop=crop, modal_price=round(v, 2), min_price=round(v*0.95, 2), max_price=round(v*1.05, 2),
                         arrivals=round(abs(rng.normal(500, 80)), 1), unit="Rs/quintal", source="SYNTHETIC_DEMO"))
out = pathlib.Path(__file__).parent / "demo_prices.csv"
pd.DataFrame(rows).to_csv(out, index=False); print("wrote", out, len(rows), "rows (SYNTHETIC)")
