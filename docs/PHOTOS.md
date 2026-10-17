# Photos

The site looks for photos in `public/photos` by name. Each photo has one or two files:

- `<name>-800.webp` (tiles, cards and thumbnails; always)
- `<name>-1400.webp` (large views; optional)

Run `python3 scripts/import_photos.py --file photo.HEIC --name some-name` to add one
(see the top of that script). Until a photo exists, the site shows a dusty pink panel with
a small bee, so nothing breaks.

The current set came from the shared Google Drive folder through the
"Import photos from Google Drive" workflow (Actions tab, Run workflow). It reads the Drive
file IDs from the `DRIVE_PHOTO_IDS` repository secret, rebuilds every file listed below,
checks each one against the reviewed version (size and a visual fingerprint) and commits
the result. If a check fails, nothing is committed. See `scripts/photos_from_drive.py`.

Photos are shown without captions. The `alt` text in `gallery` (src/data/menu.ts) is read
only by screen readers and search engines.

## Photos on the site today

| Name | What it shows | Used on |
| --- | --- | --- |
| cinnamon-rolls | Frosted cinnamon rolls in a baking dish | Gallery, Cinnamon Rolls |
| cinnamon-rolls-trays | Three trays of baked rolls | Gallery, Cinnamon Rolls |
| cookie-brown-butter | Chocolate chip cookies on a rack with flaky salt | Gallery, Brown Butter Cookies |
| cookie-smores | S'mores cookie held up, marshmallow center | Gallery, S'mores Cookies |
| smores-batch | S'mores cookies on a rack | Gallery, S'mores Cookies |
| baklava-rose | Baklava tray with pistachio and rose | Gallery, Baklava |
| dates-small-box | Small date gift boxes with gold cord | Gallery, Small Date Boxes |
| cheesecake-oreo | Oreo cheesecakes in pink tins (crop of the market table) | Mini Cheesecakes |
| market-table | Event table of packaged desserts | Gallery, Catering |
| market-table-sign | Event table with the menu sign | Gallery |
| muffins, muffins-window | Cream cheese muffins | Gallery |
| catering-trays | Two large dessert trays | Home, Catering, Gallery |
| dessert-box | Box of mini dessert cups | Home, Catering, Gallery |
| cake-new-chapter, cake-new-chapter-2 | Celebration cake with ribbon bows | About, Gallery |
| cake-bride, cake-bride-table | Bride to Be cake | Gallery |
| dessert-jars | Dessert jars with pink frosting | Gallery |

## Still needed (placeholder shown until added)

Nutella brownies, strawberry mini cheesecakes, Biscoff mini cheesecakes, cake pops,
assorted date box, chocolate covered strawberry box, slider tray, cold cut subs (cut and
whole), lattes and matcha drinks. Add each with the name listed in `scripts/photo-map.json`.
