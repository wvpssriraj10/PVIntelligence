# ☀️ PVIntelligence

> **AI-Driven Solar Power Forecasting using Transfer Learning & Explainable AI**  
*Capstone Project — School of Computer Science and Engineering (SCOPE), VIT-AP University*

---

## 📌 Overview
**PVIntelligence** is a solar forecasting platform built to predict photovoltaic (PV) generation using weather and plant data. The project focuses on practical decision support for solar operations by combining time-series forecasting, transfer learning, and explainable AI into a clean interactive dashboard.

The system is designed around a real-use case: a solar site with limited historical data can still get reliable forecasts by training a base model on a richer region and adapting it to a newer or smaller site. This reduces the need for years of data before a plant becomes operationally useful.

---

## ✨ Key Features
* **Time-Series Forecasting:** LSTM/GRU-based forecasting pipeline for PV output prediction.
* **Transfer Learning:** Shared knowledge from a data-rich region is reused for a data-scarce region.
* **Explainable AI:** Model reasoning is surfaced through SHAP-style contribution analysis and forecast explanations.
* **Interactive Landing Page:** A modern front-end experience for project presentation, live summary cards, manual input simulation, and forecasting insights.
* **Prototype-Friendly Input Flow:** Users can enter values manually or simulate connected sensor/prototype readings and see generated power and forecast horizon.
* **Project Showcase UI:** Includes sections for product overview, model details, project team, technical details, and report generation.

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
[ XAI Insights ]   [ Web Showcase / Landing Page ]
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
