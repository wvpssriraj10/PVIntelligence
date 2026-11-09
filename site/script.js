/* ============================================================
   PVIntelligence — script.js v3.1 (Glitch-free & Resilient)
   Consistent data · responsive canvas · safe hover · accurate stats
   ============================================================ */

'use strict';

/* ---- HELPERS ---------------------------------------------- */
function niceStep(rough) {
  if (!rough || rough <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  if (f <= 1) return pow;
  if (f <= 2) return 2 * pow;
  if (f <= 5) return 5 * pow;
  return 10 * pow;
}

function fmtVal(v) {
  const a = Math.abs(v);
  if (a >= 10000) return (v / 1000).toFixed(0) + 'k';
  if (a >= 1000)  return (v / 1000).toFixed(1) + 'k';
  if (Math.abs(v - Math.round(v)) < 0.001) return String(Math.round(v));
  return v.toFixed(1);
}

function fmtKw(v) { return v.toFixed(1) + ' kW'; }

/* ---- LOCAL CHART CLASS ------------------------------------ */
class LocalChart {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this._tooltip = null;
    this._mx = null;
    this.resize();
    this._bindHover();
  }

  destroy() {
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.removeEventListener('mousemove', this._onMove);
      this.canvas.removeEventListener('mouseleave', this._onLeave);
    }
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parseInt(this.canvas.getAttribute('height')) || 220;
    if (w <= 10) return; // Hidden section (display: none), don't set dummy sizes
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._dw = w;
    this._dh = h;

    this.render();
  }

  _bindHover() {
    this._onMove = (e) => {
      const type = this.config.type || 'line';
      if (type !== 'line') return;
      const rect = this.canvas.getBoundingClientRect();
      this._mx = e.clientX - rect.left;
      this.render();
    };
    this._onLeave = () => { this._mx = null; this.render(); };
    this.canvas.addEventListener('mousemove', this._onMove);
    this.canvas.addEventListener('mouseleave', this._onLeave);
  }

  render() {
    if (!this.ctx || !this._dw || this._dw <= 10) return;
    const ctx      = this.ctx;
    const W        = this._dw;
    const H        = this._dh;
    const type     = this.config.type || 'line';
    const data     = this.config.data || { labels: [], datasets: [] };
    const labels   = data.labels || [];
    const datasets = data.datasets || [];
    const title    = this.config.options?.plugins?.title?.text || '';

    ctx.clearRect(0, 0, W, H);

    const pad = { top: title ? 32 : 22, right: 20, bottom: 42, left: 52 };
    const pw  = Math.max(10, W - pad.left - pad.right);
    const ph  = Math.max(10, H - pad.top - pad.bottom);

    /* Y range */
    const allVals = datasets.flatMap(d => d.data || []);
    const rawMin  = Math.min(...allVals, 0);
    const rawMax  = Math.max(...allVals, 1);
    const step    = niceStep((rawMax - rawMin) / 4);
    const yMin    = Math.floor(rawMin / step) * step;
    const yMax    = Math.ceil(rawMax  / step) * step;
    const yRange  = yMax - yMin || 1;

    const toXLine = (i) => pad.left + (i / Math.max(labels.length - 1, 1)) * pw;
    const toXBar  = (i) => pad.left + (i + 0.5) * (pw / labels.length);
    const toY     = (v) => pad.top + ph - ((v - yMin) / yRange) * ph;

    /* Title */
    if (title) {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.font = 'bold 12px Figtree, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, pad.left, 16);
    }

    /* Horizontal gridlines + y-axis labels */
    for (let v = yMin; v <= yMax + step * 0.001; v += step) {
      const y = toY(v);
      ctx.strokeStyle = '#1c1c1c';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();

      ctx.fillStyle = '#9b9b9b';
      ctx.font = '11px Figtree, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(fmtVal(v), pad.left - 6, y + 4);
    }

    /* X-axis labels */
    ctx.fillStyle = '#9b9b9b';
    ctx.font = '11px Figtree, sans-serif';
    ctx.textAlign = 'center';
    const xStep = Math.max(1, Math.ceil(labels.length / 8));
    labels.forEach((lbl, i) => {
      if (i % xStep !== 0 && i !== labels.length - 1) return;
      const x = type === 'bar' ? toXBar(i) : toXLine(i);
      ctx.fillText(String(lbl), x, H - 10);
    });

    /* ---- BAR CHART ---------------------------------------- */
    if (type === 'bar') {
      const totalDs = datasets.length;
      const barW = (pw / labels.length) * 0.65;
      const vals0 = datasets[0]?.data || [];
      const maxV = Math.max(...vals0);
      const minV = Math.min(...vals0);
      const avg  = vals0.reduce((a, b) => a + b, 0) / (vals0.length || 1);

      datasets.forEach((ds, di) => {
        const vals = ds.data || [];
        const bw = totalDs > 1 ? barW / totalDs - 2 : barW;

        vals.forEach((v, i) => {
          const cx   = pad.left + (i + 0.5) * (pw / vals.length);
          const x    = totalDs > 1 ? cx - barW / 2 + di * (bw + 2) : cx - bw / 2;
          const barH = Math.max(2, ((v - yMin) / yRange) * ph);
          const y    = toY(v);

          /* Colour */
          let color = Array.isArray(ds.backgroundColor)
            ? ds.backgroundColor[i % ds.backgroundColor.length]
            : (ds.backgroundColor || '#006397');

          if (totalDs === 1) {
            if (v === maxV) color = '#22d3a4';
            else if (v === minV) color = '#f4a942';
          }

          /* Rounded top bar */
          const r = Math.min(4, bw / 2);
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + bw - r, y);
          ctx.arcTo(x + bw, y, x + bw, y + r, r);
          ctx.lineTo(x + bw, y + barH);
          ctx.lineTo(x, y + barH);
          ctx.arcTo(x, y, x + r, y, r);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();

          /* Value label above bar */
          if (totalDs === 1) {
            ctx.fillStyle = 'rgba(255,255,255,.6)';
            ctx.font = '10px Figtree, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(fmtVal(v), cx, y - 4);
          }
        });
      });

      /* Dashed avg line (only for single dataset) */
      if (totalDs === 1 && this.config.options?.showAvg !== false) {
        const avgY = toY(avg);
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(pad.left, avgY); ctx.lineTo(pad.left + pw, avgY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#9b9b9b'; ctx.font = '10px Figtree, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('avg', pad.left + pw + 3, avgY + 4);
      }

      /* Bar legend if multiple datasets */
      if (totalDs > 1) {
        let lx = pad.left + pw;
        datasets.slice().reverse().forEach(ds => {
          const label = ds.label; if (!label) return;
          ctx.font = '10px Figtree, sans-serif';
          const lw = ctx.measureText(label).width;
          lx = lx - lw - 20;
          ctx.fillStyle = ds.backgroundColor || '#fff';
          ctx.fillRect(lx, pad.top - 14, 8, 8);
          ctx.fillText(label, lx + 12, pad.top - 7);
        });
      }
    }

    /* ---- LINE CHART --------------------------------------- */
    if (type === 'line') {
      datasets.forEach((ds, di) => {
        const pts = ds.data || [];
        const coords = pts.map((v, i) => ({ x: toXLine(i), y: toY(v) }));
        const color  = ds.borderColor || '#006397';
        const dashed = !!ds.borderDash;

        /* Area fill under first dataset */
        if (di === 0 && coords.length > 1 && !dashed) {
          const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
          grad.addColorStop(0, 'rgba(0,150,214,.35)');
          grad.addColorStop(1, 'rgba(0,150,214,0)');
          ctx.beginPath();
          ctx.moveTo(coords[0].x, pad.top + ph);
          coords.forEach(({ x, y }) => ctx.lineTo(x, y));
          ctx.lineTo(coords[coords.length - 1].x, pad.top + ph);
          ctx.closePath();
          ctx.fillStyle = grad; ctx.fill();
        }

        /* Line */
        ctx.beginPath();
        coords.forEach(({ x, y }, i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.strokeStyle = color;
        ctx.lineWidth = dashed ? 1.5 : 2.5;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        if (dashed) ctx.setLineDash(ds.borderDash);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Dots on first dataset */
        if (!dashed) {
          coords.forEach(({ x, y }) => {
            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
          });
        }
      });

      /* Peak marker on day chart (first dataset) */
      const d0 = datasets[0]?.data || [];
      if (d0.length > 0 && this.config._showPeak) {
        const maxI = d0.indexOf(Math.max(...d0));
        const px   = toXLine(maxI);
        const py   = toY(d0[maxI]);
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3a4'; ctx.fill();
        ctx.strokeStyle = 'rgba(34,211,164,.4)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#22d3a4'; ctx.font = 'bold 10px Figtree, sans-serif'; ctx.textAlign = 'center';
        const labelY = Math.max(14, py - 12);
        ctx.fillText('Peak ' + fmtKw(d0[maxI]), px, labelY);
      }

      /* Hover crosshair */
      if (this._mx !== null && labels.length > 1) {
        const idx  = Math.round((this._mx - pad.left) / (pw / (labels.length - 1)));
        const cidx = Math.max(0, Math.min(labels.length - 1, idx));
        const cx   = toXLine(cidx);

        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx, pad.top); ctx.lineTo(cx, pad.top + ph); ctx.stroke();
        ctx.setLineDash([]);

        /* Tooltip */
        const lines  = datasets.map(ds => ({ label: ds.label || '', val: (ds.data || [])[cidx], color: ds.borderColor || '#fff' }));
        const tw     = 114;
        const th     = 14 + lines.length * 18;
        const tx     = cx + tw + 12 > W - pad.right ? cx - tw - 10 : cx + 8;
        const ty     = pad.top + 6;

        ctx.fillStyle = 'rgba(20,20,20,.95)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(tx, ty, tw, th, 6);
        } else {
          ctx.rect(tx, ty, tw, th);
        }
        ctx.fill(); ctx.stroke();

        ctx.font = 'bold 10px Figtree, sans-serif';
        ctx.fillStyle = '#9b9b9b'; ctx.textAlign = 'left';
        ctx.fillText(String(labels[cidx]), tx + 8, ty + 13);
        lines.forEach(({ label, val, color }, li) => {
          ctx.fillStyle = color;
          ctx.font = '10px Figtree, sans-serif';
          ctx.fillText((label || 'Val') + ': ' + (val !== undefined ? fmtKw(val) : '—'), tx + 8, ty + 13 + (li + 1) * 16);
        });
      }

      /* Legend — top right */
      const hasLabels = datasets.some(d => d.label);
      if (hasLabels) {
        let lx = pad.left + pw;
        datasets.slice().reverse().forEach(ds => {
          const label = ds.label; if (!label) return;
          ctx.font = '10px Figtree, sans-serif';
          const lw = ctx.measureText(label).width;
          lx = lx - lw - 22;
          ctx.fillStyle = ds.borderColor || '#fff';
          ctx.fillText(ds.borderDash ? '┄ ' : '● ', lx - 2, pad.top - 8);
          ctx.fillText(label, lx + 10, pad.top - 8);
        });
      }
    }
  }
}

if (typeof window.Chart === 'undefined') window.Chart = LocalChart;

/* ============================================================
   DATA — consistent, 650 kWp plant, 7-day everywhere
   ============================================================ */
const DATA = {
  A: {
    hours:  ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    actual: [15, 65, 180, 290, 370, 430, 480, 465, 400, 310, 190, 80, 20],
    pred:   [18, 68, 175, 285, 368, 428, 478, 462, 398, 308, 192, 82, 22],
    week:   [2450, 2380, 2510, 2420, 2290, 2480, 2550],
    cur:    380,
    peak:   487,
    wk7:    17300,
    days:   '120',
    rows: [
      ['2026-04-01', '06:00', '112', '24.1', '28', '12.8'],
      ['2026-04-01', '12:00', '880', '33.5', '22', '411.3'],
      ['2026-04-01', '18:00', '95',  '27.2', '31', '18.4'],
      ['2026-04-02', '06:00', '98',  '23.8', '31', '11.6'],
      ['2026-04-02', '12:00', '920', '34.1', '19', '432.5'],
      ['2026-04-02', '18:00', '102', '28.0', '28', '19.2'],
    ]
  },
  B: {
    hours:  ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    actual: [10, 48, 140, 225, 285, 335, 365, 350, 300, 230, 140, 60, 15],
    pred:   [12, 52, 145, 230, 290, 338, 368, 352, 303, 232, 142, 62, 17],
    week:   [1850, 1790, 1920, 1840, 1720, 1880, 1950],
    cur:    285,
    peak:   365,
    wk7:    12950,
    days:   '18',
    rows: [
      ['2026-08-01', '06:00', '98',  '20.5', '41', '9.2'],
      ['2026-08-01', '12:00', '760', '28.9', '38', '332.1'],
      ['2026-08-01', '18:00', '80',  '23.1', '44', '14.6'],
    ]
  }
};

/* ============================================================
   NAV SETUP (Grouped & Clean)
   ============================================================ */
const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      ['landing',   'Overview'],
      ['input',     'Plant & live forecast'],
      ['dashboard', 'Forecasting dashboard']
    ]
  },
  {
    title: 'Model pipeline',
    items: [
      ['prep',      'Data preparation'],
      ['basemodel', 'Base model (LSTM+GRU)'],
      ['transfer',  'Transfer learning'],
      ['xai',       'SHAP explainability']
    ]
  },
  {
    title: 'Analysis',
    items: [
      ['anomaly',   'Anomaly analysis'],
      ['compare',   'Region comparison'],
      ['insights',  'AI insights']
    ]
  },
  {
    title: 'Project',
    items: [
      ['report',    'Executive report'],
      ['project',   'Team members'],
      ['about',     'Architecture & docs']
    ]
  }
];

const navEl      = document.getElementById('nav');
const rail       = document.getElementById('rail');
const menubtn    = document.getElementById('menubtn');
const pageFooter = document.getElementById('pageFooter');

if (navEl) {
  navEl.innerHTML = '';
  NAV_GROUPS.forEach(group => {
    const grpDiv = document.createElement('div');
    grpDiv.className = 'nav-group';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'nav-group-title';
    titleDiv.textContent = group.title;
    grpDiv.appendChild(titleDiv);

    group.items.forEach(([id, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.id = id;
      btn.addEventListener('click', () => go(id));
      grpDiv.appendChild(btn);
    });

    navEl.appendChild(grpDiv);
  });
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function go(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.id === id));
  
  if (rail) rail.classList.remove('open');
  if (menubtn) menubtn.setAttribute('aria-expanded', 'false');

  /* Show footer only on landing */
  if (pageFooter) pageFooter.classList.toggle('footer--hidden', id !== 'landing');

  if (id === 'landing') {
    drawHeroChart();
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => refreshCharts());
  });

  try { localStorage.setItem('pv_last_page', id); } catch (e) {}
  try {
    const v = JSON.parse(localStorage.getItem('pv_views') || '{}');
    v[id] = (v[id] || 0) + 1;
    localStorage.setItem('pv_views', JSON.stringify(v));
  } catch (e) {}
}

if (menubtn) {
  menubtn.addEventListener('click', () => {
    const open = rail.classList.toggle('open');
    menubtn.setAttribute('aria-expanded', String(open));
  });
}

/* ============================================================
   TIMESTAMP COUNTER
   ============================================================ */
let _lastUpdated  = Date.now();
let _dataSource   = 'Demo data';

function updateTimestamp() {
  const secs = Math.floor((Date.now() - _lastUpdated) / 1000);
  const str  = secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
  const el   = document.getElementById('heroTimestamp');
  if (el) el.textContent = `${_dataSource} \u00b7 Updated ${str}`;
}
setInterval(updateTimestamp, 1000);

/* ============================================================
   COOKIE
   ============================================================ */
function closeCookie() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.style.display = 'none';
  try { localStorage.setItem('pv_cookie', '1'); } catch (e) {}
}

/* ============================================================
   REGION
   ============================================================ */
const regionSelect = document.getElementById('regionSel');

function setRegion(region) {
  if (regionSelect) regionSelect.value = region;
  const d = DATA[region];
  if (!d) return;

  _set('histTitle', `${region === 'A' ? 'Region A' : 'Region B'} — history sample`);
  _set('histBadge', `Showing ${d.rows.length} of ${d.days} days`);
  _set('dashRegionLabel', `${region === 'A' ? 'Region A' : 'Region B'} — current output and 7-day forecast.`);

  /* Dashboard KPIs */
  _set('curKw', `${d.cur} kW`);
  _set('peakKw', `${d.peak} kW`);
  _set('wk7', d.wk7.toLocaleString() + ' kWh');

  /* Hero card */
  _set('heroKw', `${d.cur} kW`);
  _set('heroPeak', `${d.peak} kW`);
  _set('heroPower', d.wk7.toLocaleString() + ' kWh');

  /* History table */
  const tbody = document.querySelector('#histTable tbody');
  if (tbody) {
    tbody.innerHTML = d.rows.map(row =>
      `<tr>${row.map((cell, ci) => `<td${ci >= 4 ? ' class="num"' : ''}>${cell}</td>`).join('')}</tr>`
    ).join('');
  }

  updateCharts(region);
  drawHeroChart(region);
}

if (regionSelect) {
  regionSelect.addEventListener('change', e => setRegion(e.target.value));
}

/* ============================================================
   CHARTS
   ============================================================ */
let dayChart, weekChart, lossChart, tlChart, compChart, cloudHist;

function refreshCharts() {
  [dayChart, weekChart, lossChart, tlChart, compChart, cloudHist].forEach(c => c && c.resize());
  drawHeroChart();
}

function updateCharts(region) {
  const d = DATA[region];
  if (!d) return;

  if (dayChart) dayChart.destroy();
  dayChart = new Chart(document.getElementById('dayChart'), {
    type: 'line',
    _showPeak: true,
    data: {
      labels: d.hours,
      datasets: [
        { label: 'Actual',    data: d.actual, borderColor: '#0096d6', tension: 0.3 },
        { label: 'Predicted', data: d.pred,   borderColor: '#f4a942', borderDash: [6, 4], tension: 0.3 }
      ]
    }
  });

  if (weekChart) weekChart.destroy();
  weekChart = new Chart(document.getElementById('weekChart'), {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'kWh', data: d.week, backgroundColor: '#006397' }]
    }
  });
}

/* ============================================================
   HERO POWER CURVE (Full-Day Daylight Curve + Night Standby)
   ============================================================ */
function drawHeroChart(region) {
  const canvas = document.getElementById('heroChart');
  if (!canvas) return;

  const d = DATA[region || (regionSelect ? regionSelect.value : 'A')];
  if (!d) return;

  const parent = canvas.parentElement;
  const W = (parent ? parent.clientWidth : 0) || canvas.clientWidth || 440;
  const H = 180;
  if (W <= 10) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const pad = { top: 20, right: 20, bottom: 28, left: 56 };
  const pw  = Math.max(10, W - pad.left - pad.right);
  const ph  = Math.max(10, H - pad.top - pad.bottom);

  const vMin = 0;
  const vMax = 500; // Consistent scale up to 500 kW
  const vRange = vMax - vMin;

  const toX = (i) => pad.left + (i / (d.hours.length - 1)) * pw;
  const toY = (v) => pad.top + ph - ((v - vMin) / vRange) * ph;

  /* Y-axis gridlines and labels (500 kW, 250 kW, 0 kW) */
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#8e8e8e';
  ctx.font = '11px Figtree, sans-serif';
  ctx.textAlign = 'right';

  [500, 250, 0].forEach(val => {
    const y = toY(val);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + pw, y);
    ctx.stroke();
    ctx.fillText(`${val} kW`, pad.left - 8, y + 4);
  });

  const nowHour = new Date().getHours();
  const isNight = nowHour < 6 || nowHour >= 19;

  const nowIdx = 6; // Noon 12:00 peak representation for daytime demo

  if (isNight) {
    /* Night scenario: show tomorrow's full expected profile with subtle label */
    const tsEl = document.getElementById('heroTimestamp');
    if (tsEl && _dataSource !== 'Manual input') {
      tsEl.textContent = "Sun down \u00b7 Showing tomorrow's 24h expected curve";
    }

    /* Full curve area fill */
    const predCoords = d.pred.map((v, i) => ({ x: toX(i), y: toY(v) }));
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
    grad.addColorStop(0, 'rgba(0,150,214,.25)');
    grad.addColorStop(1, 'rgba(0,150,214,.01)');

    ctx.beginPath();
    ctx.moveTo(predCoords[0].x, pad.top + ph);
    predCoords.forEach(({ x, y }) => ctx.lineTo(x, y));
    ctx.lineTo(predCoords[predCoords.length - 1].x, pad.top + ph);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* Dashed line across full day */
    ctx.beginPath();
    predCoords.forEach(({ x, y }, i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = '#0096d6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Noon peak indicator */
    const peakX = toX(6);
    const peakY = toY(d.pred[6]);
    ctx.beginPath();
    ctx.arc(peakX, peakY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a942';
    ctx.fill();

    const pulseDot = document.getElementById('heroPulseDot');
    if (pulseDot) {
      pulseDot.style.left = `${peakX}px`;
      pulseDot.style.top  = `${peakY}px`;
      pulseDot.style.display = 'flex';
    }
  } else {
    /* Daytime scenario: actual generation up to now, dashed prediction forward */
    const actualCoords = d.actual.slice(0, nowIdx + 1).map((v, i) => ({ x: toX(i), y: toY(v) }));
    if (actualCoords.length > 1) {
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
      grad.addColorStop(0, 'rgba(0,150,214,.38)');
      grad.addColorStop(1, 'rgba(0,150,214,0)');
      ctx.beginPath();
      ctx.moveTo(actualCoords[0].x, pad.top + ph);
      actualCoords.forEach(({ x, y }) => ctx.lineTo(x, y));
      ctx.lineTo(actualCoords[actualCoords.length - 1].x, pad.top + ph);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      actualCoords.forEach(({ x, y }, i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = '#0096d6';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    /* Dashed forecast for remaining afternoon/evening */
    const forecastCoords = d.pred.slice(nowIdx).map((v, i) => ({ x: toX(nowIdx + i), y: toY(v) }));
    if (forecastCoords.length > 1) {
      const gradF = ctx.createLinearGradient(0, pad.top, 0, pad.top + ph);
      gradF.addColorStop(0, 'rgba(0,150,214,.12)');
      gradF.addColorStop(1, 'rgba(0,150,214,0)');
      ctx.beginPath();
      ctx.moveTo(forecastCoords[0].x, pad.top + ph);
      forecastCoords.forEach(({ x, y }) => ctx.lineTo(x, y));
      ctx.lineTo(forecastCoords[forecastCoords.length - 1].x, pad.top + ph);
      ctx.closePath();
      ctx.fillStyle = gradF;
      ctx.fill();

      ctx.beginPath();
      forecastCoords.forEach(({ x, y }, i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = 'rgba(56,189,248,.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* Position CSS live pulsing dot */
    const dotX = toX(nowIdx);
    const dotY = toY(d.actual[nowIdx]);
    const pulseDot = document.getElementById('heroPulseDot');
    if (pulseDot) {
      pulseDot.style.left = `${dotX}px`;
      pulseDot.style.top  = `${dotY}px`;
      pulseDot.style.display = 'flex';
    }
  }

  /* X-axis time labels */
  ctx.fillStyle = '#8e8e8e';
  ctx.font = '11px Figtree, sans-serif';
  ctx.textAlign = 'center';
  [0, 3, 6, 9, 12].forEach(i => {
    if (i < d.hours.length) ctx.fillText(d.hours[i], toX(i), H - 8);
  });
}

const heroCanvas = document.getElementById('heroChart');
if (heroCanvas) {
  heroCanvas.addEventListener('contextlost', (e) => {
    e.preventDefault();
  });
  heroCanvas.addEventListener('contextrestored', () => {
    drawHeroChart();
  });
}

/* ============================================================
   FORECAST CALCULATION — syncs ALL pages
   ============================================================ */
function updateLiveSummary() {
  const irr  = Math.max(0, Math.min(1400, Number(document.getElementById('irradianceInput')?.value  || 780)));
  const temp = Math.max(-10, Math.min(60,  Number(document.getElementById('tempInput')?.value        || 31)));
  const cap  = Math.max(50,  Math.min(2000,Number(document.getElementById('capacityInput')?.value   || 650)));
  const days = Math.max(1,   Math.min(30,  Number(document.getElementById('forecastDaysInput')?.value || 7)));

  const adjIrr   = irr * (1 - Math.max(0, temp - 35) * 0.006);
  const outputKw = (adjIrr / 1000) * (cap * 0.75);
  const dailyKwh = outputKw * 6.5;
  const totalKwh = dailyKwh * days;
  const peakKw   = (1000 / 1000) * (cap * 0.75);

  const gen    = `${outputKw.toFixed(1)} kW`;
  const fcDays = `${days} ${days === 1 ? 'day' : 'days'}`;
  const fcKwh  = `${Math.round(totalKwh).toLocaleString()} kWh`;

  /* Input page result card */
  _set('liveGenerated', gen);
  _set('liveDays',      fcDays);
  _set('liveForecast',  fcKwh);
  _set('sourceStatus',  'Manual input');

  /* Hero card */
  _set('heroKw',    gen);
  _set('heroPower', fcKwh);
  _set('heroPeak',  `${Math.round(peakKw)} kW`);

  /* Dashboard KPIs */
  _set('curKw',  gen);
  _set('peakKw', `${Math.round(peakKw)} kW`);
  _set('wk7',    `${Math.round(dailyKwh * 7).toLocaleString()} kWh`);

  /* Status pills */
  _set('sourceStatusPill', 'Manual input');
  _heroStatusPill('success', 'Manual input');

  /* Timestamp */
  _lastUpdated = Date.now();
  _dataSource  = 'Manual input';
  updateTimestamp();
  drawHeroChart();
}

function _set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function _heroStatusPill(cls, text) {
  const pill = document.getElementById('heroStatusPill');
  if (!pill) return;
  pill.className = `status-pill ${cls}`;
  pill.textContent = text;
}

/* ============================================================
   DOM CONTENT LOADED
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  setRegion('A');
  go('landing');

  requestAnimationFrame(() => requestAnimationFrame(refreshCharts));

  /* ---- SHAP BARS ---------------------------------------- */
  const shap = [
    ['Irradiance (GHI)',       6.8],
    ['Hour of day',            2.4],
    ['Panel tilt efficiency',  0.9],
    ['Wind speed',             0.3],
    ['Humidity',              -0.6],
    ['Ambient temperature',   -1.1],
    ['Cloud cover',           -3.2],
  ].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const maxAbs = Math.max(...shap.map(([, v]) => Math.abs(v)));
  const shapContainer = document.getElementById('shapBars');

  if (shapContainer) {
    shapContainer.innerHTML =
      '<div class="shap-centerline"></div>' +
      shap.map(([feature, value]) => {
        const pct  = (Math.abs(value) / maxAbs) * 46;
        const pos  = value >= 0;
        const cls  = pos ? 'pos' : 'neg';
        const left = pos ? 50 : 50 - pct;
        const sign = pos ? '+' : '';
        return `
          <div class="dbar" role="listitem" aria-label="${feature}: ${sign}${value} kW">
            <span class="muted" style="font-size:12px">${feature}</span>
            <div class="dtrack"><div class="dfill ${cls}" style="left:${left}%;width:${pct}%"></div></div>
            <span class="dval ${cls}">${sign}${value.toFixed(1)}</span>
          </div>`;
      }).join('');
  }

  /* ---- LOSS CHART --------------------------------------- */
  lossChart = new Chart(document.getElementById('lossChart'), {
    type: 'line',
    data: {
      labels: [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      datasets: [
        { label: 'Train RMSE', data: [0.45, 0.28, 0.19, 0.13, 0.09, 0.07, 0.055, 0.045, 0.038, 0.032, 0.028], borderColor: '#0096d6' },
        { label: 'Val RMSE',   data: [0.48, 0.32, 0.23, 0.17, 0.13, 0.10, 0.085, 0.072, 0.063, 0.056, 0.051], borderColor: '#f05454', borderDash: [5, 4] }
      ]
    },
    options: { plugins: { title: { display: true, text: 'Training loss curve (RMSE)' } } }
  });

  /* ---- TRANSFER CHART ----------------------------------- */
  tlChart = new Chart(document.getElementById('tlChart'), {
    type: 'bar',
    data: {
      labels: ['Scratch', 'Frozen', 'Fine-tuned'],
      datasets: [{ label: 'RMSE (kW)', data: [14.8, 11.2, 6.9], backgroundColor: ['#f05454', '#f4a942', '#22d3a4'] }]
    },
    options: { plugins: { title: { display: true, text: 'RMSE by strategy' } } }
  });

  /* ---- COMPARISON CHART: 7-Day Output Comparison -------- */
  compChart = new Chart(document.getElementById('compChart'), {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        { label: 'Region A (650 kWp)',    data: DATA.A.week, backgroundColor: '#0096d6' },
        { label: 'Region B (Fine-tuned)', data: DATA.B.week, backgroundColor: '#004f7c' }
      ]
    },
    options: {
      plugins: {
        title: { display: true, text: '7-day daily generation comparison (kWh)' }
      }
    }
  });

  /* ---- CLOUD HISTOGRAM ---------------------------------- */
  cloudHist = new Chart(document.getElementById('cloudHist'), {
    type: 'bar',
    data: {
      labels: ['0–10', '10–20', '20–30', '30–40', '40–50', '50–60', '60–70', '70+'],
      datasets: [{ label: 'Days', data: [8, 14, 22, 19, 12, 7, 4, 2], backgroundColor: '#006397' }]
    },
    options: { plugins: { title: { display: true, text: 'Cloud cover distribution (Region A, days)' } } }
  });

  /* ---- ANOMALIES ---------------------------------------- */
  renderAnomalies(25);

  /* ---- INSIGHTS ----------------------------------------- */
  const insights = [
    ['Anomaly',           'danger',  'High cloud cover on Aug 15 reduced Region A generation by roughly 34% versus forecast.'],
    ['Model performance', 'success', 'Region B needed 80% less training data after transfer learning, matching Region A RMSE within 1.1 kW.'],
    ['Degradation',       'warning', 'Panel efficiency in Region A shows a mild downward drift over the last 20 days, consistent with soiling.'],
    ['Seasonal pattern',  'success', 'Region B afternoon peak lags Region A by ~40 minutes due to longitude offset.'],
    ['Model performance', 'success', 'Forecast confidence drops below 85% whenever cloud cover exceeds 60%, across both regions.'],
    ['Pattern',           'success', 'Weekend generation shows no significant deviation from weekday patterns.']
  ];

  const insightList = document.getElementById('insightList');
  if (insightList) {
    insightList.innerHTML = insights.map(([label, type, text]) => `
      <div class="card" style="border-left:3px solid var(--${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'success'})" role="listitem">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span class="badge ${type}">${label}</span>
        </div>
        <div style="color:var(--muted);font-size:14px;line-height:1.75">${text}</div>
      </div>`).join('');
  }

  /* ---- REPORT ------------------------------------------- */
  const reportText = document.getElementById('reportText');
  if (reportText) reportText.textContent = buildReport();

  /* ---- INIT FORECAST ------------------------------------ */
  updateLiveSummary();
});

/* ============================================================
   ANOMALIES
   ============================================================ */
function renderAnomalies(threshold) {
  _set('threshOut', threshold);
  const slider = document.getElementById('threshSlider');
  if (slider) slider.setAttribute('aria-valuenow', threshold);

  const all = [
    ['2026-08-14 11:00', 'Region A', 420, 284, -32.5, 'Medium', 'Partial shading / soiling'],
    ['2026-08-15 13:00', 'Region A', 513, 339, -33.9, 'High',   'Cloud cover spike (unmodeled)'],
    ['2026-08-17 09:00', 'Region B', 302, 191, -36.8, 'High',   'Inverter under-performance'],
    ['2026-08-18 15:00', 'Region A', 467, 302, -35.3, 'Medium', 'Sensor drift suspected']
  ];
  const flagged = all.filter(r => Math.abs(r[4]) >= threshold);

  const countBadge = document.getElementById('anomalyCount');
  if (countBadge) {
    countBadge.textContent = `${flagged.length} anomal${flagged.length === 1 ? 'y' : 'ies'} detected`;
    countBadge.className   = `badge ${flagged.length > 0 ? 'danger' : 'success'}`;
  }

  const anomList = document.getElementById('anomList');
  if (anomList) {
    anomList.innerHTML = flagged.length
      ? flagged.map(([time, region, exp, act, delta, sev, cause]) => `
          <div class="card" role="listitem">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
              <strong style="font-size:14px">${time} &mdash; ${region}</strong>
              <span class="badge ${sev === 'High' ? 'danger' : 'warning'}">${sev}</span>
            </div>
            <div style="color:var(--muted);font-size:13px;line-height:1.75">
              Expected <strong>${exp} kW</strong>, got <strong>${act} kW</strong>
              (<strong style="color:var(--danger)">${delta}%</strong>) &mdash; likely cause: ${cause}
            </div>
          </div>`).join('')
      : '<div class="card"><div style="color:var(--muted)">No anomalies exceed the current threshold.</div></div>';
  }
}

const threshSlider = document.getElementById('threshSlider');
if (threshSlider) {
  threshSlider.addEventListener('input', e => renderAnomalies(Number(e.target.value)));
}

/* ============================================================
   REPORT
   ============================================================ */
function buildReport() {
  return [
    'PVIntelligence — Forecasting Report',
    `Generated: ${new Date().toISOString().slice(0,16).replace('T',' ')}`,
    '─'.repeat(52),
    'KEY METRICS (Region A — 650 kWp)',
    `  Current output:        380 kW`,
    `  7-day forecast:        17,300 kWh`,
    `  Avg daily output:      2,478 kWh`,
    `  Forecast RMSE:         5.8 kW`,
    `  Forecast MAE:          4.1 kW`,
    `  Model R²:              0.94`,
    `  Data history:          120 days`,
    '',
    'REGION COMPARISON',
    `  Avg daily (kWh): A=2,478 | B=1,850`,
    `  RMSE (kW):       A=5.8   | B=6.9`,
    `  Transfer learning improved Region B RMSE by 53%`,
    `  Region B required 80% less training data`,
    '',
    'AI INSIGHTS',
    '  [Anomaly] High cloud cover Aug 15 reduced Region A by ~34%.',
    '  [Transfer] 80% less data needed after fine-tuning.',
    '─'.repeat(52),
    'Report by PVIntelligence (demo — historical/synthetic data).'
  ].join('\n');
}

function downloadReport() {
  const blob = new Blob([buildReport()], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = 'pvintelligence_report.txt';
  link.click();
}

/* ============================================================
   RESIZE + EVENTS
   ============================================================ */
window.addEventListener('resize', refreshCharts);
window.addEventListener('load',   updateLiveSummary);

/* Cookie banner */
const cookieBanner = document.getElementById('cookieBanner');
try { if (localStorage.getItem('pv_cookie') && cookieBanner) cookieBanner.style.display = 'none'; } catch (e) {}

/* Splash: 350ms instant smooth entrance */
const splash = document.getElementById('splash-container');
if (splash) {
  setTimeout(() => {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 350);
  }, 400);
}
