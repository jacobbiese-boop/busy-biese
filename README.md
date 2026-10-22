# Busy Biese website

The website for **Busy Biese**, a small-batch, made-to-order bakery in Glendale Heights, IL.
Built with [Astro](https://astro.build) as a fast static site and deployed on Hostinger from GitHub.

## Pages

| Page | Address |
| --- | --- |
| Home | `/` |
| Menu (all items, by category) | `/menu/` |
| One page per item (17 items) | `/menu/<item>/` |
| Order (order form + quick price guide) | `/order/` |
| Catering and large orders | `/catering/` |
| Our story | `/about/` |
| Delivery and order policy | `/policies/` |
| Not found | `/404.html` |

Also built automatically: `sitemap-index.xml`, `robots.txt`, search-engine data for the business and every item, and social share images.

## Everyday edits

| To change | Edit this file |
| --- | --- |
| Prices, sizes, flavors, descriptions, allergens, FAQs | `src/data/menu.ts` |
| Order form link, Instagram, WhatsApp, email, phone | `src/config/site.ts` |
| Announcement bar at the top of every page | `src/config/site.ts` (`announcement`) |
| Delivery radius, fees, delivery windows | `src/config/site.ts` (`delivery`) |
| Which Fillout form the Order page shows | `src/config/site.ts` (`fillout.formId`; empty shows a button instead) |
| Live web address (domain) | `astro.config.mjs` (`SITE_URL`) |
| Colors and fonts | `src/styles/global.css` (top of the file). The look follows the Busy Biese Visual System 1.0: ivory page, dusty pink panels, cocoa type, Parisienne for the name, Cormorant Garamond headlines, Jost text. |

Commit the change to the `main` branch on GitHub and Hostinger rebuilds the site automatically in about a minute.

## Order form

The Order page shows the Fillout form "Busy Biese · Order request" right on the page
(`fillout.formId` in `src/config/site.ts`). Every Order button on the site sends two values
along with it, and the embed passes them on to Fillout:

- `type`: the order type, such as `Menu items` or `Catering`
- `item`: the exact item and size, such as `Cinnamon Rolls · 4 rolls`

The Order page always shows the visitor what they picked. To have the form fill those in by
itself too, open the form in Fillout, go to Settings > URL parameters and add `type` and
`item`, then set the default value of "Order type" to `@type` and of "Item 1" to `@item`.
The item names on the site match the form's options exactly, so keep the two in step when
renaming an item or a size.

The "Open it in a new tab" link under the form uses the form's public link,
`https://intakeforms.fillout.com/BusyBieseBakery` (`links.orderForm`).

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
