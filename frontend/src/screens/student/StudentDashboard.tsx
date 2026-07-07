import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ProgressRing } from '../../components/AnalyticsCharts';
import { 
  Bell, Calendar, FileText, Award, Layers, Clock, ArrowRight, BookOpen, 
  GraduationCap, Sparkles, User, CheckSquare, ShieldCheck, DollarSign
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';

interface StudentDashboardProps {
  onNavigate: (tab: 'dashboard' | 'attendance' | 'homework' | 'results' | 'materials' | 'timetable' | 'idcard' | 'notifications' | 'profile' | 'fees') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const { user } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/student/calendar');
        setEvents(res.data.slice(0, 3) || []);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
      }
    };
    fetchEvents();
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    // Subtle breathing animation for stats cards
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const dData = studentData.dashboard || {
    attendancePct: 0,
    studentName: user?.name || 'Student Name',
    className: 'Not Assigned',
    rollNumber: '--',
    todayTimetable: [],
    recentHomework: [],
    recentNotifications: []
  };

  const pendingHomework = studentData.homework?.filter((h: any) => h.status === 'Pending').length ?? 0;
  const upcomingExams = studentData.results?.length ?? 0;

  // Determine greeting based on current local time
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning ☀️';
    if (hrs < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  // Section details
  const sectionName = studentData.digitalId?.section || 'A';

  return (
    <Animated.View style={[styles.mainContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= GREETING & PROFILE ================= */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
              {dData.studentName}
            </Text>
            <Text style={[styles.classLabel, { color: colors.primary }]}>
              {dData.className && dData.className.startsWith('Class') ? dData.className : `Class ${dData.className}`} · Sec {sectionName} · Roll No {dData.rollNumber}
            </Text>
          </View>
          <Pressable 
            onPress={() => onNavigate('idcard')} 
            style={[styles.profileAvatarBox, { borderColor: theme.border, shadowColor: theme.cardShadow }]}
          >
            {studentData.digitalId?.photo ? (
              <Image source={{ uri: studentData.digitalId.photo }} style={styles.profileAvatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '15' }]}>
                <User size={22} color={colors.primary} />
              </View>
            )}
            <View style={styles.onlineBadge} />
          </Pressable>
        </View>

        {/* ================= MAIN GRADIENT CARD ================= */}
        <View style={[styles.gradientCardContainer, { shadowColor: colors.primary }]}>
          <View style={styles.gradientCardOverlay}>
            <View style={styles.gradientCardLeft}>
              <View style={styles.glassBadge}>
                <Sparkles size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.glassBadgeText}>Current Standing</Text>
              </View>
              <Text style={styles.gradientCardTitle}>Keep up the{'\n'}great progress!</Text>
              
              <View style={styles.gradientStatsRow}>
                <View style={styles.gradStatItem}>
                  <Text style={styles.gradStatNum}>{pendingHomework}</Text>
                  <Text style={styles.gradStatLabel}>Pending HW</Text>
                </View>
                <View style={styles.gradDivider} />
                <View style={styles.gradStatItem}>
                  <Text style={styles.gradStatNum}>{upcomingExams}</Text>
                  <Text style={styles.gradStatLabel}>Upcoming Exams</Text>
                </View>
              </View>
            </View>

            <View style={styles.gradientCardRight}>
              <ProgressRing 
                percentage={dData.attendancePct} 
                size={84} 
                strokeWidth={7} 
                color="#FFFFFF" 
              />
            </View>
          </View>
        </View>

        {/* ================= MONTHLY ATTENDANCE BRIEF CARD ================= */}
        <Pressable 
          onPress={() => onNavigate('attendance')} 
          style={[styles.monthlyCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}
        >
          <View style={styles.monthlyHeader}>
            <View style={styles.monthlyTitleGroup}>
              <CheckSquare size={16} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={[styles.monthlyTitle, { color: theme.text }]}>Attendance Summary</Text>
            </View>
            <ArrowRight size={14} color={theme.textSecondary} />
          </View>
          <View style={styles.monthlyProgressContainer}>
            <View style={styles.monthlyBarBg}>
              <View style={[styles.monthlyBarFill, { width: `${dData.attendancePct}%`, backgroundColor: colors.secondary }]} />
            </View>
            <View style={styles.monthlyLabelRow}>
              <Text style={[styles.monthlyProgressText, { color: theme.textSecondary }]}>Overall Attendance Rate</Text>
              <Text style={[styles.monthlyPctText, { color: colors.secondary }]}>{dData.attendancePct.toFixed(1)}%</Text>
            </View>
          </View>
        </Pressable>

        {/* ================= QUICK ACTIONS GRID ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {[
            { label: 'Attendance', tab: 'attendance', icon: CheckSquare, bg: '#EFF6FF', color: '#2563EB' },
            { label: 'Homework', tab: 'homework', icon: FileText, bg: '#FFF7ED', color: '#F97316' },
            { label: 'Results', tab: 'results', icon: Award, bg: '#ECFDF5', color: '#10B981' },
            { label: 'Materials', tab: 'materials', icon: Layers, bg: '#F5F3FF', color: '#8B5CF6' },
            { label: 'Timetable', tab: 'timetable', icon: Clock, bg: '#FFF1F2', color: '#F43F5E' },
            { label: 'Digital ID', tab: 'idcard', icon: GraduationCap, bg: '#F0FDFA', color: '#0D9488' },
            { label: 'Fee Account', tab: 'fees', icon: DollarSign, bg: '#FEE2E2', color: '#EF4444' }
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={idx}
                onPress={() => onNavigate(action.tab as any)}
                style={({ pressed }) => [
                  styles.actionCard,
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.border, 
                    shadowColor: theme.cardShadow,
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                  <Icon size={20} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ================= ANNOUNCEMENT CARD ================= */}
        {dData.recentNotifications?.length > 0 && (
          <View style={styles.noticeSection}>
            <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 12 }]}>Latest Announcement</Text>
            <Pressable 
              onPress={() => onNavigate('notifications')}
              style={[styles.noticeCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}
            >
              <View style={[styles.noticeIconCircle, { backgroundColor: colors.warning + '15' }]}>
                <Bell size={18} color={colors.warning} />
              </View>
              <View style={styles.noticeContent}>
                <View style={styles.noticeHeaderRow}>
                  <Text style={[styles.noticeBadge, { backgroundColor: colors.warning + '20', color: colors.warning }]} numberOfLines={1}>
                    {dData.recentNotifications[0].recipientRole?.toUpperCase() || 'BROADCAST'}
                  </Text>
                  <Text style={[styles.noticeTime, { color: theme.textSecondary }]}>
                    {new Date(dData.recentNotifications[0].createdAt).toLocaleDateString('en-GB')}
                  </Text>
                </View>
                <Text style={[styles.noticeTitle, { color: theme.text }]} numberOfLines={1}>
                  {dData.recentNotifications[0].title}
                </Text>
                <Text style={[styles.noticeDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                  {dData.recentNotifications[0].message}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ================= TODAY'S CLASSES TIMELINE ================= */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 0 }]}>Today's Classes</Text>
            <Pressable onPress={() => onNavigate('timetable')}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>Full Schedule</Text>
            </Pressable>
          </View>

          {dData.todayTimetable?.length > 0 ? (
            <View style={[styles.timelineBox, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
              {dData.todayTimetable.slice(0, 3).map((period: any, idx: number) => {
                const colorsArr = ['#2563EB', '#F97316', '#10B981', '#8B5CF6'];
                const indicatorColor = colorsArr[idx % colorsArr.length];
                return (
                  <View key={idx} style={[styles.timelineItem, idx === 2 && styles.noBorder]}>
                    <View style={styles.timelineLeft}>
                      <Text style={[styles.timelineTime, { color: theme.text }]}>{period.startTime}</Text>
                      <Text style={[styles.timelineDuration, { color: theme.textSecondary }]}>Period {idx + 1}</Text>
                    </View>
                    <View style={[styles.timelineIndicator, { backgroundColor: indicatorColor }]} />
                    <View style={styles.timelineRight}>
                      <Text style={[styles.timelineSubject, { color: theme.text }]}>{period.subject?.name || 'Class Period'}</Text>
                      <Text style={[styles.timelineTeacher, { color: theme.textSecondary }]}>
                        {period.teacher?.name || 'Assigned Instructor'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyTimelineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Clock size={28} color={theme.textSecondary} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyTimelineText, { color: theme.textSecondary }]}>No periods scheduled for today</Text>
            </View>
          )}
        </View>

        {/* ================= RECENT ACTIVITY & UPCOMING EVENTS ================= */}
        <View style={styles.activitiesSection}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>School Calendar Events</Text>
          <View style={[styles.eventsCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            {events.length > 0 ? (
              events.map((event, idx) => (
                <View key={event._id || idx} style={[styles.eventItem, idx === events.length - 1 && styles.noBorder]}>
                  <View style={[styles.eventIconContainer, { backgroundColor: event.color + '15' }]}>
                    <Calendar size={18} color={event.color} />
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
              ))
            ) : (
              <Text style={{ fontSize: 12, color: theme.textSecondary, padding: 16, textAlign: 'center', fontWeight: '600' }}>
                No upcoming events
              </Text>
            )}
          </View>
        </View>

      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // bottom padding for Bottom Navigation Bar
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginVertical: 2,
  },
  classLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  gradientCardContainer: {
    height: 150,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    // Modern CSS gradient style for react-native-web
    ...({
      backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
    } as any),
    backgroundColor: '#2563EB', // native fallback
  },
  gradientCardOverlay: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  gradientCardLeft: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
  },
  glassBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  glassBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  gradientCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    marginVertical: 10,
  },
  gradientStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradStatItem: {
    marginRight: 16,
  },
  gradStatNum: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  gradStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  gradDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: 16,
  },
  gradientCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthlyCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  monthlyProgressContainer: {
    width: '100%',
  },
  monthlyBarBg: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  monthlyBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  monthlyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyProgressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthlyPctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginVertical: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '31%',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  noticeSection: {
    width: '100%',
  },
  noticeCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  noticeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  noticeContent: {
    flex: 1,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeBadge: {
    fontSize: 9,
    fontWeight: '800',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  noticeTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  noticeDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  timelineSection: {
    width: '100%',
    marginTop: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '800',
  },
  timelineBox: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  timelineLeft: {
    width: 60,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '800',
  },
  timelineDuration: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  timelineIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginHorizontal: 16,
  },
  timelineRight: {
    flex: 1,
  },
  timelineSubject: {
    fontSize: 13,
    fontWeight: '800',
  },
  timelineTeacher: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyTimelineCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTimelineText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activitiesSection: {
    width: '100%',
    marginTop: 10,
  },
  eventsCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  eventDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  eventTag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
