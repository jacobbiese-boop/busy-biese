import { site } from '../config/site';
import type { PriceTier, Product } from '../data/menu';

/** The choices on the first page of the Fillout request form ("Order type"). */
export type OrderType = 'Menu items' | 'Custom cake' | 'Custom treats' | 'Catering' | 'Event booking';

/** The custom request types, in the order they are offered. */
export const customTypes: { type: Exclude<OrderType, 'Menu items'>; title: string; text: string }[] = [
  { type: 'Custom cake', title: 'Custom cake', text: 'A celebration cake designed with you, quoted by size and design.' },
  { type: 'Custom treats', title: 'Custom treats', text: 'Cookies, cupcakes or cake pops matched to your theme.' },
  { type: 'Catering', title: 'Catering', text: 'Dessert tables and lunch trays for groups.' },
  { type: 'Event booking', title: 'Event booking', text: 'A treat table or drink bar at your event.' },
];

/**
 * The exact text of a product size in the request form's "Item 1" list,
 * for example "Cinnamon Rolls · 4 rolls". Defaults to the smallest size.
 */
export function formItem(product: Product, tier?: PriceTier): string {
  const t = tier ?? product.tiers[0];
  return t ? `${product.name} · ${t.label}` : product.name;
}

/**
 * Where an "order" link goes.
 *
 * Menu items are ordered on /order/ (pick items, then send the order through the
 * checkout form). Custom cakes, custom treats, catering and event bookings go to
 * the request form on /order/request/, with `type` passed on to Fillout.
 */
export function orderLink(opts: { item?: string; type?: OrderType } = {}): { href: string; external: boolean } {
  if (!opts.type || opts.type === 'Menu items') return { href: '/order/', external: false };
  if (site.fillout.formId) {
    const params = new URLSearchParams({ type: opts.type });
    if (opts.item) params.set('item', opts.item);
    return { href: `/order/request/?${params.toString()}#form`, external: false };
  }
  return { href: formUrl(opts), external: true };
}

/** The standalone request form (new tab), with the same parameters. */
export function formUrl(opts: { item?: string; type?: OrderType } = {}): string {
  const url = new URL(site.links.orderForm);
  if (opts.type) url.searchParams.set('type', opts.type);
  if (opts.item) url.searchParams.set('item', opts.item);
  return url.toString();
}
