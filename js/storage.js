/* Balcony Lab — storage
 * Plants, observations and completed tasks live in localStorage.
 * Photos live in IndexedDB, because localStorage only holds a few MB. */

const PLANT_DEFAULTS = [
  {
    id: 'tomato',
    name: 'Cherry tomatoes',
    latin: 'Solanum lycopersicum',
    emoji: '🍅',
    container: 'Bottle 1 (5 L)',
    location: 'Balcony, away from direct afternoon sun',
    stages: ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting'],
    startDate: '',
  },
  {
    id: 'mint',
    name: 'Mint',
    latin: 'Mentha sp. (species unknown)',
    emoji: '🌿',
    container: 'Glass of water, then Bottle 2 (5 L)',
    location: 'Indoors, bright indirect light',
    stages: ['rooting', 'vegetative', 'flowering'],
    startDate: '',
  },
];

const Store = (() => {
  const KEY = 'balconylab:v1';
  const fresh = () => ({ version: 1, plants: structuredClone(PLANT_DEFAULTS), observations: [], tasks: [] });

  // Keep both plants present and their stage lists current, whatever was saved.
  function normalize(s) {
    const plants = PLANT_DEFAULTS.map(p => ({ ...p, ...(s.plants || []).find(x => x.id === p.id), stages: p.stages }));
    return { version: 1, plants, observations: s.observations || [], tasks: s.tasks || [] };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.version === 1) return normalize(s);
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    return fresh();
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      alert('Could not save. Browser storage may be full or blocked.');
    }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const byTime = (a, b) => (a.datetime < b.datetime ? -1 : a.datetime > b.datetime ? 1 : 0);

  return {
    uid,
    get plants() { return state.plants; },
    plant: id => state.plants.find(p => p.id === id),
    updatePlant(id, patch) { Object.assign(this.plant(id), patch); save(); },

    // Observations, oldest first.
    observations(plantId) {
      return state.observations.filter(o => !plantId || o.plantId === plantId).sort(byTime);
    },
    addObservation(o) { state.observations.push(o); save(); },
    deleteObservation(id) {
      const o = state.observations.find(x => x.id === id);
      state.observations = state.observations.filter(x => x.id !== id);
      save();
      return o;
    },

    // Completed recommendations. `key` = rule + the observation that triggered it.
    tasks(plantId) {
      return state.tasks.filter(t => !plantId || t.plantId === plantId)
        .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
    },
    isDone: key => state.tasks.some(t => t.key === key),
    completeTask(t) { state.tasks.push({ id: uid(), completedAt: U.localInput(), ...t }); save(); },
    updateTask(id, patch) { Object.assign(state.tasks.find(t => t.id === id), patch); save(); },
    deleteTask(id) { state.tasks = state.tasks.filter(t => t.id !== id); save(); },

    snapshot: () => structuredClone(state),
    replace(data) { state = normalize(data); save(); },
    reset() { state = fresh(); save(); },
  };
})();

const Photos = (() => {
  let dbPromise;
  const urls = new Map();

  function db() {
    return dbPromise ||= new Promise((resolve, reject) => {
      const req = indexedDB.open('balconylab-photos', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('photos');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function run(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('photos', mode);
      const req = fn(tx.objectStore('photos'));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    put: (id, blob) => run('readwrite', s => s.put(blob, id)),
    get: id => run('readonly', s => s.get(id)),
    async url(id) {
      if (!urls.has(id)) {
        const blob = await this.get(id).catch(() => null);
        if (!blob) return null;
        urls.set(id, URL.createObjectURL(blob));
      }
      return urls.get(id);
    },
    async del(id) {
      if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      return run('readwrite', s => s.delete(id));
    },
    async clear() {
      urls.forEach(u => URL.revokeObjectURL(u));
      urls.clear();
      return run('readwrite', s => s.clear());
    },
  };
})();
