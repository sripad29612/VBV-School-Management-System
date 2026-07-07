import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Modal, Dimensions, useWindowDimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { toggleTheme } from '../store/themeSlice';
import { logout } from '../store/authSlice';
import { colors } from '../theme/colors';
import api, { API_URL } from '../services/api';
import {
  setStudentDashboard, setStudentTimetable, setStudentHomework, setStudentStudyMaterials,
  setStudentResults, setStudentFees, setStudentDigitalId, setStudentAttendance, setParentDashboard, setSelectedChildId,
  setChildSnapshots, setChildAttendance, setChildHomework, setChildResults, setChildFees,
  setTeacherDashboard, setTeacherClassStudents, setTeacherReports, setPrincipalDashboard,
  setPrincipalSnapshotsMonitor, setPrincipalStudents, setPrincipalTeachers, setPrincipalClasses
} from '../store/dashboardSlice';
import { Card } from '../components/Card';
import { IDCard } from '../components/IDCard';
import { BarChart, PieChart, ProgressRing } from '../components/AnalyticsCharts';
import { SchoolBuilding } from '../components/SchoolBuilding';
import { 
  LogOut, Sun, Moon, Calendar as CalIcon, Image as ImageIcon, Send, Plus, Check, Save, 
  ShieldAlert, Award, FileText, Database, Settings, BookOpen, Layers, PhoneCall, GraduationCap,
  Users, UserCheck, Search, Trash2, Edit3, MessageCircle, Bell, ArrowLeft, Heart, BarChart2, Home,
  Calendar, User, ArrowRight, X, DollarSign
} from 'lucide-react-native';

// Student sub-screens
import { StudentDashboard } from './student/StudentDashboard';
import { AttendanceScreen } from './student/AttendanceScreen';
import { HomeworkScreen } from './student/HomeworkScreen';
import { ResultsScreen } from './student/ResultsScreen';
import { StudyMaterialsScreen } from './student/StudyMaterialsScreen';
import { TimetableScreen } from './student/TimetableScreen';
import { DigitalIDScreen } from './student/DigitalIDScreen';
import { NotificationsScreen } from './student/NotificationsScreen';
import { AcademicsScreen } from './student/AcademicsScreen';

// Parent sub-screens
import { ParentDashboard } from './parent/ParentDashboard';
import { MyChildScreen } from './parent/MyChildScreen';
import { ParentAttendanceScreen } from './parent/ParentAttendanceScreen';
import { ParentHomeworkScreen } from './parent/ParentHomeworkScreen';
import { ParentResultsScreen } from './parent/ParentResultsScreen';
import { ParentFeesScreen } from './parent/ParentFeesScreen';
import { ParentTransportScreen } from './parent/ParentTransportScreen';
import { ParentTeachersScreen } from './parent/ParentTeachersScreen';
import { LiveClassroomScreen } from './parent/LiveClassroomScreen';
import { ParentCalendarScreen } from './parent/ParentCalendarScreen';
import { ParentNotificationsScreen } from './parent/ParentNotificationsScreen';
import { ParentProfileScreen } from './parent/ParentProfileScreen';
import { ParentChatScreen } from './parent/ParentChatScreen';

// Teacher sub-screens
import { TeacherDashboard } from './teacher/TeacherDashboard';
import { TeacherAttendanceScreen } from './teacher/TeacherAttendanceScreen';
import { TeacherHomeworkScreen } from './teacher/TeacherHomeworkScreen';
import { TeacherMarksScreen } from './teacher/TeacherMarksScreen';
import { TeacherDailyReportScreen } from './teacher/TeacherDailyReportScreen';
import { TeacherStudentsScreen } from './teacher/TeacherStudentsScreen';
import { TeacherPerformanceScreen } from './teacher/TeacherPerformanceScreen';
import { TeacherAnnouncementsScreen } from './teacher/TeacherAnnouncementsScreen';
import { TeacherParentCommScreen } from './teacher/TeacherParentCommScreen';
import { TeacherAIToolsScreen } from './teacher/TeacherAIToolsScreen';
import { TeacherTimetableScreen } from './teacher/TeacherTimetableScreen';
import { TeacherProfileScreen } from './teacher/TeacherProfileScreen';
import { reportService } from '../services/reportService';

// Principal sub-screens
import { PrincipalDashboard } from './principal/PrincipalDashboard';
import { PrincipalTeacherAssignment } from './principal/PrincipalTeacherAssignment';
import { PrincipalClassManagement } from './principal/PrincipalClassManagement';
import { PrincipalLessonReports } from './principal/PrincipalLessonReports';
import { PrincipalReports } from './principal/PrincipalReports';
import { PrincipalAnnouncements } from './principal/PrincipalAnnouncements';
import { PrincipalCalendar } from './principal/PrincipalCalendar';
import { PrincipalTimetable } from './principal/PrincipalTimetable';
import { PrincipalSubstituteManagement } from './principal/PrincipalSubstituteManagement';

// Admin sub-screens
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminAdmissions } from './admin/AdminAdmissions';
import { AdminTeachers } from './admin/AdminTeachers';
import { AdminFees } from './admin/AdminFees';
import { AdminProfile } from './admin/AdminProfile';
import { AdminReports } from './admin/AdminReports';
import { AdminTransport } from './admin/AdminTransport';
import { AdminExpenses } from './admin/AdminExpenses';

import { PrincipalExams } from './principal/PrincipalExams';
import { StudentExams } from './student/StudentExams';
import { ParentExamsScreen } from './parent/ParentExamsScreen';
import { TeacherExamsScreen } from './teacher/TeacherExamsScreen';

export const DashboardScreen = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const dispatch = useDispatch();
  const { user, role } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  // Global loading
  const [loading, setLoading] = useState(true);

  // Sub Tab Navigation States (matching the Phase 3 Storyboards)
  const [studentTab, setStudentTab] = useState<string>('dashboard');
  const [parentTab, setParentTab] = useState<string>('dashboard');
  const [teacherTab, setTeacherTab] = useState<string>('dashboard');
  const [principalTab, setPrincipalTab] = useState<string>('dashboard');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<any | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [prefilledClassForReport, setPrefilledClassForReport] = useState<string>('');
  const [searchSelectionStudentId, setSearchSelectionStudentId] = useState<string | null>(null);
  const [openReceiptOnLoad, setOpenReceiptOnLoad] = useState<boolean>(false);
  const [adminRefreshTrigger, setAdminRefreshTrigger] = useState<number>(0);
  const [hasInitialLoaded, setHasInitialLoaded] = useState<boolean>(false);

  const getActiveTab = () => {
    if (role === 'student') return studentTab;
    if (role === 'parent') return parentTab;
    if (role === 'teacher') return teacherTab;
    if (role === 'principal') return principalTab;
    if (role === 'admin') return adminTab;
    return 'dashboard';
  };

  const resetActiveTab = () => {
    if (role === 'student') setStudentTab('dashboard');
    if (role === 'parent') setParentTab('dashboard');
    if (role === 'teacher') setTeacherTab('dashboard');
    if (role === 'principal') setPrincipalTab('dashboard');
    if (role === 'admin') setAdminTab('dashboard');
  };

  const getUserName = () => {
    if (!user) return 'User';
    if (role === 'admin') return 'Ramanujam Acharya';
    if (role === 'principal') return 'Principal Desk';
    if (user.name) return user.name;
    if (user.fatherName) return user.fatherName;
    if (role === 'student' && sData?.dashboard?.student?.name) return sData.dashboard.student.name;
    if (role === 'parent' && pData?.dashboard?.parent?.fatherName) return pData.dashboard.parent.fatherName;
    if (role === 'teacher' && tData?.dashboard?.name) return tData.dashboard.name;
    return user.username || user.rollNumber || user.teacherId || user.phone || 'User';
  };

  // Redux Dashboard collections
  const sData = useSelector((state: RootState) => state.dashboard.studentData);
  const pData = useSelector((state: RootState) => state.dashboard.parentData);
  const tData = useSelector((state: RootState) => state.dashboard.teacherData);
  const prData = useSelector((state: RootState) => state.dashboard.principalData);

  // Sub-modules variables
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: 'Present' | 'Absent' | 'Late' }>({});
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Completed'>('All');
  const [timetableFilter, setTimetableFilter] = useState<'Daily' | 'Weekly'>('Daily');
  const [childTimetable, setChildTimetable] = useState<any[]>([]);
  const [examTermFilter, setExamTermFilter] = useState<'Quarterly' | 'Half-Yearly' | 'Annual'>('Quarterly');

  // Messaging state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatContacts, setChatContacts] = useState<any[]>([]);
  const [activeTeacherContactId, setActiveTeacherContactId] = useState<string | null>(null);

  // CRUD Forms State
  const [searchQuery, setSearchQuery] = useState('');
  const [addStudentForm, setAddStudentForm] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '', rollNumber: '', admissionNumber: '', dob: '', bloodGroup: 'B+', emergencyContact: '', parentPhone: '', fatherName: '', motherName: ''
  });

  const getTodayTeacherStats = () => {
    if (prData?.dashboard?.teacherStats) {
      return prData.dashboard.teacherStats;
    }
    return { present: 0, late: 0, leave: 0, absent: 0, teacherStatuses: {} };
  };

  // Homework upload state
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwSubjectId, setHwSubjectId] = useState('');

  // Marks upload state
  const [marksStudentId, setMarksStudentId] = useState('');
  const [marksSubjectId, setMarksSubjectId] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [marksExamType, setMarksExamType] = useState<'Quarterly' | 'Half-Yearly' | 'Annual'>('Quarterly');

  // Broadcast Notification state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [noticeRecipient, setNoticeRecipient] = useState<'all' | 'student' | 'parent' | 'teacher'>('all');

  const loadDashboardData = async () => {
    if (!hasInitialLoaded) {
      setLoading(true);
    }
    try {
      if (role === 'student') {
        const [dashRes, timeRes, hwRes, matRes, resRes, feeRes, idRes, attRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/timetable'),
          api.get('/student/homework'),
          api.get('/student/study-materials'),
          api.get('/student/results'),
          api.get('/student/fees'),
          api.get('/student/digital-id'),
          api.get('/student/attendance')
        ]);
        dispatch(setStudentDashboard(dashRes.data));
        dispatch(setStudentTimetable(timeRes.data));
        dispatch(setStudentHomework(hwRes.data));
        dispatch(setStudentStudyMaterials(matRes.data));
        dispatch(setStudentResults(resRes.data));
        dispatch(setStudentFees(feeRes.data));
        dispatch(setStudentDigitalId(idRes.data));
        dispatch(setStudentAttendance(attRes.data));
      } else if (role === 'parent') {
        const dashRes = await api.get('/parent/dashboard');
        dispatch(setParentDashboard(dashRes.data));
        
        const initialChildId = dashRes.data.children?.[0]?._id;
        if (initialChildId) {
          loadChildDetails(initialChildId);
        }
      } else if (role === 'teacher') {
        const dashRes = await api.get('/teacher/dashboard');
        dispatch(setTeacherDashboard(dashRes.data));
 
        if (dashRes.data.assignedClassId) {
          const [studRes, repRes] = await Promise.all([
            api.get(`/teacher/class/${dashRes.data.assignedClassId}/students`),
            api.get(`/teacher/class/${dashRes.data.assignedClassId}/reports`)
          ]);
          dispatch(setTeacherClassStudents(studRes.data));
          dispatch(setTeacherReports(repRes.data));
 
          const initialAtt: any = {};
          studRes.data.forEach((s: any) => {
            initialAtt[s._id] = 'Present';
          });
          setAttendanceRecords(initialAtt);
        }
      } else if (role === 'principal') {
        const [dashRes, snapRes, stdRes, tchRes] = await Promise.all([
          api.get('/principal/dashboard'),
          api.get('/principal/snapshots/monitor'),
          api.get('/principal/students').catch(() => ({ data: [] })),
          api.get('/principal/teachers').catch(() => ({ data: [] }))
        ]);
        dispatch(setPrincipalDashboard(dashRes.data));
        dispatch(setPrincipalSnapshotsMonitor(snapRes.data));
        dispatch(setPrincipalStudents(stdRes.data));
        dispatch(setPrincipalTeachers(tchRes.data));
        if (dashRes.data && dashRes.data.classes) {
          dispatch(setPrincipalClasses(dashRes.data.classes));
        }
      } else if (role === 'admin') {
        setAdminRefreshTrigger(prev => prev + 1);
      }
      setHasInitialLoaded(true);
    } catch (err) {
      console.error('Error fetching dashboard content:', err);
    } finally {
      setLoading(false);
    }
  };
 
  const loadChildDetails = async (childId: string) => {
    try {
      const [snapRes, attRes, hwRes, resRes, feeRes] = await Promise.all([
        api.get(`/parent/child/${childId}/snapshots`),
        api.get(`/parent/child/${childId}/attendance`),
        api.get(`/parent/child/${childId}/homework`),
        api.get(`/parent/child/${childId}/results`),
        api.get(`/parent/child/${childId}/fees`)
      ]);
      dispatch(setChildSnapshots(snapRes.data));
      dispatch(setChildAttendance(attRes.data));
      dispatch(setChildHomework(hwRes.data));
      dispatch(setChildResults(resRes.data));
      dispatch(setChildFees(feeRes.data));
 
      // Fetch teacher contacts for chat setup
      const contactRes = await api.get('/chat/contacts');
      setChatContacts(contactRes.data || []);
      if (contactRes.data.length > 0) {
        setActiveTeacherContactId(contactRes.data[0]._id);
        const msgRes = await api.get(`/chat/history/${contactRes.data[0]._id}`);
        setChatHistory(msgRes.data);
      } else {
        setActiveTeacherContactId(null);
        setChatHistory([]);
      }
    } catch (err) {
      console.error('Failed to load child specific details:', err);
    }
  };
 
  useEffect(() => {
    setHasInitialLoaded(false);
    loadDashboardData();
  }, [role]);



  const handleGlobalSearch = async (query: string) => {
    setGlobalQuery(query);
    if (query.trim().length > 1) {
      try {
        const res = await api.get(`/admin/search?q=${query}`);
        setGlobalResults(res.data);
        setShowSearchResults(true);
      } catch (e) {
        console.error('Global search error:', e);
      }
    } else {
      setGlobalResults(null);
      setShowSearchResults(false);
    }
  };

  // Actions
  const handleChildSelect = (childId: string) => {
    dispatch(setSelectedChildId(childId));
    loadChildDetails(childId);
  };

  // Submit Attendance (Teacher)
  const handleSubmitAttendance = async () => {
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await api.post('/teacher/attendance', {
        classId: tData.dashboard?.assignedClassId,
        date: new Date(),
        records
      });

      alert('Attendance saved successfully!');
      setTeacherTab('dashboard');
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit attendance');
    }
  };

  // Upload Homework (Teacher)
  const handleUploadHomework = async () => {
    if (!hwTitle || !hwDesc || !hwDueDate || !hwSubjectId) {
      return alert('Please fill in all homework details');
    }

    try {
      await api.post('/teacher/homework', {
        classId: tData.dashboard?.assignedClassId,
        subjectId: hwSubjectId,
        title: hwTitle,
        description: hwDesc,
        dueDate: new Date(hwDueDate)
      });
      alert('Homework assigned successfully!');
      setHwTitle('');
      setHwDesc('');
      setHwDueDate('');
      setTeacherTab('dashboard');
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload homework');
    }
  };

  // Upload Marks (Teacher)
  const handleUploadMarks = async () => {
    if (!marksStudentId || !marksSubjectId || !marksObtained) {
      return alert('Please fill in all grade fields');
    }

    try {
      await api.post('/teacher/marks', {
        studentId: marksStudentId,
        classId: tData.dashboard?.assignedClassId,
        examType: marksExamType,
        marks: [{
          subjectId: marksSubjectId,
          marksObtained: Number(marksObtained),
          maxMarks: 100
        }]
      });
      alert('Student grades uploaded successfully!');
      setMarksObtained('');
      setTeacherTab('dashboard');
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload marks');
    }
  };

  // Send Message (Parent)
  const handleSendMessage = async () => {
    if (!chatMessage || !activeTeacherContactId) return;

    try {
      const response = await api.post('/chat/send', {
        receiverId: activeTeacherContactId,
        message: chatMessage
      });
      setChatHistory([...chatHistory, response.data]);
      setChatMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Toggle Camera (Teacher)
  const handleCameraToggle = async (enable: boolean) => {
    try {
      await api.post('/teacher/snapshots/toggle', { enabled: enable });
      alert(`Camera ${enable ? 'enabled' : 'disabled'} successfully!`);
      loadDashboardData();
    } catch (err) {
      alert(`Camera ${enable ? 'enable' : 'disable'} operation failed.`);
    }
  };

  // Trigger manual classroom snapshot (Principal/Teacher)
  const handleManualSnapshotTrigger = async () => {
    try {
      const response = await api.post('/snapshots/trigger');
      alert(`Manual snapshot triggered! Captured ${response.data.count} classrooms.`);
      loadDashboardData();
    } catch (err) {
      alert('Outside school hours (8 AM - 4 PM) or snapshot failed.');
    }
  };

  // Add Student (Principal CRUD)
  const handleAddStudentSubmit = async () => {
    if (!newStudent.name || !newStudent.rollNumber || !newStudent.admissionNumber || !newStudent.dob || !newStudent.parentPhone) {
      return alert('Please fill required Student and Parent fields.');
    }

    try {
      // Find a default class ID (e.g., Nursery)
      const classesRes = await api.get('/principal/dashboard');
      const classId = classesRes.data.charts.studentStrength[0]?.classId || 'Nursery'; // dummy class check

      await api.post('/principal/student', {
        ...newStudent,
        classId: 'Class I' // defaults
      });

      alert('Student added successfully!');
      setAddStudentForm(false);
      setNewStudent({
        name: '', rollNumber: '', admissionNumber: '', dob: '', bloodGroup: 'B+', emergencyContact: '', parentPhone: '', fatherName: '', motherName: ''
      });
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add student');
    }
  };

  // Broadcast Alert (Principal)
  const handleBroadcastNotice = async () => {
    if (!noticeTitle || !noticeMsg) {
      return alert('Notice title and message are required');
    }

    try {
      await api.post('/principal/notification', {
        title: noticeTitle,
        message: noticeMsg,
        recipientRole: noticeRecipient
      });
      alert('Notice broadcasted successfully!');
      setNoticeTitle('');
      setNoticeMsg('');
      loadDashboardData();
    } catch (err) {
      alert('Failed to broadcast notice');
    }
  };

  // Backup Database (Principal)
  const handleBackupDB = async () => {
    try {
      const response = await api.post('/principal/system/backup');
      alert(`Backup created successfully! saved database details.`);
    } catch (err) {
      alert('Failed to compile database backup');
    }
  };

  // Principal Reports Review View
  const PrincipalReportsReview = () => {
    const [reportsList, setReportsList] = useState<any[]>([]);
    const [fetchingReports, setFetchingReports] = useState(false);

    const loadReportsList = async () => {
      setFetchingReports(true);
      try {
        const data = await reportService.fetchReports();
        // Skip local drafts for Principal view
        const visible = data.filter((r: any) => r.status !== 'Draft');
        setReportsList(visible.reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingReports(false);
      }
    };

    useEffect(() => {
      loadReportsList();
    }, []);

    const handleUpdateStatus = async (reportId: string, newStatus: 'Reviewed' | 'Approved') => {
      try {
        await reportService.updateStatus(reportId, newStatus);
        alert(`Report successfully marked as ${newStatus}!`);
        loadReportsList();
      } catch (err) {
        alert('Failed to update status');
      }
    };

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 80 }}>
        <View style={styles.subScreenHeader}>
          <Pressable onPress={() => setPrincipalTab('dashboard')} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#5C54E5" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Daily Reports Review</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Review and approve teacher daily logs</Text>
          </View>
        </View>

        {fetchingReports ? (
          <ActivityIndicator size="small" color="#5C54E5" style={{ marginTop: 20 }} />
        ) : reportsList.length > 0 ? (
          reportsList.map((rep: any) => (
            <Card key={rep._id} style={{ padding: 16, marginVertical: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{rep.teacherName}</Text>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: rep.status === 'Submitted' ? '#FFE8D6' 
                      : rep.status === 'Reviewed' ? '#E0F2FE' : '#D1E7DD',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6
                  }
                ]}>
                  <Text style={{ 
                    fontSize: 8, 
                    fontWeight: '800', 
                    color: rep.status === 'Submitted' ? '#D97706' 
                      : rep.status === 'Reviewed' ? '#0284C7' : '#0F5132',
                    textTransform: 'uppercase'
                  }}>{rep.status}</Text>
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>
                  Class: {rep.className} | Subject: {rep.subject}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
                  Topic: {rep.chapter} - {rep.topicCovered}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
                  Date: {rep.date} | Submitted: {rep.submissionTime}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
                  Completion Status: {rep.completionStatus}
                </Text>
                {rep.notes ? (
                  <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                    Notes: {rep.notes}
                  </Text>
                ) : null}
              </View>

              {rep.status === 'Submitted' && (
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' }}>
                  <Pressable 
                    onPress={() => handleUpdateStatus(rep._id, 'Reviewed')}
                    style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}
                  >
                    <Text style={{ color: '#0284C7', fontSize: 10, fontWeight: '800' }}>Mark Reviewed</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => handleUpdateStatus(rep._id, 'Approved')}
                    style={{ backgroundColor: '#D1E7DD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#0F5132', fontSize: 10, fontWeight: '800' }}>Approve Report</Text>
                  </Pressable>
                </View>
              )}

              {rep.status === 'Reviewed' && (
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' }}>
                  <Pressable 
                    onPress={() => handleUpdateStatus(rep._id, 'Approved')}
                    style={{ backgroundColor: '#D1E7DD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#0F5132', fontSize: 10, fontWeight: '800' }}>Approve Report</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          ))
        ) : (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>No teaching reports submitted for review.</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Syncing VBV Portal...</Text>
      </View>
    );
  }

  const isDesktop = windowWidth > 500;

  if (role === 'teacher') {
    return (
      <View style={isDesktop ? {
        flex: 1,
        backgroundColor: '#08152F',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20
      } : { flex: 1 }}>
        <View style={isDesktop ? {
          width: 380,
          height: windowHeight * 0.95,
          backgroundColor: theme.background,
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.border
        } : { flex: 1, backgroundColor: theme.background }}>
          
          {/* Mobile Header (Fixed) */}
          <View style={[
            styles.appBarHeader, 
            { 
              backgroundColor: '#198754',
              borderBottomWidth: 1,
              borderColor: theme.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 10,
              height: 56
            }
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image source={require('../../assets/logo.jpg')} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff' }} />
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff' }}>VBV PORTAL</Text>
                <Text style={{ fontSize: 9, color: '#D1E7DD', fontWeight: '800' }}>{tData?.dashboard?.name || 'Teacher'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={() => dispatch(toggleTheme())} style={{ padding: 4 }}>
                <Text style={{ fontSize: 14 }}>{isDarkMode ? '🌙' : '☀️'}</Text>
              </Pressable>
              <Pressable onPress={() => dispatch(logout())} style={{ padding: 4 }}>
                <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 }}>LOGOUT</Text>
              </Pressable>
            </View>
          </View>

          {/* Scrolling Mobile Frame Body */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 12, paddingTop: 12 }}
          >
            {teacherTab === 'dashboard' && tData.dashboard && (
              <TeacherDashboard 
                data={tData.dashboard} 
                onNavigate={(tab) => setTeacherTab(tab)} 
              />
            )}
            {teacherTab === 'attendance' && (
              <TeacherAttendanceScreen 
                onBack={() => setTeacherTab('dashboard')} 
                onRefreshData={loadDashboardData}
              />
            )}
            {teacherTab === 'homework' && (
              <TeacherHomeworkScreen 
                onBack={() => setTeacherTab('dashboard')} 
                onRefreshData={loadDashboardData}
              />
            )}
            {teacherTab === 'marks' && (
              <TeacherMarksScreen 
                onBack={() => setTeacherTab('dashboard')} 
                onRefreshData={loadDashboardData}
              />
            )}
            {teacherTab === 'daily-report' && (
              <TeacherDailyReportScreen 
                onBack={() => {
                  setTeacherTab('dashboard');
                  setPrefilledClassForReport('');
                }} 
                onRefreshData={loadDashboardData}
                initialClass={prefilledClassForReport}
              />
            )}
            {teacherTab === 'timetable' && (
              <TeacherTimetableScreen 
                onBack={() => setTeacherTab('dashboard')} 
                onNavigateToTab={(tab, prefill) => {
                  if (prefill) setPrefilledClassForReport(prefill);
                  setTeacherTab(tab);
                }}
              />
            )}
            {teacherTab === 'students' && (
              <TeacherStudentsScreen 
                onBack={() => setTeacherTab('dashboard')} 
              />
            )}
            {teacherTab === 'messages' && (
              <TeacherParentCommScreen 
                onBack={() => setTeacherTab('dashboard')} 
              />
            )}
            {teacherTab === 'profile' && (
              <TeacherProfileScreen 
                onBack={() => setTeacherTab('dashboard')} 
              />
            )}
            {teacherTab === 'exams' && (
              <TeacherExamsScreen />
            )}
          </ScrollView>

          {/* Bottom Fixed Navigation Bar */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 5
          }}>
            <Pressable onPress={() => setTeacherTab('dashboard')} style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <BookOpen size={20} color={teacherTab === 'dashboard' ? '#198754' : theme.textSecondary} />
              <Text style={{ fontSize: 9, fontWeight: '800', marginTop: 4, color: teacherTab === 'dashboard' ? '#198754' : theme.textSecondary }}>Home</Text>
            </Pressable>
            <Pressable onPress={() => setTeacherTab('attendance')} style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <UserCheck size={20} color={teacherTab === 'attendance' ? '#198754' : theme.textSecondary} />
              <Text style={{ fontSize: 9, fontWeight: '800', marginTop: 4, color: teacherTab === 'attendance' ? '#198754' : theme.textSecondary }}>Attendance</Text>
            </Pressable>
            <Pressable onPress={() => setTeacherTab('students')} style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Users size={20} color={teacherTab === 'students' ? '#198754' : theme.textSecondary} />
              <Text style={{ fontSize: 9, fontWeight: '800', marginTop: 4, color: teacherTab === 'students' ? '#198754' : theme.textSecondary }}>Students</Text>
            </Pressable>
            <Pressable onPress={() => setTeacherTab('messages')} style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <MessageCircle size={20} color={teacherTab === 'messages' ? '#198754' : theme.textSecondary} />
              <Text style={{ fontSize: 9, fontWeight: '800', marginTop: 4, color: teacherTab === 'messages' ? '#198754' : theme.textSecondary }}>Messages</Text>
            </Pressable>
            <Pressable onPress={() => setTeacherTab('profile')} style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <User size={20} color={teacherTab === 'profile' ? '#198754' : theme.textSecondary} />
              <Text style={{ fontSize: 9, fontWeight: '800', marginTop: 4, color: teacherTab === 'profile' ? '#198754' : theme.textSecondary }}>Profile</Text>
            </Pressable>
          </View>

        </View>
      </View>
    );
  }

  const content = (
    <View style={[styles.mainLayout, { backgroundColor: theme.background }]}>
      
      {/* ================= HEADER WRAPPER ================= */}
      <View style={[
        styles.appBarHeader, 
        { 
          backgroundColor: role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : ((role as any) === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1'))),
          borderBottomWidth: 0,
          flexDirection: 'column',
          alignItems: 'stretch'
        }
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <View style={styles.appBarInfo}>
            <Image source={require('../../assets/logo.jpg')} style={[styles.appBarLogo, { borderColor: '#ffffff', borderWidth: 1.5 }] as any} />
            <View>
              <Text style={[styles.appBarTitle, { color: '#ffffff', fontWeight: '900' }]}>VIDYA BHARATHI VIDYAPEETH</Text>
              <Text style={[styles.appBarSubtitle, { color: '#FFD8A8', fontSize: 11, fontWeight: '800' }]}>
                {role === 'student' ? 'Student Portal Dashboard' : (role === 'parent' ? 'Parent Portal Dashboard' : ((role as any) === 'teacher' ? 'Teacher Portal Control Desk' : (role === 'principal' ? 'Principal Control Desk' : 'Administrator Control Panel')))}
              </Text>
            </View>
          </View>

          {/* Navigation & Profile Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            
            {/* Back Button */}
            {getActiveTab() !== 'dashboard' && (
              <Pressable onPress={resetActiveTab} style={styles.headerNavBtn}>
                <ArrowLeft size={14} color="#ffffff" />
                <Text style={styles.headerNavBtnText}>Back</Text>
              </Pressable>
            )}

            {/* Dashboard / Home Button */}
            {getActiveTab() !== 'dashboard' && (
              <Pressable onPress={resetActiveTab} style={styles.headerNavBtn}>
                <Home size={14} color="#ffffff" />
                <Text style={styles.headerNavBtnText}>Home</Text>
              </Pressable>
            )}

            {/* Profile Widget */}
            <View style={styles.headerProfile}>
              <View style={styles.headerAvatarCircle}>
                <User size={12} color="#050C2D" />
              </View>
              <Text style={styles.headerProfileName}>{getUserName()}</Text>
            </View>
            
            {/* Theme Toggle */}
            <Pressable onPress={() => dispatch(toggleTheme())} style={styles.actionBtnThemed}>
              {isDarkMode ? <Sun size={18} color="#FFC107" /> : <Moon size={18} color="#ffffff" />}
            </Pressable>

            {/* Logout Button */}
            <Pressable onPress={() => dispatch(logout())} style={[styles.actionBtnThemed, styles.logoutBtnThemed]}>
              <LogOut size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {role === 'admin' && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'rgba(255,255,255,0.18)', 
            borderRadius: 10, 
            marginTop: 8, 
            paddingHorizontal: 10,
            height: 34
          }}>
            <Search size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <TextInput
              style={{ flex: 1, fontSize: 11, color: '#ffffff', padding: 0 }}
              placeholder="Search students, teachers, receipts..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={globalQuery}
              onChangeText={handleGlobalSearch}
            />
          </View>
        )}
      </View>

      {/* Global Search Results Overlay Card */}
      {showSearchResults && globalResults && (
        <View style={{
          position: 'absolute',
          top: 135,
          left: 16,
          right: 16,
          bottom: 20,
          backgroundColor: theme.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.border,
          padding: 16,
          zIndex: 1000,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>Universal Search Results</Text>
            <Pressable onPress={() => { setShowSearchResults(false); setGlobalQuery(''); }}>
              <X size={18} color={theme.text} />
            </Pressable>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginVertical: 6 }}>
            {/* Students Matches */}
            <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' }}>Students found ({globalResults.students?.length || 0})</Text>
            {globalResults.students && globalResults.students.length > 0 ? (
              globalResults.students.map((s: any) => (
                <Pressable 
                  key={s._id}
                  style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}
                  onPress={() => {
                    setSearchSelectionStudentId(s._id);
                    setShowSearchResults(false);
                    setGlobalQuery('');
                    setAdminTab('admissions');
                  }}
                >
                  <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{s.name} ({s.rollNumber || 'PENDING'})</Text>
                  <Text style={{ fontSize: 8, color: theme.textSecondary }}>Class: {s.class?.name || 'N/A'} | Adm No: {s.admissionNumber || 'PENDING'}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ fontSize: 9, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 8 }}>No student match.</Text>
            )}

            {/* Teachers Matches */}
            <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '800', marginVertical: 6, textTransform: 'uppercase' }}>Teachers found ({globalResults.teachers?.length || 0})</Text>
            {globalResults.teachers && globalResults.teachers.length > 0 ? (
              globalResults.teachers.map((t: any) => (
                <Pressable 
                  key={t._id}
                  style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}
                  onPress={() => {
                    setShowSearchResults(false);
                    setGlobalQuery('');
                    setAdminTab('teachers');
                  }}
                >
                  <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{t.name} ({t.teacherId})</Text>
                  <Text style={{ fontSize: 8, color: theme.textSecondary }}>Email: {t.email} | Status: {t.status}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ fontSize: 9, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 8 }}>No teacher match.</Text>
            )}

            {/* Fee Collections Matches */}
            <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '800', marginVertical: 6, textTransform: 'uppercase' }}>Receipt Matches ({globalResults.fees?.length || 0})</Text>
            {globalResults.fees && globalResults.fees.length > 0 ? (
              globalResults.fees.map((f: any) => (
                f.payments && f.payments.map((p: any) => (
                  <Pressable 
                    key={p._id}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}
                    onPress={() => {
                      setShowSearchResults(false);
                      setGlobalQuery('');
                      setAdminTab('fees');
                    }}
                  >
                    <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>Receipt: {p.receiptNumber} - ₹{p.amount}</Text>
                    <Text style={{ fontSize: 8, color: theme.textSecondary }}>Category: {p.category} | Method: {p.paymentMethod}</Text>
                  </Pressable>
                ))
              ))
            ) : (
              <Text style={{ fontSize: 9, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 8 }}>No matching fee receipt.</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* ================= BODY CONTENT ================= */}
      {role === 'student' || role === 'parent' ? (
        <View style={{ flex: 1 }}>
        
        {/* ======================================================= */}
        {/* ================== A. STUDENT PORTAL ================== */}
        {/* ======================================================= */}
        {role === 'student' && (
          <View style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
            {/* STUDENT TABS ROUTER */}
            {studentTab === 'dashboard' && sData.dashboard && (
              <StudentDashboard onNavigate={setStudentTab} />
            )}
            {studentTab === 'attendance' && (
              <AttendanceScreen onBack={() => setStudentTab('dashboard')} />
            )}
            {studentTab === 'homework' && (
              <HomeworkScreen onBack={() => setStudentTab('academics')} />
            )}
            {studentTab === 'results' && (
              <ResultsScreen onBack={() => setStudentTab('academics')} />
            )}
            {studentTab === 'materials' && (
              <StudyMaterialsScreen onBack={() => setStudentTab('academics')} />
            )}
            {studentTab === 'timetable' && (
              <TimetableScreen onBack={() => setStudentTab('dashboard')} />
            )}
            {studentTab === 'idcard' && (
              <DigitalIDScreen onBack={() => setStudentTab('dashboard')} />
            )}
            {studentTab === 'notifications' && (
              <NotificationsScreen onBack={() => setStudentTab('dashboard')} />
            )}
            {studentTab === 'academics' && (
              <AcademicsScreen onNavigate={setStudentTab} />
            )}
            {studentTab === 'exams' && (
              <StudentExams onBack={() => setStudentTab('academics')} />
            )}
            {studentTab === 'fees' && (
              <ParentFeesScreen onBack={() => setStudentTab('dashboard')} />
            )}

            {/* STUDENT BOTTOM NAV BAR */}
            <View style={[styles.bottomNavBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <Pressable onPress={() => setStudentTab('dashboard')} style={styles.navBarItem}>
                <Home size={20} color={studentTab === 'dashboard' ? colors.primary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: studentTab === 'dashboard' ? colors.primary : theme.textSecondary }]}>Home</Text>
              </Pressable>
              <Pressable onPress={() => setStudentTab('academics')} style={styles.navBarItem}>
                <BookOpen size={20} color={studentTab === 'academics' || studentTab === 'homework' || studentTab === 'results' || studentTab === 'materials' || studentTab === 'attendance' ? colors.primary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: studentTab === 'academics' || studentTab === 'homework' || studentTab === 'results' || studentTab === 'materials' || studentTab === 'attendance' ? colors.primary : theme.textSecondary }]}>Academics</Text>
              </Pressable>
              <Pressable onPress={() => setStudentTab('timetable')} style={styles.navBarItem}>
                <Calendar size={20} color={studentTab === 'timetable' ? colors.primary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: studentTab === 'timetable' ? colors.primary : theme.textSecondary }]}>Calendar</Text>
              </Pressable>
              <Pressable onPress={() => setStudentTab('notifications')} style={styles.navBarItem}>
                <Bell size={20} color={studentTab === 'notifications' ? colors.primary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: studentTab === 'notifications' ? colors.primary : theme.textSecondary }]}>Notifications</Text>
              </Pressable>
              <Pressable onPress={() => setStudentTab('idcard')} style={styles.navBarItem}>
                <User size={20} color={studentTab === 'idcard' ? colors.primary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: studentTab === 'idcard' ? colors.primary : theme.textSecondary }]}>Profile</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ====================================================== */}
        {/* ================== B. PARENT PORTAL ================== */}
        {/* ====================================================== */}
        {role === 'parent' && pData.dashboard && (
          <View style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
            {/* PARENT TABS ROUTER */}
            {parentTab === 'dashboard' && (
              <ParentDashboard 
                onNavigate={setParentTab} 
                onSelectChild={handleChildSelect} 
                chatHistory={chatHistory}
                firstContactName={chatContacts.length > 0 ? chatContacts[0].name : 'Class Teacher'}
              />
            )}
            {parentTab === 'child' && (
              <MyChildScreen onNavigate={setParentTab} />
            )}
            {parentTab === 'attendance' && (
              <ParentAttendanceScreen 
                onBack={() => setParentTab('dashboard')} 
                onSelectChild={handleChildSelect}
              />
            )}
            {parentTab === 'homework' && (
              <ParentHomeworkScreen 
                onBack={() => setParentTab('dashboard')} 
                onSelectChild={handleChildSelect}
              />
            )}
            {parentTab === 'results' && (
              <ParentResultsScreen 
                onBack={() => setParentTab('dashboard')} 
                onSelectChild={handleChildSelect}
              />
            )}
            {parentTab === 'fees' && (
              <ParentFeesScreen 
                onBack={() => setParentTab('dashboard')} 
                onSelectChild={handleChildSelect}
              />
            )}
            {parentTab === 'transport' && (
              <ParentTransportScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'teachers' && (
              <ParentTeachersScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'classroom' && (
              <LiveClassroomScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'calendar' && (
              <ParentCalendarScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'notifications' && (
              <ParentNotificationsScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'profile' && (
              <ParentProfileScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'exams' && (
              <ParentExamsScreen onBack={() => setParentTab('dashboard')} />
            )}
            {parentTab === 'chat' && (
              <ParentChatScreen
                chatHistory={chatHistory}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                onSendMessage={handleSendMessage}
                onBack={() => setParentTab('teachers')}
                theme={theme}
                user={user}
                activeContactName={chatContacts.find(c => c._id === activeTeacherContactId)?.name || 'Class Teacher'}
              />
            )}

            {/* PARENT BOTTOM NAV BAR */}
            <View style={[styles.bottomNavBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <Pressable onPress={() => setParentTab('dashboard')} style={styles.navBarItem}>
                <Home size={20} color={parentTab === 'dashboard' ? colors.secondary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: parentTab === 'dashboard' ? colors.secondary : theme.textSecondary }]}>Home</Text>
              </Pressable>
              <Pressable onPress={() => setParentTab('child')} style={styles.navBarItem}>
                <User size={20} color={parentTab === 'child' ? colors.secondary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: parentTab === 'child' ? colors.secondary : theme.textSecondary }]}>My Child</Text>
              </Pressable>
              <Pressable onPress={() => setParentTab('calendar')} style={styles.navBarItem}>
                <Calendar size={20} color={parentTab === 'calendar' ? colors.secondary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: parentTab === 'calendar' ? colors.secondary : theme.textSecondary }]}>Calendar</Text>
              </Pressable>
              <Pressable onPress={() => setParentTab('notifications')} style={styles.navBarItem}>
                <Bell size={20} color={parentTab === 'notifications' ? colors.secondary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: parentTab === 'notifications' ? colors.secondary : theme.textSecondary }]}>Notifications</Text>
              </Pressable>
              <Pressable onPress={() => setParentTab('profile')} style={styles.navBarItem}>
                <User size={20} color={parentTab === 'profile' ? colors.secondary : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: parentTab === 'profile' ? colors.secondary : theme.textSecondary }]}>Profile</Text>
              </Pressable>
            </View>
          </View>
        )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBodyContainer}>
          {/* ======================================================= */}
          {/* ================== C. TEACHER PORTAL ================== */}
          {/* ======================================================= */}
          {((role as any) === 'teacher') && tData.dashboard && (
            <View style={{ flex: 1 }}>
              {teacherTab === 'dashboard' && (
                <TeacherDashboard 
                  data={tData.dashboard} 
                  onNavigate={(tab) => setTeacherTab(tab)} 
                />
              )}
              {teacherTab === 'attendance' && (
                <TeacherAttendanceScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                  onRefreshData={loadDashboardData}
                />
              )}
              {teacherTab === 'homework' && (
                <TeacherHomeworkScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                  onRefreshData={loadDashboardData}
                />
              )}
              {teacherTab === 'marks' && (
                <TeacherMarksScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                  onRefreshData={loadDashboardData}
                />
              )}
              {teacherTab === 'daily-report' && (
                <TeacherDailyReportScreen 
                  onBack={() => {
                    setTeacherTab('dashboard');
                    setPrefilledClassForReport('');
                  }} 
                  onRefreshData={loadDashboardData}
                  initialClass={prefilledClassForReport}
                />
              )}
              {teacherTab === 'timetable' && (
                <TeacherTimetableScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                  onNavigateToTab={(tab, prefill) => {
                    if (prefill) setPrefilledClassForReport(prefill);
                    setTeacherTab(tab);
                  }}
                />
              )}
              {teacherTab === 'students' && (
                <TeacherStudentsScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                />
              )}
              {teacherTab === 'performance' && (
                <TeacherPerformanceScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                />
              )}
              {teacherTab === 'announcements' && (
                <TeacherAnnouncementsScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                  onRefreshData={loadDashboardData}
                />
              )}
              {teacherTab === 'messages' && (
                <TeacherParentCommScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                />
              )}
              {teacherTab === 'ai-tools' && (
                <TeacherAIToolsScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                />
              )}
              {teacherTab === 'profile' && (
                <TeacherProfileScreen 
                  onBack={() => setTeacherTab('dashboard')} 
                />
              )}
              {teacherTab === 'exams' && (
                <TeacherExamsScreen />
              )}

              {/* FLOATING BOTTOM NAV BAR */}
              <View style={[
                styles.floatingBottomNavBar, 
                { backgroundColor: theme.surface + 'EE', borderColor: theme.border, shadowColor: theme.cardShadow }
              ]}>
                <Pressable onPress={() => setTeacherTab('dashboard')} style={styles.navBarItem}>
                  <BookOpen size={20} color={teacherTab === 'dashboard' ? colors.success : theme.textSecondary} />
                  <Text style={[styles.navBarText, { color: teacherTab === 'dashboard' ? colors.success : theme.textSecondary }]}>Home</Text>
                </Pressable>
                <Pressable onPress={() => setTeacherTab('attendance')} style={styles.navBarItem}>
                  <UserCheck size={20} color={teacherTab === 'attendance' ? colors.success : theme.textSecondary} />
                  <Text style={[styles.navBarText, { color: teacherTab === 'attendance' ? colors.success : theme.textSecondary }]}>Attendance</Text>
                </Pressable>
                <Pressable onPress={() => setTeacherTab('students')} style={styles.navBarItem}>
                  <Users size={20} color={teacherTab === 'students' ? colors.success : theme.textSecondary} />
                  <Text style={[styles.navBarText, { color: teacherTab === 'students' ? colors.success : theme.textSecondary }]}>Students</Text>
                </Pressable>
                <Pressable onPress={() => setTeacherTab('messages')} style={styles.navBarItem}>
                  <MessageCircle size={20} color={teacherTab === 'messages' ? colors.success : theme.textSecondary} />
                  <Text style={[styles.navBarText, { color: teacherTab === 'messages' ? colors.success : theme.textSecondary }]}>Messages</Text>
                </Pressable>
                <Pressable onPress={() => setTeacherTab('profile')} style={styles.navBarItem}>
                  <User size={20} color={teacherTab === 'profile' ? colors.success : theme.textSecondary} />
                  <Text style={[styles.navBarText, { color: teacherTab === 'profile' ? colors.success : theme.textSecondary }]}>Profile</Text>
                </Pressable>
              </View>
            </View>
          )}

        {/* ======================================================== */}
        {/* ================= D. PRINCIPAL PORTAL ================== */}
        {/* ======================================================== */}
        {role === 'principal' && prData.dashboard && (
          <View style={{ flex: 1 }}>
            {/* PRINCIPAL TAB 1: DASHBOARD */}
            {principalTab === 'dashboard' && (
              <PrincipalDashboard 
                onNavigate={setPrincipalTab} 
                teacherStats={prData.dashboard.teacherStats || getTodayTeacherStats()}
              />
            )}

            {/* PRINCIPAL TAB 2: STUDENT REGISTRY DIRECTORY (READ-ONLY) */}
            {principalTab === 'students' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
                <View style={styles.flexHeaderRow}>
                  <Text style={[styles.secHeading, { color: theme.text }]}>Student Registry Directory</Text>
                </View>

                <Card>
                  <View style={styles.searchBarBox}>
                    <Search size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 13, color: theme.text, outlineStyle: 'none' as any } as any}
                      placeholder="Search student by roll or name..."
                      placeholderTextColor={theme.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <Text style={{ color: theme.textSecondary, fontSize: 10, marginVertical: 8, fontWeight: '700' }}>Registry Accounts:</Text>
                  {(prData.students || [])
                    .filter(s => (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())))
                    .map((s, index) => (
                      <Pressable 
                        key={s._id} 
                        onPress={() => setSelectedStudentForModal(s)}
                        style={[styles.periodListItem, { borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#6F42C115', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Text style={{ color: '#6F42C1', fontSize: 12, fontWeight: '800' }}>{s.name ? s.name.charAt(0) : 'S'}</Text>
                          </View>
                          <View>
                            <Text style={[styles.periodSubj, { color: theme.text, fontSize: 12, fontWeight: '800' }]}>{s.name}</Text>
                            <Text style={{ fontSize: 9, color: theme.textSecondary }}>Roll No: {s.rollNumber} | Class: {s.class?.name || 'Nursery'}</Text>
                          </View>
                        </View>
                        <ArrowRight size={14} color={theme.textSecondary} />
                      </Pressable>
                    ))}
                </Card>

                {selectedStudentForModal && (
                  <Modal
                    visible={selectedStudentForModal !== null}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setSelectedStudentForModal(null)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                          <Text style={[styles.modalTitle, { color: theme.text }]}>Student Detailed Profile</Text>
                          <Pressable onPress={() => setSelectedStudentForModal(null)} style={styles.closeBtn}>
                            <X size={18} color={theme.text} />
                          </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                          <View style={styles.profileModalHeader}>
                            <View style={[styles.modalAvatarCircle, { backgroundColor: '#6F42C1' }]}>
                              <Text style={styles.modalAvatarText}>{selectedStudentForModal.name.charAt(0)}</Text>
                            </View>
                            <Text style={[styles.modalStudentName, { color: theme.text }]}>{selectedStudentForModal.name}</Text>
                            <Text style={[styles.modalStudentRoll, { color: theme.textSecondary }]}>
                              Roll Number: {selectedStudentForModal.rollNumber} | Blood Group: {selectedStudentForModal.bloodGroup}
                            </Text>
                          </View>

                          <Card style={styles.modalDetailCard}>
                            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Academic Metrics</Text>
                            <View style={styles.modalMetricsGrid}>
                              <View style={styles.gridCell}>
                                <Text style={[styles.gridCellVal, { color: colors.success }]}>{selectedStudentForModal.attendancePct}%</Text>
                                <Text style={[styles.gridCellLbl, { color: theme.textSecondary }]}>Attendance Rate</Text>
                              </View>
                              <View style={styles.gridCell}>
                                <Text style={[styles.gridCellVal, { color: colors.warning }]}>{selectedStudentForModal.homeworkPct}%</Text>
                                <Text style={[styles.gridCellLbl, { color: theme.textSecondary }]}>Homework Completed</Text>
                              </View>
                              <View style={styles.gridCell}>
                                <Text style={[styles.gridCellVal, { color: colors.primary }]}>{selectedStudentForModal.marksPct}%</Text>
                                <Text style={[styles.gridCellLbl, { color: theme.textSecondary }]}>Academic Score</Text>
                              </View>
                            </View>
                          </Card>

                          <Card style={styles.modalDetailCard}>
                            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Student Registry Details</Text>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Admission No:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudentForModal.admissionNumber}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Date of Birth:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudentForModal.dob}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Emergency Contact:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudentForModal.emergencyContact}</Text>
                            </View>
                          </Card>

                          <Card style={styles.modalDetailCard}>
                            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Guardian & Parents</Text>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Father Name:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudentForModal.fatherName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Mother Name:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudentForModal.motherName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Registered Phone:</Text>
                              <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudentForModal.parentPhone}</Text>
                            </View>
                          </Card>

                          <Card style={styles.modalDetailCard}>
                            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Conduct & Class Performance</Text>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Conduct Grade:</Text>
                              <Text style={[styles.infoValue, { color: '#3B82F6', fontWeight: 'bold' }]}>
                                {selectedStudentForModal.behaviour}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Class Rank Group:</Text>
                              <Text style={[styles.infoValue, { color: '#10B981', fontWeight: 'bold' }]}>
                                {selectedStudentForModal.performance} Performer
                              </Text>
                            </View>
                          </Card>
                          
                          <Pressable 
                            onPress={() => setSelectedStudentForModal(null)}
                            style={[styles.closeModalBtn, { backgroundColor: '#6F42C1' }]}
                          >
                            <Text style={styles.closeModalBtnText}>Close Profile</Text>
                          </Pressable>
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>
                )}
              </ScrollView>
            )}

            {/* PRINCIPAL TAB 3: ATTENDANCE ANALYTICS */}
            {principalTab === 'attendance' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
                <Text style={[styles.secHeading, { color: theme.text }]}>Attendance Analytics</Text>
                <Card style={{ alignItems: 'center' }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Overall School Attendance</Text>
                  <ProgressRing percentage={89} size={110} color={colors.success} />
                </Card>

                <Card>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Class-Wise Attendance rate</Text>
                  <BarChart
                    data={prData.dashboard.charts.attendanceByClass.map((c: any) => ({
                      label: c.className.replace('Class ', 'C'),
                      value: c.attendancePct
                    }))}
                    color={colors.success}
                  />
                </Card>
              </ScrollView>
            )}

            {/* PRINCIPAL TAB 4: SUBSTITUTES & LEAVES */}
            {principalTab === 'substitutes' && (
              <PrincipalSubstituteManagement 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL TAB 5: LESSON REPORTS REVIEW */}
            {principalTab === 'daily-reports' && (
              <PrincipalLessonReports onBack={() => setPrincipalTab('dashboard')} />
            )}

            {/* PRINCIPAL TAB 6: TEACHER ROLE ASSIGNMENT */}
            {principalTab === 'teachers' && (
              <PrincipalTeacherAssignment 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL TAB 7: CLASSES MANAGEMENT */}
            {principalTab === 'classes' && (
              <PrincipalClassManagement 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL TAB 8: TIMETABLE CONFIG */}
            {principalTab === 'timetable' && (
              <PrincipalTimetable 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL TAB 9: CALENDAR CONFIG */}
            {principalTab === 'calendar' && (
              <PrincipalCalendar 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL TAB 10: BROADCAST ANNOUNCEMENTS */}
            {principalTab === 'announcements' && (
              <PrincipalAnnouncements 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL TAB 11: REPORTS EXPORT */}
            {principalTab === 'reports' && (
              <PrincipalReports onBack={() => setPrincipalTab('dashboard')} />
            )}
            {/* PRINCIPAL TAB 12: EXAMS MANAGEMENT */}
            {principalTab === 'exams' && (
              <PrincipalExams 
                onBack={() => setPrincipalTab('dashboard')} 
                onSyncAllPortals={loadDashboardData} 
              />
            )}

            {/* PRINCIPAL BOTTOM NAV BAR */}
            <View style={[styles.bottomNavBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <Pressable onPress={() => setPrincipalTab('dashboard')} style={styles.navBarItem}>
                <BookOpen size={20} color={principalTab === 'dashboard' ? '#5C54E5' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: principalTab === 'dashboard' ? '#5C54E5' : theme.textSecondary }]}>Home</Text>
              </Pressable>
              <Pressable onPress={() => setPrincipalTab('students')} style={styles.navBarItem}>
                <Users size={20} color={principalTab === 'students' ? '#5C54E5' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: principalTab === 'students' ? '#5C54E5' : theme.textSecondary }]}>Students</Text>
              </Pressable>
              <Pressable onPress={() => setPrincipalTab('attendance')} style={styles.navBarItem}>
                <BarChart2 size={20} color={principalTab === 'attendance' ? '#5C54E5' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: principalTab === 'attendance' ? '#5C54E5' : theme.textSecondary }]}>Att. Report</Text>
              </Pressable>
              <Pressable onPress={() => setPrincipalTab('substitutes')} style={styles.navBarItem}>
                <User size={20} color={principalTab === 'substitutes' ? '#5C54E5' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: principalTab === 'substitutes' ? '#5C54E5' : theme.textSecondary }]}>Substitutes</Text>
              </Pressable>
              <Pressable onPress={() => setPrincipalTab('calendar')} style={styles.navBarItem}>
                <CalIcon size={20} color={principalTab === 'calendar' ? '#5C54E5' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: principalTab === 'calendar' ? '#5C54E5' : theme.textSecondary }]}>Calendar</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* ================= E. ADMIN PORTAL ====================== */}
        {/* ======================================================== */}
        {role === 'admin' && (
          <View style={{ flex: 1 }}>
            {/* ADMIN TAB 1: DASHBOARD */}
            {adminTab === 'dashboard' && (
              <AdminDashboard 
                onNavigate={setAdminTab} 
                onSyncAllPortals={loadDashboardData}
                refreshTrigger={adminRefreshTrigger}
              />
            )}

            {/* ADMIN TAB 2: ADMISSIONS */}
            {adminTab === 'admissions' && (
              <AdminAdmissions 
                onNavigate={setAdminTab} 
                onSyncAllPortals={loadDashboardData}
                initialStudentId={searchSelectionStudentId}
                clearInitialStudentId={() => setSearchSelectionStudentId(null)}
                setSearchSelectionStudentId={setSearchSelectionStudentId}
                setOpenReceiptOnLoad={setOpenReceiptOnLoad}
                refreshTrigger={adminRefreshTrigger}
              />
            )}

            {/* ADMIN TAB 3: TEACHERS */}
            {adminTab === 'teachers' && (
              <AdminTeachers 
                onNavigate={setAdminTab} 
                onSyncAllPortals={loadDashboardData}
              />
            )}

            {/* ADMIN TAB 4: FEES */}
            {adminTab === 'fees' && (
              <AdminFees 
                onNavigate={setAdminTab} 
                onSyncAllPortals={loadDashboardData}
                initialStudentId={searchSelectionStudentId}
                clearInitialStudentId={() => setSearchSelectionStudentId(null)}
                openReceiptOnLoad={openReceiptOnLoad}
                clearOpenReceiptOnLoad={() => setOpenReceiptOnLoad(false)}
                refreshTrigger={adminRefreshTrigger}
              />
            )}

            {/* ADMIN TAB 5: REPORTS */}
            {adminTab === 'reports' && (
              <AdminReports 
                onNavigate={setAdminTab} 
                refreshTrigger={adminRefreshTrigger}
              />
            )}

            {/* ADMIN TAB 6: PROFILE */}
            {adminTab === 'profile' && (
              <AdminProfile 
                onNavigate={setAdminTab} 
                onSyncAllPortals={loadDashboardData}
              />
            )}
            {/* ADMIN TAB 7: TRANSPORT */}
            {adminTab === 'transport' && (
              <AdminTransport />
            )}

            {/* ADMIN TAB 8: EXPENSES */}
            {adminTab === 'expenses' && (
              <AdminExpenses 
                onNavigate={setAdminTab} 
                onSyncAllPortals={loadDashboardData}
                refreshTrigger={adminRefreshTrigger}
              />
            )}


            {/* ADMIN BOTTOM NAV BAR */}
            <View style={[styles.bottomNavBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <Pressable onPress={() => setAdminTab('dashboard')} style={styles.navBarItem}>
                <Home size={20} color={adminTab === 'dashboard' ? '#EF4444' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: adminTab === 'dashboard' ? '#EF4444' : theme.textSecondary }]}>Home</Text>
              </Pressable>
              <Pressable onPress={() => setAdminTab('admissions')} style={styles.navBarItem}>
                <GraduationCap size={20} color={adminTab === 'admissions' ? '#EF4444' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: adminTab === 'admissions' ? '#EF4444' : theme.textSecondary }]}>Admissions</Text>
              </Pressable>
              <Pressable onPress={() => setAdminTab('teachers')} style={styles.navBarItem}>
                <Users size={20} color={adminTab === 'teachers' ? '#EF4444' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: adminTab === 'teachers' ? '#EF4444' : theme.textSecondary }]}>Teachers</Text>
              </Pressable>
              <Pressable onPress={() => setAdminTab('fees')} style={styles.navBarItem}>
                <DollarSign size={20} color={adminTab === 'fees' ? '#EF4444' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: adminTab === 'fees' ? '#EF4444' : theme.textSecondary }]}>Fees</Text>
              </Pressable>
              <Pressable onPress={() => setAdminTab('reports')} style={styles.navBarItem}>
                <BarChart2 size={20} color={adminTab === 'reports' ? '#EF4444' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: adminTab === 'reports' ? '#EF4444' : theme.textSecondary }]}>Reports</Text>
              </Pressable>
              <Pressable onPress={() => setAdminTab('profile')} style={styles.navBarItem}>
                <User size={20} color={adminTab === 'profile' ? '#EF4444' : theme.textSecondary} />
                <Text style={[styles.navBarText, { color: adminTab === 'profile' ? '#EF4444' : theme.textSecondary }]}>Profile</Text>
              </Pressable>
            </View>
          </View>
        )}

        </ScrollView>
      )}
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  mobileContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#F5F7FB',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  appBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 10,
  },
  appBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  appBarTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  appBarSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    borderRadius: 20,
    marginLeft: 6,
  },
  actionBtnThemed: {
    padding: 6,
    borderRadius: 20,
    marginLeft: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  logoutBtn: {
    backgroundColor: '#FFEBE9',
  },
  logoutBtnThemed: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  scrollBodyContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // Space for bottom navigation
  },
  secHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  // Student specific Profile badge
  profileHeaderBadge: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircleBig: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircleBigText: {
    color: '#0B5ED7',
    fontSize: 22,
    fontWeight: '900',
  },
  profileTextBadgeCol: {
    marginLeft: 16,
  },
  profileBadgeName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  profileBadgeRoll: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  // Quick stats counts
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  statValueText: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabelText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },

  // Icon Action Grid
  portalActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  actionIconCard: {
    width: '23%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIconCardText: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 6,
  },

  // Lists layouts
  flexHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  periodSubj: {
    fontSize: 12,
    fontWeight: '700',
  },
  periodTime: {
    fontSize: 9,
    marginTop: 2,
  },
  periodHour: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },

  // Timetable
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 8,
  },
  timetableDayGroup: {
    marginBottom: 14,
  },
  timetableDayTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },

  // Result performance
  gradeBannerText: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },

  // Parent Multi-Child selectors
  childSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  childSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  avatarCircleSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0B5ED7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  childPillName: {
    fontSize: 11,
    fontWeight: '800',
  },
  childPillClass: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },

  // Classroom camera timeline details
  storyboardSnapshotFrame: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  storyboardSnapshotImg: {
    width: '100%',
    height: '100%',
  },
  storyboardWatermark: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(220, 53, 69, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  storyboardWatermarkText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  storyboardSnapshotTime: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontWeight: '700',
  },
  timelineHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  storyboardTimelineScroll: {
    flexDirection: 'row',
  },
  storyboardTimelineItem: {
    width: 80,
    marginRight: 10,
    alignItems: 'center',
  },
  storyboardTimelineImg: {
    width: 80,
    height: 55,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  storyboardTimelineTime: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 3,
    fontWeight: '700',
  },
  cameraDisabledBox: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFE69C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 12,
  },
  cameraDisabledText: {
    color: '#664D03',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Fee Details
  storyboardFeeBox: {
    padding: 0,
    overflow: 'hidden',
  },
  storyboardFeeBanner: {
    backgroundColor: '#0B5ED7',
    paddingVertical: 18,
    alignItems: 'center',
  },
  storyboardFeeBannerTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  storyboardFeeBannerAmount: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  storyboardFeeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  storyboardFeePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallBtnPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  smallBtnPillText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },

  // Chat conversation
  chatBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInputText: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 12,
    fontSize: 12,
    marginRight: 8,
    outlineStyle: 'none' as any,
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0B5ED7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Notice alerts list
  listAlertItem: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  alertMsg: {
    fontSize: 10,
    marginTop: 2,
  },
  alertTime: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 3,
  },

  // Teacher Mark attendance lists
  attendanceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  studNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  studRollText: {
    fontSize: 10,
    marginTop: 1,
  },
  attendanceStatusRow: {
    flexDirection: 'row',
  },
  attStatusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 6,
  },
  formSubmitBtn: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },

  // Form layouts
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    outlineStyle: 'none' as any,
  },
  formAreaInput: {
    height: 60,
    paddingTop: 6,
    textAlignVertical: 'top',
  },

  // Principal Dashboard stats ribbons
  metricTitle: {
    fontSize: 8,
    fontWeight: '700',
  },
  metricNum: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  
  // Student CRUD Manager
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },

  // Calendar dates
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  calendarDatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDateBox: {
    width: '14.28%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 6,
  },

  // Bottom navigation bars
  bottomNavBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 55,
    borderTopWidth: 1.5,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  floatingBottomNavBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 55,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 100,
  },

  navBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 10,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },

  // ─── PREMIUM SUB-SCREEN STYLES ───────────────────────────────────

  // Shared sub-screen header (back button + title)
  subScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subScreenTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  subScreenSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  // ─── TIMETABLE (Student) ─────────────────────────────────────────
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  periodCardStrip: {
    width: 4,
    height: 44,
    borderRadius: 4,
    marginRight: 14,
  },
  periodCardLeft: {
    flex: 1,
  },
  periodCardSubject: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  periodCardTeacher: {
    fontSize: 11,
    fontWeight: '500',
  },
  periodCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  periodTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  periodTimeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  periodRoomText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // ─── RESULTS (Student) ───────────────────────────────────────────
  gradeRingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  gradeRingLeft: {
    marginRight: 20,
  },
  gradeRingRight: {
    flex: 1,
    gap: 6,
  },
  gradeRingLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  gradeRingPercent: {
    fontSize: 32,
    fontWeight: '900',
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gradeRankText: {
    fontSize: 11,
    fontWeight: '600',
  },
  marksListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  marksSubjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  marksSubjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  marksSubjectName: {
    fontSize: 13,
    fontWeight: '700',
  },
  marksScore: {
    fontSize: 13,
    fontWeight: '900',
  },
  marksBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  marksBarFill: {
    height: 6,
    borderRadius: 3,
  },
  downloadBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // ─── STUDY MATERIALS (Student) ───────────────────────────────────
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  materialIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  materialMeta: {
    fontSize: 10,
    fontWeight: '500',
  },
  materialDownloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialDownloadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ─── FEE PAYMENT (Parent) ────────────────────────────────────────
  feeCardsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  feeSummaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  feeSummaryAmount: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  feeSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  feeProgressCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  feeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feeProgressLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  feeProgressPct: {
    fontSize: 16,
    fontWeight: '900',
  },
  feeProgressBarBg: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  feeProgressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  feeDueDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  payNowBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#F57C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  payNowBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  receiptIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptNumber: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  receiptMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  receiptAmount: {
    fontSize: 15,
    fontWeight: '900',
  },

  // ─── NOTIFICATIONS (Parent) ──────────────────────────────────────
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markReadText: {
    color: '#F57C00',
    fontSize: 11,
    fontWeight: '700',
  },
  notifCategoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCategoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  notifIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  notifMsg: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginLeft: 8,
  },

  // ─── ATTENDANCE REGISTER (Teacher) ───────────────────────────────
  attendanceDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attSummaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  attSummaryPill: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  attSummaryNum: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 3,
  },
  attSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  attStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  attStudentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attStudentAvatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  attStudentName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  attStudentRoll: {
    fontSize: 11,
    fontWeight: '500',
  },
  attToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  attToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attToggleBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },

  // ─── HOMEWORK ASSIGN (Teacher) ───────────────────────────────────
  formCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 16,
  },
  formFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  subjectPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectPickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  subjectPickerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  premiumInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  premiumTextArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  hwCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    gap: 12,
  },
  hwCardStrip: {
    width: 4,
    height: 46,
    borderRadius: 4,
  },
  hwCardSubject: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  hwCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  hwCardMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  hwDueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  hwDueText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ─── MARKS ENTRY (Teacher) ───────────────────────────────────────
  marksEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  marksEntrySubject: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  marksEntryInput: {
    width: 72,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    outlineStyle: 'none' as any,
  },

  // ─── PRINCIPAL STUDENT MODAL STYLES ───────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  closeBtn: {
    padding: 4,
  },
  profileModalHeader: {
    alignItems: 'center',
    marginVertical: 14,
  },
  modalAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalStudentRoll: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  modalDetailCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
  },
  gridCellVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  gridCellLbl: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 10,
    fontWeight: '500',
  },
  closeModalBtn: {
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  closeModalBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  headerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerNavBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  headerAvatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
