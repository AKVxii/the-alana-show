# The Alana Show — final website package

## Verified True Oldies wording
The gold broadcast band uses the station's current published claims:
- The Alana Show airs Tuesdays, 8:00–8:30 PM ET.
- True Oldies describes a five-county Florida network reaching over 4 million people.
- The Alana Show page states that the program has worldwide streaming and video components.

## Deploy
Upload the contents of this folder to the GitHub repository root. Vercel should see `index.html`, `assets/`, `api/`, and `vercel.json` at the top level.

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

The page itself works without the email variables. The YouTube API variable is needed for automatic episode updates.
