"""PDF Parser module using PyMuPDF (fitz)."""
import re
from typing import Dict, Any, List, Optional
import pymupdf as fitz

class PDFParser:
    """Production-grade PDF Parser with ATS formatting and layout inspection."""

    @staticmethod
    def parse(file_bytes: bytes) -> Dict[str, Any]:
        """Parses a PDF document from raw bytes.
        
        Extracts:
        - full text
        - page count
        - lines and section headings
        - links and URLs
        - layout anomalies: multi-column detection, tables, small fonts, text in images
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Malformed or encrypted PDF document: {str(e)}")

        page_count = len(doc)
        if page_count == 0:
            doc.close()
            raise ValueError("PDF document contains 0 pages.")

        full_text_pages: List[str] = []
        all_blocks: List[Dict[str, Any]] = []
        links: List[str] = []
        has_two_columns = False
        table_count = 0
        image_count = 0
        has_very_small_font = False
        smallest_font_size = 999.0
        scanned_image_suspected = False

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = page.get_text("text") or ""
            full_text_pages.append(page_text)

            # Extract links
            try:
                for link in page.get_links():
                    uri = link.get("uri")
                    if uri and uri not in links:
                        links.append(uri)
            except Exception:
                pass

            # Detect tables
            try:
                tables = page.find_tables()
                if tables and len(tables.tables) > 0:
                    table_count += len(tables.tables)
            except Exception:
                pass

            # Count images
            try:
                imgs = page.get_images()
                image_count += len(imgs)
            except Exception:
                pass

            # Page dimensions and block layout analysis
            rect = page.rect
            page_width = rect.width
            mid_x = page_width / 2.0

            # Get detailed text dict
            try:
                page_dict = page.get_text("dict")
                blocks = page_dict.get("blocks", [])

                left_col_blocks = 0
                right_col_blocks = 0

                for b in blocks:
                    if b.get("type") == 0:  # Text block
                        bbox = b.get("bbox", (0, 0, 0, 0))
                        b_x0, b_y0, b_x1, b_y1 = bbox
                        b_text = ""

                        for line in b.get("lines", []):
                            for span in line.get("spans", []):
                                font_size = span.get("size", 10.0)
                                if font_size < smallest_font_size:
                                    smallest_font_size = font_size
                                if font_size < 8.0:
                                    has_very_small_font = True
                                span_text = span.get("text", "")
                                b_text += span_text + " "

                        b_text = b_text.strip()
                        if len(b_text) > 15:
                            all_blocks.append({
                                "page": page_idx + 1,
                                "bbox": bbox,
                                "text": b_text
                            })

                            # Check for column alignment
                            if b_x1 <= mid_x + (page_width * 0.08):
                                left_col_blocks += 1
                            elif b_x0 >= mid_x - (page_width * 0.08):
                                right_col_blocks += 1

                # If blocks appear on both distinct left and right sides of the page
                if left_col_blocks >= 1 and right_col_blocks >= 1:
                    has_two_columns = True

            except Exception:
                pass

        doc.close()

        full_text = "\n\n".join(full_text_pages).strip()
        total_words = len(full_text.split())

        # If pages exist but word count is extremely low despite having images, likely a scanned image PDF
        if total_words < 30 and image_count > 0:
            scanned_image_suspected = True

        # Extract URLs found in text as well
        url_pattern = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
        text_urls = url_pattern.findall(full_text)
        for url in text_urls:
            cleaned = url.rstrip('.,;:)')
            if cleaned not in links:
                links.append(cleaned)

        return {
            "full_text": full_text,
            "page_count": page_count,
            "total_words": total_words,
            "blocks": all_blocks,
            "links": links,
            "has_two_columns": has_two_columns,
            "table_count": table_count,
            "image_count": image_count,
            "has_very_small_font": has_very_small_font,
            "smallest_font_size": round(smallest_font_size, 1) if smallest_font_size != 999.0 else None,
            "scanned_image_suspected": scanned_image_suspected,
        }
