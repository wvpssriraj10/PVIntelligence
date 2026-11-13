# ☀️ PVIntelligence

> **AI-Driven Solar Power Forecasting using Transfer Learning & Explainable AI**  
*Capstone Project — School of Computer Science and Engineering (SCOPE), VIT-AP University*

---

## 📌 Overview
**PVIntelligence** is a solar forecasting platform built to predict photovoltaic (PV) generation using weather and plant data. The project focuses on practical decision support for solar operations by combining time-series forecasting, transfer learning, and explainable AI into a clean interactive dashboard.

The system is designed around a real-use case: a solar site with limited historical data can still get reliable forecasts by training a base model on a richer region and adapting it to a newer or smaller site. This reduces the need for years of data before a plant becomes operationally useful.

---

## ✨ Key Features
* **Time-Series Forecasting:** Stacked LSTM/GRU neural network for photovoltaic (PV) power prediction.
* **Transfer Learning:** Domain adaptation transferring representation weights from data-rich Region A (120 days) to data-scarce Region B (18 days), reducing data requirements by 80% with 53% lower validation RMSE.
* **Explainable AI (XAI):** SHAP (SHapley Additive exPlanations) feature attribution quantifying the marginal impact of irradiance, temperature, cloud cover, and cyclical time features.
* **Live Satellite Weather Telemetry (Open-Meteo):** Real-time global satellite weather auto-ingestion by city presets (Bengaluru, Chennai, Amaravati/VIT-AP, Hyderabad, Delhi, Mumbai, Bhadla, Charanka) or custom GPS coordinates.
* **Dynamic Forecast Horizon:** Configurable multi-day forecasting horizons (7 days, 10 days, 14 days) with instant total generation projection for viva demonstration.
* **Streamlined 5-Module Presentation UI:** Reorganized from 13 flat tabs into 5 logical modules with plain-English "Section Purpose" explainer banners for evaluators:
  1. `⚡ Live Forecast & Demo`: City presets, GPS auto-detect, customizable forecast days, and real-time generation curves.
  2. `🧠 Transfer Learning (Core ML)`: Region A base pre-training, fine-tuned adaptation, and empirical RMSE vs. training days proof.
  3. `🔍 Explainability & Diagnostics`: SHAP attribution bars, threshold-based fault scanner (soiling & clipping), and AI insights.
  4. `📊 Data & Regional Analytics`: Feature engineering, MinMax scalers, and Rajasthan vs. Gujarat climate comparison.
  5. `📄 Team & Architecture`: Printable executive audit report, student profiles, and end-to-end pipeline diagrams.
* **Resilient Dual-Tier Fallback & Caching:** 15-minute `localStorage` cache TTL with 8-second timeout. Gracefully cascades to cached telemetry or offline demo data with honest provenance badges (`Live weather`, `Cached weather data`, `Offline demo data`, `Manual input`).

---

## 👥 Contributors & Team Roles

| Contributor | Registration No. | Project Role | Primary Focus |
| :--- | :--- | :--- | :--- |
| **W V P S SRIRAJ** | `23BCE8414` | AI Deployment, XAI & Web Lead | Inference pipeline, model deployment, dashboard front-end, GitHub integration |
| **HARSH** | `23BCE8505` | Transfer Learning Specialist | Fine-tuning strategies, region adaptation, comparative benchmarking |
| **M JAHNAVI** | `23BCE8470` | Deep Learning Architect | Base model architecture, LSTM/GRU design, training and evaluation |
| **AASTHA SHARMA** | `23BCE9279` | Data Preparation Specialist | Cleaning, preprocessing, feature engineering, dataset organization |

---

## 🛠️ Tech Stack
* **Languages & Core:** Python 3.x, NumPy, Pandas
* **Machine Learning & Deep Learning:** TensorFlow / Keras, Scikit-learn
* **Explainability:** SHAP
* **Frontend / Dashboard:** HTML, CSS, JavaScript
* **Visualization:** Matplotlib, Plotly (project ecosystem), custom front-end charts
* **Datasets:** Solar generation & weather datasets for modeled PV regions

---

## 🏗️ System Architecture

```text
[ Weather & Solar Datasets ]
             │
             ▼
[ Data Preprocessing & Feature Engineering ]
             │
             ▼
[ Base Forecast Model Training (Region A) ]
             │
             ▼
[ Transfer Learning Fine-Tuning (Region B) ]
             │
             ▼
[ Forecast Inference + Explainability ]
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ XAI Insights ]   [ DCA Dashboard & Live Telemetry ]
```

---

## 🌐 Local Preview
The project includes a static web showcase in the `site/` folder. To run it locally:

```bash
cd PVIntelligence
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/site/index.html
```

The root `index.html` redirects to the site preview for convenience.

---

## 🚀 Live Deployment Sites

### Option 1: Vercel (Team-Neutral URL for Group Submissions)
Available at: [https://pvintelligence.vercel.app/](https://pvintelligence.vercel.app/)


### Option 2: GitHub Pages
Available at: [https://wvpssriraj10.github.io/PVIntelligence/](https://wvpssriraj10.github.io/PVIntelligence/)

---

## 📁 Project Structure

```text
PVIntelligence/
├── data/
│   ├── raw/                  # Raw source datasets
│   └── processed/            # Cleaned and preprocessed data per region
├── mock_data/                # Mock or demo solar/weather datasets
├── models/                   # Saved model artifacts and checkpoints
├── notebooks/                # EDA and experimentation notebooks
├── outputs/                  # Reports, plots, and generated artifacts
├── site/                     # Landing page and interactive frontend showcase
│   ├── index.html            # Main project website
│   ├── styles.css            # Styling and theme
│   ├── weather.js            # Live Open-Meteo API ingestion, caching & fallback
│   └── script.js             # Front-end logic and chart rendering
├── src/                      # Core Python training and inference logic
├── .gitignore                # Files ignored by Git
├── index.html                # Root redirect to the frontend site
├── pyproject.toml            # Python project config
├── README.md                 # Project documentation
├── requirements.txt          # Dependencies
├── setup.py                  # Package setup entry
└── test_*.py                 # Validation and regression checks
```

---

## 🧪 Current Demo Scope
This repository now includes both:
- the core machine learning forecasting pipeline and model code, and
- a presentation-focused website for showcasing the project, results, and team information.

The website is designed to communicate the main product story clearly to evaluators, faculty, and project reviewers without requiring a production deployment.

---

## ✅ Project Goal
The objective is to create a practical, explainable, AI-driven solar forecasting solution that can help optimize PV generation planning, improve forecasting accuracy, and make model behavior understandable for real-world solar operations.
