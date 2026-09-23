class LocalChart {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.ctx = canvas.getContext('2d');
    this.resize();
  }

  destroy() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize() {
    const parent = this.canvas.parentElement;
    const measuredWidth = this.canvas.getBoundingClientRect().width || (parent ? parent.clientWidth : 0) || this.canvas.clientWidth || 600;
    const width = Math.max(1, measuredWidth);
    const height = this.canvas.height || 220;
    const ratio = window.devicePixelRatio || 1;

    this.canvas.width = Math.max(1, width * ratio);
    this.canvas.height = Math.max(1, height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (width > 1) {
      this.render();
    }
  }

  render() {
    const config = this.config || {};
    const type = config.type || 'line';
    const data = config.data || { labels: [], datasets: [] };
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 16, right: 16, bottom: 30, left: 36 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    const labels = data.labels || [];
    const datasets = data.datasets || [];
    const values = datasets.flatMap((dataset) => dataset.data || []);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;

    if (type === 'bar') {
      const bars = datasets[0]?.data || [];
      const step = bars.length ? plotW / bars.length : 0;
      const barW = Math.max(12, step * 0.6);
      bars.forEach((value, index) => {
        const x = padding.left + step * index + (step - barW) / 2;
        const barH = ((value - min) / range) * plotH;
        const y = padding.top + plotH - barH;
        ctx.fillStyle = datasets[0].backgroundColor && Array.isArray(datasets[0].backgroundColor)
          ? datasets[0].backgroundColor[index % datasets[0].backgroundColor.length]
          : (datasets[0].backgroundColor || '#00a9d4');
        ctx.fillRect(x, y, barW, barH);
      });
    } else {
      datasets.forEach((dataset) => {
        const points = dataset.data || [];
        ctx.beginPath();
        points.forEach((value, index) => {
          const x = padding.left + (index / Math.max(points.length - 1, 1)) * plotW;
          const y = padding.top + plotH - ((value - min) / range) * plotH;
          if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = dataset.borderColor || '#00a9d4';
        ctx.lineWidth = dataset.borderDash ? 2 : 2.5;
        if (dataset.borderDash) ctx.setLineDash(dataset.borderDash);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    ctx.fillStyle = 'rgba(165, 189, 201, 0.9)';
    ctx.font = '12px sans-serif';
    labels.forEach((label, index) => {
      const x = padding.left + (index / Math.max(labels.length - 1, 1)) * plotW;
      ctx.fillText(String(label), x - 8, height - 10);
    });
  }
}

if (typeof window.Chart === 'undefined') {
  window.Chart = LocalChart;
}

const PAGES = [
  ['landing', 'Landing'],
  ['input', 'Plant & data input'],
  ['dashboard', 'Forecasting dashboard']
];

const SECONDARY_PAGES = [
  ['prep', 'Data preparation'],
  ['basemodel', 'Base model'],
  ['transfer', 'Transfer learning'],
  ['xai', 'Explainable AI'],
  ['anomaly', 'Anomaly analysis'],
  ['compare', 'Region comparison'],
  ['insights', 'AI insights'],
  ['report', 'Report generation']
];

const DATA = {
  A: {
    hours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    actual: [2, 9, 22, 34, 44, 50, 53, 52, 46, 36, 24, 11, 3],
    pred: [3, 10, 21, 33, 45, 51, 52, 50, 45, 37, 25, 12, 4],
    week: [510, 498, 522, 505, 480, 515, 530],
    cur: 38.4,
    peak: 61.2,
    wk7: 3560,
    days: '120',
    rows: [
      ['2026-04-01', '6', '112', '24.1', '28', '1.2'],
      ['2026-04-01', '12', '880', '33.5', '22', '41.3'],
      ['2026-04-01', '18', '95', '27.2', '31', '2.1']
    ]
  },
  B: {
    hours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    actual: [1, 7, 17, 27, 35, 40, 42, 41, 36, 28, 18, 8, 2],
    pred: [2, 8, 18, 28, 37, 41, 43, 42, 37, 29, 19, 9, 3],
    week: [402, 388, 415, 398, 370, 405, 420],
    cur: 29.1,
    peak: 47.8,
    wk7: 2798,
    days: '18',
    rows: [
      ['2026-08-01', '6', '98', '20.5', '41', '0.9'],
      ['2026-08-01', '12', '760', '28.9', '38', '33.2'],
      ['2026-08-01', '18', '80', '23.1', '44', '1.6']
    ]
  }
};

const nav = document.getElementById('nav');
const footerNav = document.getElementById('footerNav');
const rail = document.getElementById('rail');
const menubtn = document.getElementById('menubtn');

PAGES.forEach(([id, label]) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.dataset.id = id;
  btn.addEventListener('click', () => go(id));
  nav.appendChild(btn);
});

if (footerNav) {
  SECONDARY_PAGES.forEach(([id, label]) => {
    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = label;
    link.className = 'footer-link';
    link.addEventListener('click', () => go(id));
    footerNav.appendChild(link);
  });
}

function refreshCharts() {
  if (dayChart) dayChart.resize();
  if (weekChart) weekChart.resize();
  if (lossChart) lossChart.resize();
  if (tlChart) tlChart.resize();
  if (compChart) compChart.resize();
  if (cloudHist) cloudHist.resize();
}

function go(id) {
  document.querySelectorAll('.section').forEach((section) => {
    section.classList.toggle('active', section.id === id);
  });

  document.querySelectorAll('#nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.id === id);
  });

  rail.classList.remove('open');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshCharts();
    });
  });

  try {
    localStorage.setItem('pv_last_page', id);
  } catch (error) { }

  try {
    const views = JSON.parse(localStorage.getItem('pv_views') || '{}');
    views[id] = (views[id] || 0) + 1;
    localStorage.setItem('pv_views', JSON.stringify(views));
  } catch (error) { }
}

menubtn.addEventListener('click', () => {
  rail.classList.toggle('open');
});

function closeCookie() {
  document.getElementById('cookieBanner').style.display = 'none';
  try {
    localStorage.setItem('pv_cookie', '1');
  } catch (error) { }
}

const regionSelect = document.getElementById('regionSel');

function setRegion(region) {
  regionSelect.value = region;
  const d = DATA[region];

  document.getElementById('histTitle').textContent = `${region === 'A' ? 'Region A' : 'Region B'} — history sample`;
  document.getElementById('histBadge').textContent = `${d.days} days loaded`;
  document.getElementById('dashRegionLabel').textContent = `${region === 'A' ? 'Region A' : 'Region B'} — current output and forecasts.`;
  document.getElementById('curKw').textContent = `${d.cur} kW`;
  document.getElementById('peakKw').textContent = `${d.peak} kW`;
  document.getElementById('wk7').textContent = `${d.wk7.toLocaleString()} kWh`;

  const table = document.getElementById('histTable');
  table.innerHTML = `
    <tr>
      <th>Date</th>
      <th>Hour</th>
      <th>GHI</th>
      <th>Temp °C</th>
      <th>Cloud %</th>
      <th>kW</th>
    </tr>
    ${d.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
  `;

  updateCharts(region);
}

regionSelect.addEventListener('change', (event) => {
  setRegion(event.target.value);
});

let dayChart;
let weekChart;
let lossChart;
let tlChart;
let compChart;
let cloudHist;

function baseOpts(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#edf6fb' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#a5bdc9' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#a5bdc9' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    },
    ...extra
  };
}

function updateCharts(region) {
  const d = DATA[region];

  if (dayChart) dayChart.destroy();
  dayChart = new Chart(document.getElementById('dayChart'), {
    type: 'line',
    data: {
      labels: d.hours,
      datasets: [
        { label: 'Actual', data: d.actual, borderColor: '#00a9d4', backgroundColor: 'transparent', tension: 0.3 },
        { label: 'Predicted', data: d.pred, borderColor: '#f7b955', borderDash: [5, 4], backgroundColor: 'transparent', tension: 0.3 }
      ]
    },
    options: baseOpts()
  });
  requestAnimationFrame(() => dayChart.resize());

  if (weekChart) weekChart.destroy();
  weekChart = new Chart(document.getElementById('weekChart'), {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'kWh',
        data: d.week,
        backgroundColor: '#0077a8'
      }]
    },
    options: baseOpts()
  });
  requestAnimationFrame(() => weekChart.resize());
}

window.addEventListener('DOMContentLoaded', () => {
  setRegion('A');
  go('landing');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshCharts();
    });
  });

  lossChart = new Chart(document.getElementById('lossChart'), {
    type: 'line',
    data: {
      labels: [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      datasets: [
        { label: 'Train RMSE', data: [0.45, 0.28, 0.19, 0.13, 0.09, 0.07, 0.055, 0.045, 0.038, 0.032, 0.028], borderColor: '#00a9d4', tension: 0.3 },
        { label: 'Val RMSE', data: [0.48, 0.32, 0.23, 0.17, 0.13, 0.10, 0.085, 0.072, 0.063, 0.056, 0.051], borderColor: '#ff6b6b', tension: 0.3 }
      ]
    },
    options: baseOpts({
      plugins: {
        title: { display: true, text: 'Training loss curve', color: '#edf6fb' }
      }
    })
  });

  tlChart = new Chart(document.getElementById('tlChart'), {
    type: 'bar',
    data: {
      labels: ['Scratch', 'Frozen', 'Fine-tuned'],
      datasets: [{
        label: 'RMSE (kW)',
        data: [14.8, 11.2, 6.9],
        backgroundColor: ['#ff6b6b', '#f7b955', '#2ad7a0']
      }]
    },
    options: baseOpts({
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'RMSE by strategy', color: '#edf6fb' }
      }
    })
  });
  requestAnimationFrame(() => tlChart.resize());

  compChart = new Chart(document.getElementById('compChart'), {
    type: 'bar',
    data: {
      labels: ['Avg output', 'RMSE', 'MAE', 'Confidence'],
      datasets: [
        { label: 'Region A', data: [512.4, 5.8, 4.1, 94.1], backgroundColor: '#00a9d4' },
        { label: 'Region B', data: [398.7, 6.9, 4.9, 87.3], backgroundColor: '#0077a8' }
      ]
    },
    options: baseOpts()
  });
  requestAnimationFrame(() => compChart.resize());

  cloudHist = new Chart(document.getElementById('cloudHist'), {
    type: 'bar',
    data: {
      labels: ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70+'],
      datasets: [{
        label: 'Days',
        data: [8, 14, 22, 19, 12, 7, 4, 2],
        backgroundColor: '#00a9d4'
      }]
    },
    options: baseOpts({
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Cloud cover distribution', color: '#edf6fb' }
      }
    })
  });
  requestAnimationFrame(() => cloudHist.resize());

  const shap = [
    ['Irradiance (GHI)', 6.8],
    ['Cloud cover', -3.2],
    ['Ambient temperature', -1.1],
    ['Hour of day', 2.4],
    ['Panel tilt efficiency', 0.9],
    ['Humidity', -0.6],
    ['Wind speed', 0.3]
  ];

  const max = Math.max(...shap.map(([_, value]) => Math.abs(value)));
  document.getElementById('shapBars').innerHTML = shap.map(([feature, value]) => {
    const pct = Math.abs(value) / max * 50;
    const positive = value >= 0;
    const color = positive ? '#2ad7a0' : '#ff6b6b';
    const left = positive ? 50 : 50 - pct;
    const width = pct;

    return `
      <div class="dbar">
        <span class="muted">${feature}</span>
        <div class="dtrack">
          <div class="dfill" style="left:${left}%;width:${width}%;background:${color};"></div>
        </div>
      </div>
    `;
  }).join('');

  renderAnomalies(25);

  const insights = [
    ['Anomaly', 'danger', 'High cloud cover on Aug 15 reduced Region A generation by roughly 34% versus forecast.'],
    ['Model performance', 'success', 'Region B needed 80% less training data after transfer learning, matching Region A\'s RMSE within 1.1 kW.'],
    ['Degradation', 'warning', 'Panel efficiency in Region A shows a mild downward drift over the last 20 days, consistent with soiling.'],
    ['Seasonal pattern', 'success', 'Region B\'s afternoon peak lags Region A\'s by roughly 40 minutes due to longitude offset.'],
    ['Model performance', 'success', 'Forecast confidence drops below 85% whenever cloud cover exceeds 60%, across both regions.'],
    ['Pattern', 'success', 'Weekend generation shows no significant deviation from weekday patterns.']
  ];

  document.getElementById('insightList').innerHTML = insights.map(([label, badgeType, text]) => `
    <div class="card">
      <span class="badge ${badgeType}">${label}</span>
      <div style="margin-top: 10px; color: var(--muted);">${text}</div>
    </div>
  `).join('');

  document.getElementById('reportText').textContent = buildReport();
});

function renderAnomalies(threshold) {
  document.getElementById('threshOut').textContent = threshold;

  const all = [
    ['2026-08-14 11:00', 'Region A', 42.1, 28.4, -32.5, 'Medium', 'Partial shading / soiling'],
    ['2026-08-15 13:00', 'Region A', 51.3, 33.9, -33.9, 'High', 'Cloud cover spike (unmodeled)'],
    ['2026-08-17 09:00', 'Region B', 30.2, 19.1, -36.8, 'High', 'Inverter under-performance'],
    ['2026-08-18 15:00', 'Region A', 46.7, 30.2, -35.3, 'Medium', 'Sensor drift suspected']
  ];

  const flagged = all.filter((item) => Math.abs(item[4]) >= threshold);

  document.getElementById('anomList').innerHTML = flagged.length
    ? flagged.map(([time, region, expected, actual, delta, severity, cause]) => `
        <div class="card">
          <div class="section-head" style="margin-bottom: 8px;">
            <strong>${time}</strong>
            <span class="badge ${severity === 'High' ? 'danger' : 'warning'}">${severity}</span>
          </div>
          <div style="color: var(--muted);">
            ${region} · expected ${expected} kW, got ${actual} kW (${delta}%) — likely cause: ${cause}
          </div>
        </div>
      `).join('')
    : '<div class="card"><div style="color: var(--muted);">No anomalies exceed the current threshold.</div></div>';
}

function buildReport() {
  return [
    'PVIntelligence — Forecasting Report',
    `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    '--------------------------------------------------',
    'KEY METRICS',
    '  Avg Daily Output (kWh): A=512.4 | B=398.7',
    '  Forecast RMSE (kW): A=5.8 | B=6.9',
    '  Data History (days): A=120 | B=18',
    '--------------------------------------------------',
    'AI INSIGHTS',
    '  [Anomaly] High cloud cover on Aug 15 reduced Region A generation by ~34%.',
    '  [Model Performance] Region B needed 80% less data after transfer learning.',
    '--------------------------------------------------',
    'Report generated by PVIntelligence (demo — mock data).'
  ].join('\n');
}

function downloadReport() {
  const blob = new Blob([buildReport()], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'pvintelligence_report.txt';
  link.click();
}

const slider = document.getElementById('threshSlider');
if (slider) {
  slider.addEventListener('input', (event) => renderAnomalies(event.target.value));
}

const capSlider = document.getElementById('capSlider');
if (capSlider) {
  capSlider.addEventListener('input', (event) => {
    document.getElementById('capOut').textContent = event.target.value;
  });
}

const tiltSlider = document.getElementById('tiltSlider');
if (tiltSlider) {
  tiltSlider.addEventListener('input', (event) => {
    document.getElementById('tiltOut').textContent = event.target.value;
  });
}

function updateLiveSummary() {
  const irradiance = Number(document.getElementById('irradianceInput')?.value || 780);
  const temp = Number(document.getElementById('tempInput')?.value || 31);
  const capacity = Number(document.getElementById('capacityInput')?.value || 650);
  const days = Number(document.getElementById('forecastDaysInput')?.value || 5);

  const adjustedIrradiance = Math.max(0, irradiance * (1 - Math.max(0, temp - 35) * 0.006));
  const outputKw = (adjustedIrradiance / 1000) * (capacity * 0.75);
  const dailyEnergyKwh = outputKw * 6.5;
  const projectedKwh = dailyEnergyKwh * Math.max(1, days);

  const generated = `${outputKw.toFixed(1)} kW`;
  const forecast = `${projectedKwh.toFixed(1)} kWh`;
  const forecastDays = `${days} ${days === 1 ? 'day' : 'days'}`;

  const generatedEl = document.getElementById('summaryGenerated');
  const daysEl = document.getElementById('summaryDays');
  const forecastEl = document.getElementById('summaryForecast');
  const liveGeneratedEl = document.getElementById('liveGenerated');
  const liveDaysEl = document.getElementById('liveDays');
  const liveForecastEl = document.getElementById('liveForecast');
  const sourceEl = document.getElementById('sourceStatus');

  if (generatedEl) generatedEl.textContent = generated;
  if (daysEl) daysEl.textContent = forecastDays;
  if (forecastEl) forecastEl.textContent = forecast;
  if (liveGeneratedEl) liveGeneratedEl.textContent = generated;
  if (liveDaysEl) liveDaysEl.textContent = forecastDays;
  if (liveForecastEl) liveForecastEl.textContent = forecast;
  if (sourceEl) sourceEl.textContent = 'Manual input';
}

window.addEventListener('load', () => {
  updateLiveSummary();
});

window.addEventListener('resize', () => {
  refreshCharts();
});

const cookieBanner = document.getElementById('cookieBanner');
try {
  if (localStorage.getItem('pv_cookie')) {
    cookieBanner.style.display = 'none';
  }
} catch (error) { }

const splash = document.getElementById('splash-container');
if (splash) {
  setTimeout(() => {
    splash.classList.add('hidden');

    setTimeout(() => {
      splash.remove();
    }, 500);
  }, 1800);
}
