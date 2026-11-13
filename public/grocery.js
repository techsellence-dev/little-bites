// Grocery list built from the meals planned for one or more weeks. Pure functions; no DOM.
// Ingredient names in foods.js include aliases (chire/poha, lau/bottle gourd, rui/fish ...), so each is
// mapped to one shopping item and one aisle group. Quantities are shown as "used in N meals" rather than
// grams, because portions depend on the baby and on how much the family cooks together.
const Grocery = (() => {
  const G = { grain: 'Rice, flours & grains', lentil: 'Lentils & pulses', veg: 'Vegetables', fruit: 'Fruit', dairy: 'Dairy & eggs', protein: 'Fish & chicken', nut: 'Nuts' };
  const ORDER = ['grain', 'lentil', 'veg', 'fruit', 'dairy', 'protein', 'nut'];
  const I = (label, group) => ({ label, group });
  const CANON = {
    rice: I('Rice', 'grain'), wheat: I('Atta (wheat flour) for ruti', 'grain'), dalia: I('Dalia (broken wheat)', 'grain'),
    suji: I('Suji (semolina)', 'grain'), ragi: I('Ragi flour', 'grain'), oats: I('Oats', 'grain'), muri: I('Muri (plain puffed rice)', 'grain'),
    chire: I('Chire / poha (flattened rice)', 'grain'), poha: I('Chire / poha (flattened rice)', 'grain'), makhana: I('Makhana (fox nuts)', 'grain'),
    besan: I('Besan (gram flour)', 'lentil'),
    'moong dal': I('Moong dal', 'lentil'), 'masoor dal': I('Masoor dal (red lentils)', 'lentil'), 'toor dal': I('Toor dal', 'lentil'),
    'chana dal': I('Chana dal', 'lentil'), chickpea: I('Black chickpeas (kala chana)', 'lentil'), chola: I('Black chickpeas (kala chana)', 'lentil'),
    'yellow peas': I('Dried yellow peas', 'lentil'),
    potato: I('Potato', 'veg'), 'sweet potato': I('Sweet potato (rangaalu)', 'veg'), pumpkin: I('Pumpkin (misti kumro)', 'veg'),
    carrot: I('Carrot', 'veg'), beetroot: I('Beetroot', 'veg'), tomato: I('Tomato', 'veg'), spinach: I('Palong shaak (spinach)', 'veg'),
    lau: I('Lau (bottle gourd)', 'veg'), 'bottle gourd': I('Lau (bottle gourd)', 'veg'), potol: I('Potol (pointed gourd)', 'veg'),
    peas: I('Green peas', 'veg'), beans: I('Green beans', 'veg'), 'raw banana': I('Kancha kola (raw banana)', 'veg'),
    banana: I('Ripe banana', 'fruit'), apple: I('Apple', 'fruit'), papaya: I('Ripe papaya', 'fruit'), guava: I('Guava (peyara)', 'fruit'),
    mango: I('Mango (ripe, in season)', 'fruit'), orange: I('Orange (komola)', 'fruit'), komola: I('Orange (komola)', 'fruit'),
    chikoo: I('Chikoo (sapota)', 'fruit'), sapota: I('Chikoo (sapota)', 'fruit'), watermelon: I('Watermelon (seedless)', 'fruit'),
    curd: I('Plain curd (doi), unsweetened', 'dairy'), chhana: I('Fresh chhana (unsalted)', 'dairy'), paneer: I('Fresh chhana (unsalted)', 'dairy'),
    egg: I('Eggs', 'dairy'),
    chicken: I('Chicken', 'protein'), rui: I('Rui fish (boneless)', 'protein'), bhetki: I('Bhetki fish (boneless)', 'protein'),
    katla: I('Katla fish (boneless)', 'protein'), fish: I('Fish (boneless)', 'protein'),
    almond: I('Almonds (to grind fine)', 'nut'),
  };

  // One dish's ingredients as a de-duplicated list of shopping items.
  function itemsOf(food) {
    const ing = new Set(food.ing);
    const out = new Map();
    for (const raw of food.ing) {
      if (raw === 'wheat' && ing.has('dalia')) continue; // dalia already is the wheat
      if (raw === 'fish' && ['rui', 'bhetki', 'katla'].some((x) => ing.has(x))) continue; // a named fish is more useful
      const c = CANON[raw];
      if (c) out.set(c.label, c); else out.set(raw, I(raw.charAt(0).toUpperCase() + raw.slice(1), 'veg'));
    }
    return [...out.values()];
  }

  // weeks: array of week plans ({plan:{day:{meal:food}}}); meals: meal names to include.
  function build(weeks, days, meals) {
    const map = new Map();
    let mealCount = 0;
    for (const w of weeks) for (const d of days) for (const m of meals) {
      const f = w.plan[d] && w.plan[d][m];
      if (!f) continue;
      mealCount++;
      for (const it of itemsOf(f)) {
        const e = map.get(it.label) || { label: it.label, group: it.group, meals: 0, dishes: new Set() };
        e.meals++; e.dishes.add(f.n); map.set(it.label, e);
      }
    }
    const groups = ORDER.map((g) => ({
      key: g, title: G[g],
      items: [...map.values()].filter((e) => e.group === g).sort((a, b) => b.meals - a.meals || a.label.localeCompare(b.label))
        .map((e) => ({ label: e.label, meals: e.meals, dishes: [...e.dishes] })),
    })).filter((g) => g.items.length);
    return { groups, mealCount, itemCount: map.size };
  }

  function toText(title, list, done = () => false) {
    const lines = [`Little Bites grocery list: ${title}`, `${list.itemCount} items for ${list.mealCount} meals`, ''];
    for (const g of list.groups) {
      lines.push(g.title.toUpperCase());
      g.items.forEach((i) => lines.push(`${done(i.label) ? '[x]' : '[ ]'} ${i.label} (${i.meals} ${i.meals === 1 ? 'meal' : 'meals'})`));
      lines.push('');
    }
    lines.push('Pantry basics (water, optional ghee, lemon) are not listed. No added salt, sugar or honey.');
    return lines.join('\n');
  }

  return { build, toText, itemsOf };
})();

if (typeof module !== 'undefined') module.exports = Grocery;
