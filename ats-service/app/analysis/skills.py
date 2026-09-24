"""Skill Taxonomy, Extraction, and Job Description Parser."""
import json
import os
import re
from typing import Dict, Any, List, Set, Tuple, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

class SkillTaxonomy:
    """Manages skill taxonomy, synonyms, and categories."""

    _instance: Optional["SkillTaxonomy"] = None

    def __init__(self):
        self.categories: Dict[str, List[str]] = {}
        self.skill_to_category: Dict[str, str] = {}
        self.synonyms: Dict[str, List[str]] = {}
        self.alias_to_canonical: Dict[str, str] = {}
        self._load_data()

    @classmethod
    def get_instance(cls) -> "SkillTaxonomy":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_data(self):
        # Load skills
        skills_path = os.path.join(DATA_DIR, "skills.json")
        if os.path.exists(skills_path):
            with open(skills_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.categories = data.get("categories", {})
                for cat, skills in self.categories.items():
                    for skill in skills:
                        self.skill_to_category[skill.lower()] = cat

        # Load synonyms
        synonyms_path = os.path.join(DATA_DIR, "synonyms.json")
        if os.path.exists(synonyms_path):
            with open(synonyms_path, "r", encoding="utf-8") as f:
                s_data = json.load(f)
                self.synonyms = s_data.get("synonyms", {})
                for canonical, aliases in self.synonyms.items():
                    canonical_lower = canonical.lower()
                    for alias in aliases:
                        self.alias_to_canonical[alias.lower()] = canonical_lower

    def get_canonical(self, term: str) -> Optional[str]:
        """Resolves any variant or synonym to its canonical skill name."""
        clean = term.strip().lower()
        if clean in self.alias_to_canonical:
            return self.alias_to_canonical[clean]
        if clean in self.skill_to_category:
            return clean
        return None

    def get_category(self, canonical_skill: str) -> str:
        return self.skill_to_category.get(canonical_skill.lower(), "general")

    def are_related(self, skill_a: str, skill_b: str) -> bool:
        """Returns True if two distinct skills belong to the same category."""
        cat_a = self.get_category(skill_a)
        cat_b = self.get_category(skill_b)
        return cat_a != "general" and cat_a == cat_b


class SkillExtractor:
    """Extracts known skills and job description requirements."""

    def __init__(self):
        self.taxonomy = SkillTaxonomy.get_instance()

    def extract_skills_from_text(self, text: str) -> Dict[str, Dict[str, Any]]:
        """Extracts all recognized skills from arbitrary text.
        
        Returns a dict: canonical_skill -> {
            "found_term": str,
            "canonical": str,
            "category": str,
            "count": int
        }
        """
        if not text:
            return {}

        text_lower = text.lower()
        detected: Dict[str, Dict[str, Any]] = {}

        # Search for aliases and canonical terms
        # Sort terms by length descending to match multi-word phrases first ("rest api" before "api")
        all_terms = list(self.taxonomy.alias_to_canonical.keys())
        all_terms.extend([s for s in self.taxonomy.skill_to_category.keys() if s not in all_terms])
        all_terms.sort(key=len, reverse=True)

        for term in all_terms:
            # Word boundary regex matching
            escaped = re.escape(term)
            # Handle symbols like c++, c#, .net
            if term in ["c++", "c#", ".net"]:
                pattern = rf"(?:^|\s|\b){escaped}(?:$|\s|[,;.\)])"
            else:
                pattern = rf"\b{escaped}\b"

            matches = list(re.finditer(pattern, text_lower))
            if matches:
                canonical = self.taxonomy.get_canonical(term) or term
                category = self.taxonomy.get_category(canonical)
                if canonical not in detected:
                    detected[canonical] = {
                        "found_term": term,
                        "canonical": canonical,
                        "category": category,
                        "count": len(matches)
                    }
                else:
                    detected[canonical]["count"] += len(matches)

        return detected

    def parse_job_description(self, jd_text: str) -> Dict[str, Any]:
        """Parses a job description to extract required/preferred skills, responsibilities, and experience."""
        if not jd_text or not jd_text.strip():
            return {
                "has_jd": False,
                "required_skills": [],
                "preferred_skills": [],
                "responsibilities": [],
                "experience_requirement": None,
                "education_requirement": None,
            }

        text_lower = jd_text.lower()
        lines = [l.strip() for l in jd_text.splitlines() if l.strip()]

        required_skills: Set[str] = set()
        preferred_skills: Set[str] = set()
        responsibilities: List[str] = []

        is_preferred_mode = False
        is_required_mode = False
        is_resp_mode = False

        for line in lines:
            line_l = line.lower()

            if any(k in line_l for k in ["nice to have", "preferred", "bonus", "good to have", "plus"]):
                is_preferred_mode = True
                is_required_mode = False
                is_resp_mode = False
                continue
            elif any(k in line_l for k in ["required", "requirements", "must have", "qualifications", "what you need"]):
                is_required_mode = True
                is_preferred_mode = False
                is_resp_mode = False
                continue
            elif any(k in line_l for k in ["responsibilities", "what you will do", "role overview", "duties"]):
                is_resp_mode = True
                is_required_mode = False
                is_preferred_mode = False
                continue

            extracted = self.extract_skills_from_text(line)
            for canon in extracted:
                if is_preferred_mode:
                    preferred_skills.add(canon)
                else:
                    required_skills.add(canon)

            if is_resp_mode and len(line) > 20:
                responsibilities.append(line.lstrip("•-* \t"))

        # If no explicit sections were parsed, extract all skills from JD as required
        if not required_skills and not preferred_skills:
            all_found = self.extract_skills_from_text(jd_text)
            for c in all_found:
                required_skills.add(c)

        # Detect experience requirements like "3+ years", "5-7 years"
        exp_match = re.search(r"(\d+[\+]?(?:\s*-\s*\d+)?\s*(?:years|yrs)\s+(?:of\s+)?experience)", jd_text, re.IGNORECASE)
        experience_req = exp_match.group(1) if exp_match else None

        # Detect education requirements like Bachelor's, Master's, Computer Science
        edu_req = None
        if re.search(r"\b(bachelor'?s|b\.?s\.?|b\.?tech|master'?s|m\.?s\.?|phd|computer science)\b", jd_text, re.IGNORECASE):
            edu_match = re.search(r"([^.\n]*(?:degree|bachelor|master|computer science)[^.\n]*)", jd_text, re.IGNORECASE)
            if edu_match:
                edu_req = edu_match.group(1).strip()

        return {
            "has_jd": True,
            "required_skills": list(required_skills),
            "preferred_skills": list(preferred_skills),
            "responsibilities": responsibilities[:8],
            "experience_requirement": experience_req,
            "education_requirement": edu_req,
        }
