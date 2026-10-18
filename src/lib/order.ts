import { site } from '../config/site';
import type { PriceTier, Product } from '../data/menu';

/** The choices on the first page of the Fillout order form ("Order type"). */
export type OrderType = 'Menu items' | 'Custom cake' | 'Custom treats' | 'Catering' | 'Event booking';

/**
 * The exact text of a product size in the form's "Item 1" list,
 * for example "Cinnamon Rolls · 4 rolls". Defaults to the smallest size.
 */
export function formItem(product: Product, tier?: PriceTier): string {
  const t = tier ?? product.tiers[0];
  return t ? `${product.name} · ${t.label}` : product.name;
}

/**
 * Where an "Order" button goes.
 *
 * With the form embedded on the Order page (site.fillout.formId is set), links
 * go to /order/#form and carry `type` and `item` in the URL. The embed passes
 * them on to Fillout, so once those two URL parameters are switched on in the
 * form's settings, the order type and item arrive already selected. The Order
 * page also shows the picked item above the form either way.
 */
export function orderLink(opts: { item?: string; type?: OrderType } = {}): { href: string; external: boolean } {
  const embedded = Boolean(site.fillout.formId);
  const url = new URL(embedded ? 'https://busybiese.com/order/' : site.links.orderForm);
  if (opts.type) url.searchParams.set('type', opts.type);
  if (opts.item) url.searchParams.set('item', opts.item);
  if (embedded) return { href: `${url.pathname}${url.search}#form`, external: false };
  return { href: url.toString(), external: true };
}

/** The standalone form (new tab), with the same parameters. */
export function formUrl(opts: { item?: string; type?: OrderType } = {}): string {
  const url = new URL(site.links.orderForm);
  if (opts.type) url.searchParams.set('type', opts.type);
  if (opts.item) url.searchParams.set('item', opts.item);
  return url.toString();
}
