# The Alana Show

## Architecture

The site uses a zero-build, modular frontend designed for Vercel's static hosting:

- `index.html` is the minimal document shell.
- `src/main.js` composes native JavaScript modules from `src/components/`.
- `src/styles.css` contains the responsive design system.
- `src/data/site.js` centralizes verified site links and content data.
- `api/youtube.js` and `api/contact.js` remain Vercel serverless functions.

No bundler or dependency installation is required.

## Verified True Oldies wording
The gold broadcast band uses the station's current published claims:
- The Alana Show airs Tuesdays, 8:00–8:30 PM ET.
- The Alana Show airs on True Oldies in South Florida.
- The Alana Show page states that the program has worldwide streaming and video components.

## Deployment workflow

- `main` is the production branch.
- `luxury-redesign` is the protected redesign and integration branch.
- Individual feature work should be reviewed before it reaches `luxury-redesign`.
- Vercel Preview deployments must be visually and functionally tested before any production merge.
- The project remains a zero-build native-module frontend.
- The root-level `app.js` and `styles.css` remain temporarily as rollback references.
- Search uses the complete eligible episode archive returned in `/api/youtube` as `episodes`, with category and tag discovery; the homepage rail remains limited to the `recent` collection.

Vercel settings:
- Framework Preset: Other
- Root Directory: ./
- Build Command: blank
- Output Directory: blank

Environment variables:
- `YOUTUBE_API_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

Do not recreate, expose, rename, or delete these existing variables.

The page retains curated fallback content without the API variables. The email variables are required for contact-form delivery, and the YouTube variable is required for automatic episode updates.
