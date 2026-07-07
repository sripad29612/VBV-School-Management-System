import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { 
  Users, BarChart2, FileText, Calendar as CalIcon, Bell, 
  Settings, ArrowRight, BookOpen, AlertCircle, Award, UserCheck, X, ShieldAlert
} from 'lucide-react-native';

interface PrincipalDashboardProps {
  onNavigate: (tab: string) => void;
  teacherStats: {
    present: number;
    late: number;
    leave: number;
    absent: number;
    teacherStatuses: { [name: string]: 'Present' | 'Late' | 'Leave' | 'Absent' };
  };
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onNavigate, teacherStats }) => {
  const { principalData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'Present' | 'Late' | 'Leave' | 'Absent' | null>(null);
  const [todaySubstitutes, setTodaySubstitutes] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const summary = principalData?.dashboard?.summary || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendancePct: 0,
    teacherAttendancePct: 0,
    pendingReports: 0,
    pendingHomework: 0,
    pendingResults: 0
  };

  useEffect(() => {
    const fetchDashboardAdditions = async () => {
      try {
        const res = await api.get('/principal/substitutes');
        const today = new Date().toISOString().split('T')[0];
        const filtered = res.data.filter((item: any) => {
          return today >= item.startDate && today <= item.endDate && item.status === 'Active';
        });
        setTodaySubstitutes(filtered);
      } catch (err) {
        console.error(err);
      }

      setLoadingNotices(true);
      try {
        const res = await api.get('/principal/notifications');
        setNotices(res.data?.slice(0, 3) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNotices(false);
      }
    };
    fetchDashboardAdditions();
  }, []);

  // Filter teachers list by selected status
  const getTeachersByStatus = (status: 'Present' | 'Late' | 'Leave' | 'Absent') => {
    return Object.entries(teacherStats.teacherStatuses)
      .filter(([_, stat]) => stat === status)
      .map(([name]) => name);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return '#10B981';
      case 'Late': return '#F59E0B';
      case 'Leave': return '#3B82F6';
      case 'Absent': return '#EF4444';
      default: return theme.textSecondary;
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* ================= WELCOME BANNER ================= */}
      <View style={[styles.welcomeBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F3E8FF', borderColor: '#6F42C1' }]}>
        <View style={[styles.avatarCircleBig, { backgroundColor: '#6F42C1' }]}>
          <Text style={styles.avatarCircleBigText}>P</Text>
        </View>
        <View style={styles.bannerTextCol}>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome, Principal</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>Vidyabharathi Vidyapeeth Administrator Dashboard</Text>
        </View>
      </View>

      {/* ================= STATS CARD TRIO ================= */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{summary.totalStudents}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Students</Text>
        </Card>
        <Card style={styles.statCard}>
          <Users size={20} color={colors.secondary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{summary.totalTeachers}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Teachers</Text>
        </Card>
        <Card style={styles.statCard}>
          <BookOpen size={20} color={colors.success} />
          <Text style={[styles.statValue, { color: theme.text }]}>{summary.totalClasses}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Classes</Text>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <BarChart2 size={20} color={colors.success} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {summary.todayAttendancePct > 0 ? `${summary.todayAttendancePct}%` : 'No Data'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Student Att. %</Text>
        </Card>
        <Card style={styles.statCard}>
          <BarChart2 size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {summary.totalTeachers > 0 ? `${Math.round(((teacherStats.present + teacherStats.late) / summary.totalTeachers) * 100)}%` : 'No Data'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Teacher Att. %</Text>
        </Card>
        <Card style={styles.statCard}>
          <AlertCircle size={20} color={colors.warning} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {summary.pendingReports > 0 ? summary.pendingReports : 'No Data'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending Reports</Text>
        </Card>
      </View>

      {/* ================= TEACHER STATUS WIDGET ================= */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Teacher Attendance Status</Text>
      <View style={styles.statusGrid}>
        <Pressable 
          onPress={() => setSelectedStatusFilter('Present')}
          style={[styles.statusCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusCountVal, { color: '#10B981' }]}>{teacherStats.present}</Text>
          <Text style={[styles.statusCountLbl, { color: theme.textSecondary }]}>🟢 Present</Text>
        </Pressable>

        <Pressable 
          onPress={() => setSelectedStatusFilter('Late')}
          style={[styles.statusCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.statusCountVal, { color: '#F59E0B' }]}>{teacherStats.late}</Text>
          <Text style={[styles.statusCountLbl, { color: theme.textSecondary }]}>🟡 Late</Text>
        </Pressable>

        <Pressable 
          onPress={() => setSelectedStatusFilter('Leave')}
          style={[styles.statusCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={[styles.statusIndicator, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.statusCountVal, { color: '#3B82F6' }]}>{teacherStats.leave}</Text>
          <Text style={[styles.statusCountLbl, { color: theme.textSecondary }]}>🔵 On Leave</Text>
        </Pressable>

        <Pressable 
          onPress={() => setSelectedStatusFilter('Absent')}
          style={[styles.statusCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.statusCountVal, { color: '#EF4444' }]}>{teacherStats.absent}</Text>
          <Text style={[styles.statusCountLbl, { color: theme.textSecondary }]}>🔴 Absent</Text>
        </Pressable>
      </View>

      {/* ================= TODAY'S SUBSTITUTE TEACHERS ================= */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Substitute Covers</Text>
      <Card style={{ padding: 14 }}>
        {todaySubstitutes.length > 0 ? (
          todaySubstitutes.map((sub: any, idx: number) => (
            <View key={sub.id}>
              <View style={styles.subCoverRow}>
                <View style={[styles.coverBadge, { backgroundColor: colors.primary + '10' }]}>
                  <ShieldAlert size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.coverTitleText, { color: theme.text }]}>
                    {sub.substituteTeacher}
                  </Text>
                  <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                    Covering {sub.originalTeacher} for {sub.assignedClass}
                  </Text>
                </View>
                <View style={styles.coverPeriodBadge}>
                  <Text style={{ fontSize: 8, color: colors.success, fontWeight: '800' }}>ACTIVE</Text>
                </View>
              </View>
              {idx < todaySubstitutes.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center', paddingVertical: 10 }}>
            No substitute cover assignments active today.
          </Text>
        )}
      </Card>

      {/* ================= MODULE PORTAL LINK CARDS ================= */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Portal Management Controls</Text>
      <View style={styles.actionsGrid}>
        <Pressable onPress={() => onNavigate('teachers')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Settings size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Teacher Roster</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('classes')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <BookOpen size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Classes Setup</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('substitutes')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ShieldAlert size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Substitutes & Leaves</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('daily-reports')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FileText size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Lesson Reports</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('timetable')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <CalIcon size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Timetables</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('calendar')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <CalIcon size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Academic Calendar</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('announcements')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Bell size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Announcements</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('reports')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <BarChart2 size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Reports Center</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>

        <Pressable onPress={() => onNavigate('exams')} style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <CalIcon size={22} color="#6F42C1" />
          <Text style={[styles.actionText, { color: theme.text }]}>Exam Schedules</Text>
          <ArrowRight size={14} color={theme.textSecondary} style={styles.arrowIcon} />
        </Pressable>
      </View>

      {/* ================= NOTICES PREVIEW ================= */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent System Notices</Text>
      <Card style={{ padding: 14 }}>
        {loadingNotices ? (
          <ActivityIndicator size="small" color="#6F42C1" style={{ paddingVertical: 10 }} />
        ) : notices.length > 0 ? (
          notices.map((n, idx) => (
            <View key={n._id}>
              <View style={styles.noticeRow}>
                <View style={[styles.bulletPoint, { backgroundColor: n.recipientRole === 'teacher' ? colors.warning : colors.success }]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.noticeTitleText, { color: theme.text }]}>{n.title}</Text>
                  <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                    Audience: {n.recipientRole || 'All'} | {new Date(n.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontSize: 9, color: theme.text, marginTop: 4 }}>{n.message}</Text>
                </View>
              </View>
              {idx < notices.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center', paddingVertical: 10 }}>
            No recent announcements or system notices.
          </Text>
        )}
      </Card>

      {/* ================= TEACHERS STATUS LIST MODAL ================= */}
      {selectedStatusFilter && (
        <Modal
          visible={selectedStatusFilter !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedStatusFilter(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Teachers status: {selectedStatusFilter}
                </Text>
                <Pressable onPress={() => setSelectedStatusFilter(null)} style={styles.closeBtn}>
                  <X size={18} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 250 }}>
                {getTeachersByStatus(selectedStatusFilter).length > 0 ? (
                  getTeachersByStatus(selectedStatusFilter).map(name => (
                    <View key={name} style={styles.teacherStatusRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.statusIndicatorSmall, { backgroundColor: getStatusColor(selectedStatusFilter) }]} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginLeft: 8 }}>
                          {name}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                        {selectedStatusFilter === 'Present' || selectedStatusFilter === 'Late' ? 'Active Today' : 'Unavailable'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center', paddingVertical: 14 }}>
                    No teachers in this status today.
                  </Text>
                )}
              </ScrollView>

              <Pressable 
                onPress={() => setSelectedStatusFilter(null)}
                style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.closeModalBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  avatarCircleBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleBigText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  bannerTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  statusCountVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  statusCountLbl: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    position: 'relative',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 10,
    flex: 1,
    paddingRight: 12,
  },
  arrowIcon: {
    position: 'absolute',
    right: 12,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noticeTitleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  subCoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  coverBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverTitleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  coverPeriodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#D1E7DD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  teacherStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  statusIndicatorSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeModalBtn: {
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  closeModalBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  }
});
