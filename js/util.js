/* Balcony Lab — shared labels and helpers */
const U = (() => {
  const LABELS = {
    stage: {
      germination: 'Germination',
      seedling: 'Seedling',
      vegetative: 'Vegetative growth',
      flowering: 'Flowering',
      fruiting: 'Fruiting',
      rooting: 'Rooting',
    },
    soil: { '': 'Not checked', dry: 'Dry', 'slightly-moist': 'Slightly moist', moist: 'Moist', wet: 'Wet' },
    roots: {
      '': 'Not checked',
      none: 'No roots yet',
      nubs: 'Small white nubs',
      short: 'A few short roots (< 2 cm)',
      several: 'Several healthy roots (2 cm +)',
    },
    sun: {
      '': 'Not recorded',
      'morning-sun': 'Morning sun, afternoon shade',
      'full-sun': 'Full sun including afternoon',
      shade: 'Bright shade all day',
      indoor: 'Indoors, bright indirect light',
      other: 'Other (see notes)',
    },
    actions: {
      watered: 'Watered',
      'water-change': 'Refreshed rooting water',
      pinched: 'Pinched / pruned',
      thinned: 'Thinned seedlings',
      transplanted: 'Transplanted',
      staked: 'Staked / supported',
      harvested: 'Harvested',
      moved: 'Moved location',
      other: 'Other (see notes)',
    },
    symptoms: {
      newgrowth: 'New growth',
      wilting: 'Wilting',
      yellowing: 'Yellowing leaves',
      scorch: 'Scorched / crispy edges',
      pests: 'Pests seen',
      rot: 'Soft or darkened stem',
    },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Dates are stored as local strings: "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM".
  const toDate = s => s instanceof Date ? s : new Date(s.length === 10 ? s + 'T00:00' : s);
  const fmtDate = s => toDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtShort = s => toDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const fmtDT = s => toDate(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const hoursSince = (s, now = new Date()) => (now - toDate(s)) / 36e5;
  function ago(hours) {
    if (hours < 1) return 'less than an hour ago';
    if (hours < 36) return `${Math.round(hours)} h ago`;
    return `${Math.round(hours / 24)} days ago`;
  }
  function localInput(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // Shrink photos before storing them: phone pictures are often 3–8 MB.
  async function resizeImage(file, max = 1280, quality = 0.82) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Could not read this image'));
        i.src = url;
      });
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const blobToDataURL = blob => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  const dataURLToBlob = async url => (await fetch(url)).blob();

  return { LABELS, $, $$, esc, toDate, fmtDate, fmtShort, fmtDT, hoursSince, ago, localInput, resizeImage, blobToDataURL, dataURLToBlob };
})();
