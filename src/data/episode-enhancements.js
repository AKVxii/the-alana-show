export const episodeEnhancements = {
  "george-lemieux": {
    description: [
      "Former U.S. Senator George LeMieux joins Alana K. Vandeveer for a conversation about principled leadership, public service, fiscal discipline, civic dialogue, and Florida’s future.",
      "LeMieux traces his interest in public service to Ronald Reagan and the Iranian hostage crisis, then reflects on building consensus, breaking through government bureaucracy, and listening across political divides.",
      "He also discusses the difficult decision not to pursue another Senate run, the work of the LeMieux Center for Public Policy, his warning about federal debt, and why character must come before political convenience.",
      "Hosted by Alana K. Vandeveer, Alana — All Over the Place features real conversations and distinct voices from business, leadership, public service, culture, and community.",
      "Alana — All Over the Place — Real Conversations. Distinct Voices."
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
    ],
    guide: [
      {
        question: "What first drew George LeMieux to public service?",
        answer: "LeMieux says the Iranian hostage crisis and Ronald Reagan’s inauguration shaped his early belief that public service could solve problems when leaders approached it with a servant’s heart and the tools to act.",
        startSeconds: 73
      },
      {
        question: "What does he say effective leadership requires?",
        answer: "Drawing on his work in Florida government, LeMieux describes leadership as disciplined work: setting priorities, building consensus, maintaining relationships, and persisting through institutions that are often designed to resist change.",
        startSeconds: 246
      },
      {
        question: "Why does listening across political differences matter?",
        answer: "LeMieux argues that people learn little from circles that only reinforce their existing opinions. He says a constitutional republic depends on citizens listening without abandoning their core values and working toward constructive solutions.",
        startSeconds: 572
      },
      {
        question: "What was his hardest political decision?",
        answer: "He identifies the decision not to continue pursuing a return to the U.S. Senate. He describes weighing public-service goals against responsibilities to his family and business, and says the choice opened space for other forms of civic work.",
        startSeconds: 771
      },
      {
        question: "What role does the LeMieux Center play?",
        answer: "He presents the Center as a place for students and the public to engage leaders, examine public policy, and practice reasoned dialogue. He also describes the Freidheim Fellows program and the alumni paths that have grown from it.",
        startSeconds: 1133
      },
      {
        question: "What warning does he give about federal debt?",
        answer: "LeMieux describes federal debt and rising interest costs as the country’s most urgent fiscal challenge. His comments are a policy argument made in the interview, and he calls for spending restraint, closer oversight, and greater accountability for public money.",
        startSeconds: 1351
      },
      {
        question: "How does he define character in leadership?",
        answer: "He says character means following conscience and doing what is right even when it is politically inconvenient. He illustrates the point with a Senate vote supporting a small-business lending measure despite pressure from his own party.",
        startSeconds: 1669
      }
    ],
    related: [
      {
        id: "ric-bradshaw",
        title: "A Legacy of Service with Sheriff Ric Bradshaw",
        description: "A conversation about public safety, community-first leadership, and a career of service."
      },
      {
        id: "stacey-ibarra-vaughn-mitchell",
        title: "Safeguarding Yourself from Cybercrime and Fraud",
        description: "A practical discussion of fraud prevention, cybercrime, and protecting South Florida families."
      },
      {
        id: "celeste-ellich-bob-sutton",
        title: "Equipping the Next Generation of Leaders",
        description: "A conversation about civic responsibility, accountability, and preparing future leaders to serve."
      }
    ]
  }
};

export function episodeEnhancementById(id) {
  return episodeEnhancements[id] || null;
}
