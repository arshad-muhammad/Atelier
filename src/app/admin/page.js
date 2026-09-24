'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getStudents, saveStudent, deleteStudent,
  getCourses, saveCourse, deleteCourse,
  getSchedule, saveSchedule, deleteSchedule,
  getMaterials, saveMaterial, deleteMaterial,
  getCallbacks, updateCallbackStatus, updateCallback, resolveCallback, deleteCallback,
  getContactInquiries, updateContactInquiryStatus, updateContactInquiry, deleteContactInquiry,
  getFacultyApplications, updateFacultyApplicationStatus, updateFacultyApplication, deleteFacultyApplication, approveFacultyToMentor,
  getLecturers, saveLecturer, deleteLecturer,
  getTransactions, deleteTransaction,
  verifyAdminClearance, validateAdminSession
} from '../actions';
import {
  getAllAssessmentsAdminAction,
  saveAssessmentAdminAction,
  deleteAssessmentAdminAction,
  getAssessmentResultsAdmin
} from '@/lib/assessments/actions';
import styles from './admin.module.css';

export default function AdminConsole() {
  const [authorized, setAuthorized] = useState(false);
  const [securityKey, setSecurityKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Entity Tab: 'users' | 'courses' | 'live' | 'materials' | 'callbacks' | 'contact' | 'faculty' | 'lecturers' | 'payments' | 'assessments'
  const [activeTab, setActiveTab] = useState('users');

  // DB entities state
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [contactInquiries, setContactInquiries] = useState([]);
  const [facultyApplications, setFacultyApplications] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adminAssessments, setAdminAssessments] = useState([]);

  // Filter states
  const [callbackStatusFilter, setCallbackStatusFilter] = useState('All');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('All');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState('All');

  // Inspection & management modals
  const [selectedCallback, setSelectedCallback] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Assessment results modal state
  const [selectedAssessmentForResults, setSelectedAssessmentForResults] = useState(null);
  const [adminAttempts, setAdminAttempts] = useState([]);
  const [showAdminResultsModal, setShowAdminResultsModal] = useState(false);
  const [showAdminAsstModal, setShowAdminAsstModal] = useState(false);
  const [adminAsstForm, setAdminAsstForm] = useState({
    id: null,
    course_id: '',
    title: '',
    description: '',
    duration_minutes: 45,
    passing_marks: 20,
    max_attempts: 2,
    status: 'published',
    proctoring_enabled: 1
  });

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals visibility & data state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [adminUploading, setAdminUploading] = useState(false);

  // Check sessionStorage for admin clearances
  useEffect(() => {
    async function checkAdminAuth() {
      if (typeof window !== 'undefined') {
        // High security: student accounts are strictly prohibited from admin access
        if (localStorage.getItem('loggedInStudentEmail')) {
          setAuthorized(false);
          return;
        }

        const token = sessionStorage.getItem('adminSessionToken');
        if (token) {
          try {
            const res = await validateAdminSession(token);
            if (res && res.valid) {
              setAuthorized(true);
              return;
            }
          } catch (e) {
            console.warn("Admin session validation failed:", e);
          }
        }
        // Fallback check
        const isClear = sessionStorage.getItem('adminCleared');
        if (isClear === 'true') {
          setAuthorized(true);
        }
      }
    }
    checkAdminAuth();
  }, []);

  const loadData = async () => {
    setStudents(await getStudents());
    setCourses(await getCourses());
    setSchedule(await getSchedule());
    setMaterials(await getMaterials());
    setCallbacks(await getCallbacks());
    setContactInquiries(await getContactInquiries().catch(() => []));
    setFacultyApplications(await getFacultyApplications().catch(() => []));
    setLecturers(await getLecturers());
    setTransactions(await getTransactions());
    setAdminAssessments(await getAllAssessmentsAdminAction().catch(() => []));
  };

  // Fetch db lists
  useEffect(() => {
    if (!authorized) return;
    loadData();

    window.addEventListener('courseChanged', loadData);
    return () => window.removeEventListener('courseChanged', loadData);
  }, [authorized]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (typeof window !== 'undefined' && localStorage.getItem('loggedInStudentEmail')) {
      setLoginError('Security Protocol: Student accounts are restricted from accessing administrative console nodes. Please log out first.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await verifyAdminClearance(securityKey.trim());
      if (res && res.success && res.token) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminSessionToken', res.token);
          sessionStorage.setItem('adminCleared', 'true');
        }
        setAuthorized(true);
      } else {
        setLoginError(res?.error || 'Clearance denied: Invalid Security Key credentials.');
      }
    } catch (err) {
      console.error("Admin login error:", err);
      // Fallback in case of network issue
      const envKey = process.env.NEXT_PUBLIC_MASTER_SECURITY_KEY;
      const envPass = process.env.NEXT_PUBLIC_CLEARANCE_PASSWORD;
      if ((envKey && securityKey === envKey) || (envPass && securityKey === envPass)) {
        setAuthorized(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminCleared', 'true');
        }
      } else {
        setLoginError('Authorization failed: ' + err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminSessionToken');
      sessionStorage.removeItem('adminCleared');
    }
    setAuthorized(false);
  };

  const handleResolveCallback = async (id) => {
    try {
      await updateCallbackStatus(id, 'Resolved');
      await loadData();
    } catch (err) {
      alert("Error resolving callback: " + err.message);
    }
  };

  const handleUpdateCallback = async (e) => {
    e.preventDefault();
    if (!selectedCallback) return;
    setIsProcessingAction(true);
    try {
      await updateCallback(selectedCallback.id, selectedCallback);
      await loadData();
      setSelectedCallback(null);
    } catch (err) {
      alert("Error updating callback: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateInquiry = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setIsProcessingAction(true);
    try {
      await updateContactInquiry(selectedInquiry.id, selectedInquiry);
      await loadData();
      setSelectedInquiry(null);
    } catch (err) {
      alert("Error updating inquiry: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setIsProcessingAction(true);
    try {
      await updateFacultyApplication(selectedFaculty.id, selectedFaculty);
      await loadData();
      setSelectedFaculty(null);
    } catch (err) {
      alert("Error updating faculty application: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleApproveFaculty = async (id) => {
    if (!confirm("Are you sure you want to approve this applicant and onboard them as an official Atelier Mentor?")) return;
    setIsProcessingAction(true);
    try {
      const res = await approveFacultyToMentor(id);
      alert(`Applicant successfully onboarded as Atelier Mentor (Mentor ID: ${res.lecturerId}). Temporary password initialized to: mentor123`);
      await loadData();
      setSelectedFaculty(null);
    } catch (err) {
      alert("Error onboarding faculty member: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Delete Entity
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entity? This operation is permanent.')) return;

    try {
      if (activeTab === 'users') {
        await deleteStudent(id);
      } else if (activeTab === 'courses') {
        await deleteCourse(id);
      } else if (activeTab === 'live') {
        await deleteSchedule(id);
      } else if (activeTab === 'materials') {
        await deleteMaterial(id);
      } else if (activeTab === 'callbacks') {
        await deleteCallback(id);
      } else if (activeTab === 'contact') {
        await deleteContactInquiry(id);
      } else if (activeTab === 'faculty') {
        await deleteFacultyApplication(id);
      } else if (activeTab === 'lecturers') {
        await deleteLecturer(id);
      } else if (activeTab === 'payments') {
        await deleteTransaction(id);
      } else if (activeTab === 'assessments') {
        await deleteAssessmentAdminAction(id);
      }
      
      // Sync list
      await loadData();
      window.dispatchEvent(new Event('courseChanged'));
    } catch (err) {
      console.error(err);
      alert("Error deleting entity: " + err.message);
    }
  };

  // Open add/edit modal
  const openModal = (mode, entity = null) => {
    setModalMode(mode);

    if (activeTab === 'assessments') {
      if (mode === 'edit' && entity) {
        setAdminAsstForm({
          id: entity.id,
          course_id: entity.course_id,
          title: entity.title,
          description: entity.description || '',
          duration_minutes: entity.duration_minutes,
          passing_marks: entity.passing_marks,
          max_attempts: entity.max_attempts,
          status: entity.status,
          proctoring_enabled: entity.proctoring_enabled
        });
      } else {
        setAdminAsstForm({
          id: null,
          course_id: courses[0]?.id || '',
          title: '',
          description: '',
          duration_minutes: 45,
          passing_marks: 20,
          max_attempts: 2,
          status: 'published',
          proctoring_enabled: 1
        });
      }
      setShowAdminAsstModal(true);
      return;
    }
    if (mode === 'edit' && entity) {
      setEditId(entity.id);
      const initialData = { ...entity };
      if (activeTab === 'materials' && entity.assets) {
        initialData.assetsJson = JSON.stringify(entity.assets, null, 2);
      }
      if (activeTab === 'lecturers') {
        initialData.assignedCourses = Array.isArray(entity.assignedCourses) ? [...entity.assignedCourses] : [];
        initialData.password = '';
        initialData.mustChangePassword = entity.mustChangePassword !== undefined ? Boolean(entity.mustChangePassword) : false;
      }
      setFormData(initialData);
    } else {
      setEditId(null);
      // Initialize default inputs based on active tab
      if (activeTab === 'users') {
        setFormData({ name: '', email: '', phone: '', college: '', gradYear: '2026', xp: 0, streak: 0, enrolledCourses: '1' });
      } else if (activeTab === 'courses') {
        setFormData({ title: '', description: '', price: 'Rs. 5999', originalPrice: 'Rs. 11998', discount: '50% OFF', badges: 'Certified, support', image: '/images/course_cohort_2.png', instructorId: '1', duration: '12 Weeks', highlights: '', curriculumOverview: '', subtitle: '', totalHours: '', totalModules: '', totalProjects: '', toolsTechnologies: '', faqs: '[]', certificateTitle: '', courseOutcomes: '' });
      } else if (activeTab === 'live') {
        setFormData({ courseId: '1', time: 'Today, 6:00 PM', title: '', type: 'Lecture' });
      } else if (activeTab === 'materials') {
        setFormData({ courseId: '1', title: '', assetsJson: '[]' });
      } else if (activeTab === 'lecturers') {
        setFormData({ name: '', email: '', phone: '', expertise: '', bio: '', assignedCourses: [], password: '', mustChangePassword: true });
      }
    }
    setShowModal(true);
  };

  // Handle Input Changes inside modals
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Modal details (Create / Update operations)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (activeTab === 'users') {
        const formattedUser = {
          ...formData,
          xp: parseInt(formData.xp || 0, 10),
          streak: parseInt(formData.streak || 0, 10),
          enrolledCourses: formData.enrolledCourses ? (typeof formData.enrolledCourses === 'string' ? formData.enrolledCourses.split(',').map(n => parseInt(n.trim(), 10)) : formData.enrolledCourses) : [1]
        };
        if (modalMode === 'edit') {
          formattedUser.id = editId;
        }
        await saveStudent(formattedUser);
      } else if (activeTab === 'courses') {
        const formattedCourse = {
          ...formData,
          badges: typeof formData.badges === 'string' ? formData.badges.split(',').map(s => s.trim()) : formData.badges,
          instructorId: parseInt(formData.instructorId || 1, 10),
          duration: formData.duration || null,
          highlights: formData.highlights || null,
          curriculumOverview: formData.curriculumOverview || null,
          subtitle: formData.subtitle || null,
          totalHours: formData.totalHours || null,
          totalModules: formData.totalModules || null,
          totalProjects: formData.totalProjects || null,
          toolsTechnologies: formData.toolsTechnologies || null,
          faqs: formData.faqs || null,
          certificateTitle: formData.certificateTitle || null,
          courseOutcomes: formData.courseOutcomes || null,
        };
        if (modalMode === 'edit') {
          formattedCourse.id = editId;
        }
        await saveCourse(formattedCourse);
      } else if (activeTab === 'live') {
        const formattedLive = {
          ...formData,
          courseId: parseInt(formData.courseId, 10)
        };
        if (modalMode === 'edit') {
          formattedLive.id = editId;
        }
        await saveSchedule(formattedLive);
      } else if (activeTab === 'materials') {
        let assets = [];
        try {
          assets = JSON.parse(formData.assetsJson || '[]');
        } catch (e) {
          alert('Invalid JSON formatting for assets array. Using empty array.');
        }
        const formattedMaterial = {
          courseId: parseInt(formData.courseId, 10),
          title: formData.title,
          assets
        };
        if (modalMode === 'edit') {
          formattedMaterial.id = editId;
        }
        await saveMaterial(formattedMaterial);
      } else if (activeTab === 'lecturers') {
        const formattedLecturer = { ...formData };
        if (modalMode === 'edit') {
          formattedLecturer.id = editId;
        }
        const result = await saveLecturer(formattedLecturer);
        if (result?.tempPassword) {
          alert(`Mentor credentials saved successfully!\n\nEmail: ${formData.email}\nPassword: ${result.tempPassword}\n\nPlease share this securely with the mentor. They can log in at /mentor/login.`);
        } else {
          alert('Mentor profile updated successfully!');
        }
      }

      // Close modal and reload lists
      window.dispatchEvent(new Event('courseChanged'));
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error saving entity: " + err.message);
    }
  };

  const handleAdminFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds the 50 MB upload limit.');
      return;
    }

    setAdminUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('category', 'material');
      if (formData.courseId) body.append('courseId', formData.courseId);
      body.append('adminKey', securityKey || 'ARSHAD-SAMVRUDHI');

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'x-admin-key': securityKey || 'ARSHAD-SAMVRUDHI'
        },
        body
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload file.');
      }

      const sizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
        : (file.size / 1024).toFixed(0) + ' KB';

      const ext = file.name.split('.').pop().toLowerCase();
      const assetType = ['pdf', 'zip', 'md', 'png', 'jpg', 'jpeg'].includes(ext) ? ext : 'doc';

      let currentAssets = [];
      try {
        currentAssets = JSON.parse(formData.assetsJson || '[]');
      } catch (err) {
        currentAssets = [];
      }

      const newAsset = {
        name: file.name,
        size: sizeStr,
        type: assetType,
        fileId: data.file.id,
        url: data.file.url
      };

      currentAssets.push(newAsset);
      setFormData(prev => ({
        ...prev,
        assetsJson: JSON.stringify(currentAssets, null, 2)
      }));

      alert(`File "${file.name}" uploaded successfully and added to course assets!`);
    } catch (err) {
      console.error('Admin file upload error:', err);
      alert('Upload error: ' + err.message);
    } finally {
      setAdminUploading(false);
      e.target.value = '';
    }
  };


  // Filters logic
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSchedule = schedule.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMaterials = materials.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const filteredCallbacks = callbacks.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || 
      (c.studentName && c.studentName.toLowerCase().includes(q)) || 
      (c.topic && c.topic.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));
    const matchesStatus = callbackStatusFilter === 'All' || c.status === callbackStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContactInquiries = contactInquiries.filter(ci => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || 
      (ci.name && ci.name.toLowerCase().includes(q)) ||
      (ci.email && ci.email.toLowerCase().includes(q)) ||
      (ci.subject && ci.subject.toLowerCase().includes(q)) ||
      (ci.department && ci.department.toLowerCase().includes(q)) ||
      (ci.message && ci.message.toLowerCase().includes(q));
    const matchesStatus = inquiryStatusFilter === 'All' || ci.status === inquiryStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFacultyApplications = facultyApplications.filter(f => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || 
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.phone && f.phone.toLowerCase().includes(q)) ||
      (f.roleApplied && f.roleApplied.toLowerCase().includes(q)) ||
      (f.expertise && f.expertise.toLowerCase().includes(q)) ||
      (f.currentCompany && f.currentCompany.toLowerCase().includes(q));
    const matchesStatus = facultyStatusFilter === 'All' || f.status === facultyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLecturers = lecturers.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.expertise.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTransactions = transactions.filter(t => t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || t.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredAssessments = adminAssessments.filter(a => {
    const q = searchTerm.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.course_title && a.course_title.toLowerCase().includes(q)) ||
      (a.status && a.status.toLowerCase().includes(q))
    );
  });

  const handleOpenAdminResults = async (asst) => {
    try {
      setSelectedAssessmentForResults(asst);
      const results = await getAssessmentResultsAdmin(asst.id);
      setAdminAttempts(results || []);
      setShowAdminResultsModal(true);
    } catch (err) {
      alert('Error loading assessment results: ' + err.message);
    }
  };

  const handleExportCsv = (asst, attempts) => {
    const headers = ['Attempt ID', 'Student Name', 'Student Email', 'Attempt Number', 'Score', 'Total Marks', 'Percentage', 'Passed', 'Proctoring Flags', 'Status', 'Submitted At'];
    const rows = attempts.map(att => [
      att.id,
      `"${(att.student_name || '').replace(/"/g, '""')}"`,
      att.student_email,
      att.attempt_number,
      att.total_score,
      asst.total_marks,
      `${att.percentage}%`,
      att.passed ? 'PASSED' : 'FAILED',
      att.proctoring_flags,
      att.status,
      att.submitted_at ? new Date(att.submitted_at).toISOString() : 'In Progress'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assessment_${asst.id}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAdminAssessment = async (e) => {
    e.preventDefault();
    if (!adminAsstForm.course_id) {
      alert('Please select a target course for this assessment.');
      return;
    }
    try {
      await saveAssessmentAdminAction(adminAsstForm);
      setShowAdminAsstModal(false);
      setAdminAssessments(await getAllAssessmentsAdminAction());
    } catch (err) {
      alert('Error saving assessment: ' + err.message);
    }
  };

  // Dynamic stats calculations
  const activeEnrolledCount = students.filter(s => s.enrolledCourses && s.enrolledCourses.length > 0).length;
  const avgXP = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.xp || 0), 0) / students.length) : 0;

  // SECURITY INPUT GATE
  if (!authorized) {
    return (
      <div className={styles.gateWrapper}>
        <div className={styles.gateCard}>
          <div className={styles.gateHeader}>
            <h2 className={styles.gateTitle}>Atelier Terminal</h2>
            <p className={styles.gateSubtitle}>Secure Admin Authorization clearance</p>
          </div>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="ENTER SECURITY KEY" 
              required
              disabled={isLoggingIn}
              className={styles.gateInput}
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
            />
            {loginError && <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</p>}
            <button type="submit" className={styles.gateBtn} disabled={isLoggingIn}>
              {isLoggingIn ? 'Verifying clearance...' : 'Authorize CLEARANCE'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminShell}>
      
      {/* Header bar */}
      <header className={styles.adminHeader}>
        <div className={styles.adminTitleBlock}>
          <img src="/logo.png" alt="Atelier" style={{ width: '28px', height: '28px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.2rem' }}>Atelier Server Node</h2>
          <span className={styles.adminBadge}>Admin Console</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link 
            href="/admin/analytics" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(242, 85, 34, 0.12)', 
              border: '1px solid rgba(242, 85, 34, 0.3)', 
              color: 'var(--accent-orange, #f25522)', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>Analytics Engine ↗</span>
          </Link>
          <button 
            onClick={handleLogout}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Exit Session
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className={styles.adminMain}>
        
        {/* Entity Tabs */}
        <div className={styles.tabRow}>
          <button className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('users'); setSearchTerm(''); }}>Students ({students.length})</button>
          <button className={`${styles.tabBtn} ${activeTab === 'courses' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('courses'); setSearchTerm(''); }}>Courses ({courses.length})</button>
          <button className={`${styles.tabBtn} ${activeTab === 'live' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('live'); setSearchTerm(''); }}>Live Schedule ({schedule.length})</button>
          <button className={`${styles.tabBtn} ${activeTab === 'materials' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('materials'); setSearchTerm(''); }}>Materials ({materials.length})</button>
          <button className={`${styles.tabBtn} ${activeTab === 'callbacks' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('callbacks'); setSearchTerm(''); }}>
            Hotline Callbacks ({callbacks.length})
            {callbacks.filter(c => c.status === 'Pending').length > 0 && (
              <span className={styles.badgePill}>{callbacks.filter(c => c.status === 'Pending').length}</span>
            )}
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'contact' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('contact'); setSearchTerm(''); }}>
            Contact Inquiries ({contactInquiries.length})
            {contactInquiries.filter(c => c.status === 'new').length > 0 && (
              <span className={styles.badgePill}>{contactInquiries.filter(c => c.status === 'new').length}</span>
            )}
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'faculty' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('faculty'); setSearchTerm(''); }}>
            Faculty Dossiers ({facultyApplications.length})
            {facultyApplications.filter(f => f.status === 'pending').length > 0 && (
              <span className={styles.badgePill}>{facultyApplications.filter(f => f.status === 'pending').length}</span>
            )}
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'lecturers' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('lecturers'); setSearchTerm(''); }}>Mentors ({lecturers.length})</button>
          <button className={`${styles.tabBtn} ${activeTab === 'payments' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('payments'); setSearchTerm(''); }}>Payments ({transactions.length})</button>
          <button className={`${styles.tabBtn} ${activeTab === 'assessments' ? styles.tabBtnActive : ''}`} onClick={() => { setActiveTab('assessments'); setSearchTerm(''); }}>Assessments ({adminAssessments.length})</button>
          <Link 
            href="/admin/analytics" 
            className={styles.tabBtn}
            style={{ color: 'var(--accent-orange, #f25522)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Analytics ↗
          </Link>
        </div>


        {/* Dynamic Metric Gauges */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Database Students</span>
            <p className={styles.statValue}>{students.length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Cohorts Offered</span>
            <p className={styles.statValue}>{courses.length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending Callback Requests</span>
            <p className={styles.statValue} style={{ color: 'var(--accent-orange)' }}>{callbacks.filter(c => c.status === 'Pending').length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>New Contact Inquiries</span>
            <p className={styles.statValue} style={{ color: '#3498db' }}>{contactInquiries.filter(c => c.status === 'new').length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending Faculty Applications</span>
            <p className={styles.statValue} style={{ color: '#f1c40f' }}>{facultyApplications.filter(f => f.status === 'pending').length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Registered Mentors</span>
            <p className={styles.statValue}>{lecturers.length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Upcoming Streams Scheduled</span>
            <p className={styles.statValue}>{schedule.length}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Course Enrollments</span>
            <p className={styles.statValue}>{students.reduce((acc, s) => acc + (s.enrolledCourses?.length || 0), 0)}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Enrolled Students</span>
            <p className={styles.statValue}>{activeEnrolledCount}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Average Student XP</span>
            <p className={styles.statValue}>{avgXP} XP</p>
          </div>
        </div>

        {/* Content Control Header */}
        <div className={styles.controlHeader}>
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            className={styles.searchBar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {activeTab !== 'callbacks' && activeTab !== 'contact' && activeTab !== 'faculty' && activeTab !== 'payments' && (
            <button 
              className={styles.gateBtn} 
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
              onClick={() => openModal('add')}
            >
              + Create New Entity
            </button>
          )}
        </div>

        {/* Data Tables */}
        <div className={styles.tableWrapper}>
          
          {/* TAB 1: USERS ENTITIES */}
          {activeTab === 'users' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>College Details</th>
                  <th>XP</th>
                  <th>Streak</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td style={{ fontWeight: '600' }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.college} ({s.gradYear})</td>
                    <td>{s.xp}</td>
                    <td style={{ color: 'var(--accent-orange)', fontWeight: '600' }}>{s.streak} Days</td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openModal('edit', s)}>Edit</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No student logs matching filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* TAB 2: COURSES ENTITIES */}
          {activeTab === 'courses' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Badges</th>
                  <th>Enrolled Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.title}>
                      <a href={`/admin/courses/${c.id}`} style={{ color: 'var(--accent-orange)', fontWeight: '600', textDecoration: 'underline' }}>
                        {c.title}
                      </a>
                    </td>
                    <td>{c.price || 'Free'}</td>
                    <td>{c.discount || 'N/A'}</td>
                    <td>{c.badges ? c.badges.join(', ') : ''}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {students.filter(s => s.enrolledCourses && s.enrolledCourses.includes(c.id)).map(s => (
                          <span key={s.id} className={styles.adminBadge} style={{ background: 'rgba(242, 85, 34, 0.08)', border: '1px solid rgba(242, 85, 34, 0.2)', color: 'var(--accent-orange)' }}>
                            {s.name}
                          </span>
                        ))}
                        {students.filter(s => s.enrolledCourses && s.enrolledCourses.includes(c.id)).length === 0 && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>No Enrolled Students</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openModal('edit', c)}>Edit</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredCourses.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No cohort databases matching filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* TAB 3: LIVE SCHEDULE ENTITIES */}
          {activeTab === 'live' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Course ID</th>
                  <th>Topic Title</th>
                  <th>Time Slot</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.courseId === 1 ? 'Cohort 3.0' : 'System Design'}</td>
                    <td style={{ fontWeight: '600' }}>{s.title}</td>
                    <td>{s.time}</td>
                    <td><span className={styles.adminBadge} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#ffffff' }}>{s.type}</span></td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openModal('edit', s)}>Edit</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredSchedule.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No live streams matching filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* TAB 4: MATERIALS */}
          {activeTab === 'materials' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Course ID</th>
                  <th>Folder Module Name</th>
                  <th>Total Files</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.courseId === 1 ? 'Cohort 3.0' : 'System Design'}</td>
                    <td style={{ fontWeight: '600' }}>{m.title}</td>
                    <td>{m.assets ? m.assets.length : 0} Assets</td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openModal('edit', m)}>Edit</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredMaterials.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No resource folder matching filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* TAB 5: HOTLINE CALLBACK REQUEST LOGS */}
          {activeTab === 'callbacks' && (
            <div>
              <div className={styles.filterPillsRow}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginRight: '0.5rem', textTransform: 'uppercase', fontWeight: '700' }}>Filter Status:</span>
                {['All', 'Pending', 'In Progress', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    className={`${styles.filterPill} ${callbackStatusFilter === st ? styles.filterPillActive : ''}`}
                    onClick={() => setCallbackStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th>Contact Info</th>
                    <th>Preferred Slot</th>
                    <th>Track / Topic</th>
                    <th>Submitted Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCallbacks.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td style={{ fontWeight: '600' }}>{c.studentName}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ color: '#fff' }}>{c.phone}</span>
                          {c.email && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{c.email}</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                          {c.preferredTime || 'Immediate / Flexible'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.topic}
                      </td>
                      <td>{c.createdAt || c.time ? new Date(c.createdAt || c.time).toLocaleString() : 'Recent'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          c.status === 'Pending' ? styles.statusPending : 
                          c.status === 'In Progress' ? styles.statusInProgress : 
                          styles.statusResolved
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setSelectedCallback({ ...c })}>Inspect</button>
                        {c.status === 'Pending' && (
                          <button className={`${styles.actionBtn} ${styles.resolveBtn}`} onClick={() => handleResolveCallback(c.id)}>Resolve</button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredCallbacks.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2.5rem' }}>No callback submissions match your criteria.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: CONTACT INQUIRIES */}
          {activeTab === 'contact' && (
            <div>
              <div className={styles.filterPillsRow}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginRight: '0.5rem', textTransform: 'uppercase', fontWeight: '700' }}>Status:</span>
                {['All', 'new', 'in_progress', 'resolved', 'archived'].map((st) => (
                  <button
                    key={st}
                    className={`${styles.filterPill} ${inquiryStatusFilter === st ? styles.filterPillActive : ''}`}
                    onClick={() => setInquiryStatusFilter(st)}
                  >
                    {st === 'in_progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>

              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sender Name</th>
                    <th>Contact Details</th>
                    <th>Department</th>
                    <th>Subject</th>
                    <th>Message Snippet</th>
                    <th>Received At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContactInquiries.map((ci) => (
                    <tr key={ci.id}>
                      <td>{ci.id}</td>
                      <td style={{ fontWeight: '600' }}>{ci.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <a href={`mailto:${ci.email}`} style={{ color: 'var(--accent-orange)', textDecoration: 'none', fontSize: '0.82rem' }}>{ci.email}</a>
                          {ci.phone && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{ci.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#3498db', fontWeight: '600' }}>{ci.department || 'General'}</span>
                      </td>
                      <td style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ci.subject || 'Inquiry'}
                      </td>
                      <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.7)' }}>
                        {ci.message}
                      </td>
                      <td>{ci.createdAt ? new Date(ci.createdAt).toLocaleString() : 'Recent'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          ci.status === 'new' ? styles.statusNew :
                          ci.status === 'in_progress' ? styles.statusInProgress :
                          ci.status === 'resolved' ? styles.statusApproved :
                          styles.statusArchived
                        }`}>
                          {ci.status}
                        </span>
                      </td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setSelectedInquiry({ ...ci })}>Inspect</button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(ci.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredContactInquiries.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2.5rem' }}>No contact inquiries match your criteria.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: FACULTY APPLICATIONS */}
          {activeTab === 'faculty' && (
            <div>
              <div className={styles.filterPillsRow}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginRight: '0.5rem', textTransform: 'uppercase', fontWeight: '700' }}>Status:</span>
                {['All', 'pending', 'under_review', 'approved', 'rejected'].map((st) => (
                  <button
                    key={st}
                    className={`${styles.filterPill} ${facultyStatusFilter === st ? styles.filterPillActive : ''}`}
                    onClick={() => setFacultyStatusFilter(st)}
                  >
                    {st === 'under_review' ? 'Under Review' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>

              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Candidate</th>
                    <th>Role Applied</th>
                    <th>Domain / Expertise</th>
                    <th>Experience</th>
                    <th>Current Org</th>
                    <th>Profiles</th>
                    <th>Applied At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacultyApplications.map((f) => (
                    <tr key={f.id}>
                      <td>{f.id}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: '600' }}>{f.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{f.email}</span>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{f.phone}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--accent-orange)', fontSize: '0.82rem' }}>
                        {f.roleApplied}
                      </td>
                      <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.expertise}
                      </td>
                      <td>{f.experienceYears || '2-5 Yrs'}</td>
                      <td>{f.currentCompany || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {f.linkedin && (
                            <a href={f.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', fontSize: '0.75rem', textDecoration: 'underline' }}>
                              LinkedIn
                            </a>
                          )}
                          {f.github && (
                            <a href={f.github} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: '0.75rem', textDecoration: 'underline' }}>
                              GitHub
                            </a>
                          )}
                        </div>
                      </td>
                      <td>{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Recent'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          f.status === 'pending' ? styles.statusPending :
                          f.status === 'under_review' ? styles.statusInProgress :
                          f.status === 'approved' ? styles.statusApproved :
                          styles.statusRejected
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setSelectedFaculty({ ...f })}>Inspect Dossier</button>
                        {f.status !== 'approved' && (
                          <button className={`${styles.actionBtn} ${styles.approveBtn}`} onClick={() => handleApproveFaculty(f.id)}>Approve</button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(f.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredFacultyApplications.length === 0 && <tr><td colSpan="10" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2.5rem' }}>No faculty dossiers match your criteria.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: MENTORS ENTITIES */}
          {activeTab === 'lecturers' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mentor Name</th>
                  <th>Contact Info</th>
                  <th>Expertise Focus</th>
                  <th>Assigned Cohorts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLecturers.map((l) => {
                  const assignedCourseList = courses.filter(c => (l.assignedCourses || []).includes(c.id));

                  return (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', color: '#ffffff' }}>{l.name}</span>
                          {l.lockedUntil && new Date(l.lockedUntil) > new Date() && (
                            <span className={styles.adminBadge} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.65rem' }}>
                              Locked
                            </span>
                          )}
                          {l.mustChangePassword ? (
                            <span className={styles.adminBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.65rem' }}>
                              Must Reset Pass
                            </span>
                          ) : null}
                        </div>
                        {l.role && <span style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l.role}</span>}
                      </td>
                      <td>
                        <div>{l.email}</div>
                        {l.phone && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{l.phone}</div>}
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>{l.expertise || 'General'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {assignedCourseList.map(c => (
                            <span key={c.id} className={styles.adminBadge} style={{ background: 'rgba(242, 85, 34, 0.1)', border: '1px solid rgba(242, 85, 34, 0.3)', color: '#f25522' }}>
                              {c.title.includes(':') ? c.title.split(':')[0] : c.title}
                            </span>
                          ))}
                          {assignedCourseList.length === 0 && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>None Assigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openModal('edit', l)}>Edit</button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(l.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLecturers.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No mentor profiles matching filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* TAB 7: PAYMENTS ENTITIES */}
          {activeTab === 'payments' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Details</th>
                  <th>Course Title</th>
                  <th>Amount</th>
                  <th>Razorpay Order ID</th>
                  <th>Razorpay Payment ID</th>
                  <th>Date/Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td style={{ fontWeight: '600' }}>
                      <div>{t.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>ID: {t.studentId}</div>
                    </td>
                    <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={t.courseTitle}>
                      {t.courseTitle}
                    </td>
                    <td style={{ color: '#2ecc71', fontWeight: '600' }}>{t.amount}</td>
                    <td style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>
                      {t.razorpayOrderId || <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span>}
                    </td>
                    <td style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>
                      {t.razorpayPaymentId || <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span>}
                    </td>
                    <td>{t.timestamp ? new Date(t.timestamp).toLocaleString() : 'Recent'}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ 
                        color: t.status === 'Verified' ? '#3b82f6' : '#2ecc71', 
                        background: t.status === 'Verified' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(46, 204, 113, 0.08)', 
                        border: t.status === 'Verified' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(46, 204, 113, 0.2)' 
                      }}>
                        {t.status || 'Success'}
                      </span>
                    </td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>No payment logs matching filters.</td></tr>}
              </tbody>
            </table>
          )}

          {/* TAB 8: ASSESSMENTS ENTITIES */}
          {activeTab === 'assessments' && (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Assessment Title</th>
                  <th>Assigned Course</th>
                  <th>Duration & Marks</th>
                  <th>Questions</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((asst) => (
                  <tr key={asst.id}>
                    <td>#{asst.id}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>{asst.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {asst.description || 'Cohort assessment'}
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>{asst.course_title}</span>
                    </td>
                    <td>
                      <div>{asst.duration_minutes} Mins</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                        {asst.total_marks} Marks ({asst.passing_marks} to pass)
                      </div>
                    </td>
                    <td>{asst.question_count || 0} Questions</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        style={{ color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '0.3rem 0.6rem' }}
                        onClick={() => handleOpenAdminResults(asst)}
                      >
                        {asst.attempt_count || 0} Attempts 📊
                      </button>
                    </td>
                    <td>
                      <span className={styles.statusBadge} style={{ color: asst.status === 'published' ? '#34d399' : '#94a3b8' }}>
                        {asst.status}
                      </span>
                    </td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openModal('edit', asst)}>Edit</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(asst.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredAssessments.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>
                      No assessments matching search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>
      </main>

      {/* CREATE & EDIT FORM MODALS */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {activeTab === 'lecturers' 
                  ? (modalMode === 'edit' ? 'Modify Mentor Profile' : 'Register New Mentor')
                  : (modalMode === 'edit' ? `Modify ${activeTab.slice(0, -1)} Entity` : `Create ${activeTab.slice(0, -1)} Log`)}
              </h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className={styles.modalFormContainer}>
              <div className={styles.modalFormBody}>
              
              {/* TAB INPUTS: USERS */}
              {activeTab === 'users' && (
                <>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Student Name</label>
                    <input type="text" name="name" required className={styles.modalInput} value={formData.name || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Email Address</label>
                    <input type="email" name="email" required className={styles.modalInput} value={formData.email || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Phone</label>
                      <input type="tel" name="phone" className={styles.modalInput} value={formData.phone || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Graduation Year</label>
                      <input type="number" name="gradYear" className={styles.modalInput} value={formData.gradYear || '2026'} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>College / Institution</label>
                    <input type="text" name="college" className={styles.modalInput} value={formData.college || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Streak Days</label>
                      <input type="number" name="streak" className={styles.modalInput} value={formData.streak || '0'} onChange={handleFormChange} />
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>XP points</label>
                      <input type="number" name="xp" className={styles.modalInput} value={formData.xp || '0'} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Enrolled Course IDs (comma separated)</label>
                    <input type="text" name="enrolledCourses" className={styles.modalInput} placeholder="1, 2" value={formData.enrolledCourses || ''} onChange={handleFormChange} />
                  </div>
                </>
              )}

              {activeTab === 'courses' && (
                <>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Course Title</label>
                    <input type="text" name="title" required className={styles.modalInput} value={formData.title || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Short Subtitle / Tagline</label>
                    <input type="text" name="subtitle" className={styles.modalInput} placeholder="e.g. Build Real Products. Get Hired." value={formData.subtitle || ''} onChange={handleFormChange} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>Shown below the title in the hero section</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Description</label>
                    <textarea name="description" required className={styles.modalTextarea} value={formData.description || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Price Tag</label>
                      <input type="text" name="price" className={styles.modalInput} value={formData.price || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Original Price (Slashed)</label>
                      <input type="text" name="originalPrice" className={styles.modalInput} value={formData.originalPrice || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Discount (e.g. 50% OFF)</label>
                      <input type="text" name="discount" className={styles.modalInput} value={formData.discount || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Duration (e.g. 12 Weeks)</label>
                      <input type="text" name="duration" className={styles.modalInput} placeholder="12 Weeks" value={formData.duration || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Total Live Hours (e.g. 150+)</label>
                      <input type="text" name="totalHours" className={styles.modalInput} placeholder="150+" value={formData.totalHours || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Total Modules (e.g. 12+)</label>
                      <input type="text" name="totalModules" className={styles.modalInput} placeholder="12+" value={formData.totalModules || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Total Projects (e.g. 8+)</label>
                      <input type="text" name="totalProjects" className={styles.modalInput} placeholder="8+" value={formData.totalProjects || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Features/Badges (comma separated)</label>
                    <input type="text" name="badges" className={styles.modalInput} placeholder="Real Product, Certified, Support" value={formData.badges || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Course Outcomes (comma separated)</label>
                    <input type="text" name="courseOutcomes" className={styles.modalInput} placeholder="Build SaaS products, Master system design, Land a job" value={formData.courseOutcomes || ''} onChange={handleFormChange} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>Shown as feature cards in the "Build Real Products" section</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Course Highlights (comma separated)</label>
                    <input type="text" name="highlights" className={styles.modalInput} placeholder="Live classes, Industry projects, 1:1 mentorship" value={formData.highlights || ''} onChange={handleFormChange} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>Fallback if Course Outcomes is empty</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Tools & Technologies (comma separated)</label>
                    <input type="text" name="toolsTechnologies" className={styles.modalInput} placeholder="React, Node.js, MongoDB, AWS, Docker" value={formData.toolsTechnologies || ''} onChange={handleFormChange} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>Shown as tech stack icons. Supported: React, Node.js, Next.js, TypeScript, Python, MongoDB, AWS, Docker, PostgreSQL, Git, JavaScript, CSS, Tailwind, Redis</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Curriculum Overview</label>
                    <textarea name="curriculumOverview" className={styles.modalTextarea} placeholder="Week 1: Foundations & Setup&#10;Week 2: Core Architecture&#10;Week 3: Advanced Patterns..." value={formData.curriculumOverview || ''} onChange={handleFormChange} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>One item per line - shown as expandable curriculum roadmap</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Certificate Title</label>
                    <input type="text" name="certificateTitle" className={styles.modalInput} placeholder="e.g. Full Stack Development Cohort 3.0" value={formData.certificateTitle || ''} onChange={handleFormChange} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>The official name shown on the certificate mockup</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>FAQs (JSON Array)</label>
                    <textarea
                      name="faqs"
                      className={styles.modalTextarea}
                      style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                      placeholder={'[{"q":"Who is this for?","a":"Anyone who wants to build real products."}]'}
                      value={formData.faqs || '[]'}
                      onChange={handleFormChange}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>{'{"q":"question","a":"answer"} - shown as accordion FAQ section'}</span>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Assigned Course Instructor (Lecturer)</label>
                    <select name="instructorId" className={styles.modalSelect} value={formData.instructorId || '1'} onChange={handleFormChange}>
                      {lecturers.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} ({l.expertise})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* TAB INPUTS: LIVE SCHEDULE */}
              {activeTab === 'live' && (
                <>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Session Topic Title</label>
                    <input type="text" name="title" required className={styles.modalInput} value={formData.title || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Associated Course</label>
                      <select name="courseId" className={styles.modalSelect} value={formData.courseId || ''} onChange={handleFormChange}>
                        <option value="">-- Select Course --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.profileFormGroup}>
                      <label className={styles.modalLabel}>Session Type</label>
                      <select name="type" className={styles.modalSelect} value={formData.type || 'Lecture'} onChange={handleFormChange}>
                        <option value="Lecture">Lecture</option>
                        <option value="Lab">Coding Lab</option>
                        <option value="Review">Mentor Review</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Time Slot (e.g. Today, 6:00 PM)</label>
                    <input type="text" name="time" required className={styles.modalInput} value={formData.time || ''} onChange={handleFormChange} />
                  </div>
                </>
              )}

              {/* TAB INPUTS: MATERIALS */}
              {activeTab === 'materials' && (
                <>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Folder Module Title</label>
                    <input type="text" name="title" required className={styles.modalInput} value={formData.title || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Associated Course</label>
                    <select name="courseId" className={styles.modalSelect} value={formData.courseId || ''} onChange={handleFormChange}>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.profileFormGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className={styles.modalLabel} style={{ margin: 0 }}>Assets Array JSON</label>
                      <label style={{ 
                        cursor: adminUploading ? 'wait' : 'pointer', 
                        color: 'var(--accent-orange, #f25522)', 
                        fontSize: '0.78rem', 
                        fontWeight: '700',
                        background: 'rgba(242, 85, 34, 0.1)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(242, 85, 34, 0.2)'
                      }}>
                        {adminUploading ? '⏳ Uploading...' : '➕ Upload File'}
                        <input type="file" style={{ display: 'none' }} onChange={handleAdminFileUpload} disabled={adminUploading} />
                      </label>
                    </div>
                    <textarea 
                      name="assetsJson" 
                      required 
                      className={styles.modalTextarea} 
                      style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                      value={formData.assetsJson || JSON.stringify(formData.assets || [], null, 2)} 
                      onChange={handleFormChange} 
                    />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>
                      {'Format: [{"name":"File.pdf","size":"1.2 MB","type":"pdf","fileId":1}] — Upload files directly using the button above to store them in assets.'}
                    </span>
                  </div>
                </>
              )}

              {/* TAB INPUTS: MENTORS */}
              {activeTab === 'lecturers' && (
                <>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Mentor Full Name</label>
                    <input type="text" name="name" required className={styles.modalInput} value={formData.name || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Email Address (Used for Login)</label>
                    <input type="email" name="email" required className={styles.modalInput} value={formData.email || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Phone Number (Optional)</label>
                    <input type="tel" name="phone" className={styles.modalInput} placeholder="+91 9876543210" value={formData.phone || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Expertise Focus (e.g. Distributed Systems & Rust)</label>
                    <input type="text" name="expertise" required className={styles.modalInput} value={formData.expertise || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Biography</label>
                    <textarea name="bio" required className={styles.modalTextarea} value={formData.bio || ''} onChange={handleFormChange} />
                  </div>
                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>
                      {modalMode === 'add' ? 'Login Password (Optional)' : 'Reset Login Password (Optional)'}
                    </label>
                    <input 
                      type="text" 
                      name="password" 
                      className={styles.modalInput} 
                      placeholder={modalMode === 'add' ? 'Leave empty to auto-generate temporary password' : 'Leave blank to keep current password'} 
                      value={formData.password || ''} 
                      onChange={handleFormChange} 
                      autoComplete="new-password"
                    />
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                      {modalMode === 'add' 
                        ? 'Specify an initial login password for this mentor, or leave blank to automatically generate a secure 10-character password.' 
                        : 'Enter a new password here to reset this mentor\'s credentials and clear any active login lockout. Leave blank to keep existing password.'}
                    </span>
                  </div>

                  <div className={styles.profileFormGroup} style={{ marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff' }}>
                      <input
                        type="checkbox"
                        name="mustChangePassword"
                        checked={formData.mustChangePassword !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, mustChangePassword: e.target.checked }))}
                      />
                      <span>Require mentor to change password on login</span>
                    </label>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginLeft: '22px', marginTop: '2px', display: 'block' }}>
                      When checked, the mentor will be forced to create a new password upon logging in at /mentor/login.
                    </span>
                  </div>

                  <div className={styles.profileFormGroup}>
                    <label className={styles.modalLabel}>Assigned Cohorts (Mentorship Access)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.5rem 0', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', paddingLeft: '10px' }}>
                      {courses.map(course => {
                        const isAssigned = (formData.assignedCourses || []).includes(course.id);
                        return (
                          <label key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: isAssigned ? '#ffffff' : 'rgba(255,255,255,0.6)' }}>
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                const current = formData.assignedCourses || [];
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, assignedCourses: [...current, course.id] }));
                                } else {
                                  setFormData(prev => ({ ...prev, assignedCourses: current.filter(id => id !== course.id) }));
                                }
                              }}
                            />
                            <span>{course.title}</span>
                          </label>
                        );
                      })}
                      {courses.length === 0 && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>No courses available.</span>}
                    </div>
                  </div>

                  {modalMode === 'add' && (
                    <div style={{ padding: '0.75rem', background: 'rgba(242, 85, 34, 0.08)', border: '1px solid rgba(242, 85, 34, 0.25)', borderRadius: '6px', fontSize: '0.78rem', color: '#ff8a65', lineHeight: '1.4' }}>
                      <strong>Security Note:</strong> {formData.password?.trim() ? 'The custom password specified above will be securely hashed and set for this mentor.' : 'A secure temporary password will be automatically generated upon creation.'} Credentials will be displayed once you submit.
                    </div>
                  )}

                  {modalMode === 'edit' && formData.password?.trim() && (
                    <div style={{ padding: '0.75rem', background: 'rgba(242, 85, 34, 0.08)', border: '1px solid rgba(242, 85, 34, 0.25)', borderRadius: '6px', fontSize: '0.78rem', color: '#ff8a65', lineHeight: '1.4' }}>
                      <strong>Security Note:</strong> Submitting will reset this mentor&apos;s password to the value provided above and clear any login lockouts.
                    </div>
                  )}
                </>
              )}

              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} style={{ color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.gateBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>Commit Changes</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── ADMIN MODAL: CREATE / EDIT ASSESSMENT ─── */}
      {showAdminAsstModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdminAsstModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {adminAsstForm.id ? 'Modify Assessment' : 'Create Global Assessment'}
              </h3>
              <button className={styles.modalClose} onClick={() => setShowAdminAsstModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAdminAssessment}>
              <div className={styles.formScrollBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Course Cohort *</label>
                  <select
                    required
                    className={styles.formInput}
                    value={adminAsstForm.course_id}
                    onChange={(e) => setAdminAsstForm({ ...adminAsstForm, course_id: parseInt(e.target.value, 10) })}
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assessment Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="e.g. Full-Stack Systems & Diagnostic Assessment"
                    value={adminAsstForm.title}
                    onChange={(e) => setAdminAsstForm({ ...adminAsstForm, title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Comprehensive evaluation details..."
                    value={adminAsstForm.description}
                    onChange={(e) => setAdminAsstForm({ ...adminAsstForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      className={styles.formInput}
                      value={adminAsstForm.duration_minutes}
                      onChange={(e) => setAdminAsstForm({ ...adminAsstForm, duration_minutes: parseInt(e.target.value || 0, 10) })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Passing Marks</label>
                    <input
                      type="number"
                      required
                      className={styles.formInput}
                      value={adminAsstForm.passing_marks}
                      onChange={(e) => setAdminAsstForm({ ...adminAsstForm, passing_marks: parseInt(e.target.value || 0, 10) })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Max Attempts</label>
                    <input
                      type="number"
                      required
                      className={styles.formInput}
                      value={adminAsstForm.max_attempts}
                      onChange={(e) => setAdminAsstForm({ ...adminAsstForm, max_attempts: parseInt(e.target.value || 1, 10) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Publish Status</label>
                    <select
                      className={styles.formInput}
                      value={adminAsstForm.status}
                      onChange={(e) => setAdminAsstForm({ ...adminAsstForm, status: e.target.value })}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Proctoring Monitoring</label>
                    <select
                      className={styles.formInput}
                      value={adminAsstForm.proctoring_enabled ? 1 : 0}
                      onChange={(e) => setAdminAsstForm({ ...adminAsstForm, proctoring_enabled: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>Enabled</option>
                      <option value={0}>Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} style={{ color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setShowAdminAsstModal(false)}>Cancel</button>
                <button type="submit" className={styles.gateBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>Save Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADMIN MODAL: RESULTS & CSV EXPORT ─── */}
      {showAdminResultsModal && selectedAssessmentForResults && (
        <div className={styles.modalOverlay} onClick={() => setShowAdminResultsModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Results & Analytics: {selectedAssessmentForResults.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                  {selectedAssessmentForResults.course_title} • {adminAttempts.length} Total Submissions
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleExportCsv(selectedAssessmentForResults, adminAttempts)}
                  className={styles.gateBtn}
                  style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.78rem', background: '#10b981', borderColor: '#10b981' }}
                >
                  📥 Export CSV
                </button>
                <button className={styles.modalClose} onClick={() => setShowAdminResultsModal(false)}>✕</button>
              </div>
            </div>

            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Attempt</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Proctoring</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {adminAttempts.map((att) => (
                  <tr key={att.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>{att.student_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{att.student_email}</div>
                    </td>
                    <td>#{att.attempt_number}</td>
                    <td>
                      <strong style={{ color: att.passed ? '#34d399' : '#f87171' }}>
                        {att.total_score} ({att.percentage}%)
                      </strong>
                    </td>
                    <td>
                      <span className={styles.statusBadge} style={{ color: att.status === 'evaluated' ? '#34d399' : '#fbbf24' }}>
                        {att.status === 'evaluated' ? (att.passed ? 'PASSED' : 'FAILED') : 'EVALUATING'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: att.proctoring_flags > 0 ? '#fbbf24' : '#34d399' }}>
                        {att.proctoring_flags} Flags
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                      {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : 'In Progress'}
                    </td>
                  </tr>
                ))}
                {adminAttempts.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '2rem' }}>
                      No student submissions recorded for this assessment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ─── ADMIN MODAL: CALLBACK INSPECTION & EDIT ─── */}
      {selectedCallback && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCallback(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Inspect Callback #{selectedCallback.id}</h3>
              <button className={styles.modalClose} onClick={() => setSelectedCallback(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateCallback} className={styles.modalFormContainer}>
              <div className={styles.modalFormBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Student Name</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={selectedCallback.studentName || ''}
                      onChange={(e) => setSelectedCallback({ ...selectedCallback, studentName: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Phone Number</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={selectedCallback.phone || ''}
                      onChange={(e) => setSelectedCallback({ ...selectedCallback, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Email</label>
                    <input
                      type="email"
                      className={styles.modalInput}
                      value={selectedCallback.email || ''}
                      onChange={(e) => setSelectedCallback({ ...selectedCallback, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Preferred Slot</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={selectedCallback.preferredTime || ''}
                      onChange={(e) => setSelectedCallback({ ...selectedCallback, preferredTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Topic / Program Request</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={selectedCallback.topic || ''}
                    onChange={(e) => setSelectedCallback({ ...selectedCallback, topic: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Internal Notes / Student Questions</label>
                  <textarea
                    className={styles.modalTextarea}
                    rows={3}
                    value={selectedCallback.notes || ''}
                    onChange={(e) => setSelectedCallback({ ...selectedCallback, notes: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Callback Status</label>
                  <select
                    className={styles.modalSelect}
                    value={selectedCallback.status || 'Pending'}
                    onChange={(e) => setSelectedCallback({ ...selectedCallback, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} style={{ color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setSelectedCallback(null)}>Cancel</button>
                <button type="submit" disabled={isProcessingAction} className={styles.gateBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                  {isProcessingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADMIN MODAL: CONTACT INQUIRY INSPECTION ─── */}
      {selectedInquiry && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInquiry(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Inquiry #{selectedInquiry.id}</h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                  From {selectedInquiry.name} • {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : 'Recent'}
                </span>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedInquiry(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateInquiry} className={styles.modalFormContainer}>
              <div className={styles.modalFormBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Email:</span>
                    <div><a href={`mailto:${selectedInquiry.email}`} style={{ color: 'var(--accent-orange)', fontSize: '0.85rem' }}>{selectedInquiry.email}</a></div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Phone:</span>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>{selectedInquiry.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Department:</span>
                    <div style={{ fontSize: '0.85rem', color: '#3498db', fontWeight: '600' }}>{selectedInquiry.department}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Subject:</span>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>{selectedInquiry.subject || 'General'}</div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Message Content</label>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.9rem', color: '#ffffff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedInquiry.message}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Status</label>
                  <select
                    className={styles.modalSelect}
                    value={selectedInquiry.status || 'new'}
                    onChange={(e) => setSelectedInquiry({ ...selectedInquiry, status: e.target.value })}
                  >
                    <option value="new">New (Unread)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Internal Admin Notes</label>
                  <textarea
                    className={styles.modalTextarea}
                    rows={3}
                    placeholder="Add team notes on resolution, reply sent, or follow-up tasks..."
                    value={selectedInquiry.adminNotes || ''}
                    onChange={(e) => setSelectedInquiry({ ...selectedInquiry, adminNotes: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} style={{ color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setSelectedInquiry(null)}>Cancel</button>
                <button type="submit" disabled={isProcessingAction} className={styles.gateBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                  {isProcessingAction ? 'Saving...' : 'Update Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADMIN MODAL: FACULTY APPLICATION DOSSIER ─── */}
      {selectedFaculty && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFaculty(null)}>
          <div className={styles.modalContent} style={{ maxWidth: '720px', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Faculty Dossier: {selectedFaculty.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                  Applied For: <strong style={{ color: 'var(--accent-orange)' }}>{selectedFaculty.roleApplied}</strong> • {selectedFaculty.experienceYears} Exp
                </span>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedFaculty(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateFaculty} className={styles.modalFormContainer}>
              <div className={styles.modalFormBody}>
                {/* Candidate Overview Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Email:</span>
                    <div><a href={`mailto:${selectedFaculty.email}`} style={{ color: 'var(--accent-orange)', fontSize: '0.85rem' }}>{selectedFaculty.email}</a></div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Phone / WhatsApp:</span>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>{selectedFaculty.phone}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Current Company:</span>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>{selectedFaculty.currentCompany || 'Independent / Stealth'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Availability:</span>
                    <div style={{ fontSize: '0.85rem', color: '#2ecc71' }}>{selectedFaculty.availability || 'Flexible'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Verified Profiles:</span>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                      {selectedFaculty.linkedin && (
                        <a href={selectedFaculty.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', fontSize: '0.82rem', textDecoration: 'underline' }}>
                          ↗ LinkedIn Profile
                        </a>
                      )}
                      {selectedFaculty.github && (
                        <a href={selectedFaculty.github} target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', fontSize: '0.82rem', textDecoration: 'underline' }}>
                          ↗ GitHub / Tech Blog
                        </a>
                      )}
                      {selectedFaculty.portfolio && (
                        <a href={selectedFaculty.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-orange)', fontSize: '0.82rem', textDecoration: 'underline' }}>
                          ↗ Portfolio Site
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Primary Domain & Technical Stack</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={selectedFaculty.expertise || ''}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, expertise: e.target.value })}
                  />
                </div>

                {selectedFaculty.bio && (
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Professional Bio & Career Highlights</label>
                    <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.88rem', color: '#ffffff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedFaculty.bio}
                    </div>
                  </div>
                )}

                {selectedFaculty.courseProposal && (
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Proposed Masterclass / Workshop Topic</label>
                    <div style={{ padding: '0.85rem', background: 'rgba(242, 85, 34, 0.05)', border: '1px solid rgba(242, 85, 34, 0.2)', borderRadius: '8px', fontSize: '0.88rem', color: '#ffffff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedFaculty.courseProposal}
                    </div>
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Application Status</label>
                    <select
                      className={styles.modalSelect}
                      value={selectedFaculty.status || 'pending'}
                      onChange={(e) => setSelectedFaculty({ ...selectedFaculty, status: e.target.value })}
                    >
                      <option value="pending">Pending Review</option>
                      <option value="under_review">Under Academic Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.modalLabel}>Teaching Track</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={selectedFaculty.roleApplied || ''}
                      onChange={(e) => setSelectedFaculty({ ...selectedFaculty, roleApplied: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.modalLabel}>Internal Admin Notes & Interview Notes</label>
                  <textarea
                    className={styles.modalTextarea}
                    rows={3}
                    placeholder="Log academic board feedback, interview notes, or remuneration terms..."
                    value={selectedFaculty.adminNotes || ''}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, adminNotes: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter} style={{ justifyContent: 'space-between' }}>
                <div>
                  {selectedFaculty.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => handleApproveFaculty(selectedFaculty.id)}
                      className={styles.approveBtn}
                      style={{ padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      ✓ Approve & Onboard as Mentor
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className={styles.actionBtn} style={{ color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setSelectedFaculty(null)}>Cancel</button>
                  <button type="submit" disabled={isProcessingAction} className={styles.gateBtn} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                    {isProcessingAction ? 'Saving...' : 'Save Dossier'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
