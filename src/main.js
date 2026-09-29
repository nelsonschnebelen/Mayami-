import { VENUE, PROMISE, PRICING, OCCASIONS, NIGHTS, SPACES, MENUS, BITES, BARS, barCost } from './config.js';

const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pct = (n) => Math.round(n * 100) + '%';
const img = (name) => `/images/${name}-800.webp`;
const track = (event, params) => {
  if (typeof window.fbq === 'function') window.fbq('track', event, params);
  if (typeof window.gtag === 'function') window.gtag('event', event === 'Lead' ? 'generate_lead' : 'begin_checkout', params);
};

const FOODS = { ...MENUS, ...BITES };
const state = { occ: 'holiday', guests: 40, fmt: 'seated', night: 'wkd', food: 'm2', bar: 'host', hours: '2', extras: new Set() };

// ── copy that comes from config ─────────────────────────────────────────────
document.querySelectorAll('[data-promise]').forEach((el) => { el.textContent = PROMISE[el.dataset.promise]; });
document.querySelectorAll('[data-pricing]').forEach((el) => { el.textContent = pct(PRICING[el.dataset.pricing]); });
document.querySelectorAll('[data-venue="phone"]').forEach((a) => { a.href = VENUE.phoneHref; a.textContent = VENUE.phone; });

(function ribbon() {
  const now = new Date();
  const m = now.getMonth();
  if ((m === 11 && now.getDate() > 20) || m === 0) {
    $('ribbonText').innerHTML = '<b>January:</b> the easiest month of the year to land a Friday. Book your team kickoff now.';
    return;
  }
  const peak = new Date(now.getFullYear(), 11, 11);
  $('weeksLeft').textContent = Math.max(1, Math.floor((peak - now) / 6048e5));
})();

// ── controls ────────────────────────────────────────────────────────────────
const buttons = (items) => items.map(([val, html]) => `<button type="button" data-val="${val}">${html}</button>`).join('');

$('segOcc').innerHTML = buttons(Object.entries(OCCASIONS));
$('segNight').innerHTML = buttons(Object.entries(NIGHTS).map(([k, n]) => [k, n.label]));
$('segFood').innerHTML = buttons([
  ...Object.entries(MENUS).map(([k, m]) => [k, `<strong>${m.name.replace(' Menu', '')}</strong><small>$${m.rate} / guest</small>`]),
  ...Object.entries(BITES).map(([k, b]) => [k, `<strong>${b.name.split(' ')[0]} bites</strong><small>$${b.rate} / guest · buyouts</small>`]),
]);
$('segBar').innerHTML = buttons([
  ['host', 'Host bar · running tab'],
  ...Object.entries(BARS).map(([k, b]) => [k, `${b.name} <span class="tag">buyouts</span>`]),
]);
$('segHours').innerHTML = buttons([1, 2, 3, 4].map((h) => [String(h), `${h} hr${h > 1 ? 's' : ''}`]));

function renderExtras() {
  const n = NIGHTS[state.night];
  const late = n.bottles
    ? `🍾 Stay past 10PM · bottle service`
    : `🍾 Stay past 10PM · no bottle minimum ${n.label}`;
  $('segExtra').innerHTML = buttons([
    ['late', late],
    ['valet', `🚗 Cover guest valet · $${PRICING.valet}/car`],
  ]);
}

function syncPressed() {
  document.querySelectorAll('.seg[data-key]').forEach((seg) => {
    const key = seg.dataset.key;
    seg.querySelectorAll('button').forEach((b) => {
      const on = key === 'extras' ? state.extras.has(b.dataset.val) : state[key] === b.dataset.val;
      b.setAttribute('aria-pressed', String(on));
    });
  });
}

document.querySelectorAll('.seg[data-key]').forEach((seg) => {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const key = seg.dataset.key;
    if (key === 'extras') {
      state.extras.has(b.dataset.val) ? state.extras.delete(b.dataset.val) : state.extras.add(b.dataset.val);
    } else {
      state[key] = b.dataset.val;
    }
    render();
  });
});

const range = $('rGuests');
range.addEventListener('input', () => { state.guests = +range.value; render(); });

// ── space matching ──────────────────────────────────────────────────────────
const cap = (s) => s[state.fmt];
const needsBuyout = () => state.food in BITES || state.bar !== 'host';
const eligible = (s) => !needsBuyout() || !!s.buyout;
const fits = (s) => state.guests >= PRICING.minGuests && state.guests <= cap(s) && eligible(s);

function matchSpace() {
  const fitting = SPACES.filter(fits).sort((a, b) =>
    (b.occ.includes(state.occ) - a.occ.includes(state.occ)) || cap(a) - cap(b));
  const full = SPACES.at(-1);
  if (state.guests > cap(full)) return { space: full, kind: 'over' };
  if (fitting.length) return { space: fitting[0], kind: 'fit', count: fitting.length };
  return { space: SPACES[0], kind: 'under' };
}

// ── the all-in estimate ─────────────────────────────────────────────────────
function estimate() {
  const g = state.guests;
  const food = FOODS[state.food];
  const lines = [[`${food.name} × ${g}`, food.rate * g]];
  if (state.bar !== 'host') {
    const h = +state.hours;
    lines.push([`${BARS[state.bar].name} · ${h} hr${h > 1 ? 's' : ''} × ${g}`, barCost(state.bar, h) * g]);
  }
  if (state.extras.has('late') && NIGHTS[state.night].bottles) {
    const tables = Math.ceil(g / PRICING.bottleGroup);
    lines.push([`Bottle service after 10PM · ${tables} × ${money(PRICING.bottleMin)} min.`, tables * PRICING.bottleMin]);
  }
  if (state.extras.has('valet')) {
    const cars = Math.ceil(g / 2.5);
    lines.push([`Guest valet · ~${cars} cars`, cars * PRICING.valet]);
  }
  const subtotal = lines.reduce((t, [, v]) => t + v, 0);
  const service = subtotal * PRICING.serviceCharge;
  const tax = subtotal * PRICING.taxRate;
  return { lines, subtotal, service, tax, total: subtotal + service + tax };
}

// ── render ──────────────────────────────────────────────────────────────────
function render() {
  const food = FOODS[state.food];
  const night = NIGHTS[state.night];
  const { space, kind, count } = matchSpace();
  const e = estimate();

  renderExtras();
  $('lblOcc').textContent = OCCASIONS[state.occ];
  $('lblGuests').textContent = state.guests >= +range.max ? `${range.max}+` : state.guests;
  $('lblNight').textContent = night.label;
  $('lblFood').textContent = food.name;
  $('lblBar').textContent = state.bar === 'host' ? 'Host bar' : `${BARS[state.bar].name.replace(' open bar', '')} · ${state.hours} hr${state.hours > 1 ? 's' : ''}`;
  $('segHours').hidden = state.bar === 'host';
  range.style.setProperty('--fill', ((state.guests - range.min) / (range.max - range.min)) * 100 + '%');
  syncPressed();

  $('nightHint').textContent = night.show
    ? 'Fire shows and performances typically start after 9PM on Fridays and Saturdays.'
    : night.bottles ? 'Bottle service applies after 10PM on Thursdays.' : 'The quietest nights, and the easiest to book on short notice.';
  $('foodHint').textContent = food.brunch ? 'Brunch events run Saturday and Sunday, 12–6PM.'
    : state.food in BITES ? `Passed all night: ${food.items.slice(0, 4).join(', ')} and more.`
    : `${food.hook}. Three courses.`;
  $('barHint').textContent = state.bar === 'host'
    ? 'Drinks go on a running tab at menu prices, so they aren\'t in the estimate.'
    : BARS[state.bar].pours;

  // quote card
  const qImg = $('qImg');
  if (!qImg.src.endsWith(img(space.img))) {
    qImg.style.opacity = 0;
    qImg.onload = () => { qImg.style.opacity = 1; };
    qImg.src = img(space.img);
  }
  qImg.alt = space.name;
  $('qRoomEyebrow').textContent = space.buyout || (kind === 'fit' ? 'Your space' : 'Recommended');
  $('qRoom').textContent = space.name;
  $('qTotal').textContent = money(e.total);
  $('qPer').textContent = `${money(e.total / state.guests)} per guest, all in`;

  const rows = [
    ...e.lines.map(([k, v]) => [k, money(v)]),
    ...(state.bar === 'host' ? [['Host bar', 'Running tab', 'muted']] : []),
    [`Service charge · ${pct(PRICING.serviceCharge)}`, money(e.service)],
    [`Sales tax · ${pct(PRICING.taxRate)}`, money(e.tax)],
  ];
  $('qLines').innerHTML = rows.map(([k, v, cls]) =>
    `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  const fmtWord = state.fmt === 'seated' ? 'seated' : 'cocktail-style';
  let msg, warn = true;
  if (kind === 'under') {
    msg = `Under ${PRICING.minGuests} guests? Book a regular table through reservations.`;
  } else if (kind === 'over') {
    msg = `${state.guests} ${fmtWord} is past the full venue's ${cap(space)}. Try cocktail-style, which holds up to 800.`;
  } else if (needsBuyout() && SPACES.some((s) => !s.buyout && state.guests <= cap(s))) {
    msg = `Open bars and hors d'oeuvres come with a buyout, so we've priced you in the ${space.name}.`;
  } else {
    warn = false;
    msg = `✓ The ${space.name} holds ${cap(space)} ${fmtWord}. Includes ${PRICING.partyHours} hours of party time.`;
  }
  const min = $('qMin');
  min.textContent = msg;
  min.classList.toggle('warn', warn);

  // spaces grid
  document.querySelectorAll('.space').forEach((card) => {
    const s = SPACES.find((x) => x.key === card.dataset.key);
    card.classList.toggle('is-match', fits(s));
    card.classList.toggle('is-dim', !fits(s) && s !== space);
    card.classList.toggle('is-pick', s === space);
  });
  $('spacesNote').textContent =
    kind === 'fit' ? `For ${state.guests} guests ${fmtWord}, we'd host you in the ${space.name}${count > 1 ? ` (${count} spaces fit)` : ''}.`
    : kind === 'under' ? `Groups under ${PRICING.minGuests} book a regular table.`
    : `${state.guests} guests ${fmtWord} is more than the venue holds. Cocktail-style fits up to 800.`;
}

// ── static grids ────────────────────────────────────────────────────────────
$('spaceGrid').innerHTML = SPACES.map((s) => `
  <article class="space" data-key="${s.key}">
    <div class="space__ph">
      <img loading="lazy" src="${img(s.img)}" alt="${s.name} at Mayami Wynwood" width="800" height="533" />
      ${s.buyout ? `<span class="space__badge">${s.buyout}</span>` : ''}
    </div>
    <div class="space__body">
      <h3>${s.name}</h3>
      <p class="space__vibe">${s.vibe}</p>
      <p class="space__for">Typically booked for</p>
      <p class="space__forlist">${s.bestFor.join(' · ')}</p>
      ${s.note ? `<p class="space__note">${s.note}</p>` : ''}
      <div class="caps">
        <div><b>${s.seated}</b><span>Seated</span></div>
        <div><b>${s.standing}</b><span>Cocktail</span></div>
        <div><b>${s.sqft ? s.sqft.toLocaleString('en-US') : '—'}</b><span>Sq ft</span></div>
      </div>
    </div>
  </article>`).join('');

const courses = (m) => m.courses.map(([c, items]) =>
  `<p class="pkg__sub">${c} course</p><ul class="pkg__menu">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`).join('');

const menuCard = ([k, m]) => `
  <article class="pkg${m.featured ? ' pkg--feat' : ''}${m.alt ? ' pkg--alt' : ''}">
    ${m.featured ? '<span class="pkg__flag">The full experience</span>' : ''}
    ${m.img && !m.alt ? `<figure class="pkg__img"><img loading="lazy" src="${img(m.img)}" alt="" /></figure>` : ''}
    <h3>${m.name}</h3>
    <p class="pkg__promise">${m.hook}</p>
    <p class="pkg__price"><b>$${m.rate}</b> per guest, before service &amp; tax</p>
    ${courses(m)}
    <div class="pkg__foot">
      <button type="button" class="btn${m.featured ? '' : ' btn--ghost'} btn--block" data-pick="${k}">Price it for my group</button>
    </div>
  </article>`;

$('menuGrid').innerHTML = Object.entries(MENUS).filter(([, m]) => !m.alt).map(menuCard).join('');
$('menuAlt').innerHTML = `<p class="menus-alt__lead">Also available</p><div class="pkgs pkgs--alt">${
  Object.entries(MENUS).filter(([, m]) => m.alt).map(menuCard).join('')}</div>`;

$('buyoutGrid').innerHTML = `
  ${Object.entries(BITES).map(([k, b]) => `
    <article class="bcard">
      <p class="pkg__tag">Hors d'oeuvres</p>
      <h3>${b.name.split(' ')[0]}</h3>
      <p class="bcard__price"><b>$${b.rate}</b> per guest</p>
      <p class="bcard__items">${b.items.join(' · ')}</p>
      <button type="button" class="btn btn--ghost btn--block" data-pick="${k}">Price it for my group</button>
    </article>`).join('')}
  ${Object.entries(BARS).map(([k, b]) => `
    <article class="bcard">
      <p class="pkg__tag">Open bar</p>
      <h3>${b.name.replace(' open bar', '')}</h3>
      <dl class="bcard__hours">
        <div><dt>1st hour</dt><dd>$${b.hours[0]}</dd></div>
        <div><dt>2nd hour</dt><dd>$${b.hours[1]}</dd></div>
        <div><dt>Each after</dt><dd>$${b.hours[2]}</dd></div>
      </dl>
      <p class="bcard__items">${b.pours}</p>
      <button type="button" class="btn btn--ghost btn--block" data-bar="${k}">Add it to my quote</button>
    </article>`).join('')}`;

document.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-pick]');
  const bar = e.target.closest('[data-bar]');
  if (!pick && !bar) return;
  if (pick) state.food = pick.dataset.pick;
  if (bar) state.bar = bar.dataset.bar;
  render();
  $('quote').scrollIntoView({ behavior: 'smooth' });
});

// ── form ────────────────────────────────────────────────────────────────────
$('fOcc').insertAdjacentHTML('beforeend', Object.values(OCCASIONS).map((o) => `<option>${o}</option>`).join(''));
$('fSpace').insertAdjacentHTML('beforeend', SPACES.map((s) => `<option>${s.name}</option>`).join(''));

let carried = null;
$('holdBtn').addEventListener('click', () => {
  const { space } = matchSpace();
  const e = estimate();
  const summary = [
    `${OCCASIONS[state.occ]} · ${state.guests} guests · ${state.fmt === 'seated' ? 'seated dinner' : 'cocktail-style'} · ${NIGHTS[state.night].label}`,
    `${space.name} · ${FOODS[state.food].name} · ${state.bar === 'host' ? 'host bar' : `${BARS[state.bar].name}, ${state.hours} hr`}`,
    [...state.extras].map((x) => (x === 'late' ? 'staying past 10PM' : 'guest valet')).join(', '),
  ].filter(Boolean);

  $('fGuests').value = state.guests;
  $('fOcc').value = OCCASIONS[state.occ];
  $('fSpace').value = space.name;
  $('fQuote').value = summary.join(' | ');
  $('fTotal').value = Math.round(e.total);
  const box = $('fSummary');
  box.innerHTML = `<b>Your quote · ${money(e.total)} all-in</b>${summary.join('<br>')}`;
  box.hidden = false;
  carried = e.total;
  track('InitiateCheckout', { value: Math.round(e.total), currency: 'USD' });

  $('inquire').scrollIntoView({ behavior: 'smooth' });
  $('fName').focus({ preventScroll: true });
});

const form = $('inqForm');
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  let ok = true;
  for (const id of ['fName', 'fEmail', 'fPhone', 'fGuests']) {
    const el = $(id);
    const bad = !el.value.trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
    el.closest('.field').classList.toggle('is-err', bad);
    el.setAttribute('aria-invalid', String(bad));
    if (bad && ok) { el.focus(); ok = false; }
  }
  if (!ok) return;

  const btn = $('fSubmit');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  $('fFail').hidden = true;

  try {
    // Netlify Forms captures the POST; locally there is no handler, so skip it.
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error(res.status);
    }
    track('Lead', { value: Math.round(carried ?? 0), currency: 'USD', content_name: $('fOcc').value || 'Event inquiry' });
    form.hidden = true;
    const done = $('formOk');
    done.hidden = false;
    done.focus();
  } catch {
    $('fFail').hidden = false;
    btn.disabled = false;
    btn.textContent = 'Send — hold my date';
  }
});
form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-err'));

// ── ambience ────────────────────────────────────────────────────────────────
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

(function embers() {
  if (still) return;
  const c = $('embers');
  const ctx = c.getContext('2d');
  const hero = c.parentElement;
  let W, H, parts, raf, visible = true;
  const spawn = (init) => ({
    x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 2 + 0.6,
    vy: -(Math.random() * 0.6 + 0.25), drift: Math.random() * 0.6 - 0.3,
    a: Math.random() * 0.55 + 0.25, t: Math.random() * 6.3, hue: 18 + Math.random() * 26,
  });
  function size() {
    W = c.width = hero.offsetWidth; H = c.height = hero.offsetHeight;
    parts = Array.from({ length: Math.min(54, Math.round(W / 24)) }, () => spawn(true));
  }
  function tick() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.t += 0.02; p.y += p.vy; p.x += p.drift + Math.sin(p.t) * 0.3;
      const alpha = p.a * Math.max(0, p.y / H);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue},95%,60%,${alpha})`);
      g.addColorStop(1, `hsla(${p.hue},95%,55%,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 7); ctx.fill();
      if (p.y < -10 || p.x < -20 || p.x > W + 20) Object.assign(p, spawn(false));
    }
    raf = visible ? requestAnimationFrame(tick) : null;
  }
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !raf) tick();
  }).observe(hero);
  size();
  addEventListener('resize', size);
})();

const io = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

const nav = $('nav');
const sticky = $('sticky');
const inView = (id) => { const r = $(id).getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
addEventListener('scroll', () => {
  nav.classList.toggle('stuck', scrollY > 40);
  sticky.classList.toggle('show', scrollY > 700 && !inView('quote') && !inView('inquire'));
}, { passive: true });

render();
