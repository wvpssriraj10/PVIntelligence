from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
raw = next(ROOT.glob("data/raw/*Plant_1*Generation*.csv"))

df = pd.read_csv(raw)
dt = pd.to_datetime(df["DATE_TIME"], dayfirst=True, errors="coerce")

assert not dt.isna().any(), "Unparseable Plant 1 timestamps found."
assert dt.min().date() == pd.Timestamp("2020-05-15").date(), f"Unexpected start: {dt.min()}"
assert dt.max().date() == pd.Timestamp("2020-06-17").date(), f"Unexpected end: {dt.max()}"

print("PASS: Plant 1 dates parse as DD-MM-YYYY.")
print(f"Start: {dt.min()}")
print(f"End:   {dt.max()}")
