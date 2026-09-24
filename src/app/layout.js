import { Inter, Outfit, Manrope } from "next/font/google";
import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";
import AnalyticsTracker from "../components/AnalyticsTracker";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://atelier.spherehive.com";

export const metadata = {
  title: {
    default: "Atelier - A Sphere Hive Academy | Build Skills Companies Actually Hire For",
    template: "%s | Atelier - A Sphere Hive Academy",
  },
  description:
    "Atelier, a Sphere Hive Academy, is India's most immersive coding school. Learn full-stack development, system design & DSA through live cohorts, real-world projects, and 1:1 mentorship from industry veterans. Join 1500+ students placed at Google, Microsoft, Amazon & more.",
  keywords: [
    "Atelier",
    "Sphere Hive",
    "coding school",
    "full stack development",
    "system design course",
    "DSA course",
    "live coding classes",
    "web development bootcamp",
    "software engineering",
    "coding bootcamp India",
    "learn programming",
    "job ready cohort",
    "placement guarantee",
    "MERN stack",
    "React course",
    "Node.js course",
    "interview preparation",
    "competitive programming",
    "tech career",
    "online coding classes",
  ],
  authors: [{ name: "Sphere Hive Academy", url: SITE_URL }],
  creator: "Sphere Hive Academy",
  publisher: "Sphere Hive Academy",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Atelier - A Sphere Hive Academy",
    title: "Atelier - A Sphere Hive Academy | Build Skills Companies Actually Hire For",
    description:
      "Atelier, a Sphere Hive Academy - India's most immersive coding school. Live cohorts, real-world projects, 1:1 mentorship. 1500+ students placed at top tech companies.",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Atelier - A Sphere Hive Academy: Build Skills Companies Actually Hire For",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier - A Sphere Hive Academy | Build Skills Companies Actually Hire For",
    description:
      "Atelier, a Sphere Hive Academy - India's most immersive coding school. Live cohorts, real-world projects, 1:1 mentorship. 1500+ placed at Google, Microsoft, Amazon.",
    images: ["/og-banner.png"],
    creator: "@spherehive",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Uncomment and fill when you have these:
    // google: "your-google-site-verification",
    // yandex: "your-yandex-verification",
  },
  category: "education",
  classification: "Online Education & Coding School",
};

// JSON-LD Structured Data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Atelier - A Sphere Hive Academy",
  alternateName: "Atelier - A Sphere Hive Academy",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-banner.png`,
  description:
    "Atelier is a Sphere Hive Academy offering India's most immersive live coding cohorts, real-world projects, and 1:1 mentorship from industry veterans.",
  foundingDate: "2024",
  sameAs: [
    "https://twitter.com/spherehive",
    "https://linkedin.com/company/spherehive",
    "https://instagram.com/spherehive",
    "https://github.com/spherehive",
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Coding Cohorts & Courses",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "Job-Ready Full Stack Development Cohort",
          description: "Master full-stack web development with live classes, real projects, and industry mentorship.",
          provider: {
            "@type": "Organization",
            name: "Atelier - A Sphere Hive Academy",
          },
        },
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${manrope.variable}`}
    >
      <head>
        <link rel="icon" href="/logo.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AnalyticsTracker />
        <SmoothScroll>{children}</SmoothScroll>
      </body>

    </html>
  );
}
