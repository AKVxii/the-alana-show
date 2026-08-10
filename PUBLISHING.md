# Publishing a New Conversation

The public YouTube feed updates automatically, but a verified internal episode page gives The Alana Show stronger internal linking, guest relationships, social metadata, crawlable fallbacks, and sitemap coverage.

This repository includes a zero-dependency publishing helper so that enrichment does not require a CMS or routine developer billing.

## Before you begin

1. Publish the finished conversation on the verified The Alana Show YouTube channel.
2. Copy the 11-character YouTube video ID from the published video URL.
3. Confirm the guest name(s), episode title, and a concise factual description.
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
- `title` — the accurate conversation title.
- `description` — concise search/social description. Keep it factual and useful.
- `guests` — one or more verified guest names. Reuse the existing guest slug when the guest has appeared before.

For multiple guests, add another object to the `guests` array.

## Preview without changing files

Run:

`npm run publish:conversation -- --dry-run`

The helper validates the intake and reports what it would publish without modifying the repository.

## Publish the repository changes

Run:

`npm run publish:conversation`

The helper will:

1. Reject duplicate YouTube IDs and episode slugs.
2. Add the episode to the verified editorial catalog.
3. Add the episode to existing guest relationships.
4. Create new verified guest records when needed.
5. Generate the internal episode detail shell.
6. Generate new guest detail shells when needed.
7. Add the episode and new guests to the crawlable archive fallbacks.
8. Add their canonical URLs to `sitemap.xml`.
9. Run the full repository quality suite.
10. Roll back the files it changed if the quality suite fails.

## Review before merge

After the helper succeeds:

1. Review the Git diff.
2. Confirm spelling, guest identity, title, description, slug, and YouTube video ID.
3. Run or confirm the normal GitHub quality checks.
4. Review the Vercel Preview on desktop and mobile.
5. Only then merge through the normal reviewed pull-request workflow.

## Existing guests

If a guest already exists in the site catalog, use that guest's existing slug. The helper will append the new episode to the existing guest relationship and update the conversation count rather than create a duplicate profile.

## New guests

For a new verified guest, the helper creates a profile shell with standard The Alana Show social metadata and ProfilePage/Person structured data. The live detail-page code then connects the guest to the verified conversation.

## What remains editorial judgment

Automation should not decide identity or editorial truth. A person should still verify:

- the correct guest identity;
- the permanent guest and episode slugs;
- the episode title and description;
- whether multiple people should each be represented as verified guests;
- whether an organization or special editorial relationship needs separate curation.

This keeps the publishing workflow inexpensive without sacrificing accuracy or the site's authority structure.
