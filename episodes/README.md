# Episode detail pages

This directory contains static, crawlable entry pages for the verified YouTube conversations represented in `src/data/catalog.js`. Each page delegates presentation to `src/detail-page.js`, while live `/api/youtube` metadata supplies the current YouTube title, publication date, duration, description excerpt, and verified topic classification when available. Static catalog records keep every page usable if the YouTube API is unavailable.
