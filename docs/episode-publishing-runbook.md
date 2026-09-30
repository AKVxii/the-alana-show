# Alana — All Over the Place — Episode Publishing Runbook

This is the default zero-cost publishing workflow for new conversations. The goal is one clean master, broad distribution, strong YouTube discovery, and a permanent owned page on TheAlanaShow.com.

## Recommended distribution architecture

### 1. Audio master / RSS

Use Spotify for Creators as the audio host while it remains a good fit for the show. Publish the final audio episode there first or at the coordinated release time.

The RSS feed remains the source for podcast listening platforms such as Spotify, Apple Podcasts, Amazon Music, iHeartRadio, and other directories already connected to the show.

Do not create separate manual uploads at every podcast directory unless a platform requires an initial submission or account claim. After distribution is established, the RSS feed should carry new episodes automatically.

### 2. YouTube master

For Alana — All Over the Place, direct YouTube upload is preferred over RSS-to-YouTube ingestion because the show uses custom episode-specific 16:9 artwork.

Create a 1920x1080 video using:
- the approved episode thumbnail as the visual,
- the final mastered episode audio,
- no unnecessary motion unless it materially improves the episode,
- the same episode title and core description used across distribution.

Upload the MP4 directly in YouTube Studio, set the approved custom thumbnail, and add the full episode to the official Alana — All Over the Place podcast playlist.

Avoid connecting the same RSS feed to YouTube if the episode will also be uploaded manually; duplicate episodes weaken the archive and analytics.

### 3. YouTube episode setup

Before publishing or scheduling:
- verify guest-name spelling and current titles,
- use the approved thumbnail,
- add a strong first two description lines,
- include the permanent TheAlanaShow.com episode URL near the top once the site page exists,
- add useful chapters when timestamps are available,
- review automatic captions and correct material name/title errors when practical,
- disclose paid promotion in YouTube when an episode contains a sponsorship or paid promotion,
- add the episode to the official podcast playlist,
- schedule YouTube and RSS release times together when practical.

## 4. Website publishing

A new eligible YouTube upload automatically appears in the live website feed through `/api/youtube`; the homepage and `/episodes/` archive use that shared feed.

For long-term SEO, guest authority, structured data, and a permanent owned URL, also publish the verified conversation record:

```bash
npm run publish:conversation -- content/conversation.json
```

The safe publisher:
- creates/updates the canonical episode page,
- updates verified guest relationships,
- updates discovery hubs,
- refreshes the canonical sitemap,
- refreshes the video sitemap,
- runs repository quality gates,
- prints the post-publish distribution brief.

Never guess a guest identity or current title in the conversation record. Use information supplied by the guest/show or a verified primary source.

## 5. Post-publish distribution

Use the permanent TheAlanaShow.com episode page as the owned share destination whenever possible.

Then:
- add that URL near the top of the YouTube description,
- send it to the guest and relevant organization,
- ask appropriate guests/organizations to link to the episode from their official website, newsroom, bio, event recap, or resources page,
- share YouTube for video-first social audiences,
- share Spotify/Apple for audio-first listeners,
- use the website page as the durable reference URL in press, email, and search.

## 6. Measurement

The site already uses privacy-safe first-party/Vercel measurement for core behavior such as episode opens, watch/listen outbound clicks, guest/topic discovery, contact attempts, newsletter actions, and archive use.

Google Analytics 4 support is prepared but remains optional. It only activates when a valid `GOOGLE_ANALYTICS_ID` Vercel environment variable is configured and the visitor chooses to allow analytics. Custom event payloads remain limited and do not include names, emails, phone numbers, messages, website/social fields, or raw search text.

When a GA4 property is created, add its `G-...` Measurement ID as the production Vercel environment variable `GOOGLE_ANALYTICS_ID`, redeploy, and verify with Google Tag Assistant / Realtime.

## 7. Search Console

Maintain a Google Search Console Domain property for `thealanashow.com` using DNS verification when possible.

Submit and monitor:
- `https://thealanashow.com/sitemap.xml`
- `https://thealanashow.com/video-sitemap.xml`

The public `robots.txt` already advertises both sitemaps.

Review Search Console after major publishing batches for indexing, video indexing, structured-data issues, and pages that are discovered but not indexed.

## 8. Automatic IndexNow discovery

Production pushes to `main` automatically identify changed canonical HTML pages and submit those URLs to the IndexNow global endpoint after a short deployment-settle window.

The automation:
- uses the public root ownership key hosted on TheAlanaShow.com,
- submits only URLs on the canonical `https://thealanashow.com` origin,
- announces new, changed, or deleted permanent pages to participating IndexNow search engines,
- does not replace the Google sitemap/Search Console workflow,
- adds no paid service, plugin, or analytics dependency.

The submission can also be run manually when needed:

```bash
npm run indexnow:notify
```

For testing without a network request, set `INDEXNOW_DRY_RUN=1` and provide `INDEXNOW_URLS`.

## Default rule

External platforms distribute the show. TheAlanaShow.com owns the relationship, context, search authority, guest network, and permanent archive.
