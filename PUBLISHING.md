# Publishing a New Conversation

The public YouTube feed updates automatically, but a verified internal episode page gives The Alana Show stronger internal linking, guest relationships, social metadata, crawler-visible content, sitemap coverage, and search authority.

This repository includes a zero-dependency publishing helper so that enrichment does not require a CMS or routine developer billing.

## Before you begin

1. Publish the finished conversation on the verified The Alana Show YouTube channel.
2. Copy the 11-character YouTube video ID from the published video URL.
3. Confirm the guest name(s) and permanent episode slug.
4. Work on a feature branch or other non-production branch. Do not run the publishing helper directly on an unreviewed production working tree.
5. Make sure the Git working tree is clean. The helper intentionally refuses to run with unrelated local changes.

## Create the intake file

Copy:

`content/conversation.example.json`

to:

`content/conversation.json`

The working intake file is ignored by Git, so it will not become part of the public repository.

Fill in:

- `videoId` — required 11-character YouTube video ID.
- `slug` — permanent lowercase episode URL slug, such as `jane-doe-community-leadership`.
- `guests` — one or more verified guest names. Reuse the existing guest slug when the guest has appeared before.
- `title` — a specific, searchable editorial title. The verified YouTube title may supply it, but the publisher rejects generic “Conversation with…” fallbacks.
- `deck` — a concise, specific editorial summary. It may be omitted only when verified YouTube metadata is available; otherwise provide an explicit substantive deck of at least 60 characters.
- `description` — a factual episode overview. It may be omitted only when verified YouTube metadata is available; otherwise provide an explicit substantive description of at least 80 characters. Generic “watch this conversation” boilerplate is rejected.
- `publishedAt` — required from either the verified feed or an ISO-8601 intake fallback.
- `durationSeconds` — required from either the verified feed or a positive-number intake fallback.
- `thumbnail` — optional absolute HTTPS thumbnail fallback. Normally the helper receives this from the verified YouTube feed.

For multiple guests, add another object to the `guests` array.

## Verified YouTube enrichment

Before generating the episode shell, the helper makes a best-effort read from:

`https://thealanashow.com/api/youtube`

That endpoint is the site's existing verified-channel feed. When the supplied video ID is present, the helper can reuse accurate public metadata already maintained by YouTube:

- title;
- description;
- publication timestamp;
- thumbnail;
- duration;
- current view count.

User-supplied intake values remain editorial overrides. If the network/feed is temporarily unavailable, the helper requires intake values for the editorial title, substantive deck and description, publication timestamp, and duration so a thin or generic permanent record cannot be published.

Every generated permanent episode HTML page includes static `VideoObject` structured data with the required title, thumbnail, upload date, and duration. It also includes `SeekToAction`, allowing Google-compatible timestamp URLs such as:

`/episodes/example?t=120`

The live episode page honors that URL by starting the embedded conversation at 2:00.

## Preview without changing files

Run:

`npm run publish:conversation -- --dry-run`

The helper validates the intake and reports what it would publish without modifying the repository. The summary also reports whether verified YouTube metadata was found and whether static `VideoObject` markup will be generated.

## Publish the repository changes

Run:

`npm run publish:conversation`

The safe publishing command will:

1. Refuse to start unless the Git working tree is clean.
2. Reject duplicate YouTube IDs and episode slugs.
3. Attempt to enrich the page from the verified YouTube feed.
4. Add the episode to the verified editorial catalog.
5. Add the episode to existing guest relationships.
6. Create new verified guest records when needed.
7. Generate the permanent episode page with canonical/social metadata and static search schema when the required video metadata is available.
8. Generate new guest detail pages when needed.
9. Backfill crawler-visible episode and guest content.
10. Refresh the `/episodes`, `/guests`, and `/topics` canonical CollectionPage/ItemList graphs from the verified catalog.
11. Refresh `sitemap.xml` with canonical URLs and trustworthy `lastmod` dates derived from actual page changes or Git history.
12. Refresh `video-sitemap.xml` from the permanent episode pages so Google's specialized video discovery stays synchronized with the verified conversation archive.
13. Run the full repository quality suite, including canonical, video-sitemap, security, trust, accessibility, distribution, and publishing protections.
14. Restore the clean starting state if a post-publish synchronization or quality step fails.
15. Print a post-publish distribution brief with the permanent episode URL, guest profile URLs, YouTube link, exact website-link line, media resources, and a practical backlink/share checklist.

## Post-publish distribution brief

After all repository changes and quality checks succeed, the publishing command prints a zero-dependency distribution brief generated from the newly published catalog entry.

The brief treats the permanent website page as the owned canonical destination and includes:

- the canonical episode URL;
- the YouTube watch URL;
- each related permanent guest profile URL;
- an exact line to add near the top of the YouTube description;
- the permanent link to send to guests and organizations;
- a reminder to seek relevant official-site/newsroom/resource backlinks when appropriate;
- the `/press` resource page for approved show/host assets;
- the episode page's native **Share conversation** control, including timestamp-specific sharing.

This is intentionally a checklist, not automated outreach. The publisher does not send messages, alter YouTube descriptions, make social posts, or contact guests on its own.

The distribution principle is simple: external platforms distribute the conversation; the permanent The Alana Show page owns the long-term context, guest relationship, topic links, search authority, and reference URL.

## Canonical sitemap freshness

Google ignores sitemap `priority` and `changefreq` values. The site therefore uses a simpler canonical sitemap focused on permanent URLs and accurate `lastmod` dates.

The command:

`npm run sync:sitemap`

rebuilds canonical sitemap metadata from the site's actual static pages. For committed pages it uses the latest Git modification date for that page. For a page being meaningfully changed in the current clean publishing transaction, it uses the current UTC date. It never invents a future date.

The normal conversation publishing command runs this automatically. Use `npm run sync:sitemap` directly only when a meaningful static-page update is made outside the conversation publisher.

## Google video sitemap

The site also maintains a specialized video sitemap at:

`https://thealanashow.com/video-sitemap.xml`

The command:

`npm run sync:video-sitemap`

rebuilds that file from the verified episode catalog and the metadata already published in each permanent episode's static HTML. It uses:

- the canonical The Alana Show episode URL as the video landing page;
- the page's existing title and description;
- the page's preferred YouTube thumbnail;
- the verified privacy-enhanced `youtube-nocookie.com` player URL;
- the matching canonical sitemap `lastmod` date.

This avoids maintaining a second hand-written metadata source. The video sitemap is specialized discovery infrastructure; `sitemap.xml` remains the canonical URL inventory for the full site.

`robots.txt` advertises both sitemap files. The normal conversation publishing command refreshes the video sitemap automatically after the canonical sitemap is updated and before quality checks run.

## Discovery-hub authority

The command:

`npm run sync:hubs`

keeps the three main discovery hubs synchronized with the verified catalog:

- `/episodes` — crawler-visible archive plus `CollectionPage` / `ItemList` graph of permanent episode URLs;
- `/guests` — verified guest directory plus `CollectionPage` / `ItemList` graph of permanent guest profiles;
- `/topics` — crawler-visible topic directory plus `CollectionPage` / `ItemList` graph of permanent topic authority pages.

The normal conversation publishing command runs this automatically. The hub sync remains available as a standalone maintenance command for catalog changes made outside the publisher.

## Review before merge

After the publishing command succeeds:

1. Review the Git diff.
2. Confirm spelling, guest identity, title, description, slug, YouTube video ID, and publication metadata.
3. Confirm the normal GitHub quality checks.
4. Review the Vercel Preview on desktop and mobile.
5. Only then merge through the normal reviewed pull-request workflow.
6. Complete the printed distribution brief after the production deployment is verified.

## Existing guests

If a guest already exists in the site catalog, use that guest's existing slug. The helper will append the new episode to the existing guest relationship and update the conversation count rather than create a duplicate profile.

## New guests

For a new verified guest, the helper creates a profile shell with standard The Alana Show social metadata and ProfilePage/Person structured data. The live detail-page code then connects the guest to the verified conversation.

## What remains editorial judgment

Automation should not decide identity or editorial truth. A person should still verify:

- the correct guest identity;
- the permanent guest and episode slugs;
- whether the YouTube title/description should be used as-is or replaced with a more concise factual editorial version;
- whether multiple people should each be represented as verified guests;
- whether an organization or special editorial relationship needs separate curation;
- whether an official organization or guest backlink request is contextually appropriate.

This keeps the publishing workflow inexpensive without sacrificing accuracy, relationships, or the site's authority structure.
