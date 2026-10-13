"""Train the AI KidneyGuard screening classifier.
Dataset: UCI Chronic Kidney Disease (id 336), CC BY 4.0, 400 records from Apollo Hospitals, Tamil Nadu (2015).
Task: classify existing CKD vs not-CKD (NOT a future-risk model).
Exports src/lib/model/ckd-model.json used by the server-side inference function."""
import json, re, numpy as np, pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, accuracy_score, recall_score, precision_score

rows, cols, data = [], [], False
for line in open("ml/chronic_kidney_disease_full.arff"):
    l = line.strip()
    if not l or l.startswith("%"): continue
    if l.lower().startswith("@attribute"): cols.append(re.findall(r"'([^']+)'|(\S+)", l)[1][0] or re.findall(r"\S+", l)[1].strip("'")); continue
    if l.lower().startswith("@data"): data = True; continue
    if data: rows.append([v.strip() for v in l.split(",")][:len(cols)])
df = pd.DataFrame(rows, columns=cols).replace("?", np.nan)
FEATS = ["age", "bp", "sc", "al", "hemo", "htn", "dm"]
d = df[FEATS + ["class"]].copy()
for c in ["age", "bp", "sc", "al", "hemo"]: d[c] = pd.to_numeric(d[c], errors="coerce")
for c in ["htn", "dm"]: d[c] = d[c].str.strip().map({"yes": 1, "no": 0})
d["y"] = (d["class"].str.strip() == "ckd").astype(int)
d = d.dropna(subset=FEATS)  # complete cases only: no imputation of medical values
X, y = d[FEATS].values, d["y"].values
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)
cv = StratifiedKFold(5, shuffle=True, random_state=42)
cands = {"logistic_regression": make_pipeline(StandardScaler(), LogisticRegression(C=0.5, max_iter=1000)),
         "random_forest": RandomForestClassifier(300, random_state=42)}
cvs = {k: float(cross_val_score(m, Xtr, ytr, cv=cv, scoring="roc_auc").mean()) for k, m in cands.items()}
print("CV AUC", cvs)
m = cands["logistic_regression"].fit(Xtr, ytr)  # chosen: comparable AUC, interpretable, portable
p = m.predict_proba(Xte)[:, 1]; pr = (p >= 0.5).astype(int)
sc, lr = m.named_steps["standardscaler"], m.named_steps["logisticregression"]
out = {"version": "ckd-lr-1.0.0", "trained_at": pd.Timestamp.utcnow().strftime("%Y-%m-%d"),
  "dataset": {"name": "UCI Chronic Kidney Disease (id 336)", "license": "CC BY 4.0", "url": "https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease",
    "records_total": int(len(df)), "records_used": int(len(d)), "ckd": int(y.sum()), "not_ckd": int(len(y) - y.sum())},
  "features": FEATS, "mean": sc.mean_.tolist(), "scale": sc.scale_.tolist(), "coef": lr.coef_[0].tolist(), "intercept": float(lr.intercept_[0]),
  "train_min": X.min(0).tolist(), "train_max": X.max(0).tolist(),
  "metrics": {"test_n": int(len(yte)), "auc": round(float(roc_auc_score(yte, p)), 3), "accuracy": round(float(accuracy_score(yte, pr)), 3),
    "sensitivity": round(float(recall_score(yte, pr)), 3), "precision": round(float(precision_score(yte, pr)), 3),
    "cv_auc": {k: round(v, 3) for k, v in cvs.items()}}}
json.dump(out, open("src/lib/model/ckd-model.json", "w"), indent=1)
print(json.dumps(out["metrics"]), out["dataset"])
