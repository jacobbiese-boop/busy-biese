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
| Show the Fillout form right on the Order page | `src/config/site.ts` (`fillout.formId`) |
| Live web address (domain) | `astro.config.mjs` (`SITE_URL`) |
| Colors and fonts | `src/styles/global.css` (top of the file). The look follows the Busy Biese Visual System 1.0: ivory page, dusty pink panels, cocoa type, Parisienne for the name, Cormorant Garamond headlines, Jost text. |

Commit the change to the `main` branch on GitHub and Hostinger rebuilds the site automatically in about a minute.

## Photos

Photos live in `public/photos` as WebP files named after the item (for example `cinnamon-rolls-800.webp`).
Until a photo exists, the site shows a dusty pink panel with a small bee, so nothing breaks.
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
scripts/               photo import tool, brand asset generator
docs/                  notes
```
