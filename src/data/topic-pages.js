export const topicPages = [
  {
    id: "leadership",
    name: "Leadership",
    title: "Leadership Conversations",
    description: "Explore leadership interviews from The Alana Show about responsibility, decision-making, resilience, service, and leading through action.",
    intro: "Leadership is more than a title. These conversations explore how people make difficult decisions, build trust, carry responsibility, and keep moving when the stakes are real.",
    heading: "Leadership in practice, not theory."
  },
  {
    id: "community",
    name: "Community",
    title: "Community Conversations",
    description: "Explore The Alana Show conversations with South Florida leaders, organizations, advocates, entrepreneurs, and people strengthening their communities.",
    intro: "Community is where ideas become action. Hear from people and organizations working on the ground, building stronger neighborhoods, solving local problems, and creating meaningful impact.",
    heading: "Local voices. Real work. Wider impact."
  },
  {
    id: "business",
    name: "Business",
    title: "Business & Entrepreneurship Conversations",
    description: "Business and entrepreneurship interviews from The Alana Show covering ownership, growth, innovation, resilience, customer experience, and building something that lasts.",
    intro: "Behind every business is a set of decisions, risks, relationships, and lessons. These conversations go inside the work of building, adapting, leading, and creating value.",
    heading: "How people build, adapt, and grow."
  },
  {
    id: "public-service",
    name: "Public Service",
    title: "Public Service Conversations",
    description: "Explore public service interviews from The Alana Show with civic leaders, veterans, law enforcement professionals, public officials, and community servants.",
    intro: "Public service takes many forms. These conversations focus on responsibility, civic life, public safety, veterans, institutions, and the people who choose to serve others.",
    heading: "Service, responsibility, and public life."
  },
  {
    id: "faith-purpose",
    name: "Faith & Purpose",
    title: "Faith & Purpose Conversations",
    description: "Explore conversations from The Alana Show about faith, calling, perseverance, conviction, purpose, and the experiences that shape how people move forward.",
    intro: "Purpose often becomes clearest through challenge, conviction, and the choices people make when the path is uncertain. These conversations explore the beliefs and experiences that give direction to a life.",
    heading: "Conviction, calling, and the road forward."
  },
  {
    id: "wellness",
    name: "Wellness",
    title: "Wellness Conversations",
    description: "Explore wellness conversations from The Alana Show about healthcare, fitness, resilience, performance, personal safety, recovery, and living well.",
    intro: "Wellness is physical, mental, practical, and personal. These conversations bring together healthcare leaders, coaches, advocates, athletes, and experts working to help people live stronger lives.",
    heading: "Health, resilience, performance, and care."
  },
  {
    id: "technology",
    name: "Technology",
    title: "Technology Conversations",
    description: "Explore technology interviews from The Alana Show covering artificial intelligence, cybersecurity, fraud prevention, digital engagement, innovation, and emerging tools.",
    intro: "Technology changes quickly; the human consequences matter just as much as the tools. These conversations examine innovation, AI, cybersecurity, digital risk, and how technology is reshaping everyday life.",
    heading: "Innovation with real-world consequences."
  },
  {
    id: "stepping-up",
    name: "Stepping Up",
    title: "Stepping Up",
    description: "Meet people on The Alana Show who saw a need, took responsibility, and stepped up to serve their communities, country, organizations, or neighbors.",
    intro: "Some stories begin with a simple decision: somebody has to do something. Stepping Up highlights people who chose action over indifference and turned responsibility into service.",
    heading: "People who chose to act."
  }
];

export function topicPageById(id) {
  return topicPages.find(topic => topic.id === id);
}

export function topicHref(name) {
  if (name === "2026 Candidates Special") return "/specials/";
  const page = topicPages.find(topic => topic.name === name);
  return page ? `/topics/${page.id}/` : `/episodes/?topic=${encodeURIComponent(name)}`;
}
