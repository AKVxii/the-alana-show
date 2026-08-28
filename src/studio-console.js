const elements = {
  setupPanel: document.querySelector("[data-setup-panel]"),
  setupContent: document.querySelector("[data-setup-content]"),
  connectionStatus: document.querySelector("[data-connection-status]"),
  channelPanel: document.querySelector("[data-channel-panel]"),
  channelTitle: document.querySelector("[data-channel-title]"),
  channelImage: document.querySelector("[data-channel-image]"),
  channelHandle: document.querySelector("[data-channel-handle]"),
  channelId: document.querySelector("[data-channel-id]"),
  channelStats: document.querySelector("[data-channel-stats]"),
  auditPanel: document.querySelector("[data-audit-panel]"),
  auditSummary: document.querySelector("[data-audit-summary]"),
  auditNotice: document.querySelector("[data-audit-notice]"),
  auditStatus: document.querySelector("[data-audit-status]"),
  grid: document.querySelector("[data-video-grid]"),
  search: document.querySelector("[data-video-search]"),
  visibility: document.querySelector("[data-visibility-filter]"),
  priority: document.querySelector("[data-priority-filter]"),
  runAudit: document.querySelector("[data-run-audit]"),
  refreshAudit: document.querySelector("[data-refresh-audit]"),
  exportDecisions: document.querySelector("[data-export-decisions]"),
  disconnect: document.querySelector("[data-disconnect]"),
  dialog: document.querySelector("[data-thumbnail-dialog]"),
  dialogContent: document.querySelector("[data-dialog-content]"),
  dialogClose: document.querySelector("[data-dialog-close]")
};

const DECISION_KEY = "tas-thumbnail-decisions-v1";
const state = {
  session: null,
  audit: null,
  proposals: { version: 1, updatedAt: null, videos: {} },
  filters: { search: "", visibility: "", priority: "" },
  decisions: loadDecisions()
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadDecisions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DECISION_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDecisions() {
  localStorage.setItem(DECISION_KEY, JSON.stringify(state.decisions));
}

function setDecision(videoId, decision, label = "") {
  state.decisions[videoId] = {
    decision,
    label,
    decidedAt: new Date().toISOString(),
    applied: false
  };
  saveDecisions();
  renderVideos();
  renderThumbnailDialog(videoId);
}

function number(value = 0) {
  return new Intl.NumberFormat("en-US", { notation: Number(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function date(value = "") {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function duration(seconds = 0) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = Math.floor(total % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
    : `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function percent(value = 0) {
  const amount = Number(value || 0);
  return amount ? `${amount.toFixed(amount >= 10 ? 1 : 2)}%` : "—";
}

function decisionLabel(videoId) {
  const decision = state.decisions[videoId];
  if (!decision) return { text: "Photo approval pending", value: "pending" };
  if (decision.decision === "keep") return { text: "Current photo approved", value: "keep" };
  if (decision.decision === "changes") return { text: "Changes requested", value: "changes" };
  if (decision.decision.startsWith("approve:")) return { text: `${decision.label || "Proposal"} approved for queue`, value: decision.decision };
  return { text: "Photo approval pending", value: "pending" };
}

function queryMessage() {
  const params = new URLSearchParams(location.search);
  if (params.get("connected") === "1") return "Alana — All Over the Place channel is connected in read-only mode.";
  const error = params.get("error");
  const messages = {
    cancelled: "Google authorization was cancelled. Nothing changed.",
    state: "The connection request expired or could not be verified. Please try again.",
    "wrong-channel": "The selected Google identity did not resolve to Alana — All Over the Place channel. Choose the account or Brand Account that controls @alanakvandeveer.",
    connection: "Google could not complete the connection. Confirm the OAuth settings, then try again.",
    oauth: "Google returned an authorization error. Nothing changed."
  };
  return error ? (messages[error] || "The connection was not completed.") : "";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function loadProposals() {
  try {
    const response = await fetch("/studio-console/thumbnail-proposals.json", { cache: "no-store" });
    const data = await response.json();
    if (data?.videos && typeof data.videos === "object") state.proposals = data;
  } catch {
    state.proposals = { version: 1, updatedAt: null, videos: {} };
  }
}

function renderSetup() {
  const session = state.session;
  if (!session) return;
  const message = queryMessage();

  if (!session.configured) {
    elements.connectionStatus.textContent = "Setup required";
    elements.connectionStatus.className = "console-status console-status-bad";
    elements.setupContent.innerHTML = `
      ${message ? `<div class="audit-notice">${escapeHtml(message)}</div>` : ""}
      <p>The private console is built, but Google has not been given the application credentials required to open the owner consent screen.</p>
      <div class="setup-grid">
        <div class="setup-step"><strong>1 · Google Cloud project</strong><p>Create or select <em>Alana — All Over the Place Studio</em>, then enable YouTube Data API v3 and YouTube Analytics API.</p></div>
        <div class="setup-step"><strong>2 · OAuth web client</strong><p>Create a Web application OAuth client and use this exact authorized redirect URI:<code class="setup-code">${escapeHtml(session.redirectUri)}</code></p></div>
        <div class="setup-step"><strong>3 · Private Vercel values</strong><p>Add the Client ID and Client Secret directly in Vercel. Never paste the Client Secret into chat or GitHub.</p></div>
        <div class="setup-step"><strong>4 · Read-only first</strong><p>The first consent requests only channel viewing and non-monetary analytics. It cannot edit photos or videos.</p></div>
      </div>`;
    return;
  }

  if (!session.connected) {
    elements.connectionStatus.textContent = session.reconnectRequired ? "Reconnect required" : "Ready to connect";
    elements.connectionStatus.className = session.reconnectRequired ? "console-status console-status-bad" : "console-status";
    elements.setupContent.innerHTML = `
      ${message ? `<div class="audit-notice">${escapeHtml(message)}</div>` : ""}
      <p>Google setup is ready. Connect only the account or Brand Account that controls <strong>@alanakvandeveer</strong>. The channel ID must match <code>${escapeHtml(session.expectedChannelId)}</code>.</p>
      <div class="setup-actions"><a class="console-button console-button-gold" href="/api/youtube-studio-auth">Connect Alana — All Over the Place read-only</a></div>`;
    return;
  }

  elements.connectionStatus.textContent = "Connected read-only";
  elements.connectionStatus.className = "console-status console-status-good";
  elements.setupContent.innerHTML = `
    ${message ? `<div class="audit-notice">${escapeHtml(message)}</div>` : ""}
    <p>The channel is connected with viewing and analytics permissions only. Thumbnail publishing, metadata editing, visibility changes, captions, and deletion remain unavailable.</p>`;
}

function renderChannel() {
  const session = state.session;
  const channel = session?.channel;
  const connected = Boolean(session?.connected && channel);
  elements.channelPanel.hidden = !connected;
  elements.disconnect.hidden = !connected;
  if (!connected) return;

  elements.channelTitle.textContent = channel.title || "Alana — All Over the Place";
  elements.channelHandle.textContent = channel.customUrl || "@alanakvandeveer";
  elements.channelId.textContent = channel.id;
  elements.channelStats.textContent = `${number(channel.subscriberCount)} subscribers · ${number(channel.videoCount)} public videos · ${number(channel.viewCount)} channel views`;
  elements.channelImage.src = channel.thumbnail || "/assets/favicon.svg";
  elements.channelImage.alt = `${channel.title || "Alana — All Over the Place"} channel image`;
}

function summaryMarkup(summary = {}) {
  const values = [
    [summary.total, "Inventory"],
    [summary.public, "Public"],
    [summary.private, "Private"],
    [summary.highPriority, "High priority"],
    [summary.potentialDuplicates, "Duplicate flags"]
  ];
  return values.map(([value, label]) => `<div class="audit-stat"><strong>${escapeHtml(number(value))}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function currentVideos() {
  const videos = state.audit?.videos || [];
  const search = state.filters.search.trim().toLowerCase();
  return videos.filter(video => {
    if (search && !`${video.title} ${video.videoId}`.toLowerCase().includes(search)) return false;
    if (state.filters.visibility && video.privacyStatus !== state.filters.visibility) return false;
    if (state.filters.priority && video.priority !== state.filters.priority) return false;
    return true;
  });
}

function cardMarkup(video) {
  const analytics = video.analytics || {};
  const photo = decisionLabel(video.videoId);
  const hasProposals = Boolean(state.proposals.videos?.[video.videoId]?.variants?.length);
  return `<article class="video-card" data-video-id="${escapeHtml(video.videoId)}">
    <div class="video-thumb"><img src="${escapeHtml(video.thumbnail)}" alt="Current thumbnail for ${escapeHtml(video.title)}" loading="lazy" decoding="async"><span class="video-duration">${escapeHtml(duration(video.durationSeconds))}</span></div>
    <div class="video-card-body">
      <div class="video-card-top">
        <div><h3>${escapeHtml(video.title)}</h3><p class="video-card-meta">${escapeHtml(date(video.publishedAt))} · ${escapeHtml(video.videoId)} · ${escapeHtml(video.uploadStatus)}</p></div>
        <div class="video-badges"><span class="visibility-badge">${escapeHtml(video.privacyStatus)}</span><span class="priority-badge" data-priority="${escapeHtml(video.priority)}">${escapeHtml(video.priority)}</span></div>
      </div>
      <div class="video-metrics">
        <div class="video-metric"><strong>${escapeHtml(number(video.dataApi?.views))}</strong><span>Current views</span></div>
        <div class="video-metric"><strong>${escapeHtml(duration(analytics.averageViewDuration))}</strong><span>Avg. view duration</span></div>
        <div class="video-metric"><strong>${escapeHtml(percent(analytics.averageViewPercentage))}</strong><span>Avg. viewed</span></div>
        <div class="video-metric"><strong>${escapeHtml(number(analytics.estimatedMinutesWatched))}</strong><span>Watch minutes</span></div>
      </div>
      <ul class="video-notes">${(video.notes || []).map(note => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
      <span class="photo-badge" data-decision="${escapeHtml(photo.value)}">${escapeHtml(photo.text)}</span>
      <div class="video-actions">
        <button class="console-button console-button-gold" type="button" data-review-thumbnail="${escapeHtml(video.videoId)}">${hasProposals ? "Review thumbnail options" : "Review current photo"}</button>
        <a class="console-button console-button-quiet" href="${escapeHtml(video.studioUrl)}" target="_blank" rel="noopener">Open in Studio</a>
        <a class="console-button console-button-quiet" href="${escapeHtml(video.watchUrl)}" target="_blank" rel="noopener">Open video</a>
      </div>
    </div>
  </article>`;
}

function renderVideos() {
  if (!state.audit) return;
  const videos = currentVideos();
  elements.auditStatus.textContent = `${videos.length} of ${state.audit.videos.length} video resources shown. Studio-only drafts may not appear until YouTube creates a video resource.`;
  elements.grid.innerHTML = videos.length
    ? videos.map(cardMarkup).join("")
    : `<div class="empty-state"><p>No video resources match these filters.</p></div>`;
  elements.grid.querySelectorAll("[data-review-thumbnail]").forEach(button => {
    button.addEventListener("click", () => openThumbnailDialog(button.dataset.reviewThumbnail));
  });
}

function renderAudit() {
  const audit = state.audit;
  elements.auditPanel.hidden = !audit;
  if (!audit) return;
  elements.auditSummary.innerHTML = summaryMarkup(audit.summary);
  const notices = [
    audit.analyticsNotice,
    ...(audit.limitations || [])
  ].filter(Boolean);
  elements.auditNotice.hidden = !notices.length;
  elements.auditNotice.innerHTML = notices.map(item => `<p>${escapeHtml(item)}</p>`).join("");
  renderVideos();
}

async function runAudit() {
  elements.auditPanel.hidden = false;
  elements.auditStatus.textContent = "Reading the channel inventory and non-monetary analytics…";
  elements.grid.innerHTML = `<div class="empty-state"><p>Preparing the owner review queue. Nothing is being changed.</p></div>`;
  elements.runAudit.disabled = true;
  elements.refreshAudit.disabled = true;
  try {
    state.audit = await request("/api/youtube-studio-audit");
    renderAudit();
  } catch (error) {
    elements.auditStatus.textContent = error.message;
    elements.grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(error.message)}</p></div>`;
  } finally {
    elements.runAudit.disabled = false;
    elements.refreshAudit.disabled = false;
  }
}

function proposalData(videoId) {
  return state.proposals.videos?.[videoId] || { variants: [] };
}

function thumbnailOption({ video, imageUrl, label, id, source, faceAltered, text, note, current = false }) {
  const safeId = current ? "current" : id;
  const canApprove = current || faceAltered === false;
  const decision = current ? "keep" : `approve:${safeId}`;
  const buttonLabel = current ? "Keep current photo" : `Approve ${label}`;
  return `<article class="thumbnail-option">
    <h3>${escapeHtml(label)}</h3>
    <div class="thumbnail-option-grid">
      <div class="thumbnail-full"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)} thumbnail for ${escapeHtml(video.title)}"></div>
      <div class="thumbnail-mobile-preview"><img src="${escapeHtml(imageUrl)}" alt="" aria-hidden="true"><strong>${escapeHtml(video.title)}</strong><span>Alana — All Over the Place</span></div>
    </div>
    <p class="thumbnail-option-meta"><strong>Source:</strong> ${escapeHtml(source || (current ? "Current YouTube thumbnail" : "Editorial proposal"))}<br><strong>AI face alteration:</strong> ${current ? "Not assessed by this console" : (faceAltered === false ? "None" : "Not verified — approval disabled")}${text ? `<br><strong>Headline:</strong> ${escapeHtml(text)}` : ""}${note ? `<br>${escapeHtml(note)}` : ""}</p>
    <div class="thumbnail-option-actions"><button class="console-button ${canApprove ? "console-button-gold" : "console-button-quiet"}" type="button" data-thumbnail-decision="${escapeHtml(decision)}" data-thumbnail-label="${escapeHtml(label)}" ${canApprove ? "" : "disabled"}>${escapeHtml(buttonLabel)}</button></div>
  </article>`;
}

function renderThumbnailDialog(videoId) {
  const video = state.audit?.videos?.find(item => item.videoId === videoId);
  if (!video) return;
  const proposal = proposalData(videoId);
  const variants = Array.isArray(proposal.variants) ? proposal.variants : [];
  const existing = decisionLabel(videoId);

  elements.dialogContent.innerHTML = `<div class="dialog-inner">
    <p class="console-kicker">INDIVIDUAL PHOTO APPROVAL</p>
    <h2 id="thumbnail-dialog-title">${escapeHtml(video.title)}</h2>
    <p>No click in this window changes YouTube. Your decision is saved only to this private browser review queue until a separate publishing permission and final confirmation are added later.</p>
    <p><span class="photo-badge" data-decision="${escapeHtml(existing.value)}">${escapeHtml(existing.text)}</span></p>
    <div class="thumbnail-options">
      ${thumbnailOption({ video, imageUrl: video.thumbnail, label: "Current thumbnail", current: true, source: "Current YouTube thumbnail" })}
      ${variants.map(variant => thumbnailOption({ video, ...variant })).join("")}
      ${variants.length ? "" : `<div class="empty-state"><p>No alternate thumbnail has been placed in the approval registry yet. You may approve the current photo or request a new design.</p></div>`}
    </div>
    <div class="thumbnail-option-actions">
      <button class="console-button console-button-quiet" type="button" data-thumbnail-decision="changes" data-thumbnail-label="Request changes">Request a new design</button>
      <button class="console-button console-button-danger" type="button" data-clear-decision>Clear decision</button>
    </div>
  </div>`;

  elements.dialogContent.querySelectorAll("[data-thumbnail-decision]").forEach(button => {
    button.addEventListener("click", () => setDecision(videoId, button.dataset.thumbnailDecision, button.dataset.thumbnailLabel));
  });
  elements.dialogContent.querySelector("[data-clear-decision]")?.addEventListener("click", () => {
    delete state.decisions[videoId];
    saveDecisions();
    renderVideos();
    renderThumbnailDialog(videoId);
  });
}

function openThumbnailDialog(videoId) {
  renderThumbnailDialog(videoId);
  if (typeof elements.dialog.showModal === "function") elements.dialog.showModal();
}

function closeThumbnailDialog() {
  if (elements.dialog.open) elements.dialog.close();
}

function exportDecisions() {
  const payload = {
    exportedAt: new Date().toISOString(),
    channelId: state.session?.channel?.id || "UC8sZK_EKbcuCBMquG_C30Sw",
    mode: "approval-queue-only",
    canApplyToYouTube: false,
    decisions: Object.entries(state.decisions).map(([videoId, decision]) => ({
      videoId,
      title: state.audit?.videos?.find(video => video.videoId === videoId)?.title || "",
      ...decision
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `the-alana-show-thumbnail-decisions-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function disconnect() {
  if (!window.confirm("Disconnect the private read-only YouTube session? No channel content will change.")) return;
  try {
    await request("/api/youtube-studio-disconnect", { method: "POST" });
  } finally {
    state.session = null;
    state.audit = null;
    location.assign("/studio-console?disconnected=1");
  }
}

async function initialize() {
  await loadProposals();
  try {
    state.session = await request("/api/youtube-studio-session");
  } catch (error) {
    state.session = {
      configured: false,
      connected: false,
      redirectUri: "https://thealanashow.com/api/youtube-studio-callback",
      expectedChannelId: "UC8sZK_EKbcuCBMquG_C30Sw",
      error: error.message
    };
  }
  renderSetup();
  renderChannel();
  if (state.session.connected) await runAudit();
}

elements.runAudit?.addEventListener("click", runAudit);
elements.refreshAudit?.addEventListener("click", runAudit);
elements.exportDecisions?.addEventListener("click", exportDecisions);
elements.disconnect?.addEventListener("click", disconnect);
elements.dialogClose?.addEventListener("click", closeThumbnailDialog);
elements.dialog?.addEventListener("click", event => { if (event.target === elements.dialog) closeThumbnailDialog(); });
elements.search?.addEventListener("input", event => { state.filters.search = event.target.value; renderVideos(); });
elements.visibility?.addEventListener("change", event => { state.filters.visibility = event.target.value; renderVideos(); });
elements.priority?.addEventListener("change", event => { state.filters.priority = event.target.value; renderVideos(); });
window.addEventListener("keydown", event => { if (event.key === "Escape") closeThumbnailDialog(); });

initialize();
