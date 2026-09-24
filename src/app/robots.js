export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://atelier.spherehive.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/courses",
          "/courses/*",
          "/resume-checker",
          "/contact",
          "/privacy-policy",
          "/refund-policy",
          "/terms"
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/mentor",
          "/mentor/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*"
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/courses",
          "/courses/*",
          "/resume-checker",
          "/contact",
          "/privacy-policy",
          "/refund-policy",
          "/terms"
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/mentor",
          "/mentor/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*"
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
