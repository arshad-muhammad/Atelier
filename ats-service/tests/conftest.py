"""Test fixtures and mock documents."""
import io
import pytest
import pymupdf as fitz
import docx

@pytest.fixture
def sample_resume_text():
    return """
John Doe
Software Engineer
john.doe@example.com | +1 555-123-4567 | linkedin.com/in/johndoe | github.com/johndoe

Summary
Passionate full-stack developer with 4 years of experience building scalable web applications.

Skills
JavaScript, TypeScript, React, Next.js, Node.js, Express, Python, FastAPI, PostgreSQL, Docker, Git, AWS

Experience
Senior Software Engineer - Tech Solutions Inc.
2022 - Present
- Architected RESTful microservices using Node.js and Express, improving API response time by 40%.
- Engineered responsive user interfaces with React and Next.js, serving over 50,000 daily active users.
- Automated deployment workflows using GitHub Actions and Docker, reducing release cycles from days to hours.

Software Developer - CodeCraft Studio
2020 - 2022
- Developed full-stack features using Python, FastAPI, and PostgreSQL.
- Optimized SQL database queries and indexes, decreasing load times by 25%.

Projects
Cloud E-Commerce Platform
- Built real-time shopping cart with Next.js, Tailwind CSS, and Redis.
- Deployed on AWS ECS with automated CI/CD pipeline.

Education
Bachelor of Science in Computer Science
State University, Graduated 2020
"""

@pytest.fixture
def sample_job_description():
    return """
Senior Full-Stack Engineer

Requirements:
- Strong experience with React, Next.js, and TypeScript
- Backend proficiency with Node.js or Python (FastAPI/Django)
- Experience designing REST APIs and microservices
- Proficiency with PostgreSQL and Redis
- Hands-on experience with Docker and AWS
- Bachelor's degree in Computer Science or equivalent

Nice to have:
- Experience with Kubernetes and CI/CD pipelines
- Familiarity with Tailwind CSS
"""

@pytest.fixture
def sample_pdf_bytes(sample_resume_text):
    """Generates a valid single-column in-memory PDF using PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page()
    rect = fitz.Rect(50, 50, 550, 800)
    page.insert_textbox(rect, sample_resume_text, fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

@pytest.fixture
def sample_two_column_pdf_bytes():
    """Generates a multi-column in-memory PDF to test column layout detection."""
    doc = fitz.open()
    page = doc.new_page()
    # Left column
    left_rect = fitz.Rect(40, 50, 270, 750)
    page.insert_textbox(left_rect, "Left Column Content\nSkills: React, Node.js\nEducation: BS CS", fontsize=10)
    # Right column
    right_rect = fitz.Rect(320, 50, 560, 750)
    page.insert_textbox(right_rect, "Right Column Content\nExperience: Senior Engineer\nProjects: Cloud Store", fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

@pytest.fixture
def sample_docx_bytes(sample_resume_text):
    """Generates a valid in-memory DOCX using python-docx."""
    doc = docx.Document()
    for line in sample_resume_text.splitlines():
        if line.strip():
            doc.add_paragraph(line)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
