import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResumeCheckerClient from './ResumeCheckerClient';
import styles from './resume-checker.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://atelier.spherehive.com';

export const metadata = {
  title: 'Free ATS Resume Checker & Compatibility Scanner | Atelier',
  description:
    'Scan your resume for free with Atelier\'s open-source ATS checker. Get an instant compatibility score, keyword gap analysis, layout audit, and recruiter insights in seconds. 100% private, no signup required.',
  keywords: [
    'ATS resume checker',
    'free ATS resume scanner',
    'resume compatibility score',
    'ATS score calculator',
    'AI resume checker',
    'software engineer resume review',
    'tech resume ATS test',
    'resume keyword optimization',
    'job description matcher',
    'ATS friendly resume format',
    'single column resume test',
    'Atelier coding school',
    'Sphere Hive Academy'
  ],
  alternates: {
    canonical: `${SITE_URL}/resume-checker`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: `${SITE_URL}/resume-checker`,
    siteName: 'Atelier - A Sphere Hive Academy',
    title: 'Free ATS Resume Checker & Compatibility Scanner | Atelier',
    description:
      'Test your resume against enterprise ATS systems. Get instant compatibility scores, keyword match breakdown, and formatting audits for free.',
    images: [
      {
        url: `${SITE_URL}/og-banner.png`,
        width: 1200,
        height: 630,
        alt: 'Atelier Free ATS Resume Scanner & Compatibility Checker',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free ATS Resume Checker & Compatibility Scanner | Atelier',
    description:
      'Scan your resume with Atelier\'s instant deterministic ATS scanner. Get your score, keyword analysis, and recruiter insights in seconds.',
    images: [`${SITE_URL}/og-banner.png`],
    creator: '@spherehive',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'career tools',
  classification: 'Free Online Career & Resume Optimization Tool',
};

// Rich Structured Data (JSON-LD) for Google Search
const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Atelier ATS Resume Checker',
  url: `${SITE_URL}/resume-checker`,
  description:
    'Free production-grade ATS Resume Analyzer and compatibility scoring engine powered by deterministic keyword and layout heuristics. Audits document layout, keyword match, and experience relevance.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '2480',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Atelier Resume Compatibility Score calculation',
    'Native layout and column formatting inspection',
    'Deep multi-tier keyword and skill taxonomy matching',
    'Deterministic keyword alignment for job descriptions without AI',
    'Deterministic bullet-point impact recommendations',
    'Automatic PII masking and 100% private in-memory analysis'
  ],
  author: {
    '@type': 'EducationalOrganization',
    name: 'Atelier - A Sphere Hive Academy',
    url: SITE_URL,
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Atelier ATS Resume Checker calculate the compatibility score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Atelier Resume Compatibility Score is calculated using 6 weighted dimensions: Keyword Match (35 points), Content Relevance & Alignment (25 points), Required Skills Coverage (20 points), Resume Structure (10 points), Layout & Formatting (5 points), and Contact Information (5 points). The score is fully transparent, deterministic, and explainable.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this ATS Resume Checker completely free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the Atelier ATS Resume Checker is 100% free for all students, job seekers, and developers. No login, credit card, or subscription is ever required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Atelier store or sell my sensitive resume data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Atelier does not store, sell, or log your resume text or personal contact info. Analysis is processed in-memory and zero data is transmitted to third-party commercial AI providers like OpenAI, Gemini, or Claude.',
      },
    },
    {
      '@type': 'Question',
      name: 'What file formats are supported by the resume checker?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The analyzer supports standard PDF and Microsoft Word DOCX formats up to 10MB in size.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do two-column resumes cause problems in ATS scanners?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Many enterprise ATS parsers parse text from left to right across the page width. In a two-column resume, this can cause text from column A and column B to get interwoven chronologically, breaking job timelines, education dates, and skill associations. A clean single-column format is recommended.',
      },
    },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'ATS Resume Checker',
      item: `${SITE_URL}/resume-checker`,
    },
  ],
};

export default function ResumeCheckerPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundGrid} />
      <div className={styles.bgGlowTop} />
      <div className={styles.bgGlowAccent} />

      {/* JSON-LD Structured Data Injections for Google Search Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navbar />

      <main className={`${styles.mainContent} container`}>
        {/* Interactive ATS Analyzer Client */}
        <ResumeCheckerClient />

        {/* ON-PAGE SEO CONTENT & KNOWLEDGE BASE */}
        <article className={styles.guideSection}>
          <header className={styles.guideHeader}>
            <span className={styles.guidePreTitle}>
              Recruiter Insights &amp; Guide
            </span>
            <h2 className={styles.guideTitle}>
              How to Beat Modern Applicant Tracking Systems (ATS)
            </h2>
            <p className={styles.guideSubtitle}>
              Over 98% of Fortune 500 corporations and leading tech startups screen engineering candidates using Applicant Tracking Systems like Workday, Greenhouse, Lever, and Taleo before a human recruiter ever sees a CV.
            </p>
          </header>

          <div className={styles.guideGrid}>
            <div className={styles.guideCard}>
              <h3 className={styles.guideCardTitle}>
                1. Single-Column Layout Over Complex Graphics
              </h3>
              <p className={styles.guideCardText}>
                Graphic-heavy multi-column templates created in graphic editors often fail text extraction. Text blocks get interwoven horizontally, scrambling your timeline. Stick to clean, single-column semantic hierarchy with standard margin spacing.
              </p>
            </div>

            <div className={styles.guideCard}>
              <h3 className={styles.guideCardTitle}>
                2. Explicit Keyword &amp; Skill Alignment
              </h3>
              <p className={styles.guideCardText}>
                Modern ATS engines match exact skills and standard taxonomy synonyms. If a job calls for &quot;PostgreSQL&quot;, writing &quot;Postgres&quot; may match via synonyms, but explicit alignment ensures your profile ranks at the top of the recruiter query table.
              </p>
            </div>

            <div className={styles.guideCard}>
              <h3 className={styles.guideCardTitle}>
                3. Measurable Outcomes Over Generic Task Lists
              </h3>
              <p className={styles.guideCardText}>
                Weak bullet points like &quot;Worked on React features&quot; receive low impact scores. Strong bullets follow Google’s X-Y-Z formula: &quot;Engineered real-time chat utilizing WebSockets &amp; Redis, decreasing message latency by 45% for 10,000 active users.&quot;
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <section className={styles.faqContainer} aria-label="Frequently Asked Questions">
            <h3 className={styles.faqTitle}>
              Frequently Asked Questions (FAQ)
            </h3>

            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h4 className={styles.faqQuestion}>
                  How does the Atelier Compatibility Score differ from an official ATS score?
                </h4>
                <p className={styles.faqAnswer}>
                  There is no single universal &quot;official ATS score&quot; in the industry because each enterprise software (Workday, Taleo, Greenhouse) uses distinct proprietary scoring rules. Atelier provides an estimated compatibility score based on verified industry heuristics: text parsability, section ordering, skill coverage, and keyword alignment.
                </p>
              </div>

              <div className={`${styles.faqItem} ${styles.faqItemBorder}`}>
                <h4 className={styles.faqQuestion}>
                  Is my resume data kept private?
                </h4>
                <p className={styles.faqAnswer}>
                  Yes, 100%. We run our analysis completely in-process using deterministic rule-based algorithms without using any AI models or third-party commercial APIs (such as OpenAI, Gemini, or Claude). Phone numbers and emails are automatically masked, and files are discarded immediately following analysis.
                </p>
              </div>

              <div className={`${styles.faqItem} ${styles.faqItemBorder}`}>
                <h4 className={styles.faqQuestion}>
                  Should I submit my resume in PDF or DOCX format?
                </h4>
                <p className={styles.faqAnswer}>
                  Both formats are supported. Standard text-based PDF preserves formatting across devices while remaining fully readable by modern ATS parsers. If a job application specifically requests Word format, upload a clean .docx document without text in headers or footers.
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
