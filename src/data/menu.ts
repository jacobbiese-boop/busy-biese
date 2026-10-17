/**
 * The Busy Biese menu.
 *
 * Every product, price, and detail on the site comes from this file.
 * To change a price, edit the `tiers` for that product and redeploy.
 * Photos are matched by the names in `photos` (see docs/PHOTOS.md).
 */

export type CategoryId =
  | 'pastries'
  | 'cookies'
  | 'cheesecakes'
  | 'gift-boxes'
  | 'sandwiches'
  | 'drinks';

export type IconName = 'roll' | 'cookie' | 'slice' | 'gift' | 'sandwich' | 'cup';

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  icon: IconName;
  note?: string;
}

export interface PriceTier {
  /** What the customer sees, e.g. "12 cookies" or "Iced, 16 oz". */
  label: string;
  price: number;
  /** Item count, used to show the price per item. */
  qty?: number;
  /** Optional serving size, e.g. "6 to 8 people". */
  serves?: string;
}

export interface AddOn {
  label: string;
  price: number;
  note?: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Product {
  slug: string;
  name: string;
  category: CategoryId;
  /** Shown in "Most loved" on the home page. */
  featured?: boolean;
  badges?: string[];
  short: string;
  description: string;
  highlight: string;
  greatFor: string[];
  tiers: PriceTier[];
  unit?: string;
  minimum?: string;
  flavors?: string[];
  addOns?: AddOn[];
  notes?: string[];
  leadTime: string;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  storage?: string;
  freshness?: string;
  faq: Faq[];
  /** Photo names in display order. Missing photos are skipped automatically. */
  photos: string[];
}

export const categories: Category[] = [
  {
    id: 'pastries',
    name: 'Pastries & Rolls',
    blurb: 'Cinnamon rolls by the pan and baklava by the box.',
    icon: 'roll',
  },
  {
    id: 'cookies',
    name: 'Cookies & Brownies',
    blurb: 'Big bakery-style cookies and fudgy Nutella brownies.',
    icon: 'cookie',
  },
  {
    id: 'cheesecakes',
    name: 'Cheesecakes & Cake Pops',
    blurb: 'Mini cheesecakes and gold-leaf cake pops for dessert tables.',
    icon: 'slice',
  },
  {
    id: 'gift-boxes',
    name: 'Gift Boxes',
    blurb: 'Stuffed date boxes and chocolate strawberries, ready to give.',
    icon: 'gift',
  },
  {
    id: 'sandwiches',
    name: 'Sandwiches & Trays',
    blurb: 'Halal cold cut subs, lunch boxes, and slider trays.',
    icon: 'sandwich',
  },
  {
    id: 'drinks',
    name: 'Drinks',
    blurb: 'Lattes and iced matcha in 16 oz cups.',
    icon: 'cup',
    note: 'Drinks are made to order. Ask about availability when you order.',
  },
];

export const products: Product[] = [
  // Pastries & Rolls
  {
    slug: 'cinnamon-rolls',
    name: 'Cinnamon Rolls',
    category: 'pastries',
    featured: true,
    badges: ['Favorite'],
    short:
      'Soft brioche swirled with cinnamon and brown sugar, finished with our cream cheese frosting.',
    description:
      'Our cinnamon rolls start with a rich brioche dough, rolled with layers of cinnamon and brown sugar and baked until golden. We frost each pan with house-made cream cheese frosting while the rolls are still warm, so it melts into every swirl.',
    highlight:
      'Brioche dough makes these richer and more tender than a standard cinnamon roll. They pull apart in soft, buttery layers.',
    greatFor: ['Brunch', 'Holiday mornings', 'Office treats', 'Housewarming gifts'],
    unit: 'roll',
    tiers: [
      { label: '4 rolls', qty: 4, price: 15 },
      { label: '8 rolls', qty: 8, price: 28 },
      { label: '16 rolls', qty: 16, price: 52 },
      { label: '24 rolls', qty: 24, price: 72 },
    ],
    minimum: 'Minimum 4 rolls. Sold by the pan.',
    notes: ['Need 32 or more? Send a catering inquiry for a custom quote.'],
    leadTime: '72 hours',
    ingredients: ['Brioche dough', 'Cinnamon', 'Brown sugar', 'Butter', 'Cream cheese frosting', 'Vanilla', 'Eggs', 'Milk'],
    allergens: ['Dairy', 'Eggs', 'Wheat'],
    dietary: ['Vegetarian'],
    storage:
      'Best the day you receive them. Keep covered at room temperature for up to 2 days, or refrigerate and rewarm.',
    freshness: 'Best on the day you receive them. Keeps 2 days covered.',
    faq: [
      {
        q: 'Can I rewarm them?',
        a: 'Yes. Warm them in a 300°F oven for 5 to 7 minutes, or microwave one roll for about 20 seconds.',
      },
      { q: 'Can I get the frosting on the side?', a: 'Yes. Just note it on your order form.' },
      {
        q: 'Do you make larger batches for events?',
        a: 'For 32 rolls or more, send a catering inquiry and we will put together custom pricing and timing.',
      },
    ],
    photos: ['cinnamon-rolls', 'cinnamon-rolls-trays'],
  },
  {
    slug: 'house-baklava',
    name: 'House Baklava Selection',
    category: 'pastries',
    featured: true,
    short:
      'Buttery layers of phyllo with pistachios and walnuts, finished with a rose and orange blossom syrup.',
    description:
      'Our baklava layers crisp, buttery phyllo with a generous filling of pistachios and walnuts. Each tray is finished with a house-made syrup scented with rose water and orange blossom, so every piece is sweet, fragrant, and balanced.',
    highlight:
      'A pistachio and walnut blend and a lightly floral syrup make this a little more refined than the baklava you are used to.',
    greatFor: ['Gifting', 'Celebrations', 'Eid', 'Dessert tables'],
    unit: 'piece',
    tiers: [
      { label: '12 piece box', qty: 12, price: 28 },
      { label: '24 piece box', qty: 24, price: 52 },
      { label: '48 piece tray', qty: 48, price: 95 },
    ],
    leadTime: '72 hours',
    ingredients: ['Phyllo dough', 'Pistachios', 'Walnuts', 'Butter', 'Sugar', 'Rose water', 'Orange blossom water', 'Lemon juice'],
    allergens: ['Dairy', 'Wheat', 'Tree nuts (pistachios, walnuts)'],
    dietary: ['Vegetarian'],
    storage:
      'Keep covered at room temperature. Please skip the fridge, since the cold softens the phyllo.',
    freshness: 'Stays fresh for up to 10 days at room temperature.',
    faq: [
      { q: 'How should I store it?', a: 'Covered, at room temperature. Skip the fridge so the layers stay crisp.' },
      { q: 'How long does it keep?', a: 'Up to 10 days when stored covered at room temperature.' },
      {
        q: 'Is it very sweet?',
        a: 'Our syrup is lighter than most, with citrus and floral notes that keep it balanced.',
      },
    ],
    photos: ['baklava-rose'],
  },

  // Cookies & Brownies
  {
    slug: 'brown-butter-chocolate-chip-cookies',
    name: 'Brown Butter Chocolate Chip Cookies',
    category: 'cookies',
    featured: true,
    badges: ['Signature'],
    short:
      'Our signature cookie. Nutty brown butter dough, dark and milk chocolate, and a sprinkle of flaky sea salt.',
    description:
      'Our signature cookie starts with brown butter, cooked until it turns toasty and nutty, then folded into a soft dough with dark and milk chocolate. A pinch of flaky sea salt on top gives every cookie crisp edges, a chewy center, and a sweet and salty finish.',
    highlight:
      'Brown butter adds a deep, toasty flavor you will not find in an ordinary chocolate chip cookie.',
    greatFor: ['Gifting', 'Cookie boxes', 'Office treats', 'Just because'],
    unit: 'cookie',
    tiers: [
      { label: '6 cookies', qty: 6, price: 21 },
      { label: '12 cookies', qty: 12, price: 38 },
      { label: '24 cookies', qty: 24, price: 70 },
      { label: '48 cookies', qty: 48, price: 132 },
    ],
    minimum: 'Minimum 6 cookies',
    leadTime: '72 hours',
    ingredients: ['Brown butter', 'Flour', 'Chocolate', 'Brown sugar', 'Eggs', 'Vanilla', 'Flaky sea salt', 'Baking soda'],
    allergens: ['Dairy', 'Eggs', 'Wheat'],
    dietary: ['Vegetarian'],
    storage:
      'Airtight container at room temperature for up to 5 days. They also freeze well for up to 2 months.',
    freshness: 'Best within 5 days.',
    faq: [
      { q: 'How big are the cookies?', a: 'About 3.5 inches across. A generous, bakery-style size.' },
      {
        q: 'Can I mix flavors?',
        a: "Yes. You can combine Brown Butter Chocolate Chip and S'mores cookies in the same order.",
      },
      { q: 'Can they be frozen?', a: 'Yes, in an airtight container for up to 2 months.' },
    ],
    photos: ['cookie-brown-butter'],
  },
  {
    slug: 'smores-chocolate-chunk-cookies',
    name: "S'mores Chocolate Chunk Cookies",
    category: 'cookies',
    short: 'Chocolate chunks, graham cracker pieces, and gooey marshmallow in one big cookie.',
    description:
      "Packed with chocolate chunks, crushed graham crackers, and pockets of melty marshmallow, this one tastes like a campfire s'more. Crisp at the edges and soft in the middle.",
    highlight:
      'Real marshmallow and chocolate chunks, plus graham cracker for a toasty crunch that ties it all together.',
    greatFor: ['Birthdays', 'Themed parties', 'Sharing'],
    unit: 'cookie',
    tiers: [
      { label: '6 cookies', qty: 6, price: 24 },
      { label: '12 cookies', qty: 12, price: 44 },
      { label: '24 cookies', qty: 24, price: 82 },
      { label: '48 cookies', qty: 48, price: 156 },
    ],
    minimum: 'Minimum 6 cookies',
    leadTime: '72 hours',
    ingredients: ['Flour', 'Butter', 'Chocolate chunks', 'Graham cracker pieces', 'Marshmallows', 'Brown sugar', 'Eggs', 'Vanilla'],
    allergens: ['Dairy', 'Eggs', 'Wheat'],
    dietary: [],
    storage: 'Airtight container at room temperature for up to 4 days.',
    freshness: 'Best within 4 days.',
    faq: [
      { q: 'Are the marshmallows melted?', a: 'Partly. They bake into soft, stretchy pockets.' },
      {
        q: 'Can I mix these with other cookies?',
        a: 'Yes. Mix them with Brown Butter Chocolate Chip cookies in the same order.',
      },
    ],
    photos: ['cookie-smores', 'smores-batch'],
  },
  {
    slug: 'nutella-brownies',
    name: 'Nutella Brownies',
    category: 'cookies',
    short: 'Rich, fudgy brownies with ribbons of Nutella swirled all the way through.',
    description:
      'Dense, fudgy brownies with a deep chocolate base and generous swirls of Nutella in every layer. Crackly on top and gooey in the middle.',
    highlight:
      'The Nutella runs through the whole brownie, not just the top, so every bite has that hazelnut chocolate flavor.',
    greatFor: ['Dessert trays', 'Thank-you gifts', 'Office snacks'],
    unit: 'brownie',
    tiers: [
      { label: '4 brownies', qty: 4, price: 14 },
      { label: '9 piece tray', qty: 9, price: 32 },
      { label: '18 brownies', qty: 18, price: 63 },
      { label: '36 brownies', qty: 36, price: 126 },
    ],
    minimum: 'Minimum 4 brownies',
    notes: ['Single brownies ($5) are available for pickup only.'],
    leadTime: '72 hours',
    ingredients: ['Chocolate', 'Nutella hazelnut spread', 'Butter', 'Sugar', 'Eggs', 'Flour', 'Cocoa powder', 'Vanilla'],
    allergens: ['Dairy', 'Eggs', 'Wheat', 'Soy', 'Tree nuts (hazelnuts)'],
    dietary: ['Vegetarian'],
    storage:
      'Airtight container at room temperature for up to 4 days, or refrigerate for up to a week.',
    freshness: 'Best within 4 days at room temperature.',
    faq: [
      { q: 'Can I order just one?', a: 'Single brownies are $5 for pickup only. Delivery orders start at 4.' },
      {
        q: 'Are they very sweet?',
        a: 'They are rich and fudgy rather than sugary. The dark chocolate keeps the Nutella in check.',
      },
    ],
    photos: ['brownies-nutella'],
  },

  // Cheesecakes & Cake Pops
  {
    slug: 'mini-cheesecakes',
    name: 'Mini Cheesecakes',
    category: 'cheesecakes',
    featured: true,
    badges: ['Favorite'],
    short:
      'Bite-size cheesecakes on a buttery graham crust, made in small batches. Mix and match flavors.',
    description:
      'Our mini cheesecakes have a velvety cream cheese filling on a buttery graham cracker crust, finished by hand with a topping to match each flavor: strawberry compote, Biscoff, or Oreo crumble.',
    highlight:
      'Each one is individually portioned and finished by hand, so they look as good on a dessert table as they taste.',
    greatFor: ['Dessert tables', 'Bridal and baby showers', 'Corporate events', 'Gifting'],
    unit: 'cheesecake',
    tiers: [
      { label: '3 pack', qty: 3, price: 18 },
      { label: '6 pack', qty: 6, price: 34 },
      { label: '12 pack', qty: 12, price: 64 },
      { label: '24 pack', qty: 24, price: 120 },
    ],
    minimum: 'Minimum 3 cheesecakes',
    flavors: ['Classic Strawberry', 'Biscoff', 'Oreo'],
    notes: ['Ordering 48 or more? Request a catering quote.'],
    leadTime: '72 hours',
    ingredients: ['Cream cheese', 'Graham cracker crust', 'Sugar', 'Eggs', 'Vanilla', 'Greek yogurt', 'Butter', 'Flavor toppings'],
    allergens: ['Dairy', 'Eggs', 'Wheat', 'Soy'],
    dietary: ['Vegetarian'],
    storage: 'Keep refrigerated. Take them out 10 minutes before serving for the best flavor.',
    freshness: 'Best within 3 days.',
    faq: [
      { q: 'Can I mix flavors?', a: 'Yes, in any pack size. Note your flavor split on the order form.' },
      {
        q: 'Can I order for the same day?',
        a: 'We need 72 hours notice for every order, so same-day orders are not available.',
      },
    ],
    photos: ['cheesecake-oreo', 'cheesecake-strawberry', 'cheesecake-biscoff'],
  },
  {
    slug: 'cake-pops',
    name: 'Cake Pops',
    category: 'cheesecakes',
    short:
      'Moist cake dipped in white chocolate and finished with edible gold leaf. Custom colors available.',
    description:
      'Each cake pop has a moist cake center blended with frosting, dipped by hand in white chocolate, and finished with a touch of edible gold leaf. We can match the colors to your event.',
    highlight:
      'The gold leaf finish dresses up any dessert table, and color matching ties them to your theme.',
    greatFor: ['Wedding favors', 'Showers', 'Birthdays', 'Corporate events'],
    unit: 'cake pop',
    tiers: [
      { label: '12 cake pops', qty: 12, price: 36 },
      { label: '24 cake pops', qty: 24, price: 66 },
      { label: '48 cake pops', qty: 48, price: 120 },
    ],
    minimum: 'Minimum 12 cake pops',
    flavors: ['Chocolate', 'Vanilla'],
    addOns: [{ label: 'Custom color matching', price: 10, note: 'per order' }],
    leadTime: '72 hours',
    ingredients: ['Cake (chocolate or vanilla)', 'Frosting', 'White chocolate coating', 'Edible gold leaf'],
    allergens: ['Dairy', 'Eggs', 'Wheat', 'Soy'],
    dietary: ['Vegetarian'],
    storage: 'Keep refrigerated. Take them out 15 minutes before serving.',
    freshness: 'Best within 5 days.',
    faq: [
      {
        q: 'Can you match my colors?',
        a: 'Yes. Custom color matching is $10 per order. Add your colors on the order form.',
      },
      {
        q: 'What flavors do you offer?',
        a: 'Chocolate or vanilla cake, both dipped in white chocolate with gold leaf.',
      },
    ],
    photos: ['cake-pops'],
  },

  // Gift Boxes
  {
    slug: 'assorted-date-box',
    name: 'Assorted Date Box',
    category: 'gift-boxes',
    badges: ['Seasonal'],
    short:
      'A windowed gift box of stuffed Medjool dates in an assortment of fillings, tied with a gold ribbon.',
    description:
      'Our Assorted Date Box is filled with Medjool dates, stuffed and finished in a mix of styles: chocolate dipped, cream filled, pistachio dusted, and more. It comes in a windowed box, tied with a gold ribbon and sealed with a Ramadan Mubarak sticker.',
    highlight: 'Every date is filled and decorated by hand, so each piece in the box is a little different.',
    greatFor: ['Ramadan', 'Eid', 'Gifting', 'Hosting'],
    tiers: [{ label: 'Assorted box', price: 25 }],
    notes: ['Custom fillings are available on orders of 15 pieces or more.'],
    leadTime: '72 hours',
    ingredients: ['Medjool dates', 'Roasted almond butter', 'Cream cheese', 'Crushed pistachios', 'Dark chocolate', 'Coconut flakes'],
    allergens: ['Dairy', 'Tree nuts (almonds, pistachios)'],
    dietary: ['Vegetarian'],
    storage: 'Keep refrigerated. Take out 15 minutes before serving.',
    freshness: 'Best within 5 days.',
    faq: [
      {
        q: 'Can I choose the fillings?',
        a: 'Custom filling selections are available for orders of 15 pieces or more.',
      },
      { q: 'Is it ready to gift?', a: 'Yes. It comes boxed, ribboned, and ready to give.' },
    ],
    photos: ['dates-assorted-box'],
  },
  {
    slug: 'small-date-boxes',
    name: 'Small Date Boxes',
    category: 'gift-boxes',
    badges: ['Seasonal'],
    short: 'Petite gift boxes with 2 or 4 stuffed dates, tied with a gold ribbon. Lovely as favors.',
    description:
      'The same stuffed dates as our assorted box in a smaller size, made for favors and little thank-yous. Each windowed box is tied with a gold ribbon and sealed with a Ramadan Mubarak sticker.',
    highlight: 'A small, beautiful gift that is easy to give to a whole group.',
    greatFor: ['Ramadan', 'Eid favors', 'Party favors', 'Thank-yous'],
    tiers: [
      { label: '2 date box', price: 3 },
      { label: '4 date box', price: 5 },
    ],
    leadTime: '72 hours',
    ingredients: ['Medjool dates', 'Roasted almond butter', 'Cream cheese', 'Crushed pistachios', 'Dark chocolate', 'Coconut flakes'],
    allergens: ['Dairy', 'Tree nuts (almonds, pistachios)'],
    dietary: ['Vegetarian'],
    storage: 'Keep refrigerated. Take out 15 minutes before serving.',
    freshness: 'Best within 5 days.',
    faq: [
      {
        q: 'Can I choose the fillings?',
        a: 'Note your preferences on the order form and we will do our best to match them.',
      },
    ],
    photos: ['dates-small-box'],
  },
  {
    slug: 'chocolate-covered-strawberry-box',
    name: 'Chocolate Covered Strawberry Box',
    category: 'gift-boxes',
    badges: ['Seasonal'],
    short:
      'Fresh strawberries dipped in dark and white chocolate, decorated by hand and boxed to give.',
    description:
      'Ripe strawberries dipped in dark and white chocolate, then finished one by one with crushed pistachios, gold dust, coconut, or a contrasting drizzle. Arranged in a gift-ready box.',
    highlight: 'Every berry is decorated by hand, so the box feels like a small luxury.',
    greatFor: ['Celebrations', 'Bridal events', 'Thank-yous', 'Date night'],
    unit: 'strawberry',
    tiers: [
      { label: '6 piece box', qty: 6, price: 28 },
      { label: '12 piece box', qty: 12, price: 52 },
      { label: '24 piece box', qty: 24, price: 96 },
    ],
    notes: ['Custom toppings are available on boxes of 12 or more.'],
    leadTime: '48 hours',
    ingredients: ['Fresh strawberries', 'Dark chocolate', 'White chocolate', 'Crushed pistachios', 'Coconut', 'Edible gold dust'],
    allergens: ['Dairy', 'Soy', 'Tree nuts (pistachios)'],
    dietary: ['Vegetarian'],
    storage: 'Keep refrigerated and enjoy within 24 to 48 hours.',
    freshness: 'Best within 48 hours.',
    faq: [
      {
        q: 'How far ahead should I order?',
        a: 'Strawberry boxes need 48 hours notice. They are best the day you receive them.',
      },
      { q: 'Are they available year-round?', a: 'Yes, though berry size can vary with the season.' },
    ],
    photos: ['strawberry-box'],
  },

  // Sandwiches & Trays
  {
    slug: 'cold-cut-slider-tray',
    name: 'Cold Cut Slider Gathering Tray',
    category: 'sandwiches',
    featured: true,
    badges: ['Halal', 'New'],
    short:
      'Mini cold cut subs served slider-style. Trays of 12, 24, or 48 for meetings and parties.',
    description:
      'All the flavor of our Cold Cut Classic in a bite-size, crowd-friendly format. Mini subs on slider rolls with halal cold cuts and fresh toppings, arranged on a tray that is easy to serve and easy to grab.',
    highlight: 'Sliders are easier to serve and easier to eat, so everyone can grab a couple.',
    greatFor: ['Meetings', 'Parties', 'Community events', 'Catering'],
    unit: 'slider',
    tiers: [
      { label: '12 sliders', qty: 12, price: 48, serves: '6 to 8 people' },
      { label: '24 sliders', qty: 24, price: 90, serves: '12 to 15 people' },
      { label: '48 sliders', qty: 48, price: 168, serves: '25 or more people' },
    ],
    addOns: [
      { label: 'Extra slider', price: 4, note: 'each' },
      { label: 'Extra chips', price: 2 },
      { label: 'Extra pickle', price: 1 },
    ],
    leadTime: '72 hours. One week is recommended for 48 sliders.',
    ingredients: ['Halal cold cuts', 'Slider rolls', 'Fresh toppings'],
    allergens: ['Wheat'],
    dietary: ['Halal'],
    faq: [
      {
        q: 'How many sliders do I need?',
        a: '12 sliders serves about 6 to 8 people, 24 serves 12 to 15, and 48 serves 25 or more.',
      },
      { q: 'Do you deliver trays?', a: 'Yes, within 15 miles of Glendale Heights.' },
      {
        q: 'How far ahead should I order?',
        a: '72 hours for most trays. For 48 sliders, one week is recommended.',
      },
      { q: 'Can I change the toppings?', a: 'Yes. Note any toppings to add or leave off on your order form.' },
    ],
    photos: ['slider-tray', 'cold-cut-sub-cut'],
  },
  {
    slug: 'cold-cut-classic-meal',
    name: 'Cold Cut Classic Meal',
    category: 'sandwiches',
    badges: ['Halal'],
    short:
      "A deli-style sub stacked with halal cold cuts, with Miss Vickie's chips and a pickle spear.",
    description:
      "Our classic meal is a generously stacked deli-style sub made with halal-certified cold cuts and fresh toppings. Every order comes with a bag of Miss Vickie's chips and a crisp pickle spear on the side.",
    highlight: 'A complete, satisfying lunch built with halal meats and good ingredients.',
    greatFor: ['Lunch on the go', 'Office meals', 'Family pickup'],
    tiers: [{ label: 'Meal: sub, chips, and pickle', price: 14.5 }],
    leadTime: '72 hours preferred, especially for 5 or more.',
    ingredients: ['Halal cold cuts', 'Sub roll', 'Fresh toppings', "Miss Vickie's chips", 'Pickle spear'],
    allergens: ['Wheat'],
    dietary: ['Halal'],
    faq: [
      { q: 'Is the meat halal?', a: 'Yes. All of our cold cuts are 100% halal-certified.' },
      { q: 'Can I customize the toppings?', a: 'Yes. Note any changes on your order form.' },
      {
        q: 'What chip flavors come with it?',
        a: "Miss Vickie's in assorted flavors, based on what we have on hand.",
      },
    ],
    photos: ['cold-cut-sub-cut', 'cold-cut-sub-whole'],
  },
  {
    slug: 'cold-cut-boutique-box',
    name: 'Cold Cut Boutique Box',
    category: 'sandwiches',
    badges: ['Halal'],
    short: 'Five classic meals packed together for small groups. Works out to $12 a meal.',
    description:
      "The Boutique Box packs five Cold Cut Classic meals together: five subs, five bags of Miss Vickie's chips, and five pickle spears. An easy way to feed a small team or family without a full catering order.",
    highlight: 'At $12 a meal instead of $14.50, it is real value without cutting corners.',
    greatFor: ['Office lunches', 'Team meetings', 'Family gatherings'],
    unit: 'meal',
    tiers: [{ label: '5 meals', qty: 5, price: 60 }],
    addOns: [
      { label: 'Extra chips', price: 2 },
      { label: 'Extra pickle', price: 1 },
    ],
    leadTime: '72 hours',
    ingredients: ['5 Cold Cut Classic subs', "5 bags of Miss Vickie's chips", '5 pickle spears'],
    allergens: ['Wheat'],
    dietary: ['Halal'],
    faq: [
      {
        q: 'What is in each meal?',
        a: "A Cold Cut Classic sub, a bag of Miss Vickie's chips, and a pickle spear.",
      },
      { q: 'Can I customize each sub?', a: 'Yes. List your changes for each sub on the order form.' },
    ],
    photos: ['cold-cut-sub-whole', 'cold-cut-sub-cut'],
  },

  // Drinks
  {
    slug: 'salted-maple-latte',
    name: 'Salted Maple Latte',
    category: 'drinks',
    short: 'Espresso and creamy milk with a sweet, salted maple flavor. Hot or iced.',
    description:
      'Rich espresso and creamy milk with a smooth salted maple flavor. Warm and cozy without being heavy. Served hot or iced in a 16 oz cup.',
    highlight: 'Salted maple hits the sweet and savory balance that keeps people coming back.',
    greatFor: ['Morning ritual', 'Afternoon pick-me-up', 'With a cinnamon roll'],
    tiers: [
      { label: 'Hot, 16 oz', price: 7 },
      { label: 'Iced, 16 oz', price: 7 },
    ],
    leadTime: 'Ask about availability',
    ingredients: ['Espresso', 'Milk', 'Salted maple flavor'],
    allergens: ['Dairy'],
    dietary: ['Contains caffeine'],
    faq: [
      { q: 'Hot or iced?', a: 'Either one, same price.' },
      { q: 'What size is it?', a: 'All of our drinks are 16 oz.' },
    ],
    photos: ['latte-held', 'latte-rolls'],
  },
  {
    slug: 'honey-bee-latte',
    name: 'Honey Bee Latte',
    category: 'drinks',
    short: 'A smooth espresso latte sweetened with real honey. Hot or iced.',
    description:
      'Espresso, milk, and honey. A clean, smooth latte with natural sweetness and a gentle floral note. Served hot or iced in a 16 oz cup.',
    highlight: 'Honey brings a natural sweetness and depth that syrup cannot match.',
    greatFor: ['Everyday coffee', 'A lighter sweetness'],
    tiers: [
      { label: 'Hot, 16 oz', price: 7 },
      { label: 'Iced, 16 oz', price: 7 },
    ],
    leadTime: 'Ask about availability',
    ingredients: ['Espresso', 'Milk', 'Honey'],
    allergens: ['Dairy'],
    dietary: ['Contains caffeine'],
    faq: [
      { q: 'Is it very sweet?', a: 'It is lightly sweetened with honey, so it is gentle rather than sugary.' },
      { q: 'What size is it?', a: 'All of our drinks are 16 oz.' },
    ],
    photos: ['cafe-menu-board', 'latte-held'],
  },
  {
    slug: 'salted-maple-matcha',
    name: 'Salted Maple Matcha',
    category: 'drinks',
    badges: ['Iced only'],
    short: 'Premium matcha and milk with a sweet, salted maple flavor. Served iced.',
    description:
      'Earthy matcha and creamy milk with a sweet and salty maple flavor, poured over ice. The matcha grounds the sweetness and the salt keeps it from tipping into dessert.',
    highlight: 'A combination that works even better than it sounds.',
    greatFor: ['Afternoon refresh', 'Something different'],
    tiers: [{ label: 'Iced, 16 oz', price: 7 }],
    leadTime: 'Ask about availability',
    ingredients: ['Matcha', 'Milk', 'Salted maple flavor'],
    allergens: ['Dairy'],
    dietary: ['Contains caffeine'],
    faq: [
      { q: 'Can I get it hot?', a: 'Our matcha drinks are served iced only.' },
      {
        q: 'Does matcha have caffeine?',
        a: 'Yes. Matcha has caffeine, though it tends to feel steadier than coffee.',
      },
    ],
    photos: ['latte-matcha', 'cafe-menu-board'],
  },
  {
    slug: 'banana-bread-matcha',
    name: 'Banana Bread Matcha',
    category: 'drinks',
    badges: ['Iced only'],
    short: 'Matcha and milk with warm banana bread notes. Served iced.',
    description:
      'Matcha and creamy milk with cozy banana bread flavor, served over ice. Familiar and unexpected at the same time.',
    highlight: 'Warm banana bread against bright, grassy matcha surprises people every time.',
    greatFor: ['Afternoon treat', 'Something different'],
    tiers: [{ label: 'Iced, 16 oz', price: 7 }],
    leadTime: 'Ask about availability',
    ingredients: ['Matcha', 'Milk', 'Banana bread flavor'],
    allergens: ['Dairy'],
    dietary: ['Contains caffeine'],
    faq: [
      { q: 'Can I get it hot?', a: 'Our matcha drinks are served iced only.' },
      { q: 'How sweet is it?', a: 'Lightly sweet, with most of the flavor coming from the banana bread notes.' },
    ],
    photos: ['latte-matcha', 'latte-rolls'],
  },
];

/**
 * The photo gallery: real pictures of things we have made, shown without
 * captions. `alt` is read by screen readers and search engines only.
 * Order matters: the first few appear on the home page.
 */
export const gallery: { photo: string; alt: string }[] = [
  { photo: 'cinnamon-rolls', alt: 'A pan of cinnamon rolls with cream cheese frosting' },
  { photo: 'cookie-smores', alt: "A s'mores chocolate chunk cookie with a toasted marshmallow center" },
  { photo: 'baklava-rose', alt: 'A tray of baklava topped with pistachio and rose petals' },
  { photo: 'cake-new-chapter', alt: 'A white buttercream cake with ribbon bows and a New Chapter Begins topper' },
  { photo: 'dessert-box', alt: 'A box of mini dessert cups: mango, strawberry and rose cream' },
  { photo: 'cookie-brown-butter', alt: 'Brown butter chocolate chip cookies cooling on a rack' },
  { photo: 'dates-small-box', alt: 'Small gift boxes of chocolate covered dates tied with gold cord' },
  { photo: 'muffins', alt: 'Cream cheese filled muffins in black tulip liners' },
  { photo: 'catering-trays', alt: 'Two catering trays of piped cream dessert with pistachio and rose petals' },
  { photo: 'cake-bride', alt: 'A Bride to Be cake with pink buttercream roses, boxed' },
  { photo: 'market-table', alt: 'A market table of packaged cheesecakes, brownies and cookies' },
  { photo: 'smores-batch', alt: "A batch of s'mores cookies on a cooling rack" },
  { photo: 'cinnamon-rolls-trays', alt: 'Three trays of freshly baked cinnamon rolls' },
  { photo: 'muffins-window', alt: 'Muffins cooling by a sunny window' },
  { photo: 'cake-bride-table', alt: 'A Bride to Be cake on a party table' },
  { photo: 'cake-new-chapter-2', alt: 'A celebration cake with a New Chapter Begins topper' },
  { photo: 'dessert-jars', alt: 'Dessert jars with a swirl of pink frosting and sprinkles' },
  { photo: 'market-table-sign', alt: 'The Busy Biese table at a market, with the menu sign' },
];

export function getCategory(id: CategoryId): Category {
  const found = categories.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category: ${id}`);
  return found;
}

export function productsIn(id: CategoryId): Product[] {
  return products.filter((p) => p.category === id);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function relatedProducts(product: Product, limit = 3): Product[] {
  const sameCategory = products.filter((p) => p.category === product.category && p.slug !== product.slug);
  const others = products.filter((p) => p.category !== product.category && p.featured);
  return [...sameCategory, ...others].slice(0, limit);
}
