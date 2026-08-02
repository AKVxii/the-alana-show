# The Alana Show website

This package is a polished, mobile-friendly landing page for The Alana Show.

## Included

- `index.html` — the complete website
- `assets/alana-hero.webp` — optimized portrait
- `assets/alana-show-logo.svg` — custom navy-and-gold wordmark
- `assets/favicon.svg` — TAS site icon
- `api/youtube.js` — automatically finds the latest and most-watched eligible full episode
- `api/contact.js` — sends form inquiries directly to an email account controlled by Alana
- `vercel.json` — simple security and deployment settings

## Fastest launch on Vercel

1. Put this folder in a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel → Project Settings → Environment Variables, add:

   - `YOUTUBE_API_KEY`
   - `RESEND_API_KEY`
   - `CONTACT_TO_EMAIL` — use an account controlled by Alana
   - `CONTACT_FROM_EMAIL` — a verified sender on a domain you control

4. Redeploy after setting the variables.
5. Connect `TheAlanaShow.com` in Vercel's Domains settings.

## YouTube setup

1. Create a Google Cloud project owned by Alana.
2. Enable **YouTube Data API v3**.
3. Create an API key.
4. Restrict the key to the YouTube Data API.
5. Add it to Vercel as `YOUTUBE_API_KEY`.

The serverless function resolves the channel from `@alanakvandeveer`, retrieves the uploads playlist, excludes short promotional videos, and returns:
- newest full episode
- most-watched full episode
- six recent full episodes

The API key remains server-side and is not placed in the webpage.

## Contact form and lead ownership

Create the Resend account under an email/domain controlled by Alana. All inquiries are delivered to `CONTACT_TO_EMAIL`; the website developer does not need ownership of the account or leads.

To use another CRM, replace the code inside `api/contact.js` with your chosen provider while keeping the form fields unchanged.

## Easy edits

In `index.html`, search for the block:

`EASY SITE CONFIGURATION`

There you can change:
- YouTube channel URL
- manual fallback video ID
- API endpoints

Most website wording is directly in the semantic HTML so it can be edited without a framework.

## Before public launch

- Confirm the displayed contact email.
- Add final Apple Podcasts, Spotify, Amazon Music, Instagram, Facebook, LinkedIn, and X links.
- Replace organization cards with approved logos, links, episode URLs, and mission wording.
- Add a Privacy Policy and Terms page.
- Connect a support/payment link only after deciding how payments will be characterized.
- Review the mobile site and test every form and link.
