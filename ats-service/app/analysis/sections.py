"""Resume section detection and structural analysis."""
import re
from typing import Dict, Any, List, Tuple

SECTION_PATTERNS = {
    "experience": [
        r"^(work\s+)?experience",
        r"^professional\s+experience",
        r"^employment(\s+history)?",
        r"^work\s+history",
        r"^relevant\s+experience",
        r"^career\s+history",
        r"^internships?"
    ],
    "education": [
        r"^education(al)?(\s+background)?",
        r"^academic(\s+background|\s+history)?",
        r"^academics?",
        r"^qualifications?",
        r"^degrees?"
    ],
    "skills": [
        r"^(technical\s+|core\s+|key\s+)?skills",
        r"^technologies(\s+and\s+tools)?",
        r"^tools\s+(&|and)\s+technologies",
        r"^core\s+competencies",
        r"^technical\s+proficiencies?",
        r"^skillset"
    ],
    "projects": [
        r"^(key\s+|personal\s+|academic\s+|selected\s+|featured\s+)?projects",
        r"^portfolio\s+projects",
        r"^notable\s+work"
    ],
    "certifications": [
        r"^(licenses\s+(&|and)\s+)?certifications?",
        r"^certificates?",
        r"^accreditations?",
        r"^courses\s+(&|and)\s+certifications"
    ],
    "summary": [
        r"^(professional\s+|career\s+|executive\s+)?summary",
        r"^profile",
        r"^about\s+me",
        r"^(career\s+)?objective"
    ]
}

STANDARD_ORDER = ["summary", "skills", "experience", "projects", "education", "certifications"]

class SectionAnalyzer:
    """Detects, maps, and evaluates section headers in resume text."""

    @staticmethod
    def identify_heading(line: str) -> Tuple[bool, str]:
        """Checks if a given line is a section heading and returns (is_heading, canonical_name)."""
        clean = line.strip().lower()
        clean = re.sub(r"[:\-_|•\*\#]+", "", clean).strip()

        # Headings are typically short: 1 to 4 words, < 40 characters
        if not clean or len(clean) > 45 or len(clean.split()) > 5:
            return False, ""

        for canonical, patterns in SECTION_PATTERNS.items():
            for pat in patterns:
                if re.match(pat, clean):
                    return True, canonical

        return False, ""

    @classmethod
    def segment_resume(cls, full_text: str) -> Dict[str, Any]:
        """Splits resume text into detected sections and content."""
        lines = [l.strip() for l in full_text.splitlines() if l.strip()]
        sections: Dict[str, List[str]] = {}
        detected_order: List[str] = []
        current_section = "header"
        sections[current_section] = []

        unrecognized_headings: List[str] = []

        for line in lines:
            is_heading, canonical = cls.identify_heading(line)
            if is_heading:
                current_section = canonical
                if canonical not in sections:
                    sections[canonical] = []
                if canonical not in detected_order:
                    detected_order.append(canonical)
            else:
                # Check for possible unrecognized all-caps heading
                if (line.isupper() or line.istitle()) and len(line) < 30 and len(line.split()) <= 3:
                    # Might be an unusual heading
                    if line.lower() not in ["resume", "curriculum vitae", "cv", "phone", "email"]:
                        unrecognized_headings.append(line)
                sections[current_section].append(line)

        # Standard required sections: experience, education, skills
        present_sections = [s for s in detected_order if s in SECTION_PATTERNS]
        all_canonical = list(SECTION_PATTERNS.keys())
        missing_sections = [s for s in all_canonical if s not in present_sections]

        # Evaluate ordering logic
        # Standard: Contact/Header -> Summary -> (Experience or Skills) -> Projects -> Education
        is_order_good = True
        order_explanation = "Standard, ATS-friendly section sequence detected."

        if "experience" in detected_order and "education" in detected_order:
            exp_idx = detected_order.index("experience")
            edu_idx = detected_order.index("education")
            # For experienced professionals, experience before education is preferred
            # But either way is fine; if education is placed between random bullet points, that's bad

        if "experience" not in present_sections:
            is_order_good = False
            order_explanation = "Work Experience section was not clearly recognized."

        return {
            "sections": {k: "\n".join(v) for k, v in sections.items()},
            "present_sections": present_sections,
            "missing_sections": missing_sections,
            "detected_order": detected_order,
            "is_order_good": is_order_good,
            "order_explanation": order_explanation,
            "unrecognized_headings": list(set(unrecognized_headings))[:5]
        }
