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
* **Live Weather & Solar Telemetry (Open-Meteo):** Real-time solar irradiance (GHI in W/m²), ambient temperature (°C), cloud cover (%), and wind speed ingestion for both Region A (Bhadla) and Region B (Charanka) coordinates.
* **Resilient Dual-Tier Fallback & Caching:** 15-minute `localStorage` cache TTL with 8-second timeout. Gracefully cascades to cached telemetry or offline demo data with honest provenance badges (`Live weather`, `Cached weather data`, `Offline demo data`, `Manual input`).
* **Prototype & Simulation Input Flow:** Users can enter manual values or click *"⚡ Use live weather"* to dynamically compute real-time power and multi-day horizons.
* **Project Showcase UI:** Dedicated sections for architecture, datasets, transfer learning benchmarks, AI operational insights, executive report export, and research team profiles.

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

## 🚀 Live Deployment

### Option 1: Vercel (Team-Neutral URL for Group Submissions)
Deploying to Vercel provides a clean, neutral URL (e.g. `https://pvintelligence.vercel.app`) rather than a single member's username:

1. Sign in to [vercel.com](https://vercel.com) with GitHub.
2. Click **"Add New..."** &rarr; **"Project"** and select `PVIntelligence`.
3. The included `vercel.json` automatically sets `site/` as the public web root.
4. Set the project name (e.g., `pvintelligence` or `pv-intelligence`), then click **Deploy**.
5. Every `git push` to `main` will automatically trigger instant production updates.

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
