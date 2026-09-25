/**
 * Contact Information Extractor and Privacy Masker.
 * Detects candidate contact info safely without storing or exposing raw PII.
 */

const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}/g;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/i;
const PORTFOLIO_REGEX = /(?:https?:\/\/)?(?:www\.)?(?!linkedin|github)[a-zA-Z0-9-]+\.(?:com|dev|io|me|app|in|org|net|co)\/?[^\s]*/i;

const TITLE_WORDS = new Set([
  'resume', 'curriculum', 'vitae', 'cv', 'software', 'engineer', 'developer',
  'profile', 'contact', 'fullstack', 'frontend', 'backend', 'summary'
]);

export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}${'*'.repeat(Math.min(5, user.length - 2))}${user[user.length - 1]}@${domain}`;
}

export function maskPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***-***-****';
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

export function extractName(fullText) {
  if (!fullText) return null;
  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  
  for (const line of lines.slice(0, 6)) {
    // Skip if line has an email, phone, or URL
    if (line.match(EMAIL_REGEX) || line.match(PHONE_REGEX) || /https?:\/\/|www\./i.test(line)) {
      continue;
    }
    const words = line.split(/\s+/).filter(Boolean);
    // Standard names are usually 2 to 4 alphabetic words
    if (words.length >= 2 && words.length <= 4) {
      const lowerWords = words.map((w) => w.toLowerCase());
      if (lowerWords.some((w) => TITLE_WORDS.has(w))) {
        continue;
      }
      if (words.every((w) => /^[a-zA-Z.'-]+$/.test(w))) {
        return line;
      }
    }
  }
  return null;
}

export function analyzeContact(fullText, links = []) {
  const emails = fullText.match(EMAIL_REGEX) || [];
  const email_detected = emails.length > 0;
  const masked_email = email_detected ? maskEmail(emails[0]) : null;

  const phoneMatches = fullText.match(PHONE_REGEX) || [];
  let phone_detected = false;
  let masked_phone = null;

  for (const p of phoneMatches) {
    const digitsOnly = p.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
      phone_detected = true;
      masked_phone = maskPhone(p);
      break;
    }
  }

  const allLinkStrings = [...links];
  const urlMatches = fullText.match(/https?:\/\/[^\s)]+/g);
  if (urlMatches) {
    allLinkStrings.push(...urlMatches);
  }

  const linkedin_detected = Boolean(
    LINKEDIN_REGEX.test(fullText) ||
    /linkedin\.com/i.test(fullText) ||
    allLinkStrings.some((l) => /linkedin\.com/i.test(l))
  );

  const github_detected = Boolean(
    GITHUB_REGEX.test(fullText) ||
    /github\.com/i.test(fullText) ||
    allLinkStrings.some((l) => /github\.com/i.test(l))
  );

  const portfolio_detected = Boolean(
    PORTFOLIO_REGEX.test(fullText) ||
    allLinkStrings.some((l) => PORTFOLIO_REGEX.test(l))
  );

  const candidate_name = extractName(fullText);
  const name_detected = Boolean(candidate_name);

  // Collect clean unique links for candidate preview
  const detectedLinks = [];
  if (linkedin_detected) detectedLinks.push('LinkedIn');
  if (github_detected) detectedLinks.push('GitHub');
  if (portfolio_detected) detectedLinks.push('Portfolio');

  return {
    name_detected,
    email_detected,
    phone_detected,
    linkedin_detected,
    github_detected,
    portfolio_detected,
    candidate_name: candidate_name || 'Candidate',
    masked_email,
    masked_phone,
    links: detectedLinks
  };
}
