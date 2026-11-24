// Home recipes for every dish in foods.js, written for one baby portion (about 4-6 tablespoons).
// Recipes.get(food) -> { mins, makes, ing: [..], steps: [..], note } or null.
// Everything follows the app's rules: no added salt, sugar or honey, fish boneless, egg fully cooked,
// nuts only as fine powder. Not medical advice; check new foods with your paediatrician.
(function (root) {
  const WATER = (n) => `${n} cup (${n * 240} ml) water`;
  const RICE_COOK = 'Wash the rice. Simmer with the water, covered, until very soft and mushy (15 to 20 minutes), or pressure-cook for 3 whistles.';
  const DAL_COOK = 'Wash the dal until the water runs clear. Cook with the water and a pinch of turmeric until completely soft (3 whistles in a pressure cooker, or 25 minutes on the stove), then mash.';
  const STEAM = (what, mins) => `Peel, chop and steam ${what} for ${mins} minutes until a fork goes in with no resistance.`;
  const BLEND = 'Blend or mash with a splash of the steaming water to the texture your baby is ready for.';
  const WHISK_COOK = (flour, mins, extra) => `Whisk ${flour} into the cold water until there are no lumps. Cook on low heat, stirring all the time, for ${mins} minutes until it thickens. ${extra || ''}`.trim();
  const BONES = 'Flake the fish and check it twice with clean fingers for any bone, however fine. Discard skin and bones.';
  const CHECK_TEMP = 'Let it cool until just warm and test a little on your wrist.';

  // Each entry: [minutes, ingredients[], steps[]]
  const R = {};
  const add = (id, mins, ing, steps) => { R[id] = [mins, ing, steps]; };

  // ---------- grain porridges ----------
  add(1, 10, ['2 tbsp rice flour (chaaler guro)', WATER(1), '1/2 ripe banana'],
    [WHISK_COOK('the rice flour', 5), 'Mash the banana well and stir it into the warm porridge.', CHECK_TEMP]);
  add(2, 10, ['2 tbsp suji (fine semolina)', WATER(1), 'a little mashed ripe fruit, optional'],
    ['Dry-roast the suji in a pan on low heat for 2 minutes until it smells nutty. Do not let it brown.', 'Bring the water to a boil, then rain in the suji, stirring, to avoid lumps.', 'Cook on low for 4 to 5 minutes until smooth and thick. Stir in mashed fruit instead of sugar.', CHECK_TEMP]);
  add(3, 12, ['2 tbsp ragi flour', WATER(1) + ' (or breast/formula milk)'],
    [WHISK_COOK('the ragi flour', 8, 'Ragi needs the full time so it is cooked through and loses its raw smell.'), 'Add a little hot water if too thick. Make it thicker as your baby grows.', CHECK_TEMP]);
  add(4, 12, ['2 tbsp rolled oats', '1/4 apple, peeled and grated', WATER(1)],
    ['Grind the oats to a fine powder in a blender.', 'Bring the water to a boil, add the oat powder and grated apple.', 'Cook on low for 6 to 8 minutes, stirring, until very soft. Mash any apple pieces.', CHECK_TEMP]);
  add(6, 10, ['3 tbsp plain muri (puffed rice, unsalted)', WATER(1)],
    ['Grind the muri to a fine powder.', WHISK_COOK('the muri powder', 5), CHECK_TEMP]);
  add(7, 10, ['2 tbsp suji', '1 tsp almond powder (blanched almonds, ground very fine)', WATER(1)],
    ['Dry-roast the suji for 2 minutes. Boil the water, add the suji, stirring, and cook 4 to 5 minutes.', 'Stir in the almond powder off the heat. Never give whole or coarsely chopped nuts.', CHECK_TEMP]);
  add(9, 25, ['2 tbsp dalia (broken wheat)', WATER(1.5)],
    ['Wash the dalia. Pressure-cook with the water for 3 whistles, or simmer for 25 minutes, until very soft.', 'Mash lightly with a spoon, adding hot water if needed.', CHECK_TEMP]);
  add(19, 12, ['2 tbsp ragi flour', '1/4 apple, peeled and grated', WATER(1)],
    [WHISK_COOK('the ragi flour', 6), 'Add the grated apple and cook another 3 minutes until soft. Mash.', CHECK_TEMP]);
  add(20, 15, ['2 tbsp rice flour', '3 tbsp steamed kumro (pumpkin)', WATER(1)],
    [STEAM('the pumpkin', 10), 'Mash the pumpkin smooth.', WHISK_COOK('the rice flour', 5), 'Stir the pumpkin into the porridge.', CHECK_TEMP]);
  add(21, 12, ['2 tbsp suji', WATER(1), '2 tbsp ripe papaya, mashed'],
    ['Dry-roast the suji for 2 minutes. Boil the water, add the suji, stirring, and cook 4 to 5 minutes.', 'Top with the mashed ripe papaya.', CHECK_TEMP]);
  add(23, 20, ['1/4 small rangaalu (sweet potato)', '2 tbsp rice flour', WATER(1)],
    [STEAM('the sweet potato', 12), 'Mash it smooth.', WHISK_COOK('the rice flour', 5), 'Stir the sweet potato into the thin rice cereal.', CHECK_TEMP]);
  add(24, 12, ['2 tbsp rolled oats', WATER(1), '1/2 ripe banana'],
    ['Grind the oats to a fine powder.', WHISK_COOK('the oat powder', 6), 'Stir in the mashed ripe banana.', CHECK_TEMP]);
  add(26, 12, ['2 tbsp ragi flour', WATER(1), '1/2 ripe banana'],
    [WHISK_COOK('the ragi flour', 7, 'Make it slightly thicker than for a 6-month-old.'), 'Stir in the mashed banana.', CHECK_TEMP]);
  add(27, 15, ['2 tbsp suji', WATER(1), '1/4 apple, peeled and grated'],
    ['Steam the grated apple for 4 minutes until soft.', 'Dry-roast the suji for 2 minutes, boil the water, and cook the suji in it, stirring, for 5 minutes.', 'Stir in the apple.', CHECK_TEMP]);
  add(85, 15, ['3 tbsp makhana (fox nuts)', WATER(1) + ' (or breast/formula milk)'],
    ['Dry-roast the makhana on low heat for 5 minutes until crisp. Grind to a fine powder.', WHISK_COOK('2 tbsp of the powder', 5), CHECK_TEMP]);
  add(101, 15, ['2 tbsp ragi flour', WATER(1), '1/2 ripe banana'],
    [WHISK_COOK('the ragi flour', 8, 'Cook until thick enough to hold a soft shape.'), 'Mash the banana in and let the pudding cool a little. No sugar needed.']);
  add(22, 30, ['1 tbsp moong dal', '1 tbsp rice', WATER(2)],
    ['Wash the dal and rice together.', 'Cook with the water, covered, until completely mushy (about 25 minutes).', 'Strain through a sieve, pressing the solids, and serve the smooth gruel.', CHECK_TEMP]);
  add(25, 20, ['1 egg', '2 tbsp rice', WATER(1.5)],
    ['Hard-boil the egg for 12 minutes. Cool and take out only the yolk.', RICE_COOK, 'Mash the rice to a thin porridge and stir in the mashed yolk with a little warm water.', CHECK_TEMP]);
  add(29, 20, ['1 egg', '3 tbsp plain muri', WATER(1)],
    ['Hard-boil the egg for 12 minutes and mash only the yolk.', 'Grind the muri to a fine powder and cook it in the water for 5 minutes.', 'Stir in the yolk.', CHECK_TEMP]);

  // ---------- egg ----------
  add(5, 15, ['1 egg', '1 to 2 tbsp breast/formula milk or warm water'],
    ['Put the egg in boiling water and boil for 12 minutes so the yolk is fully set.', 'Cool in cold water, peel, and take out only the yolk (start with a quarter).', 'Mash with the milk or water until smooth.']);
  add(11, 20, ['1 egg', '1 soft ruti'],
    ['Boil the egg for 12 minutes until hard. Cool, peel and mash.', 'Tear the ruti into tiny soft pieces and serve with the mashed egg.']);
  add(16, 12, ['1 egg', '1 tbsp finely chopped tomato', '1 tbsp finely chopped palong (spinach)', 'a few drops of oil or ghee'],
    ['Steam or sauté the tomato and spinach for 3 minutes until soft.', 'Beat the egg and stir in the vegetables.', 'Cook in a lightly oiled pan on low heat, flipping once, until firm all through (no runny egg).', 'Chop very fine.']);
  add(94, 15, ['1 egg'], ['Boil the egg for 12 minutes until the yolk is hard.', 'Cool, peel, cut into quarters (or mash for younger babies).']);

  // ---------- chire, dairy and fruit combos ----------
  add(8, 15, ['3 tbsp chire (flattened rice, thick type)', '1/2 ripe banana', 'warm water'],
    ['Rinse the chire and soak in warm water for 10 minutes until very soft.', 'Mash with the ripe banana. No sugar or gur needed.']);
  add(13, 15, ['2 tbsp chire', '3 tbsp fresh plain curd (doi)', 'warm water'],
    ['Soak the chire in warm water for 10 minutes until very soft; drain.', 'Mix with the fresh unsweetened curd at room temperature.']);
  add(10, 25, ['1/2 litre full-fat milk', '1 tsp lemon juice', '1/2 ripe banana'],
    ['Home-made chhana: boil the milk, switch off, add the lemon juice and stir until it curdles. Strain through a muslin, rinse with water to remove the sourness, and press gently.', 'Crumble 2 tbsp of the soft chhana very finely and mash with the banana.']);
  add(95, 25, ['1/2 litre full-fat milk', '1 tsp lemon juice'],
    ['Boil the milk, switch off, add the lemon juice and stir until it curdles.', 'Strain through a muslin and rinse well with water. Press lightly, do not squeeze dry.', 'Crumble or cut into tiny soft cubes. Use fresh and unsalted.']);
  add(89, 5, ['3 tbsp fresh plain curd', '2 tbsp ripe fruit (banana or papaya)'], ['Mash the fruit.', 'Stir into room-temperature curd. No sugar.']);
  add(102, 5, ['3 tbsp fresh plain curd', '2 tbsp ripe mango or banana'], ['Mash the ripe fruit smooth.', 'Stir into room-temperature curd. No sugar.']);
  add(43, 25, ['2 tbsp rice', '3 tbsp fresh plain curd', WATER(1)],
    [RICE_COOK, 'Let the rice cool to room temperature and mash it.', 'Mix in the fresh unsweetened curd. No salt.']);

  // ---------- chilla / upma / roti ----------
  add(12, 20, ['3 tbsp moong dal', 'water', 'a few drops of oil'],
    ['Soak the dal for 3 to 4 hours. Grind to a smooth, thin batter with a little water.', 'Heat a non-stick pan with a few drops of oil. Spread a thin round of batter and cook on low until set and cooked through, flipping once.', 'Cut into finger strips.']);
  add(28, 20, ['3 tbsp moong dal', 'water', 'a few drops of oil'],
    ['Soak the dal for 3 to 4 hours and grind to a smooth, thin batter.', 'Cook a thin chilla on a lightly oiled non-stick pan until soft and cooked through.', 'Mash or tear into tiny pieces for finger-food practice.']);
  add(14, 20, ['2 tbsp suji', '1 tbsp finely chopped carrot', '1 tbsp peas', 'a few drops of oil', WATER(1)],
    ['Dry-roast the suji for 2 minutes and set aside.', 'In a little oil, cook the carrot and peas with a splash of water until very soft; mash lightly.', 'Add the water, bring to a boil, stir in the suji and cook on low for 4 minutes until fluffy. No salt.']);
  add(15, 20, ['3 tbsp besan (gram flour)', '1 tbsp grated carrot', 'water', 'a few drops of oil'],
    ['Whisk the besan with water into a thin batter. Stir in the grated carrot.', 'Cook a thin chilla on a lightly oiled pan until golden spots show and it is cooked through.', 'Cut into strips.']);
  add(17, 25, ['1 soft ruti (whole-wheat)', '1 small potato', '1/4 tsp ghee, optional'],
    ['Boil the potato until soft, peel and mash with a little of the water and the ghee.', 'Tear the ruti into small soft pieces and serve with the mash.']);
  add(18, 35, ['3 tbsp whole-wheat flour', '1 small boiled potato', 'a few drops of ghee or oil', 'water'],
    ['Mash the potato (no salt, no spice). Knead the flour with water into a soft dough.', 'Fill a small ball of dough with the potato, roll thin and cook on a pan with a few drops of ghee until soft and cooked.', 'Cut into small pieces.']);
  add(57, 15, ['1 ruti', '3 tbsp cooked soft dal (moong or masoor)'],
    ['Tear the ruti into small bits.', 'Soak in warm dal until soft and mash lightly.']);
  add(60, 25, ['1 ruti', '1 small potato', '2 tbsp carrot', '1 tbsp peas', 'a few drops of oil'],
    ['Chop the vegetables very small and cook with a little water and oil until completely soft; mash lightly. No chilli, no salt.', 'Tear the ruti into small pieces and serve with the sabji.']);

  // ---------- khichuri, dal-bhaat, rice mashes ----------
  const khichuri = (id, dal, veg, extra, mins) => add(id, mins || 30,
    ['1 tbsp rice', `1 tbsp ${dal}`, ...veg, 'a pinch of turmeric', WATER(1.5), '1/4 tsp ghee, optional'].concat(extra ? [extra.ing] : []),
    ['Wash the rice and dal together.', 'Cook with the water, turmeric and chopped vegetables until everything is very mushy (3 whistles or 25 minutes). No salt.'].concat(extra ? [extra.step] : [], ['Mash or blend to the right texture and add the ghee if using.']));
  khichuri(30, 'moong dal', []);
  khichuri(36, 'moong dal', ['1 tbsp carrot', '1 tbsp peas', '1 tbsp lau (bottle gourd)']);
  khichuri(37, 'moong dal', [], { ing: '2 tbsp palong (spinach) leaves', step: 'Blanch the palong for 1 minute, blend smooth and stir into the hot khichuri. A few drops of lemon help iron absorption.' });
  khichuri(69, 'moong dal', ['2 tbsp grated beetroot']);
  khichuri(42, 'moong dal', ['1 tbsp carrot'], { ing: '1 egg', step: 'Beat the egg and stir it into the boiling khichuri; cook 2 minutes until fully set.' });
  khichuri(71, 'moong dal', [], { ing: '1 egg', step: 'Hard-boil the egg 12 minutes; mash the yolk and stir into the khichuri.' });
  khichuri(74, 'moong dal', [], { ing: '2 tbsp fresh unsalted chhana', step: 'Crumble the fresh chhana into the khichuri at the end.' });
  khichuri(73, 'moong dal', [], { ing: '2 tbsp boneless rui or bhetki fillet', step: 'Steam the fish for 8 minutes. ' + BONES + ' Mash into the khichuri.' }, 35);
  add(53, 35, ['1 tbsp rice', '1/2 tbsp each of moong, masoor, toor and chana dal (soaked 1 hour)', 'a pinch of turmeric', WATER(2)],
    ['Wash and soak the dals for an hour; add the rice.', 'Pressure-cook with the water and turmeric for 4 whistles until very soft. No salt.', 'Mash well.']);
  add(31, 25, ['2 tbsp masoor dal', '2 tbsp rice', 'a pinch of turmeric', WATER(1.5)],
    ['Wash the dal and rice.', 'Cook together until very soft (masoor cooks fast, about 15 minutes). Mash to a smooth porridge.']);
  add(32, 25, ['1 small potato', '2 tbsp rice', 'a spoon of dal water'],
    ['Boil the potato until soft; peel.', RICE_COOK, 'Mash the potato with the soft rice and dal water.']);
  add(33, 25, ['3 tbsp pumpkin (misti kumro)', '2 tbsp rice'],
    [STEAM('the pumpkin', 10), RICE_COOK, 'Mash together.']);
  add(34, 30, ['1/4 small rangaalu (sweet potato)', '2 tbsp masoor dal', WATER(1.5)],
    [STEAM('the sweet potato', 12), DAL_COOK, 'Mash together until smooth.']);
  add(35, 30, ['2 tbsp moong dal', '1 tbsp cooked soft rice', 'a pinch of turmeric', WATER(2)],
    [DAL_COOK, 'Strain and keep the thin dal water; mash a spoon of rice into it.', 'Serve warm as a light dinner.']);
  add(38, 30, ['1 small kancha kola (raw banana)', '2 tbsp rice'],
    ['Peel the raw banana, cut up and boil 15 minutes until very soft.', RICE_COOK, 'Mash together.']);
  add(39, 30, ['2 tbsp lau (bottle gourd), peeled', '1 tbsp moong dal', '2 tbsp rice', WATER(1.5)],
    ['Wash dal and rice; cook with the chopped lau and water until very soft.', 'Mash well. No salt.']);
  add(40, 30, ['2 tbsp carrot', '2 tbsp beetroot', '2 tbsp rice', WATER(1.5)],
    ['Chop the vegetables small. Cook with the rice and water until very soft.', 'Mash or blend.']);
  add(47, 40, ['2 tbsp chana dal (soaked 2 hours)', '2 tbsp rice', 'a pinch of turmeric', WATER(2)],
    ['Soak the chana dal well, then pressure-cook with the rice, turmeric and water for 4 whistles until it squashes between fingers.', 'Mash well.']);
  add(48, 30, ['1 tomato', '2 tbsp carrot', '2 tbsp cooked soft rice'],
    ['Steam the carrot and tomato until soft. Peel the tomato skin off.', 'Blend and strain, then mix with the soft rice.']);
  add(49, 30, ['3 tbsp potol (pointed gourd), peeled and deseeded', '1 small potato', '2 tbsp rice'],
    ['Steam the potol and potato for 12 minutes until soft.', RICE_COOK, 'Mash everything together.']);
  add(54, 30, ['2 tbsp palong (spinach)', '2 tbsp fresh unsalted chhana', '2 tbsp cooked soft rice'],
    ['Blanch the palong 1 minute and blend smooth.', 'Crumble in the fresh chhana and mix with the soft rice.']);
  add(55, 60, ['2 tbsp dried yellow peas (soaked overnight)', '1 small potato', 'a pinch of turmeric'],
    ['Soak the peas overnight. Pressure-cook with the potato for 6 whistles until they squash easily.', 'Peel off skins if you can, and mash. Skip masala and chilli.']);
  add(56, 30, ['2 tbsp fresh unsalted chhana', '1 small potato', '1 tbsp tomato', 'a pinch of turmeric', 'a few drops of oil', '1 ruti'],
    ['Boil and cube the potato. Lightly sauté the tomato in a little oil with turmeric; add potato and a splash of water and simmer 5 minutes.', 'Add the crumbled chhana for the last 2 minutes. No whole spices, no chilli.', 'Mash lightly; tear the ruti into small pieces.']);
  add(58, 30, ['2 tbsp rice', '1 tbsp each carrot, peas, beans (finely chopped)', WATER(1.5), 'a few drops of ghee'],
    ['Cook the rice with the vegetables and water, covered, until very soft (no whole spices, no salt).', 'Mash lightly; add the ghee.']);
  add(61, 25, ['3 tbsp lau, peeled', '2 tbsp rice'], [STEAM('the lau', 8), RICE_COOK, 'Mash together.']);
  add(62, 25, ['2 tbsp carrot', '1 small potato', '2 tbsp rice'], [STEAM('the carrot and potato', 12), RICE_COOK, 'Mash smooth with the rice and a little cooking water.']);
  add(63, 30, ['2 tbsp moong dal', '3 tbsp pumpkin', '2 tbsp rice', WATER(1.5)],
    ['Wash dal and rice; cook with chopped pumpkin and the water until mushy.', 'Blend smooth.']);
  add(64, 25, ['2 tbsp palong (spinach)', '2 tbsp rice', 'a few drops of lemon juice'],
    ['Blanch the palong 1 minute and blend smooth.', RICE_COOK, 'Mix into the soft rice with a few drops of lemon.']);
  add(65, 25, ['3 tbsp potol', '2 tbsp rice'], ['Peel the potol, remove seeds, steam 10 minutes.', RICE_COOK, 'Mash together.']);
  add(66, 30, ['2 tbsp rice', '1 tbsp moong dal', WATER(3)],
    ['Cook the rice and dal in the water until completely soft (30 minutes).', 'Strain; serve the thin warm liquid with a little mashed rice.']);
  add(67, 25, ['1 egg', '2 tbsp rice'], ['Hard-boil the egg 12 minutes; take the yolk.', RICE_COOK, 'Mash the yolk into the soft rice with a little warm water.']);
  add(68, 30, ['2 tbsp lau', '1 tbsp masoor dal', '2 tbsp rice', WATER(1.5)],
    ['Cook everything together until very soft (about 20 minutes).', 'Mash with a fork.']);
  add(70, 30, ['1 tomato', '1 tbsp moong dal', '2 tbsp rice', WATER(1.5)],
    ['Cook the dal and rice until mushy. Meanwhile steam the tomato and peel off the skin.', 'Mash the tomato with the dal-rice.']);
  add(75, 40, ['2 tbsp boneless chicken, small pieces', '3 tbsp pumpkin', '2 tbsp rice', WATER(2)],
    ['Simmer the chicken in the water until falling apart (20 minutes); shred very fine.', 'Add the pumpkin and rice; cook until very soft and mash everything together.']);
  add(41, 40, ['3 tbsp boneless chicken', '2 tbsp rice', WATER(2)],
    ['Simmer the chicken in the water until falling apart (20 to 25 minutes). No salt, no spices.', 'Blend with the cooked rice and some of the broth.']);
  add(44, 40, ['3 tbsp boneless chicken', '1 small potato', '2 tbsp carrot', '2 tbsp rice', 'a pinch of turmeric'],
    ['Simmer the chicken, potato and carrot in 1.5 cups water with the turmeric for 20 minutes until soft. No chilli.', 'Shred the chicken finely and mash with the vegetables and cooked rice.']);
  add(59, 35, ['3 tbsp minced chicken', '1 tbsp tomato', 'a pinch of turmeric', 'a few drops of oil', '1 ruti'],
    ['Lightly sauté the tomato in a little oil. Add the mince, turmeric and 1/2 cup water.', 'Cover and cook 15 minutes until very soft; mash the mince with the back of a spoon. Mild spice only, no salt.', 'Tear the ruti small and serve with the keema.']);
  add(72, 40, ['3 tbsp boneless chicken', '2 tbsp carrot', '2 tbsp rice', WATER(2)],
    ['Simmer chicken and carrot in the water until very soft (20 minutes).', 'Blend with the cooked rice.']);
  add(45, 30, ['3 tbsp boneless rui (rohu) fillet', '1 small potato', 'a pinch of turmeric', '2 tbsp rice'],
    ['Simmer the potato in 1 cup water with turmeric for 10 minutes. Add the fish and cook 8 more minutes.', BONES, 'Mash the fish and potato into the cooked rice with a little jhol.']);
  add(46, 25, ['3 tbsp boneless bhetki fillet', '2 tbsp rice'],
    ['Steam the fillet for 8 to 10 minutes until flaky.', BONES, 'Mash into the cooked rice with a little warm water.']);
  add(50, 30, ['1 egg', '1 small potato', '1 tbsp tomato', 'a pinch of turmeric', '2 tbsp rice'],
    ['Hard-boil the egg 12 minutes. Cook the potato and tomato with turmeric in 1 cup water for 10 minutes into a mild gravy; peel the tomato skin out.', 'Mash the egg into the gravy and mix with soft rice. No chilli.']);
  add(51, 35, ['3 tbsp boneless rui fillet', '3 tbsp lau', 'a pinch of turmeric', '2 tbsp rice'],
    ['Simmer the lau in 1 cup water with turmeric until soft (10 minutes). Add the fish and cook 8 minutes.', BONES, 'Mash with the lau and mix with the soft rice.']);
  add(52, 30, ['3 tbsp boneless katla fillet', '2 tbsp rice', 'a pinch of turmeric'],
    ['Simmer the fish in 1 cup water with turmeric for 8 to 10 minutes.', BONES + ' Katla has many fine bones, so go slowly.', 'Mash into the cooked rice.']);

  // ---------- fruit and vegetable purees ----------
  const mash = (id, item, how) => add(id, 5, [item], how);
  mash(76, '1/2 ripe banana', ['Peel a ripe banana.', 'Mash well with a fork, or blend with a splash of warm water for younger babies.']);
  mash(77, '3 tbsp ripe papaya (paka pepe), seeds removed', ['Scoop out the ripe flesh and discard seeds and peel.', 'Mash until smooth.']);
  add(78, 15, ['1 ripe peyara (guava)'], ['Peel and cut the guava, remove every seed.', 'Steam 5 minutes, then blend and strain for a smooth purée.']);
  mash(79, '3 tbsp ripe sweet mango (aam), seasonal', ['Peel the mango and cut away the flesh from the stone.', 'Blend or mash smooth. Only fully ripe, sweet mango.']);
  add(80, 15, ['1 apple'], [STEAM('the apple (peeled, cored)', 8), BLEND]);
  add(81, 20, ['4 tbsp misti kumro (pumpkin)'], [STEAM('the pumpkin', 10), 'Mash with a splash of the cooking water.']);
  add(82, 25, ['1/4 small rangaalu (sweet potato)', 'a little breast/formula milk, optional'], [STEAM('the sweet potato', 12), 'Mash and loosen with the milk or cooking water.']);
  add(83, 20, ['1 carrot'], [STEAM('the carrot', 12), BLEND]);
  add(84, 20, ['1/2 small beetroot', '1/2 apple'], [STEAM('the beetroot and apple', 15), BLEND, 'Note: beetroot can turn nappies pink, which is harmless.']);
  mash(86, '1 komola (orange)', ['Peel the orange; remove all pith, membrane and seeds.', 'Mash the segments and strain if your baby prefers it smooth.']);
  mash(87, '1 ripe sofeda (chikoo)', ['Peel the chikoo and remove every seed.', 'Mash the soft flesh until smooth.']);
  add(88, 25, ['1 small rangaalu (sweet potato)'], ['Peel and cut into finger-sized sticks.', 'Steam 12 to 15 minutes until soft enough to squash between your fingers.']);
  mash(90, '3 slices seedless tarmuj (watermelon)', ['Cut away rind and every seed.', 'Cut into small soft pieces or mash.']);
  add(91, 15, ['1 apple'], ['Peel and core the apple, cut into thin slices.', 'Steam 6 to 8 minutes until easy to squash.']);
  add(92, 20, ['1 potol, peeled and deseeded', '1 carrot'], ['Cut both into finger-sized sticks.', 'Steam for 12 to 15 minutes until they squash between your fingers.']);
  add(93, 60, ['2 tbsp sheddho chola (black chickpeas, soaked overnight)'], ['Soak overnight. Pressure-cook 6 to 8 whistles until very soft.', 'Slip off the skins and mash with a little cooking water.']);
  mash(96, '3 tbsp ripe papaya + 1/2 ripe banana', ['Remove the papaya seeds and skin.', 'Mash the papaya and banana together.']);
  add(97, 20, ['1 small beetroot'], [STEAM('the beetroot', 15), 'Blend until smooth. It may turn nappies pink, which is harmless.']);
  add(98, 20, ['1/2 apple', '1/2 ripe guava, seedless'], ['Steam the apple 6 minutes.', 'Blend with the guava (remove all seeds) and strain if needed.']);
  add(99, 20, ['3 tbsp pumpkin', '1 carrot'], [STEAM('the pumpkin and carrot', 12), BLEND]);
  add(100, 20, ['1/2 cup peeled lau (bottle gourd)'], [STEAM('the lau', 8), BLEND]);

  const NOTE = 'No salt, sugar or honey. Serve warm, never hot. Always sit with your baby while they eat.';
  const NOTE_T = 'No added salt or sugar. Serve warm, never hot. Always sit with your child while they eat.';
  const TEXTURE = (m) => m >= 18 ? 'Texture: bite-size pieces, close to family food.' : m >= 12 ? 'Texture: soft, small pieces (about the size of a pea to a fingertip).' : m >= 10 ? 'Texture: soft mash or small soft pieces.' : m >= 8 ? 'Texture: thick mash with soft lumps.' : 'Texture: smooth, thin purée at 6 to 7 months; thicken gradually.';

  function get(food) {
    if (!food) return null;
    if (food.r) return { mins: food.r[0], makes: food.m >= 18 ? '1 toddler portion' : food.m >= 12 ? '1 small toddler portion' : '1 baby portion', ing: food.r[1], steps: food.r[2], note: TEXTURE(food.m) + ' ' + NOTE_T };
    const n = Number(String(food.id).replace('f', ''));
    const r = R[n];
    if (!r) return null;
    return { mins: r[0], makes: '1 baby portion (about 4 to 6 tablespoons)', ing: r[1], steps: r[2], note: TEXTURE(food.m) + ' ' + NOTE };
  }

  const out = { get, count: () => Object.keys(R).length };
  if (typeof module !== 'undefined') module.exports = out; else root.Recipes = out;
})(typeof window !== 'undefined' ? window : globalThis);
