export const episodeEnhancements = {
  "george-lemieux": {
    description: [
      "Former U.S. Senator George LeMieux joins Alana K. Vandeveer for a conversation about principled leadership, public service, fiscal discipline, civic dialogue, and Florida’s future.",
      "LeMieux traces his interest in public service to Ronald Reagan and the Iranian hostage crisis, then reflects on building consensus, breaking through government bureaucracy, and listening across political divides.",
      "He also discusses the difficult decision not to pursue another Senate run, the work of the LeMieux Center for Public Policy, his warning about federal debt, and why character must come before political convenience.",
      "Hosted by Alana K. Vandeveer, The Alana Show features real conversations and distinct voices from business, leadership, public service, culture, and community.",
      "The Alana Show — Real Conversations. Distinct Voices."
    ],
    highlights: [
      "How the Iranian hostage crisis and Ronald Reagan shaped LeMieux’s interest in public service.",
      "Why consensus, persistence, and listening across political divides matter in leadership.",
      "The difficult choice not to pursue another Senate run and how it redirected his work.",
      "His warning about federal debt, fiscal discipline, and accountability for public spending.",
      "Why character and doing what is right can matter more than political convenience."
    ],
    chapters: [
      { title: "Introduction", startSeconds: 0, endSeconds: 73 },
      { title: "What Inspired a Life in Public Service", startSeconds: 73, endSeconds: 246 },
      { title: "Leadership Behind the Scenes", startSeconds: 246, endSeconds: 370 },
      { title: "Breaking Through Government Bureaucracy", startSeconds: 370, endSeconds: 437 },
      { title: "Influence Over Attention", startSeconds: 437, endSeconds: 572 },
      { title: "Listening Across Political Divides", startSeconds: 572, endSeconds: 771 },
      { title: "The Hardest Political Decision", startSeconds: 771, endSeconds: 1031 },
      { title: "Just Ask George LeMieux", startSeconds: 1031, endSeconds: 1133 },
      { title: "The LeMieux Center for Public Policy", startSeconds: 1133, endSeconds: 1261 },
      { title: "Preparing the Next Generation", startSeconds: 1261, endSeconds: 1351 },
      { title: "America’s Debt and Fiscal Discipline", startSeconds: 1351, endSeconds: 1669 },
      { title: "Why Character Is Everything", startSeconds: 1669, endSeconds: 1799 },
      { title: "Legacy, Florida and Never Giving Up", startSeconds: 1799, endSeconds: 1881 }
    ]
  }
};

export function episodeEnhancementById(id) {
  return episodeEnhancements[id] || null;
}
