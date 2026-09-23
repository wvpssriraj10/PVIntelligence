# PVIntelligence — Web Dashboard

A single-page solar forecasting dashboard: landing, data input, data prep,
base model, transfer learning, forecasting dashboard, explainable AI,
anomaly analysis, region comparison, AI insights, report generation, about.

## Run it

No build step needed — just open `index.html` in a browser, or serve it:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Files

- `index.html` — the entire site (HTML, CSS, JS). Uses Chart.js from a CDN
  and the Figtree font from Google Fonts; everything else is self-contained.
- `favicon.ico` — site icon.
- `sitemap.xml`, `robots.txt` — SEO files for if/when this is hosted on a
  real domain (currently point at a placeholder `pvintelligence.example.com`
  — update to your actual domain before deploying).

## Notes

- All data (Region A/B history, forecasts, SHAP values, anomalies) is
  synthetic and hardcoded in the `DATA` object near the bottom of
  `index.html` — edit it there to swap in real numbers.
- Cookie consent and last-viewed page are stored in the browser's
  localStorage only; nothing is sent to a server.
