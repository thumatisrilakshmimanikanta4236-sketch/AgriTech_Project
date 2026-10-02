import pandas as pd, numpy as np
HORIZONS = (7, 15, 30)   # DIRECT strategy: one model per horizon, target = price at t+h
KEYS = ["state", "district", "market", "crop"]
FEATURES = ["r_7", "r_14", "r_30", "rm_7", "rs_7", "month", "dow"]   # scale-free so one model can pool crops
RAW = ["lag_1", "lag_7", "lag_14", "lag_30", "roll_mean_7", "roll_std_7"]

def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["modal_price"] = pd.to_numeric(df["modal_price"], errors="coerce")
    df = df.dropna(subset=["date", "modal_price"])
    df = df[df["modal_price"] > 0]
    df["crop"] = df["crop"].str.strip().str.title()
    df = df.drop_duplicates(subset=KEYS + ["date"], keep="last")
    return df.sort_values(KEYS + ["date"]).reset_index(drop=True)

def make_features(df: pd.DataFrame, horizon: int) -> pd.DataFrame:
    """Features use only observations at or before row date t (assumes daily rows); target is price at t+horizon."""
    g = df.groupby(KEYS)["modal_price"]
    out = df.copy()
    out["lag_1"] = out["modal_price"]            # price observed at t
    for l in (7, 14, 30): out[f"lag_{l}"] = g.shift(l)
    out["roll_mean_7"] = g.transform(lambda s: s.rolling(7).mean())
    out["roll_std_7"] = g.transform(lambda s: s.rolling(7).std())
    for l in (7, 14, 30): out[f"r_{l}"] = out["lag_1"] / out[f"lag_{l}"] - 1
    out["rm_7"] = out["roll_mean_7"] / out["lag_1"] - 1
    out["rs_7"] = out["roll_std_7"] / out["lag_1"]
    out["month"] = out["date"].dt.month
    out["dow"] = out["date"].dt.dayofweek
    out["target"] = g.shift(-horizon)
    out["ret"] = out["target"] / out["lag_1"] - 1   # model predicts relative change; price = lag_1*(1+ret)
    out["target_date"] = out["date"] + pd.Timedelta(days=horizon)
    return out

def chrono_split(df: pd.DataFrame, val_frac=0.15, test_frac=0.15, horizon=0):
    """Split by date. Training/validation targets must resolve before the next period starts (no overlap)."""
    dates = np.sort(df["date"].unique())
    v0, t0 = dates[int(len(dates)*(1-val_frac-test_frac))], dates[int(len(dates)*(1-test_frac))]
    train = df[df["target_date"] < v0]
    val = df[(df["date"] >= v0) & (df["target_date"] < t0)]
    test = df[df["date"] >= t0]
    return train, val, test
