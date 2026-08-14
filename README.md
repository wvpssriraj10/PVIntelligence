# ☀️ PVIntelligence

> **AI-Driven Solar Power Forecasting using Transfer Learning & Explainable AI**  
*Capstone Project — School of Computer Science and Engineering (SCOPE), VIT-AP University*[cite: 1]

---

## 📌 Overview
**PVIntelligence** is a deep learning time-series forecasting system designed to predict solar photovoltaic (PV) power generation using daily weather variables (temperature, humidity, cloud cover, and solar irradiance).

To solve the challenge of **data scarcity in newly built solar farms**, PVIntelligence utilizes **Transfer Learning**. A base model is trained on a data-rich location (Region A) and fine-tuned for a data-sparse location (Region B), achieving high forecasting accuracy without requiring years of historical records.

---

## ✨ Key Features
* **Time-Series Deep Learning:** Custom LSTM/GRU models designed for complex temporal weather patterns.
* **Domain Adaptation (Transfer Learning):** Reuses pre-trained model knowledge to adapt quickly to new regions with limited dataset history.
* **Explainable AI (XAI):** Integrated **SHAP** (Shapley Additive exPlanations) to explain *why* predictions change based on weather inputs.
* **Interactive Web Dashboard:** User-friendly **Streamlit** interface allowing users to input weather parameters and view real-time prediction charts.

---

## 👥 Contributors & Team Roles

| Contributor | Registration No. | Project Role | Primary Focus |
| :--- | :--- | :--- | :--- |
| **W V P S SRIRAJ** | `23BCE8414` | AI Deployment, XAI & Web Lead | Inference pipeline, SHAP XAI integration, Streamlit dashboard, GitHub integration |
| **HARSH** | `23BCE8505` | Data Preparation Specialist | Data cleaning, pipeline management, feature engineering, timestamp alignment |
| **M JAHNAVI** | `23BCE8470` | Deep Learning Architect | Model architecture (LSTM/GRU), base model training on Region A, error metrics |
| **AASTHA SHARMA** | `23BCE9279` | Transfer Learning Specialist | Layer freezing, fine-tuning on Region B dataset, comparative benchmarking |

---

## 🛠️ Tech Stack
* **Languages & Core:** Python 3.x, NumPy, Pandas
* **Machine Learning & Deep Learning:** TensorFlow / Keras, Scikit-learn
* **Explainability:** SHAP
* **Visualization & Web Deployment:** Streamlit, Plotly, Matplotlib
* **Datasets:** NREL PVDAQ / NSRDB Solar & Weather Datasets

---

## 🏗️ System Architecture

```text
[ Weather & Solar Datasets ] 
             │
             ▼
[ Data Preprocessing & Scaling (Region A & B) ]
             │
             ▼
[ Base Deep Learning Model Training (Region A) ]
             │
             ▼
[ Transfer Learning Fine-Tuning (Region B) ]
             │
             ▼
[ Real-Time Inference Pipeline (predict.py) ]
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ SHAP XAI ]   [ Streamlit Web App ]
