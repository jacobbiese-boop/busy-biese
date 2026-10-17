# Photos

The site looks for photos here by name. Each photo has three files:

- `<name>-800.webp` (cards and thumbnails)
- `<name>-1600.webp` (large views)
- `<name>-og.jpg` (1200 x 630 preview when a page is shared)

Run `python3 scripts/import_photos.py` to create them from original photos
(see the top of that script; photos go in public/photos). Until a photo exists, the site shows a
honeycomb placeholder, so nothing breaks.

## Photo names used on the site

| Name | What it should show | Used on |
| --- | --- | --- |
| cinnamon-rolls | A pan of frosted cinnamon rolls | Home hero, Cinnamon Rolls |
| cheesecake-strawberry | Strawberry mini cheesecakes | Home hero, Mini Cheesecakes |
| cheesecake-oreo | Oreo mini cheesecakes | Mini Cheesecakes, gallery |
| cheesecake-biscoff | Biscoff mini cheesecakes | Mini Cheesecakes, gallery |
| packaging | Branded Busy Biese packaging | Several items, About |
| cookie-brown-butter | Brown butter chocolate chip cookie | Home hero, Cookies |
| cookie-box | A box of cookies | Cookies |
| cookie-smores | S'mores cookie close-up | S'mores Cookies |
| smores-batch | A batch of s'mores cookies | S'mores Cookies, gallery |
| brownies-nutella | Nutella brownies | Nutella Brownies |
| cake-pops | Gold-leaf cake pops | Cake Pops |
| baklava-rose | Baklava with rose garnish | Baklava, About |
| baklava-variety | Baklava assortment | Baklava |
| dates-assorted-box | Assorted date gift box | Assorted Date Box, About |
| dates-small-box | Small date boxes | Date boxes |
| dates-small-box-single | One small date box | Small Date Boxes |
| strawberry-box | Chocolate covered strawberry box | Strawberry Box (needs a photo) |
| latte-held | A latte in hand | Salted Maple Latte |
| latte-rolls | Latte with cinnamon rolls | Lattes, matcha |
| cafe-menu-board | Drinks menu board | Honey Bee Latte |
| latte-matcha | Iced latte and matcha | Matcha drinks |
| cold-cut-sub-cut | Cold cut sub, cut | Sandwiches |
| cold-cut-sub-whole | Cold cut sub, whole | Sandwiches |
| slider-tray | Slider gathering tray | Slider Tray, Home, Catering |
| cheese-danishes | Cheese danishes | Home gallery |
| pumpkin-muffins | Pumpkin muffins | Home gallery |
| apple-pie | Apple pie | Home gallery |
| matcha-cookies | Matcha cookies | Home gallery |
