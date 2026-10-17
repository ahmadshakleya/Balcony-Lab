# Balcony Lab: Smart Balcony Gardening

A small balcony gardening experiment combining plant biology, data collection, and web development. The project starts with cherry tomatoes grown from seeds and mint propagated from supermarket cuttings. The goal is to monitor plant growth, record observations, and build a website that recommends the next gardening steps.

## The website

A static site (plain HTML, CSS and JavaScript, no build step, no dependencies).

| Section | What it does |
|---|---|
| **Dashboard** | One card per plant: latest photo, stage, start date and day count, location, last watering, recent conditions, latest observation with what changed since the previous one, recommended next steps, and a timeline. |
| **Log** | Observation form: date/time, plant, stage, photo, height, leaf count, root development (mint while rooting), soil moisture, day/night temperature, sunlight, actions taken, symptoms and notes. Height and temperature can be marked as estimates. |
| **History** | All observations (with photos) and completed tasks. Add or edit the result of a task, undo it, or delete an observation. |
| **Charts** | Height over time, day/night temperature, and per-plant watering vs growth, with a weekly table. |
| **Settings** | Start date, location and container per plant; export, import and reset data. |

### Recommendations

`js/rules.js` holds explicit, readable rules (README §7.3). Each recommendation shows the action, a short reason, the observation or condition that triggered it, a **Mark done** button and a field to record the result. Completing a task hides it until a new observation triggers it again.

To add a rule, append a function to the `rules` array that returns `rec(id, priority, action, why, trigger)` or nothing. Priority `1` = do now, `2` = soon, `3` = keep in mind.

### Where data is stored

Everything is saved **in the browser you use** (observations in `localStorage`, photos resized to ~1280 px in IndexedDB). Nothing is uploaded, and GitHub Pages publishes only the code. Consequences:

- Use the same browser/device for logging, or move data with **Settings → Export / Import**.
- Export a backup now and then; clearing site data in the browser deletes it.

### Run it locally

Open `index.html` in a browser (double-click works). No server is needed.

### Publish on GitHub Pages

```bash
git init
git add .
git commit -m "Balcony Lab first version"
git branch -M main
git remote add origin https://github.com/<your-username>/balcony-lab.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**. The site appears at `https://<your-username>.github.io/balcony-lab/`.

### Files

```
index.html        page structure and all views
css/style.css     styles (light and dark mode, mobile layout)
js/util.js        labels and helpers (dates, photo resizing)
js/storage.js     plants, observations, tasks (localStorage) and photos (IndexedDB)
js/rules.js       rule-based recommendation engine
js/charts.js      small SVG line charts
js/app.js         routing, dashboard, form, history, charts, settings
.nojekyll         tells GitHub Pages to serve files as they are
```

---

## 1. Project Goals

- Grow cherry tomatoes from seeds.
- Propagate supermarket mint from fresh stems.
- Monitor plant growth over time.
- Record photos, measurements, watering, and environmental conditions.
- Build a simple website to visualize progress and recommend next actions.
- Explore future integrations with sensors and other IoT devices.

## 2. Current Setup

### Available materials

- Cherry tomato seeds.
- Two recycled plastic bottles, each with a capacity of 5 litres.
- Potting soil.
- Fresh supermarket mint with stems attached.
- A balcony with strong sunlight and a shaded area available during the afternoon.

### Environmental conditions

- Daytime temperature: approximately 35°C.
- Nighttime temperature: approximately 25–29°C.
- Direct sunlight for much of the day.
- A location away from direct afternoon sunlight is available.

### Planned use of the containers

| Container | Plant | Purpose |
|---|---|---|
| Bottle 1 | Cherry tomatoes | Germinate seeds and grow an initial seedling |
| Bottle 2 | Mint | Root a supermarket mint cutting and grow the plant |

**Important:** The 5-litre bottles are starting containers. Mature cherry tomatoes generally need a larger container, ideally 15–20 litres or more per plant. A 5-litre container is more suitable for mint.

## 3. Preparing the Plastic Bottles

For each bottle:

1. Wash it thoroughly.
2. Carefully cut off the top to create a wide opening.
3. Make several small drainage holes in the bottom.
4. Cover the transparent sides with opaque, light-coloured material to protect the roots from light and heat.
5. Fill with potting soil, leaving approximately 2–3 cm of space at the top.
6. Place the bottle on a stable surface or tray that allows excess water to drain.

Do not leave the bottles standing in pooled water. Ensure the cut edges are safe to handle.

Loose, well-draining potting mix is preferable to dense garden soil.

## 4. Cherry Tomato Experiment

### 4.1 Planting the seeds

1. Fill Bottle 1 with moist potting soil.
2. Plant 2–3 seeds approximately 0.5 cm deep.
3. Cover the seeds lightly with soil.
4. Water gently until the soil is moist, not saturated.
5. Keep the soil consistently moist while the seeds germinate.
6. Once seedlings develop several true leaves, keep the strongest seedling in the bottle. Transplant the others if additional containers are available.

Tomato seeds commonly germinate in approximately 5–10 days, depending on the variety and growing conditions.

### 4.2 Managing sunlight and heat

The balcony's hot climate is one of the main challenges of this experiment.

- Give seedlings bright light and gentle morning sunlight when possible.
- Place the bottle in the balcony area that avoids direct afternoon sunlight.
- Avoid placing the container against hot walls, metal railings, or sun-heated concrete.
- Maintain good airflow.
- If possible, use securely fixed, breathable shade cloth during the hottest hours.
- Avoid enclosing plants in plastic, which can trap heat.
- Introduce seedlings to stronger sunlight gradually.

At daytime temperatures around 35°C and nighttime temperatures of 25–29°C, tomatoes may grow but can struggle to flower and produce fruit. Sustained heat can reduce pollination and fruit set. A cooler growing season may provide better results.

### 4.3 Watering

Check the soil every morning and evening.

- Check the top 1–2 cm of soil.
- If the surface has dried, water slowly until excess water drains from the bottom.
- If the soil is still wet, do not water automatically.
- Water the soil rather than the leaves.
- Keep the drainage holes clear.
- Never leave the bottle standing in water.

The watering schedule should adapt to the weather, plant size, and soil moisture rather than follow a fixed daily quantity.

### 4.4 Transplanting and harvesting

As the plant grows:

1. Monitor its height, leaf development, and root growth.
2. Transplant it into a container of approximately 15–20 litres or larger when established.
3. Provide a stake or other support.
4. Maintain consistent soil moisture during flowering and fruit development.
5. Monitor flowering and fruit formation.

Cherry tomatoes may produce ripe fruit approximately 10–16 weeks or more after sowing, depending on variety and conditions. Extreme heat can delay or reduce the harvest.

## 5. Mint Experiment

The supermarket mint has stems attached, making propagation by cuttings possible. Individual detached leaves generally cannot grow into a new mint plant on their own.

### 5.1 Rooting the cutting

1. Select a healthy green stem approximately 10–15 cm long.
2. Make a clean cut just below a leaf joint.
3. Remove the leaves from the lower half of the stem.
4. Place the lower part of the stem in a clean glass of water.
5. Keep all leaves above the waterline.
6. Place the glass indoors in bright, indirect light.
7. Change the water every 2–3 days.
8. Monitor the stem for root development.

Roots may appear within approximately 1–2 weeks, sometimes longer. Supermarket mint may be stressed by storage, so not every cutting will succeed. Trying multiple stems improves the chances.

### 5.2 Transplanting the mint

Once the cutting has developed several healthy roots a few centimetres long:

1. Fill Bottle 2 with moist potting soil.
2. Make a small hole in the soil.
3. Place the rooted cutting in the hole.
4. Gently firm the soil around the stem.
5. Water lightly.
6. Keep the plant in bright, indirect light while it establishes.

### 5.3 Mint care

- Provide gentle morning sun and bright shade during hot afternoons.
- Keep the soil lightly and consistently moist, without waterlogging it.
- Check the soil every morning and evening during hot weather.
- Protect the container from intense sunlight and hot surfaces.
- Once the plant is established, pinch the growing tips to encourage bushier growth.
- Avoid harvesting more than approximately one-third of the plant at once.

Mint generally prefers more consistently moist soil than tomatoes. The two plants should therefore be monitored and watered independently.

## 6. Initial Growing Schedule

This schedule is a starting point, not a rigid set of deadlines. Plant development should determine when each step is performed.

| Period | Cherry tomatoes | Mint |
|---|---|---|
| Day 1 | Prepare bottle and sow seeds | Select stems and begin rooting in water |
| Days 2–10 | Monitor moisture and germination | Refresh water every 2–3 days |
| Weeks 1–2 | Record germination and seedling growth | Monitor roots and leaf condition |
| Weeks 2–3 | Select the strongest seedling after true leaves develop | Continue rooting until the cutting is ready |
| Weeks 3–5 or later | Assess growth and prepare a larger container | Transplant rooted cutting into soil |
| Following weeks | Provide support and monitor growth | Monitor new leaves and adjust watering |
| Later stages | Monitor flowering and fruit development | Harvest leaves gradually when established |

## 7. Website Concept: Balcony Lab

The website will serve as a personal gardening dashboard.

Its main purpose is to answer four questions:

1. How is each plant doing?
2. What has changed since the last observation?
3. What should I do next?
4. Why is that action recommended?

### 7.1 Dashboard

Each plant should have a card showing:

- Plant name and current photo.
- Current growth stage.
- Date the experiment began.
- Latest observation.
- Last watering date.
- Recent environmental conditions.
- Next recommended action.
- A timeline of previous observations.

Example plant cards:

**Mint**
- Stage: Rooting.
- Location: Indoors, bright indirect light.
- Current task: Inspect the stem and check for roots.
- Next action: Refresh the water and record any changes.

**Cherry tomatoes**
- Stage: Germination.
- Location: Balcony, protected from direct afternoon sunlight.
- Current task: Check soil moisture.
- Next action: Inspect for seedlings and record the first emergence.

These are examples of dashboard content, not claims that the plants have already reached those stages.

### 7.2 Observation logging

The website should provide a form for recording observations.

Suggested fields:

| Field | Description |
|---|---|
| Date and time | When the observation was made |
| Plant | Mint or cherry tomatoes |
| Photo | Image of the plant |
| Growth stage | Rooting, germination, seedling, vegetative growth, flowering, or fruiting |
| Height | Plant height in centimetres, when applicable |
| Leaf count | Number of visible leaves, when useful |
| Root development | Notes about visible roots |
| Soil moisture | Dry, slightly moist, moist, or wet |
| Daytime temperature | Approximate temperature in °C |
| Nighttime temperature | Approximate temperature in °C |
| Sunlight exposure | Morning sun, afternoon shade, or other |
| Actions taken | Watering, pruning, transplanting, or other actions |
| Notes | Leaf colour, wilting, new growth, pests, or other observations |

Measurements should be recorded consistently. If a value is estimated rather than measured, label it as an estimate.

### 7.3 Next-step recommendation system

Start with a simple, rule-based recommendation engine rather than complicated artificial intelligence.

Example rules:

- **Tomato seeds have not germinated:** Check soil moisture and ensure the soil is warm and moist, but not waterlogged.
- **Tomato seedling has emerged:** Provide bright light and protect it from excessive heat.
- **Tomato seedling has developed true leaves:** Select the strongest seedling and plan for eventual transplantation.
- **Mint cutting has not developed roots:** Keep the stem in clean water and refresh the water regularly.
- **Mint cutting has developed several healthy roots:** Recommend transferring it to moist potting soil.
- **Soil is wet:** Recommend waiting before watering again and checking drainage.
- **Plant is wilting during peak heat:** Check soil moisture and reduce heat exposure. Do not automatically recommend watering if the soil is already wet.
- **Tomato plant is approaching mature size:** Recommend preparing a larger container and support.
- **Plant has been watered recently:** Avoid repeating a watering recommendation unless soil conditions indicate that water is needed.

Each recommendation should include:

- The recommended action.
- A short explanation.
- The observation or condition that triggered it.
- A button to mark the task as completed.
- An option to record the result.

Visual symptoms alone do not always reveal the exact cause of a plant problem, so recommendations should be cautious.

## 8. Suggested Technical Implementation

Start with the simplest architecture that supports the experiment.

### First version

- **Frontend:** HTML, CSS, and JavaScript.
- **Data storage:** Browser local storage for a simple prototype.
- **Photos:** Store local image references or use a suitable image-upload approach.
- **Charts:** Add simple charts for height, temperature, and other measurements.
- **Recommendation logic:** JavaScript functions implementing explicit rules.

The first version does not require a backend, database, or physical sensors.

### Suggested development phases

**Phase 1 — Dashboard**
- Display two plant cards.
- Show plant stages and current tasks.
- Add basic styling for desktop and mobile.

**Phase 2 — Observation logging**
- Add a form for measurements, photos, and notes.
- Save observations in browser storage.
- Display historical observations.

**Phase 3 — Recommendations**
- Implement rule-based next-step suggestions.
- Allow tasks to be completed.
- Display the reason behind each recommendation.

**Phase 4 — Data visualization**
- Plot plant height over time.
- Display temperature observations.
- Compare watering frequency with observed growth.

**Phase 5 — IoT integration**
- Add sensors only after the manual tracking system is useful.
- Consider temperature, humidity, and soil-moisture sensors.
- Use a microcontroller such as an ESP32 to send readings to the website.
- Add alerts or reminders if appropriate.

Begin with manual observations before purchasing sensors. This creates a baseline and helps identify which measurements would genuinely improve gardening decisions.

## 9. Future Technology Experiments

Possible extensions include:

- A temperature and humidity sensor near the plants.
- A soil-moisture sensor calibrated for the potting mix.
- Automatic data uploads from a microcontroller.
- Periodic photographs for visual comparison.
- Charts comparing plant growth and environmental conditions.
- Reminders for watering and inspection.
- Computer vision to estimate plant height or leaf count from photographs.
- An experiment comparing growth under different sunlight conditions.

If comparing different conditions, change one factor at a time where practical and record other relevant differences. With only one plant per condition, results should be treated as exploratory rather than definitive.

## 10. Initial Success Criteria

The initial project is successful when:

- Cherry tomato seeds have been planted and germination is tracked.
- At least one mint cutting is being propagated.
- Both plants are protected from direct afternoon sunlight and excessive container heat.
- Observations can be added to the website.
- The dashboard displays the current stage and recommended next action for each plant.
- Previous observations and completed tasks remain available for comparison.

## 11. Immediate To-Do List

- [ ] Prepare both 5-litre bottles with drainage holes.
- [ ] Cover the bottle sides with light-coloured opaque material.
- [ ] Sow 2–3 cherry tomato seeds in Bottle 1.
- [ ] Place one or more healthy mint stems in a glass of water.
- [ ] Put the tomato bottle in bright light away from direct afternoon sunlight.
- [ ] Keep the mint cuttings in bright, indirect light.
- [ ] Record the start date and initial environmental conditions.
- [ ] Take initial photographs of both experiments.
- [x] Build the first website version with a two-plant dashboard.
- [x] Add an observation form and next-step checklist.

---

## Project Summary

**Project name:** Balcony Lab  
**Plants:** Cherry tomato (*Solanum lycopersicum*) and mint (*Mentha* species; exact species unknown)  
**Starting containers:** Two recycled 5-litre plastic bottles  
**Environment:** Approximately 35°C daytime and 25–29°C nighttime, with an afternoon-shaded balcony location available  
**Core idea:** Combine practical balcony gardening with a simple website for recording observations, visualizing growth, and recommending next steps.
