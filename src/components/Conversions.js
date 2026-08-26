import { icon } from "../lib/icons.js";

const cards = [
  {
    number: "01",
    title: "Watch George LeMieux",
    copy: "The featured conversation on leadership, public service, civic responsibility, and Florida's future.",
    href: "#watch",
    className: "conversion-card-featured",
    label: "Watch the featured George LeMieux conversation"
  },
  {
    number: "02",
    title: "2026 Candidate Interviews",
    copy: "Review the paid 30-minute media package and request a tentative studio time. Candidate conversations will be added after the first verified episode publishes.",
    href: "/candidates",
    className: "conversion-card-candidates",
    label: "View candidate interview details and scheduling"
  },
  {
    number: "03",
    title: "Advertise & Partner",
    copy: "Explore clearly identified opportunities across radio, video, podcast, and web, with editorial independence preserved.",
    href: "/advertise",
    className: "conversion-card-partner",
    label: "Explore advertising and partnership opportunities"
  }
];

export function Conversions() {
  return `
    <section class="conversion-section" aria-label="Start here">
      <div class="shell conversion-grid conversion-grid-three" data-home-pathways>
        ${cards.map(({ number, title, copy, href, className, label }, index) => `
          <a class="conversion-card ${className} reveal" style="--delay:${index * 55}ms" href="${href}" aria-label="${label}">
            <span>${number}</span>
            <strong>${title}</strong>
            <small>${copy}</small>
            ${icon("arrow")}
          </a>
        `).join("")}
      </div>
    </section>
  `;
}
