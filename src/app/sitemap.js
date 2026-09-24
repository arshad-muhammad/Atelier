import { query } from "../utils/db-sql";

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://atelier.spherehive.com";
  const now = new Date().toISOString();

  // Primary static public pages
  const staticPages = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/courses`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/resume-checker`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic course pages from the database
  let coursePages = [];
  try {
    const courses = await query("SELECT id, updated_at FROM atelier_courses");
    coursePages = courses.map((course) => ({
      url: `${siteUrl}/courses/${course.id}`,
      lastModified: course.updated_at ? new Date(course.updated_at).toISOString() : now,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch (e) {
    console.error("Sitemap: Failed to fetch dynamic courses:", e.message);
  }

  return [...staticPages, ...coursePages];
}
