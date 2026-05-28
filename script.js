/* =========================================================
   98125 Landing — Interactive Logic v2
   Adrian Willanger · Kelly Right Real Estate
   ========================================================= */

// ----- NEIGHBORHOOD BASELINES (illustrative, NWMLS-aligned ranges) -----
// price = baseline median, dom = avg days on market, demand = market temp
const NBHDS = {
  "lake-city":       { name:"Lake City",       price:745000,  dom:16, demand:"High",      yoy:1.4, stl:100.5, growth:[ -1, 0, 0, 1, 2, 3, 3, 4, 5, 5, 6, 7] },
  "victory-heights": { name:"Victory Heights", price:895000,  dom: 9, demand:"Very High", yoy:3.6, stl:103.2, growth:[ -2, -1, 0, 1, 2, 4, 5, 6, 7, 8, 9,10] },
  "cedar-park":      { name:"Cedar Park",      price:825000,  dom:12, demand:"High",      yoy:2.1, stl:101.8, growth:[ -1, 0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7] },
  "matthews-beach":  { name:"Matthews Beach",  price:1120000, dom:11, demand:"Very High", yoy:4.8, stl:102.4, growth:[ -1, 0, 1, 2, 3, 5, 6, 7, 8, 9,10,11] },
  "meadowbrook":     { name:"Meadowbrook",     price:815000,  dom:13, demand:"High",      yoy:2.3, stl:101.2, growth:[  0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7] },
  "olympic-hills":   { name:"Olympic Hills",   price:735000,  dom:18, demand:"Medium",    yoy:0.8, stl: 99.8, growth:[ -2, -2, -1, 0, 0, 1, 1, 2, 2, 3, 3, 4] },
  "jackson-park":    { name:"Jackson Park",    price:780000,  dom:14, demand:"High",      yoy:1.9, stl:100.9, growth:[ -1, 0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6] },
  "pinehurst":       { name:"Pinehurst",       price:765000,  dom:15, demand:"High",      yoy:2.0, stl:101.0, growth:[ -1, 0, 0, 1, 2, 2, 3, 3, 4, 5, 6, 7] }
};

// ----- HOME STYLE MULTIPLIERS (apply to neighborhood baseline) -----
const STYLES = {
  "rambler":       { label:"Rambler",                 pMul:0.96, domMul:0.85, demandBump: 1, notes:"Single-level ramblers attract downsizers and first-time buyers — they move quickly when staged." },
  "onestory-bsmt": { label:"1-Story w/ Basement",     pMul:1.02, domMul:0.95, demandBump: 1, notes:"A 98125 classic. Buyers love the bonus square footage and ADU/rental potential — especially post-HB 1110." },
  "split":         { label:"Split-Level",             pMul:0.98, domMul:0.90, demandBump: 0, notes:"Split-levels are selling about 7% faster than last year. Flexible layouts win with growing families." },
  "twostory":      { label:"Two-Story Traditional",   pMul:1.08, domMul:0.95, demandBump: 0, notes:"Two-story traditionals command a premium for true bedroom count and clean layouts." },
  "contemporary":  { label:"Contemporary",            pMul:1.18, domMul:0.85, demandBump: 1, notes:"Modern/contemporary builds are the price-per-sqft leaders in 98125 — light, open, and in short supply." },
  "townhome":      { label:"Townhome",                pMul:0.72, domMul:1.10, demandBump:-1, notes:"Townhomes near Lake City Way benefit from light rail proximity — but pricing tier matters a lot." },
  "condo":         { label:"Condo",                   pMul:0.48, domMul:1.45, demandBump:-1, notes:"Condo demand is softer this quarter. Well-priced units under $450K still go in under 2 weeks; HOA strength is everything." },
  "new":           { label:"New Construction",        pMul:1.32, domMul:1.05, demandBump: 0, notes:"HB 1110 unlocked more lot-splits in 98125. New-build townhomes and DADUs command premium PSF." }
};

// ----- AGE MODIFIERS -----
const AGES = {
  "pre1940":  { label:"Pre-1940",  pMul:0.94, notes:"Pre-war character homes — premium for original detail, discount for deferred maintenance." },
  "1940-59":  { label:"1940–1959", pMul:0.96, notes:"Post-war stock dominates NE Seattle. Buyers often factor a kitchen/bath refresh into offers." },
  "1960-79":  { label:"1960–1979", pMul:0.98, notes:"Mid-century homes with good bones — strong appeal when systems have been updated." },
  "1980-99":  { label:"1980–1999", pMul:1.02, notes:"Late-century homes need fewer updates and tend to appraise cleanly." },
  "2000+":    { label:"2000+",     pMul:1.10, notes:"Newer construction commands a premium for modern systems, layouts, and efficiency." }
};

const DEMAND_LADDER = ["Low","Medium","High","Very High"];
function adjustDemand(base, bump){
  let i = DEMAND_LADDER.indexOf(base);
  i = Math.max(0, Math.min(DEMAND_LADDER.length-1, i + bump));
  return DEMAND_LADDER[i];
}

// ----- STATE -----
const state = { style:null, nbhd:null, age:null };

// ----- ELEMENT REFS -----
const typeGrid   = document.getElementById("type-grid");
const ageChips   = document.getElementById("age-chips");
const nbhdGrid   = document.getElementById("nbhd-grid");
const comboCard  = document.getElementById("combo-card");
const pillStyle  = document.getElementById("pill-style");
const pillNbhd   = document.getElementById("pill-nbhd");
const pillReady  = document.getElementById("pill-ready");

// ----- HANDLERS -----
typeGrid.addEventListener("click", (e) => {
  const tile = e.target.closest(".type-tile");
  if(!tile) return;
  typeGrid.querySelectorAll(".type-tile").forEach(t => t.classList.remove("active"));
  tile.classList.add("active");
  state.style = tile.dataset.type;
  pillStyle.textContent = "✓ " + STYLES[state.style].label;
  pillStyle.classList.add("filled");
  document.getElementById("tag-type").value = "hometype:"+state.style;
  updateCombo();
});

ageChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".age-chip");
  if(!chip) return;
  ageChips.querySelectorAll(".age-chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  state.age = chip.dataset.age;
  document.getElementById("tag-age").value = "age:"+state.age;
  updateCombo();
});

nbhdGrid.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if(!tile) return;
  nbhdGrid.querySelectorAll(".tile").forEach(t => t.classList.remove("active"));
  tile.classList.add("active");
  state.nbhd = tile.dataset.nbhd;
  pillNbhd.textContent = "✓ " + NBHDS[state.nbhd].name;
  pillNbhd.classList.add("filled");
  document.getElementById("tag-nbhd").value = "neighborhood:"+state.nbhd;
  updateCombo();
});

// ----- COMBO ANALYSIS GENERATOR -----
function fmtMoney(n){
  if(n >= 1_000_000) return "$" + (n/1_000_000).toFixed(2) + "M";
  return "$" + Math.round(n/1000) + "K";
}
function fmtMoneyFull(n){
  return "$" + Math.round(n).toLocaleString();
}

function updateCombo(){
  if(!state.style || !state.nbhd){
    pillReady.classList.remove("live");
    pillReady.textContent = "your custom snapshot";
    return;
  }

  pillReady.classList.add("live");
  pillReady.textContent = "✓ snapshot ready ↓";

  const n = NBHDS[state.nbhd];
  const s = STYLES[state.style];
  const a = state.age ? AGES[state.age] : null;

  // Combined multipliers
  const priceMul = s.pMul * (a ? a.pMul : 1);
  const adjPrice = Math.round((n.price * priceMul) / 500) * 500;
  const adjDom = Math.max(4, Math.round(n.dom * s.domMul));
  const adjDemand = adjustDemand(n.demand, s.demandBump);
  const adjYoy = (n.yoy + (s.pMul > 1 ? 0.6 : -0.3)).toFixed(1);
  const adjStl = (n.stl + (adjDemand === "Very High" ? 1.2 : adjDemand === "High" ? 0.4 : -0.6)).toFixed(1);

  // Eyebrow + title
  const eyebrowParts = [n.name, s.label];
  if(a) eyebrowParts.push(a.label);
  document.getElementById("combo-eyebrow").textContent = eyebrowParts.join(" · ");
  document.getElementById("combo-title").textContent = `${s.label} homes in ${n.name}`;
  document.getElementById("combo-chart-label").textContent = `${n.name} · ${s.label}`;
  document.getElementById("combo-demand").textContent = "Demand: " + adjDemand;

  // Stats
  document.getElementById("combo-price").textContent = fmtMoneyFull(adjPrice);
  document.getElementById("combo-dom").textContent   = adjDom + " days";
  document.getElementById("combo-stl").textContent   = adjStl + "%";
  const yoyEl = document.getElementById("combo-yoy");
  yoyEl.textContent = (adjYoy >= 0 ? "+" : "") + adjYoy + "%";
  yoyEl.className = adjYoy >= 0 ? "up" : "down";

  // Chart — 12 months of generated trend
  drawComboChart(adjPrice, n.growth);

  // Narrative
  let narrative = `<strong>${s.label}s in ${n.name}</strong> are trending ${adjYoy >= 0 ? "up" : "down"} ${Math.abs(adjYoy)}% year over year, with a typical sale around <strong>${fmtMoneyFull(adjPrice)}</strong> and an average <strong>${adjDom}-day</strong> time on market. ${s.notes}`;
  if(a){
    narrative += ` Given the home's age range (${a.label}), expect a ${a.pMul > 1 ? "modest premium" : a.pMul < 1 ? "value adjustment" : "neutral effect"}: ${a.notes}`;
  }
  document.getElementById("combo-narrative").innerHTML = narrative;

  // Last 3 sales — generated around the adjusted price
  const sales = generateSales(adjPrice, n.name);
  document.getElementById("combo-sales").innerHTML = sales.map(x =>
    `<div class="sale"><strong>${fmtMoneyFull(x.price)}</strong><span>${x.addr}</span><span>${x.det}</span></div>`
  ).join("");

  // Reveal card
  comboCard.hidden = false;
  // Scroll into view if user has just completed the combo
  setTimeout(() => {
    if(comboCard.getBoundingClientRect().top > window.innerHeight * 0.6){
      comboCard.scrollIntoView({behavior:"smooth", block:"center"});
    }
  }, 60);
}

// ----- CHART RENDERER -----
function drawComboChart(currentPrice, growthPct){
  // growthPct is array of 12 monthly % deltas (from a year ago to now).
  // Build a 12-point series ending at currentPrice.
  const months = 12;
  const startPrice = currentPrice / (1 + (growthPct[months-1]/100));
  const series = growthPct.map(pct => startPrice * (1 + pct/100));
  // Add a 13th point for "now" leveled at currentPrice
  series.push(currentPrice);

  const W = 600, H = 180, PAD = 10;
  const max = Math.max(...series) * 1.02;
  const min = Math.min(...series) * 0.96;
  const xStep = (W - PAD*2) / (series.length - 1);
  const yScale = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD*2);

  const points = series.map((v,i) => [PAD + i*xStep, yScale(v)]);
  const linePath = points.map((p,i) => (i===0?"M":"L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaPath = linePath + ` L${(W-PAD).toFixed(1)},${H} L${PAD},${H} Z`;

  document.getElementById("combo-line").setAttribute("d", linePath);
  document.getElementById("combo-area").setAttribute("d", areaPath);

  const dotsEl = document.getElementById("combo-dots");
  dotsEl.innerHTML = points.map((p,i) =>
    (i === points.length-1) ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5"/>` : ""
  ).join("");
}

// ----- SAMPLE SALES GENERATOR -----
function generateSales(centerPrice, nbhdName){
  // street stems per neighborhood-ish — kept generic for 98125
  const streets = {
    "Lake City":       ["30th Ave NE","28th Ave NE","33rd Ave NE","Lake City Way NE"],
    "Victory Heights": ["20th Ave NE","19th Ave NE","22nd Ave NE","NE 130th St"],
    "Cedar Park":      ["35th Ave NE","37th Ave NE","33rd Ave NE","NE 143rd St"],
    "Matthews Beach":  ["NE 95th St","NE 92nd St","NE 97th St","Sand Point Way NE"],
    "Meadowbrook":     ["35th Ave NE","38th Ave NE","33rd Ave NE","NE 107th St"],
    "Olympic Hills":   ["15th Ave NE","17th Ave NE","NE 137th St","NE 145th St"],
    "Jackson Park":    ["10th Ave NE","12th Ave NE","NE 130th St","NE 137th St"],
    "Pinehurst":       ["15th Ave NE","19th Ave NE","NE 117th St","NE 125th St"]
  };
  const stems = streets[nbhdName] || ["Ave NE"];
  const variations = [-0.04, 0.015, 0.07];
  return variations.map((v,i) => {
    const num = 9000 + Math.floor(Math.random()*5000);
    const street = stems[i % stems.length];
    const bds = 3 + (i%2);
    const ba = (1.75 + (i*0.25)).toFixed(2).replace(/\.?0+$/,"");
    const sqft = 1700 + Math.floor(Math.random()*700);
    return {
      price: Math.round((centerPrice*(1+v))/500)*500,
      addr: `${num} ${street}`,
      det:  `${bds}bd · ${ba}ba · ${sqft.toLocaleString()} sqft`
    };
  });
}

// ----- TIMELINE SLIDER -----
const TIMELINES = [
  { title:"Let's get strategic — 0 to 3 months out.",
    body:"This is prime listing season in 98125. I'll send you a same-week walkthrough, prep checklist, and three pricing scenarios so you can hit the market with confidence.",
    cta:"Book a walkthrough", tag:"timeline:0-3mo" },
  { title:"Perfect timing — 3 to 6 months out.",
    body:"This is the sweet spot for prep. I'll send you a 90-day plan covering small fixes that pay back 3–5x, plus monthly market check-ins.",
    cta:"Get my 90-day plan",  tag:"timeline:3-6mo" },
  { title:"Plenty of runway — 6 to 12 months out.",
    body:"Smart sellers start here. I'll send you a quarterly value report and a slow-burn prep guide so you're not scrambling next spring.",
    cta:"Send quarterly reports", tag:"timeline:6-12mo" },
  { title:"No rush — track your home's value over time.",
    body:"Here's a simple way to watch what your home is worth, without anyone calling you. Monthly email, takes 60 seconds to read.",
    cta:"Send me monthly updates", tag:"timeline:just-curious" }
];

const slider = document.getElementById("slider");
const sliderTitle = document.getElementById("slider-title");
const sliderBody  = document.getElementById("slider-body");
const sliderCta   = document.getElementById("slider-cta");
const ticks = document.querySelectorAll(".slider-ticks span");

function updateSlider(){
  const i = +slider.value;
  const t = TIMELINES[i];
  sliderTitle.textContent = t.title;
  sliderBody.textContent  = t.body;
  sliderCta.textContent   = t.cta;
  ticks.forEach(s => s.classList.toggle("active", +s.dataset.i === i));
  const pct = (i/3)*100;
  slider.style.setProperty("--p", pct + "%");
  document.getElementById("tag-time").value = t.tag;
  updateFormTags();
}
slider.addEventListener("input", updateSlider);
updateSlider();

// ----- FORM TAGS PREVIEW -----
function updateFormTags(){
  const allTags = ["tag-nbhd","tag-type","tag-age","tag-time"]
    .map(id => document.getElementById(id).value)
    .filter(Boolean);
  document.getElementById("form-tags").innerHTML = allTags.map(t => `<span class="tag">${t}</span>`).join("");
}

// ----- EXIT-INTENT POP (timer fallback) -----
let popClosed = false;
setTimeout(() => {
  const pop = document.getElementById("exit-pop");
  if(pop && !popClosed) pop.hidden = false;
}, 25000);
document.getElementById("exit-pop").addEventListener("click", (e) => {
  if(e.target.classList.contains("exit-close")) popClosed = true;
});

// ----- CTA entry-point tracking -----
document.querySelectorAll('a[href="#report"]').forEach(a => {
  a.addEventListener("click", () => {
    const section = a.closest("section");
    if(section) document.getElementById("tag-entry").value = "entry:" + section.id;
    updateFormTags();
  });
});

// Initial tag preview
updateFormTags();
