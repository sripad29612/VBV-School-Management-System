import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ProgressRing, BarChart } from '../../components/AnalyticsCharts';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { ArrowLeft, Calendar as CalIcon, Save, CheckCircle, Award, CheckSquare, PlusCircle } from 'lucide-react-native';

interface TeacherAttendanceScreenProps {
  onBack: () => void;
  onRefreshData?: () => void;
}

export const TeacherAttendanceScreen: React.FC<TeacherAttendanceScreenProps> = ({ onBack, onRefreshData }) => {
  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const { user } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const getActiveSubstituteAssignment = () => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const stored = window.localStorage.getItem('substitute_assignments');
    if (!stored) return null;
    const list = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    const teacherName = user?.name || 'Teacher';
    return list.find((item: any) => {
      return item.substituteTeacher === teacherName && today >= item.startDate && today <= item.endDate;
    }) || null;
  };

  const getTeacherClassContext = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const override = window.localStorage.getItem('active_teacher_class_context');
      if (override) {
        const parsed = JSON.parse(override);
        return {
          classId: parsed.classId || 'class_cover_temp_id',
          className: parsed.className || 'Not Assigned',
          isSubstitute: true,
          originalTeacher: parsed.originalTeacher
        };
      }
    }
    return {
      classId: teacherData.dashboard?.assignedClassId || null,
      className: teacherData.dashboard?.assignedClass || 'Not Assigned',
      isSubstitute: false,
      originalTeacher: null
    };
  };

  const classContext = getTeacherClassContext();

  const [registerMode, setRegisterMode] = useState<'Morning' | 'Afternoon'>('Morning');
  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
  
  // Records: { [studentId]: 'Present' | 'Absent' | 'Late' | 'Leave' }
  const [records, setRecords] = useState<{ [id: string]: 'Present' | 'Absent' | 'Late' | 'Leave' }>({});
  const [saving, setSaving] = useState(false);

  const students = teacherData.classStudents || [];

  // Initialize records
  useEffect(() => {
    const initialRecords: any = {};
    students.forEach(s => {
      initialRecords[s._id] = 'Present'; // default to Present
    });
    setRecords(initialRecords);
  }, [teacherData.classStudents]);

  // Productivity: Mark All Present
  const handleMarkAllPresent = () => {
    const updated = { ...records };
    students.forEach(s => {
      updated[s._id] = 'Present';
    });
    setRecords(updated);
  };

  const getStats = () => {
    const total = students.length;
    const present = Object.values(records).filter(v => v === 'Present').length;
    const absent = Object.values(records).filter(v => v === 'Absent').length;
    const late = Object.values(records).filter(v => v === 'Late').length;
    const leave = Object.values(records).filter(v => v === 'Leave').length;
    const unmarked = total - Object.keys(records).length;

    const rate = total > 0 ? ((present + late) / total) * 100 : 100;
    return { total, present, absent, late, leave, unmarked, rate };
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    setRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const formattedRecords = Object.entries(records).map(([studentId, status]) => ({
        studentId,
        status: status === 'Leave' ? 'Absent' : status
      }));

      await api.post('/teacher/attendance', {
        classId: classContext.classId,
        date: attendanceDate,
        records: formattedRecords,
        mode: registerMode
      });

      alert(`Attendance register for ${registerMode} submitted successfully!`);
      if (onRefreshData) onRefreshData();
      onBack();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  const stats = getStats();

  const trendData = [
    { label: 'Mon', value: 92 },
    { label: 'Tue', value: 95 },
    { label: 'Wed', value: 88 },
    { label: 'Thu', value: 91 },
    { label: 'Fri', value: 94 },
  ];

  if (students.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, padding: 16 }]}>
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color={colors.success} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Attendance Register</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>
              {classContext.isSubstitute 
                ? `${classContext.className} (Substitute Cover)` 
                : classContext.className}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Attendance Register"
            message="No students registered in this class."
            iconName="UserCheck"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color={colors.success} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Attendance Register</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>
              {classContext.isSubstitute 
                ? `${classContext.className} (Substitute Cover)` 
                : classContext.className}
            </Text>
          </View>
        </View>

        {/* ================= REGISTER MODE SELECTOR ================= */}
        <View style={[styles.tabBarRow, { backgroundColor: theme.border }]}>
          <Pressable 
            onPress={() => setRegisterMode('Morning')}
            style={[styles.tabItem, registerMode === 'Morning' && { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.tabText, { color: registerMode === 'Morning' ? theme.text : theme.textSecondary }]}>
              Morning Attendance
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setRegisterMode('Afternoon')}
            style={[styles.tabItem, registerMode === 'Afternoon' && { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.tabText, { color: registerMode === 'Afternoon' ? theme.text : theme.textSecondary }]}>
              Afternoon Attendance
            </Text>
          </Pressable>
        </View>

        {/* ================= DATE & CALENDAR BAR ================= */}
        <View style={[styles.attendanceDateBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <CalIcon size={14} color={colors.success} style={{ marginRight: 6 }} />
          <Text style={[styles.attendanceDateText, { color: theme.text }]}>
            {attendanceDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* ================= STATS OVERVIEW ================= */}
        <View style={styles.statsPanel}>
          <Card style={styles.chartCard}>
            <ProgressRing percentage={stats.rate} size={110} strokeWidth={8} color={colors.success} />
          </Card>
          
          <View style={styles.quickGrid}>
            <View style={[styles.statTile, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tileVal, { color: '#2E7D32' }]}>{stats.present}</Text>
              <Text style={[styles.tileLbl, { color: '#388E3C' }]}>Present</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.tileVal, { color: '#C62828' }]}>{stats.absent}</Text>
              <Text style={[styles.tileLbl, { color: '#B71C1C' }]}>Absent</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: '#FFF9C4' }]}>
              <Text style={[styles.tileVal, { color: '#F57F17' }]}>{stats.late}</Text>
              <Text style={[styles.tileLbl, { color: '#FBC02D' }]}>Late</Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: '#E1F5FE' }]}>
              <Text style={[styles.tileVal, { color: '#01579B' }]}>{stats.leave}</Text>
              <Text style={[styles.tileLbl, { color: '#0288D1' }]}>Leave</Text>
            </View>
          </View>
        </View>

        {/* ================= PRODUCTIVITY HEADER ================= */}
        <View style={styles.studentSectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Students List</Text>
          <Pressable 
            onPress={handleMarkAllPresent}
            style={[styles.productivityBtn, { backgroundColor: colors.success + '15' }]}
          >
            <PlusCircle size={14} color={colors.success} style={{ marginRight: 4 }} />
            <Text style={[styles.productivityBtnText, { color: colors.success }]}>Mark All Present</Text>
          </Pressable>
        </View>

        {/* ================= STUDENTS ROSTER ================= */}
        {students.map((student: any) => {
          const currentStatus = records[student._id];
          return (
            <View key={student._id} style={[styles.studentRowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.avatarBadge, { 
                backgroundColor: currentStatus === 'Present' ? '#D1E7DD' 
                  : currentStatus === 'Absent' ? '#F8D7DA' 
                  : currentStatus === 'Late' ? '#FFF3CD' : '#E0F2FE'
              }]}>
                <Text style={[styles.avatarText, { 
                  color: currentStatus === 'Present' ? '#0F5132' 
                    : currentStatus === 'Absent' ? '#842029' 
                    : currentStatus === 'Late' ? '#664D03' : '#0369A1'
                }]}>{student.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.studentName, { color: theme.text }]}>{student.name}</Text>
                <Text style={[styles.studentRoll, { color: theme.textSecondary }]}>Roll No: {student.rollNumber}</Text>
              </View>
              
              <View style={styles.actionPillRow}>
                {[
                  { key: 'Present', val: 'P', bg: '#10B981', color: '#fff' },
                  { key: 'Absent', val: 'A', bg: '#EF4444', color: '#fff' },
                  { key: 'Late', val: 'L', bg: '#F59E0B', color: '#fff' },
                  { key: 'Leave', val: 'Lv', bg: '#06B6D4', color: '#fff' }
                ].map(opt => (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleStatusChange(student._id, opt.key as any)}
                    style={[
                      styles.actionIndicator,
                      {
                        backgroundColor: currentStatus === opt.key ? opt.bg : theme.background,
                        borderColor: currentStatus === opt.key ? opt.bg : theme.border,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.actionIndicatorText,
                      { color: currentStatus === opt.key ? opt.color : theme.textSecondary }
                    ]}>
                      {opt.val}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* ================= TREND GRAPH ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Attendance Trend (Last 5 Days)</Text>
        <Card>
          <BarChart data={trendData} color={colors.success} height={140} />
        </Card>

        {/* ================= SAVE REGISTRY BUTTON ================= */}
        <Pressable 
          onPress={handleSubmit} 
          disabled={saving}
          style={[styles.submitRegisterBtn, { backgroundColor: colors.success, marginBottom: 80 }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit Register</Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subScreenTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  subScreenSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attendanceDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  attendanceDateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartCard: {
    width: '40%',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  quickGrid: {
    width: '56%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statTile: {
    width: '47%',
    height: 60,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  tileLbl: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  studentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  productivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  productivityBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  studentRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
  },
  studentRoll: {
    fontSize: 10,
    marginTop: 1,
  },
  actionPillRow: {
    flexDirection: 'row',
  },
  actionIndicator: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  actionIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
  },
  submitRegisterBtn: {
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  }
});
