const sharp = require("sharp");

const WIDTH = 1200;
const HEIGHT = 630;

function svg() {
  const skyline = [
    [120, 338, 28, 94], [154, 312, 34, 120], [198, 330, 26, 102],
    [232, 286, 42, 146], [282, 318, 30, 114], [324, 300, 36, 132],
    [369, 336, 24, 96], [401, 320, 34, 112], [443, 343, 22, 89],
    [477, 328, 28, 104], [516, 349, 20, 83], [543, 339, 26, 93]
  ].map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#527f9e" opacity=".66"/>`).join("");

  const palmLeaves = [
    "M92 110 C25 95, 4 50, -10 20",
    "M92 110 C42 74, 40 24, 45 -15",
    "M92 110 C80 62, 96 17, 125 -20",
    "M92 110 C115 68, 152 35, 196 24",
    "M92 110 C128 89, 177 82, 224 94",
    "M92 110 C50 105, 21 126, -18 153",
    "M92 110 C112 126, 148 150, 185 183"
  ].map(d => `<path d="${d}" fill="none" stroke="#8b6422" stroke-width="13" stroke-linecap="round" opacity=".78"/>`).join("");

  const globe = [70,120,170,220].map(r => `<circle cx="932" cy="190" r="${r}" fill="none" stroke="#c69a43" stroke-width="2" opacity=".24"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bfe3f7"/>
        <stop offset=".45" stop-color="#eaf6fb"/>
        <stop offset=".68" stop-color="#fff0d2"/>
        <stop offset="1" stop-color="#acd5eb"/>
      </linearGradient>
      <radialGradient id="sun" cx=".48" cy=".63" r=".32">
        <stop offset="0" stop-color="#fffef8"/>
        <stop offset=".18" stop-color="#ffe3a0"/>
        <stop offset=".52" stop-color="#f4c86a" stop-opacity=".32"/>
        <stop offset="1" stop-color="#f4c86a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d8edf8" stop-opacity=".55"/>
        <stop offset="1" stop-color="#77b8dc" stop-opacity=".48"/>
      </linearGradient>
      <linearGradient id="mic" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5b3c18"/>
        <stop offset=".35" stop-color="#e5bb67"/>
        <stop offset=".62" stop-color="#9a6928"/>
        <stop offset="1" stop-color="#3d2813"/>
      </linearGradient>
    </defs>

    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
    <rect y="414" width="${WIDTH}" height="216" fill="url(#water)"/>
    <ellipse cx="586" cy="386" rx="430" ry="230" fill="url(#sun)"/>

    <g opacity=".88">
      <path d="M75 430 C78 342, 82 260, 92 110" fill="none" stroke="#8b6422" stroke-width="22" stroke-linecap="round"/>
      ${palmLeaves}
    </g>

    <g>${skyline}</g>
    <path d="M94 435 H1115" stroke="#fffaf1" stroke-width="3" opacity=".7"/>
    <path d="M60 472 C280 452, 458 498, 684 472 S1005 453, 1170 480" fill="none" stroke="#ffffff" stroke-width="3" opacity=".32"/>
    <path d="M40 520 C244 492, 440 540, 650 515 S983 490, 1177 526" fill="none" stroke="#ffffff" stroke-width="2" opacity=".28"/>

    <g>${globe}</g>
    <path d="M754 190 H1110 M932 12 V368 M770 105 C858 150,1006 150,1095 104 M770 275 C858 230,1006 230,1095 276"
      fill="none" stroke="#c69a43" stroke-width="2" opacity=".20"/>

    <g transform="translate(1038 230)">
      <rect x="0" y="0" width="82" height="150" rx="38" fill="url(#mic)" stroke="#4b3218" stroke-width="3"/>
      <g stroke="#2f2112" stroke-width="5" opacity=".68">
        <path d="M12 26 H70"/><path d="M9 48 H73"/><path d="M8 70 H74"/>
        <path d="M9 92 H73"/><path d="M12 114 H70"/>
      </g>
      <path d="M41 149 V220" stroke="#6a451d" stroke-width="11"/>
      <ellipse cx="41" cy="226" rx="53" ry="10" fill="#8f6128"/>
      <path d="M-38 50 H120 M-25 72 H107 M-10 94 H92" stroke="#c69a43" stroke-width="2" opacity=".32"/>
    </g>

    <g text-anchor="middle">
      <text x="600" y="252" fill="#9a6f22" font-family="Georgia, Times New Roman, serif" font-size="70" font-weight="700" letter-spacing="1">THE ALANA SHOW</text>
      <text x="600" y="309" fill="#173550" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="7">REAL CONVERSATIONS. DISTINCT VOICES.</text>
    </g>

    <rect x="12" y="12" width="1176" height="606" fill="none" stroke="#c69a43" stroke-width="3"/>
    <rect x="20" y="20" width="1160" height="590" fill="none" stroke="#8b6422" stroke-width="1.5" opacity=".75"/>
  </svg>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  try {
    const image = await sharp(Buffer.from(svg()))
      .jpeg({ quality: 90, chromaSubsampling: "4:4:4", progressive: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", String(image.length));
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=31536000, immutable");
    return req.method === "HEAD" ? res.status(200).end() : res.status(200).send(image);
  } catch (error) {
    console.error("Social card render failed", error);
    return res.status(500).end();
  }
};
