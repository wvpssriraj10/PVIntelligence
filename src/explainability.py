"""SHAP explainability module for solar PV forecasting models.

Provides feature importance scores and visualizations (summary/waterfall plots)
using the SHAP library for deep learning models.
"""

from pathlib import Path
import numpy as np
import pandas as pd

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False


PROJECT_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_DIR / "models" / "model_region_A.keras"


class SolarExplainer:
    """SHAP explainer for solar power forecasting models.

    Uses GradientExplainer for Keras/TensorFlow models to compute
    feature importance scores and generate explanation plots.
    """

    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = Path(model_path)
        self.model = None
        self.explainer = None

        if self.model_path.exists():
            import tensorflow as tf
            self.model = tf.keras.models.load_model(self.model_path)

        if HAS_SHAP and self.model is not None:
            self.explainer = shap.GradientExplainer(self.model, self._dummy_background())

    @staticmethod
    def _dummy_background(n_samples: int = 100) -> np.ndarray:
        """Generate dummy background data for SHAP initialization."""
        np.random.seed(42)
        return np.random.randn(n_samples, 13)

    def explain(self, df: pd.DataFrame) -> dict:
        """Calculate SHAP values for input data.

        Args:
            df: DataFrame with feature columns matching model input.

        Returns:
            Dictionary with SHAP values and base values.
        """
        if self.explainer is None or self.model is None:
            return {"values": np.array([]), "base_values": 0.0}

        # Ensure required features
        features = [
            "DC_POWER", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE",
            "IRRADIATION", "hour", "minute", "day_of_week",
            "day_of_year", "month", "hour_sin", "hour_cos", "day_sin", "day_cos"
        ]
        for f in features:
            if f not in df.columns:
                df[f] = 0.0

        subset = df[features].values[-1:]  # last row
        shap_values = self.explainer.shap_values(subset)

        return {
            "values": shap_values[:, 0] if isinstance(shap_values, tuple) else shap_values[0],
            "base_values": float(self.explainer.expected_value)
        }

    def summary_plot(self, df: pd.DataFrame, save_path: Path | None = None) -> None:
        """Generate SHAP summary plot as Matplotlib figure.

        Args:
            df: DataFrame with feature columns.
            save_path: Optional path to save the figure.
        """
        if not HAS_SHAP or self.model is None:
            print("⚠️ SHAP or model not available for summary plot.")
            return

        features = [
            "DC_POWER", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE",
            "IRRADIATION", "hour", "minute", "day_of_week",
            "day_of_year", "month", "hour_sin", "hour_cos", "day_sin", "day_cos"
        ]
        for f in features:
            if f not in df.columns:
                df[f] = 0.0

        subset = df[features].values[-10:]
        try:
            shap.summary_plot(
                self.explainer.shap_values(subset),
                features,
                plot_type="bar",
                show=False
            )
            import matplotlib.pyplot as plt
            if save_path:
                plt.savefig(save_path, bbox_inches="tight")
                plt.close()
            else:
                plt.show()
        except Exception as e:
            print(f"⚠️ SHAP summary plot failed: {e}")

    def waterfall_plot(self, df: pd.DataFrame, save_path: Path | None = None) -> None:
        """Generate SHAP waterfall plot for a single prediction.

        Args:
            df: DataFrame with feature columns.
            save_path: Optional path to save the figure.
        """
        if not HAS_SHAP or self.model is None:
            print("⚠️ SHAP or model not available for waterfall plot.")
            return

        features = [
            "DC_POWER", "AMBIENT_TEMPERATURE", "MODULE_TEMPERATURE",
            "IRRADIATION", "hour", "minute", "day_of_week",
            "day_of_year", "month", "hour_sin", "hour_cos", "day_sin", "day_cos"
        ]
        for f in features:
            if f not in df.columns:
                df[f] = 0.0

        subset = df[features].values[-1:]
        try:
            shap_values = self.explainer.shap_values(subset)
            base = float(self.explainer.expected_value)
            import matplotlib.pyplot as plt
            shap.waterfall_plot(
                shap.Explanation(
                    values=shap_values[0] if isinstance(shap_values, tuple) else shap_values,
                    base_values=base,
                    data=subset[0],
                    feature_names=features
                ),
                show=False
            )
            if save_path:
                plt.savefig(save_path, bbox_inches="tight")
                plt.close()
            else:
                plt.show()
        except Exception as e:
            print(f"⚠️ SHAP waterfall plot failed: {e}")


if __name__ == "__main__":
    # Quick test
    plant1_path = PROJECT_DIR / "data" / "processed" / "plant_1" / "train.csv"
    if plant1_path.exists():
        df = pd.read_csv(plant1_path)
        explainer = SolarExplainer()
        result = explainer.explain(df.iloc[:5])
        print(f"SHAP explainability test - base_value: {result['base_values']:.4f}")
        print(f"SHAP values shape: {result['values'].shape}")