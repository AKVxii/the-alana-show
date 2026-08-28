const SITE = { youtubeApiEndpoint: "/api/youtube", contactApiEndpoint: "/api/contact" };

const menuButton = document.querySelector(".menu-toggle");
const nav = document.getElementById("site-nav");
menuButton?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
});
nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open"); document.body.classList.remove("menu-open"); menuButton.setAttribute("aria-expanded", "false");
}));
document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll("[data-inquiry]").forEach(link => link.addEventListener("click", () => {
  const select = document.getElementById("inquiry");
  if ([...select.options].some(o => o.value === link.dataset.inquiry)) select.value = link.dataset.inquiry;
}));

const formatDate = value => value ? new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(value)) : "";
const formatViews = value => Number.isFinite(Number(value)) ? `${new Intl.NumberFormat("en-US", {notation:"compact",maximumFractionDigits:1}).format(Number(value))} views` : "";
const escapeHtml = (value="") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);

function setFeatured(episode){
  if(!episode?.videoId) return;
  document.getElementById("featured-video").src=`https://www.youtube-nocookie.com/embed/${episode.videoId}?rel=0`;
  document.getElementById("featured-title").textContent=episode.title||"Featured Conversation";
  document.getElementById("featured-description").textContent=episode.description||"A featured conversation from Alana — All Over the Place.";
  document.getElementById("featured-stats").textContent=[formatDate(episode.publishedAt),formatViews(episode.viewCount)].filter(Boolean).join(" · ");
  document.getElementById("featured-link").href=`https://www.youtube.com/watch?v=${episode.videoId}`;
}
function renderRecent(episodes=[]){
  const rail=document.getElementById("recent-episodes");
  const valid=episodes.filter(e=>e?.videoId).slice(0,8);
  if(!valid.length) return;
  rail.innerHTML="";
  valid.forEach(e=>{
    const url=`https://www.youtube.com/watch?v=${encodeURIComponent(e.videoId)}`;
    const card=document.createElement("article");
    card.className="episode-card";
    card.innerHTML=`<a href="${url}" target="_blank" rel="noopener"><img src="${escapeHtml(e.thumbnail||"")}" alt="" loading="lazy"></a><div class="episode-card-body"><div class="episode-meta">${escapeHtml(formatDate(e.publishedAt))}</div><h3>${escapeHtml(e.title||"Alana — All Over the Place")}</h3><p>${escapeHtml((e.description||"").slice(0,125))}${(e.description||"").length>125?"…":""}</p><a class="text-link" href="${url}" target="_blank" rel="noopener">Watch conversation →</a></div>`;
    rail.appendChild(card);
  });
}
async function loadYouTube(){
  try{const r=await fetch(SITE.youtubeApiEndpoint,{headers:{Accept:"application/json"}});if(!r.ok)return;const d=await r.json();setFeatured(d.mostWatched||d.latest);renderRecent(d.recent);}catch(e){console.info("Manual episode fallback active.")}
}

const form=document.getElementById("contact-form");
const status=document.getElementById("form-status");
form?.addEventListener("submit",async e=>{
  e.preventDefault();status.textContent="";
  const data=Object.fromEntries(new FormData(form).entries());
  if(!data.name||!data.email||!data.inquiry||!data.message){status.textContent="Please complete the required fields.";return}
  const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent="Sending…";
  try{const r=await fetch(SITE.contactApiEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw new Error(result.error);form.reset();status.textContent="Thank you. Your inquiry has been sent to Alana — All Over the Place."}catch(err){status.textContent="We couldn’t send the form. Please email alana@alanakvandeveer.com."}finally{button.disabled=false;button.textContent="Send Inquiry"}
});

const observer="IntersectionObserver" in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12}):null;
document.querySelectorAll("[data-reveal]").forEach(el=>observer?observer.observe(el):el.classList.add("visible"));
const hero=document.querySelector(".hero");hero?.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect();hero.style.setProperty("--mx",`${(e.clientX-r.left)/r.width*100}%`);hero.style.setProperty("--my",`${(e.clientY-r.top)/r.height*100}%`)});
const tilt=document.querySelector("[data-tilt]");if(tilt&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&matchMedia("(pointer:fine)").matches){tilt.addEventListener("pointermove",e=>{const r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform=`perspective(1100px) rotateY(${x*2}deg) rotateX(${y*-2}deg)`});tilt.addEventListener("pointerleave",()=>tilt.style.transform="")}
loadYouTube();
