/* Balcony Lab — small dependency-free SVG line charts */

const Charts = (() => {
  const { esc, fmtShort, fmtDT } = U;
  const W = 640, H = 240, P = { t: 14, r: 18, b: 30, l: 44 };
  const DAY_MS = 864e5;

  function niceStep(x) {
    const p = 10 ** Math.floor(Math.log10(x));
    const f = x / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  function niceRange(min, max) {
    if (min === max) { min -= 1; max += 1; }
    const step = niceStep((max - min) / 4);
    return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
  }

  /**
   * series: [{ name, cls, points: [{ x: Date, y: number, est?: bool }] }]
   * events: [{ x: Date, label }]  drawn as markers along the bottom (e.g. watering)
   */
  function line(el, { series, events = [], unit = '', yMin, label = 'Chart' }) {
    const pts = series.flatMap(s => s.points);
    if (!pts.length && !events.length) {
      el.innerHTML = '<p class="empty">No data yet. Values appear here once you log them.</p>';
      return;
    }
    const xs = [...pts, ...events].map(p => +p.x);
    let x0 = Math.min(...xs), x1 = Math.max(...xs);
    if (x1 - x0 < DAY_MS) { x0 -= DAY_MS / 2; x1 += DAY_MS / 2; }
    const ys = pts.map(p => p.y);
    const r = ys.length ? niceRange(Math.min(yMin ?? Infinity, ...ys), Math.max(...ys)) : niceRange(0, 10);

    const X = t => P.l + ((t - x0) / (x1 - x0)) * (W - P.l - P.r);
    const Y = v => H - P.b - ((v - r.lo) / (r.hi - r.lo)) * (H - P.t - P.b);

    let svg = '';
    for (let v = r.lo; v <= r.hi + r.step / 1000; v += r.step) {
      const y = Y(v).toFixed(1);
      svg += `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/>` +
        `<text class="tick" x="${P.l - 8}" y="${+y + 4}" text-anchor="end">${+v.toFixed(2)}${unit}</text>`;
    }
    const ticks = 5;
    for (let i = 0; i < ticks; i++) {
      const t = x0 + (i * (x1 - x0)) / (ticks - 1);
      const anchor = i === 0 ? 'start' : i === ticks - 1 ? 'end' : 'middle';
      svg += `<text class="tick" x="${X(t).toFixed(1)}" y="${H - 8}" text-anchor="${anchor}">${fmtShort(new Date(t))}</text>`;
    }
    for (const e of events) {
      const x = X(+e.x).toFixed(1), y = H - P.b - 2;
      svg += `<path class="event" d="M${x},${y - 12} q5,7 0,12 q-5,-5 0,-12z"><title>${esc(e.label)}</title></path>`;
    }
    for (const s of series) {
      if (!s.points.length) continue;
      const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${X(+p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
      svg += `<path class="line s-${s.cls}" d="${d}"/>`;
      for (const p of s.points) {
        svg += `<circle class="dot s-${s.cls}" cx="${X(+p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.est ? 3.5 : 4.5}">` +
          `<title>${esc(s.name)}: ${p.y}${unit}${p.est ? ' (estimate)' : ''} · ${fmtDT(p.x)}</title></circle>`;
      }
    }

    const legend = series.filter(s => s.points.length)
      .map(s => `<span style="--c: var(--${s.cls})">${esc(s.name)}</span>`)
      .concat(events.length ? ['<span style="--c: var(--water)">Watering</span>'] : []).join('');

    el.innerHTML = `<div class="legend">${legend}</div>` +
      `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${svg}</svg>`;
  }

  return { line };
})();
