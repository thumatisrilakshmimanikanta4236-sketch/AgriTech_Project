import argparse, json, time, pathlib, joblib, numpy as np, pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from features import clean, make_features, chrono_split, FEATURES, HORIZONS

def candidates():
    c = {}
    try:
        import xgboost as xgb; c["xgboost"] = lambda: xgb.XGBRegressor(n_estimators=300, max_depth=4, learning_rate=0.05)
    except ImportError: print("xgboost not installed - skipped")
    try:
        import lightgbm as lgb; c["lightgbm"] = lambda: lgb.LGBMRegressor(n_estimators=300, learning_rate=0.05, verbose=-1)
    except ImportError: print("lightgbm not installed - skipped")
    if not c:  # sandbox fallback only; NOT one of the requested candidates
        from sklearn.ensemble import HistGradientBoostingRegressor
        c["sklearn_hgb_fallback"] = lambda: HistGradientBoostingRegressor(max_iter=300, learning_rate=0.05)
    return c

def rmse(y, p): return float(np.sqrt(mean_squared_error(y, p)))

def main(csv, out):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    df = clean(pd.read_csv(csv)); report = {"source_csv": str(csv), "rows": len(df), "sources": df["source"].unique().tolist(), "horizons": {}}
    for h in HORIZONS:
        f = make_features(df, h).dropna(subset=FEATURES + ["target", "ret"])
        tr, va, te = chrono_split(f, horizon=h)
        res = {"n_train": len(tr), "n_val": len(va), "n_test": len(te), "test_period": [str(te["date"].min().date()), str(te["date"].max().date())]}
        res["baseline_persistence"] = {"mae": float(mean_absolute_error(te["target"], te["modal_price"])), "rmse": rmse(te["target"], te["modal_price"])}
        best = None
        for name, mk in candidates().items():
            m = mk().fit(tr[FEATURES], tr["ret"])
            v = mean_absolute_error(va["target"], va["lag_1"] * (1 + m.predict(va[FEATURES])))   # selection on validation only
            res.setdefault("validation_mae", {})[name] = float(v)
            if best is None or v < best[0]: best = (v, name, m)
        _, name, m = best
        p = te["lag_1"] * (1 + m.predict(te[FEATURES]))  # test set used once, after selection
        res["selected"] = name; res["test"] = {"mae": float(mean_absolute_error(te["target"], p)), "rmse": rmse(te["target"], p)}
        res["beats_baseline"] = res["test"]["mae"] < res["baseline_persistence"]["mae"]
        version = time.strftime("%Y%m%d%H%M%S"); res["version"] = version
        joblib.dump({"model": m, "name": name, "version": version, "horizon": h, "features": FEATURES}, out / f"model_h{h}.joblib")
        report["horizons"][str(h)] = res; print(h, json.dumps(res))
    report["note"] = "Direct multi-horizon models. No prediction intervals implemented. Pooled across crops. SYNTHETIC_DEMO metrics do not reflect real-world accuracy."
    (out / "metrics.json").write_text(json.dumps(report, indent=1))

if __name__ == "__main__":
    a = argparse.ArgumentParser(); a.add_argument("--csv", required=True); a.add_argument("--out", required=True)
    main(**vars(a.parse_args()))
