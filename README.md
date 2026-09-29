# Mayami Wynwood — Private Events

Landing page for private events and group bookings at [Mayami Wynwood](https://www.mayamiwynwood.com), built to the
[Private Events Playbook](https://dinelineevents.netlify.app/) SOP. It's the page the Q4 ads point at: one page, one form, one job.

## What's on the page

The page is built to be low-effort for the planner: prices first, then four picks and a total.

| Section | SOP principle it serves |
|---|---|
| Urgency ribbon (live weeks-to-December count) | Sell in the month they decide, not the month they party |
| **Pricing, up front** — every menu, buyout extra, fee and rule | "Inquire for pricing" is a dead end |
| **Book** — calendar → start time → guests → menu, with a live all-in total and contact fields in one panel | The fastest clear answer wins. One form, one job |
| Spaces (matched to guest count automatically) | Everything on the page |
| Menus with every course | A short, confident menu of packages |
| The night + press | Engineer the moments that drive rebooking |
| FAQ from the client's own policies | Answer objections before they're emailed |

The booking panel works out the details itself: the **space** comes from the guest count (smallest space that
seats the group), **brunch** times appear on Saturday and Sunday and lock the menu to Brunch, **open bars and hors
d'oeuvres** appear once the group needs a buyout, and the **bottle minimum** is added when a Thursday–Saturday
party runs past 10PM.

The calendar collects a *requested* date. There's no live availability feed, so the captain confirms it.

## Editing content

**All prices, spaces, menus and policies live in [`src/config.js`](src/config.js).** You shouldn't need to touch layout code
to change a price. Sources are noted at the top of that file.

### Confirm with Mayami before launch

- **Response-time promise** (`PROMISE.responseTime`). The SOP calls for 2 hours; their current site promises 24.
  Only publish what the events lead will actually hit.
- **Weather policy** — not in the deck. Add a FAQ entry if they have a rain plan for the Terrace and Outdoor Area.
- **Outdoor Area square footage** — not in the deck.
- **Bottle-service minimum** — the deck says "$450 per 4–5 guests" and "after 10PM" (FAQ) vs "after 10:30PM" (hours slide).
  The quote uses per 5 guests, after 10PM.
- **Minors / 21+** — the website says 21+ after 11PM; the events deck says minors must leave by 10:30PM. The page uses the deck.
- A real **planner testimonial** (placeholder comment in the gallery section).
- A dedicated **events inbox** (`VENUE.email`) routes faster than `info@`.

## Images

Photography is the venue's own: pulled from mayamiwynwood.com and from their corporate events deck.
Originals go in `raw/` (gitignored, about 100 MB), and `npm run images` writes web-sized WebP to `public/images/`.

```bash
pdfimages -all "CORPORATE FINAL.pdf" raw/pdf/p
npm run images
```

## Develop and deploy

```bash
npm install
npm run dev
```

Deploys as a static site on Netlify (`netlify.toml`). The inquiry form uses **Netlify Forms** (form name
`mayami-event-booking`). After the first deploy, turn on form notifications in Netlify so each lead is emailed to the
events lead the moment it arrives. The 2-hour promise depends on it.

**Tracking:** paste the Meta Pixel and GA4 base codes into `<head>`. The page already fires `InitiateCheckout` when a date
is picked, and `Lead` (with the quote value) on submit.
