// Astro config for the Busy Biese website.
// SITE_URL is the live domain. Change it here (or set a SITE_URL environment
// variable in Hostinger) once the domain is final. It feeds canonical links,
// the sitemap, and social share previews.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.SITE_URL || 'https://busybiese.com';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
