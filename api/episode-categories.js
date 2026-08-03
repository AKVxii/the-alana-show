const CATEGORY_NAMES = [
  "Leadership",
  "Community",
  "Business",
  "Public Service",
  "Faith & Purpose",
  "Wellness",
  "Technology",
  "Stepping Up"
];

// Rules intentionally favor specific phrases over broad single words. A match
// only uses public YouTube title, description, and tag metadata.
const CATEGORY_RULES = {
  Leadership: [
    /\bleadership\b/i, /\bleader(?:s|ship)?\b/i, /\bmentor(?:ing|ship|s)?\b/i,
    /\bexecutive\b/i, /\bcoaching\b/i, /\bteam building\b/i,
    /\bleading through adversity\b/i, /\bperformance leadership\b/i
  ],
  Community: [
    /\bcommunity\b/i, /\bneighbou?rhood\b/i, /\byouth program\b/i,
    /\blocal organization\b/i, /\bcivic engagement\b/i, /\bsouth florida\b/i,
    /\bpalm beach\b/i, /\bstudent development\b/i, /\bmentoring program\b/i
  ],
  Business: [
    /\bentrepreneur(?:ship|s)?\b/i, /\bbusiness (?:owner|ownership|strategy|operations?)\b/i,
    /\breal estate\b/i, /\bfinance\b/i, /\bmarketing\b/i,
    /\bcareer development\b/i, /\bprofessional growth\b/i, /\beconomic development\b/i
  ],
  "Public Service": [
    /\bpublic service\b/i, /\belected official\b/i, /\bcandidate\b/i,
    /\bpublic policy\b/i, /\bgovernment\b/i, /\belections?\b/i,
    /\bpolitic(?:al|s)\b/i, /\blaw enforcement\b/i, /\bpublic safety\b/i,
    /\bconsumer protection\b/i, /\bcivic responsibility\b/i, /\bveterans?\b/i
  ],
  "Faith & Purpose": [
    /\bfaith\b/i, /\bministry\b/i, /\bspiritual\b/i, /\bcalling\b/i,
    /\bmoral conviction\b/i, /\bfaith[- ]driven purpose\b/i, /\bservice motivated by faith\b/i
  ],
  Wellness: [
    /\bwellness\b/i, /\bhealthcare\b/i, /\bmental health\b/i, /\bphysical health\b/i,
    /\bfitness\b/i, /\bmartial arts?\b/i, /\bsenjutsu\b/i, /\bsports? performance\b/i,
    /\bpersonal safety\b/i, /\bhealthy aging\b/i, /\brecovery\b/i, /\bmedical leadership\b/i
  ],
  Technology: [
    /\bartificial intelligence\b/i, /\bcybersecurity\b/i, /\bcybercrime\b/i,
    /\bdigital safety\b/i, /\bsoftware\b/i, /\btechnology policy\b/i,
    /\bemerging technolog(?:y|ies)\b/i, /\bonline fraud\b/i, /\bidentity theft\b/i
  ],
  "Stepping Up": [
    /\bnonprofit\b/i, /\bcharit(?:y|able)\b/i, /\bcommunity relief\b/i,
    /\bveterans? support\b/i, /\bfirst responders?\b/i, /\bfood rescue\b/i,
    /\byouth service\b/i, /\badvocacy organization\b/i, /\bcommunity impact\b/i,
    /\bwounded veterans relief fund\b/i, /\bwe fund the blue\b/i, /\bmaca\b/i
  ]
};

// Stable video-id corrections can be added here after human review without
// changing the rules. No IDs are guessed or embedded during this pass.
const CATEGORY_OVERRIDES = {};

// Conservative title fallbacks for review cases whose stable IDs were not
// available in the development environment. Description/tag rules may add
// further supported categories, but results are capped at three.
const TITLE_FALLBACK_OVERRIDES = [
  { label: "Senjutsu", field: "title", pattern: /\bsenjutsu\b/i, categories: ["Wellness", "Leadership"] },
  { label: "Purpose-Driven Leadership with Ashley Vertuno", field: "title", pattern: /\bpurpose-driven leadership\b.*\bashley vertuno\b/i, categories: ["Leadership", "Wellness"] },
  { label: "Equipping the Next Generation of Leaders", field: "title", pattern: /\bequipping the next generation of leaders\b/i, categories: ["Leadership", "Community"] },
  { label: "Michael Barnett", field: "title", pattern: /\bmichael barnett\b/i, categories: ["Public Service", "Leadership"] },
  {
    label: "Sheriff or Sheriff's Office",
    field: "title",
    pattern: /\b(?:county\s+)?sheriff(?:['’]s)?(?:\s+office)?\b/i,
    categories: ["Community", "Leadership", "Public Service"]
  },
  {
    label: "Wounded Veterans Relief Fund",
    field: "metadata",
    pattern: /\bwounded veterans relief fund\b/i,
    categories: ["Stepping Up", "Community", "Public Service"]
  },
  {
    label: "Restoration Bridge International",
    field: "metadata",
    pattern: /\brestoration bridge international\b/i,
    categories: ["Stepping Up", "Community"]
  },
  {
    label: "We Fund the Blue / MACA",
    field: "metadata",
    pattern: /\bwe fund the blue\b|\bmaca\b/i,
    categories: ["Stepping Up", "Community", "Public Service"]
  }
];

function categorizeEpisode(episode = {}) {
  const title = String(episode.title || "");
  const metadata = [title, episode.description || "", ...(episode.tags || [])].join(" \n ");
  const ruleCategories = CATEGORY_NAMES.filter(category =>
    CATEGORY_RULES[category].some(pattern => pattern.test(metadata))
  );
  const idOverride = CATEGORY_OVERRIDES[episode.videoId] || [];
  const titleFallbacks = TITLE_FALLBACK_OVERRIDES.filter(entry =>
    entry.pattern.test(entry.field === "metadata" ? metadata : title)
  );
  const overrideCategories = [
    ...idOverride,
    ...titleFallbacks.flatMap(entry => entry.categories)
  ];
  const categories = CATEGORY_NAMES
    .filter(category => overrideCategories.includes(category) || ruleCategories.includes(category))
    .slice(0, 3);

  const usedRule = categories.some(category => ruleCategories.includes(category));
  const usedOverride = categories.some(category => overrideCategories.includes(category));
  const categorySource = usedRule && usedOverride
    ? "rule plus override"
    : usedOverride
      ? "override"
      : usedRule
        ? "rule"
        : "unclassified";

  return { categories, categorySource };
}

module.exports = {
  CATEGORY_NAMES,
  CATEGORY_RULES,
  CATEGORY_OVERRIDES,
  TITLE_FALLBACK_OVERRIDES,
  categorizeEpisode
};
