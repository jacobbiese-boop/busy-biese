import type { PriceTier, Product } from '../data/menu';

/** $15, $14.50 */
export function money(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Per-item price with cents, e.g. $3.75. */
export function each(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function startingPrice(p: Product): number {
  return Math.min(...p.tiers.map((t) => t.price));
}

export function highestPrice(p: Product): number {
  return Math.max(...p.tiers.map((t) => t.price));
}

/** "From $15" when there are several sizes, "$25" when there is one. */
export function priceLabel(p: Product): string {
  const prices = new Set(p.tiers.map((t) => t.price));
  return prices.size > 1 ? `From ${money(startingPrice(p))}` : money(startingPrice(p));
}

export function perItem(t: PriceTier): number | undefined {
  return t.qty && t.qty > 1 ? t.price / t.qty : undefined;
}

/** Best (lowest) per-item price across tiers, if the product is sold by count. */
export function bestPerItem(p: Product): number | undefined {
  const values = p.tiers.map(perItem).filter((v): v is number => typeof v === 'number');
  return values.length ? Math.min(...values) : undefined;
}

/** Words that keep their capital letter inside a sentence. */
const PROPER = /^(Nutella|Miss Vickie|Medjool|Greek|Oreo|Biscoff|\d)/;

/** "Brioche dough, cinnamon, brown sugar" from a list of capitalized items. */
export function sentenceList(items: string[]): string {
  return items
    .map((item, i) => (i === 0 || PROPER.test(item) ? item : item.charAt(0).toLowerCase() + item.slice(1)))
    .join(', ');
}
