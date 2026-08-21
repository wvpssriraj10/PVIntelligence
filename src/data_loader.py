from pathlib import Path
import pandas as pd

RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"

def load_csv(filename: str) -> pd.DataFrame:
    """Load a CSV file from data/raw."""
    path = RAW_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_csv(path)

def load_parquet(filename: str) -> pd.DataFrame:
    """Load a Parquet file from data/raw."""
    path = RAW_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_parquet(path)

def load_generation_and_weather(plant: int):
    """Load the generation and weather files for Plant 1 or Plant 2."""
    if plant not in (1, 2):
        raise ValueError("plant must be 1 or 2")

    generation = load_csv(f"Plant_{plant}_Generation_Data.csv")
    weather = load_csv(f"Plant_{plant}_Weather_Sensor_Data.csv")
    return generation, weather

if __name__ == "__main__":
    for plant in (1, 2):
        generation, weather = load_generation_and_weather(plant)
        print(f"Plant {plant}: generation={generation.shape}, weather={weather.shape}")
