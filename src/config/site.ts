/**
 * Busy Biese site settings.
 *
 * This is the one file to edit for business details: links, contact info,
 * the order form, delivery rules, and the announcement bar. Product details
 * and prices live in src/data/menu.ts.
 */

export interface SiteConfig {
  name: string;
  titleSuffix: string;
  description: string;
  tagline: string;
  established: number;
  location: {
    city: string;
    region: string;
    regionName: string;
    postalCode: string;
    country: string;
    lat: number;
    lng: number;
  };
  serviceAreaTowns: string[];
  links: { orderForm: string; instagram: string; instagramHandle: string; whatsapp: string };
  fillout: { formId: string; checkoutFormId: string };
  priceFeed: { menu: string; addons: string; settings: string };
  contact: { email: string; phone: string };
  announcement: string;
  ordering: { noticeHours: number; largeOrderPieces: number };
  delivery: {
    radiusMiles: number;
    flatFee: number;
    flatFeeUpTo: number;
    percentOver: number;
    /** label + hours make the window name used at checkout and on the calendar, e.g. "Midday (11 to 2)". */
    windows: { label: string; hours: string; time: string }[];
  };
  analytics: { ga4: string };
}

export const site: SiteConfig = {
  name: 'Busy Biese',
  /** Shown in browser tabs and search results after the page name. */
  titleSuffix: 'Busy Biese | Small-Batch Bakery in Glendale Heights, IL',
  description:
    'Busy Biese is a small-batch, made-to-order bakery in Glendale Heights, IL. Cinnamon rolls, mini cheesecakes, cookies, baklava, gift boxes, and halal cold cut trays for pickup or local delivery.',
  tagline: 'Gather. Gift. Connect.',
  established: 2022,

  location: {
    city: 'Glendale Heights',
    region: 'IL',
    regionName: 'Illinois',
    postalCode: '60139',
    country: 'US',
    // Approximate town center, used only for the delivery radius in search data.
    lat: 41.9147,
    lng: -88.0778,
  },

  /** Nearby towns, listed on the delivery pages to help local search. */
  serviceAreaTowns: [
    'Glendale Heights',
    'Carol Stream',
    'Bloomingdale',
    'Glen Ellyn',
    'Lombard',
    'Addison',
    'Wheaton',
    'Roselle',
    'Itasca',
    'Hanover Park',
    'Villa Park',
    'Winfield',
    'Elmhurst',
  ],

  links: {
    /**
     * The order form on its own page (used for the open-in-a-new-tab link).
     * This is the form's public custom link, the same one used on Instagram and
     * in print. If the custom link ever moves in Fillout, update it here too.
     */
    orderForm: 'https://intakeforms.fillout.com/BusyBieseBakery',
    instagram: 'https://instagram.com/busybiesebakery',
    instagramHandle: '@busybiesebakery',
    whatsapp: 'https://chat.whatsapp.com/Fv2PSFwW67e4rbtw3owCVp',
  },

  /**
   * Fillout forms (IDs from Fillout, Share > Embed).
   * formId: "Busy Biese · Order request", for custom cakes, custom treats,
   *   catering and events, embedded on /order/request/. Leave it empty to show
   *   a button that opens the form in a new tab instead.
   * checkoutFormId: "Busy Biese · Checkout", the last step on /order/ (name,
   *   phone, email). The cart travels to it as URL parameters.
   */
  fillout: {
    formId: 'ii1Y1smbD3us',
    checkoutFormId: 'dnMEoUMuvrus',
  },

  /**
   * Live prices: CSV links to the Price List's Menu, Add-ons and Settings tabs.
   * When set, the site reads sizes, prices, flavors, add-ons, delivery fees and
   * time windows from the sheet (cached for 5 minutes per visitor). When empty,
   * or if the sheet cannot be reached, the prices in src/data/menu.ts are used.
   */
  priceFeed: {
    menu: '',
    addons: '',
    settings: '',
  },

  /** Leave blank to hide. Add once the business email or phone is set up. */
  contact: {
    email: '',
    phone: '',
  },

  /** Thin bar at the very top of every page. Set to '' to hide it. */
  announcement: 'Made to order. Please order at least 72 hours ahead.',

  ordering: {
    noticeHours: 72,
    largeOrderPieces: 72,
  },

  delivery: {
    radiusMiles: 15,
    flatFee: 5,
    flatFeeUpTo: 100,
    percentOver: 10,
    // The same windows as the order form and the Price List (Settings, time_windows).
    windows: [
      { label: 'Morning', hours: '8 to 11', time: '8 to 11 AM' },
      { label: 'Midday', hours: '11 to 2', time: '11 AM to 2 PM' },
      { label: 'Afternoon', hours: '2 to 5', time: '2 to 5 PM' },
      { label: 'Evening', hours: '5 to 8', time: '5 to 8 PM' },
    ],
  },

  /** Optional Google Analytics 4 ID, like G-XXXXXXX. Leave blank for none. */
  analytics: {
    ga4: '',
  },
};

export const nav = [
  { label: 'Menu', href: '/menu/' },
  { label: 'Catering', href: '/catering/' },
  { label: 'About', href: '/about/' },
  { label: 'Delivery', href: '/policies/' },
] as const;
