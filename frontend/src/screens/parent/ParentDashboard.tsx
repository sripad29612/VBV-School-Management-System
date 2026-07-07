import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { 
  Bell, Calendar as CalIcon, User, BookOpen, Clock, Heart, Award, ArrowRight, Shield, Video, MapPin, Phone,
  AlertCircle, CheckSquare, FileText, CreditCard, Users, ChevronRight, MessageSquare
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';

interface ParentDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectChild: (childId: string) => void;
  chatHistory?: any[];
  firstContactName?: string;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onNavigate, onSelectChild, chatHistory, firstContactName }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/parent/calendar');
        setEvents(res.data.slice(0, 2) || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

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
  }, [parentData.selectedChildId]);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning ☀️';
    if (hrs < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const pDashboard = parentData.dashboard || {
    children: [],
    notifications: []
  };

  if (!pDashboard.children || pDashboard.children.length === 0) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.schoolName, { color: colors.primary }]}>VIDYA BHARATHI VIDYAPEETH</Text>
            <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.parentName, { color: theme.text }]}>Hello, {user?.name || 'Parent'}</Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Children Registry"
            message="No children linked."
            iconName="Users"
          />
        </View>
      </Animated.View>
    );
  }

  const activeChild = pDashboard.children.find((c: any) => c._id === parentData.selectedChildId) || pDashboard.children[0];

  const realBalance = activeChild.feePending || 0;
  const totalAmount = parentData.fees?.totalAmount || 0;
  const paidAmount = parentData.fees?.paidAmount || 0;
  const progressPct = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ================= GREETING & LOGO ================= */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.schoolName, { color: colors.primary }]}>VIDYA BHARATHI VIDYAPEETH</Text>
            <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.parentName, { color: theme.text }]}>Hello, {user?.name || 'Parent'}</Text>
          </View>
          <Pressable onPress={() => onNavigate('notifications')} style={[styles.bellBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Bell size={20} color={colors.primary} />
            <View style={styles.unreadDot} />
          </Pressable>
        </View>

        {/* ================= HORIZONTAL CHILD SELECTOR ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 15 }]}>Select Child</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.childListContainer}
        >
          {pDashboard.children?.map((child: any) => {
            const isSelected = child._id === parentData.selectedChildId;
            return (
              <Pressable
                key={child._id}
                onPress={() => onSelectChild(child._id)}
                style={[
                  styles.childCard,
                  { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow },
                  isSelected && { borderColor: colors.primary, borderWidth: 2 }
                ]}
              >
                <View style={styles.childHeader}>
                  {child.photo ? (
                    <Image source={{ uri: child.photo }} style={styles.childPhoto as any} />
                  ) : (
                    <View style={[styles.childAvatarFallback, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.childInitial, { color: colors.primary }]}>{child.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.childHeaderRight}>
                    <Text style={[styles.childNameText, { color: theme.text }]} numberOfLines={1}>{child.name}</Text>
                    <Text style={[styles.childMetaText, { color: theme.textSecondary }]}>
                      {child.class && child.class.startsWith('Class') ? child.class : `Class ${child.class}`} · Sec {child.section || 'A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.childStatsRow}>
                  <View style={styles.childStatBadge}>
                    <Text style={[styles.statBadgeNum, { color: colors.primary }]}>{child.attendancePct.toFixed(0)}%</Text>
                    <Text style={[styles.statBadgeLabel, { color: theme.textSecondary }]}>Att.</Text>
                  </View>
                  <View style={styles.childStatBadge}>
                    <Text style={[styles.statBadgeNum, { color: colors.secondary }]}>{child.pendingHomework}</Text>
                    <Text style={[styles.statBadgeLabel, { color: theme.textSecondary }]}>HW Pending</Text>
                  </View>
                  <View style={styles.childStatBadge}>
                    <Text style={[styles.statBadgeNum, { color: colors.success }]}>₹{child.feePending.toLocaleString()}</Text>
                    <Text style={[styles.statBadgeLabel, { color: theme.textSecondary }]}>Due</Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>ACTIVE</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ================= PREMIUM ORANGE FEE CARD ================= */}
        <View style={[styles.feeCardContainer, { shadowColor: colors.secondary }]}>
          <View style={styles.feeOverlay}>
            <View style={styles.feeTopRow}>
              <View>
                <Text style={styles.feeHeaderLabel}>NEXT DUE</Text>
                <Text style={styles.feeAmountText}>₹{realBalance.toLocaleString()}</Text>
              </View>
              <View style={styles.feeDueDateBadge}>
                <AlertCircle size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.feeDueDateText}>
                  {parentData.fees?.dueDate ? `Due ${new Date(parentData.fees.dueDate).toLocaleDateString('en-GB')}` : 'Due in 8 Days'}
                </Text>
              </View>
            </View>

            <View style={styles.feeMiddleRow}>
              <View style={styles.feeProgressInfo}>
                <Text style={styles.feeProgressText}>Payment Progress</Text>
                <Text style={styles.feeProgressPercent}>{progressPct}% Completed</Text>
              </View>
              <View style={styles.feeProgressBg}>
                <View style={[styles.feeProgressFill, { width: `${progressPct}%`, backgroundColor: '#FFFFFF' }]} />
              </View>
            </View>

            <View style={styles.feeBottomRow}>
              <Text style={styles.outstandingText}>Total Balance: ₹{realBalance.toLocaleString()}</Text>
              <Pressable onPress={() => onNavigate('fees')} style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ================= QUICK ACTIONS GRID (8 Grid) ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Portal Modules</Text>
        <View style={styles.quickActionsGrid}>
          {[
            { label: 'Attendance', tab: 'attendance', icon: CheckSquare, bg: '#EFF6FF', color: '#2563EB' },
            { label: 'Homework', tab: 'homework', icon: FileText, bg: '#FFF7ED', color: '#F97316' },
            { label: 'Results', tab: 'results', icon: Award, bg: '#ECFDF5', color: '#10B981' },
            { label: 'Fees details', tab: 'fees', icon: CreditCard, bg: '#FEF2F2', color: '#EF4444' },
            { label: 'Transport', tab: 'transport', icon: MapPin, bg: '#F5F3FF', color: '#8B5CF6' },
            { label: 'Teachers', tab: 'teachers', icon: Users, bg: '#FFF1F2', color: '#F43F5E' },
            { label: 'Calendar', tab: 'calendar', icon: CalIcon, bg: '#F0FDFA', color: '#0D9488' },
            { label: 'Classroom', tab: 'classroom', icon: Video, bg: '#F0F9FF', color: '#0284C7' },
            { label: 'Exams', tab: 'exams', icon: Award, bg: '#FFF9F0', color: '#FF9500' }
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={idx}
                onPress={() => onNavigate(action.tab)}
                style={({ pressed }) => [
                  styles.actionGridCard,
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.border, 
                    shadowColor: theme.cardShadow,
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: action.bg }]}>
                  <Icon size={20} color={action.color} />
                </View>
                <Text style={[styles.actionGridLabel, { color: theme.text }]} numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ================= LIVE CLASSROOM SECURITY CARD ================= */}
        <View style={styles.liveSection}>
          <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 12 }]}>Live Classroom Surveillance</Text>
          <View style={[styles.liveCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            <View style={styles.liveImageContainer}>
              <View style={styles.classroomImgPlaceholder}>
                <Video size={40} color="rgba(255,255,255,0.7)" />
              </View>
              <View style={styles.liveIndicatorBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveIndicatorText}>LIVE NOW 🔴</Text>
              </View>
            </View>

            <View style={styles.liveDetailsContainer}>
              <View style={styles.liveInfoHeader}>
                <Text style={[styles.liveClassText, { color: theme.text }]}>{activeChild.class && activeChild.class.startsWith('Class') ? activeChild.class : `Class ${activeChild.class}`}-{activeChild.section || 'B'}</Text>
                <Text style={[styles.liveTimeText, { color: theme.textSecondary }]}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={styles.liveMetaInfoRow}>
                <Text style={[styles.liveTeacherLabel, { color: theme.textSecondary }]}>Teacher: <Text style={{ color: theme.text, fontWeight: '700' }}>{activeChild.classTeacherName || 'Class Teacher'}</Text></Text>
                <Text style={[styles.livePresentLabel, { color: theme.textSecondary }]}>Attendance: <Text style={{ color: colors.success, fontWeight: '800' }}>{activeChild.attendancePct ? `${Math.round(activeChild.attendancePct)}%` : '0%'}</Text></Text>
              </View>
              <Pressable onPress={() => onNavigate('classroom')} style={styles.viewLiveButton}>
                <Text style={styles.viewLiveText}>View Live Stream</Text>
                <ChevronRight size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ================= TEACHER CHAT ALERT SNIPPET ================= */}
        <Pressable 
          onPress={() => onNavigate('chat')} 
          style={[styles.chatSnippetCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}
        >
          <View style={[styles.chatAvatarBox, { backgroundColor: colors.primary + '12' }]}>
            <MessageSquare size={18} color={colors.primary} />
          </View>
          <View style={styles.chatSnippetInfo}>
            <Text style={[styles.chatTeacherName, { color: theme.text }]}>{firstContactName || activeChild.classTeacherName || 'Class Teacher'} (Class Teacher)</Text>
            <Text style={[styles.chatTextMsg, { color: theme.textSecondary }]} numberOfLines={1}>
              {chatHistory && chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].message : 'No messages available.'}
            </Text>
          </View>
          {chatHistory && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender !== user?._id && (
            <View style={styles.chatUnreadCountBox}>
              <Text style={styles.chatUnreadText}>1</Text>
            </View>
          )}
        </Pressable>

        {/* ================= UPCOMING EVENTS SUMMARY ================= */}
        <View style={styles.eventsSection}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Recent Events & Calendar</Text>
          <View style={[styles.eventsListCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            {events.length > 0 ? (
              events.map((ev, index) => (
                <View key={index} style={[styles.eventItem, index === events.length - 1 && styles.noBorder]}>
                  <View style={[styles.eventIconCircle, { backgroundColor: ev.color + '15' }]}>
                    <CalIcon size={16} color={ev.color} />
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>{ev.title}</Text>
                    <Text style={[styles.eventTime, { color: theme.textSecondary }]}>{ev.date}</Text>
                  </View>
                  <View style={[styles.eventBadge, { backgroundColor: ev.color + '15' }]}>
                    <Text style={[styles.eventBadgeText, { color: ev.color }]}>{ev.type}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>No upcoming events</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  parentName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  bellBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginVertical: 10,
  },
  childListContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  childCard: {
    width: 250,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  childPhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  childAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInitial: {
    fontSize: 16,
    fontWeight: '900',
  },
  childHeaderRight: {
    flex: 1,
    marginLeft: 10,
  },
  childNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  childMetaText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  childStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  childStatBadge: {
    alignItems: 'center',
  },
  statBadgeNum: {
    fontSize: 12,
    fontWeight: '900',
  },
  statBadgeLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: colors.primary + '18',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectedIndicatorText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
  },
  feeCardContainer: {
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    ...({
      backgroundImage: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    } as any),
    backgroundColor: '#F97316', // Fallback
  },
  feeOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  feeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feeHeaderLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  feeAmountText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  feeDueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  feeDueDateText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  feeMiddleRow: {
    width: '100%',
  },
  feeProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  feeProgressText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  feeProgressPercent: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  feeProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  feeProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  feeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outstandingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  payNowButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payNowButtonText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '900',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionGridCard: {
    width: '23%',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionGridLabel: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  liveSection: {
    width: '100%',
    marginVertical: 10,
  },
  liveCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  liveImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  classroomImgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  liveIndicatorBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  liveDetailsContainer: {
    padding: 16,
  },
  liveInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveClassText: {
    fontSize: 14,
    fontWeight: '900',
  },
  liveTimeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  liveMetaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  liveTeacherLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  livePresentLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  viewLiveButton: {
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  viewLiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  chatSnippetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    marginVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  chatAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatSnippetInfo: {
    flex: 1,
    paddingRight: 6,
  },
  chatTeacherName: {
    fontSize: 12,
    fontWeight: '800',
  },
  chatTextMsg: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  chatUnreadCountBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatUnreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  eventsSection: {
    width: '100%',
    marginTop: 10,
  },
  eventsListCard: {
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
  noBorder: {
    borderBottomWidth: 0,
  },
  eventIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
    paddingRight: 4,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  eventBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
