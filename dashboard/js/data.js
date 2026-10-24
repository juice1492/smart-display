// Mock data for the prototype. Everything is relative to "today" so the demo always looks current.
window.DATA = (function () {
  var base = new Date();
  base.setHours(0, 0, 0, 0);

  function at(d, hm) {
    var p = hm.split(':');
    var x = new Date(base);
    x.setDate(x.getDate() + d);
    x.setHours(+p[0], +p[1], 0, 0);
    return x;
  }
  var n = 0;
  function ev(d, s, e, title, people, extra) {
    return Object.assign({ id: 'e' + (++n), start: at(d, s), end: at(d, e), title: title, people: people }, extra || {});
  }
  function allDay(d, days, title, people, extra) {
    return Object.assign({ id: 'e' + (++n), allDay: true, start: at(d, '00:00'), end: at(d + days, '00:00'), title: title, people: people }, extra || {});
  }

  var ALL = ['alex', 'jordan', 'maya', 'otto'];

  var people = [
    { id: 'alex', name: 'Wes', color: '#2D5BFF', rgb: '45 91 255', ink: '#FFFFFF', home: false, status: 'Driving home', eta: 12 },
    { id: 'jordan', name: 'Claudia', color: '#E4007C', rgb: '228 0 124', ink: '#FFFFFF', home: false, status: 'At the office' },
    { id: 'maya', name: 'Buzzsaw', age: 10, color: '#00A36C', rgb: '0 163 108', ink: '#FFFFFF', home: true, status: 'Home' },
    { id: 'otto', name: 'Skidmark', age: 6, color: '#FFB000', rgb: '255 176 0', ink: '#111111', home: true, status: 'Home' }
  ];
  var family = { id: 'family', name: 'Family', color: '#111111', rgb: '17 17 17', ink: '#FFFFFF' };

  // ---------------------------------------------------------------- calendar
  var events = [
    // Today
    allDay(0, 1, 'Pajama Day at school', ['otto']),
    allDay(0, 1, 'Garbage + recycling night', ALL),
    ev(0, '07:00', '07:45', 'Gym', ['jordan'], { loc: 'Iron Works' }),
    ev(0, '08:15', '08:40', 'School drop-off', ['alex'], { travel: 10, loc: 'Parkdale Elementary' }),
    ev(0, '09:30', '10:30', 'Design review', ['jordan'], { loc: 'Office · Room 4B' }),
    ev(0, '12:00', '12:45', 'Dentist', ['maya', 'jordan'], { travel: 15, loc: 'Bright Smiles Dental' }),
    ev(0, '13:00', '14:00', 'Lunch with Sam', ['alex'], { loc: 'Café Rustica' }),
    ev(0, '15:45', '16:30', 'Piano lesson', ['otto'], { travel: 12, loc: "Ms. Park's Studio", notes: 'Bring the blue theory book.' }),
    ev(0, '16:05', '16:30', 'Drive Buzzsaw to soccer', ['jordan']),
    ev(0, '16:25', '16:50', 'Pick up Skidmark', ['jordan'], { loc: "Ms. Park's Studio" }),
    ev(0, '16:30', '18:00', 'Soccer practice', ['maya'], { travel: 20, loc: 'Lakeshore Fields', notes: 'Shin guards + water bottle. Rain likely — pack a jacket.' }),
    ev(0, '17:00', '17:30', 'Parent–teacher call', ['alex', 'jordan'], { loc: 'Zoom' }),
    ev(0, '18:30', '19:30', "Dinner at Nonna's", ALL, { travel: 20, loc: "Nonna's", notes: 'Bring the lemon cake.' }),
    ev(0, '20:00', '20:30', 'Bath + books', ['otto']),

    // Tomorrow → +6
    allDay(1, 3, 'Wes in Montréal', ['alex'], { loc: 'Hotel William Gray' }),
    ev(1, '07:00', '07:45', 'Gym', ['jordan'], { loc: 'Iron Works' }),
    ev(1, '08:15', '08:40', 'School drop-off', ['jordan'], { travel: 10 }),
    ev(1, '10:30', '11:15', 'Vet — Biscuit', ['jordan'], { travel: 10, loc: 'Riverdale Animal Clinic' }),
    ev(1, '15:30', '16:30', 'Art club', ['maya'], { loc: 'School' }),
    ev(1, '16:00', '18:00', 'Playdate with Leo', ['otto'], { travel: 8, loc: "Leo's house" }),
    ev(1, '19:00', '21:00', 'Book club', ['jordan'], { travel: 10, loc: "Priya's" }),

    ev(2, '09:00', '14:00', 'Science Centre trip', ['otto'], { loc: 'Ontario Science Centre' }),
    ev(2, '13:00', '13:45', 'Haircuts', ['maya', 'otto'], { travel: 10, loc: 'Snip Snip Kids' }),
    ev(2, '16:30', '18:00', 'Soccer practice', ['maya'], { travel: 20, loc: 'Lakeshore Fields' }),
    ev(2, '18:00', '19:30', 'Pizza night', ALL),

    ev(3, '10:00', '10:45', 'Swim lessons', ['otto'], { travel: 12, loc: 'Wellesley Pool' }),
    ev(3, '11:00', '12:00', 'Grocery run', ['jordan']),
    ev(3, '13:00', '15:30', "Zoe's birthday party", ['maya'], { travel: 15, loc: 'Pottery Place' }),
    ev(3, '19:00', '21:00', 'Movie night', ALL),

    ev(4, '10:30', '12:00', 'Sunday brunch', ALL, { travel: 15, loc: 'Lady Marmalade' }),
    ev(4, '17:05', '18:20', 'Flight home · AC 418', ['alex'], { loc: 'YUL → YYZ' }),

    ev(5, '07:00', '07:45', 'Gym', ['jordan']),
    ev(5, '15:45', '16:30', 'Piano lesson', ['otto'], { travel: 12 }),
    ev(5, '16:30', '18:00', 'Soccer practice', ['maya'], { travel: 20 }),
    ev(5, '19:00', '20:00', 'Yoga', ['jordan']),

    allDay(6, 2, 'Grandma visits', ALL),
    ev(6, '09:00', '09:45', 'Dentist', ['otto'], { travel: 15, loc: 'Bright Smiles Dental' }),
    ev(6, '16:30', '18:00', 'Soccer practice', ['maya'], { travel: 20 })
  ];

  // Background recurring events so the month view has texture
  for (var d = -40; d <= 45; d++) {
    if (d >= 0 && d <= 6) continue;
    var dow = new Date(at(d, '00:00')).getDay();
    if (dow === 1) events.push(ev(d, '15:45', '16:30', 'Piano lesson', ['otto']));
    if (dow === 2 || dow === 4) events.push(ev(d, '16:30', '18:00', 'Soccer practice', ['maya']));
    if (dow === 3) events.push(ev(d, '19:00', '20:00', 'Yoga', ['jordan']));
    if (dow === 6) events.push(ev(d, '10:00', '10:45', 'Swim lessons', ['otto']));
    if (dow === 0) events.push(ev(d, '17:30', '19:30', "Dinner at Nonna's", ALL));
    if (dow === 5 && d % 2 === 0) events.push(ev(d, '18:00', '19:30', 'Pizza night', ALL));
    if (d % 9 === 0) events.push(ev(d, '12:00', '13:00', 'Lunch meeting', ['alex']));
    if (d % 11 === 0) events.push(ev(d, '09:00', '10:00', 'Doctor', ['jordan']));
  }
  events.push(allDay(12, 1, "Buzzsaw's birthday 🎂", ALL));
  events.push(allDay(-8, 3, 'Cottage weekend', ALL));

  // Extra events for the "overloaded day" demo
  var busyExtras = [
    ev(0, '10:00', '11:00', 'Plumber window', ['jordan']),
    ev(0, '11:00', '11:30', 'Call with bank', ['alex']),
    ev(0, '14:30', '15:30', 'Library volunteer', ['jordan']),
    ev(0, '15:30', '16:00', 'Snack prep', ['maya']),
    ev(0, '16:00', '16:45', 'Math tutor', ['otto']),
    ev(0, '16:15', '17:00', 'Swim make-up', ['otto'], { travel: 10 }),
    ev(0, '19:45', '20:30', 'Bake sale prep', ['maya', 'jordan']),
    ev(0, '20:30', '21:30', 'Hockey', ['alex'], { travel: 15 })
  ];

  // ---------------------------------------------------------------- chores
  var routines = [
    { id: 'morning', name: 'Morning', range: '6 – 11 AM', from: 0, to: 11 },
    { id: 'after', name: 'After school', range: '11 AM – 5 PM', from: 11, to: 17 },
    { id: 'evening', name: 'Evening', range: '5 – 10 PM', from: 17, to: 24 }
  ];
  var cid = 0;
  function chore(r, who, title, emoji, stars, done, extra) {
    return Object.assign({ id: 'c' + (++cid), r: r, who: who, title: title, emoji: emoji, stars: stars, done: !!done }, extra || {});
  }
  var chores = [
    chore('morning', 'maya', 'Make bed', '🛏️', 1, true),
    chore('morning', 'maya', 'Brush teeth', '🪥', 1, true),
    chore('morning', 'maya', 'Pack backpack', '🎒', 1, true),
    chore('morning', 'otto', 'Make bed', '🛏️', 1, true),
    chore('morning', 'otto', 'Brush teeth', '🪥', 1, true),
    chore('morning', 'otto', 'Get dressed', '👕', 1, false),
    chore('morning', 'alex', 'School drop-off', '🚗', 0, true),
    chore('morning', 'jordan', 'Pack lunches', '🥪', 0, true),
    chore('morning', 'any', 'Feed Biscuit', '🐶', 1, true),

    chore('after', 'maya', 'Unpack lunchbox', '🥪', 1, true),
    chore('after', 'maya', 'Homework', '📚', 2, false),
    chore('after', 'maya', 'Pack soccer bag', '⚽', 1, false),
    chore('after', 'otto', 'Unpack lunchbox', '🥪', 1, true),
    chore('after', 'otto', 'Read for 20 min', '📖', 2, false),
    chore('after', 'otto', 'Practice piano', '🎹', 2, false),
    chore('after', 'otto', 'Tidy the Lego', '🧱', 1, false),
    chore('after', 'alex', 'Take out recycling', '♻️', 0, false, { overdue: true }),
    chore('after', 'alex', 'Call the plumber', '☎️', 0, true),
    chore('after', 'jordan', 'Fold laundry', '🧺', 0, false),
    chore('after', 'jordan', 'Order Zoe’s gift', '🎁', 0, true),
    chore('after', 'any', 'Water the plants', '🪴', 1, false),
    chore('after', 'any', 'Empty dishwasher', '🍽️', 2, false),
    chore('after', 'any', 'Walk Biscuit', '🐕', 2, true),

    chore('evening', 'maya', 'Set the table', '🍴', 1, false),
    chore('evening', 'maya', 'Lay out clothes', '👕', 1, false),
    chore('evening', 'maya', 'Shower', '🚿', 1, false),
    chore('evening', 'otto', 'Clear plates', '🍽️', 1, false),
    chore('evening', 'otto', 'Bath', '🛁', 1, false),
    chore('evening', 'otto', 'Lay out clothes', '👕', 1, false),
    chore('evening', 'alex', 'Lock up', '🔐', 0, false),
    chore('evening', 'jordan', 'Run dishwasher', '🫧', 0, false),
    chore('evening', 'any', 'Wipe counters', '🧽', 1, false),
    chore('evening', 'any', 'Garbage to curb', '🗑️', 2, false)
  ];
  var stars = { maya: 42, otto: 57 };
  // Mon..Sun, 1 = all chores done, 0 = missed, null = future
  var week = { maya: [1, 1, 0, 1, 1, 0, 1], otto: [1, 0, 1, 1, 1, 1, 0] };

  // ---------------------------------------------------------------- shopping
  var stores = [{ id: 'grocer', name: 'FreshCo' }, { id: 'costco', name: 'Costco' }];
  var catOrder = {
    all: ['Produce', 'Bakery', 'Meat & Fish', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Snacks', 'Household'],
    grocer: ['Produce', 'Bakery', 'Meat & Fish', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Snacks', 'Household'],
    costco: ['Household', 'Pantry', 'Snacks', 'Dairy & Eggs', 'Meat & Fish', 'Frozen', 'Produce', 'Bakery']
  };
  var gid = 0;
  function g(name, cat, qty, store, done, note) {
    return { id: 'g' + (++gid), name: name, cat: cat, qty: qty, store: store, done: !!done, note: note || '' };
  }
  var groceries = [
    g('Bananas', 'Produce', 1, 'grocer', false, 'Bunch, not too ripe'),
    g('Baby spinach', 'Produce', 1, 'grocer'),
    g('Avocados', 'Produce', 3, 'grocer'),
    g('Honeycrisp apples', 'Produce', 6, 'grocer'),
    g('Sourdough loaf', 'Bakery', 1, 'grocer'),
    g('Bagels', 'Bakery', 2, 'costco', false, 'Everything'),
    g('Chicken thighs', 'Meat & Fish', 1, 'grocer', false, 'Boneless'),
    g('Salmon fillets', 'Meat & Fish', 2, 'grocer'),
    g('Milk 2%', 'Dairy & Eggs', 2, 'costco'),
    g('Eggs', 'Dairy & Eggs', 1, 'costco', false, '2 dozen'),
    g('Greek yogurt', 'Dairy & Eggs', 1, 'grocer'),
    g('Aged cheddar', 'Dairy & Eggs', 1, 'grocer'),
    g('Rigatoni', 'Pantry', 2, 'grocer'),
    g('Olive oil', 'Pantry', 1, 'costco'),
    g('Coffee beans', 'Pantry', 1, 'grocer', false, 'Dark roast'),
    g('Frozen peas', 'Frozen', 1, 'grocer'),
    g('Waffles', 'Frozen', 1, 'grocer'),
    g('Goldfish crackers', 'Snacks', 1, 'costco'),
    g('Granola bars', 'Snacks', 1, 'grocer'),
    g('Paper towels', 'Household', 1, 'costco'),
    g('Dish soap', 'Household', 1, 'grocer'),
    g('Lemons', 'Produce', 2, 'grocer', true),
    g('Butter', 'Dairy & Eggs', 1, 'grocer', true),
    g('Tortillas', 'Bakery', 1, 'grocer', true)
  ];
  var catalog = [
    ['Apples', 'Produce'], ['Avocados', 'Produce'], ['Bananas', 'Produce'], ['Baby spinach', 'Produce'], ['Blueberries', 'Produce'],
    ['Broccoli', 'Produce'], ['Carrots', 'Produce'], ['Cucumber', 'Produce'], ['Garlic', 'Produce'], ['Grapes', 'Produce'],
    ['Lemons', 'Produce'], ['Limes', 'Produce'], ['Onions', 'Produce'], ['Potatoes', 'Produce'], ['Strawberries', 'Produce'],
    ['Tomatoes', 'Produce'], ['Bread', 'Bakery'], ['Bagels', 'Bakery'], ['Croissants', 'Bakery'], ['Sourdough loaf', 'Bakery'],
    ['Tortillas', 'Bakery'], ['Hamburger buns', 'Bakery'], ['Bacon', 'Meat & Fish'], ['Chicken breasts', 'Meat & Fish'],
    ['Chicken thighs', 'Meat & Fish'], ['Ground beef', 'Meat & Fish'], ['Salmon fillets', 'Meat & Fish'], ['Shrimp', 'Meat & Fish'],
    ['Butter', 'Dairy & Eggs'], ['Cheddar', 'Dairy & Eggs'], ['Cream cheese', 'Dairy & Eggs'], ['Eggs', 'Dairy & Eggs'],
    ['Greek yogurt', 'Dairy & Eggs'], ['Milk 2%', 'Dairy & Eggs'], ['Oat milk', 'Dairy & Eggs'], ['Parmesan', 'Dairy & Eggs'],
    ['Black beans', 'Pantry'], ['Cereal', 'Pantry'], ['Coffee beans', 'Pantry'], ['Flour', 'Pantry'], ['Honey', 'Pantry'],
    ['Maple syrup', 'Pantry'], ['Olive oil', 'Pantry'], ['Pasta sauce', 'Pantry'], ['Peanut butter', 'Pantry'], ['Rice', 'Pantry'],
    ['Rigatoni', 'Pantry'], ['Spaghetti', 'Pantry'], ['Sugar', 'Pantry'], ['Tea', 'Pantry'], ['Frozen peas', 'Frozen'],
    ['Frozen berries', 'Frozen'], ['Ice cream', 'Frozen'], ['Pizza', 'Frozen'], ['Waffles', 'Frozen'], ['Chips', 'Snacks'],
    ['Crackers', 'Snacks'], ['Dark chocolate', 'Snacks'], ['Goldfish crackers', 'Snacks'], ['Granola bars', 'Snacks'],
    ['Popcorn', 'Snacks'], ['Dish soap', 'Household'], ['Dishwasher pods', 'Household'], ['Garbage bags', 'Household'],
    ['Laundry detergent', 'Household'], ['Paper towels', 'Household'], ['Toilet paper', 'Household'], ['Toothpaste', 'Household']
  ];
  var usuals = ['Milk 2%', 'Eggs', 'Bananas', 'Bread', 'Apples', 'Coffee beans', 'Greek yogurt', 'Cheddar', 'Butter', 'Baby spinach', 'Chicken thighs', 'Paper towels'];

  // ---------------------------------------------------------------- home control
  var rooms = [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'living', name: 'Living Room' },
    { id: 'entry', name: 'Entry + Garage' },
    { id: 'upstairs', name: 'Upstairs' },
    { id: 'yard', name: 'Backyard' }
  ];
  var devices = [
    { id: 'k-pend', room: 'kitchen', type: 'light', name: 'Pendants', on: true, level: 80 },
    { id: 'k-under', room: 'kitchen', type: 'light', name: 'Under Cabinet', on: true, level: 55 },
    { id: 'k-island', room: 'kitchen', type: 'light', name: 'Island', on: false, level: 100 },
    { id: 'k-speaker', room: 'kitchen', type: 'blind', name: 'Window Shade', pos: 100 },
    { id: 'l-lamp', room: 'living', type: 'light', name: 'Floor Lamp', on: true, level: 45 },
    { id: 'l-ceil', room: 'living', type: 'light', name: 'Ceiling', on: false, level: 100 },
    { id: 'l-blinds', room: 'living', type: 'blind', name: 'Blinds', pos: 60 },
    { id: 'l-fire', room: 'living', type: 'light', name: 'Mantel', on: false, level: 70 },
    { id: 'e-door', room: 'entry', type: 'lock', name: 'Front Door', locked: true },
    { id: 'e-porch', room: 'entry', type: 'light', name: 'Porch', on: true, level: 100 },
    { id: 'g-door', room: 'entry', type: 'garage', name: 'Garage', state: 'closed' },
    { id: 'g-side', room: 'entry', type: 'lock', name: 'Side Door', locked: true },
    { id: 'u-maya', room: 'upstairs', type: 'light', name: "Buzzsaw's Lamp", on: true, level: 30 },
    { id: 'u-otto', room: 'upstairs', type: 'light', name: "Skidmark's Nightlight", on: false, level: 15 },
    { id: 'u-hall', room: 'upstairs', type: 'light', name: 'Hallway', on: false, level: 60 },
    { id: 'u-bath', room: 'upstairs', type: 'light', name: 'Bathroom', on: false, level: 100 },
    { id: 'y-string', room: 'yard', type: 'light', name: 'String Lights', on: false, level: 100, flaky: true },
    { id: 'y-back', room: 'yard', type: 'lock', name: 'Back Door', locked: true },
    { id: 'y-flood', room: 'yard', type: 'light', name: 'Floodlight', on: false, level: 100 }
  ];
  var climate = { current: 20.5, set: 21.5, mode: 'heat', humidity: 42, outside: 14 };
  var media = { room: 'Kitchen', title: 'Harvest Moon', artist: 'Neil Young', playing: true, volume: 35, seed: 'harvest-vinyl' };
  var cameras = [
    { id: 'c-front', name: 'Front Porch', seed: 'porch-steps' },
    { id: 'c-drive', name: 'Driveway', seed: 'driveway-maple' },
    { id: 'c-yard', name: 'Backyard', seed: 'garden-yard' }
  ];
  var scenes = [
    { id: 'morning', name: 'Morning', icon: 'sunrise', set: { 'k-pend': 100, 'k-under': 80, 'l-blinds': 100, 'l-lamp': 0, 'u-hall': 60 } },
    { id: 'dinner', name: 'Dinner', icon: 'utensils', set: { 'k-pend': 55, 'k-under': 30, 'k-island': 70, 'l-lamp': 40, 'l-ceil': 0 } },
    { id: 'movie', name: 'Movie', icon: 'film', set: { 'k-pend': 0, 'k-under': 15, 'k-island': 0, 'l-lamp': 15, 'l-ceil': 0, 'l-blinds': 0, 'l-fire': 30 } },
    { id: 'away', name: 'Away', icon: 'away', set: { 'k-pend': 0, 'k-under': 0, 'k-island': 0, 'l-lamp': 0, 'l-ceil': 0, 'l-fire': 0, 'u-maya': 0, 'u-hall': 0, 'e-porch': 100 } },
    { id: 'night', name: 'Goodnight', icon: 'moon', set: { 'k-pend': 0, 'k-under': 10, 'k-island': 0, 'l-lamp': 0, 'l-ceil': 0, 'l-fire': 0, 'u-hall': 10, 'u-otto': 15, 'e-porch': 0 } }
  ];

  // Fallback for the weather tile when /frame/data/weather.json is missing or invalid.
  // Fixed mock day from the original dashboard, indexed by hour. Live data is °F from Open-Meteo.
  var weather = {
    hi: 17, lo: 8, feels: -2, humidity: 71, wind: 18,
    t: [9, 9, 8, 8, 8, 8, 9, 10, 11, 12, 13, 15, 16, 17, 16, 15, 14, 13, 12, 12, 11, 10, 10, 9],
    c: ['moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'partly', 'partly', 'sun', 'sun', 'sun', 'partly', 'partly', 'cloud', 'cloud', 'cloud', 'rain', 'rain', 'rain', 'rain', 'cloud', 'cloud', 'moon', 'moon'],
    p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 10, 20, 25, 40, 80, 90, 70, 55, 20, 10, 0, 0]
  };

  // Photos are not part of the sample. They load from /frame/photos/manifest.json.
  // Missing, empty, or invalid manifests leave this empty and the slideshow shows a placeholder.
  var photos = [];

  // ---------------------------------------------------------------- AI agent usage (CodexBar-style)
  // left = minutes until the window resets; win = window length in minutes (for pace)
  var H5 = 300, DAY = 1440, WEEK = 10080, MONTH = 43200;
  var agents = [
    {
      id: 'claude', name: 'Claude', plan: 'Max 20×', color: '#D97757', rgb: '217 119 87', status: 'ok',
      meters: [
        { label: 'Session', win: H5, used: 62, left: 134 },
        { label: 'Weekly · all models', win: WEEK, used: 41, left: 4680 }
      ],
      tokens: 3.1, cost: 21.4, week: [2.2, 3.8, 2.9, 4.4, 1.6, 0.8, 3.1]
    },
    {
      id: 'codex', name: 'Codex', plan: 'ChatGPT Pro', color: '#10A37F', rgb: '16 163 127', status: 'ok',
      meters: [
        { label: 'Session', win: H5, used: 88, left: 38 },
        { label: 'Weekly', win: WEEK, used: 57, left: 7320 }
      ],
      tokens: 4.6, cost: 17.9, week: [3.1, 2.4, 5.2, 4.0, 2.2, 1.1, 4.6]
    },
    {
      id: 'cursor', name: 'Cursor', plan: 'Pro+', color: '#111111', rgb: '17 17 17', status: 'ok',
      meters: [
        { label: 'Included usage', win: MONTH, used: 76, left: 17280, detail: '$45.60 of $60' },
        { label: 'On-demand', win: MONTH, used: 16, left: 17280, detail: '$8.20 of $50 cap' }
      ],
      tokens: 1.8, cost: 6.3, week: [1.2, 1.9, 0.7, 2.3, 1.5, 0.4, 1.8]
    },
    {
      id: 'gemini', name: 'Gemini', plan: 'AI Ultra', color: '#3F6FE4', rgb: '63 111 228', status: 'ok',
      meters: [
        { label: 'Requests · daily', win: DAY, used: 16, left: 522, detail: '320 of 2,000' },
        { label: 'Pro model · daily', win: DAY, used: 52, left: 522, detail: '104 of 200' }
      ],
      tokens: 0.9, cost: 0, week: [0.4, 1.1, 0.6, 0.2, 0.9, 1.3, 0.9]
    },
    {
      id: 'copilot', name: 'Copilot', plan: 'Pro+', color: '#8957E5', rgb: '137 87 229', status: 'degraded', incident: 'Elevated errors on coding agent',
      meters: [
        { label: 'Premium requests', win: MONTH, used: 75, left: 17280, detail: '1,124 of 1,500' },
        { label: 'Coding agent', win: MONTH, used: 38, left: 17280, detail: '19 of 50 sessions' }
      ],
      tokens: 1.2, cost: 0, week: [0.9, 1.4, 1.1, 0.8, 1.6, 0.3, 1.2]
    }
  ];

  return {
    people: people, family: family, ALL: ALL,
    events: events, busyExtras: busyExtras,
    routines: routines, chores: chores, stars: stars, week: week,
    stores: stores, catOrder: catOrder, groceries: groceries, catalog: catalog, usuals: usuals,
    rooms: rooms, devices: devices, climate: climate, media: media, cameras: cameras, scenes: scenes,
    weather: weather, photos: photos, agents: agents,
    _gid: function () { return 'g' + (++gid); },
    _eid: function () { return 'e' + (++n); }
  };
})();

// Runtime data. Sample above is the fallback. Files are fetched from the deployed /frame/ tree.
// A missing, non-JSON, or wrong-shaped file leaves that slice on the sample.
// Photos are the exception: there is no sample album. An empty or missing manifest stays empty.
(function () {
  var D = window.DATA;
  var ROOT = import.meta.env.BASE_URL || '/frame/';
  var ROUTINES = { morning: 1, after: 1, evening: 1 };
  var MODES = { heat: 1, cool: 1, auto: 1, off: 1 };
  var ORIENT = { l: 'l', p: 'p', landscape: 'l', portrait: 'p' };

  function num(v) { return typeof v === 'number' && isFinite(v); }

  function loadOne(url) {
    var ms = 4000;
    return new Promise(function (resolve) {
      var finished = false;
      function finish(v) { if (!finished) { finished = true; resolve(v); } }
      var timer = setTimeout(function () { finish({ ok: false }); }, ms);
      var opts = { cache: 'no-store' };
      try { if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) opts.signal = AbortSignal.timeout(ms); } catch (e) {}
      fetch(url, opts).then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      }).then(function (json) {
        clearTimeout(timer);
        finish({ ok: true, json: json });
      }, function () {
        clearTimeout(timer);
        finish({ ok: false });
      });
    });
  }

  function parseWhen(v) {
    if (typeof v !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(v);
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, 0);
    if (isNaN(d.getTime())) return null;
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
    return d;
  }

  function applyCalendar(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json) || !Array.isArray(json.events)) return false;
    var events = [];
    for (var i = 0; i < json.events.length; i++) {
      var raw = json.events[i];
      if (!raw || typeof raw !== 'object') return false;
      if (typeof raw.title !== 'string' || !raw.title) return false;
      var start = parseWhen(raw.start);
      var end = parseWhen(raw.end);
      if (!start || !end || end <= start) return false;
      if (raw.people != null && !Array.isArray(raw.people)) return false;
      var people = [];
      if (Array.isArray(raw.people)) {
        for (var p = 0; p < raw.people.length; p++) {
          if (typeof raw.people[p] !== 'string' || !raw.people[p]) return false;
          people.push(raw.people[p]);
        }
      }
      var ev = {
        id: typeof raw.id === 'string' && raw.id ? raw.id : ('e' + (i + 1)),
        title: raw.title,
        start: start,
        end: end,
        people: people,
        allDay: !!raw.allDay
      };
      if (typeof raw.loc === 'string' && raw.loc) ev.loc = raw.loc;
      if (typeof raw.notes === 'string' && raw.notes) ev.notes = raw.notes;
      if (num(raw.travel) && raw.travel > 0) ev.travel = raw.travel;
      events.push(ev);
    }
    D.events = events;
    return true;
  }

  function applyReminders(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json) || !Array.isArray(json.reminders)) return false;
    var list = [];
    for (var i = 0; i < json.reminders.length; i++) {
      var raw = json.reminders[i];
      if (!raw || typeof raw !== 'object') return false;
      if (typeof raw.title !== 'string' || !raw.title) return false;
      var routine = raw.routine || raw.r;
      if (!ROUTINES[routine]) return false;
      if (raw.who != null && typeof raw.who !== 'string') return false;
      if (raw.stars != null && !num(raw.stars)) return false;
      var item = {
        id: typeof raw.id === 'string' && raw.id ? raw.id : ('c' + (i + 1)),
        r: routine,
        who: raw.who || 'any',
        title: raw.title,
        emoji: typeof raw.emoji === 'string' ? raw.emoji : '',
        stars: num(raw.stars) ? raw.stars : 0,
        done: !!raw.done
      };
      if (raw.overdue) item.overdue = true;
      if (typeof raw.doneBy === 'string' && raw.doneBy) item.doneBy = raw.doneBy;
      list.push(item);
    }
    var stars = null;
    if (json.stars != null) {
      if (!json.stars || typeof json.stars !== 'object' || Array.isArray(json.stars)) return false;
      stars = {};
      var keys = Object.keys(json.stars);
      for (var s = 0; s < keys.length; s++) {
        if (!num(json.stars[keys[s]])) return false;
        stars[keys[s]] = json.stars[keys[s]];
      }
    }
    var week = null;
    if (json.week != null) {
      if (!json.week || typeof json.week !== 'object' || Array.isArray(json.week)) return false;
      week = {};
      var wkeys = Object.keys(json.week);
      for (var w = 0; w < wkeys.length; w++) {
        var row = json.week[wkeys[w]];
        if (!Array.isArray(row) || row.length !== 7) return false;
        for (var d = 0; d < 7; d++) if (row[d] !== 0 && row[d] !== 1 && row[d] !== null) return false;
        week[wkeys[w]] = row;
      }
    }
    D.chores = list;
    if (stars) D.stars = stars;
    if (week) D.week = week;
    return true;
  }

  function applyClimate(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return false;
    var indoor = json.indoor;
    if (!indoor || typeof indoor !== 'object' || Array.isArray(indoor)) return false;
    if (!num(indoor.current) || !num(indoor.set) || !num(indoor.humidity)) return false;
    if (indoor.outside != null && !num(indoor.outside)) return false;
    if (!MODES[indoor.mode]) return false;
    D.climate = {
      current: indoor.current,
      set: indoor.set,
      mode: indoor.mode,
      humidity: indoor.humidity,
      outside: num(indoor.outside) ? indoor.outside : D.climate.outside
    };
    return true;
  }

  // Open-Meteo forecast body, saved as-is. Times are America/New_York wall clocks.
  function parseStamp(v) {
    if (typeof v !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
    if (!m) return null;
    var hh = +m[4], mm = +m[5];
    if (hh > 23 || mm > 59) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
    return { y: +m[1], m: +m[2], d: +m[3], h: hh, min: mm };
  }

  function applyWeather(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return false;
    if (json.timezone != null && json.timezone !== 'America/New_York') return false;
    var cu = json.current_units || {};
    var hu = json.hourly_units || {};
    if (cu.temperature_2m != null && cu.temperature_2m !== '°F') return false;
    if (hu.temperature_2m != null && hu.temperature_2m !== '°F') return false;
    var current = json.current;
    var hourly = json.hourly;
    if (!current || typeof current !== 'object' || Array.isArray(current)) return false;
    if (!hourly || typeof hourly !== 'object' || Array.isArray(hourly)) return false;
    if (!num(current.temperature_2m) || !num(current.weather_code)) return false;
    var times = hourly.time;
    var temps = hourly.temperature_2m;
    var codes = hourly.weather_code;
    var pops = hourly.precipitation_probability;
    if (!Array.isArray(times) || !Array.isArray(temps) || !Array.isArray(codes) || !Array.isArray(pops)) return false;
    var n = times.length;
    if (!n || temps.length !== n || codes.length !== n || pops.length !== n) return false;
    var hours = [];
    for (var i = 0; i < n; i++) {
      var stamp = parseStamp(times[i]);
      if (!stamp) return false;
      if (temps[i] == null && codes[i] == null) continue;
      if (!num(temps[i]) || !num(codes[i])) return false;
      if (pops[i] != null && !num(pops[i])) return false;
      var precip = pops[i] == null ? 0 : pops[i];
      if (precip < 0 || precip > 100) return false;
      hours.push({
        y: stamp.y, m: stamp.m, d: stamp.d, h: stamp.h,
        temp: temps[i], code: codes[i], precip: precip
      });
    }
    if (!hours.length) return false;
    var cur = parseStamp(current.time);
    D.weather = {
      live: true,
      current: {
        temp: current.temperature_2m,
        code: current.weather_code,
        h: cur ? cur.h : null
      },
      hours: hours
    };
    return true;
  }

  function photoUrl(file) {
    if (typeof file !== 'string' || !file) return null;
    if (file.indexOf('\\') !== -1 || file.indexOf('..') !== -1) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(file)) return null;
    if (file.charAt(0) === '/') return null;
    var parts = file.split('/').filter(function (part) { return part && part !== '.'; });
    if (!parts.length) return null;
    return ROOT + 'photos/' + parts.map(function (part) { return encodeURIComponent(part); }).join('/');
  }

  function applyPhotos(json) {
    D.photos = [];
    if (!json || typeof json !== 'object' || Array.isArray(json) || !Array.isArray(json.photos)) return;
    var list = [];
    for (var i = 0; i < json.photos.length; i++) {
      var raw = json.photos[i];
      if (!raw || typeof raw !== 'object') continue;
      var file = typeof raw.file === 'string' ? raw.file : (typeof raw.src === 'string' ? raw.src : '');
      var url = photoUrl(file);
      if (!url) continue;
      if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) || !parseWhen(raw.date)) continue;
      var key = String(raw.orientation || raw.o || 'l').toLowerCase();
      list.push({
        src: url,
        o: ORIENT[key] || 'l',
        date: raw.date,
        place: typeof raw.place === 'string' ? raw.place : '',
        from: typeof raw.from === 'string' && raw.from ? raw.from : 'family',
        tag: typeof raw.tag === 'string' ? raw.tag : ''
      });
    }
    D.photos = list;
  }

  window.loadFrameData = function () {
    return Promise.all([
      loadOne(ROOT + 'data/calendar.json'),
      loadOne(ROOT + 'data/reminders.json'),
      loadOne(ROOT + 'data/climate.json'),
      loadOne(ROOT + 'data/weather.json'),
      loadOne(ROOT + 'photos/manifest.json')
    ]).then(function (parts) {
      if (parts[0].ok) applyCalendar(parts[0].json);
      if (parts[1].ok) applyReminders(parts[1].json);
      if (parts[2].ok) applyClimate(parts[2].json);
      if (parts[3].ok) applyWeather(parts[3].json);
      if (parts[4].ok) applyPhotos(parts[4].json);
    });
  };
})();
