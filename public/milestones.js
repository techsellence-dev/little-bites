// Milestones, play ideas and toy suggestions by age band (0-24 months). Plain data + tiny helpers; no DOM.
// General developmental guidance in line with WHO / CDC / AAP milestone checklists. Babies vary a lot:
// these are typical ranges, never a diagnosis. Each item has a stable id so ticks and hides sync with the account.
const Milestones = (() => {
  const DOMAINS = { move: 'Movement', talk: 'Communication', social: 'Social & feelings', think: 'Learning & thinking' };
  const BANDS = [
    { id: 'b0', from: 0, to: 3, label: '0-3 months', theme: 'Getting to know the world',
      milestones: [
        { id: 'b0m1', d: 'move', t: 'Lifts head briefly during tummy time' },
        { id: 'b0m2', d: 'move', t: 'Moves arms and legs smoothly, hands open more often' },
        { id: 'b0m3', d: 'talk', t: 'Makes cooing sounds; cries differently for different needs' },
        { id: 'b0m4', d: 'social', t: 'Smiles back at you (social smile, around 2 months)' },
        { id: 'b0m5', d: 'think', t: 'Watches your face and follows a moving object with the eyes' },
        { id: 'b0m6', d: 'think', t: 'Turns toward familiar voices and sounds' }],
      activities: [
        { id: 'b0a1', d: 'move', t: 'Short tummy time sessions while awake and watched, a few times a day', how: 'Lie on your chest, or on a firm mat. Stop if baby gets upset.' },
        { id: 'b0a2', d: 'social', t: 'Face-to-face chats', how: 'Hold baby 20-30 cm away, talk, smile and wait for a coo before answering.' },
        { id: 'b0a3', d: 'think', t: 'Slow-moving high-contrast cards or a bright cloth', how: 'Move it slowly from side to side and let the eyes follow.' },
        { id: 'b0a4', d: 'talk', t: 'Sing lullabies and ঘুমপাড়ানি ছড়া', how: 'Familiar songs in your own language build early listening.' }],
      toys: [
        { id: 'b0t1', t: 'Soft rattle that is light enough for tiny hands', note: 'No loose parts; check seams regularly.' },
        { id: 'b0t2', t: 'High-contrast black and white cards or a cloth book' },
        { id: 'b0t3', t: 'Unbreakable baby-safe mirror for tummy time' },
        { id: 'b0t4', t: 'A play mat with a firm, flat surface' }],
      doctor: ['Does not seem to respond to loud sounds', 'Does not watch things as they move, or does not look at faces', 'Does not smile at people by about 3 months', 'Seems very floppy or very stiff, or does not bring hands to mouth'] },

    { id: 'b3', from: 3, to: 6, label: '3-6 months', theme: 'Reaching, rolling and laughing',
      milestones: [
        { id: 'b3m1', d: 'move', t: 'Holds head steady without support' },
        { id: 'b3m2', d: 'move', t: 'Pushes up on arms in tummy time; may roll tummy to back' },
        { id: 'b3m3', d: 'move', t: 'Reaches for and grasps a toy; brings things to mouth' },
        { id: 'b3m4', d: 'talk', t: 'Laughs, squeals and takes turns "talking" with you' },
        { id: 'b3m5', d: 'social', t: 'Likes looking at people and playing with them' },
        { id: 'b3m6', d: 'think', t: 'Looks at things closely, recognises familiar faces' }],
      activities: [
        { id: 'b3a1', d: 'move', t: 'Reaching games', how: 'Hold a toy just within reach during tummy time so baby stretches for it.' },
        { id: 'b3a2', d: 'talk', t: 'Copy baby\'s sounds back', how: 'Pause after each sound; this teaches conversation turns.' },
        { id: 'b3a3', d: 'social', t: 'Peekaboo with a cloth', how: 'Start gently; watch for smiles.' },
        { id: 'b3a4', d: 'think', t: 'Texture play', how: 'Let baby feel soft cloth, a wooden spoon and a safe crinkly toy under supervision.' }],
      toys: [
        { id: 'b3t1', t: 'Teething ring or soft textured ball' },
        { id: 'b3t2', t: 'Activity gym with hanging toys' },
        { id: 'b3t3', t: 'Cloth or board book with big pictures' },
        { id: 'b3t4', t: 'Rattles and soft squeaky toys', note: 'Anything that fits through a toilet-roll tube is too small.' }],
      doctor: ['Does not try to grasp objects held near by about 5 months', 'Does not smile or laugh at people', 'Does not roll or push up on arms by about 6 months', 'Seems unable to hold head steady, or shows no interest in sounds'] },

    { id: 'b6', from: 6, to: 9, label: '6-9 months', theme: 'Sitting, babbling and first foods',
      milestones: [
        { id: 'b6m1', d: 'move', t: 'Rolls both ways and sits with support, then alone' },
        { id: 'b6m2', d: 'move', t: 'Passes a toy from one hand to the other' },
        { id: 'b6m3', d: 'talk', t: 'Babbles with consonants ("ba-ba", "ma-ma")' },
        { id: 'b6m4', d: 'social', t: 'Knows familiar people and may be shy with strangers' },
        { id: 'b6m5', d: 'think', t: 'Looks for things that drop out of sight' },
        { id: 'b6m6', d: 'think', t: 'Responds to own name' }],
      activities: [
        { id: 'b6a1', d: 'move', t: 'Supported sitting play on the floor', how: 'Place toys within reach and stay close; cushions around help with tumbles.' },
        { id: 'b6a2', d: 'talk', t: 'Name what baby sees and eats', how: '"This is a banana, নরম কলা." Repeat the word often.' },
        { id: 'b6a3', d: 'think', t: 'Drop and find', how: 'Hide a toy under a cloth and let baby pull it off.' },
        { id: 'b6a4', d: 'social', t: 'Mealtime together', how: 'Let baby touch and explore safe soft foods at the family table.' }],
      toys: [
        { id: 'b6t1', t: 'Stacking cups' },
        { id: 'b6t2', t: 'Large soft blocks' },
        { id: 'b6t3', t: 'Board books with simple pictures' },
        { id: 'b6t4', t: 'Toys that make a sound when shaken or pressed' },
        { id: 'b6t5', t: 'Floor mirror', note: 'Keep baby supervised.' }],
      doctor: ['Does not try to reach for things by about 6 months', 'Does not make vowel sounds ("ah", "oh") or any babbling by about 9 months', 'Does not respond to own name, or does not look where you point', 'Does not roll in either direction or cannot sit with support'] },

    { id: 'b9', from: 9, to: 12, label: '9-12 months', theme: 'Crawling, pulling up and waving',
      milestones: [
        { id: 'b9m1', d: 'move', t: 'Crawls or finds another way to travel; pulls up to stand' },
        { id: 'b9m2', d: 'move', t: 'Picks up small food with thumb and finger (pincer grasp)' },
        { id: 'b9m3', d: 'talk', t: 'Waves "bye-bye"; says "mama" or "dada" for you' },
        { id: 'b9m4', d: 'social', t: 'Plays games like peekaboo and pat-a-cake' },
        { id: 'b9m5', d: 'think', t: 'Looks at the right picture when you name it' },
        { id: 'b9m6', d: 'think', t: 'Understands "no" and simple words' }],
      activities: [
        { id: 'b9a1', d: 'move', t: 'Safe crawling course', how: 'Cushions and tunnels made from boxes; clear floors of small objects.' },
        { id: 'b9a2', d: 'think', t: 'Putting things in and taking out', how: 'Containers with large safe items such as wooden spoons or soft balls.' },
        { id: 'b9a3', d: 'talk', t: 'Action songs', how: 'Clapping and wave songs; do the action and pause for baby to copy.' },
        { id: 'b9a4', d: 'social', t: 'Point and name', how: 'Follow baby\'s finger and name what they are looking at.' }],
      toys: [
        { id: 'b9t1', t: 'Push-and-crawl-after balls' },
        { id: 'b9t2', t: 'Shape sorter with big shapes' },
        { id: 'b9t3', t: 'Nesting and stacking toys' },
        { id: 'b9t4', t: 'Sturdy board books' },
        { id: 'b9t5', t: 'Soft doll or teddy' }],
      doctor: ['Does not crawl, drag one side, or bear weight on legs by about 12 months', 'Does not say any single words like "mama" or "dada" by about 12 months', 'Does not use gestures like waving or shaking head', 'Does not look where you point or does not play any games with you'] },

    { id: 'b12', from: 12, to: 18, label: '12-18 months', theme: 'First steps and first words',
      milestones: [
        { id: 'b12m1', d: 'move', t: 'Takes first steps; most walk alone by 15-18 months' },
        { id: 'b12m2', d: 'move', t: 'Drinks from a cup; scribbles with a crayon' },
        { id: 'b12m3', d: 'talk', t: 'Says several words and tries to copy new ones' },
        { id: 'b12m4', d: 'social', t: 'Points to show you something interesting' },
        { id: 'b12m5', d: 'think', t: 'Follows simple instructions ("give me the cup")' },
        { id: 'b12m6', d: 'think', t: 'Uses everyday things correctly (spoon, phone, brush)' }],
      activities: [
        { id: 'b12a1', d: 'move', t: 'Push toys and cruising along furniture', how: 'Let baby practise barefoot on a safe surface.' },
        { id: 'b12a2', d: 'talk', t: 'Picture book time every day', how: 'Point, name, and let baby turn the pages.' },
        { id: 'b12a3', d: 'think', t: 'Simple pretend play', how: 'Feed a doll, talk on a toy phone.' },
        { id: 'b12a4', d: 'move', t: 'Scribbling with chunky crayons', how: 'Always with you present; use non-toxic ones.' }],
      toys: [
        { id: 'b12t1', t: 'Push walker toy with stable base' },
        { id: 'b12t2', t: 'Big chunky crayons and paper' },
        { id: 'b12t3', t: 'Wooden or soft blocks' },
        { id: 'b12t4', t: 'Toy phone, doll or teddy' },
        { id: 'b12t5', t: 'Sand and water play set (supervised)' }],
      doctor: ['Does not walk when held by the hands, or not walking by about 18 months', 'Does not point to show things', 'Does not know what familiar objects are for', 'Loses skills they had before (such as words)'] },

    { id: 'b18', from: 18, to: 24, label: '18-24 months', theme: 'Running, talking and pretending',
      milestones: [
        { id: 'b18m1', d: 'move', t: 'Walks steadily, starts to run, kicks a ball' },
        { id: 'b18m2', d: 'move', t: 'Stacks four or more blocks; eats with a spoon' },
        { id: 'b18m3', d: 'talk', t: 'Puts two words together by about 24 months' },
        { id: 'b18m4', d: 'social', t: 'Plays alongside other children' },
        { id: 'b18m5', d: 'think', t: 'Points to body parts when asked' },
        { id: 'b18m6', d: 'think', t: 'Begins make-believe play' }],
      activities: [
        { id: 'b18a1', d: 'move', t: 'Ball games and dancing', how: 'Kick, roll and throw soft balls; dance to favourite songs.' },
        { id: 'b18a2', d: 'talk', t: 'Talk about the day while doing chores', how: 'Add one word to what baby says: "juice" becomes "more juice".' },
        { id: 'b18a3', d: 'think', t: 'Simple puzzles and shape sorting', how: 'Chunky wooden puzzles with 2-4 pieces.' },
        { id: 'b18a4', d: 'social', t: 'Playdates with a trusted friend', how: 'Short and supervised; expect parallel play, not sharing.' }],
      toys: [
        { id: 'b18t1', t: 'Soft ball and ride-on toy without pedals' },
        { id: 'b18t2', t: 'Chunky puzzles' },
        { id: 'b18t3', t: 'Play kitchen set, dolls and toy phone' },
        { id: 'b18t4', t: 'Picture books with simple stories' },
        { id: 'b18t5', t: 'Washable crayons and play dough', note: 'Supervise; dough is not food.' }],
      doctor: ['Does not use at least six words by about 18 months, or no two-word phrases by 24 months', 'Does not copy actions or words', 'Does not walk by 18 months', 'Does not know what to do with common objects such as a spoon or brush'] },
  ];

  const SAFETY = ['Choose toys without small parts (smaller than a toilet-roll tube) or loose button batteries or magnets.',
    'Avoid strings, cords or ribbons near the cot or around the neck.',
    'Always supervise tummy time, water play and mealtimes. Never leave baby alone with toys on a high surface.',
    'Baby walkers with wheels are not recommended; push toys with a stable base are safer.',
    'Check toys often for cracks or loose parts and wash soft toys regularly.'];

  const bandFor = (months) => BANDS.find((b) => months >= b.from && months < b.to) || BANDS[BANDS.length - 1];
  const find = (id) => BANDS.find((b) => b.id === id);
  return { DOMAINS, BANDS, SAFETY, bandFor, find };
})();
