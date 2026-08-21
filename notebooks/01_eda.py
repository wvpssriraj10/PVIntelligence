# 01_eda.ipynb
# Run these cells in order.

from pathlib import Path
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

PROJECT_DIR = Path.cwd().parent
RAW_DIR = PROJECT_DIR / "data" / "raw"

# If the notebook is opened from the project root instead:
if not RAW_DIR.exists():
    PROJECT_DIR = Path.cwd()
    RAW_DIR = PROJECT_DIR / "data" / "raw"

# -----------------------------
# 1. Load data
# -----------------------------
p1_gen = pd.read_csv(RAW_DIR / "Plant_1_Generation_Data.csv")
p1_weather = pd.read_csv(RAW_DIR / "Plant_1_Weather_Sensor_Data.csv")
p2_gen = pd.read_csv(RAW_DIR / "Plant_2_Generation_Data.csv")
p2_weather = pd.read_csv(RAW_DIR / "Plant_2_Weather_Sensor_Data.csv")

datasets = {
    "Plant 1 Generation": p1_gen,
    "Plant 1 Weather": p1_weather,
    "Plant 2 Generation": p2_gen,
    "Plant 2 Weather": p2_weather,
}

# -----------------------------
# 2. Basic overview
# -----------------------------
for name, df in datasets.items():
    print("\n", "=" * 60)
    print(name)
    print("Shape:", df.shape)
    print("\nColumns:")
    print(df.columns.tolist())
    print("\nData types:")
    print(df.dtypes)
    print("\nMissing values:")
    print(df.isna().sum())
    print("\nDuplicates:", df.duplicated().sum())

# -----------------------------
# 3. Descriptive statistics
# -----------------------------
for name, df in datasets.items():
    print("\n", name)
    display(df.describe(include="all").T)

# -----------------------------
# 4. Convert timestamps
# -----------------------------
for df in datasets.values():
    df["DATE_TIME"] = pd.to_datetime(
        df["DATE_TIME"], format="mixed", errors="coerce"
    )

# -----------------------------
# 5. Missing-value visualization
# -----------------------------
for name, df in datasets.items():
    missing = df.isna().sum().sort_values(ascending=False)
    missing = missing[missing > 0]

    plt.figure(figsize=(10, 4))
    if len(missing):
        missing.plot(kind="bar")
        plt.title(f"Missing Values - {name}")
        plt.ylabel("Number of missing values")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()
    else:
        plt.text(0.5, 0.5, "No missing values", ha="center", va="center")
        plt.title(f"Missing Values - {name}")
        plt.show()

# -----------------------------
# 6. Plant 1 power distribution
# -----------------------------
plt.figure(figsize=(10, 5))
plt.hist(p1_gen["AC_POWER"], bins=50)
plt.title("Plant 1 AC Power Distribution")
plt.xlabel("AC Power")
plt.ylabel("Frequency")
plt.tight_layout()
plt.show()

# -----------------------------
# 7. Weather distributions
# -----------------------------
for col in ["IRRADIATION", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE"]:
    plt.figure(figsize=(10, 5))
    plt.hist(p1_weather[col], bins=50)
    plt.title(f"Plant 1 - {col}")
    plt.xlabel(col)
    plt.ylabel("Frequency")
    plt.tight_layout()
    plt.show()

# -----------------------------
# 8. Time-series plots
# -----------------------------
p1_gen_sorted = p1_gen.sort_values("DATE_TIME")

plt.figure(figsize=(14, 5))
plt.plot(p1_gen_sorted["DATE_TIME"], p1_gen_sorted["AC_POWER"])
plt.title("Plant 1 AC Power Over Time")
plt.xlabel("Date")
plt.ylabel("AC Power")
plt.tight_layout()
plt.show()

# -----------------------------
# 9. Weather vs power
# -----------------------------
# Aggregate inverter power by timestamp.
p1_power = (
    p1_gen.groupby("DATE_TIME", as_index=False)["AC_POWER"]
    .sum()
)

p1_weather_sorted = p1_weather.sort_values("DATE_TIME")

merged_eda = pd.merge_asof(
    p1_power.sort_values("DATE_TIME"),
    p1_weather_sorted[
        ["DATE_TIME", "IRRADIATION", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE"]
    ].sort_values("DATE_TIME"),
    on="DATE_TIME",
    direction="nearest",
    tolerance=pd.Timedelta("5min"),
)

for col in ["IRRADIATION", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE"]:
    plt.figure(figsize=(8, 5))
    plt.scatter(merged_eda[col], merged_eda["AC_POWER"], alpha=0.3)
    plt.title(f"AC Power vs {col}")
    plt.xlabel(col)
    plt.ylabel("AC Power")
    plt.tight_layout()
    plt.show()

# -----------------------------
# 10. Correlation heatmap
# -----------------------------
corr_cols = [
    "AC_POWER",
    "DC_POWER",
    "DAILY_YIELD",
    "TOTAL_YIELD",
]

weather_cols = [
    "IRRADIATION",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
]

p1_for_corr = p1_gen[corr_cols].copy()
p1_weather_corr = p1_weather[weather_cols].copy()

# Since timestamps differ in frequency, correlate the weather variables
# after nearest-time merging with aggregated power.
corr_df = merged_eda[
    ["AC_POWER", "IRRADIATION", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE"]
].dropna()

corr = corr_df.corr()

plt.figure(figsize=(8, 6))
plt.imshow(corr, interpolation="nearest", aspect="auto")
plt.colorbar()
plt.xticks(range(len(corr.columns)), corr.columns, rotation=45, ha="right")
plt.yticks(range(len(corr.index)), corr.index)
plt.title("Correlation Heatmap - Plant 1")
plt.tight_layout()
plt.show()

display(corr)

# -----------------------------
# 11. Solar generation by hour
# -----------------------------
p1_power["hour"] = p1_power["DATE_TIME"].dt.hour
hourly = p1_power.groupby("hour")["AC_POWER"].mean()

plt.figure(figsize=(10, 5))
plt.plot(hourly.index, hourly.values, marker="o")
plt.title("Average AC Power by Hour - Plant 1")
plt.xlabel("Hour of Day")
plt.ylabel("Average AC Power")
plt.grid(True)
plt.tight_layout()
plt.show()

# -----------------------------
# 12. Outlier check
# -----------------------------
for col in ["AC_POWER", "DC_POWER", "DAILY_YIELD"]:
    q1 = p1_gen[col].quantile(0.25)
    q3 = p1_gen[col].quantile(0.75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    outliers = p1_gen[(p1_gen[col] < lower) | (p1_gen[col] > upper)]

    print(
        f"{col}: lower={lower:.2f}, upper={upper:.2f}, "
        f"outlier rows={len(outliers)}"
    )

# -----------------------------
# 13. Key EDA conclusions
# -----------------------------
print("""
EDA conclusions to record in your report:

1. The generation dataset contains multiple inverter records for each timestamp.
2. Therefore, inverter-level power should be aggregated before plant-level forecasting.
3. Weather data is sampled at a different frequency, so a timestamp-based nearest merge
   is required.
4. Irradiation is expected to have a strong relationship with PV power.
5. Temperature variables provide additional information for forecasting.
6. Solar power follows a strong daily pattern: low/no generation around night-time
   and higher generation during daylight.
7. Time-based train/validation/test splitting is preferred over random splitting
   because this is a forecasting problem.
8. Feature scaling should be fitted only on the training data to prevent data leakage.
""")
