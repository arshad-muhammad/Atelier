import mysql from 'mysql2/promise';
import { hashPassword } from './auth.js';
import {
  defaultStudents,
  defaultCourses,
  defaultSchedule,
  defaultRecordings,
  defaultMaterials,
  defaultCallbacks,
  defaultLecturers,
  defaultTransactions
} from './db.js';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atelier',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

let pool = null;
let initialized = false;
let initPromise = null;

async function getPool() {
  if (pool) return pool;
  pool = mysql.createPool(DB_CONFIG);
  return pool;
}

async function initDb() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const p = await getPool();

    // Fast-path: if assessment tables already exist, check seed and return
    try {
      const [tables] = await p.execute("SHOW TABLES LIKE 'atelier_assessments'");
      if (tables && tables.length > 0) {
        await seedSampleAssessmentsIfEmpty(p);
        initialized = true;
        return;
      }
    } catch (err) {
      if (err.code === 'ER_BAD_DB_ERROR') {
        try {
          const tempConn = await mysql.createConnection({
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password
          });
          await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
          await tempConn.end();
        } catch (dbErr) {
          console.warn("Could not create database:", dbErr.message);
        }
      }
    }

    await runFullSchemaMigration(p);
    initialized = true;
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

async function runFullSchemaMigration(p) {
  // Create tables
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_lecturers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      expertise VARCHAR(255),
      bio TEXT
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      image VARCHAR(500),
      badges TEXT,
      price VARCHAR(100),
      original_price VARCHAR(100),
      discount VARCHAR(100),
      instructor_id INT,
      duration VARCHAR(100),
      highlights TEXT,
      curriculum_overview TEXT,
      FOREIGN KEY(instructor_id) REFERENCES atelier_lecturers(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  // Ensure new course columns exist on existing tables
  const [courseColumns] = await p.execute("SHOW COLUMNS FROM atelier_courses");
  const courseColNames = courseColumns.map(c => c.Field);
  if (!courseColNames.includes('duration')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN duration VARCHAR(100)");
  }
  if (!courseColNames.includes('highlights')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN highlights TEXT");
  }
  if (!courseColNames.includes('curriculum_overview')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN curriculum_overview TEXT");
  }
  // --- New redesign columns ---
  if (!courseColNames.includes('subtitle')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN subtitle VARCHAR(500)");
  }
  if (!courseColNames.includes('total_hours')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN total_hours VARCHAR(50)");
  }
  if (!courseColNames.includes('total_modules')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN total_modules VARCHAR(50)");
  }
  if (!courseColNames.includes('total_projects')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN total_projects VARCHAR(50)");
  }
  if (!courseColNames.includes('tools_technologies')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN tools_technologies TEXT");
  }
  if (!courseColNames.includes('faqs')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN faqs TEXT");
  }
  if (!courseColNames.includes('certificate_title')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN certificate_title VARCHAR(255)");
  }
  if (!courseColNames.includes('course_outcomes')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN course_outcomes TEXT");
  }
  if (!courseColNames.includes('batch_start_date')) {
    await p.execute("ALTER TABLE atelier_courses ADD COLUMN batch_start_date VARCHAR(100) NULL");
  }

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      college VARCHAR(255),
      grad_year VARCHAR(10),
      xp INT DEFAULT 0,
      streak INT DEFAULT 0,
      password VARCHAR(255) DEFAULT 'password',
      bio TEXT,
      github VARCHAR(500),
      linkedin VARCHAR(500),
      portfolio VARCHAR(500),
      skills TEXT
    ) ENGINE=InnoDB
  `);

  // Ensure columns exist on existing tables
  const [columns] = await p.execute("SHOW COLUMNS FROM atelier_students");
  const columnNames = columns.map(c => c.Field);
  if (!columnNames.includes('bio')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN bio TEXT");
  }
  if (!columnNames.includes('github')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN github VARCHAR(500)");
  }
  if (!columnNames.includes('linkedin')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN linkedin VARCHAR(500)");
  }
  if (!columnNames.includes('portfolio')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN portfolio VARCHAR(500)");
  }
  if (!columnNames.includes('skills')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN skills TEXT");
  }
  if (!columnNames.includes('auth_provider')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'credentials'");
  }
  if (!columnNames.includes('avatar')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN avatar VARCHAR(500)");
  }
  if (!columnNames.includes('reset_code')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN reset_code VARCHAR(20)");
  }
  if (!columnNames.includes('reset_code_expires')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN reset_code_expires VARCHAR(100)");
  }
  if (!columnNames.includes('last_active_date')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN last_active_date VARCHAR(50)");
  }
  if (!columnNames.includes('degree')) {
    await p.execute("ALTER TABLE atelier_students ADD COLUMN degree VARCHAR(255)");
  }

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_student_courses (
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      PRIMARY KEY (student_id, course_id),
      FOREIGN KEY(student_id) REFERENCES atelier_students(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_schedule (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT,
      time VARCHAR(255),
      title VARCHAR(500),
      type VARCHAR(100),
      FOREIGN KEY(course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_recordings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT,
      title VARCHAR(500),
      date VARCHAR(100),
      image VARCHAR(500),
      FOREIGN KEY(course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT,
      title VARCHAR(500),
      FOREIGN KEY(course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_material_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      material_id INT,
      name VARCHAR(500) NOT NULL,
      size VARCHAR(100),
      type VARCHAR(100),
      FOREIGN KEY(material_id) REFERENCES atelier_materials(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_callbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      topic TEXT,
      time VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending'
    ) ENGINE=InnoDB
  `);

  // Ensure callback columns exist on existing tables
  const [cbColumns] = await p.execute("SHOW COLUMNS FROM atelier_callbacks");
  const cbColNames = cbColumns.map(c => c.Field);
  if (!cbColNames.includes('email')) {
    await p.execute("ALTER TABLE atelier_callbacks ADD COLUMN email VARCHAR(255) NULL");
  }
  if (!cbColNames.includes('preferred_time')) {
    await p.execute("ALTER TABLE atelier_callbacks ADD COLUMN preferred_time VARCHAR(100) NULL");
  }
  if (!cbColNames.includes('notes')) {
    await p.execute("ALTER TABLE atelier_callbacks ADD COLUMN notes TEXT NULL");
  }
  if (!cbColNames.includes('created_at')) {
    await p.execute("ALTER TABLE atelier_callbacks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  }

  // Contact Inquiries Table
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_contact_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      subject VARCHAR(255) NULL,
      department VARCHAR(100) DEFAULT 'Cohort Admissions',
      message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'new',
      admin_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  // Faculty Applications Table
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_faculty_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      role_applied VARCHAR(255) DEFAULT 'Industry Mentor / Guest Faculty',
      expertise VARCHAR(255) NOT NULL,
      experience_years VARCHAR(50) NULL,
      current_company VARCHAR(255) NULL,
      linkedin VARCHAR(500) NULL,
      github VARCHAR(500) NULL,
      portfolio VARCHAR(500) NULL,
      bio TEXT NULL,
      course_proposal TEXT NULL,
      availability VARCHAR(100) NULL,
      status VARCHAR(50) DEFAULT 'pending',
      admin_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT,
      student_name VARCHAR(255),
      course_id INT,
      course_title VARCHAR(500),
      amount VARCHAR(100),
      timestamp VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Success',
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      razorpay_signature VARCHAR(500),
      FOREIGN KEY(student_id) REFERENCES atelier_students(id) ON DELETE SET NULL,
      FOREIGN KEY(course_id) REFERENCES atelier_courses(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  // Ensure Razorpay columns exist on existing transactions table
  const [txColumns] = await p.execute("SHOW COLUMNS FROM atelier_transactions");
  const txColNames = txColumns.map(c => c.Field);
  if (!txColNames.includes('razorpay_order_id')) {
    await p.execute("ALTER TABLE atelier_transactions ADD COLUMN razorpay_order_id VARCHAR(255)");
  }
  if (!txColNames.includes('razorpay_payment_id')) {
    await p.execute("ALTER TABLE atelier_transactions ADD COLUMN razorpay_payment_id VARCHAR(255)");
  }
  if (!txColNames.includes('razorpay_signature')) {
    await p.execute("ALTER TABLE atelier_transactions ADD COLUMN razorpay_signature VARCHAR(500)");
  }

  // Telegram File Storage Table
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      filename VARCHAR(500) NOT NULL,
      telegram_file_id VARCHAR(500) NOT NULL,
      telegram_file_unique_id VARCHAR(255) NOT NULL,
      telegram_message_id INT NULL,
      mime_type VARCHAR(255) NOT NULL,
      size INT NOT NULL,
      category VARCHAR(50) DEFAULT 'general',
      course_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES atelier_students(id) ON DELETE SET NULL,
      FOREIGN KEY(course_id) REFERENCES atelier_courses(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  // Ensure file_id column exists on atelier_material_assets
  const [matAssetCols] = await p.execute("SHOW COLUMNS FROM atelier_material_assets");
  const matAssetColNames = matAssetCols.map(c => c.Field);
  if (!matAssetColNames.includes('file_id')) {
    await p.execute("ALTER TABLE atelier_material_assets ADD COLUMN file_id INT NULL");
  }
  if (!matAssetColNames.includes('url')) {
    await p.execute("ALTER TABLE atelier_material_assets ADD COLUMN url VARCHAR(500) NULL");
  }

  // ─── MENTOR & LECTURERS TABLE MIGRATIONS ───
  const [lecturerColumns] = await p.execute("SHOW COLUMNS FROM atelier_lecturers");
  const lecturerColNames = lecturerColumns.map(c => c.Field);
  if (!lecturerColNames.includes('password_hash')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN password_hash VARCHAR(255) NULL");
  }
  if (!lecturerColNames.includes('must_change_password')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN must_change_password TINYINT(1) DEFAULT 1");
  }
  if (!lecturerColNames.includes('phone')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN phone VARCHAR(50) NULL");
  }
  if (!lecturerColNames.includes('avatar')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN avatar VARCHAR(500) NULL");
  }
  if (!lecturerColNames.includes('role')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN role VARCHAR(50) DEFAULT 'mentor'");
  }
  if (!lecturerColNames.includes('failed_login_count')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN failed_login_count INT DEFAULT 0");
  }
  if (!lecturerColNames.includes('locked_until')) {
    await p.execute("ALTER TABLE atelier_lecturers ADD COLUMN locked_until TIMESTAMP NULL");
  }

  // One-time backfill default mentor password hash for existing mentors
  try {
    const defaultMentorHash = hashPassword('mentor123');
    await p.execute(
      "UPDATE atelier_lecturers SET password_hash = ?, must_change_password = 1 WHERE password_hash IS NULL OR password_hash = ''",
      [defaultMentorHash]
    );
  } catch (err) {
    console.error("Backfill mentor password hash failed:", err);
  }

  // ─── MENTOR COURSES ASSIGNMENT TABLE ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_mentor_courses (
      mentor_id INT NOT NULL,
      course_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (mentor_id, course_id),
      FOREIGN KEY (mentor_id) REFERENCES atelier_lecturers(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // Initial backfill of mentor courses from existing instructor_id ONLY if table is empty
  try {
    const [mcRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_mentor_courses");
    if (mcRows?.[0]?.count === 0) {
      await p.execute(`
        INSERT IGNORE INTO atelier_mentor_courses (mentor_id, course_id)
        SELECT instructor_id, id FROM atelier_courses WHERE instructor_id IS NOT NULL
      `);
    }
  } catch (err) {}

  // ─── LIVE SESSIONS TABLE ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_live_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      mentor_id INT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      scheduled_at DATETIME NOT NULL,
      duration_minutes INT DEFAULT 60,
      meeting_link VARCHAR(500) NOT NULL,
      status ENUM('scheduled','live','completed','cancelled') DEFAULT 'scheduled',
      recording_url VARCHAR(500) NULL,
      started_at TIMESTAMP NULL,
      ended_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (mentor_id) REFERENCES atelier_lecturers(id) ON DELETE SET NULL,
      INDEX idx_course_status (course_id, status)
    ) ENGINE=InnoDB
  `);

  // ─── NORMALIZED SYLLABUS MODULES & TOPICS ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_course_syllabus (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      week_number INT DEFAULT 1,
      module_title VARCHAR(255) NOT NULL,
      description TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_syllabus_topics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      syllabus_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (syllabus_id) REFERENCES atelier_course_syllabus(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // ─── STUDENT REAL PROGRESS TABLE ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_student_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      topic_id INT NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_progress (student_id, course_id, topic_id),
      FOREIGN KEY (topic_id) REFERENCES atelier_syllabus_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES atelier_students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE,
      INDEX idx_student_course (student_id, course_id)
    ) ENGINE=InnoDB
  `);

  // Ensure completed_at column on atelier_student_courses
  const [studentCourseCols] = await p.execute("SHOW COLUMNS FROM atelier_student_courses");
  const studentCourseColNames = studentCourseCols.map(c => c.Field);
  if (!studentCourseColNames.includes('completed_at')) {
    await p.execute("ALTER TABLE atelier_student_courses ADD COLUMN completed_at TIMESTAMP NULL");
  }

  // ─── ASSESSMENTS TABLE (Core course-owned assessments) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_assessments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration_minutes INT DEFAULT 60,
      total_marks INT DEFAULT 0,
      passing_marks INT DEFAULT 0,
      max_attempts INT DEFAULT 1,
      status ENUM('draft','published','archived') DEFAULT 'draft',
      start_date DATETIME NULL,
      end_date DATETIME NULL,
      randomize_questions TINYINT(1) DEFAULT 0,
      randomize_options TINYINT(1) DEFAULT 0,
      sequential_navigation TINYINT(1) DEFAULT 0,
      proctoring_enabled TINYINT(1) DEFAULT 0,
      proctoring_config TEXT NULL,
      grading_policy ENUM('best','latest','average') DEFAULT 'best',
      show_results_immediately TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE,
      INDEX idx_course_status (course_id, status)
    ) ENGINE=InnoDB
  `);

  // ─── ASSESSMENT SECTIONS TABLE (Optional logical grouping) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_assessment_sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assessment_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES atelier_assessments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // ─── QUESTION BANK TABLE (Course-scoped reusable questions) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) NOT NULL,
      difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
      marks INT DEFAULT 1,
      negative_marks DECIMAL(5,2) DEFAULT 0,
      partial_credit TINYINT(1) DEFAULT 0,
      tags VARCHAR(255) NULL,
      config_json TEXT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES atelier_courses(id) ON DELETE CASCADE,
      INDEX idx_course_type (course_id, question_type)
    ) ENGINE=InnoDB
  `);

  // ─── QUESTION OPTIONS TABLE (For MCQ, Multi-select, True/False) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_question_options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      option_text TEXT NOT NULL,
      is_correct TINYINT(1) DEFAULT 0,
      explanation TEXT NULL,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES atelier_questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // ─── QUESTION TEST CASES (For Coding, Debugging, SQL) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_question_test_cases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      input TEXT NULL,
      expected_output TEXT NOT NULL,
      is_hidden TINYINT(1) DEFAULT 0,
      marks INT DEFAULT 0,
      explanation TEXT NULL,
      FOREIGN KEY (question_id) REFERENCES atelier_questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // ─── QUESTION RUBRICS (For Essay, Short Answer manual evaluation) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_question_rubrics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      criterion VARCHAR(255) NOT NULL,
      max_marks INT NOT NULL,
      description TEXT NULL,
      FOREIGN KEY (question_id) REFERENCES atelier_questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // ─── ASSESSMENT QUESTIONS JUNCTION ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_assessment_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assessment_id INT NOT NULL,
      section_id INT NULL,
      question_id INT NOT NULL,
      sort_order INT DEFAULT 0,
      marks INT DEFAULT 1,
      FOREIGN KEY (assessment_id) REFERENCES atelier_assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES atelier_assessment_sections(id) ON DELETE SET NULL,
      FOREIGN KEY (question_id) REFERENCES atelier_questions(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_assessment_q (assessment_id, question_id)
    ) ENGINE=InnoDB
  `);

  // ─── STUDENT ASSESSMENT ATTEMPTS (Server-authoritative timer & scoring) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assessment_id INT NOT NULL,
      student_id INT NOT NULL,
      attempt_number INT DEFAULT 1,
      status ENUM('not_started','in_progress','submitted','evaluating','evaluated','auto_submitted','cancelled') DEFAULT 'in_progress',
      started_at DATETIME NOT NULL,
      ends_at DATETIME NOT NULL,
      submitted_at DATETIME NULL,
      total_score DECIMAL(6,2) DEFAULT 0,
      percentage DECIMAL(5,2) DEFAULT 0,
      passed TINYINT(1) DEFAULT 0,
      feedback TEXT NULL,
      proctoring_flags INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES atelier_assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES atelier_students(id) ON DELETE CASCADE,
      INDEX idx_student_assessment (student_id, assessment_id)
    ) ENGINE=InnoDB
  `);

  // ─── ATTEMPT QUESTIONS (Frozen snapshot for versioning & pools) ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_attempt_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      question_id INT NOT NULL,
      section_id INT NULL,
      sort_order INT DEFAULT 0,
      marks INT DEFAULT 1,
      question_snapshot JSON NULL,
      FOREIGN KEY (attempt_id) REFERENCES atelier_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES atelier_questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // ─── STUDENT RESPONSES & MANUAL / AUTO EVALUATION ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      question_id INT NOT NULL,
      response_data JSON NULL,
      status ENUM('unanswered','saved','correct','incorrect','partial','pending_manual_review','error') DEFAULT 'saved',
      marks_awarded DECIMAL(5,2) DEFAULT 0,
      max_marks DECIMAL(5,2) DEFAULT 1,
      evaluator_feedback TEXT NULL,
      graded_by INT NULL,
      graded_at DATETIME NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES atelier_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES atelier_questions(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_attempt_q_resp (attempt_id, question_id)
    ) ENGINE=InnoDB
  `);

  // ─── PROCTORING AUDIT LOG TABLE ───
  await p.execute(`
    CREATE TABLE IF NOT EXISTS atelier_proctoring_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      student_id INT NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      metadata JSON NULL,
      timestamp DATETIME NOT NULL,
      FOREIGN KEY (attempt_id) REFERENCES atelier_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES atelier_students(id) ON DELETE CASCADE,
      INDEX idx_attempt_event (attempt_id, timestamp)
    ) ENGINE=InnoDB
  `);

  // ─── SAFE ORDERED SEEDING (Idempotent & Constraint-Aware) ───

  // 1. Seed Lecturers if table is empty
  try {
    const [lecturerCountRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_lecturers");
    if (lecturerCountRows[0].count === 0) {
      for (const l of defaultLecturers) {
        const hash = hashPassword('mentor123');
        await p.execute(
          'INSERT INTO atelier_lecturers (id, name, email, expertise, bio, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name=VALUES(name)',
          [l.id, l.name, l.email, l.expertise, l.bio, hash]
        );
      }
    }
  } catch (err) {
    console.warn("Seeding default lecturers note:", err.message);
  }

  // 2. Seed Courses if table is empty
  try {
    const [courseCountRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_courses");
    if (courseCountRows[0].count === 0) {
      for (const c of defaultCourses) {
        const badgesStr = c.badges ? c.badges.join(',') : '';
        await p.execute(
          'INSERT INTO atelier_courses (id, title, description, image, badges, price, original_price, discount, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)',
          [c.id, c.title, c.description, c.image, badgesStr, c.price, c.originalPrice, c.discount, c.instructorId]
        );
      }
    }
  } catch (err) {
    console.warn("Seeding default courses note:", err.message);
  }

  // Initial backfill of mentor courses from existing instructor_id ONLY if table is empty
  try {
    const [mcRows2] = await p.execute("SELECT COUNT(*) as count FROM atelier_mentor_courses");
    if (mcRows2?.[0]?.count === 0) {
      await p.execute(`
        INSERT IGNORE INTO atelier_mentor_courses (mentor_id, course_id)
        SELECT instructor_id, id FROM atelier_courses WHERE instructor_id IS NOT NULL
      `);
    }
  } catch (err) {}

  // Retrieve all existing course IDs to strictly avoid foreign key constraint violations
  let existingCourseIds = new Set();
  try {
    const [courseRows] = await p.execute("SELECT id FROM atelier_courses");
    existingCourseIds = new Set(courseRows.map(c => c.id));
  } catch (err) {
    console.warn("Could not query existing course IDs:", err.message);
  }

  // 3. Seed sample syllabus modules & topics if table is empty AND courses exist
  try {
    const [syllabusCountRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_course_syllabus");
    if (syllabusCountRows[0].count === 0 && existingCourseIds.size > 0) {
      const defaultSyllabusData = [
        {
          courseId: 1,
          modules: [
            {
              week: 1,
              title: 'Modern Full-Stack Architecture & Next.js Core',
              desc: 'Foundational mental models of React 19, Turbopack, and Next.js App Router.',
              topics: ['React Server Components vs Client Boundaries', 'Streaming SSR & Suspense Architecture', 'Server Actions & Form Handling', 'Routing & Layout Shell Engineering']
            },
            {
              week: 2,
              title: 'Database Engineering & Relational Modeling',
              desc: 'Designing production schemas, normalization, and ACID transactions.',
              topics: ['Relational Schema Design & Constraints', 'Connection Pooling & Query Optimization', 'Database Migrations & Idempotency', 'Indexing Strategies & B-Trees']
            },
            {
              week: 3,
              title: 'API Infrastructure & External Integrations',
              desc: 'Building resilient API layers, payment processing, and messaging gateways.',
              topics: ['REST & RPC API Design Principles', 'Webhook Handling & Cryptographic Verification', 'Telegram Bot API Storage Integration', 'Payment Processing with Razorpay']
            },
            {
              week: 4,
              title: 'Production Deployment & Observability',
              desc: 'Containerization, performance monitoring, and CI/CD pipelines.',
              topics: ['Docker Multi-stage Builds', 'Caching Strategies & CDN Delivery', 'Structured Error Logging & Health Probes', 'Zero-Downtime Deployment']
            }
          ]
        },
        {
          courseId: 2,
          modules: [
            {
              week: 1,
              title: 'High-Availability Load Balancing & Proxies',
              desc: 'Configuring reverse proxies, SSL termination, and health checks.',
              topics: ['Reverse Proxies & Nginx Configuration', 'Least-Connection & Round-Robin Algorithms', 'Layer 4 vs Layer 7 Routing', 'Rate Limiting & DDoS Mitigation']
            },
            {
              week: 2,
              title: 'Horizontal Database Partitioning & Sharding',
              desc: 'Partition keys, consistent hashing rings, and cross-shard queries.',
              topics: ['Consistent Hashing Implementation', 'Range & Hash-Based Partitioning', 'Primary-Replica Replication Lag', 'Distributed Locks & Two-Phase Commit']
            },
            {
              week: 3,
              title: 'Distributed In-Memory Caching (Redis)',
              desc: 'Cache invalidation, read-through, and cache stampede protection.',
              topics: ['Cache Patterns (Cache-Aside, Write-Through)', 'Redis Data Structures & Memory Policies', 'Thundering Herd & Cache Stampede Solutions', 'Cache Eviction Algorithms (LRU/LFU)']
            },
            {
              week: 4,
              title: 'Asynchronous Event-Driven Messaging (Kafka/RabbitMQ)',
              desc: 'Message brokers, consumer groups, and idempotency in queues.',
              topics: ['Publish-Subscribe vs Message Queue Patterns', 'Consumer Groups & Partition Rebalancing', 'Dead Letter Queues & Retry Strategies', 'Event Sourcing & CQRS Architecture']
            }
          ]
        },
        {
          courseId: 3,
          modules: [
            {
              week: 1,
              title: 'LLM Foundations, Embeddings & Vector Stores',
              desc: 'Understanding tokenization, embedding spaces, and approximate nearest neighbors.',
              topics: ['Transformer Architecture & Attention Mechanisms', 'Generating High-Dimensional Embeddings', 'Vector Indices (HNSW, IVFFlat)', 'Similarity Metrics (Cosine, Euclidean)']
            },
            {
              week: 2,
              title: 'Retrieval Augmented Generation (RAG) Systems',
              desc: 'Chunking strategies, hybrid search, and context window optimization.',
              topics: ['Document Chunking & Metadata Filtering', 'Hybrid Dense-Sparse Keyword Search', 'Re-ranking & Context Relevance Optimization', 'RAG Evaluation & Hallucination Detection']
            },
            {
              week: 3,
              title: 'Autonomous Tool-Augmented Agents',
              desc: 'Tool execution loops, ReAct prompting, and agent state machines.',
              topics: ['ReAct Prompting & Decision Loops', 'Function Calling & Schema Validation', 'Multi-Agent Collaboration Networks', 'Memory & Conversation State Persistence']
            }
          ]
        }
      ];

      for (const syllabusGroup of defaultSyllabusData) {
        if (!existingCourseIds.has(syllabusGroup.courseId)) continue;

        for (let mIdx = 0; mIdx < syllabusGroup.modules.length; mIdx++) {
          const mod = syllabusGroup.modules[mIdx];
          const [modRes] = await p.execute(
            `INSERT INTO atelier_course_syllabus (course_id, week_number, module_title, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
            [syllabusGroup.courseId, mod.week, mod.title, mod.desc, mIdx + 1]
          );
          const syllabusId = modRes.insertId;

          for (let tIdx = 0; tIdx < mod.topics.length; tIdx++) {
            await p.execute(
              `INSERT INTO atelier_syllabus_topics (syllabus_id, title, sort_order) VALUES (?, ?, ?)`,
              [syllabusId, mod.topics[tIdx], tIdx + 1]
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn("Seeding default syllabus note:", err.message);
  }

  // 4. Seed sample live sessions if empty AND courses exist
  try {
    const [liveCountRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_live_sessions");
    if (liveCountRows[0].count === 0 && existingCourseIds.size > 0) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().slice(0, 19).replace('T', ' ');

      if (existingCourseIds.has(1)) {
        await p.execute(
          `INSERT INTO atelier_live_sessions (course_id, mentor_id, title, description, scheduled_at, duration_minutes, meeting_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            1,
            1,
            'Live Cohort Code Review: Server Actions & Next.js Patterns',
            'Interactive architectural walkthrough reviewing student project submissions and best practices.',
            tomorrowStr,
            75,
            'https://meet.google.com/qwe-rtyu-iop',
            'scheduled'
          ]
        );
      }

      if (existingCourseIds.has(2)) {
        await p.execute(
          `INSERT INTO atelier_live_sessions (course_id, mentor_id, title, description, scheduled_at, duration_minutes, meeting_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            2,
            1,
            'System Architecture Masterclass: Database Partitioning & Sharding',
            'Hands-on live laboratory designing consistent hashing rings and sharding routers under high concurrency.',
            tomorrowStr,
            90,
            'https://meet.google.com/asd-fghj-klz',
            'scheduled'
          ]
        );
      }
    }
  } catch (err) {
    console.warn("Seeding default live sessions note:", err.message);
  }

  // 5. Seed Students if table is empty
  try {
    const [studentRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_students");
    if (studentRows[0].count === 0) {
      for (const s of defaultStudents) {
        await p.execute(
          'INSERT INTO atelier_students (id, name, email, phone, college, grad_year, xp, streak, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.name, s.email, s.phone, s.college, s.gradYear, s.xp, s.streak, 'password']
        );
        if (s.enrolledCourses) {
          for (const courseId of s.enrolledCourses) {
            if (existingCourseIds.has(courseId)) {
              await p.execute(
                'INSERT INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)',
                [s.id, courseId]
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Seeding default students note:", err.message);
  }

  // 6. Seed Schedule if empty
  try {
    const [scRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_schedule");
    if (scRows[0].count === 0 && existingCourseIds.size > 0) {
      for (const sc of defaultSchedule) {
        if (existingCourseIds.has(sc.courseId)) {
          await p.execute(
            'INSERT INTO atelier_schedule (id, course_id, time, title, type) VALUES (?, ?, ?, ?, ?)',
            [sc.id, sc.courseId, sc.time, sc.title, sc.type]
          );
        }
      }
    }
  } catch (err) {
    console.warn("Seeding default schedule note:", err.message);
  }

  // 7. Seed Recordings if empty
  try {
    const [recRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_recordings");
    if (recRows[0].count === 0 && existingCourseIds.size > 0) {
      for (const rec of defaultRecordings) {
        if (existingCourseIds.has(rec.courseId)) {
          await p.execute(
            'INSERT INTO atelier_recordings (id, course_id, title, date, image) VALUES (?, ?, ?, ?, ?)',
            [rec.id, rec.courseId, rec.title, rec.date, rec.image]
          );
        }
      }
    }
  } catch (err) {
    console.warn("Seeding default recordings note:", err.message);
  }

  // 8. Seed Materials & Assets if empty
  try {
    const [matRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_materials");
    if (matRows[0].count === 0 && existingCourseIds.size > 0) {
      for (const mat of defaultMaterials) {
        if (existingCourseIds.has(mat.courseId)) {
          await p.execute(
            'INSERT INTO atelier_materials (id, course_id, title) VALUES (?, ?, ?)',
            [mat.id, mat.courseId, mat.title]
          );
          if (mat.assets) {
            for (const asset of mat.assets) {
              await p.execute(
                'INSERT INTO atelier_material_assets (material_id, name, size, type) VALUES (?, ?, ?, ?)',
                [mat.id, asset.name, asset.size, asset.type]
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Seeding default materials note:", err.message);
  }

  // 9. Seed Callbacks if empty
  try {
    const [cbRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_callbacks");
    if (cbRows[0].count === 0) {
      for (const cb of defaultCallbacks) {
        await p.execute(
          'INSERT INTO atelier_callbacks (id, student_name, phone, topic, time, status) VALUES (?, ?, ?, ?, ?, ?)',
          [cb.id, cb.studentName, cb.phone, cb.topic, cb.time, cb.status]
        );
      }
    }
  } catch (err) {
    console.warn("Seeding default callbacks note:", err.message);
  }

  // 10. Seed Transactions if empty
  try {
    const [txRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_transactions");
    if (txRows[0].count === 0 && existingCourseIds.size > 0) {
      for (const tx of defaultTransactions) {
        if (existingCourseIds.has(tx.courseId)) {
          await p.execute(
            'INSERT INTO atelier_transactions (id, student_id, student_name, course_id, course_title, amount, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [tx.id, tx.studentId, tx.studentName, tx.courseId, tx.courseTitle, tx.amount, tx.timestamp, tx.status]
          );
        }
      }
    }
  } catch (err) {
    console.warn("Seeding default transactions note:", err.message);
  }

  // 11. Seed Sample Mixed Assessment & Questions if empty
  await seedSampleAssessmentsIfEmpty(p);

  initialized = true;
}

async function seedSampleAssessmentsIfEmpty(p) {
  try {
    const [countRows] = await p.execute("SELECT COUNT(*) as count FROM atelier_assessments");
    if (countRows[0].count > 0) return;

    const [courses] = await p.execute("SELECT id FROM atelier_courses ORDER BY id ASC LIMIT 2");
    if (!courses || courses.length === 0) return;

    const courseId = courses[0].id;

    // 1. Create Assessment 1 (Mixed Comprehensive)
    const [asstRes] = await p.execute(`
      INSERT INTO atelier_assessments (
        course_id, title, description, duration_minutes, total_marks, passing_marks, max_attempts,
        status, randomize_questions, randomize_options, sequential_navigation, proctoring_enabled,
        proctoring_config, grading_policy, show_results_immediately
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      courseId,
      'Full-Stack Architecture & Engineering Assessment',
      'Comprehensive multi-section mixed diagnostic examination evaluating architecture fundamentals, ACID semantics, algorithms, SQL queries, debugging, and system design.',
      45,
      55,
      28,
      3,
      'published',
      0,
      0,
      0,
      1,
      JSON.stringify({ tabSwitchLimit: 3, warnOnBlur: true, fullScreenRecommended: true }),
      'best',
      1
    ]);
    const assessmentId = asstRes.insertId;

    // Create 3 Sections
    const [sec1Res] = await p.execute(
      "INSERT INTO atelier_assessment_sections (assessment_id, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [assessmentId, 'Section A: Architectural Fundamentals & Concepts', 'Objective multi-format core concepts (MCQ, Multi-select, True/False, Fill Blank, Numerical)', 1]
    );
    const sec1Id = sec1Res.insertId;

    const [sec2Res] = await p.execute(
      "INSERT INTO atelier_assessment_sections (assessment_id, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [assessmentId, 'Section B: Systems & Domain Analysis', 'Systems patterns, matching, ordering, and subjective essay evaluations', 2]
    );
    const sec2Id = sec2Res.insertId;

    const [sec3Res] = await p.execute(
      "INSERT INTO atelier_assessment_sections (assessment_id, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [assessmentId, 'Section C: Practical Engineering & Coding', 'Interactive programming, debugging, SQL queries, code output, and architectural artifact upload', 3]
    );
    const sec3Id = sec3Res.insertId;

    // Seed questions list
    const questionsToSeed = [
      // --- SECTION 1 ---
      {
        sectionId: sec1Id,
        title: 'React Server Components Architecture',
        questionText: 'What is the primary architectural advantage of React Server Components (RSC) compared to traditional client-side rendering?',
        questionType: 'single_choice',
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.5,
        partialCredit: 0,
        tags: 'react,nextjs,architecture',
        config: null,
        options: [
          { text: 'They eliminate unnecessary bundle weight by streaming zero JavaScript bundle to the client for server-only components.', isCorrect: 1, explanation: 'RSCs render purely on the server and emit serialized JSON/JSX without adding JS runtime cost.' },
          { text: 'They execute entirely inside service workers in the user browser.', isCorrect: 0, explanation: 'Service workers handle caching and background tasks on the client, not RSC.' },
          { text: 'They replace relational databases with in-memory browser storage.', isCorrect: 0, explanation: 'RSCs query databases directly from server context, but do not replace databases.' },
          { text: 'They automatically compile React code directly into native WebAssembly binaries.', isCorrect: 0, explanation: 'RSC runs standard JavaScript/TypeScript on the Node/Edge server runtime.' }
        ]
      },
      {
        sectionId: sec1Id,
        title: 'ACID Database Properties',
        questionText: 'Which of the following represent core ACID guarantees provided by relational database management systems? (Select all that apply)',
        questionType: 'multiple_choice',
        difficulty: 'medium',
        marks: 3,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'database,sql,acid',
        config: null,
        options: [
          { text: 'Atomicity (all operations within a transaction succeed or all rollback)', isCorrect: 1, explanation: 'Atomicity ensures all-or-nothing transactions.' },
          { text: 'Consistency (database transitions strictly between valid schema states)', isCorrect: 1, explanation: 'Consistency guarantees integrity rules and foreign keys.' },
          { text: 'Isolation (concurrent transactions execute without race conditions)', isCorrect: 1, explanation: 'Isolation prevents dirty reads, non-repeatable reads, and phantom reads.' },
          { text: 'Durability (committed modifications persist despite power losses or crashes)', isCorrect: 1, explanation: 'Durability is guaranteed via Write-Ahead Logs (WAL).' },
          { text: 'Availability (every non-failing node must return an immediate response)', isCorrect: 0, explanation: 'Availability is a CAP theorem attribute, not an ACID database transaction property.' }
        ]
      },
      {
        sectionId: sec1Id,
        title: 'HTTP/2 & HTTP/3 Multiplexing',
        questionText: 'True or False: In HTTP/2 and HTTP/3, multiplexing allows multiple concurrent requests and responses over a single transport connection, eliminating head-of-line blocking at the application layer.',
        questionType: 'true_false',
        difficulty: 'easy',
        marks: 1,
        negativeMarks: 0,
        partialCredit: 0,
        tags: 'networking,http',
        config: null,
        options: [
          { text: 'True', isCorrect: 1, explanation: 'HTTP/2 multiplexes streams across binary frames over a single TCP connection.' },
          { text: 'False', isCorrect: 0, explanation: '' }
        ]
      },
      {
        sectionId: sec1Id,
        title: 'DDL Truncate Operation',
        questionText: 'The DDL SQL statement used to quickly deallocate all data pages from a table without individually recording row-level deletes is `[[TRUNCATE]]`.',
        questionType: 'fill_blank',
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0,
        partialCredit: 0,
        tags: 'sql,ddl',
        config: { caseSensitive: false, acceptedAnswers: ['TRUNCATE', 'TRUNCATE TABLE'] }
      },
      {
        sectionId: sec1Id,
        title: 'Hash Table Load Factor',
        questionText: 'A hash table has 1,000 allocated buckets and currently stores 650 unique elements. What is the current load factor (alpha) of this hash table? (Express as a decimal number)',
        questionType: 'numerical',
        difficulty: 'easy',
        marks: 2,
        negativeMarks: 0,
        partialCredit: 0,
        tags: 'data-structures,hash-table',
        config: { targetValue: 0.65, tolerance: 0.01 }
      },

      // --- SECTION 2 ---
      {
        sectionId: sec2Id,
        title: 'Distributed Systems Patterns Matching',
        questionText: 'Match each distributed systems component/pattern with its primary operational purpose.',
        questionType: 'matching',
        difficulty: 'hard',
        marks: 4,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'distributed-systems,architecture',
        config: {
          pairs: [
            { left: 'Reverse Proxy', right: 'Terminates TLS and distributes load to upstream application servers' },
            { left: 'Write-Ahead Log (WAL)', right: 'Ensures durability by appending operations to disk before flushing memory' },
            { left: 'Consistent Hashing', right: 'Minimizes key reorganization when cache nodes scale dynamically' },
            { left: 'Circuit Breaker', right: 'Prevents cascading failures by halting calls to an unhealthy dependency' }
          ]
        }
      },
      {
        sectionId: sec2Id,
        title: 'Browser Critical Rendering Path',
        questionText: 'Arrange the stages of the Browser Critical Rendering Path in chronological order from earliest to latest.',
        questionType: 'ordering',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'web-performance,browser',
        config: {
          items: [
            'Parse HTML and construct DOM tree',
            'Parse CSS and construct CSSOM tree',
            'Combine DOM and CSSOM to create Render Tree',
            'Compute geometry and execute Layout (Reflow)',
            'Paint pixels and Composite layers onto GPU'
          ]
        }
      },
      {
        sectionId: sec2Id,
        title: 'Database Indexing Trade-offs',
        questionText: 'Explain the fundamental trade-off of adding multiple B-Tree indexes to an OLTP database table with high write volume.',
        questionType: 'short_answer',
        difficulty: 'medium',
        marks: 3,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'databases,indexing,tradeoffs',
        rubrics: [
          { criterion: 'Read Acceleration Explanation', maxMarks: 1, description: 'Clearly explains how B-tree search reduces disk I/O for SELECT queries.' },
          { criterion: 'Write Overhead & Page Splitting Impact', maxMarks: 2, description: 'Accurately explains write amplification, index tree maintenance, and page splits on INSERT/UPDATE/DELETE.' }
        ]
      },
      {
        sectionId: sec2Id,
        title: 'Monolith vs Microservices Architecture',
        questionText: 'Compare Monolithic Architecture and Microservices Architecture across three dimensions: 1) Deployment independence and blast radius, 2) Data consistency & distributed transactions (Saga / 2PC), and 3) Operational and observability overhead. Provide concrete trade-offs.',
        questionType: 'essay',
        difficulty: 'hard',
        marks: 10,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'architecture,microservices,system-design',
        rubrics: [
          { criterion: 'Deployment & Blast Radius Analysis', maxMarks: 3, description: 'Compares unified deployment pipeline vs decentralized services with bounded blast radiuses.' },
          { criterion: 'Data Consistency & Distributed Transactions', maxMarks: 4, description: 'Evaluates ACID single-database transactions vs Saga orchestrator/choreography and eventual consistency.' },
          { criterion: 'Operational Overhead & Observability', maxMarks: 3, description: 'Details tracing (OpenTelemetry), distributed logging, service mesh, and infrastructure complexity.' }
        ]
      },

      // --- SECTION 3 ---
      {
        sectionId: sec3Id,
        title: 'Two Sum Algorithm',
        questionText: 'Write a JavaScript function `twoSum(nums, target)` that returns an array with the two 0-based indices of the numbers such that they add up to `target`. Assume exactly one valid solution exists.',
        questionType: 'coding',
        difficulty: 'medium',
        marks: 6,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'algorithms,javascript,hash-map',
        config: {
          language: 'javascript',
          starterCode: 'function twoSum(nums, target) {\n  // Implement your O(n) hash map or O(n^2) solution\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}'
        },
        testCases: [
          { input: JSON.stringify({ args: [[2, 7, 11, 15], 9] }), expectedOutput: '[0,1]', isHidden: 0, marks: 2 },
          { input: JSON.stringify({ args: [[3, 2, 4], 6] }), expectedOutput: '[1,2]', isHidden: 0, marks: 2 },
          { input: JSON.stringify({ args: [[3, 3], 6] }), expectedOutput: '[0,1]', isHidden: 1, marks: 2 }
        ]
      },
      {
        sectionId: sec3Id,
        title: 'Binary Search Off-by-One Debugging',
        questionText: 'The following implementation of binary search contains a bug when searching for boundary elements. Fix the high pointer or boundary condition so all test cases pass.',
        questionType: 'debugging',
        difficulty: 'medium',
        marks: 6,
        negativeMarks: 0,
        partialCredit: 1,
        tags: 'debugging,algorithms,binary-search',
        config: {
          language: 'javascript',
          starterCode: 'function binarySearch(arr, target) {\n  let low = 0;\n  let high = arr.length; // BUG: Should be arr.length - 1\n  while (low <= high) {\n    let mid = Math.floor((low + high) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}'
        },
        testCases: [
          { input: JSON.stringify({ args: [[1, 3, 5, 7, 9], 1] }), expectedOutput: '0', isHidden: 0, marks: 2 },
          { input: JSON.stringify({ args: [[1, 3, 5, 7, 9], 9] }), expectedOutput: '4', isHidden: 0, marks: 2 },
          { input: JSON.stringify({ args: [[1, 3, 5, 7, 9], 6] }), expectedOutput: '-1', isHidden: 1, marks: 2 }
        ]
      },
      {
        sectionId: sec3Id,
        title: 'High Earner Department SQL Query',
        questionText: 'Write an SQL query to retrieve the `name` and `salary` of all employees from the `employees` table who earn strictly more than 60,000, sorted by `salary` in descending order.',
        questionType: 'sql',
        difficulty: 'medium',
        marks: 5,
        negativeMarks: 0,
        partialCredit: 0,
        tags: 'sql,database,queries',
        config: {
          schemaSql: 'CREATE TABLE employees (id INT, name TEXT, salary INT, department TEXT); INSERT INTO employees VALUES (1, "Alice", 75000, "Engineering"), (2, "Bob", 52000, "Design"), (3, "Charlie", 89000, "Engineering"), (4, "David", 60000, "Marketing");',
          expectedSql: 'SELECT name, salary FROM employees WHERE salary > 60000 ORDER BY salary DESC'
        }
      },
      {
        sectionId: sec3Id,
        title: 'JavaScript Event Loop & Closure Output',
        questionText: 'What is the exact output printed to the console when the following code executes?\n\n```javascript\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 10);\n}\n```\n(Enter each line of output separated by a newline)',
        questionType: 'code_output',
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0,
        partialCredit: 0,
        tags: 'javascript,event-loop,closures',
        config: {
          expectedOutput: '3\n3\n3',
          trimWhitespace: true
        }
      },
      {
        sectionId: sec3Id,
        title: 'Distributed System Architecture Diagram',
        questionText: 'Upload your architectural block diagram (PDF, PNG, JPG, or SVG) depicting a distributed URL shortener service (including DNS, load balancers, rate limiter, database, and Redis cache cluster).',
        questionType: 'file_upload',
        difficulty: 'hard',
        marks: 5,
        negativeMarks: 0,
        partialCredit: 0,
        tags: 'system-design,architecture,diagram',
        config: {
          allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.svg'],
          maxSizeBytes: 10485760
        }
      }
    ];

    let sortOrder = 1;
    for (const q of questionsToSeed) {
      const configStr = q.config ? JSON.stringify(q.config) : null;
      const [qRes] = await p.execute(`
        INSERT INTO atelier_questions (
          course_id, title, question_text, question_type, difficulty, marks,
          negative_marks, partial_credit, tags, config_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        courseId, q.title, q.questionText, q.questionType, q.difficulty, q.marks,
        q.negativeMarks, q.partialCredit, q.tags, configStr
      ]);
      const questionId = qRes.insertId;

      // Options
      if (q.options) {
        let optOrder = 1;
        for (const opt of q.options) {
          await p.execute(`
            INSERT INTO atelier_question_options (question_id, option_text, is_correct, explanation, sort_order)
            VALUES (?, ?, ?, ?, ?)
          `, [questionId, opt.text, opt.isCorrect, opt.explanation || null, optOrder++]);
        }
      }

      // Test Cases
      if (q.testCases) {
        for (const tc of q.testCases) {
          await p.execute(`
            INSERT INTO atelier_question_test_cases (question_id, input, expected_output, is_hidden, marks)
            VALUES (?, ?, ?, ?, ?)
          `, [questionId, tc.input, tc.expectedOutput, tc.isHidden, tc.marks]);
        }
      }

      // Rubrics
      if (q.rubrics) {
        for (const rub of q.rubrics) {
          await p.execute(`
            INSERT INTO atelier_question_rubrics (question_id, criterion, max_marks, description)
            VALUES (?, ?, ?, ?)
          `, [questionId, rub.criterion, rub.maxMarks, rub.description]);
        }
      }

      // Link to assessment
      await p.execute(`
        INSERT INTO atelier_assessment_questions (assessment_id, section_id, question_id, sort_order, marks)
        VALUES (?, ?, ?, ?, ?)
      `, [assessmentId, q.sectionId, questionId, sortOrder++, q.marks]);
    }

    console.log(`[Atelier Assessment Engine] Successfully seeded sample assessment #${assessmentId} with 14 question types.`);
  } catch (seedErr) {
    console.warn("Seeding sample assessments error:", seedErr.message);
  }
}

// Exported query helpers
export async function query(sql, params = []) {
  await initDb();
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  await initDb();
  const p = await getPool();
  const [result] = await p.execute(sql, params);
  return result;
}

export async function getConnection() {
  await initDb();
  const p = await getPool();
  return p.getConnection();
}

// --- FILE STORAGE HELPERS ---
export async function createFileRecord({ userId, filename, telegramFileId, telegramFileUniqueId, telegramMessageId, mimeType, size, category = 'general', courseId = null }) {
  await initDb();
  const p = await getPool();
  const [result] = await p.execute(
    `INSERT INTO atelier_files (user_id, filename, telegram_file_id, telegram_file_unique_id, telegram_message_id, mime_type, size, category, course_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId || null, filename, telegramFileId, telegramFileUniqueId, telegramMessageId || null, mimeType, size, category, courseId || null]
  );
  return {
    id: result.insertId,
    userId,
    filename,
    telegramFileId,
    telegramFileUniqueId,
    telegramMessageId,
    mimeType,
    size,
    category,
    courseId
  };
}

export async function getFileRecordById(id) {
  await initDb();
  const p = await getPool();
  const [rows] = await p.execute('SELECT * FROM atelier_files WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    filename: r.filename,
    telegramFileId: r.telegram_file_id,
    telegramFileUniqueId: r.telegram_file_unique_id,
    telegramMessageId: r.telegram_message_id,
    mimeType: r.mime_type,
    size: r.size,
    category: r.category,
    courseId: r.course_id,
    createdAt: r.created_at
  };
}

export async function deleteFileRecord(id) {
  await initDb();
  const p = await getPool();
  const [result] = await p.execute('DELETE FROM atelier_files WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function getFilesForUser(userId) {
  await initDb();
  const p = await getPool();
  const [rows] = await p.execute('SELECT * FROM atelier_files WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    filename: r.filename,
    telegramFileId: r.telegram_file_id,
    telegramFileUniqueId: r.telegram_file_unique_id,
    telegramMessageId: r.telegram_message_id,
    mimeType: r.mime_type,
    size: r.size,
    category: r.category,
    courseId: r.course_id,
    createdAt: r.created_at
  }));
}
