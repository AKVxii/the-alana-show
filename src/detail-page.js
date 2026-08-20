import { MediaHeader, setupMediaNavigation } from "./components/MediaHeader.js";
import { Footer } from "./components/Footer.js";
import { episodes, episodeById, guestById, organizationById, enrichEpisode } from "./data/catalog.js";
import { topicHref } from "./data/topic-pages.js";
import { guestProfileById } from "./data/guest-profiles.js";
import { escapeHtml, formatDate } from "./lib/utils.js";
import { bindThumbnailFallbacks, relatedConversationRow } from "./lib/media-page.js";
import { setupEditorialMotion } from "./lib/motion.js";
import { loadYouTubeFeed } from "./lib/youtube-feed.js";
import "./featured-video.js";

const SITE_ORIGIN = "https://thealanashow.com";
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const SHOW_ID = `${SITE_ORIGIN}/#show`;
const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/alana-show-social-card-2026-imessage-v2.png`;

const compactDetailStyles = document.createElement("style");
compactDetailStyles.textContent = `
  .detail-hero { padding: 84px 0 42px; }
  .detail-hero .breadcrumbs { margin-bottom: 20px; }
  .detail-hero h1 {
    max-width: 860px;
    margin-bottom: 12px;
    font-size: clamp(2rem, 3.2vw, 3.15rem);
    line-height: 1.03;
    letter-spacing: -.028em;
    text-wrap: balance;
  }
  .detail-byline { margin-bottom: 20px; font-size: .98rem; }
  .guest-detail-intro { padding: 18px 0; gap: 18px; }
  .guest-monogram-large { width: 82px; height: 82px; flex: 0 0 82px; font-size: 1.6rem; }
  .related-section { padding-top: 18px; margin-top: 14px; }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:not(.related-eyebrow) {
    max-width: 78ch;
    margin: 0 0 18px;
    line-height: 1.72;
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4),
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(5) {
    display: inline-block;
    width: calc(50% - 10px);
    max-width: none;
    vertical-align: top;
    padding: 18px 20px;
    margin-top: 4px;
    margin-bottom: 22px;
    border: 1px solid rgba(213, 174, 83, .26);
    border-radius: 10px;
    background: linear-gradient(145deg, rgba(8, 25, 46, .78), rgba(3, 12, 25, .58));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4) {
    margin-right: 16px;
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4)::first-line,
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(5)::first-line {
    color: #e2bd62;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.16rem;
    font-weight: 700;
    line-height: 1.7;
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(6) {
    clear: both;
    margin-top: 2px;
    color: rgba(245, 247, 250, .88);
  }
  body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(7) {
    color: #e2bd62;
    font-size: .96rem;
    letter-spacing: .025em;
  }
  @media (max-width: 640px) {
    .detail-hero { padding: 90px 0 36px; }
    .detail-hero .breadcrumbs { margin-bottom: 18px; }
    .detail-hero h1 { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.04; }
    .guest-detail-intro { padding: 16px 0; }
    body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(4),
    body[data-detail-id="scott-diament-gillian-lieberman"] #episode-summary .related-section > p:nth-of-type(5) {
      display: block;
      width: 100%;
      margin-right: 0;
      padding: 16px;
    }
  }
`;
document.head.append(compactDetailStyles);

const root = document.querySelector("#app");
if (root && !document.querySelector(".skip-link")) {
  const skipLink = document.createElement("a");
  skipLink.className = "skip-link";
  skipLink.href = "#main-content";
  skipLink.textContent = "Skip to main content";
  root.before(skipLink);
}
const type = document.body.dataset.detailType;
const pathId = location.pathname.split("/").filter(Boolean).pop();
const id = document.body.dataset.detailId || pathId;
const item = type === "episode" ? episodeById(id) : guestById(id);

function detailUrl(detailType, detailId) {
  const section = detailType === "episode" ? "episodes" : "guests";
  return `${SITE_ORIGIN}/${section}/${detailId}`;
}

function requestedStartSeconds() {
  const raw = new URLSearchParams(location.search).get("t");
  if (!raw || !/^\d+$/.test(raw)) return 0;
  const seconds = Number(raw);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return 0;
  return Math.min(seconds, 86400);
}

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.append(node);
  }
  node.setAttribute("content", content);
}

function upsertCanonical(url) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.rel = "canonical";
    document.head.append(node);
  }
  node.href = url;
}

function upsertJsonLd(id, data) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement("script");
    node.id = id;
    node.type = "application/ld+json";
    document.head.append(node);
  }
  node.textContent = JSON.stringify(data);
}

function isoDuration(seconds = 0) {
  const total = Number(seconds || 0);
  if (!total || total < 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${secs || (!hours && !minutes) ? `${secs}S` : ""}`;
}

function episodeGuests(episode) {
  return (episode.guestIds || []).map(guestById).filter(Boolean);
}

function episodeGuestNames(episode) {
  return episodeGuests(episode).map(guest => guest.name);
}

function episodeDisplayData(episode) {
  const canonical = episode?.canonical || {};
  return {
    ...episode,
    ...canonical,
    title: canonical.title || episode?.title || "The Alana Show conversation",
    description: canonical.description || "",
    deck: canonical.deck || canonical.metaDescription || "",
    categories: Array.isArray(canonical.categories) ? canonical.categories.filter(Boolean) : [],
    chapters: Array.isArray(canonical.chapters) ? canonical.chapters : []
  };
}

function verifiedChapters(episode) {
  const display = episodeDisplayData(episode);
  const duration = Number(display.durationSeconds || 0);
  const seen = new Set();
  return display.chapters
    .map(chapter => ({
      startSeconds: Number(chapter?.startSeconds),
      label: String(chapter?.label || "").trim()
    }))
    .filter(chapter => {
      if (!Number.isSafeInteger(chapter.startSeconds) || chapter.startSeconds < 0 || !chapter.label) return false;
      if (duration > 0 && chapter.startSeconds >= duration) return false;
      if (seen.has(chapter.startSeconds)) return false;
      seen.add(chapter.startSeconds);
      return true;
    })
    .sort((a, b) => a.startSeconds - b.startSeconds);
}

function verifiedGuestReference(guest) {
  const profile = guestProfileById(guest.id);
  const person = {
    "@type": "Person",
    "@id": `${detailUrl("guest", guest.id)}#person`,
    name: guest.name,
    url: detailUrl("guest", guest.id)
  };
  if (profile?.role) person.jobTitle = profile.role;
  if (profile?.organization) {
    person.worksFor = {
      "@type": "Organization",
      name: profile.organization.name,
      url: profile.organization.url
    };
  }
  return person;
}

function episodeClipSchemas(episode, canonical) {
  const display = episodeDisplayData(episode);
  const chapters = verifiedChapters(display);
  const duration = Number(display.durationSeconds || 0);
  return chapters.map((chapter, index) => {
    const nextStart = chapters[index + 1]?.startSeconds;
    const endOffset = Number.isSafeInteger(nextStart) ? nextStart : duration;
    return {
      "@type": "Clip",
      name: chapter.label,
      startOffset: chapter.startSeconds,
      ...(endOffset > chapter.startSeconds ? { endOffset } : {}),
      url: chapter.startSeconds ? `${canonical}?t=${chapter.startSeconds}` : canonical
    };
  });
}

function episodeVideoObject(episode, data) {
  const display = { ...episodeDisplayData(episode), ...data };
  const canonical = detailUrl("episode", episode.id);
  const uploadDate = display.publishedAt || "";
  if (!uploadDate) return null;
  const thumbnailUrl = display.thumbnail || display.thumbnailUrl || `https://i.ytimg.com/vi/${episode.videoId}/maxresdefault.jpg`;
  const duration = isoDuration(display.durationSeconds);
  const relatedGuests = episodeGuests(episode);
  const relatedOrganizations = (episode.organizationIds || []).map(organizationById).filter(Boolean);
  const videoObject = {
    "@type": "VideoObject",
    "@id": `${canonical}#video`,
    name: display.title,
    description: (display.description || display.deck || `Watch ${display.title} on The Alana Show.`).replace(/\s+/g, " ").trim(),
    thumbnailUrl: [thumbnailUrl],
    uploadDate,
    embedUrl: `https://www.youtube-nocookie.com/embed/${episode.videoId}`,
    url: canonical,
    mainEntityOfPage: { "@id": `${canonical}#webpage` },
    isPartOf: { "@id": SHOW_ID },
    potentialAction: {
      "@type": "SeekToAction",
      target: `${canonical}?t={seek_to_second_number}`,
      "startOffset-input": "required name=seek_to_second_number"
    },
    about: relatedGuests.map(verifiedGuestReference)
  };
  const clips = episodeClipSchemas(display, canonical);
  if (clips.length) videoObject.hasPart = clips;
  if (relatedOrganizations.length) {
    videoObject.mentions = relatedOrganizations.map(organization => ({
      "@type": "Organization",
      name: organization.name
    }));
  }
  if (duration) videoObject.duration = duration;
  if (Number.isFinite(Number(display.viewCount)) && Number(display.viewCount) >= 0) {
    videoObject.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: Number(display.viewCount)
    };
  }
  return videoObject;
}

function relatedEpisodesFor(episode) {
  const display = episodeDisplayData(episode);
  const guestIds = new Set(episode.guestIds || []);
  const organizationIds = new Set(episode.organizationIds || []);
  const categories = new Set(display.categories || []);
  return episodes
    .filter(candidate => candidate.id !== episode.id)
    .map(candidate => {
      const candidateDisplay = episodeDisplayData(candidate);
      const sharedGuests = (candidate.guestIds || []).filter(guestId => guestIds.has(guestId)).length;
      const sharedOrganizations = (candidate.organizationIds || []).filter(organizationId => organizationIds.has(organizationId)).length;
      const sharedCategories = (candidateDisplay.categories || []).filter(category => categories.has(category)).length;
      const score = sharedGuests * 12 + sharedOrganizations * 8 + sharedCategories * 2;
      return { episode: candidateDisplay, score, publishedAt: Date.parse(candidateDisplay.publishedAt || "") || 0 };
    })
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.publishedAt - a.publishedAt || a.episode.title.localeCompare(b.episode.title))
    .slice(0, 3)
    .map(candidate => candidate.episode);
}

function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: "The Alana Show"
  };
}

function showSchema() {
  return {
    "@type": "PodcastSeries",
    "@id": SHOW_ID,
    url: `${SITE_ORIGIN}/`,
    name: "The Alana Show",
    isPartOf: { "@id": WEBSITE_ID }
  };
}

function breadcrumbSchema(detailType, currentName, canonical) {
  const parentName = detailType === "episode" ? "Episodes" : "Guests";
  const parentUrl = `${SITE_ORIGIN}/${parentName.toLowerCase()}`;
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: parentName, item: parentUrl },
      { "@type": "ListItem", position: 3, name: currentName, item: canonical }
    ]
  };
}

function applyStaticMetadata(detailType, detailItem) {
  const canonical = detailUrl(detailType, detailItem.id);
  const isEpisode = detailType === "episode";
  const episodeDisplay = isEpisode ? episodeDisplayData(detailItem) : null;
  const guestProfile = !isEpisode ? guestProfileById(detailItem.id) : null;
  const guestNames = isEpisode ? episodeGuestNames(detailItem) : [];
  const generatedPageTitle = isEpisode
    ? `${episodeDisplay.title} | The Alana Show`
    : `${detailItem.name} | Guest | The Alana Show`;
  const generatedDescription = isEpisode
    ? episodeDisplay.deck || episodeDisplay.metaDescription || `Watch The Alana Show conversation${guestNames.length ? ` with ${guestNames.join(" & ")}` : ""}.`
    : `Explore verified conversations featuring ${detailItem.name} on The Alana Show.`;
  const generatedImage = isEpisode
    ? episodeDisplay.thumbnail || `https://i.ytimg.com/vi/${detailItem.videoId}/maxresdefault.jpg`
    : DEFAULT_SOCIAL_IMAGE;
  const pageTitle = isEpisode ? generatedPageTitle : (document.title.trim() || generatedPageTitle);
  const description = isEpisode
    ? generatedDescription
    : guestProfile?.summary || document.head.querySelector('meta[name="description"]')?.content?.trim() || generatedDescription;
  const image = (isEpisode ? generatedImage : "") || document.head.querySelector('meta[property="og:image"]')?.content?.trim()
    || document.head.querySelector('meta[name="twitter:image"]')?.content?.trim()
    || generatedImage;
  const currentName = isEpisode ? episodeDisplay.title : detailItem.name;

  document.title = pageTitle;
  upsertCanonical(canonical);
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", "index,follow,max-image-preview:large");
  upsertMeta("property", "og:site_name", "The Alana Show");
  upsertMeta("property", "og:title", pageTitle);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:type", isEpisode ? "video.other" : "profile");
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:image:alt", isEpisode ? episodeDisplay.title : `${detailItem.name} on The Alana Show`);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", pageTitle);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);
  upsertMeta("name", "twitter:image:alt", isEpisode ? episodeDisplay.title : `${detailItem.name} on The Alana Show`);

  const graph = [
    websiteSchema(),
    showSchema(),
    {
      "@type": isEpisode ? "WebPage" : "ProfilePage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: pageTitle,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${canonical}#breadcrumb` }
    },
    breadcrumbSchema(detailType, currentName, canonical)
  ];

  if (isEpisode) {
    graph[2].primaryImageOfPage = { "@type": "ImageObject", url: image };
    if (episodeDisplay.publishedAt) graph[2].datePublished = episodeDisplay.publishedAt;
    const videoObject = episodeVideoObject(detailItem, episodeDisplay);
    if (videoObject) {
      graph.push(videoObject);
      graph[2].mainEntity = { "@id": `${canonical}#video` };
    }
  }

  if (!isEpisode) {
    graph[2].mainEntity = { "@id": `${canonical}#person` };
    const person = {
      "@type": "Person",
      "@id": `${canonical}#person`,
      name: detailItem.name,
      url: canonical,
      subjectOf: (detailItem.episodeIds || []).map(episodeId => ({
        "@type": "WebPage",
        "@id": `${SITE_ORIGIN}/episodes/${episodeId}#webpage`,
        url: `${SITE_ORIGIN}/episodes/${episodeId}`
      }))
    };
    if (guestProfile?.summary) person.description = guestProfile.summary;
    if (guestProfile?.role) person.jobTitle = guestProfile.role;
    if (guestProfile?.organization) {
      person.worksFor = {
        "@type": "Organization",
        name: guestProfile.organization.name,
        url: guestProfile.organization.url
      };
    }
    if (guestProfile?.sameAs?.length) person.sameAs = guestProfile.sameAs;
    graph.push(person);
  }

  upsertJsonLd("detail-structured-data", {
    "@context": "https://schema.org",
    "@graph": graph
  });
}

function applyLiveEpisodeMetadata(episode, enriched) {
  const display = { ...episodeDisplayData(episode), ...enriched };
  const canonical = detailUrl("episode", episode.id);
  const title = display.title;
  const pageTitle = `${title} | The Alana Show`;
  const description = (display.description || display.deck || `Watch ${title} on The Alana Show.`).replace(/\s+/g, " ").trim();
  const conciseDescription = display.deck || display.metaDescription || (description.length > 220 ? `${description.slice(0, 217).trim()}…` : description);
  const thumbnailUrl = display.thumbnail || display.thumbnailUrl || `https://i.ytimg.com/vi/${episode.videoId}/maxresdefault.jpg`;
  const uploadDate = display.publishedAt || "";

  document.title = pageTitle;
  upsertMeta("name", "description", conciseDescription);
  upsertMeta("property", "og:title", pageTitle);
  upsertMeta("property", "og:description", conciseDescription);
  upsertMeta("property", "og:image", thumbnailUrl);
  upsertMeta("property", "og:image:alt", title);
  upsertMeta("name", "twitter:title", pageTitle);
  upsertMeta("name", "twitter:description", conciseDescription);
  upsertMeta("name", "twitter:image", thumbnailUrl);
  upsertMeta("name", "twitter:image:alt", title);

  const graph = [
    websiteSchema(),
    showSchema(),
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: pageTitle,
      description: conciseDescription,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      primaryImageOfPage: { "@type": "ImageObject", url: thumbnailUrl }
    },
    breadcrumbSchema("episode", title, canonical)
  ];

  const videoObject = episodeVideoObject(episode, display);
  if (videoObject) {
    graph[2].datePublished = uploadDate;
    graph.push(videoObject);
    graph[2].mainEntity = { "@id": `${canonical}#video` };
  }

  upsertJsonLd("detail-structured-data", {
    "@context": "https://schema.org",
    "@graph": graph
  });
}

function breadcrumbs(current) {
  const parent = type === "episode" ? "Episodes" : "Guests";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/${parent.toLowerCase()}">${parent}</a></li><li aria-current="page">${escapeHtml(current)}</li></ol></nav>`;
}

function formatDuration(seconds = 0) {
  const total = Number(seconds || 0);
  if (!total) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatTimecode(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function episodeOverviewMarkup(episode) {
  const display = episodeDisplayData(episode);
  const overview = display.deck || display.metaDescription || display.description;
  if (!overview) return "";
  return `<section class="related-section episode-overview" aria-labelledby="summary-heading" data-episode-overview><p class="related-eyebrow"><span></span>ABOUT THIS CONVERSATION</p><h2 id="summary-heading">Episode overview</h2><p>${escapeHtml(overview)}</p></section>`;
}

function episodeTopicsMarkup(episode) {
  const categories = episodeDisplayData(episode).categories;
  if (!categories.length) return "";
  return `<section class="related-section episode-topics" aria-labelledby="topics-heading" data-episode-topics><p class="related-eyebrow"><span></span>EXPLORE MORE</p><h2 id="topics-heading">Topics</h2><div class="episode-topic-links">${categories.map(category => `<a href="${topicHref(category)}">${escapeHtml(category)}</a>`).join("")}</div></section>`;
}

function episodeGuestCredentialsMarkup(episode) {
  const guestProfiles = episodeGuests(episode).map(guest => ({ guest, profile: guestProfileById(guest.id) }));
  if (!guestProfiles.length) return "";
  const heading = guestProfiles.length === 1 ? "About the guest" : "About the guests";
  return `<section class="related-section episode-guests" aria-labelledby="episode-guests-heading" data-episode-guests><p class="related-eyebrow"><span></span>GUEST${guestProfiles.length === 1 ? "" : "S"} IN THIS CONVERSATION</p><h2 id="episode-guests-heading">${heading}</h2><div class="episode-guest-grid">${guestProfiles.map(({ guest, profile }) => {
    const initials = guest.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("");
    const hasVerifiedProfile = Boolean(profile?.role && profile?.summary);
    const officialLink = hasVerifiedProfile && profile.officialUrl
      ? `<a class="episode-guest-source" href="${escapeHtml(profile.officialUrl)}" target="_blank" rel="noopener">Verified official profile →</a>`
      : "";
    const verifiedDetails = hasVerifiedProfile
      ? `<p class="episode-guest-role">${escapeHtml(profile.role)}</p><p>${escapeHtml(profile.summary)}</p>${officialLink}`
      : "";
    return `<article class="episode-guest-profile${hasVerifiedProfile ? "" : " episode-guest-profile-name-only"}"><div class="guest-monogram" aria-hidden="true">${escapeHtml(initials)}</div><div><h3><a href="/guests/${guest.id}">${escapeHtml(guest.name)}</a></h3>${verifiedDetails}</div></article>`;
  }).join("")}</div></section>`;
}

function episodeChaptersMarkup(episode) {
  const chapters = verifiedChapters(episode);
  if (!chapters.length) return "";
  const canonicalPath = `/episodes/${episode.id}/`;
  return `<section class="related-section episode-chapters" aria-labelledby="chapters-heading" data-episode-chapters><p class="related-eyebrow"><span></span>KEY MOMENTS</p><h2 id="chapters-heading">Chapters</h2><ol class="episode-chapter-list">${chapters.map(chapter => {
    const href = chapter.startSeconds ? `${canonicalPath}?t=${chapter.startSeconds}` : canonicalPath;
    return `<li><a href="${href}"><time datetime="PT${chapter.startSeconds}S">${formatTimecode(chapter.startSeconds)}</time><span>${escapeHtml(chapter.label)}</span></a></li>`;
  }).join("")}</ol></section>`;
}

function episodeRelatedMarkup(episode) {
  const related = relatedEpisodesFor(episode);
  if (!related.length) return "";
  return `<section class="related-section episode-related" aria-labelledby="episode-related-heading" data-episode-related><p class="related-eyebrow"><span></span>CONTINUE WATCHING</p><h2 id="episode-related-heading">Related conversations</h2><div class="related-conversation-list">${related.map(relatedConversationRow).join("")}</div></section>`;
}

function episodeDetail(episode) {
  const display = episodeDisplayData(episode);
  const relatedGuests = episode.guestIds.map(guestById).filter(Boolean);
  const relatedOrganizations = (episode.organizationIds || []).map(organizationById).filter(Boolean);
  const guestLinks = relatedGuests.map(guest => `<a href="/guests/${guest.id}">${escapeHtml(guest.name)}</a>`).join(" and ");
  const date = formatDate(display.publishedAt);
  const duration = formatDuration(display.durationSeconds);
  const metaParts = [date, duration].filter(Boolean);
  const startSeconds = requestedStartSeconds();
  const startParam = startSeconds ? `&start=${startSeconds}` : "";
  const canonicalShareUrl = `${detailUrl("episode", episode.id)}${startSeconds ? `?t=${startSeconds}` : ""}`;
  return `<section class="detail-hero"><div class="shell detail-shell">${breadcrumbs(display.title)}<p class="eyebrow"><span></span> Episode</p><h1 id="episode-title">${escapeHtml(display.title)}</h1>
    ${guestLinks ? `<p class="detail-byline">A conversation with ${guestLinks}</p>` : ""}
    <p class="detail-byline episode-meta" id="episode-meta"${metaParts.length ? "" : " hidden"}>${escapeHtml(metaParts.join(" · "))}</p>
    ${relatedOrganizations.length ? `<p class="detail-byline episode-organization">Featured organization: ${relatedOrganizations.map(organization => escapeHtml(organization.name)).join(", ")}</p>` : ""}
    <div class="video-frame"><featured-video data-context="episode" data-initial-src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(episode.videoId)}?rel=0${startParam}" data-title="${escapeHtml(display.title)}"><a href="https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}" target="_blank" rel="noopener">Watch ${escapeHtml(display.title)} on YouTube</a></featured-video></div>
    <div class="detail-actions episode-primary-actions" data-episode-primary-actions><a class="button button-gold" href="https://www.youtube.com/watch?v=${encodeURIComponent(episode.videoId)}" target="_blank" rel="noopener">Watch on YouTube</a><a class="button button-outline" href="mailto:?subject=${encodeURIComponent(display.title)}&body=${encodeURIComponent(canonicalShareUrl)}">Share by email</a><a class="button button-outline" href="/episodes">All conversations</a></div>
    <div class="episode-content-grid"><div id="episode-summary">${episodeOverviewMarkup(episode)}</div><div id="episode-topics">${episodeTopicsMarkup(episode)}</div></div>
    ${episodeGuestCredentialsMarkup(episode)}
    ${episodeChaptersMarkup(episode)}
    ${episodeRelatedMarkup(episode)}
  </div></section>`;
}

function guestDetail(guest) {
  const related = (guest.episodeIds || []).map(episodeById).filter(Boolean);
  const profile = guestProfileById(guest.id);
  const count = guest.conversationCount || related.length;
  const archiveHref = `/episodes?guest=${encodeURIComponent(guest.name)}`;
  const countLabel = count === 1 ? "1 verified conversation" : `${count} verified conversations`;
  const intro = profile?.summary || `${countLabel} featuring ${guest.name} on The Alana Show.`;
  const role = profile?.role ? `<p class="detail-byline">${escapeHtml(profile.role)}</p>` : "";
  const officialAction = profile?.officialUrl ? `<a class="button button-outline" href="${escapeHtml(profile.officialUrl)}" target="_blank" rel="noopener">Official profile</a>` : "";
  return `<section class="detail-hero"><div class="shell detail-shell">${breadcrumbs(guest.name)}<p class="eyebrow"><span></span> Guest</p><h1>${escapeHtml(guest.name)}</h1>
    <div class="guest-detail-intro" data-reveal><div class="guest-monogram guest-monogram-large" aria-hidden="true">${escapeHtml(guest.name.split(/\s+/).map(part => part[0]).slice(0, 2).join(""))}</div><div>${role}<p>${escapeHtml(intro)}</p><p class="detail-byline">${escapeHtml(countLabel)} on The Alana Show.</p><div class="detail-actions"><a class="button button-gold" href="${archiveHref}">View conversations</a>${officialAction}<a class="button button-outline" href="/guests">Guest directory</a></div></div></div>
    ${related.length ? `<section class="related-section" aria-labelledby="related-heading"><div data-reveal><p class="related-eyebrow"><span></span>${escapeHtml(guest.name.toUpperCase())} ARCHIVE</p><h2 id="related-heading">Related conversations</h2></div><div class="related-conversation-list">${related.map(relatedConversationRow).join("")}</div></section>` : ""}
  </div></section>`;
}

async function hydrateEpisode(episode) {
  try {
    const payload = await loadYouTubeFeed();
    const live = (payload.episodes || []).find(candidate => candidate.videoId === episode.videoId);
    if (!live) return;
    const enriched = enrichEpisode(live);
    const titleNode = document.querySelector("#episode-title");
    if (titleNode && enriched.title) titleNode.textContent = enriched.title;
    applyLiveEpisodeMetadata(episode, enriched);

    const date = formatDate(enriched.publishedAt);
    const duration = formatDuration(enriched.durationSeconds);
    const metaParts = [date, duration].filter(Boolean);
    const metaNode = document.querySelector("#episode-meta");
    if (metaNode && metaParts.length) {
      metaNode.textContent = metaParts.join(" · ");
      metaNode.hidden = false;
    }
  } catch {
    // Canonical editorial data keeps the page complete if the live feed is unavailable.
  }
}

if (!item) {
  root.innerHTML = `${MediaHeader()}<main id="main-content"><section class="detail-hero"><div class="shell detail-shell"><p class="eyebrow"><span></span> Archive</p><h1>Profile unavailable</h1><p>This verified archive profile is not available.</p><div class="detail-actions"><a class="button button-gold" href="/episodes">Episodes</a></div></div></section></main>${Footer({ fromSubpage: true })}`;
} else {
  applyStaticMetadata(type, item);
  root.innerHTML = `${MediaHeader()}<main id="main-content">${type === "episode" ? episodeDetail(item) : guestDetail(item)}</main>${Footer({ fromSubpage: true })}`;
}
setupMediaNavigation();
bindThumbnailFallbacks(root);
setupEditorialMotion(root);
if (type === "episode" && item) hydrateEpisode(item);
