/**
 * Ordering in the browser: live prices, the cart, the "add to order" sheet,
 * the little confirmation toast and the cart bar. Loaded on every page by
 * Base.astro. The checkout itself lives in checkout.ts on the Order page.
 */
import {
  type Cart,
  type CartLine,
  type Feed,
  type Shop,
  type ShopItem,
  type ShopTier,
  MAX_QTY,
  MIXED,
  cartTotals,
  findItem,
  findTier,
  lineDetails,
  mergeFeed,
  money,
  money2,
  newRef,
  plural,
  priceLine,
  sameLine,
} from '../lib/shop-core';

const CART_KEY = 'bb-cart-v1';
const FEED_KEY = 'bb-feed-v1';
const FEED_FRESH_MS = 5 * 60 * 1000;
const CART_MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Links. The cart bar's link to the Order page tells where the site's root is,
// so photos and links drawn here also work when the site sits in a folder
// (the preview in Cowork) and not only at busybiese.com/.
// ---------------------------------------------------------------------------

const orderHref = document.querySelector<HTMLAnchorElement>('.cartbar-link')?.href ?? '';
const rootMatch = orderHref.match(/^(.*\/)order\/(?:index\.html)?$/);
const siteRoot = rootMatch ? rootMatch[1] : '/';
/** The Order page. */
export const orderPage = rootMatch ? orderHref : '/order/';
/** A root path such as "/photos/x-800.webp", resolved against the site's root. */
export function siteUrl(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? siteRoot + path.slice(1) : path;
}

// ---------------------------------------------------------------------------
// Storage that never throws (private windows, blocked storage)
// ---------------------------------------------------------------------------

export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage is off: the cart lasts as long as the page */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  },
};

/** The line bee, for the pink placeholder when an item has no photo yet. */
export const BEE_SVG =
  '<svg class="bee" width="26" height="26" viewBox="-25.5 6.5 190 190" aria-hidden="true" focusable="false"><g transform="rotate(-32 100 120)" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M92 90C74 60 20 34 12 60C8 86 66 96 92 90Z"/><path d="M108 90C126 60 180 34 188 60C192 86 134 96 108 90Z"/><path d="M100 96C120 96 124 126 121 150C118 176 108 190 100 196C92 190 82 176 79 150C76 126 80 96 100 96Z"/><path d="M78.2 131.2Q100 136.8 121.8 131.2M79.8 155.6Q100 160.4 120.2 155.6M88 181.1Q100 182.9 112 181.1" stroke-width="5" stroke-linecap="butt"/><circle cx="100" cy="74" r="9"/><path d="M96 64Q93 57 88 54"/><path d="M104 64Q107 57 112 54"/></g></svg>';

const esc = (t: unknown): string =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// ---------------------------------------------------------------------------
// Shop data: baked-in menu first, then the live Price List
// ---------------------------------------------------------------------------

const dataEl = document.getElementById('bb-shop');
const base: Shop = dataEl ? (JSON.parse(dataEl.textContent || '{}') as Shop) : { items: [], settings: {} as Shop['settings'], live: false };
const feedUrls: Feed = dataEl?.dataset.feed ? (JSON.parse(dataEl.dataset.feed) as Feed) : {};
let shop: Shop = base;

type Listener = () => void;
const listeners = new Set<Listener>();
export function onShopChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = () => listeners.forEach((fn) => fn());

export const getShop = (): Shop => shop;

function applyFeed(feed: Feed) {
  shop = mergeFeed(base, feed);
  emit();
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadFeed() {
  let cached: { at: number; feed: Feed } | null = null;
  try {
    cached = JSON.parse(storage.get(FEED_KEY) || 'null');
  } catch {
    cached = null;
  }
  if (cached?.feed) applyFeed(cached.feed);
  if (!feedUrls.menu) return;
  if (cached && Date.now() - cached.at < FEED_FRESH_MS) return;
  try {
    const [menu, addons, settings] = await Promise.all([
      fetchText(feedUrls.menu),
      feedUrls.addons ? fetchText(feedUrls.addons).catch(() => '') : Promise.resolve(''),
      feedUrls.settings ? fetchText(feedUrls.settings).catch(() => '') : Promise.resolve(''),
    ]);
    const feed: Feed = { menu, addons, settings };
    if (!mergeFeed(base, feed).live) return; // not a price list: keep what we have
    storage.set(FEED_KEY, JSON.stringify({ at: Date.now(), feed }));
    applyFeed(feed);
  } catch {
    /* offline or blocked: the baked-in menu keeps working */
  }
}

// ---------------------------------------------------------------------------
// The cart
// ---------------------------------------------------------------------------

const emptyCart = (): Cart => ({ v: 1, lines: [], ref: newRef(), updated: Date.now() });
let cart: Cart = readCart();

function readCart(): Cart {
  try {
    const c = JSON.parse(storage.get(CART_KEY) || 'null') as Cart | null;
    if (!c || c.v !== 1 || !Array.isArray(c.lines)) return emptyCart();
    if (Date.now() - (c.updated || 0) > CART_MAX_AGE_MS) return emptyCart();
    c.lines = c.lines
      .filter((l) => l && typeof l.slug === 'string' && typeof l.size === 'string')
      .map((l) => ({ ...l, qty: Math.min(MAX_QTY, Math.max(1, Math.round(Number(l.qty) || 1))) }));
    if (!c.ref) c.ref = newRef();
    return c;
  } catch {
    return emptyCart();
  }
}

function saveCart() {
  cart.updated = Date.now();
  storage.set(CART_KEY, JSON.stringify(cart));
  emit();
}

window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) {
    cart = readCart();
    emit();
  }
});

const lineId = () => Math.random().toString(36).slice(2, 10);

export const cartApi = {
  get: (): Cart => cart,
  add(line: Omit<CartLine, 'id'>, replaceId?: string): CartLine {
    if (replaceId) cart.lines = cart.lines.filter((l) => l.id !== replaceId);
    const same = cart.lines.find((l) => sameLine(l, line));
    let result: CartLine;
    if (same) {
      same.qty = Math.min(MAX_QTY, same.qty + line.qty);
      result = same;
    } else {
      result = { ...line, id: lineId() };
      cart.lines.push(result);
    }
    saveCart();
    return result;
  },
  setQty(id: string, qty: number) {
    const line = cart.lines.find((l) => l.id === id);
    if (!line) return;
    line.qty = Math.min(MAX_QTY, Math.max(1, Math.round(qty)));
    saveCart();
  },
  remove(id: string) {
    cart.lines = cart.lines.filter((l) => l.id !== id);
    saveCart();
  },
  /** After a successful send: empty cart and a fresh reference. */
  clear() {
    cart = emptyCart();
    saveCart();
  },
};

// ---------------------------------------------------------------------------
// Prices on the page follow the live Price List
// ---------------------------------------------------------------------------

function priceFrom(item: ShopItem): string {
  const prices = item.tiers.map((t) => t.price);
  const low = Math.min(...prices);
  return new Set(prices).size > 1 ? `From ${money(low)}` : money(low);
}

function perPiece(t: ShopTier): string {
  return t.qty && t.qty > 1 ? `$${(t.price / t.qty).toFixed(2)}` : '';
}

function updatePrices() {
  document.querySelectorAll<HTMLElement>('[data-price-from]').forEach((el) => {
    const item = findItem(shop, el.dataset.priceFrom || '');
    if (item) el.textContent = priceFrom(item);
    else if (shop.live) el.textContent = 'Not available right now';
  });
  document.querySelectorAll<HTMLElement>('[data-tier]').forEach((row) => {
    const [slug, label] = (row.dataset.tier || '').split('|');
    const tier = findTier(findItem(shop, slug), label);
    if (!tier) {
      if (shop.live) row.hidden = true;
      return;
    }
    row.hidden = false;
    const price = row.querySelector<HTMLElement>('[data-tier-price]');
    if (price) price.textContent = money(tier.price);
    const each = row.querySelector<HTMLElement>('[data-tier-each]');
    if (each) each.textContent = perPiece(tier);
  });
  document.querySelectorAll<HTMLElement>('[data-add]').forEach((el) => {
    const item = findItem(shop, el.dataset.add || '');
    const size = el.dataset.size;
    const off = shop.live && (!item || (size ? !findTier(item, size) : false));
    el.toggleAttribute('data-unavailable', off);
    if (el instanceof HTMLButtonElement) el.disabled = off;
    else el.setAttribute('aria-disabled', String(off));
  });
}

function updateCounts() {
  const totals = cartTotals(shop, cart, false);
  const count = cart.lines.reduce((n, l) => n + l.qty, 0);
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
  document.querySelectorAll<HTMLElement>('[data-cart-link]').forEach((el) => {
    if (count) el.setAttribute('aria-label', `${el.dataset.cartLink}, ${plural(count, 'item')} in your order`);
    else el.removeAttribute('aria-label');
  });
  const bar = document.querySelector<HTMLElement>('[data-cartbar]');
  if (bar) {
    const show = count > 0 && !document.querySelector('[data-checkout]');
    bar.hidden = !show;
    document.documentElement.classList.toggle('has-cartbar', show);
    const text = bar.querySelector<HTMLElement>('[data-cartbar-text]');
    if (text) text.textContent = `${plural(count, 'item')} · about ${money2(totals.subtotal)}`;
  }
}

// ---------------------------------------------------------------------------
// The "add to order" sheet
// ---------------------------------------------------------------------------

interface SheetState {
  item: ShopItem;
  tier: ShopTier;
  qty: number;
  flavor: string;
  addOns: Record<string, number>;
  editId?: string;
}

const dialog = document.querySelector<HTMLDialogElement>('[data-osheet]');
let state: SheetState | null = null;
let opener: HTMLElement | null = null;

function sheetTotal(s: SheetState): number {
  return priceLine(shop, { slug: s.item.slug, size: s.tier.label, qty: s.qty, addOns: s.addOns }).total;
}

function stepper(name: string, value: number, min: number, max: number, label: string): string {
  return `<div class="stepper" data-stepper="${esc(name)}">
    <button type="button" class="stepper-btn" data-step="-1" aria-label="${esc(`Fewer: ${label}`)}"${value <= min ? ' disabled' : ''}>&minus;</button>
    <input type="number" inputmode="numeric" min="${min}" max="${max}" value="${value}" aria-label="${esc(label)}" data-step-input>
    <button type="button" class="stepper-btn" data-step="1" aria-label="${esc(`More: ${label}`)}"${value >= max ? ' disabled' : ''}>+</button>
  </div>`;
}

function renderSheet() {
  if (!dialog || !state) return;
  const s = state;
  const { item } = s;
  const flavors = item.flavors.length > 1 ? [...item.flavors, MIXED] : item.flavors;
  const sizes = item.tiers
    .map((t, i) => {
      const each = perPiece(t);
      const sub = [t.serves ? `Serves ${t.serves}` : '', each ? `${each} each` : ''].filter(Boolean).join(' · ');
      return `<label class="opt opt-size">
        <input type="radio" name="size" value="${i}"${t.label === s.tier.label ? ' checked' : ''}>
        <span class="opt-main"><span class="opt-label">${esc(t.label)}</span>${sub ? `<span class="opt-sub">${esc(sub)}</span>` : ''}</span>
        <span class="opt-price">${money(t.price)}</span>
      </label>`;
    })
    .join('');
  const flavorHtml = flavors.length
    ? `<fieldset class="osheet-group" data-flavors>
        <legend>Flavor</legend>
        <div class="chips-choice">${flavors
          .map((f) => `<label class="chip-opt"><input type="radio" name="flavor" value="${esc(f)}"${s.flavor === f ? ' checked' : ''}><span>${esc(f)}</span></label>`)
          .join('')}</div>
        ${flavors.includes(MIXED) ? '<p class="osheet-hint">Mixing? Tell us the split in the notes at checkout.</p>' : ''}
      </fieldset>`
    : '';
  const addOnHtml = item.addOns.length
    ? `<fieldset class="osheet-group">
        <legend>Add-ons</legend>
        ${item.addOns
          .map((a) =>
            a.per === 'each'
              ? `<div class="opt opt-addon"><span class="opt-main"><span class="opt-label">${esc(a.label)}</span><span class="opt-sub">${money(a.price)} each</span></span>${stepper(
                  `addon:${a.label}`,
                  s.addOns[a.label] || 0,
                  0,
                  99,
                  a.label,
                )}</div>`
              : `<label class="opt opt-addon"><input type="checkbox" name="addon" value="${esc(a.label)}"${s.addOns[a.label] ? ' checked' : ''}><span class="opt-main"><span class="opt-label">${esc(
                  a.label,
                )}</span></span><span class="opt-price">+${money(a.price)}</span></label>`,
          )
          .join('')}
      </fieldset>`
    : '';
  const notes = [item.minimum, item.note].filter(Boolean).map((n) => `<p class="osheet-note">${esc(n)}</p>`).join('');
  dialog.innerHTML = `<form method="dialog" class="osheet-form" novalidate>
    <header class="osheet-head">
      ${item.photo ? `<img class="osheet-photo" src="${esc(siteUrl(item.photo))}" alt="" width="64" height="64" loading="lazy">` : `<span class="osheet-photo photo-ph">${BEE_SVG}</span>`}
      <div class="osheet-titles">
        <p class="osheet-cat">${esc(item.categoryName)}</p>
        <h2 id="osheet-title">${esc(item.name)}</h2>
      </div>
      <button type="button" class="osheet-close" data-osheet-close aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </header>
    <div class="osheet-body">
      ${item.short ? `<p class="osheet-short">${esc(item.short)}</p>` : ''}
      <fieldset class="osheet-group"><legend>Size</legend><div class="opts">${sizes}</div></fieldset>
      ${flavorHtml}
      ${addOnHtml}
      <div class="osheet-qty">
        <span class="osheet-qty-label" id="osheet-qty-label">How many of this size</span>
        ${stepper('qty', s.qty, 1, MAX_QTY, 'How many of this size')}
      </div>
      ${notes}
    </div>
    <footer class="osheet-foot">
      <p class="osheet-msg" role="alert" data-osheet-msg></p>
      <button type="submit" class="btn osheet-add" data-osheet-add>${s.editId ? 'Update' : 'Add to order'} · <span data-osheet-total>${money2(sheetTotal(s))}</span></button>
      <p class="osheet-fine">An estimate. We confirm the final price with you.</p>
    </footer>
  </form>`;
  dialog.setAttribute('aria-labelledby', 'osheet-title');
}

function refreshSheetTotals() {
  if (!dialog || !state) return;
  const total = dialog.querySelector<HTMLElement>('[data-osheet-total]');
  if (total) total.textContent = money2(sheetTotal(state));
  dialog.querySelectorAll<HTMLElement>('[data-stepper]').forEach((box) => {
    const input = box.querySelector<HTMLInputElement>('[data-step-input]');
    if (!input) return;
    const v = Number(input.value);
    const min = Number(input.min);
    const max = Number(input.max);
    box.querySelector<HTMLButtonElement>('[data-step="-1"]')!.disabled = v <= min;
    box.querySelector<HTMLButtonElement>('[data-step="1"]')!.disabled = v >= max;
  });
}

function readStepper(box: HTMLElement): number {
  const input = box.querySelector<HTMLInputElement>('[data-step-input]')!;
  const min = Number(input.min);
  const max = Number(input.max);
  let v = Math.round(Number(input.value));
  if (!Number.isFinite(v)) v = min;
  v = Math.min(max, Math.max(min, v));
  input.value = String(v);
  return v;
}

function setFromStepper(box: HTMLElement) {
  if (!state) return;
  const name = box.dataset.stepper || '';
  const v = readStepper(box);
  if (name === 'qty') state.qty = v;
  else if (name.startsWith('addon:')) state.addOns[name.slice(6)] = v;
  refreshSheetTotals();
}

export function openSheet(slug: string, opts: { size?: string; line?: CartLine; from?: HTMLElement | null } = {}) {
  const item = findItem(shop, slug);
  if (!dialog || !item) return false;
  const tier = (opts.line && findTier(item, opts.line.size)) || (opts.size && findTier(item, opts.size)) || item.tiers[0];
  state = {
    item,
    tier,
    qty: opts.line?.qty ?? 1,
    flavor: opts.line?.flavor ?? (item.flavors.length === 1 ? item.flavors[0] : ''),
    addOns: { ...(opts.line?.addOns ?? {}) },
    editId: opts.line?.id,
  };
  opener = opts.from ?? (document.activeElement as HTMLElement | null);
  renderSheet();
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  document.documentElement.classList.add('sheet-open');
  const first = dialog.querySelector<HTMLInputElement>('input[name="size"]:checked');
  first?.focus({ preventScroll: true });
  return true;
}

function closeSheet() {
  if (!dialog) return;
  if (dialog.open) {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }
}

if (dialog) {
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('sheet-open');
    state = null;
    opener?.focus({ preventScroll: true });
    opener = null;
  });
  // A click on the backdrop closes the sheet
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeSheet();
  });
  dialog.addEventListener('change', (e) => {
    if (!state) return;
    const t = e.target as HTMLInputElement;
    if (t.name === 'size') {
      state.tier = state.item.tiers[Number(t.value)] ?? state.tier;
      refreshSheetTotals();
    } else if (t.name === 'flavor') {
      state.flavor = t.value;
      const msg = dialog.querySelector<HTMLElement>('[data-osheet-msg]');
      if (msg) msg.textContent = '';
    } else if (t.name === 'addon') {
      state.addOns[t.value] = t.checked ? 1 : 0;
      refreshSheetTotals();
    } else if (t.matches('[data-step-input]')) {
      const box = t.closest<HTMLElement>('[data-stepper]');
      if (box) setFromStepper(box);
    }
  });
  dialog.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.matches('[data-step-input]') && t.value !== '') {
      const box = t.closest<HTMLElement>('[data-stepper]');
      if (box) setFromStepper(box);
    }
  });
  dialog.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-osheet-close]')) {
      closeSheet();
      return;
    }
    const step = t.closest<HTMLButtonElement>('[data-step]');
    if (step) {
      const box = step.closest<HTMLElement>('[data-stepper]')!;
      const input = box.querySelector<HTMLInputElement>('[data-step-input]')!;
      input.value = String(Number(input.value) + Number(step.dataset.step));
      setFromStepper(box);
    }
  });
  dialog.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state) return;
    const s = state;
    const msg = dialog.querySelector<HTMLElement>('[data-osheet-msg]');
    if (s.item.flavors.length > 1 && !s.flavor) {
      if (msg) msg.textContent = 'Pick a flavor first.';
      dialog.querySelector<HTMLInputElement>('input[name="flavor"]')?.focus();
      return;
    }
    const addOns = Object.fromEntries(Object.entries(s.addOns).filter(([, n]) => n > 0));
    const line = cartApi.add(
      { slug: s.item.slug, name: s.item.name, size: s.tier.label, qty: s.qty, flavor: s.flavor || undefined, addOns: Object.keys(addOns).length ? addOns : undefined },
      s.editId,
    );
    const editing = Boolean(s.editId);
    closeSheet();
    if (!editing) toast(`Added ${s.qty > 1 ? `${s.qty} × ` : ''}${s.item.name} (${lineDetails(line)}).`);
  });
}

// ---------------------------------------------------------------------------
// Toast and cart bar
// ---------------------------------------------------------------------------

const toastEl = document.querySelector<HTMLElement>('[data-toast]');
let toastTimer = 0;
export function toast(text: string, withLink = true) {
  if (!toastEl) return;
  const onCheckout = Boolean(document.querySelector('[data-checkout]'));
  toastEl.innerHTML = `<span>${esc(text)}</span>${withLink && !onCheckout ? `<a href="${esc(orderPage)}">Review your order</a>` : ''}`;
  toastEl.hidden = false;
  toastEl.classList.remove('is-shown');
  void toastEl.offsetWidth;
  toastEl.classList.add('is-shown');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.classList.remove('is-shown');
    window.setTimeout(() => {
      if (!toastEl.classList.contains('is-shown')) toastEl.hidden = true;
    }, 400);
  }, 5000);
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

document.addEventListener('click', (e) => {
  const trigger = (e.target as HTMLElement).closest<HTMLElement>('[data-add]');
  if (!trigger || trigger.hasAttribute('data-unavailable')) return;
  if (e.defaultPrevented || (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0))) return;
  const opened = openSheet(trigger.dataset.add || '', { size: trigger.dataset.size, from: trigger });
  if (opened) e.preventDefault();
});

onShopChange(() => {
  updatePrices();
  updateCounts();
});
updatePrices();
updateCounts();
document.documentElement.classList.add('shop-ready');
void loadFeed();
