import {
  VENUE, PROMISE, PRICING, OCCASIONS, TIMES, BRUNCH_DAYS, BOTTLE_DAYS, BOTTLE_AFTER, SHOW_DAYS,
  SPACES, MENUS, BITES, BARS, barCost,
} from './config.js';

const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pct = (n) => Math.round(n * 100) + '%';
const img = (name) => `/images/${name}-800.webp`;
const track = (event, params) => {
  if (typeof window.fbq === 'function') window.fbq('track', event, params);
  if (typeof window.gtag === 'function') window.gtag('event', event === 'Lead' ? 'generate_lead' : 'begin_checkout', params);
};

const FOODS = { ...MENUS, ...BITES };
const BAR_HOURS = Math.ceil(PRICING.partyHours); // open bar covers the whole party
const today = new Date(); today.setHours(0, 0, 0, 0);

const state = {
  date: null, time: null, guests: 40, menu: 'm2', bar: 'host',
  month: new Date(today.getFullYear(), today.getMonth(), 1),
};

// ── helpers ─────────────────────────────────────────────────────────────────
const hours = (t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
const timeLabel = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const dateLabel = (d, opts = { weekday: 'long', month: 'long', day: 'numeric' }) => d.toLocaleDateString('en-US', opts);
const isBrunch = (t) => TIMES.brunch.includes(t);
const bottleApplies = () => state.date && state.time && !isBrunch(state.time)
  && BOTTLE_DAYS.includes(state.date.getDay()) && hours(state.time) + PRICING.partyHours > BOTTLE_AFTER;

// Smallest space that seats the group; past the full venue's seats, it's a cocktail-style buyout.
function spaceFor(g) {
  const bySeats = [...SPACES].sort((a, b) => a.seated - b.seated || !!a.note - !!b.note);
  const seated = bySeats.find((s) => s.seated >= g);
  if (seated) return { space: seated, fmt: 'seated' };
  return { space: SPACES.find((s) => s.key === 'buyout'), fmt: 'standing' };
}

function menuOptions(space) {
  if (state.time && isBrunch(state.time)) return ['brunch'];
  const keys = Object.keys(MENUS).filter((k) => !MENUS[k].brunch);
  return space.buyout ? [...keys, ...Object.keys(BITES)] : keys;
}

function estimate(space) {
  const g = state.guests;
  const food = FOODS[state.menu];
  const lines = [[`${food.name} × ${g}`, food.rate * g]];
  if (state.bar !== 'host') lines.push([`${BARS[state.bar].name} · ${BAR_HOURS} hrs × ${g}`, barCost(state.bar, BAR_HOURS) * g]);
  if (bottleApplies()) {
    const tables = Math.ceil(g / PRICING.bottleGroup);
    lines.push([`Bottle minimum after 10PM · ${tables} × ${money(PRICING.bottleMin)}`, tables * PRICING.bottleMin]);
  }
  const subtotal = lines.reduce((t, [, v]) => t + v, 0);
  const service = subtotal * PRICING.serviceCharge;
  const tax = subtotal * PRICING.taxRate;
  return { lines, service, tax, total: subtotal + service + tax };
}

// ── copy from config ────────────────────────────────────────────────────────
document.querySelectorAll('[data-promise]').forEach((el) => { el.textContent = PROMISE[el.dataset.promise]; });
document.querySelectorAll('[data-venue="phone"]').forEach((a) => { a.href = VENUE.phoneHref; a.textContent = VENUE.phone; });

(function ribbon() {
  const m = today.getMonth();
  if ((m === 11 && today.getDate() > 20) || m === 0) {
    $('ribbonText').innerHTML = '<b>January:</b> the easiest month of the year to land a Friday. Book your team kickoff now.';
    return;
  }
  const peak = new Date(today.getFullYear(), 11, 11);
  $('weeksLeft').textContent = Math.max(1, Math.floor((peak - today) / 6048e5));
})();

// ── pricing (up front) ──────────────────────────────────────────────────────
const row = (name, sub, price) => `<li><span><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</span><em>${price}</em></li>`;
$('priceMenus').innerHTML = Object.values(MENUS).map((m) => row(m.name, m.hook, `$${m.rate}`)).join('');
$('priceBuyout').innerHTML = [
  ...Object.values(BITES).map((b) => row(b.name, 'Passed all night, per guest', `$${b.rate}`)),
  ...Object.values(BARS).map((b) => row(b.name, `1st hr · then $${b.hours[1]} · then $${b.hours[2]}/hr`, `$${b.hours[0]}`)),
].join('');
$('priceRules').innerHTML = [
  row('Service charge', 'On food and drink', pct(PRICING.serviceCharge)),
  row('Sales tax', '', pct(PRICING.taxRate)),
  row('Party time', 'Included with every event', `${PRICING.partyHours} hrs`),
  row('Bottle minimum', 'After 10PM Thu–Sat, per 4–5 guests', `$${PRICING.bottleMin}`),
  row('Valet', 'Per car, optional to cover', `$${PRICING.valet}`),
].join('');

// ── calendar ────────────────────────────────────────────────────────────────
const maxMonth = new Date(today.getFullYear() + 1, today.getMonth(), 1);

function renderCalendar() {
  const { month } = state;
  $('calMonth').textContent = dateLabel(month, { month: 'long', year: 'numeric' });
  $('calPrev').disabled = month <= new Date(today.getFullYear(), today.getMonth(), 1);
  $('calNext').disabled = month >= maxMonth;

  const lead = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  let html = '<span></span>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    const past = date < today;
    const sel = state.date && date.getTime() === state.date.getTime();
    const show = SHOW_DAYS.includes(date.getDay());
    html += `<button type="button" class="cal__day${show ? ' is-show' : ''}${date.getTime() === today.getTime() ? ' is-today' : ''}"
      data-d="${d}" ${past ? 'disabled' : ''} aria-pressed="${sel}" aria-label="${dateLabel(date)}${show ? ', fire show night' : ''}">${d}</button>`;
  }
  $('calDays').innerHTML = html;
}

$('calPrev').addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCalendar(); });
$('calNext').addEventListener('click', () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCalendar(); });
$('calDays').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-d]');
  if (!b) return;
  const first = !state.date;
  state.date = new Date(state.month.getFullYear(), state.month.getMonth(), +b.dataset.d);
  if (state.time && isBrunch(state.time) && !BRUNCH_DAYS.includes(state.date.getDay())) state.time = null;
  if (first) track('InitiateCheckout', { content_name: 'Picked event date' });
  $('errDate').classList.remove('show');
  renderCalendar();
  render();
});

// ── times ───────────────────────────────────────────────────────────────────
function renderTimes() {
  if (!state.date) return;
  const d = state.date.getDay();
  const now = new Date();
  const isToday = state.date.getTime() === today.getTime();
  const group = (title, list) => `<p class="pick__sub">${title}</p><div class="chips chips--time" role="radiogroup" aria-label="${title} start time">${
    list.map((t) => {
      const late = BOTTLE_DAYS.includes(d) && title === 'Dinner' && hours(t) + PRICING.partyHours > BOTTLE_AFTER;
      const gone = isToday && hours(t) <= now.getHours() + now.getMinutes() / 60 + 2;
      return `<button type="button" role="radio" data-t="${t}" aria-checked="${state.time === t}" ${gone ? 'disabled' : ''}
        class="${late ? 'is-late' : ''}">${timeLabel(t)}</button>`;
    }).join('')}</div>`;
  $('times').innerHTML = (BRUNCH_DAYS.includes(d) ? group('Brunch', TIMES.brunch) : '') + group('Dinner', TIMES.dinner);
}
$('times').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-t]');
  if (!b) return;
  state.time = b.dataset.t;
  $('errTime').classList.remove('show');
  render();
});

// ── guests ──────────────────────────────────────────────────────────────────
const guestsIn = $('guests');
const setGuests = (n) => {
  state.guests = Math.min(800, Math.max(PRICING.minGuests, Math.round(n) || PRICING.minGuests));
  render();
};
document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => setGuests(state.guests + +b.dataset.step)));
guestsIn.addEventListener('change', () => setGuests(+guestsIn.value));
guestsIn.addEventListener('input', () => { if (+guestsIn.value >= PRICING.minGuests) setGuests(+guestsIn.value); });

// ── menu + bar chips ────────────────────────────────────────────────────────
const chip = (key, val, label, sub, on) =>
  `<button type="button" role="radio" data-${key}="${val}" aria-checked="${on}"><b>${label}</b><small>${sub}</small></button>`;

$('menuChips').addEventListener('click', (e) => { const b = e.target.closest('[data-menu]'); if (b) { state.menu = b.dataset.menu; render(); } });
$('barChips').addEventListener('click', (e) => { const b = e.target.closest('[data-bar]'); if (b) { state.bar = b.dataset.bar; render(); } });

// ── render ──────────────────────────────────────────────────────────────────
function render() {
  const { space, fmt } = spaceFor(state.guests);
  const options = menuOptions(space);
  if (!options.includes(state.menu)) state.menu = options.includes('m2') ? 'm2' : options[0];
  if (!space.buyout) state.bar = 'host';

  guestsIn.value = state.guests;
  renderTimes();

  $('menuChips').innerHTML = options.map((k) => chip('menu', k,
    FOODS[k].name.replace(' Menu', '').replace(" hors d'oeuvres", ' bites'), `$${FOODS[k].rate}/guest`, state.menu === k)).join('');
  $('barPick').hidden = !space.buyout;
  $('barChips').innerHTML = [
    chip('bar', 'host', 'Host tab', 'Pay as you go', state.bar === 'host'),
    ...Object.entries(BARS).map(([k, b]) => chip('bar', k, b.name.replace(' open bar', ''), `$${barCost(k, BAR_HOURS)}/guest · ${BAR_HOURS} hrs`, state.bar === k)),
  ].join('');

  // hints
  const day = state.date?.getDay();
  $('timeHint').textContent = !state.date ? ''
    : bottleApplies() ? `Runs past 10PM on a ${dateLabel(state.date, { weekday: 'long' })}, so a $${PRICING.bottleMin} bottle minimum per ${PRICING.bottleGroup} guests is added.`
    : BOTTLE_DAYS.includes(day) ? 'Times marked • run past 10PM and add a bottle minimum.'
    : SHOW_DAYS.includes(day) ? 'Fire shows start after 9PM.' : '';
  $('spaceHint').innerHTML = `${fmt === 'seated' ? 'Seats' : 'Cocktail-style in'} the <b>${space.name}</b>${space.buyout ? ` · ${space.buyout.toLowerCase()}` : ''}${space.note ? ` · ${space.note.toLowerCase()}` : ''}`;

  // summary
  const e = estimate(space);
  const sumImg = $('sumImg');
  if (!sumImg.src.endsWith(img(space.img))) {
    sumImg.style.opacity = 0;
    sumImg.onload = () => { sumImg.style.opacity = 1; };
    sumImg.src = img(space.img);
  }
  sumImg.alt = space.name;
  $('sumSpaceTag').textContent = space.buyout || 'Your space';
  $('sumSpace').textContent = space.name;
  $('sumWhen').textContent = state.date
    ? `${dateLabel(state.date)}${state.time ? ' · ' + timeLabel(state.time) : ' · pick a time'} · ${state.guests} guests`
    : 'Pick a date and time';
  $('sumWhen').classList.toggle('is-set', !!(state.date && state.time));
  $('sumTotal').textContent = money(e.total);
  $('sumPer').textContent = `${money(e.total / state.guests)} per guest, service & tax included`;
  $('sumLines').innerHTML = [
    ...e.lines.map(([k, v]) => [k, money(v)]),
    ...(state.bar === 'host' ? [['Drinks', 'Host tab', 'muted']] : []),
    [`Service charge · ${pct(PRICING.serviceCharge)}`, money(e.service)],
    [`Sales tax · ${pct(PRICING.taxRate)}`, money(e.tax)],
  ].map(([k, v, cls]) => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('');

  document.querySelectorAll('.space').forEach((c) => c.classList.toggle('is-pick', c.dataset.key === space.key));
  return { space, fmt, e };
}

// ── spaces + menus ──────────────────────────────────────────────────────────
$('spaceGrid').innerHTML = SPACES.map((s) => `
  <article class="space" data-key="${s.key}">
    <div class="space__ph">
      <img loading="lazy" src="${img(s.img)}" alt="${s.name} at Mayami Wynwood" width="800" height="533" />
      ${s.buyout ? `<span class="space__badge">${s.buyout}</span>` : ''}
    </div>
    <div class="space__body">
      <h3>${s.name}</h3>
      <p class="space__vibe">${s.vibe}</p>
      ${s.note ? `<p class="space__note">${s.note}</p>` : ''}
      <div class="caps">
        <div><b>${s.seated}</b><span>Seated</span></div>
        <div><b>${s.standing}</b><span>Cocktail</span></div>
        <div><b>${s.sqft ? s.sqft.toLocaleString('en-US') : '—'}</b><span>Sq ft</span></div>
      </div>
    </div>
  </article>`).join('');

$('menuGrid').innerHTML = Object.entries(MENUS).map(([k, m]) => `
  <article class="menu">
    ${m.img ? `<figure class="menu__img"><img loading="lazy" src="${img(m.img)}" alt="" /></figure>` : ''}
    <div class="menu__body">
      <div class="menu__top"><h3>${m.name}</h3><p class="menu__price">$${m.rate}<small>/guest</small></p></div>
      ${m.courses.map(([c, items]) => `<p class="menu__course">${c}</p><p class="menu__items">${items.join(' · ')}</p>`).join('')}
      <button type="button" class="menu__pick" data-pick="${k}">Book with this menu →</button>
    </div>
  </article>`).join('');

$('menuGrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]');
  if (!b) return;
  state.menu = b.dataset.pick;
  if (MENUS[state.menu].brunch && state.time && !isBrunch(state.time)) state.time = null;
  render();
  $('book').scrollIntoView({ behavior: 'smooth' });
});

// ── submit ──────────────────────────────────────────────────────────────────
$('fOcc').insertAdjacentHTML('beforeend', Object.values(OCCASIONS).map((o) => `<option>${o}</option>`).join(''));

const form = $('bookForm');
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const problems = [];
  if (!state.date) { $('errDate').classList.add('show'); problems.push($('cal')); }
  if (!state.time) { $('errTime').classList.add('show'); problems.push($('times')); }
  for (const id of ['fName', 'fEmail', 'fPhone']) {
    const el = $(id);
    const bad = !el.value.trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
    el.closest('.field').classList.toggle('is-err', bad);
    el.setAttribute('aria-invalid', String(bad));
    if (bad) problems.push(el);
  }
  if (problems.length) {
    problems[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (problems[0].focus) problems[0].focus({ preventScroll: true });
    return;
  }

  const { space, e } = render();
  const when = `${dateLabel(state.date)} at ${timeLabel(state.time)}`;
  const menu = FOODS[state.menu].name;
  const bar = state.bar === 'host' ? 'Host tab' : BARS[state.bar].name;
  const d = state.date;
  $('hDate').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  $('hTime').value = timeLabel(state.time);
  $('hGuests').value = state.guests;
  $('hSpace').value = space.name;
  $('hMenu').value = menu;
  $('hBar').value = bar;
  $('hTotal').value = Math.round(e.total);
  $('hSummary').value = `${when} · ${state.guests} guests · ${space.name} · ${menu} · ${bar} · ${money(e.total)} all-in`;

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
    track('Lead', { value: Math.round(e.total), currency: 'USD', content_name: $('fOcc').value || 'Event booking' });
    $('okText').textContent = `${when} for ${state.guests} guests in the ${space.name} — ${money(e.total)} all-in. `
      + `Your events captain will confirm within ${PROMISE.responseTime} during business hours.`;
    form.hidden = true;
    $('formOk').hidden = false;
    $('formOk').focus();
  } catch {
    $('fFail').hidden = false;
    btn.disabled = false;
    btn.textContent = 'Request this date';
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
}), { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

const nav = $('nav');
const sticky = $('sticky');
const inView = (id) => { const r = $(id).getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
addEventListener('scroll', () => {
  nav.classList.toggle('stuck', scrollY > 40);
  sticky.classList.toggle('show', scrollY > 700 && !inView('book'));
}, { passive: true });

renderCalendar();
render();
