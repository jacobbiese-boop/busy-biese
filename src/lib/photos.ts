/**
 * Photo lookup at build time.
 *
 * Each photo lives in public/photos as WebP files:
 *   <name>-800.webp    (tiles, cards and thumbnails; always present)
 *   <name>-1400.webp   (large views; optional)
 * If a photo is missing, the site shows a designed placeholder instead,
 * so pages never break while photos are being added.
 */
import fs from 'node:fs';
import path from 'node:path';

const PHOTO_DIR = path.join(process.cwd(), 'public', 'photos');

export const PHOTO_SIZES = [800, 1400] as const;

export function hasPhoto(name: string | undefined): boolean {
  if (!name) return false;
  return fs.existsSync(path.join(PHOTO_DIR, `${name}-800.webp`));
}

export function photoUrl(name: string, width: 800 | 1400 = 800): string {
  const large = path.join(PHOTO_DIR, `${name}-1400.webp`);
  if (width === 1400 && !fs.existsSync(large)) return `/photos/${name}-800.webp`;
  return `/photos/${name}-${width}.webp`;
}

export function photoSrcset(name: string): string {
  const parts = [`/photos/${name}-800.webp 800w`];
  if (fs.existsSync(path.join(PHOTO_DIR, `${name}-1400.webp`))) parts.push(`/photos/${name}-1400.webp 1400w`);
  return parts.join(', ');
}

/** Keep only the photos that exist, in order. */
export function availablePhotos(names: string[]): string[] {
  return names.filter(hasPhoto);
}

export function firstPhoto(names: string[]): string | undefined {
  return names.find(hasPhoto);
}
