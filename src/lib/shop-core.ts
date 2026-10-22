/**
 * Ordering on the website: the shared, dependency-free core.
 *
 * Used at build time (to bake a fallback menu into every page) and in the
 * browser (live prices, the cart, the checkout). Nothing here imports Node
 * modules or the menu file, so the browser bundle stays small.
 *
 * The contract with the order automation (Make scenario BB-01) is the `cart`
 * URL parameter built by `cartParam()`:
 *   {"v":1,"lines":[{"s":"cake-pops","n":"Cake Pops","z":"24 cake pops","q":2,"f":"Vanilla","a":{"Custom color matching":1}}]}
 * s = Site slug, n = item name, z = size, q = how many, f = flavor, a = add-ons with a count.
 * BB-01 prices every line again from the Price List, so the website total is only an estimate.
 */

export interface ShopTier {
  /** The Size column, e.g. "12 cookies". Must match the Price List word for word. */
  label: string;
  price: number;
  /** Pieces, used for the per-piece price. */
  qty?: number;
  serves?: string;
  /** Lead time in days. */
  lead?: number;
}

export interface ShopAddOn {
  label: string;
  price: number;
  /** "each": the customer picks how many. "order": once per line. */
  per: 'each' | 'order';
}

export interface ShopItem {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  tiers: ShopTier[];
  flavors: string[];
  addOns: ShopAddOn[];
  /** Short line under the name. */
  short?: string;
  minimum?: string;
  /** Note for customers from the Price List. */
  note?: string;
  /** Thumbnail URL. */
  photo?: string;
  /** True when the item has its own page on the site. */
  page: boolean;
}

export interface ShopSettings {
  flatFee: number;
  flatFeeUpTo: number;
  percentOver: number;
  radiusMiles: number;
  minNoticeDays: number;
  pickupTown: string;
  /** Time windows offered at checkout, e.g. "Midday (11 to 2)". "Flexible" is added on top. */
  windows: string[];
}

export interface Shop {
  items: ShopItem[];
  settings: ShopSettings;
  /** True once prices came from the Price List itself. */
  live: boolean;
}

export interface CartLine {
  id: string;
  slug: string;
  name: string;
  size: string;
  qty: number;
  flavor?: string;
  /** Add-on label to count ("order" add-ons use 1). */
  addOns?: Record<string, number>;
}

export interface Cart {
  v: 1;
  lines: CartLine[];
  /** Short order reference, sent along so a repeat send can be spotted. */
  ref: string;
  updated: number;
}

export const MIXED = 'Mixed flavors';
export const FLEXIBLE = 'Flexible';
export const MAX_QTY = 20;

// ---------------------------------------------------------------------------
// Numbers and words
// ---------------------------------------------------------------------------

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** "$15", "$14.50" */
export function money(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Always with cents, for totals: "$114.40", "$15.00" */
export function money2(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

const clean = (v: unknown): string => String(v ?? '').trim();

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

// ---------------------------------------------------------------------------
// CSV (Google Sheets "publish to web" or gviz export)
// ---------------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const t = text.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (quoted) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Rows as objects keyed by the header row (case and spacing ignored). */
export function csvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const col = (row: Record<string, string>, ...names: string[]): string => {
  for (const n of names) {
    const hit = Object.keys(row).find((k) => k === n || k.startsWith(`${n} `) || k.startsWith(`${n}(`));
    if (hit !== undefined && row[hit] !== undefined) return row[hit];
  }
  return '';
};

const isActive = (v: string): boolean => clean(v).toLowerCase() !== 'no';

// ---------------------------------------------------------------------------
// Live prices: the Price List tabs on top of the menu baked into the site
// ---------------------------------------------------------------------------

/** "Morning (8 to 11), Midday (11 to 2)" -> ["Morning (8 to 11)", "Midday (11 to 2)"] */
export function splitWindows(text: string): string[] {
  return (clean(text).match(/[^,(]+(?:\([^)]*\))?/g) ?? [])
    .map((w) => w.trim())
    .filter((w) => w && w.toLowerCase() !== FLEXIBLE.toLowerCase());
}

export interface Feed {
  menu?: string;
  addons?: string;
  settings?: string;
}

/**
 * Rebuilds the shop from the Price List CSVs. Content (descriptions, photos,
 * minimums, which items have a page) comes from the baked-in menu; the sheet
 * decides what can be ordered, the sizes, prices, flavors and add-ons.
 */
export function mergeFeed(base: Shop, feed: Feed): Shop {
  const out: Shop = { items: base.items, settings: { ...base.settings }, live: false };

  if (feed.settings) {
    const rows = csvObjects(feed.settings);
    const get = (key: string) => rows.find((r) => col(r, 'setting').toLowerCase() === key);
    const numOr = (key: string, fallback: number) => {
      const n = toNumber(col(get(key) ?? {}, 'value'));
      return Number.isFinite(n) ? n : fallback;
    };
    const s = out.settings;
    s.flatFee = numOr('delivery_flat_fee', s.flatFee);
    s.flatFeeUpTo = numOr('delivery_flat_fee_up_to', s.flatFeeUpTo);
    s.percentOver = numOr('delivery_percent_over', s.percentOver);
    s.radiusMiles = numOr('delivery_radius_miles', s.radiusMiles);
    s.minNoticeDays = numOr('minimum_notice_days', s.minNoticeDays);
    const town = col(get('pickup_town') ?? {}, 'value');
    if (town) s.pickupTown = town;
    const windows = splitWindows(col(get('time_windows') ?? {}, 'value'));
    if (windows.length) s.windows = windows;
  }

  if (!feed.menu) return out;
  const menuRows = csvObjects(feed.menu);
  if (!menuRows.some((r) => col(r, 'item') && col(r, 'size') && Number.isFinite(toNumber(col(r, 'price'))))) return out;

  const addonRows = feed.addons ? csvObjects(feed.addons) : [];
  const bySlug = new Map(base.items.map((i) => [i.slug, i]));
  const groups = new Map<string, Record<string, string>[]>();
  for (const r of menuRows) {
    const name = col(r, 'item');
    if (!name || !col(r, 'size')) continue;
    const slug = slugify(col(r, 'site slug', 'slug') || name);
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug)!.push(r);
  }

  const items: ShopItem[] = [];
  const seen = new Set<string>();
  const build = (slug: string, rows: Record<string, string>[]): ShopItem | null => {
    const known = bySlug.get(slug);
    const active = rows.filter((r) => isActive(col(r, 'active')) && Number.isFinite(toNumber(col(r, 'price'))));
    if (!active.length) return null;
    const name = col(active[0], 'item');
    const tiers: ShopTier[] = active.map((r) => {
      const label = col(r, 'size');
      const before = known?.tiers.find((t) => t.label.toLowerCase() === label.toLowerCase());
      const pieces = toNumber(col(r, 'pieces'));
      const lead = toNumber(col(r, 'lead time', 'lead'));
      return {
        label,
        price: toNumber(col(r, 'price')),
        qty: Number.isFinite(pieces) && pieces > 0 ? pieces : before?.qty,
        serves: before?.serves,
        lead: Number.isFinite(lead) ? lead : before?.lead,
      };
    });
    const flavors = col(active[0], 'flavors')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    const addOns: ShopAddOn[] = addonRows
      .filter((a) => {
        const owner = col(a, 'item').toLowerCase();
        return (owner === name.toLowerCase() || owner === 'any item') && isActive(col(a, 'active')) && Number.isFinite(toNumber(col(a, 'price')));
      })
      .map((a): ShopAddOn => ({ label: col(a, 'add-on', 'addon'), price: toNumber(col(a, 'price')), per: /each/i.test(col(a, 'per')) ? 'each' : 'order' }))
      .filter((a) => a.label);
    const categoryName = col(active[0], 'category') || known?.categoryName || 'More';
    return {
      slug,
      name,
      category: known?.category ?? slugify(categoryName),
      categoryName: known?.categoryName ?? categoryName,
      tiers,
      flavors,
      addOns,
      short: known?.short,
      minimum: known?.minimum,
      note: col(active[0], 'note for customers', 'note') || undefined,
      photo: known?.photo,
      page: known?.page ?? false,
    };
  };
  // Keep the site's order, then anything new on the sheet in sheet order
  for (const item of base.items) {
    const rows = groups.get(item.slug);
    seen.add(item.slug);
    if (!rows) continue;
    const built = build(item.slug, rows);
    if (built) items.push(built);
  }
  for (const [slug, rows] of groups) {
    if (seen.has(slug)) continue;
    const built = build(slug, rows);
    if (built) items.push(built);
  }
  if (items.length) {
    out.items = items;
    out.live = true;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Prices of lines and carts
// ---------------------------------------------------------------------------

export function findItem(shop: Shop, slug: string): ShopItem | undefined {
  return shop.items.find((i) => i.slug === slug);
}

export function findTier(item: ShopItem | undefined, size: string): ShopTier | undefined {
  return item?.tiers.find((t) => t.label.toLowerCase() === size.toLowerCase());
}

export interface LinePrice {
  unit: number;
  addOns: number;
  total: number;
  /** False when the item or size is no longer on the price list. */
  ok: boolean;
}

export function priceLine(shop: Shop, line: Pick<CartLine, 'slug' | 'size' | 'qty' | 'addOns'>): LinePrice {
  const item = findItem(shop, line.slug);
  const tier = findTier(item, line.size);
  if (!item || !tier) return { unit: 0, addOns: 0, total: 0, ok: false };
  let extras = 0;
  for (const [label, count] of Object.entries(line.addOns ?? {})) {
    const addOn = item.addOns.find((a) => a.label.toLowerCase() === label.toLowerCase());
    if (!addOn || !(count > 0)) continue;
    extras += addOn.per === 'each' ? addOn.price * Math.round(count) : addOn.price;
  }
  const total = round2(tier.price * line.qty + extras);
  return { unit: tier.price, addOns: round2(extras), total, ok: true };
}

export function deliveryFee(subtotal: number, s: ShopSettings): number {
  if (subtotal <= 0) return 0;
  return subtotal <= s.flatFeeUpTo ? s.flatFee : round2((subtotal * s.percentOver) / 100);
}

export interface CartTotals {
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
  /** Lines that can no longer be ordered as they are. */
  missing: CartLine[];
}

export function cartTotals(shop: Shop, cart: Cart, delivery: boolean): CartTotals {
  let subtotal = 0;
  let count = 0;
  const missing: CartLine[] = [];
  for (const line of cart.lines) {
    const p = priceLine(shop, line);
    if (!p.ok) {
      missing.push(line);
      continue;
    }
    subtotal += p.total;
    count += line.qty;
  }
  subtotal = round2(subtotal);
  const fee = delivery ? deliveryFee(subtotal, shop.settings) : 0;
  return { count, subtotal, delivery: fee, total: round2(subtotal + fee), missing };
}

/** The longest lead time in days among the lines (or the shop minimum). */
export function leadDays(shop: Shop, cart: Cart): number {
  let days = NaN;
  for (const line of cart.lines) {
    const lead = findTier(findItem(shop, line.slug), line.size)?.lead;
    if (typeof lead === 'number' && Number.isFinite(lead)) days = Number.isFinite(days) ? Math.max(days, lead) : lead;
  }
  return Number.isFinite(days) ? days : shop.settings.minNoticeDays;
}

// ---------------------------------------------------------------------------
// Cart lines
// ---------------------------------------------------------------------------

/** Two lines are the same when item, size, flavor and add-ons all match. */
export function sameLine(a: Omit<CartLine, 'id' | 'qty'>, b: Omit<CartLine, 'id' | 'qty'>): boolean {
  const norm = (x?: Record<string, number>) =>
    JSON.stringify(
      Object.entries(x ?? {})
        .filter(([, n]) => n > 0)
        .sort(([p], [q]) => p.localeCompare(q)),
    );
  return a.slug === b.slug && a.size === b.size && (a.flavor ?? '') === (b.flavor ?? '') && norm(a.addOns) === norm(b.addOns);
}

/** "24 cake pops, Vanilla, custom color matching, 6 extra sliders" */
export function lineDetails(line: Pick<CartLine, 'size' | 'flavor' | 'addOns'>): string {
  const extras = Object.entries(line.addOns ?? {})
    .filter(([, n]) => n > 0)
    .map(([label, n]) => (n > 1 ? `${n} × ${label.toLowerCase()}` : label.toLowerCase()));
  return [line.size, line.flavor, ...extras].filter(Boolean).join(', ');
}

/** The `cart` URL parameter for the checkout form (see the header comment). */
export function cartParam(cart: Cart): string {
  return JSON.stringify({
    v: 1,
    lines: cart.lines.map((l) => {
      const out: Record<string, unknown> = { s: l.slug, n: l.name, z: l.size, q: l.qty };
      if (l.flavor) out.f = l.flavor;
      const a = Object.fromEntries(Object.entries(l.addOns ?? {}).filter(([, n]) => n > 0));
      if (Object.keys(a).length) out.a = a;
      return out;
    }),
  });
}

/** The `items` URL parameter: what the customer sees in the form's recap. */
export function cartSummary(cart: Cart): string {
  const text = cart.lines.map((l) => `${l.qty} x ${l.name} (${lineDetails(l)})`).join('; ');
  return text.length > 700 ? `${text.slice(0, 690)}…` : text;
}

export function newRef(): string {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = 'W-';
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (const b of bytes) out += abc[b % abc.length];
  return out;
}

// ---------------------------------------------------------------------------
// Dates (local calendar days, no time zones involved)
// ---------------------------------------------------------------------------

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + n, 12);
  return isoDay(date);
}

/** "Tuesday, October 27" */
export function longDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d, 12).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
