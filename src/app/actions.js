'use server';

import { query, execute, getConnection, createFileRecord, getFileRecordById, deleteFileRecord, getFilesForUser } from '../utils/db-sql';
import { deleteMessageFromTelegram } from '../lib/telegram';
import { hashPassword, verifyPassword, generateTempPassword, signMentorSession, isMentorLocked, assertMentorOwnsCourse, signAdminSession, verifyAdminSessionToken } from '../utils/auth';
import { sendEmailOtp, verifyEmailOtp, resendEmailOtp } from '../utils/mojoauth';
import { trackServer, trackAudit } from '@/lib/analytics/server';



// --- STUDENTS ACTIONS ---
export async function getStudents() {
  try {
    const students = await query("SELECT * FROM atelier_students");
    for (const s of students) {
      const enrollments = await query("SELECT course_id FROM atelier_student_courses WHERE student_id = ?", [s.id]);
      s.enrolledCourses = enrollments.map(e => e.course_id);
      // Map database snake_case fields back to frontend camelCase
      s.gradYear = s.grad_year;
      delete s.grad_year;
      s.lastActiveDate = s.last_active_date;
      delete s.last_active_date;
      s.degree = s.degree || '';
      s.skills = s.skills ? s.skills.split(',') : [];
    }
    return students;
  } catch (e) {
    console.error("SQL Error in getStudents:", e);
    return [];
  }
}

export async function saveStudent(s) {
  try {
    let exists = null;
    if (s.id) {
      const rows = await query("SELECT id FROM atelier_students WHERE id = ?", [s.id]);
      exists = rows.length > 0 ? rows[0] : null;
    }

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const skillsStr = Array.isArray(s.skills) ? s.skills.join(',') : (s.skills || '');

      if (exists) {
        // Update student
        await conn.execute(
          `UPDATE atelier_students SET name = ?, email = ?, phone = ?, college = ?, degree = ?, grad_year = ?, xp = ?, streak = ?, bio = ?, github = ?, linkedin = ?, portfolio = ?, skills = ? WHERE id = ?`,
          [s.name, s.email, s.phone, s.college, s.degree || null, s.gradYear || s.grad_year, s.xp || 0, s.streak || 0, s.bio || null, s.github || null, s.linkedin || null, s.portfolio || null, skillsStr || null, s.id]
        );

        // Sync enrollments
        await conn.execute("DELETE FROM atelier_student_courses WHERE student_id = ?", [s.id]);
        if (s.enrolledCourses) {
          for (const cId of s.enrolledCourses) {
            await conn.execute("INSERT INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)", [s.id, cId]);
          }
        }
      } else {
        // Insert student
        const [result] = await conn.execute(
          `INSERT INTO atelier_students (name, email, phone, college, degree, grad_year, xp, streak, password, bio, github, linkedin, portfolio, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.name, s.email, s.phone, s.college, s.degree || null, s.gradYear || s.grad_year, s.xp || 0, s.streak || 0, s.password || 'password', s.bio || null, s.github || null, s.linkedin || null, s.portfolio || null, skillsStr || null]
        );

        const newStudentId = result.insertId;
        if (s.enrolledCourses) {
          for (const cId of s.enrolledCourses) {
            await conn.execute("INSERT INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)", [newStudentId, cId]);
          }
        }
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    try {
      if (exists) {
        trackAudit({
          action: 'Updated Student',
          entity: 'Student',
          entityId: s.id,
          newValue: `${s.name} (${s.email})`,
          status: 'SUCCESS'
        });
        trackServer('student_updated', { userId: Number(s.id), role: 'student' });
      } else {
        trackAudit({
          action: 'Created Student',
          entity: 'Student',
          newValue: `${s.name} (${s.email})`,
          status: 'SUCCESS'
        });
        trackServer('student_created', { role: 'student' });
      }
    } catch (anErr) {}

    return { success: true };
  } catch (e) {
    console.error("SQL Error in saveStudent:", e);
    throw new Error(e.message);
  }
}

export async function deleteStudent(id) {
  try {
    await execute("DELETE FROM atelier_students WHERE id = ?", [id]);
    try {
      trackAudit({
        action: 'Deleted Student',
        entity: 'Student',
        entityId: id,
        status: 'SUCCESS'
      });
      trackServer('student_deleted', { userId: Number(id), role: 'student' });
    } catch (anErr) {}
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteStudent:", e);
    throw new Error(e.message);
  }
}


export async function updateStudentProfile(id, name, email, phone, college, degree, gradYear, bio, github, linkedin, portfolio, skills, avatar = null) {
  try {
    const skillsStr = Array.isArray(skills) ? skills.join(',') : (skills || '');
    if (avatar) {
      await execute(
        `UPDATE atelier_students SET name = ?, email = ?, phone = ?, college = ?, degree = ?, grad_year = ?, bio = ?, github = ?, linkedin = ?, portfolio = ?, skills = ?, avatar = ? WHERE id = ?`,
        [name, email, phone, college, degree || null, gradYear, bio || null, github || null, linkedin || null, portfolio || null, skillsStr || null, avatar, id]
      );
    } else {
      await execute(
        `UPDATE atelier_students SET name = ?, email = ?, phone = ?, college = ?, degree = ?, grad_year = ?, bio = ?, github = ?, linkedin = ?, portfolio = ?, skills = ? WHERE id = ?`,
        [name, email, phone, college, degree || null, gradYear, bio || null, github || null, linkedin || null, portfolio || null, skillsStr || null, id]
      );
    }
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateStudentProfile:", e);
    throw new Error(e.message);
  }
}

export async function updateStudentAvatar(id, avatarUrl) {
  try {
    await execute("UPDATE atelier_students SET avatar = ? WHERE id = ?", [avatarUrl, id]);
    return { success: true, avatar: avatarUrl };
  } catch (e) {
    console.error("SQL Error in updateStudentAvatar:", e);
    throw new Error(e.message);
  }
}

export async function deleteUploadedFile(fileId, userEmail = null, isAdmin = false) {
  try {
    const file = await getFileRecordById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    if (!isAdmin && userEmail) {
      const studentRows = await query("SELECT id FROM atelier_students WHERE LOWER(email) = LOWER(?)", [userEmail]);
      if (studentRows.length === 0 || studentRows[0].id !== file.userId) {
        throw new Error("Unauthorized to delete this file.");
      }
    }

    // Delete message from Telegram channel if telegramMessageId is stored
    if (file.telegramMessageId) {
      await deleteMessageFromTelegram(file.telegramMessageId).catch((err) => {
        console.warn("Could not delete message from Telegram:", err.message);
      });
    }

    // Delete from database
    await deleteFileRecord(fileId);
    return { success: true };
  } catch (e) {
    console.error("Error in deleteUploadedFile:", e);
    throw new Error(e.message);
  }
}


export async function recordStudentDailyStreak(studentEmail) {
  try {
    const cleanEmail = (studentEmail || '').trim().toLowerCase();
    if (!cleanEmail) return { streak: 1 };

    const rows = await query("SELECT id, streak, last_active_date FROM atelier_students WHERE LOWER(email) = LOWER(?)", [cleanEmail]);
    if (rows.length === 0) return { streak: 1 };
    const student = rows[0];

    const today = new Date().toISOString().split('T')[0];
    const lastActive = student.last_active_date;
    let newStreak = Number(student.streak) || 1;

    if (!lastActive) {
      newStreak = 1;
      await execute("UPDATE atelier_students SET streak = 1, last_active_date = ? WHERE id = ?", [today, student.id]);
    } else if (lastActive === today) {
      newStreak = Math.max(newStreak, 1);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      await execute("UPDATE atelier_students SET streak = ?, last_active_date = ? WHERE id = ?", [newStreak, today, student.id]);
    }

    return { streak: newStreak, lastActiveDate: today };
  } catch (e) {
    console.error("SQL Error in recordStudentDailyStreak:", e);
    return { streak: 1 };
  }
}

// --- COURSES ACTIONS ---
export async function getCourses() {
  try {
    const courses = await query("SELECT * FROM atelier_courses");
    courses.forEach(c => {
      c.badges = c.badges ? c.badges.split(',') : [];
      c.instructorId = c.instructor_id;
      c.originalPrice = c.original_price;
      c.curriculumOverview = c.curriculum_overview;
      c.totalHours = c.total_hours;
      c.totalModules = c.total_modules;
      c.totalProjects = c.total_projects;
      c.toolsTechnologies = c.tools_technologies;
      c.certificateTitle = c.certificate_title;
      c.courseOutcomes = c.course_outcomes;
      c.batchStartDate = c.batch_start_date;
      delete c.instructor_id;
      delete c.original_price;
      delete c.curriculum_overview;
      delete c.total_hours;
      delete c.total_modules;
      delete c.total_projects;
      delete c.tools_technologies;
      delete c.certificate_title;
      delete c.course_outcomes;
      delete c.batch_start_date;
    });
    return courses;
  } catch (e) {
    console.error("SQL Error in getCourses:", e);
    return [];
  }
}

export async function getCourseById(id) {
  try {
    const rows = await query("SELECT * FROM atelier_courses WHERE id = ?", [id]);
    if (rows.length === 0) return null;
    const c = rows[0];
    c.badges = c.badges ? c.badges.split(',') : [];
    c.instructorId = c.instructor_id;
    c.originalPrice = c.original_price;
    c.curriculumOverview = c.curriculum_overview;
    c.totalHours = c.total_hours;
    c.totalModules = c.total_modules;
    c.totalProjects = c.total_projects;
    c.toolsTechnologies = c.tools_technologies;
    c.certificateTitle = c.certificate_title;
    c.courseOutcomes = c.course_outcomes;
    c.batchStartDate = c.batch_start_date;
    delete c.instructor_id;
    delete c.original_price;
    delete c.curriculum_overview;
    delete c.total_hours;
    delete c.total_modules;
    delete c.total_projects;
    delete c.tools_technologies;
    delete c.certificate_title;
    delete c.course_outcomes;
    delete c.batch_start_date;
    return c;
  } catch (e) {
    console.error("SQL Error in getCourseById:", e);
    return null;
  }
}

export async function saveCourse(c) {
  try {
    const badgesStr = Array.isArray(c.badges) ? c.badges.join(',') : (c.badges || '');
    const courseImage = (c.image && String(c.image).trim()) ? String(c.image).trim() : '/images/course_cohort_2.png';
    const batchStartDate = (c.batchStartDate || c.batch_start_date || '').trim() || null;
    let exists = null;
    if (c.id) {
      const rows = await query("SELECT id FROM atelier_courses WHERE id = ?", [c.id]);
      exists = rows.length > 0 ? rows[0] : null;
    }

    let courseId = c.id;
    if (exists) {
      await execute(
        `UPDATE atelier_courses SET title = ?, description = ?, image = ?, badges = ?, price = ?, original_price = ?, discount = ?, instructor_id = ?, duration = ?, highlights = ?, curriculum_overview = ?, subtitle = ?, total_hours = ?, total_modules = ?, total_projects = ?, tools_technologies = ?, faqs = ?, certificate_title = ?, course_outcomes = ?, batch_start_date = ? WHERE id = ?`,
        [c.title, c.description, courseImage, badgesStr, c.price, c.originalPrice || c.original_price, c.discount, c.instructorId || c.instructor_id || null, c.duration || null, c.highlights || null, c.curriculumOverview || c.curriculum_overview || null, c.subtitle || null, c.totalHours || c.total_hours || null, c.totalModules || c.total_modules || null, c.totalProjects || c.total_projects || null, c.toolsTechnologies || c.tools_technologies || null, c.faqs || null, c.certificateTitle || c.certificate_title || null, c.courseOutcomes || c.course_outcomes || null, batchStartDate, c.id]
      );
    } else {
      const res = await execute(
        `INSERT INTO atelier_courses (title, description, image, badges, price, original_price, discount, instructor_id, duration, highlights, curriculum_overview, subtitle, total_hours, total_modules, total_projects, tools_technologies, faqs, certificate_title, course_outcomes, batch_start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.title, c.description, courseImage, badgesStr, c.price, c.originalPrice || c.original_price, c.discount, c.instructorId || c.instructor_id || null, c.duration || null, c.highlights || null, c.curriculumOverview || c.curriculum_overview || null, c.subtitle || null, c.totalHours || c.total_hours || null, c.totalModules || c.total_modules || null, c.totalProjects || c.total_projects || null, c.toolsTechnologies || c.tools_technologies || null, c.faqs || null, c.certificateTitle || c.certificate_title || null, c.courseOutcomes || c.course_outcomes || null, batchStartDate]
      );
      courseId = res.insertId;
    }

    const targetInstructorId = c.instructorId || c.instructor_id || null;
    if (targetInstructorId && courseId) {
      try {
        await execute(
          "INSERT IGNORE INTO atelier_mentor_courses (mentor_id, course_id) VALUES (?, ?)",
          [targetInstructorId, courseId]
        );
      } catch (syncErr) {
        console.warn("Could not sync mentor course link:", syncErr);
      }
    }

    try {
      if (exists) {
        trackAudit({
          action: 'Updated Course',
          entity: 'Course',
          entityId: courseId,
          newValue: `${c.title} (${c.price})`,
          status: 'SUCCESS'
        });
        trackServer('course_updated', { courseId: Number(courseId) });
      } else {
        trackAudit({
          action: 'Created Course',
          entity: 'Course',
          entityId: courseId,
          newValue: `${c.title} (${c.price})`,
          status: 'SUCCESS'
        });
        trackServer('course_created', { courseId: Number(courseId) });
      }
    } catch (anErr) {}

    return { success: true, id: courseId };
  } catch (e) {
    console.error("SQL Error in saveCourse:", e);
    throw new Error(e.message);
  }
}

export async function deleteCourse(id) {
  try {
    await execute("DELETE FROM atelier_courses WHERE id = ?", [id]);
    try {
      trackAudit({
        action: 'Deleted Course',
        entity: 'Course',
        entityId: id,
        status: 'SUCCESS'
      });
      trackServer('course_deleted', { courseId: Number(id) });
    } catch (anErr) {}
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteCourse:", e);
    throw new Error(e.message);
  }
}


// --- LIVE SCHEDULE ACTIONS ---
export async function getSchedule() {
  try {
    const schedule = await query("SELECT * FROM atelier_schedule");
    schedule.forEach(s => {
      s.courseId = s.course_id;
      delete s.course_id;
    });
    return schedule;
  } catch (e) {
    console.error("SQL Error in getSchedule:", e);
    return [];
  }
}

export async function saveSchedule(item) {
  try {
    let exists = null;
    if (item.id) {
      const rows = await query("SELECT id FROM atelier_schedule WHERE id = ?", [item.id]);
      exists = rows.length > 0 ? rows[0] : null;
    }

    if (exists) {
      await execute(
        `UPDATE atelier_schedule SET course_id = ?, time = ?, title = ?, type = ? WHERE id = ?`,
        [item.courseId || item.course_id, item.time, item.title, item.type, item.id]
      );
    } else {
      await execute(
        `INSERT INTO atelier_schedule (course_id, time, title, type) VALUES (?, ?, ?, ?)`,
        [item.courseId || item.course_id, item.time, item.title, item.type]
      );
    }
    return { success: true };
  } catch (e) {
    console.error("SQL Error in saveSchedule:", e);
    throw new Error(e.message);
  }
}

export async function deleteSchedule(id) {
  try {
    await execute("DELETE FROM atelier_schedule WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteSchedule:", e);
    throw new Error(e.message);
  }
}

// --- RECORDINGS ACTIONS ---
export async function getRecordings() {
  try {
    const recordings = await query("SELECT * FROM atelier_recordings");
    recordings.forEach(r => {
      r.courseId = r.course_id;
      delete r.course_id;
    });
    return recordings;
  } catch (e) {
    console.error("SQL Error in getRecordings:", e);
    return [];
  }
}

// --- MATERIALS & ASSETS ACTIONS ---
export async function getMaterials() {
  try {
    const materials = await query("SELECT * FROM atelier_materials");
    for (const m of materials) {
      m.courseId = m.course_id;
      delete m.course_id;

      const assets = await query("SELECT id, name, size, type, file_id, url FROM atelier_material_assets WHERE material_id = ?", [m.id]);
      m.assets = assets.map(a => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
        fileId: a.file_id,
        url: a.url || (a.file_id ? `/api/files/${a.file_id}` : null)
      }));
    }
    return materials;
  } catch (e) {
    console.error("SQL Error in getMaterials:", e);
    return [];
  }
}

export async function saveMaterial(mat) {
  try {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      let exists = null;
      if (mat.id) {
        const [rows] = await conn.execute("SELECT id FROM atelier_materials WHERE id = ?", [mat.id]);
        exists = rows.length > 0 ? rows[0] : null;
      }

      if (exists) {
        await conn.execute("UPDATE atelier_materials SET course_id = ?, title = ? WHERE id = ?",
          [mat.courseId || mat.course_id, mat.title, mat.id]);

        await conn.execute("DELETE FROM atelier_material_assets WHERE material_id = ?", [mat.id]);
        if (mat.assets) {
          for (const a of mat.assets) {
            await conn.execute(
              "INSERT INTO atelier_material_assets (material_id, name, size, type, file_id, url) VALUES (?, ?, ?, ?, ?, ?)",
              [mat.id, a.name, a.size, a.type, a.fileId || a.file_id || null, a.url || null]
            );
          }
        }
      } else {
        const [result] = await conn.execute("INSERT INTO atelier_materials (course_id, title) VALUES (?, ?)",
          [mat.courseId || mat.course_id, mat.title]);

        const newMatId = result.insertId;
        if (mat.assets) {
          for (const a of mat.assets) {
            await conn.execute(
              "INSERT INTO atelier_material_assets (material_id, name, size, type, file_id, url) VALUES (?, ?, ?, ?, ?, ?)",
              [newMatId, a.name, a.size, a.type, a.fileId || a.file_id || null, a.url || null]
            );
          }
        }
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return { success: true };
  } catch (e) {
    console.error("SQL Error in saveMaterial:", e);
    throw new Error(e.message);
  }
}

export async function deleteMaterial(id) {
  try {
    const assets = await query("SELECT file_id FROM atelier_material_assets WHERE material_id = ?", [id]);
    for (const a of assets) {
      if (a.file_id) {
        const fileRec = await getFileRecordById(a.file_id);
        if (fileRec) {
          if (fileRec.telegramMessageId) {
            await deleteMessageFromTelegram(fileRec.telegramMessageId).catch(() => {});
          }
          await deleteFileRecord(fileRec.id).catch(() => {});
        }
      }
    }
    await execute("DELETE FROM atelier_materials WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteMaterial:", e);
    throw new Error(e.message);
  }
}

// --- HOTLINE CALLBACKS ACTIONS ---
export async function getCallbacks() {
  try {
    const callbacks = await query("SELECT * FROM atelier_callbacks ORDER BY id DESC");
    callbacks.forEach(c => {
      c.studentName = c.student_name;
      c.preferredTime = c.preferred_time;
      c.createdAt = c.created_at || c.time;
    });
    return callbacks;
  } catch (e) {
    console.error("SQL Error in getCallbacks:", e);
    return [];
  }
}

export async function saveCallback(cb) {
  try {
    const timestamp = cb.time || new Date().toISOString();
    await execute(
      `INSERT INTO atelier_callbacks (student_name, phone, email, preferred_time, topic, notes, time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cb.studentName || cb.student_name || 'Prospective Student',
        cb.phone || '',
        cb.email || null,
        cb.preferredTime || cb.preferred_time || null,
        cb.topic || 'Cohort Advisory',
        cb.notes || null,
        timestamp,
        cb.status || 'Pending'
      ]
    );
    return { success: true };
  } catch (e) {
    console.error("SQL Error in saveCallback:", e);
    throw new Error(e.message);
  }
}

export async function updateCallbackStatus(id, status, notes = null) {
  try {
    if (notes !== null) {
      await execute("UPDATE atelier_callbacks SET status = ?, notes = ? WHERE id = ?", [status, notes, id]);
    } else {
      await execute("UPDATE atelier_callbacks SET status = ? WHERE id = ?", [status, id]);
    }
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateCallbackStatus:", e);
    throw new Error(e.message);
  }
}

export async function updateCallback(id, data) {
  try {
    await execute(
      `UPDATE atelier_callbacks SET student_name = ?, phone = ?, email = ?, preferred_time = ?, topic = ?, notes = ?, status = ? WHERE id = ?`,
      [
        data.studentName || data.student_name,
        data.phone || '',
        data.email || null,
        data.preferredTime || data.preferred_time || null,
        data.topic || '',
        data.notes || null,
        data.status || 'Pending',
        id
      ]
    );
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateCallback:", e);
    throw new Error(e.message);
  }
}

export async function resolveCallback(id) {
  try {
    await execute("UPDATE atelier_callbacks SET status = 'Resolved' WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in resolveCallback:", e);
    throw new Error(e.message);
  }
}

export async function deleteCallback(id) {
  try {
    await execute("DELETE FROM atelier_callbacks WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteCallback:", e);
    throw new Error(e.message);
  }
}

// --- CONTACT INQUIRIES ACTIONS ---
export async function getContactInquiries() {
  try {
    const rows = await query("SELECT * FROM atelier_contact_inquiries ORDER BY created_at DESC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      subject: r.subject,
      department: r.department,
      message: r.message,
      status: r.status,
      adminNotes: r.admin_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  } catch (e) {
    console.error("SQL Error in getContactInquiries:", e);
    return [];
  }
}

export async function saveContactInquiry(data) {
  try {
    if (!data.name || !data.email || !data.message) {
      throw new Error("Name, email, and message are required.");
    }
    const res = await execute(
      `INSERT INTO atelier_contact_inquiries (name, email, phone, subject, department, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name.trim(),
        data.email.trim(),
        data.phone ? data.phone.trim() : null,
        data.subject ? data.subject.trim() : 'General Inquiry',
        data.department ? data.department.trim() : 'Cohort Admissions',
        data.message.trim(),
        data.status || 'new'
      ]
    );
    return { success: true, id: res.insertId };
  } catch (e) {
    console.error("SQL Error in saveContactInquiry:", e);
    throw new Error(e.message);
  }
}

export async function updateContactInquiryStatus(id, status, adminNotes = null) {
  try {
    if (adminNotes !== null) {
      await execute("UPDATE atelier_contact_inquiries SET status = ?, admin_notes = ? WHERE id = ?", [status, adminNotes, id]);
    } else {
      await execute("UPDATE atelier_contact_inquiries SET status = ? WHERE id = ?", [status, id]);
    }
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateContactInquiryStatus:", e);
    throw new Error(e.message);
  }
}

export async function updateContactInquiry(id, data) {
  try {
    await execute(
      `UPDATE atelier_contact_inquiries SET name = ?, email = ?, phone = ?, subject = ?, department = ?, message = ?, status = ?, admin_notes = ? WHERE id = ?`,
      [
        data.name,
        data.email,
        data.phone || null,
        data.subject || null,
        data.department || 'Cohort Admissions',
        data.message,
        data.status || 'new',
        data.adminNotes || null,
        id
      ]
    );
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateContactInquiry:", e);
    throw new Error(e.message);
  }
}

export async function deleteContactInquiry(id) {
  try {
    await execute("DELETE FROM atelier_contact_inquiries WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteContactInquiry:", e);
    throw new Error(e.message);
  }
}

// --- FACULTY / TEACHING STAFF APPLICATIONS ACTIONS ---
export async function getFacultyApplications() {
  try {
    const rows = await query("SELECT * FROM atelier_faculty_applications ORDER BY created_at DESC");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      roleApplied: r.role_applied,
      expertise: r.expertise,
      experienceYears: r.experience_years,
      currentCompany: r.current_company,
      linkedin: r.linkedin,
      github: r.github,
      portfolio: r.portfolio,
      bio: r.bio,
      courseProposal: r.course_proposal,
      availability: r.availability,
      status: r.status,
      adminNotes: r.admin_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  } catch (e) {
    console.error("SQL Error in getFacultyApplications:", e);
    return [];
  }
}

export async function saveFacultyApplication(data) {
  try {
    if (!data.name || !data.email || !data.phone || !data.expertise) {
      throw new Error("Name, email, phone, and expertise are required fields.");
    }
    const res = await execute(
      `INSERT INTO atelier_faculty_applications 
       (name, email, phone, role_applied, expertise, experience_years, current_company, linkedin, github, portfolio, bio, course_proposal, availability, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name.trim(),
        data.email.trim(),
        data.phone.trim(),
        data.roleApplied ? data.roleApplied.trim() : 'Industry Mentor / Guest Faculty',
        data.expertise.trim(),
        data.experienceYears ? data.experienceYears.trim() : '2-5 Years',
        data.currentCompany ? data.currentCompany.trim() : null,
        data.linkedin ? data.linkedin.trim() : null,
        data.github ? data.github.trim() : null,
        data.portfolio ? data.portfolio.trim() : null,
        data.bio ? data.bio.trim() : null,
        data.courseProposal ? data.courseProposal.trim() : null,
        data.availability ? data.availability.trim() : 'Flexible / Weekends',
        data.status || 'pending'
      ]
    );
    return { success: true, id: res.insertId };
  } catch (e) {
    console.error("SQL Error in saveFacultyApplication:", e);
    throw new Error(e.message);
  }
}

export async function updateFacultyApplicationStatus(id, status, adminNotes = null) {
  try {
    if (adminNotes !== null) {
      await execute("UPDATE atelier_faculty_applications SET status = ?, admin_notes = ? WHERE id = ?", [status, adminNotes, id]);
    } else {
      await execute("UPDATE atelier_faculty_applications SET status = ? WHERE id = ?", [status, id]);
    }
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateFacultyApplicationStatus:", e);
    throw new Error(e.message);
  }
}

export async function updateFacultyApplication(id, data) {
  try {
    await execute(
      `UPDATE atelier_faculty_applications SET 
        name = ?, email = ?, phone = ?, role_applied = ?, expertise = ?, 
        experience_years = ?, current_company = ?, linkedin = ?, github = ?, 
        portfolio = ?, bio = ?, course_proposal = ?, availability = ?, 
        status = ?, admin_notes = ? 
       WHERE id = ?`,
      [
        data.name,
        data.email,
        data.phone,
        data.roleApplied || 'Industry Mentor / Guest Faculty',
        data.expertise,
        data.experienceYears || null,
        data.currentCompany || null,
        data.linkedin || null,
        data.github || null,
        data.portfolio || null,
        data.bio || null,
        data.courseProposal || null,
        data.availability || null,
        data.status || 'pending',
        data.adminNotes || null,
        id
      ]
    );
    return { success: true };
  } catch (e) {
    console.error("SQL Error in updateFacultyApplication:", e);
    throw new Error(e.message);
  }
}

export async function deleteFacultyApplication(id) {
  try {
    await execute("DELETE FROM atelier_faculty_applications WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteFacultyApplication:", e);
    throw new Error(e.message);
  }
}

export async function approveFacultyToMentor(id) {
  try {
    const rows = await query("SELECT * FROM atelier_faculty_applications WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      throw new Error("Faculty application not found.");
    }
    const app = rows[0];

    // Check if lecturer with this email already exists
    const existing = await query("SELECT id FROM atelier_lecturers WHERE email = ?", [app.email]);
    let lecturerId = null;

    if (existing.length > 0) {
      lecturerId = existing[0].id;
      await execute(
        "UPDATE atelier_lecturers SET name = ?, expertise = ?, bio = ?, phone = ? WHERE id = ?",
        [app.name, app.expertise, app.bio || 'Industry Faculty', app.phone, lecturerId]
      );
    } else {
      const tempHash = hashPassword('mentor123');
      const res = await execute(
        `INSERT INTO atelier_lecturers (name, email, expertise, bio, phone, role, password_hash, must_change_password) 
         VALUES (?, ?, ?, ?, ?, 'mentor', ?, 1)`,
        [app.name, app.email, app.expertise, app.bio || 'Industry Faculty at Atelier Sphere Hive', app.phone, tempHash]
      );
      lecturerId = res.insertId;
    }

    // Update application status to approved
    await execute(
      "UPDATE atelier_faculty_applications SET status = 'approved', admin_notes = CONCAT(IFNULL(admin_notes, ''), '\n[Auto-Approved] Onboarded to Atelier Mentors (ID: ', ?, ')') WHERE id = ?",
      [lecturerId, id]
    );

    return { success: true, lecturerId };
  } catch (e) {
    console.error("SQL Error in approveFacultyToMentor:", e);
    throw new Error(e.message);
  }
}

// --- LECTURERS / MENTORS ACTIONS ---
export async function getLecturers() {
  try {
    // Never expose password_hash to the client
    const lecturers = await query(
      "SELECT id, name, email, expertise, bio, phone, avatar, role, must_change_password as mustChangePassword, failed_login_count as failedLoginCount, locked_until as lockedUntil FROM atelier_lecturers"
    );
    for (const l of lecturers) {
      const assigned = await query("SELECT course_id FROM atelier_mentor_courses WHERE mentor_id = ?", [l.id]);
      const instructorCourses = await query("SELECT id as course_id FROM atelier_courses WHERE instructor_id = ?", [l.id]);
      const combined = Array.from(new Set([
        ...assigned.map(a => a.course_id),
        ...instructorCourses.map(a => a.course_id)
      ]));
      l.assignedCourses = combined;
    }
    return lecturers;
  } catch (e) {
    console.error("SQL Error in getLecturers:", e);
    return [];
  }
}

export async function saveLecturer(l) {
  try {
    let exists = null;
    if (l.id) {
      const rows = await query("SELECT id FROM atelier_lecturers WHERE id = ?", [l.id]);
      exists = rows.length > 0 ? rows[0] : null;
    }

    const conn = await getConnection();
    let tempPassword = null;

    const mentorAvatar = (l.avatar && String(l.avatar).trim()) ? String(l.avatar).trim() : '/images/avatar1.jpg';

    try {
      await conn.beginTransaction();

      if (exists) {
        // Update existing mentor
        let updateSql = "UPDATE atelier_lecturers SET name = ?, email = ?, expertise = ?, bio = ?, phone = ?, avatar = ?";
        let updateParams = [l.name, l.email, l.expertise || null, l.bio || null, l.phone || null, mentorAvatar];

        if (l.password && l.password.trim() !== '') {
          const rawPass = l.password.trim();
          const passHash = hashPassword(rawPass);
          const mustChange = l.mustChangePassword !== undefined ? (l.mustChangePassword ? 1 : 0) : 1;
          updateSql += ", password_hash = ?, must_change_password = ?, failed_login_count = 0, locked_until = NULL";
          updateParams.push(passHash, mustChange);
          tempPassword = rawPass;
        } else if (l.mustChangePassword !== undefined) {
          updateSql += ", must_change_password = ?";
          updateParams.push(l.mustChangePassword ? 1 : 0);
        }

        updateSql += " WHERE id = ?";
        updateParams.push(l.id);

        await conn.execute(updateSql, updateParams);

        // Sync assigned courses
        if (Array.isArray(l.assignedCourses)) {
          await conn.execute("DELETE FROM atelier_mentor_courses WHERE mentor_id = ?", [l.id]);
          for (const cId of l.assignedCourses) {
            await conn.execute("INSERT INTO atelier_mentor_courses (mentor_id, course_id) VALUES (?, ?)", [l.id, cId]);
          }
        }
      } else {
        // Create new mentor - use admin-provided password or auto-generate secure temp password
        const chosenPassword = (l.password && l.password.trim() !== '') ? l.password.trim() : generateTempPassword(10);
        tempPassword = chosenPassword;
        const passHash = hashPassword(chosenPassword);
        const mustChange = l.mustChangePassword !== undefined ? (l.mustChangePassword ? 1 : 0) : 1;

        const [result] = await conn.execute(
          "INSERT INTO atelier_lecturers (name, email, password_hash, must_change_password, expertise, bio, phone, avatar, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'mentor')",
          [l.name, l.email, passHash, mustChange, l.expertise || null, l.bio || null, l.phone || null, mentorAvatar]
        );

        const newMentorId = result.insertId;

        // Assign courses
        if (Array.isArray(l.assignedCourses)) {
          for (const cId of l.assignedCourses) {
            await conn.execute("INSERT INTO atelier_mentor_courses (mentor_id, course_id) VALUES (?, ?)", [newMentorId, cId]);
          }
        }
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return { success: true, tempPassword };
  } catch (e) {
    console.error("SQL Error in saveLecturer:", e);
    throw new Error(e.message);
  }
}

export async function deleteLecturer(id) {
  try {
    await execute("DELETE FROM atelier_lecturers WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteLecturer:", e);
    throw new Error(e.message);
  }
}

// --- TRANSACTIONS ACTIONS ---
export async function getTransactions() {
  try {
    const transactions = await query("SELECT * FROM atelier_transactions");
    transactions.forEach(t => {
      t.studentId = t.student_id;
      t.studentName = t.student_name;
      t.courseId = t.course_id;
      t.courseTitle = t.course_title;
      t.razorpayOrderId = t.razorpay_order_id;
      t.razorpayPaymentId = t.razorpay_payment_id;
      delete t.student_id;
      delete t.student_name;
      delete t.course_id;
      delete t.course_title;
      delete t.razorpay_order_id;
      delete t.razorpay_payment_id;
      delete t.razorpay_signature;
    });
    return transactions;
  } catch (e) {
    console.error("SQL Error in getTransactions:", e);
    return [];
  }
}

export async function deleteTransaction(id) {
  try {
    await execute("DELETE FROM atelier_transactions WHERE id = ?", [id]);
    return { success: true };
  } catch (e) {
    console.error("SQL Error in deleteTransaction:", e);
    throw new Error(e.message);
  }
}

// --- COURSE REGISTRATION & TRANSACTIONS JOIN ACTION ---
export async function registerStudentToCourse(studentId, courseId, amount) {
  try {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // Check if already registered
      const [existsRows] = await conn.execute(
        "SELECT student_id FROM atelier_student_courses WHERE student_id = ? AND course_id = ?",
        [studentId, courseId]
      );

      if (existsRows.length === 0) {
        // Map course enrollment
        await conn.execute("INSERT INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)",
          [studentId, courseId]);

        // Fetch student & course details
        const [studentRows] = await conn.execute("SELECT name FROM atelier_students WHERE id = ?", [studentId]);
        const [courseRows] = await conn.execute("SELECT title FROM atelier_courses WHERE id = ?", [courseId]);

        const studentName = studentRows.length > 0 ? studentRows[0].name : 'Unknown Student';
        const courseTitle = courseRows.length > 0 ? courseRows[0].title : 'Unknown Cohort';

        // Log transaction
        await conn.execute(
          `INSERT INTO atelier_transactions (student_id, student_name, course_id, course_title, amount, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, 'Success')`,
          [studentId, studentName, courseId, courseTitle, amount, new Date().toISOString()]
        );
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return { success: true };
  } catch (e) {
    console.error("SQL Error in registerStudentToCourse:", e);
    throw new Error(e.message);
  }
}

// --- AUTHENTICATION & SECURITY ACTIONS ---
export async function authenticateStudent(email, password) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: "Please enter your email address." };
    }
    if (!password) {
      return { success: false, error: "Please enter your password." };
    }

    const rows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    const student = rows.length > 0 ? rows[0] : null;

    if (!student) {
      return { success: false, error: "No account found with this email. Please check your spelling or sign up." };
    }

    // Check if account was created via social OAuth without a custom password
    const isOauthPlaceholder = student.password && (student.password.startsWith('oauth_') || student.password === 'password');
    if (isOauthPlaceholder && student.auth_provider && student.auth_provider !== 'credentials') {
      const providerName = student.auth_provider === 'google' ? 'Google' : student.auth_provider === 'github' ? 'GitHub' : student.auth_provider;
      return { 
        success: false, 
        error: `This account was registered using ${providerName}. Please click "Continue with ${providerName}" above, or use "Forgot password?" to set a password.` 
      };
    }

    if (student.password !== password) {
      return { success: false, error: "Invalid email or password. Please check your credentials and try again." };
    }

    const enrollments = await query("SELECT course_id FROM atelier_student_courses WHERE student_id = ?", [student.id]);
    student.enrolledCourses = enrollments.map(e => e.course_id);
    student.gradYear = student.grad_year;
    delete student.grad_year;
    student.skills = student.skills ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',')) : [];
    student.authProvider = student.auth_provider || 'credentials';
    delete student.password;
    delete student.reset_code;
    delete student.reset_code_expires;
    return { success: true, student, ...student };
  } catch (e) {
    console.error("Authentication error:", e.message);
    return { success: false, error: e.message || "Failed to sign in. Please try again." };
  }
}

/**
 * Step 1 of Sign In with MojoAuth OTP:
 * Validates student credentials and dispatches an OTP to student's email
 */
export async function initiateStudentLoginWithOtp(email, password) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!password) {
      return { success: false, error: "Please enter your password." };
    }

    const rows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    const student = rows.length > 0 ? rows[0] : null;

    if (!student) {
      return { success: false, error: "No account found with this email. Please check your spelling or sign up." };
    }

    // Check if account was created via social OAuth without a custom password
    const isOauthPlaceholder = student.password && (student.password.startsWith('oauth_') || student.password === 'password');
    if (isOauthPlaceholder && student.auth_provider && student.auth_provider !== 'credentials') {
      const providerName = student.auth_provider === 'google' ? 'Google' : student.auth_provider === 'github' ? 'GitHub' : student.auth_provider;
      return { 
        success: false, 
        error: `This account was registered using ${providerName}. Please click "Continue with ${providerName}" above, or use "Forgot password?" to set a password.` 
      };
    }

    if (student.password !== password) {
      return { success: false, error: "Invalid email or password. Please check your credentials and try again." };
    }

    // Credentials are valid, send OTP via MojoAuth
    const otpRes = await sendEmailOtp(cleanEmail);
    if (!otpRes.success) {
      return { success: false, error: otpRes.error || "Failed to send verification code. Please try again." };
    }

    return {
      success: true,
      stateId: otpRes.state_id,
      email: cleanEmail,
      message: "Verification code sent to your email."
    };
  } catch (e) {
    console.error("initiateStudentLoginWithOtp error:", e.message);
    return { success: false, error: e.message || "Failed to process login request." };
  }
}

/**
 * Step 2 of Sign In with MojoAuth OTP:
 * Verifies the OTP code and returns the authenticated student profile
 */
export async function verifyStudentLoginOtp(email, stateId, otp) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !stateId || !cleanOtp) {
      return { success: false, error: "Email, session ID, and verification code are required." };
    }

    const verifyRes = await verifyEmailOtp(cleanOtp, stateId);
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || "Invalid or expired verification code." };
    }

    // Retrieve student record
    const rows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    const student = rows.length > 0 ? rows[0] : null;

    if (!student) {
      return { success: false, error: "Student record not found." };
    }

    const enrollments = await query("SELECT course_id FROM atelier_student_courses WHERE student_id = ?", [student.id]);
    student.enrolledCourses = enrollments.map(e => e.course_id);
    student.gradYear = student.grad_year;
    delete student.grad_year;
    student.skills = student.skills ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',')) : [];
    student.authProvider = student.auth_provider || 'credentials';
    delete student.password;
    delete student.reset_code;
    delete student.reset_code_expires;

    return { success: true, student, ...student };
  } catch (e) {
    console.error("verifyStudentLoginOtp error:", e.message);
    return { success: false, error: e.message || "Failed to verify code. Please try again." };
  }
}

/**
 * Step 1 of Sign Up with MojoAuth OTP:
 * Validates registration fields, checks email availability, and dispatches an OTP
 */
export async function initiateStudentSignupWithOtp(name, email, password, phone, college, gradYear) {
  try {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName) {
      return { success: false, error: "Please enter your full name." };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!password || password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    // Check if user already exists
    const existsRows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    if (existsRows.length > 0) {
      const existing = existsRows[0];
      const isOauthPlaceholder = existing.password && (existing.password.startsWith('oauth_') || existing.password === 'password');
      if (!isOauthPlaceholder && existing.auth_provider === 'credentials') {
        return { success: false, error: "An account is already registered with this email. Try signing in instead." };
      }
    }

    // Send OTP via MojoAuth
    const otpRes = await sendEmailOtp(cleanEmail);
    if (!otpRes.success) {
      return { success: false, error: otpRes.error || "Failed to send verification code. Please try again." };
    }

    return {
      success: true,
      stateId: otpRes.state_id,
      email: cleanEmail,
      message: "Verification code sent to your email."
    };
  } catch (e) {
    console.error("initiateStudentSignupWithOtp error:", e.message);
    return { success: false, error: e.message || "Failed to process signup request." };
  }
}

/**
 * Step 2 of Sign Up with MojoAuth OTP:
 * Verifies the OTP code and completes registration in MySQL database
 */
export async function verifyStudentSignupOtp({ name, email, password, phone, college, gradYear, stateId, otp }) {
  try {
    const cleanOtp = (otp || '').trim();
    if (!stateId || !cleanOtp) {
      return { success: false, error: "Verification code and session ID are required." };
    }

    const verifyRes = await verifyEmailOtp(cleanOtp, stateId);
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || "Invalid or expired verification code." };
    }

    // Register student account in database
    return await registerStudentAccount(name, email, password, phone, college, gradYear);
  } catch (e) {
    console.error("verifyStudentSignupOtp error:", e.message);
    return { success: false, error: e.message || "Failed to complete signup." };
  }
}

/**
 * Resend OTP via MojoAuth for an active stateId
 */
export async function resendStudentOtp(stateId) {
  try {
    if (!stateId) {
      return { success: false, error: "Session expired. Please start again." };
    }
    const res = await resendEmailOtp(stateId);
    return res;
  } catch (e) {
    console.error("resendStudentOtp error:", e.message);
    return { success: false, error: e.message || "Failed to resend code." };
  }
}

export async function authenticateOAuthStudent({ name, email, avatar, provider = 'google' }) {

  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0] || 'Student').trim();

    if (!cleanEmail) {
      return { success: false, error: "A valid email address is required from your social provider." };
    }

    const rows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    let student = rows.length > 0 ? rows[0] : null;

    if (student) {
      // Existing student: link provider and update avatar without throwing unique constraint error
      await execute(
        "UPDATE atelier_students SET auth_provider = COALESCE(auth_provider, ?), avatar = COALESCE(avatar, ?) WHERE id = ?",
        [provider, avatar || null, student.id]
      );
    } else {
      // New student: register via OAuth
      const conn = await getConnection();
      try {
        await conn.beginTransaction();

        const [result] = await conn.execute(
          `INSERT INTO atelier_students (name, email, password, phone, college, grad_year, xp, streak, auth_provider, avatar, bio) 
           VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?)`,
          [cleanName, cleanEmail, `oauth_${Date.now()}`, '', 'Atelier Academy', '2026', provider, avatar || null, 'Joined via ' + provider]
        );

        const newStudentId = result.insertId;

        // Auto-enroll in default foundational cohort (Course 1)
        await conn.execute(
          "INSERT IGNORE INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)",
          [newStudentId, 1]
        );

        await conn.commit();
      } catch (txErr) {
        await conn.rollback();
        throw txErr;
      } finally {
        conn.release();
      }
    }

    // Retrieve fresh synchronized profile
    const freshRows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    const studentProfile = freshRows[0];
    const enrollments = await query("SELECT course_id FROM atelier_student_courses WHERE student_id = ?", [studentProfile.id]);
    studentProfile.enrolledCourses = (enrollments || []).map(e => e.course_id);

    // If enrollments are empty, guarantee at least cohort 1
    if (studentProfile.enrolledCourses.length === 0) {
      await execute("INSERT IGNORE INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)", [studentProfile.id, 1]);
      studentProfile.enrolledCourses = [1];
    }

    studentProfile.gradYear = studentProfile.grad_year;
    delete studentProfile.grad_year;
    studentProfile.skills = studentProfile.skills ? (Array.isArray(studentProfile.skills) ? studentProfile.skills : studentProfile.skills.split(',')) : ['React', 'Next.js', 'System Design'];
    studentProfile.authProvider = studentProfile.auth_provider || provider;
    delete studentProfile.password;
    delete studentProfile.reset_code;
    delete studentProfile.reset_code_expires;

    return { success: true, student: studentProfile, ...studentProfile };
  } catch (e) {
    console.error("OAuth authentication error:", e.message);
    return { success: false, error: e.message || "Failed to authenticate with social provider." };
  }
}

export async function getStudentProfileByEmail(email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return null;

    const rows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    if (rows.length === 0) return null;

    const student = rows[0];
    const enrollments = await query("SELECT course_id FROM atelier_student_courses WHERE student_id = ?", [student.id]);
    student.enrolledCourses = (enrollments || []).map(e => e.course_id);
    student.gradYear = student.grad_year;
    delete student.grad_year;
    student.lastActiveDate = student.last_active_date;
    delete student.last_active_date;
    student.degree = student.degree || '';
    student.skills = student.skills ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',')) : [];
    student.authProvider = student.auth_provider || 'credentials';
    delete student.password;
    delete student.reset_code;
    delete student.reset_code_expires;
    return student;
  } catch (e) {
    console.error("SQL Error in getStudentProfileByEmail:", e);
    return null;
  }
}

export async function registerStudentAccount(name, email, password, phone, college, gradYear) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return { success: false, error: "Please enter your full name." };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!password || password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    const existsRows = await query("SELECT * FROM atelier_students WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    if (existsRows.length > 0) {
      const existing = existsRows[0];
      const isOauthPlaceholder = existing.password && (existing.password.startsWith('oauth_') || existing.password === 'password');
      
      // If student previously authenticated via Google/GitHub without setting a password:
      if (isOauthPlaceholder || existing.auth_provider !== 'credentials') {
        await execute(
          `UPDATE atelier_students 
           SET password = ?, 
               phone = COALESCE(NULLIF(phone, ''), ?), 
               college = COALESCE(NULLIF(college, ''), ?), 
               grad_year = COALESCE(NULLIF(grad_year, ''), ?) 
           WHERE id = ?`,
          [password, (phone || '').trim(), college || 'Atelier Student', gradYear || '2026', existing.id]
        );

        const enrollments = await query("SELECT course_id FROM atelier_student_courses WHERE student_id = ?", [existing.id]);
        existing.enrolledCourses = (enrollments || []).map(e => e.course_id);
        if (existing.enrolledCourses.length === 0) {
          await execute("INSERT IGNORE INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)", [existing.id, 1]);
          existing.enrolledCourses = [1];
        }

        existing.gradYear = existing.grad_year;
        delete existing.grad_year;
        existing.skills = existing.skills ? (Array.isArray(existing.skills) ? existing.skills : existing.skills.split(',')) : ['HTML', 'CSS', 'JavaScript'];
        delete existing.password;
        delete existing.reset_code;
        delete existing.reset_code_expires;

        return { 
          success: true, 
          student: existing, 
          ...existing,
          message: "Password linked successfully to your account!" 
        };
      }

      return { success: false, error: "An account is already registered with this email. Try signing in instead." };
    }

    let newStudentId = null;
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // Insert student
      const [result] = await conn.execute(
        `INSERT INTO atelier_students (name, email, password, phone, college, grad_year, xp, streak, auth_provider) VALUES (?, ?, ?, ?, ?, ?, 0, 1, 'credentials')`,
        [cleanName, cleanEmail, password, (phone || '').trim(), college || 'Not specified yet', gradYear || '2026']
      );

      newStudentId = result.insertId;

      // Auto-enroll in default foundational cohort (Course 1)
      await conn.execute(
        "INSERT IGNORE INTO atelier_student_courses (student_id, course_id) VALUES (?, ?)",
        [newStudentId, 1]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    // Retrieve full profile
    const studentRows = await query("SELECT * FROM atelier_students WHERE id = ?", [newStudentId]);
    if (!studentRows || studentRows.length === 0) {
      return { success: false, error: "Unable to retrieve newly registered account. Please try signing in." };
    }
    const student = studentRows[0];
    student.enrolledCourses = [1];
    student.gradYear = student.grad_year;
    delete student.grad_year;
    student.skills = student.skills ? student.skills.split(',') : ['HTML', 'CSS', 'JavaScript'];
    student.authProvider = 'credentials';
    delete student.password;
    delete student.reset_code;
    delete student.reset_code_expires;
    return { success: true, student, ...student };
  } catch (e) {
    console.error("Registration error:", e.message);
    return { success: false, error: e.message || "Unable to create your account. Please try again." };
  }
}

export async function requestPasswordReset(email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const rows = await query(
      "SELECT id, name, auth_provider FROM atelier_students WHERE email = ? OR LOWER(email) = ? LIMIT 1",
      [cleanEmail, cleanEmail]
    );
    if (rows.length === 0) {
      return { success: false, error: "No account found with this email address. Please check your spelling or sign up." };
    }

    // Dispatch real email OTP via MojoAuth to student's email
    const otpRes = await sendEmailOtp(cleanEmail);
    if (!otpRes.success) {
      return { success: false, error: otpRes.error || "Failed to send verification code. Please try again." };
    }

    return {
      success: true,
      email: cleanEmail,
      stateId: otpRes.state_id,
      message: "Verification code sent to your email address."
    };
  } catch (e) {
    console.error("Password reset request error:", e.message);
    return { success: false, error: e.message || "Failed to process password reset request." };
  }
}

export async function verifyAndResetPassword(email, code, newPassword, stateId) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    const cleanStateId = (stateId || '').trim();

    if (!cleanEmail || !cleanCode) {
      return { success: false, error: "Email and verification code are required." };
    }
    if (!cleanStateId) {
      return { success: false, error: "Verification session has expired. Please request a new code." };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    // Verify OTP code with MojoAuth
    const verifyRes = await verifyEmailOtp(cleanCode, cleanStateId);
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || "Invalid or expired verification code." };
    }

    const rows = await query(
      "SELECT id FROM atelier_students WHERE email = ? OR LOWER(email) = ? LIMIT 1",
      [cleanEmail, cleanEmail]
    );
    if (rows.length === 0) {
      return { success: false, error: "No account found with this email address." };
    }

    const student = rows[0];

    // Update password in database and clear legacy reset code fields
    await execute(
      "UPDATE atelier_students SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?",
      [newPassword, student.id]
    );

    return { success: true, message: "Your password has been reset successfully." };
  } catch (e) {
    console.error("Password reset verification error:", e.message);
    return { success: false, error: e.message || "Failed to reset password." };
  }
}

export async function resendPasswordResetOtp(stateId, email) {
  try {
    if (stateId) {
      const res = await resendEmailOtp(stateId);
      if (res && res.success) {
        return res;
      }
    }
    if (email) {
      return await requestPasswordReset(email);
    }
    return { success: false, error: "Unable to resend verification code. Please start again." };
  } catch (e) {
    console.error("resendPasswordResetOtp error:", e.message);
    return { success: false, error: e.message || "Failed to resend code." };
  }
}


export async function resetStudentPassword(email, phone, newPassword) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const rows = await query("SELECT id FROM atelier_students WHERE LOWER(email) = LOWER(?)", [cleanEmail]);
    if (rows.length === 0) {
      throw new Error("No account found matching this email address.");
    }
    await execute("UPDATE atelier_students SET password = ? WHERE LOWER(email) = LOWER(?)", [newPassword, cleanEmail]);
    return { success: true, message: "Password updated successfully." };
  } catch (e) {
    console.error("Password reset error:", e.message);
    throw new Error(e.message);
  }
}

// --- DYNAMIC METRICS / STATISTICS ACTIONS ---
export async function getSiteStats() {
  try {
    const [studentsRow] = await query("SELECT COUNT(*) as count FROM atelier_students");
    const [coursesRow] = await query("SELECT COUNT(*) as count FROM atelier_courses");
    const [scheduleRow] = await query("SELECT COUNT(*) as count FROM atelier_schedule");
    const [pendingRow] = await query("SELECT COUNT(*) as count FROM atelier_callbacks WHERE status = 'Pending'");
    const [lecturersRow] = await query("SELECT COUNT(*) as count FROM atelier_lecturers");
    const [transactionsRow] = await query("SELECT COUNT(*) as count FROM atelier_transactions");
    const [contactRow] = await query("SELECT COUNT(*) as count FROM atelier_contact_inquiries");
    const [newInquiriesRow] = await query("SELECT COUNT(*) as count FROM atelier_contact_inquiries WHERE status = 'new'");
    const [facultyRow] = await query("SELECT COUNT(*) as count FROM atelier_faculty_applications");
    const [pendingFacultyRow] = await query("SELECT COUNT(*) as count FROM atelier_faculty_applications WHERE status = 'pending'");

    // Dynamic analytics
    const [activeRow] = await query("SELECT COUNT(DISTINCT student_id) as count FROM atelier_student_courses");
    const [avgRow] = await query("SELECT CAST(AVG(xp) AS UNSIGNED) as avgXp FROM atelier_students");

    return {
      studentsCount: studentsRow.count,
      coursesCount: coursesRow.count,
      scheduleCount: scheduleRow.count,
      pendingCallbacks: pendingRow.count,
      lecturersCount: lecturersRow.count,
      transactionsCount: transactionsRow.count,
      contactInquiriesCount: contactRow.count,
      newInquiriesCount: newInquiriesRow.count,
      facultyApplicationsCount: facultyRow.count,
      pendingFacultyCount: pendingFacultyRow.count,
      activeEnrolledCount: activeRow.count,
      avgXP: avgRow.avgXp || 0
    };
  } catch (e) {
    console.error("SQL Error in getSiteStats:", e);
    return {
      studentsCount: 0,
      coursesCount: 0,
      scheduleCount: 0,
      pendingCallbacks: 0,
      lecturersCount: 0,
      transactionsCount: 0,
      contactInquiriesCount: 0,
      newInquiriesCount: 0,
      facultyApplicationsCount: 0,
      pendingFacultyCount: 0,
      activeEnrolledCount: 0,
      avgXP: 0
    };
  }
}

// ─────────────────────────────────────────────────────────────
// ─── MENTOR AUTHENTICATION & PORTAL SERVER ACTIONS ───────────
// ─────────────────────────────────────────────────────────────

/**
 * Mentor Login with rate-limiting / lockout protection
 */
export async function mentorLogin(email, password) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const rows = await query("SELECT * FROM atelier_lecturers WHERE LOWER(email) = LOWER(?)", [cleanEmail]);

    if (rows.length === 0) {
      // Use generic error message to prevent user enumeration
      throw new Error("Invalid email address or password.");
    }

    const mentor = rows[0];

    // Check account lockout
    const lockStatus = isMentorLocked(mentor);
    if (lockStatus && lockStatus.locked) {
      throw new Error(`Account temporarily locked due to consecutive failed attempts. Please try again in ${lockStatus.remainingMinutes} minute(s).`);
    }

    // Verify password hash
    const isValid = verifyPassword(password, mentor.password_hash);

    if (!isValid) {
      const newFailCount = (mentor.failed_login_count || 0) + 1;
      if (newFailCount >= 5) {
        // Lock for 15 minutes
        await execute(
          "UPDATE atelier_lecturers SET failed_login_count = ?, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?",
          [newFailCount, mentor.id]
        );
        throw new Error("Too many failed attempts. Account has been locked for 15 minutes.");
      } else {
        await execute(
          "UPDATE atelier_lecturers SET failed_login_count = ? WHERE id = ?",
          [newFailCount, mentor.id]
        );
        throw new Error("Invalid email address or password.");
      }
    }

    // Reset failed login counter on success
    await execute(
      "UPDATE atelier_lecturers SET failed_login_count = 0, locked_until = NULL WHERE id = ?",
      [mentor.id]
    );

    // Fetch assigned courses
    const assigned = await query("SELECT course_id FROM atelier_mentor_courses WHERE mentor_id = ?", [mentor.id]);
    const assignedCourses = assigned.map(a => a.course_id);

    // Sign session token
    const token = signMentorSession({
      id: mentor.id,
      email: mentor.email,
      name: mentor.name
    });

    return {
      success: true,
      token,
      mentor: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone || '',
        avatar: mentor.avatar || null,
        expertise: mentor.expertise || '',
        bio: mentor.bio || '',
        role: mentor.role || 'mentor',
        mustChangePassword: Boolean(mentor.must_change_password),
        assignedCourses
      }
    };
  } catch (err) {
    console.error("Mentor login error:", err);
    throw new Error(err.message);
  }
}

/**
 * Change Mentor Password (required on first login or via profile)
 */
export async function changeMentorPassword(mentorId, oldPassword, newPassword) {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const rows = await query("SELECT password_hash FROM atelier_lecturers WHERE id = ?", [mentorId]);
    if (rows.length === 0) {
      throw new Error("Mentor not found.");
    }

    const currentHash = rows[0].password_hash;
    const isValid = verifyPassword(oldPassword, currentHash);
    if (!isValid) {
      throw new Error("Incorrect current password.");
    }

    const newHash = hashPassword(newPassword);
    await execute(
      "UPDATE atelier_lecturers SET password_hash = ?, must_change_password = 0, failed_login_count = 0 WHERE id = ?",
      [newHash, mentorId]
    );

    return { success: true, message: "Password updated successfully." };
  } catch (err) {
    console.error("Change mentor password error:", err);
    throw new Error(err.message);
  }
}

/**
 * Update Mentor Profile
 */
export async function updateMentorProfile(mentorId, data) {
  try {
    const { name, bio, expertise, phone, avatar } = data;
    await execute(
      "UPDATE atelier_lecturers SET name = ?, bio = ?, expertise = ?, phone = ?, avatar = ? WHERE id = ?",
      [name, bio || null, expertise || null, phone || null, avatar || null, mentorId]
    );
    return { success: true };
  } catch (err) {
    console.error("Update mentor profile error:", err);
    throw new Error(err.message);
  }
}

/**
 * Get courses assigned to a mentor
 */
export async function getMentorCourses(mentorId) {
  try {
    if (!mentorId) return [];

    const mentorRows = await query("SELECT id, name, role FROM atelier_lecturers WHERE id = ? LIMIT 1", [mentorId]);
    const isAdmin = mentorRows.length > 0 && mentorRows[0].role === 'admin';
    const allLecturers = await query("SELECT COUNT(*) as count FROM atelier_lecturers");
    const isOnlyLecturer = (allLecturers?.[0]?.count === 1);

    let courses = [];
    if (isAdmin || isOnlyLecturer) {
      courses = await query("SELECT * FROM atelier_courses ORDER BY id ASC");
    } else {
      courses = await query(
        `SELECT DISTINCT c.* FROM atelier_courses c
         LEFT JOIN atelier_mentor_courses mc ON c.id = mc.course_id
         WHERE mc.mentor_id = ? OR c.instructor_id = ?
         ORDER BY c.id ASC`,
        [mentorId, mentorId]
      );
    }

    for (const c of courses) {
      const countRows = await query("SELECT COUNT(*) as count FROM atelier_student_courses WHERE course_id = ?", [c.id]);
      c.enrolledCount = countRows?.[0]?.count || 0;
    }
    return courses;
  } catch (err) {
    console.error("Get mentor courses error:", err);
    return [];
  }
}

/**
 * Assign one or more courses to a mentor (Admin only)
 */
export async function assignCoursesToMentor(mentorId, courseIds = []) {
  try {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute("DELETE FROM atelier_mentor_courses WHERE mentor_id = ?", [mentorId]);
      for (const cId of courseIds) {
        await conn.execute("INSERT INTO atelier_mentor_courses (mentor_id, course_id) VALUES (?, ?)", [mentorId, cId]);
      }
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
    return { success: true };
  } catch (err) {
    console.error("Assign courses to mentor error:", err);
    throw new Error(err.message);
  }
}

/**
 * Get enrolled students for a specific course with computed progress % (Ownership checked)
 */
export async function getCourseEnrolledStudents(mentorId, courseId, limit = 25, offset = 0) {
  try {
    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, courseId);
    }

    const students = await query(
      `SELECT s.id, s.name, s.email, s.phone, s.college, s.degree, s.streak, s.xp, s.avatar, sc.completed_at as completedAt
       FROM atelier_students s
       JOIN atelier_student_courses sc ON s.id = sc.student_id
       WHERE sc.course_id = ?
       ORDER BY s.name ASC
       LIMIT ? OFFSET ?`,
      [courseId, Number(limit), Number(offset)]
    );

    // Compute real mathematical progress for each student
    const totalTopicsRows = await query(
      `SELECT COUNT(*) as total FROM atelier_syllabus_topics st
       JOIN atelier_course_syllabus cs ON st.syllabus_id = cs.id
       WHERE cs.course_id = ?`,
      [courseId]
    );
    const totalTopics = totalTopicsRows?.[0]?.total || 0;

    for (const student of students) {
      const completedRows = await query(
        `SELECT COUNT(*) as count FROM atelier_student_progress WHERE student_id = ? AND course_id = ?`,
        [student.id, courseId]
      );
      const completed = completedRows?.[0]?.count || 0;
      student.progressPercentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;
      student.completedTopics = completed;
      student.totalTopics = totalTopics;
    }

    const totalStudentsRows = await query(
      `SELECT COUNT(*) as count FROM atelier_student_courses WHERE course_id = ?`,
      [courseId]
    );

    students.totalCount = totalStudentsRows?.[0]?.count || students.length;
    return students;
  } catch (err) {
    console.error("Get course enrolled students error:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// ─── NORMALIZED SYLLABUS & TOPICS ACTIONS ────────────────────
// ─────────────────────────────────────────────────────────────

/**
 * Get structured course syllabus modules and normalized topics
 */
export async function getCourseSyllabus(courseId) {
  try {
    const modules = await query(
      `SELECT id, course_id as courseId, week_number as weekNumber, module_title as moduleTitle, description, sort_order as sortOrder
       FROM atelier_course_syllabus
       WHERE course_id = ?
       ORDER BY sort_order ASC, week_number ASC`,
      [courseId]
    );

    for (const mod of modules) {
      const topics = await query(
        `SELECT id, syllabus_id as syllabusId, title, sort_order as sortOrder
         FROM atelier_syllabus_topics
         WHERE syllabus_id = ?
         ORDER BY sort_order ASC, id ASC`,
        [mod.id]
      );
      mod.topics = topics;
    }

    return modules;
  } catch (err) {
    console.error("Get course syllabus error:", err);
    return [];
  }
}

/**
 * Create or update syllabus module (Ownership checked)
 */
export async function saveCourseSyllabusModule(mentorId, moduleData) {
  try {
    const { id, courseId, weekNumber, moduleTitle, description, sortOrder } = moduleData;
    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, courseId);
    }

    if (id) {
      await execute(
        `UPDATE atelier_course_syllabus SET week_number = ?, module_title = ?, description = ?, sort_order = ? WHERE id = ? AND course_id = ?`,
        [weekNumber || 1, moduleTitle, description || null, sortOrder || 0, id, courseId]
      );
      return { success: true, id };
    } else {
      const res = await execute(
        `INSERT INTO atelier_course_syllabus (course_id, week_number, module_title, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [courseId, weekNumber || 1, moduleTitle, description || null, sortOrder || 0]
      );
      return { success: true, id: res.insertId };
    }
  } catch (err) {
    console.error("Save course syllabus module error:", err);
    throw new Error(err.message);
  }
}

/**
 * Delete syllabus module (Ownership checked; cascades topics & progress)
 */
export async function deleteCourseSyllabusModule(mentorId, syllabusId) {
  try {
    const rows = await query("SELECT course_id FROM atelier_course_syllabus WHERE id = ?", [syllabusId]);
    if (rows.length === 0) return { success: true };
    const courseId = rows[0].course_id;

    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, courseId);
    }

    await execute("DELETE FROM atelier_course_syllabus WHERE id = ?", [syllabusId]);
    return { success: true };
  } catch (err) {
    console.error("Delete course syllabus module error:", err);
    throw new Error(err.message);
  }
}

/**
 * Create or update syllabus topic (Ownership checked)
 */
export async function saveSyllabusTopic(mentorId, topicData) {
  try {
    const { id, syllabusId, title, sortOrder } = topicData;
    const modRows = await query("SELECT course_id FROM atelier_course_syllabus WHERE id = ?", [syllabusId]);
    if (modRows.length === 0) throw new Error("Syllabus module not found.");
    const courseId = modRows[0].course_id;

    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, courseId);
    }

    if (id) {
      await execute(
        `UPDATE atelier_syllabus_topics SET title = ?, sort_order = ? WHERE id = ? AND syllabus_id = ?`,
        [title, sortOrder || 0, id, syllabusId]
      );
      return { success: true, id };
    } else {
      const res = await execute(
        `INSERT INTO atelier_syllabus_topics (syllabus_id, title, sort_order) VALUES (?, ?, ?)`,
        [syllabusId, title, sortOrder || 0]
      );
      return { success: true, id: res.insertId };
    }
  } catch (err) {
    console.error("Save syllabus topic error:", err);
    throw new Error(err.message);
  }
}

/**
 * Delete syllabus topic (Ownership checked; cascades progress records)
 */
export async function deleteSyllabusTopic(mentorId, topicId) {
  try {
    const rows = await query(
      `SELECT cs.course_id FROM atelier_syllabus_topics st
       JOIN atelier_course_syllabus cs ON st.syllabus_id = cs.id
       WHERE st.id = ?`,
      [topicId]
    );
    if (rows.length === 0) return { success: true };
    const courseId = rows[0].course_id;

    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, courseId);
    }

    await execute("DELETE FROM atelier_syllabus_topics WHERE id = ?", [topicId]);
    return { success: true };
  } catch (err) {
    console.error("Delete syllabus topic error:", err);
    throw new Error(err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// ─── REAL MATHEMATICAL PROGRESS ACTIONS ──────────────────────
// ─────────────────────────────────────────────────────────────

/**
 * Get student's mathematical course progress
 */
export async function getStudentCourseProgress(studentId, courseId) {
  try {
    const [totalRow] = await query(
      `SELECT COUNT(*) as total FROM atelier_syllabus_topics st
       JOIN atelier_course_syllabus cs ON st.syllabus_id = cs.id
       WHERE cs.course_id = ?`,
      [courseId]
    );
    const total = totalRow.total;

    const completedRows = await query(
      `SELECT topic_id FROM atelier_student_progress WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );

    const completed = completedRows.length;
    const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    const completedTopicIds = completedRows.map(r => r.topic_id);

    return {
      total,
      completed,
      percentage,
      completedTopicIds
    };
  } catch (err) {
    console.error("Get student course progress error:", err);
    return { total: 0, completed: 0, percentage: 0, completedTopicIds: [] };
  }
}

/**
 * Toggle completion of a syllabus topic by student
 */
export async function toggleTopicProgress(studentId, courseId, topicId) {
  try {
    const existing = await query(
      `SELECT id FROM atelier_student_progress WHERE student_id = ? AND course_id = ? AND topic_id = ?`,
      [studentId, courseId, topicId]
    );

    if (existing.length > 0) {
      await execute("DELETE FROM atelier_student_progress WHERE id = ?", [existing[0].id]);
    } else {
      await execute(
        "INSERT INTO atelier_student_progress (student_id, course_id, topic_id) VALUES (?, ?, ?)",
        [studentId, courseId, topicId]
      );
    }

    // Recompute and check if 100% completed
    const stats = await getStudentCourseProgress(studentId, courseId);
    if (stats.percentage === 100 && stats.total > 0) {
      await execute(
        "UPDATE atelier_student_courses SET completed_at = NOW() WHERE student_id = ? AND course_id = ? AND completed_at IS NULL",
        [studentId, courseId]
      );
    }

    try {
      if (existing.length === 0) {
        trackServer('topic_completed', {
          userId: Number(studentId),
          role: 'student',
          courseId: Number(courseId),
          topicId: Number(topicId)
        });
      }
      trackServer('course_progress_updated', {
        userId: Number(studentId),
        role: 'student',
        courseId: Number(courseId),
        metadata: { progress: stats.percentage }
      });
      if (stats.percentage === 100 && stats.total > 0) {
        trackServer('course_completed', {
          userId: Number(studentId),
          role: 'student',
          courseId: Number(courseId)
        });
      }
    } catch (anErr) {}

    return stats;
  } catch (err) {
    console.error("Toggle topic progress error:", err);
    throw new Error(err.message);
  }
}


// ─────────────────────────────────────────────────────────────
// ─── REAL LIVE SESSIONS ACTIONS ──────────────────────────────
// ─────────────────────────────────────────────────────────────

/**
 * Get live sessions (upcoming, active, or completed)
 */
export async function getLiveSessions(courseId = null) {
  try {
    let sql = `
      SELECT ls.*,
             l.name as mentorName,
             l.avatar as mentorAvatar,
             l.expertise as mentorExpertise,
             c.title as courseTitle
      FROM atelier_live_sessions ls
      LEFT JOIN atelier_lecturers l ON ls.mentor_id = l.id
      LEFT JOIN atelier_courses c ON ls.course_id = c.id
    `;
    const params = [];

    if (Array.isArray(courseId)) {
      if (courseId.length > 0) {
        sql += ` WHERE ls.course_id IN (${courseId.map(() => '?').join(',')})`;
        params.push(...courseId);
      } else {
        return [];
      }
    } else if (courseId) {
      sql += ` WHERE ls.course_id = ?`;
      params.push(courseId);
    }

    // Order: live sessions first, then upcoming by scheduled_at asc, completed by ended_at desc
    sql += ` ORDER BY CASE WHEN ls.status = 'live' THEN 0 WHEN ls.status = 'scheduled' THEN 1 ELSE 2 END, ls.scheduled_at ASC`;

    const rows = await query(sql, params);
    return rows.map(r => {
      const rawMeetingLink = (r.meeting_link || '').trim();
      let meetingLink = rawMeetingLink;
      if (!meetingLink) {
        meetingLink = `https://meet.jit.si/atelier-cohort-${r.course_id}-live`;
      } else if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://') && !meetingLink.startsWith('embedded:')) {
        if (meetingLink.includes('.') && !meetingLink.startsWith('atelier-')) {
          meetingLink = `https://${meetingLink}`;
        } else {
          meetingLink = `https://meet.jit.si/${meetingLink.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
        }
      }

      const scheduledAtIso = r.scheduled_at ? new Date(r.scheduled_at).toISOString() : null;

      return {
        id: r.id,
        courseId: r.course_id,
        courseTitle: r.courseTitle || 'Cohort Course',
        mentorId: r.mentor_id,
        mentorName: r.mentorName || 'Course Instructor',
        mentorAvatar: r.mentorAvatar || null,
        mentorExpertise: r.mentorExpertise || '',
        title: r.title,
        description: r.description,
        scheduledAt: scheduledAtIso,
        durationMinutes: r.duration_minutes || 60,
        meetingLink: meetingLink,
        status: r.status,
        recordingUrl: r.recording_url || null,
        startedAt: r.started_at,
        endedAt: r.ended_at,
        // DUAL COMPATIBILITY: snake_case aliases so both frontends work without error
        course_id: r.course_id,
        course_title: r.courseTitle || 'Cohort Course',
        mentor_name: r.mentorName || 'Course Instructor',
        mentor_avatar: r.mentorAvatar || null,
        mentor_expertise: r.mentorExpertise || '',
        meeting_link: meetingLink,
        scheduled_at: scheduledAtIso,
        duration_minutes: r.duration_minutes || 60,
        recording_url: r.recording_url || null,
        started_at: r.started_at,
        ended_at: r.ended_at
      };
    });
  } catch (err) {
    console.error("Get live sessions error:", err);
    return [];
  }
}

/**
 * Schedule a new live session (Ownership checked; prevents multiple concurrent live classes)
 */
export async function createLiveSession(mentorIdOrData, sessionData = null) {
  try {
    let mentorId = mentorIdOrData;
    let data = sessionData;
    if (typeof mentorIdOrData === 'object' && mentorIdOrData !== null && !sessionData) {
      mentorId = mentorIdOrData.mentorId;
      data = mentorIdOrData;
    }

    const { courseId, title, description, scheduledAt, durationMinutes, meetingLink } = data || {};

    if (!courseId) {
      throw new Error("Course identifier is required.");
    }
    if (!title || !title.trim()) {
      throw new Error("Live class title is required.");
    }
    if (!scheduledAt) {
      throw new Error("Scheduled date and time are required.");
    }

    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, courseId);
    }

    // Auto-generate embedded room link if mentor chooses built-in classroom
    const finalMeetingLink = (!meetingLink || meetingLink === 'embedded' || meetingLink === 'jitsi' || meetingLink.trim() === '')
      ? `https://meet.jit.si/atelier-live-cohort-${courseId}-${Date.now().toString(36)}`
      : meetingLink.trim();

    // Safely parse and format DATETIME for MySQL (in YYYY-MM-DD HH:MM:SS)
    let formattedDate = null;
    try {
      const dateObj = new Date(scheduledAt);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
      const pad = (n) => String(n).padStart(2, '0');
      formattedDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
    } catch (e) {
      throw new Error("Invalid scheduled time. Please choose a valid date and time.");
    }

    // Validate mentor_id if provided
    let validMentorId = null;
    if (mentorId) {
      const lecturerRows = await query("SELECT id FROM atelier_lecturers WHERE id = ?", [mentorId]);
      if (lecturerRows.length > 0) {
        validMentorId = lecturerRows[0].id;
      }
    }

    const res = await execute(
      `INSERT INTO atelier_live_sessions (course_id, mentor_id, title, description, scheduled_at, duration_minutes, meeting_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [courseId, validMentorId, title.trim(), description || null, formattedDate, durationMinutes || 60, finalMeetingLink]
    );

    try {
      trackServer('live_session_created', {
        courseId: Number(courseId),
        liveSessionId: res.insertId,
        role: 'mentor',
        metadata: { title: title.trim(), scheduledAt: formattedDate }
      });
    } catch (anErr) {}

    return { success: true, id: res.insertId };
  } catch (err) {
    console.error("Create live session error:", err);
    throw new Error(err.message);
  }
}

/**
 * Update live session status (Start Class, End Class, Cancel)
 * Guard: Only one live class at a time per mentor
 */
export async function updateLiveSessionStatus(mentorId, sessionId, status, recordingUrl = null) {
  try {
    const rows = await query("SELECT * FROM atelier_live_sessions WHERE id = ?", [sessionId]);
    if (rows.length === 0) throw new Error("Live session not found.");
    const session = rows[0];

    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, session.course_id);
    }

    if (status === 'live') {
      // Guard: Check if mentor already has an active live session
      if (mentorId) {
        const activeRows = await query(
          "SELECT id FROM atelier_live_sessions WHERE mentor_id = ? AND status = 'live' AND id != ?",
          [mentorId, sessionId]
        );
        if (activeRows.length > 0) {
          throw new Error("You already have an active live session in progress. Please end it before starting another.");
        }
      }
      await execute(
        "UPDATE atelier_live_sessions SET status = 'live', started_at = NOW() WHERE id = ?",
        [sessionId]
      );
      try {
        trackServer('live_session_started', {
          liveSessionId: Number(sessionId),
          courseId: Number(session.course_id),
          role: 'mentor'
        });
      } catch (anErr) {}
    } else if (status === 'completed') {
      await execute(
        "UPDATE atelier_live_sessions SET status = 'completed', ended_at = NOW(), recording_url = ? WHERE id = ?",
        [recordingUrl || null, sessionId]
      );
      try {
        trackServer('live_session_ended', {
          liveSessionId: Number(sessionId),
          courseId: Number(session.course_id),
          role: 'mentor',
          metadata: { recordingUrl }
        });
      } catch (anErr) {}
    } else if (status === 'cancelled') {
      await execute(
        "UPDATE atelier_live_sessions SET status = 'cancelled' WHERE id = ?",
        [sessionId]
      );
    } else if (status === 'scheduled') {
      await execute(
        "UPDATE atelier_live_sessions SET status = 'scheduled', started_at = NULL, ended_at = NULL WHERE id = ?",
        [sessionId]
      );
    }

    return { success: true };

  } catch (err) {
    console.error("Update live session status error:", err);
    throw new Error(err.message);
  }
}

/**
 * Delete live session (Ownership checked)
 */
export async function deleteLiveSession(mentorId, sessionId) {
  try {
    const rows = await query("SELECT course_id FROM atelier_live_sessions WHERE id = ?", [sessionId]);
    if (rows.length === 0) return { success: true };

    if (mentorId) {
      await assertMentorOwnsCourse(mentorId, rows[0].course_id);
    }

    await execute("DELETE FROM atelier_live_sessions WHERE id = ?", [sessionId]);
    return { success: true };
  } catch (err) {
    console.error("Delete live session error:", err);
    throw new Error(err.message);
  }
}

// --- ADMIN CONSOLE SECURITY ACTIONS ---

/**
 * Server-side verification for Admin Console clearance
 * Securely verifies master key or clearance password and returns signed session token
 */
export async function verifyAdminClearance(securityKey) {
  try {
    if (!securityKey || typeof securityKey !== 'string') {
      return { success: false, error: 'Clearance key is required.' };
    }

    const cleanKey = securityKey.trim();
    const masterKey = process.env.MASTER_SECURITY_KEY || process.env.ADMIN_SECURITY_KEY || process.env.NEXT_PUBLIC_MASTER_SECURITY_KEY || 'ARSHAD-SAMVRUDHI';
    const clearancePass = process.env.CLEARANCE_PASSWORD || process.env.NEXT_PUBLIC_CLEARANCE_PASSWORD || 'noor';

    if (cleanKey !== masterKey && cleanKey !== clearancePass) {
      return { success: false, error: 'Clearance denied: Invalid master security credentials.' };
    }

    // Generate cryptographically signed admin session token valid for 12 hours
    const token = signAdminSession({
      user: 'admin_operator',
      clearedAt: Date.now()
    });

    return { success: true, token };
  } catch (err) {
    console.error("verifyAdminClearance error:", err);
    return { success: false, error: 'Authentication verification encountered a server error.' };
  }
}

/**
 * Verify if an active admin session token is valid and unexpired
 */
export async function validateAdminSession(token) {
  try {
    if (!token) return { valid: false };
    const verified = verifyAdminSessionToken(token);
    return { valid: Boolean(verified && verified.role === 'admin') };
  } catch (e) {
    return { valid: false };
  }
}

