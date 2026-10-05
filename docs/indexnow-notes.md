# IndexNow discovery notes

Alana — All Over the Place uses the open IndexNow protocol as a supplemental discovery signal for participating search engines.

- Canonical host: `thealanashow.com`
- Global endpoint: `https://api.indexnow.org/indexnow`
- Ownership verification: public key file at the site root
- Trigger: production pushes to `main`
- Scope: changed canonical HTML pages plus affected discovery hubs
- Google discovery remains handled by the canonical sitemap, video sitemap, robots discovery, and Search Console.

This integration is intentionally independent of analytics, advertising, and visitor tracking.
