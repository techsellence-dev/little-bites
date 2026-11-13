// Rule-based weekly menu planner. Pure functions; no DOM.
//
// Rule kinds (all optional days[] / meals[] = "every day" / "every meal"):
//   exclude     {target}                      never serve anything matching target
//   include     {target, timesPerWeek}        serve target on N distinct days
//   day_only    {target, days, meals?}        on those days (meals), serve only target
//   remove_meal {meals, days?}                skip that meal
// `target` can be a dish, ingredient, category, nutrient or allergen.
const Engine = (() => {
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'];
  const SLOT = { breakfast: 'b', lunch: 'l', snack: 's', dinner: 'd' };
  const BUILTIN = [
    { target: 'iron', timesPerWeek: 6 }, { target: 'protein', timesPerWeek: 6 },
    { target: 'fibre', timesPerWeek: 6 }, { target: 'vitamin c', timesPerWeek: 5 },
    { target: 'vitamin a', timesPerWeek: 4 }, { target: 'calcium', timesPerWeek: 3 },
  ];
  const SYN = { yogurt: 'curd', yoghurt: 'curd', dahi: 'curd', veggies: 'vegetable', veggie: 'vegetable',
    vegetables: 'vegetable', milk: 'dairy', 'dairy products': 'dairy', 'non veg': 'meat', 'non-veg': 'meat',
    lentils: 'lentil', fiber: 'fibre', 'omega 3': 'omega-3', nut: 'nuts', peanuts: 'nuts', cheese: 'paneer',
    // Bengali / Hindi / transliterated terms (the LLM normally maps these; this covers the offline path)
    maachh: 'fish', mach: 'fish', macher: 'fish', maacher: 'fish', 'মাছ': 'fish', 'মাছের': 'fish', 'मछली': 'fish',
    dim: 'egg', 'ডিম': 'egg', 'ডিমের': 'egg', 'अंडा': 'egg', anda: 'egg',
    murgi: 'chicken', murgir: 'chicken', 'মুরগি': 'chicken', 'মুরগির': 'chicken', mangsho: 'meat', 'মাংস': 'meat', 'चिकन': 'chicken',
    doi: 'curd', 'দই': 'curd', 'दही': 'curd', 'দুধ': 'dairy', 'दूध': 'dairy', dudh: 'dairy', 'ছানা': 'chhana', 'पनीर': 'paneer',
    bhaat: 'rice', bhat: 'rice', 'ভাত': 'rice', 'चावल': 'rice', 'ডাল': 'lentil', 'दाल': 'lentil', dal: 'lentil',
    alu: 'potato', aloo: 'potato', 'আলু': 'potato', 'आलू': 'potato', lau: 'lau', 'লাউ': 'lau', kumro: 'pumpkin', 'কুমড়ো': 'pumpkin',
    kola: 'banana', 'কলা': 'banana', 'केला': 'banana', aam: 'mango', 'আম': 'mango', 'आम': 'mango', 'ফল': 'fruit', 'फल': 'fruit',
    'সবজি': 'vegetable', 'सब्जी': 'vegetable', shaak: 'spinach', 'শাক': 'spinach', 'পালং': 'spinach', 'গ্লুটেন': 'gluten', 'ঘি': 'ghee' };

  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{M}0-9\- ]/gu, ' ').replace(/\s+/g, ' ').trim();
  const sing = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
  const words = (s) => norm(s).split(' ').map(sing).join(' ');

  function matches(food, target) {
    let t = norm(target);
    if (!t) return false;
    t = words(SYN[t] || t);
    const terms = [food.n, food.bn || '', ...food.ing, food.cat, ...food.a, ...food.nut, ...food.tags];
    return terms.some((x) => {
      const v = words(x);
      return (` ${v} `).includes(` ${t} `) || (` ${t} `).includes(` ${v} `);
    });
  }

  const inScope = (r, day, meal) =>
    (!r.days || !r.days.length || r.days.includes(day)) && (!r.meals || !r.meals.length || r.meals.includes(meal));

  const dietOK = (f, diet) => diet === 'nonveg' || (diet === 'egg' && f.d !== 'nonveg') || f.d === 'veg';

  function ageMonths(dob, now = new Date()) {
    const d = new Date(dob);
    if (isNaN(d)) return 6;
    let m = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (now.getDate() < d.getDate()) m--;
    return Math.max(0, m);
  }

  // The baby's age in months on a given date. A manual age (profile.ageOverride = {months, since}) keeps
  // advancing with the calendar from the date it was set, so the menu moves up by itself over time.
  function profileAge(profile, now = new Date()) {
    const o = profile && profile.ageOverride;
    if (o && Number.isFinite(+o.months)) {
      const since = new Date(o.since);
      return Math.max(0, Math.floor(+o.months) + (isNaN(since) ? 0 : ageMonths(o.since, now)));
    }
    return profile && profile.dob ? ageMonths(profile.dob, now) : Math.max(0, (profile && profile.ageMonths) || 6);
  }

  // Every age gets four meals a day; younger babies simply get smaller, smoother tastes (see stageInfo in app.js).
  const activeMeals = () => MEALS;
  const WEEKS = 4; // length of the repeating menu cycle
  const HORIZON = 52; // weeks shown (about a year)
  const evenly = (arr, n) => (n >= arr.length ? arr : Array.from({ length: n }, (_, i) => arr[Math.floor(((i + 0.5) * arr.length) / n)]));

  // Rules may be bounded by baby's age in months (e.g. an influencer says "from 8 months").
  const activeRules = (rules, age) => rules.filter((r) => (!r.minAge || age >= r.minAge) && (!r.maxAge || age <= r.maxAge));

  function context(FOODS, profile, allRules) {
    const age = Math.max(6, profile.ageMonths || 6);
    const rules = activeRules(allRules, age);
    const pool = FOODS.filter((f) => f.m <= age && dietOK(f, profile.diet || 'veg') && !(profile.allergies || []).some((a) => f.a.includes(a)));
    const excl = rules.filter((r) => r.kind === 'exclude');
    const ok = (f, day, meal) => !excl.some((r) => inScope(r, day, meal) && matches(f, r.target));
    return { age, pool, ok, rules };
  }

  function candidates(FOODS, profile, rules, day, meal) {
    const { pool, ok } = context(FOODS, profile, rules);
    return pool.filter((f) => f.s.includes(SLOT[meal]) && ok(f, day, meal));
  }

  // Builds one week. `opts.week` (0-based) varies the picks; `opts.usage` is shared across weeks so a
  // dish used earlier in the 4-week plan is avoided until the fresher options are used up.
  function buildWeek(FOODS, profile, rules = [], swaps = {}, opts = {}) {
    const week = opts.week || 0;
    const ctx = context(FOODS, profile, rules);
    const { age, pool, ok } = ctx;
    rules = ctx.rules; // only rules whose age window includes this baby
    const meals = activeMeals(age);
    const warnings = [];
    const plan = {}, locked = {}, usage = opts.usage || {};
    DAYS.forEach((d) => { plan[d] = {}; locked[d] = {}; });
    const seed = profile.seed || 1;
    const use = (f) => { usage[f.id] = (usage[f.id] || 0) + 1; };

    // 1. Base plan, with remove_meal and day_only handled per slot.
    for (const day of DAYS) for (const meal of meals) {
      if (rules.some((r) => r.kind === 'remove_meal' && inScope(r, day, meal))) { plan[day][meal] = null; locked[day][meal] = 'rule'; continue; }
      const only = rules.filter((r) => r.kind === 'day_only' && inScope(r, day, meal));
      const r = rng(hash(`${seed}|${week}|${day}|${meal}`));
      // Prefer dishes not used yet in the plan, not already served today, and (gently) ones suited to the baby's current stage.
      const today = (f) => meals.some((m) => plan[day][m] && plan[day][m].id === f.id) ? 25 : 0;
      const score = (f) => (usage[f.id] || 0) * 10 + today(f) + Math.min(age - f.m, 6) * 0.8 + r() * 5;
      let pick = null;
      if (only.length) {
        const m = pool.filter((f) => ok(f, day, meal) && only.some((o) => matches(f, o.target)));
        const fit = m.filter((f) => f.s.includes(SLOT[meal]));
        const c = fit.length ? fit : m;
        if (c.length) { pick = c.sort((a, b) => score(a) - score(b))[0]; locked[day][meal] = 'rule'; }
        else warnings.push(`Nothing suitable for "${only[0].target}" on ${DAY_NAMES[day]} ${meal} at this age/diet; showing the normal menu instead.`);
      }
      if (!pick) {
        const c = pool.filter((f) => f.s.includes(SLOT[meal]) && ok(f, day, meal));
        if (!c.length) { warnings.push(`No ${meal} options left on ${DAY_NAMES[day]} after your exclusions.`); plan[day][meal] = null; continue; }
        pick = c.sort((a, b) => score(a) - score(b))[0];
      }
      plan[day][meal] = pick; use(pick);
    }

    // 2. include rules (user first, then built-in nutrient balance).
    const applyInclude = (rule, builtin) => {
      const days = rule.days && rule.days.length ? rule.days : DAYS;
      const N = Math.min(rule.timesPerWeek || days.length, days.length);
      const rm = (rule.meals && rule.meals.length ? rule.meals : meals).filter((m) => meals.includes(m));
      const has = (d) => meals.some((m) => plan[d][m] && matches(plan[d][m], rule.target));
      const need = N - days.filter(has).length;
      if (need <= 0) return;
      const lacking = days.filter((d) => !has(d));
      let done = 0;
      for (const d of evenly(lacking, need)) {
        const opts = [];
        for (const m of rm) {
          if (locked[d][m]) continue;
          pool.filter((f) => f.s.includes(SLOT[m]) && ok(f, d, m) && matches(f, rule.target)).forEach((f) => opts.push([m, f]));
        }
        if (!opts.length) continue;
        const [m, f] = opts[Math.floor(rng(hash(`${seed}|${week}|${rule.target}|${d}`))() * opts.length)];
        plan[d][m] = f; locked[d][m] = builtin ? 'auto' : 'rule'; use(f); done++;
      }
      if (!builtin && done < need) {
        const any = pool.some((f) => matches(f, rule.target) && rm.some((m) => f.s.includes(SLOT[m])));
        warnings.push(any
          ? `Could only fit "${rule.target}" ${N - need + done}× a week (other meals were already fixed by your rules).`
          : `No "${rule.target}" dishes found for this age/diet in the menu database.`);
      }
    };
    rules.filter((r) => r.kind === 'include').forEach((r) => applyInclude(r, false));
    BUILTIN.forEach((b) => applyInclude(b, true));

    // 3. Manual swaps (food ids) override anything not fixed by a rule.
    for (const day of DAYS) for (const meal of meals) {
      const id = swaps[`${week}|${day}|${meal}`] || (week === 0 && swaps[`${day}|${meal}`]);
      if (!id || locked[day][meal] === 'rule') continue;
      const f = pool.find((x) => x.id === id);
      if (f && f.s.includes(SLOT[meal]) && ok(f, day, meal)) { plan[day][meal] = f; locked[day][meal] = 'manual'; }
    }
    return { plan, locked, meals, warnings, age };
  }

  // Builds a long, scrollable plan (default 52 weeks). The menu repeats in a 4-week cycle (week 5 = week 1,
  // week 6 = week 2, ...), but every week is planned for the baby's age at the start of that week: while the
  // age is unchanged a week simply repeats the one 4 weeks earlier, and when the baby moves up a month the
  // week is re-planned with age-appropriate dishes. Swaps are stored per cycle week (0-3), so they repeat too.
  function buildPlan(FOODS, profile, rules = [], swaps = {}, weeks = HORIZON, now = new Date()) {
    const usages = [];
    const monday = new Date(now); monday.setHours(12, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const out = [];
    for (let n = 0; n < weeks; n++) {
      const start = new Date(monday); start.setDate(start.getDate() + 7 * n);
      const age = profileAge(profile, n === 0 ? now : start);
      const cycle = n % WEEKS, prev = n >= WEEKS ? out[n - WEEKS] : null;
      if (prev && prev.age === Math.max(6, age)) { out.push({ ...prev, week: n, cycle, start, repeatOf: prev.repeatOf != null ? prev.repeatOf : prev.week }); continue; }
      const block = Math.floor(n / WEEKS);
      const r = buildWeek(FOODS, { ...profile, ageMonths: age }, rules, swaps, { week: cycle, usage: usages[block] || (usages[block] = {}) });
      out.push({ ...r, week: n, cycle, start, repeatOf: null });
    }
    return { weeks: out, meals: activeMeals(), age: out[0].age };
  }

  return { DAYS, DAY_NAMES, MEALS, WEEKS, HORIZON, buildWeek, buildPlan, candidates, matches, ageMonths, profileAge, activeMeals };
})();

if (typeof module !== 'undefined') module.exports = Engine;
