"""Inference pipeline for solar PV power forecasting.

Loads the trained Keras model and formats input features into 3D tensors
(samples, timesteps, features) for prediction.
"""

from pathlib import Path
import numpy as np
import pandas as pd

from src.preprocessing import (
    clean_generation,
    clean_weather,
    aggregate_generation,
    merge_plant_data,
    add_time_features,
    fill_missing_values,
)

PROJECT_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_DIR / "models" / "model_region_A.keras"

SEQUENCE_LENGTH = 4
FEATURES = [
    "DC_POWER",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
    "IRRADIATION",
    "hour",
    "minute",
    "day_of_week",
    "day_of_year",
    "month",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
]
TARGET = "AC_POWER"


class InferencePipeline:
    """Load model and preprocess raw sensor data for solar power forecasting."""

    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = Path(model_path)
        if self.model_path.exists():
            import tensorflow as tf
            self.model = tf.keras.models.load_model(self.model_path)
        else:
            self.model = None
            print(f"! Model not found at {self.model_path}")

    def _prepare_sequence(self, df: pd.DataFrame) -> np.ndarray:
        """Convert DataFrame to 3D tensor (1, timesteps, features)."""
        df = df.copy()
        df.columns = [c.strip() for c in df.columns]

        # Ensure datetime
        if "DATE_TIME" in df.columns:
            df["DATE_TIME"] = pd.to_datetime(df["DATE_TIME"], dayfirst=True, errors="coerce")

        # Add time features
        df = add_time_features(df)

        # Ensure all required features exist
        for f in FEATURES:
            if f not in df.columns:
                df[f] = 0.0

        # Select only required features in order
        data_x = df[FEATURES].values.astype(float)

        # Build sliding window sequence
        if len(data_x) < SEQUENCE_LENGTH:
            # Pad with zeros if not enough data
            padded = np.zeros((SEQUENCE_LENGTH, len(FEATURES)))
            padded[: len(data_x)] = data_x
            data_x = padded

        sequence = data_x[-SEQUENCE_LENGTH:].reshape(1, SEQUENCE_LENGTH, len(FEATURES))
        return sequence

    def predict(self, raw_data: dict | pd.DataFrame) -> float:
        """Predict AC power from raw sensor dict or DataFrame.

        Args:
            raw_data: dict with keys like temperature, humidity, light_irradiance
                      or a DataFrame with processed features.

        Returns:
            Predicted AC power in kW (float).
        """
        if self.model is None:
            return 0.0

        if isinstance(raw_data, dict):
            df = pd.DataFrame([raw_data])
        else:
            df = raw_data.copy() if isinstance(raw_data, pd.DataFrame) else pd.DataFrame([raw_data])

        sequence = self._prepare_sequence(df)
        prediction = self.model.predict(sequence, verbose=0).flatten()[0]
        return float(prediction)

    def predict_from_processed(self, df: pd.DataFrame) -> float:
        """Predict from already-prepared processed DataFrame.

        Expects df with all FEATURES columns and DATE_TIME.
        """
        if self.model is None:
            return 0.0
        sequence = self._prepare_sequence(df)
        prediction = self.model.predict(sequence, verbose=0).flatten()[0]
        return float(prediction)


if __name__ == "__main__":
    # Quick test with processed data
    plant1_path = PROJECT_DIR / "data" / "processed" / "plant_1" / "train.csv"
    if plant1_path.exists():
        df = pd.read_csv(plant1_path)
        pipeline = InferencePipeline()
        pred = pipeline.predict_from_processed(df.iloc[:10])
        print(f"Test prediction (first 10 rows): {pred:.4f} kW")