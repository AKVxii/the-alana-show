# The Alana Show — Measurement Plan

## Goal

Measure audience behavior and conversion intent without collecting personal form values or turning the site into a surveillance-heavy experience.

## Current transport status

The site has a privacy-safe Vercel Web Analytics event queue (`window.va` / `window.vaq`) and a custom-event taxonomy, but Web Analytics must be enabled at the Vercel project level before queued events are delivered. Do not enable Web Analytics Plus or Speed Insights as part of this phase.

## Cost controls

- Keep custom event payloads to at most two properties, matching the Pro custom-event property limit.
- Never send raw search text, email addresses, names, phone numbers, messages, organization values, or website/social form values.
- Prefer high-intent events over noisy scroll/mouse events.
- Debounce search events so typing does not generate an event for every keystroke.
- Do not send Web Vitals as custom events; use a dedicated performance product only if explicitly approved later.
- Reuse the YouTube catalog within the same browser session instead of repeating server requests during ordinary Home ↔ Episodes navigation.

## Core audience events

- `Episode Open` — visitor opens an internal episode detail page.
- `Guest Open` — visitor opens a guest profile.
- `Topic Open` — visitor opens a topic page.
- `Watch Outbound` — visitor leaves for YouTube.
- `Listen Outbound` — visitor leaves for a podcast/listening platform.
- `On Air Outbound` — visitor leaves for True Oldies from a general station link.
- `Broadcast Listen` — visitor clicks Listen Live inside the South Florida Broadcast Reach feature.
- `Broadcast Episodes` — visitor clicks View Episodes inside the Broadcast Reach feature.

## Discovery events

- `Search Open` — global search is opened.
- `Search Query` — debounced homepage search usage. Only query-length bucket and result count are sent.
- `Search Filter` — homepage topic/category chip selection.
- `Archive Search` — debounced Episodes archive search. Only query-length bucket and result count are sent.
- `Archive Topic Filter` — Episodes archive topic selection.
- `Archive Load More` — visitor requests additional archive results.

## Conversion events

- `Partnership Explore` — advertising/partnership page intent.
- `Guest Inquiry Explore` — guest-booking page intent.
- `Inquiry Intent` — a homepage inquiry CTA preselects a contact type.
- `Contact Intent` — visitor opens the contact destination.
- `Contact Form Attempt` — contact form submit action begins.
- `Contact Form Invalid` — browser-side validation blocks submission.
- `Contact Form Success` — server confirms contact delivery.
- `Contact Form Failure` — contact delivery fails.
- `Newsletter Attempt` — valid newsletter submission begins.
- `Newsletter Success` — subscription endpoint accepts the request.
- `Newsletter Failure` — subscription endpoint fails.
- `Newsletter Invalid` — browser-side validation blocks newsletter submission.

## What to review once analytics is enabled

1. Which pages introduce the most new visitors.
2. Episode and guest profiles with the highest engagement.
3. Search usage and whether searches are producing results.
4. Broadcast Reach clicks compared with general True Oldies clicks.
5. Watch vs. listen behavior by page type.
6. Newsletter success rate.
7. Partnership / media-kit / guest inquiry intent.
8. Contact form completion vs. failure rate.

## Performance posture

The YouTube feed uses two conservative cache layers:

1. **Browser session cache:** a successful feed response may be reused for up to 10 minutes while a visitor moves between Home and Episodes. A size guard prevents oversized responses from being written to session storage, and failure to use storage never blocks the site.
2. **Vercel CDN cache:** the server response is cached for 15 minutes with a six-hour stale-while-revalidate window.

Together these keep newly published episodes reasonably fresh while reducing repeated browser requests, serverless execution, and YouTube API quota consumption.
