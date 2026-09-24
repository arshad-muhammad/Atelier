"""Contact Information Extractor and Masker."""
import re
from typing import Dict, Any, List, Optional
from ..models.schemas import ContactInfo

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}"
)
LINKEDIN_REGEX = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+/?", re.IGNORECASE)
GITHUB_REGEX = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+/?", re.IGNORECASE)
PORTFOLIO_REGEX = re.compile(
    r"(?:https?://)?(?:www\.)?(?!linkedin|github)[a-zA-Z0-9-]+\.(?:com|dev|io|me|app|in|org|net|co)/?[^\s]*",
    re.IGNORECASE
)

# Common words to filter out when detecting candidate name
TITLE_WORDS = {"resume", "curriculum", "vitae", "cv", "software", "engineer", "developer", "profile", "contact"}

class ContactAnalyzer:
    """Detects and validates contact info safely without storing or exposing raw PII."""

    @classmethod
    def mask_email(cls, email: str) -> str:
        if "@" not in email:
            return "***"
        user, domain = email.split("@", 1)
        if len(user) <= 2:
            masked_user = user[0] + "*"
        else:
            masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
        return f"{masked_user}@{domain}"

    @classmethod
    def mask_phone(cls, phone: str) -> str:
        cleaned = re.sub(r"[^\d+]", "", phone)
        if len(cleaned) < 6:
            return "***"
        return cleaned[:3] + "*" * (len(cleaned) - 5) + cleaned[-2:]

    @classmethod
    def extract_name(cls, text: str) -> Optional[str]:
        """Heuristically extracts the candidate name from top lines."""
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for line in lines[:5]:
            # Skip if contains email, phone, or website
            if EMAIL_REGEX.search(line) or PHONE_REGEX.search(line) or "http" in line.lower():
                continue
            words = line.split()
            # Most names are 2 to 4 words, each capitalized
            if 2 <= len(words) <= 4:
                lower_words = [w.lower() for w in words]
                if any(w in TITLE_WORDS for w in lower_words):
                    continue
                if all(w.isalpha() for w in words):
                    return line
        return None

    @classmethod
    def analyze(cls, full_text: str, links: List[str]) -> Dict[str, Any]:
        """Analyzes full text and detected links for contact credentials."""
        # Find emails
        emails = EMAIL_REGEX.findall(full_text)
        email_detected = len(emails) > 0
        masked_email = cls.mask_email(emails[0]) if email_detected else None

        # Find phones
        phones = PHONE_REGEX.findall(full_text)
        phone_detected = False
        masked_phone = None
        for p in phones:
            digits_only = re.sub(r"\D", "", p)
            if 10 <= len(digits_only) <= 13:
                phone_detected = True
                masked_phone = cls.mask_phone(p)
                break

        # Check links from both explicit link objects and resume text
        all_link_strings = list(links)
        all_link_strings.extend(re.findall(r"https?://\S+", full_text))

        linkedin_detected = bool(
            LINKEDIN_REGEX.search(full_text) or
            "linkedin.com" in full_text.lower() or
            any("linkedin.com" in l.lower() for l in all_link_strings)
        )
        github_detected = bool(
            GITHUB_REGEX.search(full_text) or
            "github.com" in full_text.lower() or
            any("github.com" in l.lower() for l in all_link_strings)
        )
        portfolio_detected = bool(
            PORTFOLIO_REGEX.search(full_text) or
            any(PORTFOLIO_REGEX.search(l) for l in all_link_strings)
        )

        candidate_name = cls.extract_name(full_text)
        name_detected = candidate_name is not None

        contact_info = ContactInfo(
            name_detected=name_detected,
            email_detected=email_detected,
            phone_detected=phone_detected,
            linkedin_detected=linkedin_detected,
            github_detected=github_detected,
            portfolio_detected=portfolio_detected,
            candidate_name=candidate_name or "Candidate",
            masked_email=masked_email,
            masked_phone=masked_phone,
            links=links[:5]
        )

        return contact_info.model_dump()
