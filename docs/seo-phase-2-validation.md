# SEO Phase 2 validation

This checklist accompanies PR #22 and is intentionally non-visual.

## Preview checks

- Homepage renders unchanged.
- Guest detail pages render unchanged.
- Episode detail pages render unchanged.
- Canonical URLs use `https://thealanashow.com`.
- Detail pages expose `index,follow,max-image-preview:large` robots metadata.
- Open Graph and X/Twitter metadata use the canonical detail URL and relevant image.
- Guest detail pages expose truthful `Person` structured data only from verified catalog identities.
- Episode detail pages expose `BreadcrumbList`; `VideoObject` is emitted only when verified live metadata supplies the required publication date.
- Sitemap remains the production 63-URL crawl set from PR #21.

## Production guardrails

- No host-level `www` redirect is introduced in repository configuration.
- No visual redesign is included in this phase.
- Do not merge until a successful Vercel preview is reviewed.
