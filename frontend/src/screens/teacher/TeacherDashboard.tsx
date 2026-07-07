import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Animated, Modal, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { 
  Bell, ChevronRight, UserCheck, Plus, Award, BarChart2, 
  BookOpen, Calendar as CalIcon, MessageSquare, AlertTriangle, 
  Sparkles, FileText, CheckCircle, Clock, ShieldAlert, ArrowRight, User, X
} from 'lucide-react-native';


interface TeacherDashboardProps {
  onNavigate: (tab: any) => void;
  data: any;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate, data }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Leave Form State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);

  // Self Attendance State
  const [morningMarked, setMorningMarked] = useState(false);
  const [afternoonMarked, setAfternoonMarked] = useState(false);
  const [attendanceTimeMorning, setAttendanceTimeMorning] = useState('');
  const [attendanceTimeAfternoon, setAttendanceTimeAfternoon] = useState('');

  // Class context state
  const [selectedClassOption, setSelectedClassOption] = useState<'Own' | 'Substitute'>('Own');

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/teacher/calendar');
        setEvents(res.data.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
      }
    };
    fetchEvents();
  }, []);

  const activeSubCover = data?.activeSubCover || null;

  useEffect(() => {
    if (data?.selfAttendance) {
      const morningLog = data.selfAttendance.find((l: any) => l.session === 'Morning');
      const afternoonLog = data.selfAttendance.find((l: any) => l.session === 'Afternoon');
      
      if (morningLog) {
        setMorningMarked(true);
        setAttendanceTimeMorning(`${morningLog.time} (${morningLog.status})`);
      } else {
        setMorningMarked(false);
        setAttendanceTimeMorning('');
      }
      
      if (afternoonLog) {
        setAfternoonMarked(true);
        setAttendanceTimeAfternoon(`${afternoonLog.time} (${afternoonLog.status})`);
      } else {
        setAfternoonMarked(false);
        setAttendanceTimeAfternoon('');
      }
    }
  }, [data?.selfAttendance]);

  // Initialize or expire active class context in localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (activeSubCover) {
      if (selectedClassOption === 'Substitute') {
        window.localStorage.setItem('active_teacher_class_context', JSON.stringify({
          classId: activeSubCover.assignedClassId || 'class_cover_temp_id', 
          className: activeSubCover.assignedClass,
          isSubstitute: true,
          originalTeacher: activeSubCover.originalTeacher
        }));
      } else {
        window.localStorage.removeItem('active_teacher_class_context');
      }
    } else {
      window.localStorage.removeItem('active_teacher_class_context');
    }
  }, [selectedClassOption, activeSubCover]);

  const handleMarkSelfAttendance = async (session: 'Morning' | 'Afternoon') => {
    try {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0]; 
      
      let status: 'Present' | 'Late' = 'Present';
      if (session === 'Morning') {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        if (hours > 9 || (hours === 9 && minutes > 30)) {
          status = 'Late';
        }
      }
      
      await api.post('/teacher/self-attendance', {
        session,
        time: timeStr,
        status
      });
      
      alert(`Self Attendance marked for ${session} session as ${status}!`);
      if (session === 'Morning') {
        setMorningMarked(true);
        setAttendanceTimeMorning(`${timeStr} (${status})`);
      } else {
        setAfternoonMarked(true);
        setAttendanceTimeAfternoon(`${timeStr} (${status})`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark self attendance.');
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveReason) {
      alert('Please fill in a reason for applying leave.');
      return;
    }

    try {
      await api.post('/teacher/leave', {
        leaveType,
        reason: leaveReason,
        fromDate: leaveFrom,
        toDate: leaveTo
      });

      alert('Leave request submitted successfully for Principal review!');
      setLeaveReason('');
      setShowLeaveModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply for leave.');
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning ☀️';
    if (hrs < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const getSchedulesToUse = () => {
    return data?.schedules || [];
  };

  const schedulesToUse = getSchedulesToUse();

  const notices = data?.notices || [];

  if (!data?.assignedClassId && !activeSubCover) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.schoolName, { color: colors.primary }]}>VIDYA BHARATHI VIDYAPEETH</Text>
            <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.teacherName, { color: theme.text }]}>Hello, {user?.name || 'Teacher'}</Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Class Assignment"
            message="No class assigned. Please contact the administrator to assign classes."
            iconName="Users"
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= SUBSTITUTE ASSIGNMENT BANNER ================= */}
        {activeSubCover && (
          <View style={[styles.subCoverBanner, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }]}>
            <ShieldAlert size={18} color="#F59E0B" />
            <Text style={{ flex: 1, fontSize: 10, color: theme.text, marginLeft: 8 }}>
              <Text style={{ fontWeight: '800', color: '#F59E0B' }}>Today's Substitute Assignment: </Text> 
              You are assigned to Class {activeSubCover.assignedClass} for {activeSubCover.originalTeacher} until {activeSubCover.endDate}.
            </Text>
          </View>
        )}

        {/* ================= GREETING & LOGO ================= */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.schoolName, { color: colors.primary }]}>VIDYA BHARATHI VIDYAPEETH</Text>
            <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.teacherName, { color: theme.text }]}>Hello, {user?.name || 'Teacher'}</Text>
          </View>
          <Pressable onPress={() => onNavigate('announcements')} style={[styles.bellBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Bell size={20} color={colors.primary} />
            <View style={styles.unreadDot} />
          </Pressable>
        </View>

        {/* ================= TEACHER SELF ATTENDANCE & LEAVE CARD ================= */}
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 10 }}>Teacher Self Attendance</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.01)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textSecondary, marginBottom: 6 }}>Morning Session</Text>
              {morningMarked ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CheckCircle size={12} color={colors.success} />
                  <Text style={{ fontSize: 9, color: colors.success, fontWeight: '700', marginLeft: 4 }}>{attendanceTimeMorning}</Text>
                </View>
              ) : (
                <Pressable 
                  onPress={() => handleMarkSelfAttendance('Morning')}
                  style={{ backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>Mark Present</Text>
                </Pressable>
              )}
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.01)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 10, alignItems: 'center', marginLeft: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textSecondary, marginBottom: 6 }}>Afternoon Session</Text>
              {afternoonMarked ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CheckCircle size={12} color={colors.success} />
                  <Text style={{ fontSize: 9, color: colors.success, fontWeight: '700', marginLeft: 4 }}>{attendanceTimeAfternoon}</Text>
                </View>
              ) : (
                <Pressable 
                  onPress={() => handleMarkSelfAttendance('Afternoon')}
                  style={{ backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>Mark Present</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />
          
          <Pressable 
            onPress={() => setShowLeaveModal(true)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, height: 32, borderRadius: 8 }}
          >
            <CalIcon size={12} color={colors.primary} />
            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800', marginLeft: 6 }}>Apply for Leave Request</Text>
          </Pressable>
        </Card>

        {/* ================= CLASS ROLE SWITCHER ================= */}
        {activeSubCover && (
          <Card style={{ padding: 14, marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 4 }}>Active Class Context Role</Text>
            <Text style={{ fontSize: 9, color: theme.textSecondary }}>Switch permissions context to substitute class</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Pressable 
                onPress={() => setSelectedClassOption('Own')}
                style={[
                  { flex: 1, paddingVertical: 8, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
                  selectedClassOption === 'Own' ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: theme.border }
                ]}
              >
                <Text style={{ fontSize: 9, color: selectedClassOption === 'Own' ? '#fff' : theme.text, fontWeight: '700' }}>
                  Own Class ({data.assignedClass || 'None'})
                </Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setSelectedClassOption('Substitute')}
                style={[
                  { flex: 1, paddingVertical: 8, borderWidth: 1, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
                  selectedClassOption === 'Substitute' ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: theme.border }
                ]}
              >
                <Text style={{ fontSize: 9, color: selectedClassOption === 'Substitute' ? '#fff' : theme.text, fontWeight: '700' }}>
                  Cover Class ({activeSubCover.assignedClass})
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* ================= GRADIENT SUMMARY CARD ================= */}
        <View style={styles.gradientCard}>
          <View style={styles.gradientHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.badgeClassName}>
                {selectedClassOption === 'Substitute' && activeSubCover
                  ? activeSubCover.assignedClass
                  : (data.assignedClass || 'None')}
              </Text>
              <Text style={styles.badgeRoleName}>
                {selectedClassOption === 'Substitute'
                  ? `Substitute Class Teacher for ${activeSubCover?.originalTeacher}`
                  : 'Class Teacher | Mathematics Specialization'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatVal}>{data.studentCount || 0}</Text>
              <Text style={styles.summaryStatLbl}>Students</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatVal}>{Math.round(data.attendanceTodayPct || 0)}%</Text>
              <Text style={styles.summaryStatLbl}>Attendance</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatVal}>{data.classGrade || 'N/A'}</Text>
              <Text style={styles.summaryStatLbl}>Class Grade</Text>
            </View>
          </View>
        </View>

        {/* ================= PENDING TASKS WIDGET ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Today's Pending Tasks</Text>
        {(!data?.pendingTasks || data.pendingTasks.length === 0) ? (
          <Card style={{ padding: 16, alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>No pending tasks.</Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollList}>
            {data.pendingTasks.map((task: any) => {
              const IconComponent = 
                task.id === 'attendance' ? UserCheck :
                task.id === 'homework' ? Plus :
                task.id === 'report' ? FileText : Award;
              return (
                <Pressable
                  key={task.id}
                  onPress={() => onNavigate(task.screen)}
                  style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[styles.taskIconBg, { backgroundColor: task.color + '15' }]}>
                    <IconComponent size={20} color={task.color} />
                  </View>
                  <Text style={[styles.taskType, { color: task.color }]}>{task.type}</Text>
                  <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>{task.title}</Text>
                  <Text style={[styles.taskSub, { color: theme.textSecondary }]} numberOfLines={1}>{task.subtitle}</Text>
                  <View style={styles.taskFooter}>
                    <Text style={[styles.taskActionText, { color: colors.primary }]}>Go to screen</Text>
                    <ArrowRight size={12} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* ================= STUDENT ALERTS WIDGET ================= */}
        <View style={styles.alertsContainer}>
          <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 4 }]}>Student Alerts</Text>
          <Text style={[styles.sectionSubtext, { color: theme.textSecondary, marginBottom: 12 }]}>Students requiring immediate attention today</Text>
          
          <Card style={styles.alertsCard}>
            {(!data?.studentAlerts || data.studentAlerts.length === 0) ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>No student alerts.</Text>
              </View>
            ) : (
              data.studentAlerts.map((alert: any, index: number) => {
                const AlertIcon = 
                  alert.alertType === 'Low Attendance' ? Clock :
                  alert.alertType === 'Homework Missing' ? FileText : Award;
                return (
                  <View key={alert.id}>
                    <Pressable 
                      onPress={() => onNavigate('students')} 
                      style={styles.alertItemRow}
                    >
                      <View style={[styles.alertIconFrame, { backgroundColor: alert.color + '15' }]}>
                        <AlertIcon size={16} color={alert.color} />
                      </View>
                      <View style={styles.alertTextFrame}>
                        <View style={styles.alertHeaderLine}>
                          <Text style={[styles.alertStudentName, { color: theme.text }]}>{alert.name}</Text>
                          <View style={[styles.alertBadge, { backgroundColor: alert.color + '15' }]}>
                            <Text style={[styles.alertBadgeText, { color: alert.color }]}>{alert.alertType}</Text>
                          </View>
                        </View>
                        <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>{alert.desc}</Text>
                        <Text style={[styles.alertMeta, { color: theme.textSecondary }]}>{alert.detail}</Text>
                      </View>
                      <ChevronRight size={16} color={theme.textSecondary} />
                    </Pressable>
                    {index < data.studentAlerts.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />}
                  </View>
                );
              })
            )}
          </Card>
        </View>

        {/* ================= QUICK ACTIONS GRID ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.portalActionGrid}>
          <Pressable onPress={() => onNavigate('attendance')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#10B98115' }]}>
              <UserCheck size={22} color="#10B981" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Attendance</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('homework')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#F9731615' }]}>
              <Plus size={22} color="#F97316" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Assign HW</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('marks')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#8B5CF615' }]}>
              <Award size={22} color="#8B5CF6" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Gradebook</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('timetable')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#3B82F615' }]}>
              <CalIcon size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Timetable</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('daily-report')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#06B6D415' }]}>
              <FileText size={22} color="#06B6D4" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Daily Report</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('performance')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#EC489915' }]}>
              <BarChart2 size={22} color="#EC4899" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Analytics</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('announcements')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#EF444415' }]}>
              <Bell size={22} color="#EF4444" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Notices</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('ai-tools')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#F59E0B15' }]}>
              <Sparkles size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>AI Assistant</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('exams')} style={[styles.actionIconCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.actionIconWrapper, { backgroundColor: '#3B82F615' }]}>
              <Award size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.actionIconCardText, { color: theme.text }]}>Exam Duties</Text>
          </Pressable>
        </View>

        {/* ================= TODAY'S TIMETABLE SCHEDULE ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Today's Schedule</Text>
        <Card>
          {schedulesToUse?.length > 0 ? (
            schedulesToUse.map((sched: any, idx: number) => (
              <View key={idx}>
                <View style={styles.scheduleItemRow}>
                  <View style={styles.scheduleTimeBox}>
                    <Text style={[styles.schedTimeText, { color: theme.text }]}>{sched.startTime}</Text>
                    <Text style={[styles.schedTimeSub, { color: theme.textSecondary }]}>{sched.endTime}</Text>
                  </View>
                  <View style={styles.scheduleDetails}>
                    <Text style={[styles.schedSubject, { color: theme.text }]}>{sched.subject}</Text>
                    <Text style={[styles.schedClass, { color: theme.textSecondary }]}>
                      {sched.class} {sched.section ? `- ${sched.section}` : ''} | Room: {sched.room || 'N/A'}
                    </Text>
                  </View>
                  <Pressable 
                    onPress={() => onNavigate('timetable')}
                    style={[styles.schedActionBadge, { backgroundColor: colors.primary + '10' }]}
                  >
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>Actions</Text>
                  </Pressable>
                </View>
                {idx < schedulesToUse.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <CalIcon size={28} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No teaching schedule today.</Text>
            </View>
          )}
        </Card>

        {/* ================= PARENT MESSAGES PREVIEW ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Recent Parent Messages</Text>
        <Card>
          {(!data?.recentMessages || data.recentMessages.length === 0) ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>No parent messages.</Text>
            </View>
          ) : (
            data.recentMessages.map((msg: any, index: number) => (
              <View key={msg.id}>
                <Pressable onPress={() => onNavigate('messages')} style={styles.msgRow}>
                  <View style={[styles.msgAvatar, { backgroundColor: colors.primary + '15' }]}>
                    <User size={16} color={colors.primary} />
                  </View>
                  <View style={styles.msgDetails}>
                    <View style={styles.msgHeader}>
                      <Text style={[styles.msgAuthor, { color: theme.text, fontWeight: msg.unread ? 'bold' : 'normal' }]}>{msg.parent}</Text>
                      <Text style={[styles.msgTime, { color: theme.textSecondary }]}>{msg.time}</Text>
                    </View>
                    <Text style={[styles.msgText, { color: theme.textSecondary }]} numberOfLines={1}>{msg.msg}</Text>
                  </View>
                  {msg.unread && <View style={styles.unreadDotSmall} />}
                </Pressable>
                {index < data.recentMessages.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />}
              </View>
            ))
          )}
        </Card>

        {/* ================= NOTICE BOARD ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Recent Notices</Text>
        <Card>
          {(!data?.notices || data.notices.length === 0) ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>No notices available.</Text>
            </View>
          ) : (
            data.notices.map((notice: any, index: number) => (
              <View key={notice.id}>
                <View style={styles.noticeRow}>
                  <View style={[styles.noticeCategoryBadge, { backgroundColor: notice.color }]}>
                    <Text style={styles.noticeCategoryText}>{notice.type}</Text>
                  </View>
                  <Text style={[styles.noticeTitle, { color: theme.text }]} numberOfLines={1}>{notice.title}</Text>
                  <Text style={[styles.noticeDate, { color: theme.textSecondary }]}>{notice.date}</Text>
                </View>
                {index < data.notices.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />}
              </View>
            ))
          )}
        </Card>

        {/* ================= STUDENT PERFORMANCE SUMMARY ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Student Performance Summary</Text>
        <Card>
          {(!data?.performanceSummary?.topPerformers || data.performanceSummary.topPerformers.length === 0) &&
           (!data?.performanceSummary?.needingSupport || data.performanceSummary.needingSupport.length === 0) ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Performance data not available.</Text>
            </View>
          ) : (
            <View style={styles.performanceSummaryRow}>
              <View style={styles.perfCol}>
                <Text style={[styles.perfTitle, { color: '#10B981' }]}>Top Performers</Text>
                {data?.performanceSummary?.topPerformers?.length > 0 ? (
                  data.performanceSummary.topPerformers.map((item: any, idx: number) => (
                    <Text key={idx} style={[styles.perfStudent, { color: theme.text }]}>{idx + 1}. {item}</Text>
                  ))
                ) : (
                  <Text style={{ fontSize: 9, color: theme.textSecondary, fontStyle: 'italic' }}>N/A</Text>
                )}
              </View>
              <View style={[styles.perfDivider, { backgroundColor: theme.border }]} />
              <View style={styles.perfCol}>
                <Text style={[styles.perfTitle, { color: '#EF4444' }]}>Needing Support</Text>
                {data?.performanceSummary?.needingSupport?.length > 0 ? (
                  data.performanceSummary.needingSupport.map((item: any, idx: number) => (
                    <Text key={idx} style={[styles.perfStudent, { color: theme.text }]}>{idx + 1}. {item}</Text>
                  ))
                ) : (
                  <Text style={{ fontSize: 9, color: theme.textSecondary, fontStyle: 'italic' }}>None</Text>
                )}
              </View>
            </View>
          )}
          <Pressable 
            onPress={() => onNavigate('performance')}
            style={[styles.fullAnalyticsBtn, { borderColor: colors.primary, borderWidth: 1 }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>View Full Analytics Dashboard</Text>
          </Pressable>
        </Card>

        {/* ================= SCHOOL CALENDAR EVENTS ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>School Calendar Events</Text>
        <Card style={{ marginBottom: 90 }}>
          {events.length > 0 ? (
            events.map((event, idx) => (
              <View key={event._id || idx}>
                <View style={styles.eventItem}>
                  <View style={[styles.eventIconContainer, { backgroundColor: event.color + '15' }]}>
                    <CalIcon size={18} color={event.color} />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                    <Text style={[styles.eventDate, { color: theme.textSecondary }]}>
                      {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.eventTag, { backgroundColor: event.color + '15' }]}>
                    <Text style={[styles.eventTagText, { color: event.color }]}>{event.type}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>No upcoming events</Text>
            </View>
          )}
        </Card>

        {/* ================= LEAVE REQUEST MODAL ================= */}
        {showLeaveModal && (
          <Modal
            visible={showLeaveModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowLeaveModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ width: '90%', maxWidth: 360, backgroundColor: theme.surface, borderRadius: 20, padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text, textTransform: 'uppercase' }}>Apply for Leave</Text>
                  <Pressable onPress={() => setShowLeaveModal(false)} style={{ padding: 4 }}>
                    <X size={18} color={theme.text} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>Leave Type</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {['Casual Leave', 'Sick Leave', 'Personal Leave'].map(t => (
                      <Pressable 
                        key={t}
                        onPress={() => setLeaveType(t)}
                        style={[
                          { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
                          leaveType === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                      >
                        <Text style={{ fontSize: 9, color: leaveType === t ? '#fff' : theme.text, fontWeight: '700' }}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 8, fontSize: 11, color: theme.text, marginBottom: 12 }}
                    placeholder="YYYY-MM-DD"
                    value={leaveFrom}
                    onChangeText={setLeaveFrom}
                  />

                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 8, fontSize: 11, color: theme.text, marginBottom: 12 }}
                    placeholder="YYYY-MM-DD"
                    value={leaveTo}
                    onChangeText={setLeaveTo}
                  />

                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>Reason for Leave</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 8, fontSize: 11, color: theme.text, height: 60, textAlignVertical: 'top', marginBottom: 16 }}
                    placeholder="Explain the reason for leave..."
                    multiline
                    value={leaveReason}
                    onChangeText={setLeaveReason}
                  />

                  <Pressable 
                    onPress={handleApplyLeave}
                    style={{ backgroundColor: colors.primary, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Submit Leave Request</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  schoolName: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  teacherName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 1,
  },
  bellBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  gradientCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#1E3A8A', // Deep blue premium base
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  avatarInfo: {
    marginLeft: 12,
    flex: 1,
  },
  badgeClassName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  badgeRoleName: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 16,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  summaryStatLbl: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 12,
    letterSpacing: 0.2,
  },
  sectionSubtext: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -8,
  },
  horizontalScrollList: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  taskCard: {
    width: 220,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginRight: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  taskIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  taskType: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  taskSub: {
    fontSize: 10,
    marginTop: 2,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    justifyContent: 'flex-start',
  },
  taskActionText: {
    fontSize: 10,
    fontWeight: '800',
    marginRight: 4,
  },
  alertsContainer: {
    marginTop: 10,
  },
  alertsCard: {
    paddingVertical: 8,
  },
  alertItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  alertIconFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextFrame: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  alertHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertStudentName: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  alertDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  alertMeta: {
    fontSize: 8,
    marginTop: 1,
  },
  itemDivider: {
    height: 1,
  },
  portalActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionIconCard: {
    width: '23%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconCardText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  scheduleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  scheduleTimeBox: {
    width: 60,
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
    paddingRight: 8,
  },
  schedTimeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  schedTimeSub: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  scheduleDetails: {
    flex: 1,
    marginLeft: 12,
  },
  schedSubject: {
    fontSize: 12,
    fontWeight: '700',
  },
  schedClass: {
    fontSize: 10,
    marginTop: 1,
  },
  schedActionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgAuthor: {
    fontSize: 11,
  },
  msgTime: {
    fontSize: 8,
    fontWeight: '600',
  },
  msgText: {
    fontSize: 10,
    marginTop: 2,
  },
  unreadDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  noticeCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  noticeCategoryText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  noticeTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  noticeDate: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 8,
  },
  performanceSummaryRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  perfCol: {
    flex: 1,
  },
  perfTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  perfStudent: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  perfDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  fullAnalyticsBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCoverBanner: {
    borderWidth: 1,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventDate: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventTagText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});
