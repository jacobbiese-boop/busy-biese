/**
 * Build-time side of ordering: the menu from src/data/menu.ts and the rules
 * from src/config/site.ts, shaped like the live Price List. Every page gets
 * this baked in, so ordering works even if the Price List cannot be reached.
 */
import { categories, products } from '../data/menu';
import { site } from '../config/site';
import { firstPhoto, photoUrl } from './photos';
import type { Shop, ShopItem } from './shop-core';

const leadFromText = (text: string): number | undefined => {
  const hours = /(\d+)\s*hours?/i.exec(text);
  if (hours) return Math.ceil(Number(hours[1]) / 24);
  return undefined;
};

export function fallbackShop(): Shop {
  const items: ShopItem[] = products.map((p) => {
    const category = categories.find((c) => c.id === p.category);
    const photo = firstPhoto(p.photos);
    const lead = leadFromText(p.leadTime) ?? Math.ceil(site.ordering.noticeHours / 24);
    return {
      slug: p.slug,
      name: p.name,
      category: p.category,
      categoryName: category?.name ?? p.category,
      tiers: p.tiers.map((t) => ({ label: t.label, price: t.price, qty: t.qty, serves: t.serves, lead })),
      flavors: p.flavors ?? [],
      addOns: (p.addOns ?? []).map((a) => ({ label: a.label, price: a.price, per: /each/i.test(a.note ?? '') ? 'each' : 'order' })),
      short: p.short,
      minimum: p.minimum?.replace(/\. .*$/, ''),
      photo: photo ? photoUrl(photo, 800) : undefined,
      page: true,
    };
  });
  const d = site.delivery;
  return {
    items,
    live: false,
    settings: {
      flatFee: d.flatFee,
      flatFeeUpTo: d.flatFeeUpTo,
      percentOver: d.percentOver,
      radiusMiles: d.radiusMiles,
      minNoticeDays: Math.ceil(site.ordering.noticeHours / 24),
      pickupTown: `${site.location.city}, ${site.location.region}`,
      windows: d.windows.map((w) => `${w.label} (${w.hours})`),
    },
  };
}
