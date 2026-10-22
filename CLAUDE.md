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
line, such as "Please refer to busy-biese-v1.1.zip and push the edits". That line is his go-ahead
to push that version, as long as every check below passes.

Each zip holds `VERSION.md` (what changes, in plain words), `manifest.json` (version, base commit,
each changed file with its SHA-256, files to delete, commit message, tag) and `files/` (the changed
files at their repo paths). To apply one:

1. Work in the local clone of this repo (clone it if there is none). Check out `main`,
   `git pull --ff-only`, and make sure the working tree is clean.
2. `git rev-parse HEAD` must equal the manifest's `base_commit`. If `main` has moved on, stop and
   tell Jacob so Cowork can rebuild the version on top of it. Never merge by hand.
3. Copy `files/` over the repo, delete the paths listed in `delete`, and check each file's
   SHA-256 against the manifest (PowerShell: `Get-FileHash -Algorithm SHA256 <file>`).
   `git status` must list exactly the manifest's files.
4. `npm ci`, `npm run build` and the type check must pass.
5. Commit with the manifest's message, tag it with the manifest's tag, and
   `git push origin main --follow-tags`.
6. About a minute later, open https://busybiese.com and confirm the page head shows
   `<meta name="busy-biese-version" content="...">` with the new version, then look over the
   pages the version changed.
7. Tell Jacob in two short lines what went live (version and commit). If any step fails, stop
   before pushing and tell him what failed; never push a version that did not pass.

`src/config/version.ts` holds the version number; every version zip updates it.

## Project map

```
src/config/site.ts      business settings: links, Fillout form, contact, delivery, announcement, GA4
src/config/version.ts   the site version, shown in the page head as busy-biese-version
src/data/menu.ts        every product: names, sizes (tiers), prices, allergens, FAQs, photo names; categories
src/pages/              index, menu/index, menu/[slug] (one page per product), order, catering, about, policies, 404, robots.txt.ts
src/layouts/Base.astro  page shell: SEO tags, icons, header, footer, back to top bee, view transitions
src/components/         Header, Footer, Logo (lockup), Bee (the mark, with motion variants), BeeLoader,
                        ProductList, Gallery (with the full screen photo viewer), Photo, PageHero, Icon
src/lib/order.ts        order links: orderLink(), formItem(), formUrl(), OrderType
src/lib/photos.ts       photo lookup by name; missing photos fall back to a pink placeholder
src/lib/seo.ts          JSON-LD (Bakery, Product, Breadcrumb, FAQ) and the share image
src/lib/format.ts       money and price label helpers
src/styles/global.css   design tokens, base styles, "Bee motion" section
public/                 brand files, favicons, photos, share image, .htaccess
scripts/                make_brand.py (brand assets and favicons), import_photos.py, photos_from_drive.py
docs/PHOTOS.md          photo names and where each is used
```

## Ordering: the contract with the form and the order automation

Orders are requests sent through a Fillout form. An automation (Make scenario "BB-01") reads each
submission, prices it from a Price List spreadsheet, numbers it, logs it and notifies the bakery.
The website only sends people to the form, but its names must line up with both systems.

- **Embed.** `src/pages/order.astro` embeds the form `ii1Y1smbD3us` (`site.fillout.formId`) with
  Fillout's standard embed (`data-fillout-inherit-parameters`, `data-fillout-dynamic-resize`).
  The embed div is written as raw HTML (`set:html`) on purpose: Fillout forwards every other
  `data-*` attribute on that div as a URL parameter, and Astro's scoped `data-astro-cid-*`
  attribute would leak into the form. Keep it that way.
- **Loading.** A bee loader covers the panel until Fillout sets the frame height. If no height
  arrives 1.5 s after the frame loads (a background tab, say), the script gives the frame a
  usable height until Fillout sends the real one. After 12 s without the form,
  `html.form-slow` highlights the "Open it in a new tab" link.
- **Order buttons.** Every order button calls `orderLink({ type, item })`, which links to
  `/order/?type=...&item=...#form`. The Order page shows "You picked ..." and the embed passes
  both values to the form.
- **Item names.** `formItem(product, tier)` builds `"<product name> · <tier label>"`
  (space, middle dot U+00B7, space), e.g. `Cinnamon Rolls · 4 rolls`. That exact text must match
  (1) the options in the form's Item 1 to Item 5 dropdowns and (2) the Item and Size columns of the
  Price List sheet. Renaming a product or a size here means Jacob must rename it in Fillout and
  on the sheet too, so call it out whenever you change a name or a tier label. If they differ,
  requests still arrive but are flagged "Not on the price list".
- **Order types.** `type` must be one of the form's options, exactly:
  `Menu items`, `Custom cake`, `Custom treats`, `Catering`, `Event booking` (`OrderType`).
- **Prices.** `menu.ts` prices and the delivery rules in `site.ts` (flat fee, threshold, percent,
  radius) should match the Price List sheet that the automation uses for suggested totals.
  Price changes come from Jacob; never guess a price.
- **Form link.** `links.orderForm` is the form's public custom link,
  `https://intakeforms.fillout.com/BusyBieseBakery`. The older `/busybiese` link is dead.
- **Still to do in Fillout (Jacob):** Settings > URL parameters, add `type` and `item`, and set
  the defaults of "Order type" to `@type` and "Item 1" to `@item`, so the form preselects them.

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

- Fillout URL parameters (see Ordering).
- No photo yet for the Chocolate Covered Strawberry Box.
- Contact email and phone are blank in `site.ts`, so they are hidden; add them when Jacob confirms.
- Brownie prices: the site uses 4 for $14, 9 for $32, 18 for $63, 36 for $126; an older price
  sheet differs. Confirm with Jacob before changing.
- Delivery windows: the site lists Morning (8:00 AM) and Midday (12 to 2 PM), while the form offers
  Morning (8 to 11), Midday (11 to 2), Afternoon (2 to 5) and Evening (5 to 8). Ask Jacob which is right.
- How drinks are sold, and the gift add-ons (gift box, ribbon, note), are not settled.
- Optional: Google Search Console with `sitemap-index.xml`, a Google Business Profile, and GA4
  (`analytics.ga4` in `site.ts`).
