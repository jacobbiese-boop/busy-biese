# Busy Biese website

The website for **Busy Biese**, a small-batch, made-to-order bakery in Glendale Heights, IL.
Built with [Astro](https://astro.build) as a fast static site and deployed on Hostinger from GitHub.

## Pages

| Page | Address |
| --- | --- |
| Home | `/` |
| Menu (all items, by category) | `/menu/` |
| One page per item (17 items) | `/menu/<item>/` |
| Order (build an order, pickup or delivery, an estimate, then send it) | `/order/` |
| Custom requests (cakes, themed treats, catering, events) | `/order/request/` |
| Catering and large orders | `/catering/` |
| Our story | `/about/` |
| Delivery and order policy | `/policies/` |
| Not found | `/404.html` |

Also built automatically: `sitemap-index.xml`, `robots.txt`, search-engine data for the business and every item, and social share images.

## Everyday edits

| To change | Edit this file |
| --- | --- |
| Prices, sizes, flavors, descriptions, allergens, FAQs | `src/data/menu.ts` (prices and sizes also live on the Price List sheet, see Ordering) |
| Order form link, Instagram, WhatsApp, email, phone | `src/config/site.ts` |
| Announcement bar at the top of every page | `src/config/site.ts` (`announcement`) |
| Delivery radius, fees, delivery windows | `src/config/site.ts` (`delivery`) |
| Which Fillout forms the site shows | `src/config/site.ts` (`fillout.checkoutFormId` for checkout; `fillout.formId` for custom requests, empty shows a button instead) |
| Live prices from the Price List sheet | `src/config/site.ts` (`priceFeed`) |
| Live web address (domain) | `astro.config.mjs` (`SITE_URL`) |
| Colors and fonts | `src/styles/global.css` (top of the file). The look follows the Busy Biese Visual System 1.0: ivory page, dusty pink panels, cocoa type, Parisienne for the name, Cormorant Garamond headlines, Jost text. |

Commit the change to the `main` branch on GitHub and Hostinger rebuilds the site automatically in about a minute.

## Ordering

Ordering runs through two Fillout forms and one Make automation (BB-01). The automation prices
every order again from the Price List spreadsheet, numbers and logs it, files the customer and
tells the bakery.

- **Menu items: the cart.** Product tiles and size buttons say "Add to order". They open a small
  sheet (size, flavor, extras, how many) and add the line to the visitor's order, which is kept in
  their browser. `/order/` lists the order, asks pickup or delivery and the day and time, shows an
  estimated total, and then shows the short "Busy Biese · Checkout" form
  (`fillout.checkoutFormId`) for name, phone and email. The order travels to the form in the URL,
  so nobody picks items twice.
- **Custom requests.** Custom cakes, custom treats, catering and events go to `/order/request/`,
  which shows the "Busy Biese · Order request" form (`fillout.formId`). Links can preselect the
  order type with `?type=`.
- **Prices.** The site's prices come from `src/data/menu.ts`. When `priceFeed` in
  `src/config/site.ts` holds the Price List's published CSV links, the site uses the sheet's
  prices, sizes, add-ons and delivery rules instead, so a change on the sheet shows on the site
  within minutes. Either way the total on the site is an estimate: the automation prices the order
  from the sheet and the bakery confirms the final price.

The details (URL parameters, slugs, the estimate rules, tests) are in `CLAUDE.md` under "Ordering".

## Working on the site with Claude Code

`CLAUDE.md` holds the project notes Claude Code reads at the start of every session: commands,
how deploys work, the ordering contract, the design rules and the open items. Keep it current
when something important changes. Private notes go in `CLAUDE.local.md`, which is not committed.

Changes are usually planned and previewed in Cowork, which saves each approved version as a zip
in Google Drive (My Drive > Nexus > Busy Biese). Claude Code applies the zip and pushes it; the
steps are in `CLAUDE.md` under "Versions from Cowork". The live version number is in the page
head as `<meta name="busy-biese-version">`.

## Motion

The bee is the one thing on the site that moves: it flies in on the home page (tap it for a
loop), buzzes when you point at the logo, carries the loading states, and takes you back to
the top. All of it is in `src/styles/global.css` ("Bee motion") and switches off for anyone
whose device asks for reduced motion.

## Photos

Photos live in `public/photos` as WebP files named after the item (for example `cinnamon-rolls-800.webp`).
Until a photo exists, the site shows a dusty pink panel with a small bee, so nothing breaks.
Tapping a gallery photo opens it large.
See `docs/PHOTOS.md` for the full list of photo names and `scripts/import_photos.py` to convert original photos.

## Hostinger build settings

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Branch | `main` |
| Node.js version | 24 (22 also works) |
| Root directory | `./` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | leave empty (this is a static site) |
| Environment variable (optional) | `SITE_URL` = your live address, e.g. `https://busybiese.com` |

## Run it on a computer (optional)

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
```

Requires Node.js 22.12 or newer.

## Folder map

```
src/config/site.ts     business settings
src/data/menu.ts       the menu
src/pages/             one file per page
src/components/        header, footer, bee mark, lockup, product list, gallery, photo, icons
src/layouts/Base.astro page shell, SEO tags, scripts
src/styles/global.css  design system
public/                logo files, icons, social image, photos
scripts/               photo import tools, brand asset and favicon generator
docs/                  notes
```
