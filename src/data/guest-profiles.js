export const guestProfiles = {
  "george-lemieux": {
    role: "Former U.S. Senator · Chairman of Gunster’s Board of Directors · Founder and Chair, LeMieux Center for Public Policy",
    organization: {
      name: "Gunster",
      url: "https://www.gunster.com/people/george-s-lemieux"
    },
    summary: "George S. LeMieux served as Florida’s 34th United States Senator in the 111th Congress and chairs Gunster’s Board of Directors. He founded and chairs the LeMieux Center for Public Policy at Palm Beach Atlantic University, which brings students and the wider community together for reasoned dialogue on public policy, leadership and civic life.",
    officialUrl: "https://www.gunster.com/people/george-s-lemieux",
    sameAs: [
      "https://www.gunster.com/people/george-s-lemieux",
      "https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/",
      "https://www.pba.edu/academics/schools/centers-of-excellence/lemieux/staff/"
    ]
  },
  "ric-bradshaw": {
    role: "Sheriff of Palm Beach County · U.S. Marine Corps veteran",
    organization: {
      name: "Palm Beach County Sheriff’s Office",
      url: "https://www.pbso.org/inside-pbso/general/executive-staff"
    },
    summary: "Sheriff Ric Bradshaw leads the Palm Beach County Sheriff’s Office and has served in law enforcement for more than five decades, including as West Palm Beach Chief of Police before becoming sheriff in 2005.",
    officialUrl: "https://www.pbso.org/inside-pbso/general/executive-staff",
    sameAs: ["https://www.pbso.org/inside-pbso/general/executive-staff"]
  },
  "ashley-vertuno": {
    role: "Chief Executive Officer · HCA Florida JFK North Hospital",
    organization: {
      name: "HCA Florida JFK North Hospital",
      url: "https://www.hcafloridahealthcare.com/locations/jfk-north-hospital/about-us"
    },
    summary: "Ashley Vertuno, FACHE, is Chief Executive Officer of HCA Florida JFK North Hospital in West Palm Beach, leading the hospital’s clinical, operational and community mission.",
    officialUrl: "https://www.hcafloridahealthcare.com/locations/jfk-north-hospital/about-us",
    sameAs: ["https://www.hcafloridahealthcare.com/locations/jfk-north-hospital/about-us"]
  },
  "scott-diament": {
    role: "Co-Founder · Provident Jewelry and Palm Beach Show Group",
    organization: {
      name: "Provident Jewelry & Fine Art",
      url: "https://new.providentfineart.com/our-team/"
    },
    summary: "Scott Diament is a Graduate Gemologist and entrepreneur who co-founded Provident Jewelry in 1993 and Palm Beach Show Group in 2001, with work spanning jewelry, fine art, events and real estate.",
    officialUrl: "https://new.providentfineart.com/our-team/",
    sameAs: [
      "https://new.providentfineart.com/our-team/",
      "https://www.palmbeachshowgroup.com/about-palm-beach-show-group/"
    ]
  },
  "gillian-lieberman": {
    role: "Director of Real Estate Sales Operations · Provident Jewelry & Fine Art",
    organization: {
      name: "Provident Jewelry & Fine Art",
      url: "https://new.providentfineart.com/our-team/"
    },
    summary: "Gillian Lieberman serves as Director of Real Estate Sales Operations for Provident Jewelry & Fine Art, specializing in Palm Beach and surrounding luxury real estate markets.",
    officialUrl: "https://new.providentfineart.com/our-team/",
    sameAs: ["https://new.providentfineart.com/our-team/"]
  },
  "diana-davis": {
    role: "Founder · CEO · Producer, Movies Making A Difference",
    organization: {
      name: "Movies Making A Difference",
      url: "https://moviesmakingadifference.org/about/"
    },
    summary: "Diana Davis is the founder, CEO and producer of Movies Making A Difference, a nonprofit using socially conscious films to raise awareness of human trafficking and support survivors.",
    officialUrl: "https://moviesmakingadifference.org/about/",
    sameAs: ["https://moviesmakingadifference.org/about/"]
  },
  "john-rourke": {
    role: "Founder · We Fund the Blue Foundation · U.S. Army veteran",
    organization: {
      name: "We Fund the Blue Foundation",
      url: "https://wefundtheblue.com/"
    },
    summary: "John Rourke is a retired U.S. Army Staff Sergeant and founder of We Fund the Blue Foundation, leading service projects supporting law enforcement, military members, first responders and communities.",
    officialUrl: "https://wefundtheblue.com/",
    sameAs: ["https://wefundtheblue.com/"]
  },
  "matthew-yeandle": {
    role: "Photographer · Artist · Emmy Award-winning hair professional",
    summary: "Matthew Yeandle is a photographer, artist, hair and makeup professional whose official résumé includes fashion, editorial, television, music and celebrity work and a 2002 Emmy Award-winning hair team credit for As the World Turns.",
    officialUrl: "https://www.beautybymattmedia.com/resume",
    sameAs: [
      "https://www.beautybymattmedia.com/",
      "https://www.beautybymattmedia.com/resume"
    ]
  },
  "nick-cannon": {
    role: "Chief Operating Officer · Wounded Veterans Relief Fund · U.S. Air Force veteran",
    organization: {
      name: "Wounded Veterans Relief Fund",
      url: "https://wvrf.org/about-us/"
    },
    summary: "Nick Cannon, ACNP, is Chief Operating Officer of the Wounded Veterans Relief Fund and a U.S. Air Force veteran helping deliver financial and dental assistance to wounded and disabled veterans across Florida.",
    officialUrl: "https://wvrf.org/about-us/",
    sameAs: ["https://wvrf.org/about-us/"]
  },
  "jason-mandle": {
    role: "Executive Director · Restoration Bridge International · U.S. Navy veteran",
    organization: {
      name: "Restoration Bridge International",
      url: "https://www.restorationbridge.com/team/jason/"
    },
    summary: "Jason Mandle is Executive Director of Restoration Bridge International and a U.S. Navy veteran whose professional background includes operations management, logistics and community service.",
    officialUrl: "https://www.restorationbridge.com/team/jason/",
    sameAs: ["https://www.restorationbridge.com/team/jason/"]
  },
  "michael-castellano": {
    role: "Founder · Engajer",
    organization: {
      name: "Engajer",
      url: "https://engajer.com/"
    },
    summary: "Michael Castellano founded Engajer, an interactive-video technology company focused on digital engagement, and has appeared across multiple The Alana Show conversations on technology, AI, healthcare and cybersecurity.",
    officialUrl: "https://old.engajer.com/press-detail/engajer-is-first-technology-to-enable-users-to-embed-interactive-videos-in-facebook/",
    sameAs: [
      "https://engajer.com/",
      "https://old.engajer.com/press-detail/engajer-is-first-technology-to-enable-users-to-embed-interactive-videos-in-facebook/"
    ]
  }
};

export function guestProfileById(id) {
  return guestProfiles[id] || null;
}
