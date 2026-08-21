from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

PROJECT_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = PROJECT_DIR / "data" / "raw"
PROCESSED_DIR = PROJECT_DIR / "data" / "processed"

NUMERIC_FEATURES = [
    "IRRADIATION",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
    "DC_POWER",
    "AC_POWER",
    "DAILY_YIELD",
]

TARGET = "AC_POWER"

def clean_generation(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip() for c in df.columns]

    # Standardize timestamp
    df["DATE_TIME"] = pd.to_datetime(df["DATE_TIME"], dayfirst=True, errors="coerce")

    # Remove rows with unusable timestamps
    df = df.dropna(subset=["DATE_TIME"])

    # Remove exact duplicates
    df = df.drop_duplicates()

    # Numeric conversion
    for col in ["DC_POWER", "AC_POWER", "DAILY_YIELD", "TOTAL_YIELD"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Power cannot be negative
    for col in ["DC_POWER", "AC_POWER", "DAILY_YIELD"]:
        if col in df.columns:
            df.loc[df[col] < 0, col] = np.nan

    return df


def clean_weather(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip() for c in df.columns]

    df["DATE_TIME"] = pd.to_datetime(df["DATE_TIME"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["DATE_TIME"]).drop_duplicates()

    for col in ["AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE", "IRRADIATION"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Irradiation cannot be negative
    if "IRRADIATION" in df.columns:
        df.loc[df["IRRADIATION"] < 0, "IRRADIATION"] = np.nan

    return df


def aggregate_generation(generation: pd.DataFrame) -> pd.DataFrame:
    """
    Generation data contains multiple inverter rows per timestamp.
    Aggregate power across inverters and keep useful plant-level variables.
    """
    generation = generation.copy()

    agg = (
        generation.groupby("DATE_TIME", as_index=False)
        .agg(
            DC_POWER=("DC_POWER", "sum"),
            AC_POWER=("AC_POWER", "sum"),
            DAILY_YIELD=("DAILY_YIELD", "sum"),
            TOTAL_YIELD=("TOTAL_YIELD", "sum"),
        )
    )
    return agg


def merge_plant_data(generation: pd.DataFrame, weather: pd.DataFrame) -> pd.DataFrame:
    generation = aggregate_generation(generation)

    weather = weather[
        ["DATE_TIME", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE", "IRRADIATION"]
    ].copy()

    # Weather measurements and inverter records may not have perfectly identical
    # timestamps. Merge each generation timestamp with the nearest weather record.
    generation = generation.sort_values("DATE_TIME")
    weather = weather.sort_values("DATE_TIME")

    merged = pd.merge_asof(
        generation,
        weather,
        on="DATE_TIME",
        direction="nearest",
        tolerance=pd.Timedelta("5min"),
    )

    return merged


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    dt = df["DATE_TIME"]

    df["hour"] = dt.dt.hour
    df["minute"] = dt.dt.minute
    df["day_of_week"] = dt.dt.dayofweek
    df["day_of_year"] = dt.dt.dayofyear
    df["month"] = dt.dt.month

    # Cyclic encoding is useful for time-series models.
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["day_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["day_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)

    return df


def fill_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    numeric_cols = df.select_dtypes(include=np.number).columns

    # Time interpolation is appropriate for continuous sensor readings.
    df[numeric_cols] = (
        df[numeric_cols]
        .interpolate(method="linear", limit_direction="both")
    )

    # Final fallback.
    df[numeric_cols] = df[numeric_cols].fillna(0)
    return df


def scale_features(
    train_df: pd.DataFrame,
    valid_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_cols,
    method="standard",
):
    """
    Fit scaler ONLY on training data to avoid data leakage.
    """
    if method == "standard":
        scaler = StandardScaler()
    elif method == "minmax":
        scaler = MinMaxScaler()
    else:
        raise ValueError("method must be 'standard' or 'minmax'")

    train = train_df.copy()
    valid = valid_df.copy()
    test = test_df.copy()

    train[feature_cols] = scaler.fit_transform(train[feature_cols])
    valid[feature_cols] = scaler.transform(valid[feature_cols])
    test[feature_cols] = scaler.transform(test[feature_cols])

    return train, valid, test, scaler


def process_plant(plant: int, scaling="standard"):
    generation_path = RAW_DIR / f"Plant_{plant}_Generation_Data.csv"
    weather_path = RAW_DIR / f"Plant_{plant}_Weather_Sensor_Data.csv"

    generation = pd.read_csv(generation_path)
    weather = pd.read_csv(weather_path)

    generation = clean_generation(generation)
    weather = clean_weather(weather)

    df = merge_plant_data(generation, weather)
    df = add_time_features(df)
    df = fill_missing_values(df)

    # Remove any remaining invalid rows.
    df = df.sort_values("DATE_TIME").reset_index(drop=True)

    # Time-based split: never randomly shuffle a forecasting dataset.
    n = len(df)
    train_end = int(n * 0.70)
    valid_end = int(n * 0.85)

    train = df.iloc[:train_end].copy()
    valid = df.iloc[train_end:valid_end].copy()
    test = df.iloc[valid_end:].copy()

    feature_cols = [
        "IRRADIATION",
        "AMBIENT_TEMPERATURE",
        "MODULE_TEMPERATURE",
        "DC_POWER",
        "hour_sin",
        "hour_cos",
        "day_sin",
        "day_cos",
    ]

    train_scaled, valid_scaled, test_scaled, scaler = scale_features(
        train, valid, test, feature_cols, method=scaling
    )

    # Keep target AC_POWER unscaled here so it is easy to evaluate in kW.
    # Save split files separately for model training.
    out_dir = PROCESSED_DIR / f"plant_{plant}"
    out_dir.mkdir(parents=True, exist_ok=True)

    train_scaled.to_csv(out_dir / "train.csv", index=False)
    valid_scaled.to_csv(out_dir / "validation.csv", index=False)
    test_scaled.to_csv(out_dir / "test.csv", index=False)

    # Also save a complete cleaned dataset.
    df.to_csv(out_dir / "cleaned_full.csv", index=False)

    return df, train_scaled, valid_scaled, test_scaled, scaler


if __name__ == "__main__":
    for plant in (1, 2):
        df, train, valid, test, scaler = process_plant(plant)
        print(f"Plant {plant}")
        print("Full:", df.shape)
        print("Train:", train.shape)
        print("Validation:", valid.shape)
        print("Test:", test.shape)


# --- Data quality validation ---
def validate_datetime_range(df, min_date=None, max_date=None):
    """Validate that DATE_TIME parses correctly and optionally falls in a requested range."""
    if "DATE_TIME" not in df.columns:
        raise ValueError("DATE_TIME column is required.")
    dt = pd.to_datetime(df["DATE_TIME"], errors="coerce")
    if dt.isna().any():
        raise ValueError(f"DATE_TIME contains {int(dt.isna().sum())} unparseable values.")
    if min_date is not None and dt.min() < pd.Timestamp(min_date):
        raise ValueError(f"DATE_TIME starts before expected range: {dt.min()}")
    if max_date is not None and dt.max() > pd.Timestamp(max_date):
        raise ValueError(f"DATE_TIME ends after expected range: {dt.max()}")
    return True
