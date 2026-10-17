/* Balcony Lab — app: routing and views */
(() => {
  const { LABELS, $, $$, esc, toDate, fmtDate, fmtDT, hoursSince, ago, localInput } = U;
  const PRIORITY = { 1: 'Do now', 2: 'Soon', 3: 'Keep in mind' };
  let currentRecs = new Map(); // key -> { rec, plantId }, for the "Mark done" buttons

  // ---------- Small helpers ----------
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function hydratePhotos(root) {
    for (const el of $$('[data-photo]', root)) {
      const url = await Photos.url(el.dataset.photo);
      if (!url) continue;
      const img = new Image();
      img.src = url;
      img.alt = el.dataset.alt || 'Plant photo';
      img.dataset.zoom = '';
      el.prepend(img);
    }
  }

  const stageOf = p => Store.observations(p.id).at(-1)?.stage || p.stages[0];
  const dayOf = p => p.startDate ? Math.floor(hoursSince(p.startDate) / 24) : null;

  function obsSummary(o) {
    const bits = [];
    if (o.height != null) bits.push(`${o.height} cm${o.heightEstimated ? ' (est.)' : ''}`);
    if (o.leafCount != null) bits.push(`${o.leafCount} leaves`);
    if (o.roots) bits.push(LABELS.roots[o.roots]);
    if (o.soil) bits.push(`soil ${LABELS.soil[o.soil].toLowerCase()}`);
    if (o.tempDay != null || o.tempNight != null) bits.push(tempText(o));
    if (o.actions?.length) bits.push(o.actions.map(a => LABELS.actions[a]).join(', '));
    if (o.symptoms?.length) bits.push(o.symptoms.map(s => LABELS.symptoms[s]).join(', ').toLowerCase());
    return bits.join(' · ') || 'No measurements';
  }

  function tempText(o) {
    const d = o.tempDay != null ? `${o.tempDay}°` : '–';
    const n = o.tempNight != null ? `${o.tempNight}°` : '–';
    return `${d} day / ${n} night${o.tempEstimated ? ' (est.)' : ''}`;
  }

  // What changed between the two latest observations.
  function changes(prev, cur) {
    if (!prev || !cur) return [];
    const out = [];
    const delta = (a, b) => (b - a > 0 ? '+' : '') + Math.round((b - a) * 10) / 10;
    if (prev.stage !== cur.stage) out.push(`Stage: ${LABELS.stage[prev.stage]} → ${LABELS.stage[cur.stage]}`);
    if (prev.height != null && cur.height != null && prev.height !== cur.height) out.push(`Height ${delta(prev.height, cur.height)} cm`);
    if (prev.leafCount != null && cur.leafCount != null && prev.leafCount !== cur.leafCount) out.push(`Leaves ${delta(prev.leafCount, cur.leafCount)}`);
    if (prev.roots && cur.roots && prev.roots !== cur.roots) out.push(`Roots: ${LABELS.roots[cur.roots]}`);
    if (prev.soil && cur.soil && prev.soil !== cur.soil) out.push(`Soil: ${LABELS.soil[prev.soil].toLowerCase()} → ${LABELS.soil[cur.soil].toLowerCase()}`);
    const newSymptoms = (cur.symptoms || []).filter(s => !(prev.symptoms || []).includes(s));
    if (newSymptoms.length) out.push(`New: ${newSymptoms.map(s => LABELS.symptoms[s].toLowerCase()).join(', ')}`);
    return out;
  }

  // ---------- Dashboard ----------
  function recHTML(r, plantId) {
    return `<li class="rec p${r.priority}">
      <span class="rec-pri">${PRIORITY[r.priority]}</span>
      <strong class="rec-action">${esc(r.action)}</strong>
      <p class="rec-why">${esc(r.why)}</p>
      <p class="rec-trigger">Because: ${esc(r.trigger)}</p>
      <div class="rec-buttons">
        <button class="btn small" type="button" data-done="${esc(r.key)}">Mark done</button>
        ${r.link ? `<a class="btn small" href="${r.link.href}">${esc(r.link.label)}</a>` : ''}
      </div>
    </li>`;
  }

  function cardHTML(p) {
    const obs = Store.observations(p.id);
    const latest = obs.at(-1);
    const rev = [...obs].reverse();
    const lastWater = rev.find(o => o.actions?.includes('watered') || o.actions?.includes('water-change'));
    const photo = rev.find(o => o.photoId);
    const env = rev.find(o => o.tempDay != null || o.tempNight != null);
    const sun = rev.find(o => o.sunlight);
    const day = dayOf(p);

    const recs = Rules.recommend(p, obs).filter(r => !Store.isDone(r.key));
    recs.forEach(r => currentRecs.set(r.key, { rec: r, plantId: p.id }));
    const [top, ...rest] = recs;

    const timeline = [
      ...obs.map(o => ({ t: o.datetime, html: `<b>${esc(LABELS.stage[o.stage])}</b> · ${esc(obsSummary(o))}${o.notes ? `<br>${esc(o.notes)}` : ''}` })),
      ...Store.tasks(p.id).map(t => ({ t: t.completedAt, task: true, html: `✓ ${esc(t.action)}${t.result ? `<br>${esc(t.result)}` : ''}` })),
    ].sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 12);

    const diff = changes(obs.at(-2), latest);

    return `<article class="plant-card plant-${p.id}">
      <div class="photo" ${photo ? `data-photo="${photo.photoId}" data-alt="${esc(p.name)}, ${esc(fmtDate(photo.datetime))}"` : ''}>
        <span aria-hidden="true">${p.emoji}</span>
        ${photo ? `<span class="photo-date">${esc(fmtDT(photo.datetime))}</span>` : ''}
      </div>
      <div class="body">
        <div class="card-title">
          <h2>${p.emoji} ${esc(p.name)}<span class="latin">${esc(p.latin)}</span></h2>
          <span class="badge">${esc(LABELS.stage[stageOf(p)])}</span>
        </div>

        <dl class="facts">
          <div><dt>Started</dt><dd>${p.startDate ? `${fmtDate(p.startDate)} · day ${day}` : '<a href="#settings">Set start date</a>'}</dd></div>
          <div><dt>Location</dt><dd>${esc(p.location)}</dd></div>
          <div><dt>${p.id === 'mint' ? 'Last watered / water changed' : 'Last watered'}</dt>
            <dd>${lastWater ? `${fmtDT(lastWater.datetime)} <span class="hint">(${ago(hoursSince(lastWater.datetime))})</span>` : 'Not recorded'}</dd></div>
          <div><dt>Recent conditions</dt>
            <dd>${env ? `${tempText(env)} <span class="hint">${fmtDate(env.datetime)}</span>` : 'Not recorded'}${sun ? `<br>${esc(LABELS.sun[sun.sunlight])}` : ''}</dd></div>
        </dl>

        <div class="latest">
          <h3>Latest observation</h3>
          ${latest
            ? `<p><span class="hint">${fmtDT(latest.datetime)}</span><br>${esc(obsSummary(latest))}${latest.notes ? `<br><i>${esc(latest.notes)}</i>` : ''}</p>
               ${diff.length ? `<ul class="changes">${diff.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}`
            : '<p class="empty">Nothing logged yet.</p>'}
        </div>

        <div>
          <h3>Next steps</h3>
          ${top ? `<ol class="recs">${recHTML(top, p.id)}</ol>` : '<p class="empty">All current tasks are done.</p>'}
          ${rest.length ? `<details class="more-recs"><summary>${rest.length} more suggestion${rest.length > 1 ? 's' : ''}</summary>
            <ol class="recs">${rest.map(r => recHTML(r, p.id)).join('')}</ol></details>` : ''}
        </div>

        <details class="timeline">
          <summary>Timeline (${obs.length} observation${obs.length === 1 ? '' : 's'})</summary>
          ${timeline.length
            ? `<ol>${timeline.map(e => `<li class="${e.task ? 'task' : ''}"><time>${fmtDT(e.t)}</time>${e.html}</li>`).join('')}</ol>
               <p><a href="#history">Full history →</a></p>`
            : '<p class="empty">Nothing yet.</p>'}
        </details>

        <div class="card-actions">
          <a class="btn primary" href="#log?plant=${p.id}">Log observation</a>
        </div>
      </div>
    </article>`;
  }

  function renderDashboard() {
    currentRecs = new Map();
    const wrap = $('#plant-cards');
    wrap.innerHTML = Store.plants.map(cardHTML).join('');
    hydratePhotos(wrap);
  }

  // ---------- Task dialog ----------
  function askResult({ title, action, result = '', allowLog = true }) {
    const d = $('#task-dialog');
    $('#task-dialog-title').textContent = title;
    $('#task-dialog-action').textContent = action;
    d.querySelector('textarea').value = result;
    d.querySelector('button[value=log]').hidden = !allowLog;
    d.showModal();
    return new Promise(resolve => {
      const f = d.querySelector('form');
      const finish = choice => {
        f.removeEventListener('submit', onSubmit);
        d.removeEventListener('cancel', onCancel);
        resolve({ choice, result: d.querySelector('textarea').value.trim() });
      };
      const onSubmit = e => finish(e.submitter?.value || 'done');
      const onCancel = () => finish('cancel'); // Escape key
      f.addEventListener('submit', onSubmit);
      d.addEventListener('cancel', onCancel);
    });
  }

  async function markDone(key) {
    const entry = currentRecs.get(key);
    if (!entry) return;
    const { rec, plantId } = entry;
    const { choice, result } = await askResult({ title: 'Mark task as done', action: rec.action });
    if (choice !== 'done' && choice !== 'log') return;
    Store.completeTask({ key, plantId, rule: rec.rule, action: rec.action, trigger: rec.trigger, result });
    toast('Task marked as done');
    if (choice === 'log') location.hash = `#log?plant=${plantId}`;
    else renderDashboard();
  }

  // ---------- Observation form ----------
  const form = $('#obs-form');

  function radios(name, labels) {
    return Object.entries(labels).map(([v, l]) =>
      `<label><input type="radio" name="${name}" value="${v}"${v === '' ? ' checked' : ''}> ${esc(l)}</label>`).join('');
  }
  function checks(name, labels) {
    return Object.entries(labels).map(([v, l]) =>
      `<label class="chip"><input type="checkbox" name="${name}" value="${v}"> ${esc(l)}</label>`).join('');
  }

  function buildForm() {
    $('#f-plant').innerHTML = Store.plants.map((p, i) =>
      `<label><input type="radio" name="plant" value="${p.id}"${i ? '' : ' checked'}> ${p.emoji} ${esc(p.name)}</label>`).join('');
    $('#f-soil').innerHTML = radios('soil', LABELS.soil);
    $('#f-roots').innerHTML = radios('roots', LABELS.roots);
    $('#f-sun').innerHTML = Object.entries(LABELS.sun).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('');
    $('#f-actions').innerHTML = checks('actions', LABELS.actions);
    $('#f-symptoms').innerHTML = checks('symptoms', LABELS.symptoms);

    form.addEventListener('change', e => {
      if (e.target.name === 'plant') onPlantChange();
      if (e.target.name === 'plant' || e.target.name === 'stage' || e.target.name === 'actions') updateVisibility();
    });
    $('#f-photo').addEventListener('change', () => {
      const file = $('#f-photo').files[0];
      const prev = $('#f-photo-preview');
      if (prev.src) URL.revokeObjectURL(prev.src);
      prev.hidden = !file;
      if (file) prev.src = URL.createObjectURL(file);
    });
    form.addEventListener('submit', saveObservation);
  }

  const selectedPlant = () => Store.plant(form.plant.value);

  function onPlantChange() {
    const p = selectedPlant();
    const stage = stageOf(p);
    $('#f-stage').innerHTML = p.stages.map(s =>
      `<option value="${s}"${s === stage ? ' selected' : ''}>${LABELS.stage[s]}</option>`).join('');
    // Sunlight rarely changes between logs, so carry the last value over.
    const lastSun = [...Store.observations(p.id)].reverse().find(o => o.sunlight)?.sunlight;
    form.sunlight.value = lastSun || '';
  }

  // Mint roots in water: show root fields, hide soil moisture (until it is transplanted).
  function updateVisibility() {
    const p = selectedPlant();
    const rooting = p.id === 'mint' && form.stage.value === 'rooting';
    const transplanting = $$('input[name=actions]:checked').some(i => i.value === 'transplanted');
    const transplanted = Store.observations(p.id).some(o => o.actions?.includes('transplanted'));
    const show = (fs, on) => { fs.hidden = !on; fs.disabled = !on; };
    show($('#fs-roots'), rooting);
    show($('#fs-soil'), !rooting || transplanted || transplanting);
  }

  function prepareForm(params) {
    form.reset();
    const prev = $('#f-photo-preview');
    prev.hidden = true;
    form.datetime.value = localInput();
    const plantId = params.get('plant');
    if (plantId && Store.plant(plantId)) form.plant.value = plantId;
    onPlantChange();
    updateVisibility();
  }

  async function saveObservation(e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const num = k => { const v = fd.get(k); return v === null || v === '' ? null : Number(v); };
    const text = k => (fd.get(k) || '').trim();
    const o = {
      id: Store.uid(),
      plantId: fd.get('plant'),
      datetime: fd.get('datetime'),
      stage: fd.get('stage'),
      height: num('height'),
      heightEstimated: fd.has('heightEst'),
      leafCount: num('leafCount'),
      roots: text('roots') || null,
      rootNotes: text('rootNotes'),
      soil: text('soil') || null,
      tempDay: num('tempDay'),
      tempNight: num('tempNight'),
      tempEstimated: fd.has('tempEst'),
      sunlight: text('sunlight') || null,
      actions: fd.getAll('actions'),
      symptoms: fd.getAll('symptoms'),
      notes: text('notes'),
      photoId: null,
    };
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const file = $('#f-photo').files[0];
      if (file) {
        o.photoId = 'photo-' + o.id;
        await Photos.put(o.photoId, await U.resizeImage(file));
      }
      Store.addObservation(o);
      toast('Observation saved');
      location.hash = '#dashboard';
    } catch (err) {
      alert('Could not save the observation: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- History ----------
  function renderHistory() {
    const filter = $('#history-filter').value;
    const plantId = filter === 'all' ? null : filter;
    const obs = Store.observations(plantId).reverse();
    const list = $('#history-list');
    list.innerHTML = obs.length ? obs.map(o => {
      const p = Store.plant(o.plantId);
      return `<li class="entry plant-${p.id}">
        ${o.photoId ? `<div class="thumb" data-photo="${o.photoId}" data-alt="${esc(p.name)} photo"></div>` : ''}
        <div class="entry-body">
          <div class="entry-head">
            <strong>${p.emoji} ${esc(p.name)}</strong>
            <span class="badge">${esc(LABELS.stage[o.stage])}</span>
            <time>${fmtDT(o.datetime)}${p.startDate ? ` · day ${Math.floor((toDate(o.datetime) - toDate(p.startDate)) / 864e5)}` : ''}</time>
            <span class="spacer"></span>
            <button class="link danger" type="button" data-del-obs="${o.id}">Delete</button>
          </div>
          <p>${esc(obsSummary(o))}${o.sunlight ? ` · ${esc(LABELS.sun[o.sunlight])}` : ''}</p>
          ${o.rootNotes ? `<p class="notes">Roots: ${esc(o.rootNotes)}</p>` : ''}
          ${o.notes ? `<p class="notes">${esc(o.notes)}</p>` : ''}
        </div>
      </li>`;
    }).join('') : '<li class="empty">No observations yet.</li>';
    hydratePhotos(list);

    const tasks = Store.tasks(plantId);
    $('#task-list').innerHTML = tasks.length ? tasks.map(t => {
      const p = Store.plant(t.plantId);
      return `<li class="entry plant-${p.id}"><div class="entry-body">
        <div class="entry-head"><strong>✓ ${esc(t.action)}</strong></div>
        <p class="notes">${p.emoji} ${esc(p.name)} · ${fmtDT(t.completedAt)}</p>
        <p class="notes">Because: ${esc(t.trigger)}</p>
        ${t.result ? `<p>Result: ${esc(t.result)}</p>` : ''}
        <p><button class="link" type="button" data-task-result="${t.id}">${t.result ? 'Edit result' : 'Add result'}</button>
           · <button class="link danger" type="button" data-task-undo="${t.id}">Undo</button></p>
      </div></li>`;
    }).join('') : '<li class="empty">No completed tasks yet.</li>';
  }

  // ---------- Charts ----------
  function weekly(p, obs) {
    if (!obs.length) return [];
    const base = toDate(p.startDate || obs[0].datetime.slice(0, 10));
    const weeks = new Map();
    for (const o of obs) {
      const w = Math.max(0, Math.floor((toDate(o.datetime) - base) / (7 * 864e5)));
      const row = weeks.get(w) || { week: w, obs: 0, water: 0, height: null };
      row.obs++;
      if (o.actions?.includes('watered') || o.actions?.includes('water-change')) row.water++;
      if (o.height != null) row.height = o.height; // obs are sorted, so the week's last value wins
      weeks.set(w, row);
    }
    let prev = null;
    return [...weeks.values()].sort((a, b) => a.week - b.week).map(r => {
      r.change = r.height != null && prev != null ? Math.round((r.height - prev) * 10) / 10 : null;
      if (r.height != null) prev = r.height;
      return r;
    });
  }

  function renderCharts() {
    const series = (obs, key, est) => obs.filter(o => o[key] != null).map(o => ({ x: toDate(o.datetime), y: o[key], est: est && o[est] }));
    const tom = Store.observations('tomato');
    const mint = Store.observations('mint');

    Charts.line($('#chart-height'), {
      label: 'Plant height over time', unit: ' cm', yMin: 0,
      series: [
        { name: 'Cherry tomatoes', cls: 'tomato', points: series(tom, 'height', 'heightEstimated') },
        { name: 'Mint', cls: 'mint', points: series(mint, 'height', 'heightEstimated') },
      ],
    });

    const all = Store.observations();
    Charts.line($('#chart-temp'), {
      label: 'Day and night temperature', unit: '°',
      series: [
        { name: 'Daytime', cls: 'hot', points: series(all, 'tempDay', 'tempEstimated') },
        { name: 'Nighttime', cls: 'cool', points: series(all, 'tempNight', 'tempEstimated') },
      ],
    });

    for (const [p, obs] of [[Store.plant('tomato'), tom], [Store.plant('mint'), mint]]) {
      const events = obs.filter(o => o.actions?.includes('watered') || o.actions?.includes('water-change'))
        .map(o => ({ x: toDate(o.datetime), label: `${o.actions.includes('watered') ? 'Watered' : 'Water refreshed'} · ${fmtDT(o.datetime)}` }));
      Charts.line($(`#chart-water-${p.id}`), {
        label: `${p.name} height with watering events`, unit: ' cm', yMin: 0, events,
        series: [{ name: 'Height', cls: p.id, points: series(obs, 'height', 'heightEstimated') }],
      });
      const rows = weekly(p, obs);
      $(`#table-water-${p.id}`).innerHTML = rows.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Week</th><th class="num">Logs</th><th class="num">Waterings</th><th class="num">Height</th><th class="num">Change</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>Week ${r.week + 1}</td><td class="num">${r.obs}</td><td class="num">${r.water}</td>
          <td class="num">${r.height != null ? r.height + ' cm' : '–'}</td>
          <td class="num">${r.change != null ? (r.change > 0 ? '+' : '') + r.change + ' cm' : '–'}</td></tr>`).join('')}</tbody>
      </table></div>` : '';
    }
  }

  // ---------- Settings ----------
  function renderSettings() {
    $('#plant-settings').innerHTML = Store.plants.map(p => `
      <form class="panel plant-settings plant-${p.id}" data-plant="${p.id}">
        <h2>${p.emoji} ${esc(p.name)}</h2>
        <label class="field">${p.id === 'tomato' ? 'Sowing date' : 'Date cuttings went into water'}
          <input type="date" name="startDate" value="${esc(p.startDate)}">
        </label>
        <label class="field">Location <input type="text" name="location" value="${esc(p.location)}"></label>
        <label class="field">Container <input type="text" name="container" value="${esc(p.container)}"></label>
        <div class="form-actions"><button class="btn primary" type="submit">Save</button></div>
      </form>`).join('');

    const info = $('#storage-info');
    info.textContent = '';
    navigator.storage?.estimate?.().then(({ usage, quota }) => {
      info.textContent = `Storage used: ${(usage / 1048576).toFixed(1)} MB of about ${Math.round(quota / 1048576)} MB available.`;
    });
  }

  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-plant]');
    if (!f) return;
    e.preventDefault();
    Store.updatePlant(f.dataset.plant, {
      startDate: f.startDate.value,
      location: f.location.value.trim(),
      container: f.container.value.trim(),
    });
    toast('Saved');
  });

  async function exportData() {
    const data = Store.snapshot();
    const photos = {};
    for (const o of data.observations) {
      if (!o.photoId) continue;
      const blob = await Photos.get(o.photoId).catch(() => null);
      if (blob) photos[o.photoId] = await U.blobToDataURL(blob);
    }
    const file = new Blob([JSON.stringify({ app: 'balcony-lab', exportedAt: new Date().toISOString(), data, photos })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `balcony-lab-${localInput().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importData(file) {
    try {
      const json = JSON.parse(await file.text());
      if (json.app !== 'balcony-lab' || !json.data) throw new Error('This is not a Balcony Lab backup.');
      if (!confirm('Replace all current data with this backup?')) return;
      await Photos.clear();
      for (const [id, url] of Object.entries(json.photos || {})) await Photos.put(id, await U.dataURLToBlob(url));
      Store.replace(json.data);
      toast('Backup imported');
      location.hash = '#dashboard';
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  }

  // ---------- Global click handling ----------
  document.addEventListener('click', async e => {
    const t = e.target;
    if (t.dataset.done !== undefined) return markDone(t.dataset.done);

    if (t.dataset.delObs) {
      if (!confirm('Delete this observation? This cannot be undone.')) return;
      const o = Store.deleteObservation(t.dataset.delObs);
      if (o?.photoId) Photos.del(o.photoId);
      return renderHistory();
    }
    if (t.dataset.taskResult) {
      const task = Store.tasks().find(x => x.id === t.dataset.taskResult);
      const { choice, result } = await askResult({ title: 'Task result', action: task.action, result: task.result, allowLog: false });
      if (choice === 'done') { Store.updateTask(task.id, { result }); renderHistory(); }
      return;
    }
    if (t.dataset.taskUndo) {
      Store.deleteTask(t.dataset.taskUndo);
      toast('Task moved back to the dashboard');
      return renderHistory();
    }
    if (t.matches('img[data-zoom]')) {
      const d = document.createElement('dialog');
      d.className = 'photo-viewer';
      d.innerHTML = `<img src="${t.src}" alt="${esc(t.alt)}">`;
      d.addEventListener('click', () => d.close());
      d.addEventListener('close', () => d.remove());
      document.body.append(d);
      d.showModal();
    }
  });

  $('#history-filter').addEventListener('change', renderHistory);
  $('#btn-export').addEventListener('click', exportData);
  $('#btn-import').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  $('#btn-reset').addEventListener('click', async () => {
    if (!confirm('Delete ALL observations, tasks and photos from this browser? Export a backup first if you want to keep them.')) return;
    Store.reset();
    await Photos.clear();
    toast('All data deleted');
    location.hash = '#dashboard';
    route();
  });

  // ---------- Routing ----------
  const views = {
    dashboard: renderDashboard,
    log: prepareForm,
    history: renderHistory,
    charts: renderCharts,
    settings: renderSettings,
  };

  function route() {
    const [name, query] = location.hash.slice(1).split('?');
    const view = views[name] ? name : 'dashboard';
    $$('.view').forEach(v => { v.hidden = v.id !== `view-${view}`; });
    $$('.tabs a').forEach(a => {
      const on = a.dataset.view === view;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    views[view](new URLSearchParams(query || ''));
    window.scrollTo(0, 0);
  }

  buildForm();
  window.addEventListener('hashchange', route);
  route();
  // Ask the browser not to evict our data under storage pressure.
  navigator.storage?.persist?.();
})();
