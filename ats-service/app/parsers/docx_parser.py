"""DOCX Parser module using python-docx."""
import io
import re
from typing import Dict, Any, List
import docx

class DOCXParser:
    """Production-grade DOCX Parser with ATS formatting analysis."""

    @staticmethod
    def parse(file_bytes: bytes) -> Dict[str, Any]:
        """Parses a DOCX document from raw bytes.
        
        Extracts:
        - full text
        - paragraphs and headings
        - tables and table cells
        - header and footer text detection
        - links and URLs
        """
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
        except Exception as e:
            raise ValueError(f"Malformed or invalid DOCX document: {str(e)}")

        paragraph_texts: List[str] = []
        links: List[str] = []
        heading_texts: List[str] = []
        blocks: List[Dict[str, Any]] = []

        # Read paragraphs
        for idx, p in enumerate(doc.paragraphs):
            txt = p.text.strip()
            if not txt:
                continue
            paragraph_texts.append(txt)

            # Check if paragraph has heading style or is strongly formatted
            style_name = p.style.name.lower() if p.style and p.style.name else ""
            if "heading" in style_name or "title" in style_name:
                heading_texts.append(txt)

            blocks.append({
                "index": idx,
                "text": txt,
                "style": style_name,
                "is_heading": "heading" in style_name or "title" in style_name
            })

        # Read tables
        table_count = len(doc.tables)
        table_texts: List[str] = []
        for t_idx, table in enumerate(doc.tables):
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    table_texts.append(" | ".join(row_cells))

        # Check for header/footer content
        header_text = ""
        footer_text = ""
        try:
            for s in doc.sections:
                if s.header:
                    for hp in s.header.paragraphs:
                        if hp.text.strip():
                            header_text += hp.text.strip() + " "
                if s.footer:
                    for fp in s.footer.paragraphs:
                        if fp.text.strip():
                            footer_text += fp.text.strip() + " "
        except Exception:
            pass

        has_header_footer_text = bool(header_text.strip() or footer_text.strip())

        # Combine text
        combined_text = "\n".join(paragraph_texts)
        if table_texts:
            combined_text += "\n\n" + "\n".join(table_texts)

        total_words = len(combined_text.split())

        # Extract links
        url_pattern = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
        text_urls = url_pattern.findall(combined_text)
        for url in text_urls:
            cleaned = url.rstrip('.,;:)')
            if cleaned not in links:
                links.append(cleaned)

        return {
            "full_text": combined_text,
            "page_count": max(1, (total_words // 400) + 1),  # Estimated pages
            "total_words": total_words,
            "blocks": blocks,
            "links": links,
            "has_two_columns": False,  # DOCX multi-column sections can be analyzed via section column counts
            "table_count": table_count,
            "image_count": 0,
            "has_very_small_font": False,
            "smallest_font_size": None,
            "scanned_image_suspected": False,
            "has_header_footer_text": has_header_footer_text,
            "header_sample": header_text.strip()[:150] if header_text.strip() else None,
        }
