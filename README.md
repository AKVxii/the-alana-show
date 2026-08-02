# The Alana Show 2.0

A premium, modular, no-build website for Vercel. It keeps the current YouTube and Resend serverless integrations while separating the design into maintainable components.

## Project structure

- `index.html` — metadata, structured data, application mount
- `src/main.js` — application behavior and integrations
- `src/styles.css` — complete responsive visual system
- `src/components/` — reusable page sections
- `src/data/site.js` — platform links and editable site content
- `src/lib/` — icons and utilities
- `api/youtube.js` — YouTube library, featured/latest/recent episodes
- `api/contact.js` — working Resend contact form
- `assets/` — portrait, logo, favicon, social share artwork

## Deploy to the existing GitHub/Vercel project

1. Extract this ZIP.
2. In the GitHub repository, upload the **contents** of this folder to the repository root.
3. Replace matching files and folders. Delete old `app.js` and `styles.css` at the root if they still exist; this version uses `src/main.js` and `src/styles.css`.
4. Commit directly to `main`.
5. Vercel should deploy automatically. Framework preset remains `Other`; no build command or output directory is required.

## Existing Vercel variables retained

- `YOUTUBE_API_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

Optional:

- `FEATURED_YOUTUBE_VIDEO_ID` — set a specific YouTube video ID to curate the Featured Conversation. Without it, the API uses the most-watched eligible full conversation.

## Easy edits

Edit `src/data/site.js` to update platform links, organization profiles, contact details, and topics.

## Important notes

- The iHeartRadio button uses an exact-title iHeart search until the direct show URL is confirmed.
- The True Oldies copy uses the official published Tuesday 8:00–8:30 PM schedule and official South Florida frequencies.
- Sponsorship wording intentionally avoids invented audience metrics.
