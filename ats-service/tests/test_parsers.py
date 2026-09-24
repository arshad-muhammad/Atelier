"""Unit tests for PDF and DOCX parsers."""
import pytest
from app.parsers.pdf_parser import PDFParser
from app.parsers.docx_parser import DOCXParser

def test_pdf_parser_valid(sample_pdf_bytes):
    result = PDFParser.parse(sample_pdf_bytes)
    assert result["page_count"] >= 1
    assert result["total_words"] > 50
    assert "john.doe@example.com" in result["full_text"]
    assert "React" in result["full_text"]
    assert result["scanned_image_suspected"] is False

def test_pdf_parser_two_column(sample_two_column_pdf_bytes):
    result = PDFParser.parse(sample_two_column_pdf_bytes)
    assert result["has_two_columns"] is True

def test_pdf_parser_corrupted():
    with pytest.raises(ValueError):
        PDFParser.parse(b"This is definitely not a PDF file header")

def test_docx_parser_valid(sample_docx_bytes):
    result = DOCXParser.parse(sample_docx_bytes)
    assert result["page_count"] >= 1
    assert result["total_words"] > 50
    assert "john.doe@example.com" in result["full_text"]
    assert "Next.js" in result["full_text"]

def test_docx_parser_corrupted():
    with pytest.raises(ValueError):
        DOCXParser.parse(b"PKNotAValidZipFile")
