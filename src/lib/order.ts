import { site } from '../config/site';

/**
 * Where an "Order" button goes.
 *
 * Products send people straight to the Fillout order form with the item name
 * in the URL (`?item=...`), so the form can pre-fill it. When the form is
 * embedded on the Order page (site.fillout.formId is set) the link goes there
 * instead and the embed inherits the parameter.
 */
export function orderLink(itemName?: string): { href: string; external: boolean } {
  const embedded = Boolean(site.fillout.formId);
  const base = embedded ? 'https://busybiese.com/order/' : site.links.orderForm;
  const url = new URL(base);
  if (itemName) url.searchParams.set('item', itemName);
  if (embedded) return { href: `${url.pathname}${url.search}#form`, external: false };
  return { href: url.toString(), external: true };
}
