"""ATS Formatting and Layout Analysis Engine."""
import re
from typing import Dict, Any, List
from ..models.schemas import ATSIssue

class FormattingAnalyzer:
    """Analyzes document layout, structure, and text extraction for ATS compliance."""

    @classmethod
    def analyze(
        cls,
        parsed_doc: Dict[str, Any],
        contact_info: Dict[str, Any],
        section_info: Dict[str, Any]
    ) -> List[ATSIssue]:
        """Evaluates document formatting and generates prioritized ATS issues."""
        issues: List[ATSIssue] = []

        # 1. Scanned Image / Unreadable text check (HIGH)
        if parsed_doc.get("scanned_image_suspected", False):
            issues.append(ATSIssue(
                issue="Scanned image or empty text detected",
                severity="HIGH",
                explanation="The document has images but minimal readable text. ATS engines cannot extract information from raster images without OCR."
            ))

        # 2. Multi-column layout check (MEDIUM)
        if parsed_doc.get("has_two_columns", False):
            issues.append(ATSIssue(
                issue="Two-column layout detected",
                severity="MEDIUM",
                explanation="Some legacy ATS parsers read columns horizontally across the page, which can interweave unrelated text between columns."
            ))

        # 3. Complex Tables check (MEDIUM / LOW)
        table_count = parsed_doc.get("table_count", 0)
        if table_count > 3:
            issues.append(ATSIssue(
                issue=f"Multiple tables ({table_count}) detected",
                severity="MEDIUM",
                explanation="Extensive nested tables can confuse ATS text flows. Consider using clean bullet points and standard heading hierarchy instead."
            ))
        elif table_count > 0:
            issues.append(ATSIssue(
                issue="Table formatting detected",
                severity="LOW",
                explanation="Tables were found in the document. Simple tables are usually parsed fine by modern ATS, but complex merged cells should be avoided."
            ))

        # 4. Very small font check (MEDIUM)
        if parsed_doc.get("has_very_small_font", False):
            smallest = parsed_doc.get("smallest_font_size")
            issues.append(ATSIssue(
                issue=f"Tiny text font detected ({smallest}pt)",
                severity="MEDIUM",
                explanation="Text smaller than 8pt may be skipped or flagged by ATS parsers, or indicate hidden text attempts."
            ))

        # 5. Header / Footer critical text (MEDIUM)
        if parsed_doc.get("has_header_footer_text", False):
            issues.append(ATSIssue(
                issue="Header or Footer content detected",
                severity="MEDIUM",
                explanation="Some ATS software strips out headers and footers completely. Ensure vital contact information is placed in the main body."
            ))

        # 6. Missing Contact Information (HIGH / MEDIUM / LOW)
        if not contact_info.get("email_detected", False):
            issues.append(ATSIssue(
                issue="No email address detected",
                severity="HIGH",
                explanation="An email address is required by ATS systems to create your candidate profile and send communications."
            ))

        if not contact_info.get("phone_detected", False):
            issues.append(ATSIssue(
                issue="No phone number detected",
                severity="MEDIUM",
                explanation="A recruiter contact phone number was not clearly identified in the text."
            ))

        if not contact_info.get("linkedin_detected", False):
            issues.append(ATSIssue(
                issue="LinkedIn profile URL not detected",
                severity="LOW",
                explanation="Including a direct LinkedIn link increases recruiter response rate and profile verification speed."
            ))

        if not contact_info.get("github_detected", False) and not contact_info.get("portfolio_detected", False):
            issues.append(ATSIssue(
                issue="No GitHub or Portfolio URL detected",
                severity="LOW",
                explanation="For engineering and tech roles, linking your GitHub or portfolio provides strong proof of work."
            ))

        # 7. Missing standard sections (HIGH / MEDIUM)
        present_sections = section_info.get("present_sections", [])
        if "experience" not in present_sections:
            issues.append(ATSIssue(
                issue="Experience section missing or unrecognized",
                severity="HIGH",
                explanation="Could not find a standard 'Experience' or 'Work History' heading. This makes work timeline parsing unreliable."
            ))

        if "skills" not in present_sections:
            issues.append(ATSIssue(
                issue="Skills section missing or unrecognized",
                severity="HIGH",
                explanation="A dedicated 'Skills' or 'Technical Skills' section ensures automated ATS skill indexing finds your capabilities."
            ))

        if "education" not in present_sections:
            issues.append(ATSIssue(
                issue="Education section missing or unrecognized",
                severity="MEDIUM",
                explanation="ATS parsers look for standard education headings to verify degree criteria and graduation timelines."
            ))

        # 8. Excessive special characters or weird formatting (MEDIUM)
        full_text = parsed_doc.get("full_text", "")
        special_chars = len(re.findall(r"[^\w\s\.,;:/\-–—\(\)@\+]", full_text))
        total_chars = max(1, len(full_text))
        if (special_chars / total_chars) > 0.05:
            issues.append(ATSIssue(
                issue="Excessive decorative symbols or icon characters",
                severity="MEDIUM",
                explanation="Unusual icons, decorative shapes, or non-standard bullet symbols can parse as garbled text in older ATS engines."
            ))

        # 9. Document length check (LOW)
        page_count = parsed_doc.get("page_count", 1)
        total_words = parsed_doc.get("total_words", 0)
        if page_count > 3:
            issues.append(ATSIssue(
                issue=f"Resume length ({page_count} pages) is lengthy",
                severity="LOW",
                explanation="Resumes exceeding 2 pages often face lower recruiter retention. Focus on the most recent and impactful 3-5 years."
            ))
        elif total_words < 120:
            issues.append(ATSIssue(
                issue="Resume is unusually brief",
                severity="HIGH",
                explanation=f"Only {total_words} words extracted. Make sure your resume includes detailed project and experience descriptions."
            ))

        return issues
