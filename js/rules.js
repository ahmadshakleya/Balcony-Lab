/* Balcony Lab — rule-based recommendations
 * Each rule looks at a plant's context and returns a recommendation or nothing.
 * Wording is deliberately cautious: visual symptoms rarely prove a cause. */

const Rules = (() => {
  const { LABELS, fmtDT, hoursSince, ago } = U;
  const DAY_H = 24;

  function context(plant, obs, now = new Date()) {
    const latest = obs[obs.length - 1] || null;
    const lastWith = action => [...obs].reverse().find(o => (o.actions || []).includes(action)) || null;
    const heights = obs.filter(o => o.height != null).map(o => o.height);
    const stage = latest?.stage || plant.stages[0];
    const transplanted = obs.some(o => (o.actions || []).includes('transplanted'));
    return {
      plant, obs, latest, now, stage,
      day: plant.startDate ? Math.floor(hoursSince(plant.startDate, now) / DAY_H) : null,
      hoursSinceObs: latest ? hoursSince(latest.datetime, now) : null,
      lastWatered: lastWith('watered'),
      lastWaterChange: lastWith('water-change'),
      lastTransplant: lastWith('transplanted'),
      lastPinch: lastWith('pinched'),
      ever: action => obs.some(o => (o.actions || []).includes(action)),
      did: action => (latest?.actions || []).includes(action),
      symptoms: new Set(latest?.symptoms || []),
      maxHeight: heights.length ? Math.max(...heights) : null,
      // Mint roots in a glass of water until it is transplanted; soil advice doesn't apply.
      inWater: plant.id === 'mint' && stage === 'rooting' && !transplanted,
      isTomato: plant.id === 'tomato',
      isMint: plant.id === 'mint',
    };
  }

  const rec = (rule, priority, action, why, trigger, link) => ({ rule, priority, action, why, trigger, link });
  const seen = (c, text) => `${text} (${fmtDT(c.latest.datetime)})`;
  const inSoil = c => c.latest && c.latest.soil && !c.inWater;
  const soilText = c => LABELS.soil[c.latest.soil].toLowerCase();
  const hot = c => c.latest && ((c.latest.tempDay ?? 0) >= 33 || (c.latest.tempNight ?? 0) >= 25);
  const logLink = c => ({ href: `#log?plant=${c.plant.id}`, label: 'Log observation' });

  const rules = [
    // ----- Setup and routine -----
    c => !c.plant.startDate && rec('set-start', 1,
      'Record the start date',
      'Day counts and timing-based advice (germination, rooting, transplanting) depend on it.',
      'No start date set yet',
      { href: '#settings', label: 'Open settings' }),

    c => !c.latest && rec('first-obs', 1,
      'Log a first observation with a photo',
      'A baseline photo and notes make every later change visible.',
      'No observations recorded yet',
      logLink(c)),

    c => c.latest && c.hoursSinceObs > 36 && rec('stale', 2,
      'Check the plant and log what you see',
      'At around 35°C a small container can dry out within a day. Checking morning and evening catches problems early.',
      `Last observation was ${ago(c.hoursSinceObs)}`,
      logLink(c)),

    // ----- Water and soil -----
    c => inSoil(c) && c.symptoms.has('wilting') && ['moist', 'wet'].includes(c.latest.soil) && rec('wilt-moist', 1,
      'Reduce heat exposure. Do not water yet.',
      'Wilting while the soil is still moist is often heat stress during peak hours, and extra water will not help. Move it to shade and check again in the evening. If it has not recovered, check the drainage holes and the roots.',
      seen(c, `Wilting with soil ${soilText(c)}`)),

    c => inSoil(c) && c.symptoms.has('wilting') && ['dry', 'slightly-moist'].includes(c.latest.soil) && !c.did('watered') && rec('wilt-dry', 1,
      'Water slowly and move it into shade',
      'Wilting with drying soil suggests the plant is short of water. Water until a little drains from the bottom, then keep it out of the afternoon sun.',
      seen(c, `Wilting with soil ${soilText(c)}`)),

    c => inSoil(c) && c.latest.soil === 'wet' && !c.symptoms.has('wilting') && rec('soil-wet', 2,
      'Hold off watering and check drainage',
      'Wet soil needs time to drain. Make sure the drainage holes are clear and the bottle is not standing in water.',
      seen(c, 'Soil recorded as wet')),

    c => inSoil(c) && c.latest.soil === 'dry' && !c.symptoms.has('wilting') && !c.did('watered') && rec('soil-dry', 1,
      'Water slowly until excess drains from the bottom',
      'The top layer has dried out. Water the soil rather than the leaves and empty any tray afterwards.',
      seen(c, 'Soil recorded as dry')),

    c => inSoil(c) && c.latest.soil === 'slightly-moist' && !c.did('watered') && !c.symptoms.has('wilting') && (c.isMint
      ? rec('mint-slightly-moist', 2,
        'Give the mint a light watering',
        'Mint prefers soil that stays lightly moist, more consistently than tomatoes do.',
        seen(c, 'Soil recorded as slightly moist'))
      : rec('slightly-moist', 3,
        'Re-check the soil this evening',
        'Water when the top 1–2 cm has dried rather than on a fixed schedule.',
        seen(c, 'Soil recorded as slightly moist'))),

    c => inSoil(c) && c.latest.soil === 'moist' && c.lastWatered && hoursSince(c.lastWatered.datetime, c.now) < 12 && rec('recently-watered', 3,
      'No watering needed right now',
      'It was watered recently and the soil is still moist. Feel the soil again before watering.',
      `Watered ${ago(hoursSince(c.lastWatered.datetime, c.now))}, soil moist`),

    // ----- Sun and heat -----
    c => c.latest && c.latest.sunlight === 'full-sun' && rec('afternoon-sun', 1,
      'Move it to the afternoon-shaded spot',
      'Afternoon sun at these temperatures heats the bottle and roots. Morning sun with afternoon shade is the plan for both plants.',
      seen(c, 'Exposed to full afternoon sun')),

    c => c.latest && (c.latest.tempDay ?? 0) >= 34 && c.latest.sunlight !== 'indoor' && rec('heat', 2,
      'Protect it from peak heat',
      'Keep the container away from hot walls, railings and concrete. Breathable shade cloth during the hottest hours helps; avoid plastic covers, which trap heat.',
      seen(c, `Daytime around ${c.latest.tempDay}°C`)),

    // ----- Symptoms -----
    c => c.symptoms.has('pests') && rec('pests', 1,
      'Inspect the leaves closely, especially the undersides',
      'Remove pests by hand or rinse them off with water. Take a close-up photo and note what you see: identify the pest before choosing any treatment.',
      seen(c, 'Pests noted')),

    c => c.symptoms.has('rot') && rec('rot', 1,
      c.inWater ? 'Remove soft stems and change the water' : 'Check the stem base and drainage',
      c.inWater
        ? 'Soft or dark stems in water often mean rot, which spreads. Discard affected stems, rinse the glass and use fresh water.'
        : 'A soft or darkened stem base can come from soil staying too wet. Let the soil dry slightly and make sure water drains freely.',
      seen(c, 'Soft or darkened stem noted')),

    c => c.symptoms.has('scorch') && rec('scorch', 2,
      'Increase afternoon shade',
      'Pale, crispy or brown patches often follow intense sun or heat. Shade will not repair damaged leaves but protects new growth.',
      seen(c, 'Scorched leaf edges noted')),

    c => c.symptoms.has('yellowing') && rec('yellowing', 2,
      'Note which leaves are yellowing, and watch',
      'Older, lower leaves yellowing can be normal. New leaves yellowing, or soil that stays wet, may point to a watering or nutrient issue. Track it over a few observations before acting.',
      seen(c, 'Yellowing leaves noted')),

    // ----- Cherry tomatoes -----
    c => c.isTomato && c.stage === 'germination' && c.plant.startDate && c.day < 5 && rec('germ-wait', 3,
      'Keep the soil evenly moist and wait',
      'Tomato seeds usually emerge in about 5–10 days. Keep the surface from drying out without making it soggy.',
      `Day ${c.day} since sowing`),

    c => c.isTomato && c.stage === 'germination' && c.day >= 5 && c.day <= 12 && rec('germ-check', 2,
      'Inspect for seedlings and record the first emergence',
      'Seedlings are due around now. When you see one, log an observation with the stage set to “Seedling”.',
      `Day ${c.day} since sowing, no seedling recorded`,
      logLink(c)),

    c => c.isTomato && c.stage === 'germination' && c.day > 12 && rec('germ-slow', 2,
      'Check conditions and consider sowing again',
      'Germination is slower than typical. Check that the soil is moist but not waterlogged and the seeds are about 0.5 cm deep. A sun-heated bottle can also get too hot for seeds. Sowing 2–3 fresh seeds is a cheap backup.',
      `Day ${c.day} since sowing, no seedling recorded`),

    c => c.isTomato && c.stage === 'seedling' && rec('seedling-light', 2,
      'Bright light and gentle morning sun; shade in the afternoon',
      'Young seedlings scorch easily. Increase direct sun gradually over a week or two.',
      'Seedling stage'),

    c => c.isTomato && c.stage === 'seedling' && (c.latest?.leafCount ?? 0) >= 4 && !c.ever('thinned') && rec('thin', 1,
      'Keep only the strongest seedling',
      'Once true leaves develop, seedlings sharing a bottle compete. Snip the weaker ones at soil level (pulling disturbs the roots), or transplant them if you have another container.',
      seen(c, `${c.latest.leafCount} leaves counted`)),

    c => c.isTomato && ['vegetative', 'flowering'].includes(c.stage) && !c.ever('transplanted') &&
      ((c.maxHeight ?? 0) >= 20 || (c.day ?? 0) >= 35) && rec('pot-up', 1,
      'Prepare a 15–20 L container and a stake',
      'A 5 L bottle is a starter pot. Mature cherry tomatoes need a bigger root zone to cope with heat and set fruit. Put the stake in when you transplant, so you do not damage roots later.',
      (c.maxHeight ?? 0) >= 20 ? `Height has reached ${c.maxHeight} cm` : `Day ${c.day} since sowing`),

    c => c.isTomato && c.ever('transplanted') && !c.ever('staked') && ['vegetative', 'flowering', 'fruiting'].includes(c.stage) && rec('stake', 2,
      'Add a stake or other support',
      'Tie the main stem loosely to the stake as it grows; this keeps the plant upright when it carries fruit.',
      'Transplant recorded, no support recorded'),

    c => c.isTomato && c.stage === 'flowering' && rec('flowering', 2,
      'Keep moisture steady and help pollination',
      'Gently tap the flower clusters in the mid-morning to release pollen.' +
        (hot(c) ? ' Sustained heat (around 35°C days, 25°C+ nights) can make flowers drop without setting fruit, so some loss is expected.' : ''),
      hot(c) ? seen(c, 'Flowering in hot conditions') : 'Flowering stage'),

    c => c.isTomato && c.stage === 'fruiting' && rec('fruiting', 2,
      'Water consistently and harvest when fully coloured',
      'Big swings between dry and wet soil can split the fruit. Pick fruit when evenly coloured and slightly soft.',
      'Fruiting stage'),

    // ----- Mint -----
    c => c.isMint && c.stage === 'rooting' && c.latest?.roots === 'several' && !c.ever('transplanted') && rec('mint-transplant', 1,
      'Transplant the cutting into Bottle 2',
      'Several roots a few centimetres long are enough to establish in soil. Plant into moist potting mix, firm gently, water lightly and keep in bright indirect light.',
      seen(c, 'Several healthy roots recorded')),

    c => c.isMint && c.stage === 'rooting' && c.ever('transplanted') && rec('mint-stage', 3,
      'Set the stage to “Vegetative growth” in your next log',
      'The cutting is in soil now, so the rooting stage is complete.',
      'Transplant recorded',
      logLink(c)),

    c => {
      if (!c.inWater || c.latest?.roots === 'several') return null;
      const since = c.lastWaterChange?.datetime || c.plant.startDate;
      if (!since) return null;
      const days = hoursSince(since, c.now) / DAY_H;
      return days >= 2 && rec('mint-water', 1,
        'Refresh the water in the glass',
        'Fresh water every 2–3 days keeps bacteria down and the stem healthy. Rinse the glass too, and log it as “Refreshed rooting water”.',
        c.lastWaterChange ? `Water last refreshed ${ago(days * DAY_H)}` : 'No water change recorded since the start');
    },

    c => c.inWater && ['nubs', 'short'].includes(c.latest?.roots) && rec('mint-roots-growing', 3,
      'Wait for the roots to lengthen',
      'Roots are forming. Transplant once there are several roots a few centimetres long.',
      seen(c, LABELS.roots[c.latest.roots])),

    c => c.inWater && (!c.latest?.roots || c.latest.roots === 'none') && !((c.day ?? 0) >= 21) && rec('mint-no-roots', 3,
      'Keep the stem in clean water, in bright indirect light',
      'Roots usually appear within 1–2 weeks, sometimes longer. Keep all the leaves above the waterline.',
      c.day == null ? 'No roots recorded yet' : `Day ${c.day}, no roots recorded yet`),

    c => c.inWater && c.latest?.roots === 'none' && c.day >= 21 && rec('mint-slow', 2,
      'Start a few fresh cuttings as a backup',
      'Supermarket mint is often stressed by storage, so not every stem roots. Cut healthy 10–15 cm stems just below a leaf joint and remove the lower leaves.',
      `Day ${c.day}, still no roots`),

    c => c.isMint && c.lastTransplant && hoursSince(c.lastTransplant.datetime, c.now) < 7 * DAY_H && rec('mint-settle', 2,
      'Let it settle in bright, indirect light',
      'A newly transplanted cutting loses water easily. Keep the soil lightly moist and introduce morning sun gradually.',
      `Transplanted ${ago(hoursSince(c.lastTransplant.datetime, c.now))}`),

    c => c.isMint && c.stage === 'vegetative' && (c.maxHeight ?? 0) >= 15 &&
      !(c.lastPinch && hoursSince(c.lastPinch.datetime, c.now) < 14 * DAY_H) && rec('mint-pinch', 3,
      'Pinch the growing tips',
      'Pinching just above a pair of leaves makes mint bushier. Harvest no more than about a third of the plant at once.',
      `Height has reached ${c.maxHeight} cm`),

    c => c.isMint && c.stage === 'flowering' && rec('mint-flowers', 3,
      'Pinch off the flower buds',
      'Flowering slows leaf growth; removing buds keeps the plant leafy.',
      'Flowering stage'),
  ];

  function recommend(plant, obs, now = new Date()) {
    const c = context(plant, obs, now);
    const list = rules.map(r => r(c)).filter(Boolean)
      .map(r => ({ ...r, key: `${r.rule}@${c.latest?.id || 'start'}` }))
      .sort((a, b) => a.priority - b.priority);
    if (!list.length) {
      list.push({
        rule: 'all-good', priority: 3, key: `all-good@${c.latest?.id || 'start'}`,
        action: 'Nothing urgent: keep observing',
        why: 'Check the soil morning and evening, and log any change you notice.',
        trigger: c.latest ? seen(c, 'No rule triggered by the latest observation') : 'No data yet',
        link: logLink(c),
      });
    }
    return list;
  }

  return { context, recommend };
})();
