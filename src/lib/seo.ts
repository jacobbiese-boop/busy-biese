/**
 * Structured data (schema.org JSON-LD) so search engines understand the
 * business and the menu. Nothing here is visible on the page.
 */
import { site } from '../config/site';
import type { Product } from '../data/menu';
import { getCategory } from '../data/menu';
import { highestPrice, startingPrice } from './format';
import { availablePhotos } from './photos';

const fallback = new URL('https://busybiese.com');

function abs(path: string, base: URL | undefined): string {
  return new URL(path, base ?? fallback).href;
}

export function bakeryJsonLd(base: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    '@id': abs('/#business', base),
    name: site.name,
    url: abs('/', base),
    description: site.description,
    logo: abs('/brand/mark-512.png', base),
    image: abs('/og/busy-biese.png', base),
    slogan: site.tagline,
    foundingDate: String(site.established),
    priceRange: '$$',
    servesCuisine: ['Bakery', 'Desserts', 'Sandwiches', 'Coffee'],
    hasMenu: abs('/menu/', base),
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.city,
      addressRegion: site.location.region,
      postalCode: site.location.postalCode,
      addressCountry: site.location.country,
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: site.location.lat,
        longitude: site.location.lng,
      },
      geoRadius: Math.round(site.delivery.radiusMiles * 1609.34),
    },
    sameAs: [site.links.instagram],
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
  };
}

export function productJsonLd(product: Product, base: URL | undefined) {
  const photos = availablePhotos(product.photos).map((p) => abs(`/photos/${p}-1600.webp`, base));
  const url = abs(`/menu/${product.slug}/`, base);
  const low = startingPrice(product);
  const high = highestPrice(product);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: getCategory(product.category).name,
    url,
    ...(photos.length ? { image: photos } : { image: [abs('/og/busy-biese.png', base)] }),
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: low.toFixed(2),
      highPrice: high.toFixed(2),
      offerCount: product.tiers.length,
      availability: 'https://schema.org/MadeToOrder',
      url,
      seller: { '@id': abs('/#business', base) },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], base: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.path, base),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
