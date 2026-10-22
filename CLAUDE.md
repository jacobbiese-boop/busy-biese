# Busy Biese website

The website for Busy Biese, a small-batch, made-to-order bakery in Glendale Heights, IL.
Live at https://busybiese.com. Astro 7 static site, deployed by Hostinger from this repo.
Jacob Biese owns the site and makes the calls on menu, prices, photos and anything that costs money.

This repo is **public**. Never commit private details (phone numbers, personal emails, sheet or
Drive IDs, account names, keys). Put private notes in `CLAUDE.local.md`, which is gitignored.

## Commands

```bash
npm install          # Node 22.12 or newer (Hostinger builds with Node 24)
npm run dev          # local preview at http://localhost:4321
npm run build        # production build into dist/ (must pass before every push)
npm run preview      # serve the built dist/
npm i --no-save @astrojs/check typescript && npx astro check   # type check, expect 0 errors
```

`npm run check` alone prompts to install `@astrojs/check`, so use the line above.

## How changes go live

- Every commit on `main` triggers a Hostinger build (`npm run build`, output `dist`, Node 24).
  The live site updates about a minute later. There is no staging site.
- Most changes arrive as version zips from Cowork (next section). Anything else: work on a branch,
  open a pull request and wait for Jacob's OK before it reaches `main`. Never force push `main`.
- After a deploy, check the live page, not only the local build:
  - HTML is served uncached (`x-hcdn-cache-status: DYNAMIC`), so page changes show at once.
  - Static files are cached by Hostinger's CDN for 30 days. When an icon or image changes,
    give it a new name or bump its `?v=` query (icons: `src/layouts/Base.astro` and
    `public/site.webmanifest`; share image: `src/layouts/Base.astro` and `src/lib/seo.ts`).
  - The CDN re-encodes larger PNG and WebP files, so live bytes differ from the repo even when
    the image is identical. Compare decoded pixels, not file hashes.

## Versions from Cowork

Jacob plans and reviews changes with Claude in Cowork. Cowork builds each version, shows him a
preview of the site, and saves a version zip in his Google Drive under My Drive > Nexus > Busy Biese
(on his PC usually `G:\My Drive\Nexus\Busy Biese`). Once he approves a version he sends you one
line, such as "Please refer to busy-biese-v1.1.zip in my Google Drive (Nexus > Busy Biese) and push
the edits". That line is his go-ahead to push that version, as long as every check below passes.

Each zip holds `VERSION.md` (what changes, in plain words, and the exact steps), `manifest.json`
(version, base commit, each changed file with its SHA-256, files to delete, commit message) and
`files/` (the changed files at their repo paths). To apply one:

1. Get the zip from Google Drive (the Drive connector finds it by name). Work in a clone of
   https://github.com/jacobbiese-boop/busy-biese; if this session opened in another repo, clone or
   attach busy-biese and work there. Never apply a version zip to another repo. Check out `main`,
   `git pull --ff-only`, and make sure the working tree is clean.
2. `git rev-parse HEAD` must equal the manifest's `base_commit`. If `main` has moved on, stop and
   tell Jacob so Cowork can rebuild the version on top of it. Never merge by hand.
3. Copy `files/` over the repo, delete the paths listed in `delete`, and check each file's
   SHA-256 against the manifest (PowerShell: `Get-FileHash -Algorithm SHA256 <file>`).
   `git status --short --untracked-files=all` must list exactly the manifest's files.
4. `npm ci`, `npm run build` and the type check must pass.
5. Commit with the manifest's message and `git push origin main`. Do not tag: the version number
   is in the commit message and in the page head (cloud sessions cannot push tags).
6. If you can reach https://busybiese.com, check about a minute later that the page head shows
   `<meta name="busy-biese-version" content="...">` with the new version. If you cannot, say so:
   Cowork checks the live site after every push.
7. Tell Jacob in two short lines what was pushed (version and short commit hash) and whether you
   could check the live site. If any step fails, stop before pushing and tell him what failed;
   never push a version that did not pass.

`src/config/version.ts` holds the version number; every version zip updates it.

## Project map

```
src/config/site.ts      business settings: links, Fillout forms, price feed, contact, delivery, announcement, GA4
src/config/version.ts   the site version, shown in the page head as busy-biese-version
src/data/menu.ts        every product: names, sizes (tiers), prices, allergens, FAQs, photo names; categories
src/pages/              index, menu/index, menu/[slug] (one page per product), order/index (cart and checkout),
                        order/request (custom requests), catering, about, policies, 404, robots.txt.ts
src/layouts/Base.astro  page shell: SEO tags, icons, header, footer, back to top bee, page transitions, ordering helpers
src/components/         Header, Footer, Logo (lockup), Bee (the mark, with motion variants), BeeLoader,
                        ProductList, Gallery (with the full screen photo viewer), Photo, PageHero, Icon,
                        OrderSheet (baked-in menu, the add sheet, toast and cart bar on every page)
src/lib/shop-core.ts    ordering core shared by build and browser: types, CSV, live price merge, prices, cart param
src/lib/shop-build.ts   the menu from menu.ts and site.ts, baked into every page as the fallback
src/scripts/shop.ts     browser: live prices, cart (localStorage), add sheet, toast, cart bar
src/scripts/checkout.ts browser: the /order/ page (lines, pickup or delivery, day and time, estimate, Fillout)
src/styles/order.css    styles for everything the two scripts draw
src/lib/order.ts        order links: orderLink(), customTypes, formItem(), formUrl(), OrderType
src/lib/photos.ts       photo lookup by name; missing photos fall back to a pink placeholder
src/lib/seo.ts          JSON-LD (Bakery, Product, Breadcrumb, FAQ) and the share image
src/lib/format.ts       money and price label helpers
src/styles/global.css   design tokens, base styles, "Bee motion" section
public/                 brand files, favicons, photos, share image, .htaccess
scripts/                make_brand.py (brand assets and favicons), import_photos.py, photos_from_drive.py
docs/PHOTOS.md          photo names and where each is used
```

## Ordering: the contract with the forms and the order automation

Two Fillout forms feed one automation (Make scenario "BB-01"). It prices every order again from the Price List
spreadsheet, numbers it, logs it on the Orders sheet, files the customer on the Customers tab, and notifies the
bakery. The website total is only an estimate; BB-01 flags any difference.

- **Menu orders: the cart.** Anything with `data-add="<slug>"` (and optionally `data-size="<tier label>"`) opens the
  add sheet: product tiles, the size buttons on product pages, the order page picker. `src/scripts/shop.ts` keeps the
  cart in localStorage (`bb-cart-v1`, lines merge when item, size, flavor and add-ons match), shows a toast and a
  cart bar, and updates `[data-price-from]`, `[data-tier]`, `[data-cart-count]`.
- **Checkout.** `/order/` (`src/pages/order/index.astro`, `src/scripts/checkout.ts`) lists the lines, asks pickup or
  delivery (address), the day (earliest = longest lead time of the items) and a time window, shows the estimate, then
  embeds the "Busy Biese · Checkout" form (`site.fillout.checkoutFormId`) from `embed.fillout.com` with these URL
  parameters, which must stay defined in that form's Settings > URL parameters:
  `cart` (JSON, see `cartParam()` in `shop-core.ts`), `items` (readable summary), `plan` (readable pickup or delivery,
  day, time), `est`, `date` (YYYY-MM-DD), `time`, `fulfillment` (Pickup or Delivery), `address`, `ref`
  (W-XXXXXX, stays the same until the order is sent), `src` (website). The form itself only asks name, phone,
  email, contact preference, notes and the email opt-in. When the form posts `form_submit`, the page thanks the
  customer and empties the cart. Form changes need Publish in Fillout.
- **Slugs and sizes.** Cart lines name items by the Price List's "Site slug" and "Size" columns, which are the
  `menu.ts` slug and tier label. Keep slugs stable. A size renamed here must be renamed on the sheet word for word.
- **Live prices.** `site.priceFeed` holds CSV links to the Price List's Menu, Add-ons and Settings tabs. When set,
  sizes, prices, flavors, add-ons, delivery fees and time windows come from the sheet (cached 5 minutes per visitor);
  a size or item set to Active = No disappears, and a new row on the sheet shows up in the order page picker even
  without a product page. When empty or unreachable, `menu.ts` and `site.ts` are used (`src/lib/shop-build.ts`).
- **Estimate parity.** `priceLine()` and `cartTotals()` in `shop-core.ts` mirror BB-01's pricing: per line, size price
  times how many, plus add-ons ("each" times the count, otherwise once per line); delivery is the flat fee up to the
  threshold, then a percent of the subtotal. Change both together.
- **Custom requests.** Custom cakes, custom treats, catering and events go to the "Busy Biese · Order request" form
  (`site.fillout.formId`) on `/order/request/`. `orderLink({ type })` builds those links; `type` preselects "Order type"
  in the form. Order types are exactly `Custom cake`, `Custom treats`, `Catering`, `Event booking` (and `Menu items`).
- **Embed of the request form.** It uses Fillout's standard embed (`data-fillout-inherit-parameters`,
  `data-fillout-dynamic-resize`). The embed div is written as raw HTML (`set:html`) on purpose: Fillout forwards every
  other `data-*` attribute on that div as a URL parameter, and Astro's scoped `data-astro-cid-*` attribute would leak
  into the form. Keep it that way. A bee loader covers the panel until Fillout sets the height.
- **Time windows.** `site.delivery.windows` (label plus hours, e.g. "Midday (11 to 2)") match the request form and the
  Price List setting `time_windows`, which the live feed uses at checkout. "Flexible" is always offered too.
- **Form link.** `links.orderForm` is the request form's public custom link,
  `https://intakeforms.fillout.com/BusyBieseBakery`. The older `/busybiese` link is dead.
- **Tests.** Before shipping a change to ordering, run the estimate parity test (random carts priced by the site and
  by BB-01's code) and a browser pass over add, change, remove, checkout and the thank-you state.

## Design: Busy Biese Visual System 1.0

- Use the CSS variables at the top of `global.css`, never raw hex in components:
  ivory `--ivory` page, dusty pink `--pink` panels, `--pink-matte` fills, cocoa `--cocoa` type and
  buttons, rose `--rose` accents, mauve `--mauve` secondary text.
- Type: Parisienne only for the Busy Biese name, Cormorant Garamond for headlines, Jost for text.
  All self-hosted through `@fontsource`; no external font or script requests besides Fillout.
- Small labels are uppercase with wide letter spacing (`.eyebrow`, `--step-micro`).
- The mark is a line-art bee (`Bee.astro`), the lockup is `Logo.astro`. Favicons and app icons come
  from `scripts/make_brand.py` (Python 3 and Pillow). After regenerating them, bump `?v=`.
- Photos are shown without captions. Missing photos show a pink panel with a small bee.

## Motion

- The bee is the only thing that moves: it flies in on the home page and loops when tapped,
  buzzes on the logo, carries the loading states, and the back to top button is a bee.
- All motion CSS sits in the "Bee motion" section of `global.css` and is switched off under
  `prefers-reduced-motion`. Anything new must do the same.

## Photos

- Files live in `public/photos` as `<name>-800.webp` (always) and `<name>-1400.webp` (optional).
  Products list photo names in `menu.ts`; see `docs/PHOTOS.md`.
- Add one with `python3 scripts/import_photos.py --file photo.HEIC --name some-name`
  (originals go in `photo-inbox/`, which is gitignored).
- The "Import photos from Google Drive" workflow (Actions tab, run by hand) rebuilds the set from
  Drive using the `DRIVE_PHOTO_IDS` repository secret. Never commit Drive IDs.

## Quality bar before every push

1. `npm run build` passes and `astro check` reports 0 errors.
2. Changed pages look right at 360 px and 1440 px wide: no sideways scrolling, nothing overlapping.
3. WCAG 2.2 AA: contrast, visible focus, labels, alt text, tap targets of 24 px or more.
   For an automated pass, Playwright with axe-core works well.
4. Reduced motion still turns all movement off.
5. Internal links end with a slash (`trailingSlash: 'always'`): `/menu/`, not `/menu`.
6. After the deploy, check the live page.

## Copy

- Plain, warm and short. American English. No em dashes in site copy.
- Do not invent product claims (origins, brands, "vegetarian"); unverified details were removed
  on purpose. Allergen lists must stay accurate; ask Jacob when unsure.

## Working with Jacob

- He often reviews from his phone. Keep updates short: what changed, then what he needs to do.
  No emojis. Avoid dashes and em dashes in anything he will read, present or say.
- He signs in to GitHub, Hostinger, Fillout and Google himself. Never ask for or type his passwords.
  For settings only he can change (Hostinger hPanel, Fillout, the Price List sheet), give him the
  exact clicks.
- Ask before anything that costs money or changes accounts.

## Open items (October 2026)

- Live prices: `site.priceFeed` is empty until Jacob chooses how the Price List is shared with the site.
- No photo yet for the Chocolate Covered Strawberry Box.
- Contact email and phone are blank in `site.ts`, so they are hidden; add them when Jacob confirms.
- Brownie prices: the site uses 4 for $14, 9 for $32, 18 for $63, 36 for $126; an older price
  sheet differs. Confirm with Jacob before changing.
- Delivery windows: the site now uses the form's four windows (Morning 8 to 11, Midday 11 to 2, Afternoon 2 to 5,
  Evening 5 to 8), replacing the older 8:00 AM and 12 to 2 PM copy. Jacob to confirm with Safiyyah.
- How drinks are sold, and the gift add-ons (gift box, ribbon, note), are not settled.
- Optional: Google Search Console with `sitemap-index.xml`, a Google Business Profile, and GA4
  (`analytics.ga4` in `site.ts`).
