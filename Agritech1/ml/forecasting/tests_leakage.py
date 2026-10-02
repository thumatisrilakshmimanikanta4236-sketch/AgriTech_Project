import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pandas as pd, numpy as np
from features import clean, make_features, chrono_split, FEATURES

def _df(n=120):
    return pd.DataFrame(dict(date=pd.date_range("2024-01-01", periods=n), state="A", district="D", market="M", crop="rice", modal_price=np.arange(1, n+1, dtype=float)))

def test_features_use_only_past():
    d = clean(_df()); r = make_features(d, 7).iloc[50]
    assert r["lag_1"] == d.iloc[50]["modal_price"] and r["lag_7"] == d.iloc[43]["modal_price"] and r["target"] == d.iloc[57]["modal_price"]

def test_changing_future_does_not_change_features():
    d = clean(_df()); f1 = make_features(d, 7).iloc[50][FEATURES]
    d2 = d.copy(); d2.loc[60:, "modal_price"] = 9999; f2 = make_features(d2, 7).iloc[50][FEATURES]
    assert (f1.values == f2.values).all()

def test_chronological_split_no_overlap():
    f = make_features(clean(_df(300)), 7).dropna(subset=FEATURES + ["target"])
    tr, va, te = chrono_split(f, horizon=7)
    assert tr["target_date"].max() < va["date"].min() and va["target_date"].max() < te["date"].min()

def test_duplicates_removed(): assert len(clean(pd.concat([_df(10), _df(10)]))) == 10

if __name__ == "__main__":
    for k, v in list(globals().items()):
        if k.startswith("test_"): v(); print("PASS", k)
