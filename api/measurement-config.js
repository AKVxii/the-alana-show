const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const candidate = String(process.env.GOOGLE_ANALYTICS_ID || "").trim();
  const gaMeasurementId = GA_MEASUREMENT_ID_PATTERN.test(candidate) ? candidate : "";

  return res.status(200).json({
    googleAnalyticsEnabled: Boolean(gaMeasurementId),
    gaMeasurementId
  });
};
