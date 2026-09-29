// ─────────────────────────────────────────────────────────────────────────────
// Everything the client will want to change lives here.
//
// SOURCES
//   • Mayami's corporate events deck ("CORPORATE FINAL.pdf", Sept 2026):
//     spaces + capacities, prix fixe menus and prices, buyout hors d'oeuvres,
//     open-bar packages, tax + service charge, bottle-service minimum, valet,
//     party length, policies (FAQ).
//   • Nelson, Sept 29 2026: Outdoor Area 120 seated / 350 standing;
//     full venue 280 seated / 800 standing.
//   • mayamiwynwood.com: address, phone, email, hours, dress code, ID policy.
//
// Still to confirm with Mayami — marked TODO(client).
// ─────────────────────────────────────────────────────────────────────────────

export const VENUE = {
  name: 'Mayami Wynwood',
  phone: '(786) 660-1341',
  phoneHref: 'tel:+17866601341',
  email: 'info@mayamiwynwood.com',
  address: '127 NW 23rd St, Miami, FL 33127',
  reservations: 'https://www.mayamiwynwood.com/reservations',
};

// The SOP's core promise. Only publish what the events lead can actually hit.
export const PROMISE = {
  responseTime: '2 hours', // TODO(client): the current site promises 24 hours
};

export const PRICING = {
  serviceCharge: 0.20,
  taxRate: 0.08,
  partyHours: 2.5,
  bottleMin: 450,      // per table of up to 5, after 10PM Thu–Sat
  bottleGroup: 5,      // the deck says "every 4–5 guests"; 5 is the floor
  valet: 30,           // per vehicle
  minGuests: 8,
};

export const OCCASIONS = {
  holiday:      'Holiday Party',
  corporate:    'Corporate Event',
  birthday:     'Birthday',
  bachelorette: 'Bachelorette',
  engagement:   'Engagement / Celebration',
  other:        'Something else',
};

// Start times the booking calendar offers. Dinner runs nightly from 5PM;
// brunch Sat–Sun 12–6PM, so the last brunch start leaves room for 2.5 hours.
export const TIMES = {
  brunch: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
  dinner: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
};
export const BRUNCH_DAYS = [0, 6];        // Sun, Sat
export const BOTTLE_DAYS = [4, 5, 6];     // Thu, Fri, Sat
export const BOTTLE_AFTER = 22;           // 10PM
export const SHOW_DAYS = [5, 6];          // Fri, Sat — shows after 9PM

// `buyout`: partial/full buyouts unlock the hors d'oeuvres and open-bar packages.
export const SPACES = [
  {
    key: 'tree', name: 'Patio Tree', img: 'tree',
    vibe: 'Private and premium, under the living tree in the courtyard.',
    bestFor: ['Bachelorettes', 'Birthdays', 'Rehearsal dinners'],
    occ: ['bachelorette', 'birthday', 'engagement'],
    seated: 35, standing: 40, sqft: 560,
  },
  {
    key: 'dining', name: 'Inside', img: 'dining',
    vibe: 'The arched dining room — intimate, enclosed, made for a room that listens.',
    bestFor: ['Executive dinners', 'Holiday dinners', 'Presentations'],
    occ: ['corporate', 'holiday', 'engagement'],
    seated: 38, standing: 150, sqft: 1387,
  },
  {
    key: 'vip', name: 'Upper VIP Area', img: 'vip',
    vibe: 'Private and premium, up above the courtyard and the show.',
    bestFor: ['Client entertaining', 'Milestone birthdays', 'Team dinners'],
    occ: ['corporate', 'birthday', 'holiday'],
    seated: 50, standing: 40, sqft: 416,
  },
  {
    key: 'terrace', name: 'Terrace', img: 'terrace',
    vibe: 'Open-air and surrounded by greenery, right in the energy of the room.',
    bestFor: ['Birthdays', 'Team nights out', 'Outdoor receptions'],
    occ: ['birthday', 'bachelorette', 'corporate', 'other'],
    seated: 50, standing: 70, sqft: 850,
    note: 'Not private — shared with the room',
  },
  {
    key: 'outdoor', name: 'Outdoor Area', img: 'outdoor', buyout: 'Partial buyout',
    vibe: 'The whole open-air courtyard, lanterns and all, for your group only.',
    bestFor: ['Holiday parties', 'Company celebrations', 'Brand activations'],
    occ: ['holiday', 'corporate', 'other'],
    seated: 120, standing: 350,
  },
  {
    key: 'buyout', name: 'Full Venue', img: 'buyout', buyout: 'Full buyout',
    vibe: 'All 8,500 square feet, every bar and every show. Yours.',
    bestFor: ['Holiday parties', 'Galas', 'Product launches'],
    occ: ['holiday', 'corporate', 'other'],
    seated: 280, standing: 800, sqft: 8500,
  },
];

// Prix fixe menus, per person, before 8% tax and 20% service charge.
export const MENUS = {
  m1: {
    name: 'Dinner Menu 1', rate: 62, hook: 'Fundido, ceviche & taco bowls', img: 'menu1',
    courses: [
      ['First', ['Fundidos de queso — mushroom, chorizo or truffle', 'Ceviche Mayami']],
      ['Second', ['Assorted taco bowls with guacamole & tortillas: alambre de filet mignon, carnitas de puerco, rock shrimp roll']],
      ['Third', ['Churros with cajeta', 'Sorbete mango']],
    ],
  },
  m2: {
    name: 'Dinner Menu 2', rate: 84, hook: 'Filet, snapper & milanese', img: 'menu2',
    courses: [
      ['First', ['Ceviche Mayami', 'Caesar pelaccio salad']],
      ['Second', ['Snapper en mole verde', 'Filete negro — filet mignon, black lime, pomme purée', 'Chengdu spiced milanese']],
      ['Third', ['Churros with cajeta', 'Quesillo']],
    ],
  },
  m3: {
    name: 'Dinner Menu 3', rate: 95, hook: 'Octopus, short rib & panela salmon', img: 'menu3',
    courses: [
      ['First', ['Ceviche verde', 'Assorted sashimi tacos', 'Elote', 'Salmon ginger salad']],
      ['Second', ['Shape shifter octopus', 'Short rib a la barbacoa', 'Panela salmon']],
      ['Third', ['Churros', 'Quesillo', 'Sorbete mango']],
    ],
  },
  m4: {
    name: 'Dinner Menu 4', rate: 125, hook: 'Wagyu tartar, ribeye & truffle pasta', img: 'menu4', featured: true,
    courses: [
      ['First', ['Sashimi & nigiri platter', 'Wagyu beef tartar', 'Fundidos de queso']],
      ['Second', ['Crispy snapper', 'Ribeye with truffle mash & veal glaze', 'Mayami truffle pasta']],
      ['Third', ['80% cacao brownie', 'Tarta Santiago']],
    ],
  },
  sushi: {
    name: 'Sushi Menu', rate: 62, hook: 'Sashimi, nigiri & signature rolls', img: 'sushi', alt: true,
    courses: [
      ['First', ['Sashimi & nigiri platter', 'Edamame a la macha']],
      ['Second', ['Mayami roll', 'Mar y tierra roll', 'Jaguar roll']],
      ['Third', ['Quesillo', 'Sorbete mango']],
    ],
  },
  veg: {
    name: 'Vegetarian Menu', rate: 50, hook: 'Mushroom ceviche & roasted cauliflower', alt: true,
    courses: [
      ['First', ['Mushroom ceviche', 'Tacos sashimi de calabaza']],
      ['Second', ['Roasted cauliflower', 'Tofu teriyaki']],
      ['Third', ['Quesillo', 'Sorbete mango']],
    ],
  },
  brunch: {
    name: 'Brunch Menu', rate: 52, hook: 'Chilaquiles, burgers & crispy tuna rice', img: 'brunch', alt: true, brunch: true,
    courses: [
      ['First', ['Fundidos de queso', 'Crispy tuna rice', 'Elote']],
      ['Second', ['Chilaquiles', 'Mayami burger', 'Rock shrimp roll']],
      ['Third', ['Churros with cajeta']],
    ],
  },
};

// Partial or full buyouts only.
export const BITES = {
  golden: {
    name: "Golden hors d'oeuvres", rate: 50,
    items: ['Beef tartar', 'Chicharrón de ribeye', 'Ceviche Mayami', 'Short rib tostadas', 'Assorted sashimi tacos', 'Mini churros', 'Quesillo'],
  },
  platinum: {
    name: "Platinum hors d'oeuvres", rate: 60,
    items: ['Oysters, sangrita mignonette', 'Ceviche verde', 'Taquitos wagyu', 'Short rib tostada', 'Beef tartar with caviar', 'Wagyu sliders', 'Mini churros', 'Quesillo'],
  },
};

// Partial or full buyouts only. Per person: first hour, second hour, each after.
export const BARS = {
  call: {
    name: 'Call brand open bar', hours: [80, 40, 30],
    pours: 'Svedka, New Amsterdam, Jack Daniels, JW Black, Jimador, Bacardi · house red & white · domestic beer',
  },
  premium: {
    name: 'Premium open bar', hours: [100, 50, 30],
    pours: "Ketel One, Grey Goose, Tanqueray, Bombay Sapphire, Maker's Mark, Don Julio blanco & reposado, Brugal 1888, JW Black, Buchanan's 12 · imported & domestic beer",
  },
};

export const barCost = (bar, hours) =>
  BARS[bar].hours[0] + (hours > 1 ? BARS[bar].hours[1] : 0) + Math.max(0, hours - 2) * BARS[bar].hours[2];
