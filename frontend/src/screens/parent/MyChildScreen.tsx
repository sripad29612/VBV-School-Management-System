import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ProgressRing } from '../../components/AnalyticsCharts';
import { 
  User, CheckSquare, BookOpen, AlertCircle, ShieldAlert, Heart, 
  MapPin, Video, Award, ChevronRight, Activity, FileText
} from 'lucide-react-native';

interface MyChildScreenProps {
  onNavigate: (tab: string) => void;
}

export const MyChildScreen: React.FC<MyChildScreenProps> = ({ onNavigate }) => {
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, [parentData.selectedChildId]);

  const pDashboard = parentData.dashboard || { children: [] };
  
  const activeChild = pDashboard.children?.find((c: any) => c._id === parentData.selectedChildId) || pDashboard.children?.[0] || {
    _id: '',
    name: '',
    class: '',
    section: '',
    rollNumber: '',
    attendancePct: 0,
    pendingHomework: 0,
    feePending: 0,
    photo: '',
    classTeacherName: 'Class Teacher'
  };

  const resultsList = parentData.results || [];
  const latestPct = resultsList.length > 0 ? resultsList[0].percentage : null;
  const latestGrade = resultsList.length > 0 ? resultsList[0].grade : '--';

  // Custom SVG graph values for the performance trend
  const performanceTrend = resultsList.length > 0
    ? resultsList.slice().reverse().map((r: any) => ({
        term: r.examType,
        score: r.percentage
      }))
    : [];

  const graphWidth = 320;
  const graphHeight = 110;
  const paddingX = 40;
  const paddingY = 15;

  const points = performanceTrend.length > 0 ? performanceTrend.map((d, index) => {
    const x = paddingX + (index * (graphWidth - paddingX * 2)) / Math.max(1, performanceTrend.length - 1);
    const y = graphHeight - paddingY - ((d.score - 50) * (graphHeight - paddingY * 2)) / 50; // scale 50-100
    return { x, y, label: d.term, val: d.score };
  }) : [];

  const linePath = points.length > 0 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Student Profile</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Child credentials & performance reports</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <User size={20} color={colors.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= BIO CARD ================= */}
        <View style={[styles.bioCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          {activeChild.photo ? (
            <Image source={{ uri: activeChild.photo }} style={styles.bioPhoto} />
          ) : (
            <View style={[styles.bioAvatarFallback, { backgroundColor: colors.primary + '15' }]}>
              <User size={30} color={colors.primary} />
            </View>
          )}
          <View style={styles.bioInfo}>
            <Text style={[styles.bioName, { color: theme.text }]}>{activeChild.name}</Text>
            <Text style={[styles.bioClass, { color: colors.primary }]}>
              {activeChild.class && activeChild.class.startsWith('Class') ? activeChild.class : `Class ${activeChild.class}`} - Section {activeChild.section || 'B'}
            </Text>
            <View style={styles.bioMetaGrid}>
              <View style={styles.bioMetaCol}>
                <Text style={[styles.bioMetaHeader, { color: theme.textSecondary }]}>Roll No</Text>
                <Text style={[styles.bioMetaVal, { color: theme.text }]}>{activeChild.rollNumber}</Text>
              </View>
              <View style={styles.bioMetaCol}>
                <Text style={[styles.bioMetaHeader, { color: theme.textSecondary }]}>Admission ID</Text>
                <Text style={[styles.bioMetaVal, { color: theme.text }]}>ADM-2026-{activeChild.rollNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= TELEMETRY CARD GRID ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Child Telemetry</Text>
        <View style={styles.telemetryGrid}>
          {[
            { title: 'Attendance', val: activeChild.attendancePct ? `${activeChild.attendancePct.toFixed(0)}%` : '0%', desc: 'Rate', color: '#2563EB', icon: CheckSquare, tab: 'attendance' },
            { title: 'Homework', val: `${activeChild.pendingHomework || 0} Left`, desc: 'Unsubmitted', color: '#F97316', icon: FileText, tab: 'homework' },
            { title: 'Academic', val: latestPct !== null ? `${latestPct}%` : 'N/A', desc: `Grade ${latestGrade}`, color: '#10B981', icon: Award, tab: 'results' },
            { title: 'Behaviour', val: 'Good', desc: '0 Warnings', color: '#8B5CF6', icon: ShieldAlert, tab: 'chat' },
            { title: 'Health Logs', val: activeChild.bloodGroup || 'N/A', desc: 'Normal BMI', color: '#F43F5E', icon: Heart, tab: 'profile' },
            { title: 'Transport', val: activeChild.transport?.route || 'Not Set', desc: activeChild.transport?.vehicleNumber || 'No Bus', color: '#06B6D4', icon: MapPin, tab: 'transport' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={idx}
                onPress={() => onNavigate(item.tab)}
                style={[
                  styles.telemetryCard,
                  { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }
                ]}
              >
                <View style={[styles.telemetryIconContainer, { backgroundColor: item.color + '10' }]}>
                  <Icon size={18} color={item.color} />
                </View>
                <View style={styles.telemetryTextContainer}>
                  <Text style={[styles.telemetryTitle, { color: theme.textSecondary }]}>{item.title}</Text>
                  <Text style={[styles.telemetryValue, { color: theme.text }]}>{item.val}</Text>
                  <Text style={[styles.telemetryDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ================= PERFORMANCE GRAPH ================= */}
        <View style={[styles.performanceCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.performanceHeader}>
            <Activity size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.performanceTitle, { color: theme.text }]}>Academic Growth (Average %)</Text>
          </View>
          <View style={styles.graphContainer}>
            {performanceTrend.length > 0 ? (
              <svg width="100%" height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
                {/* Y Axis Grid lines */}
                <line x1={paddingX} y1={paddingY} x2={graphWidth - paddingX} y2={paddingY} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />
                <line x1={paddingX} y1={graphHeight / 2} x2={graphWidth - paddingX} y2={graphHeight / 2} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />
                <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - paddingX} y2={graphHeight - paddingY} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />

                {/* Path Line */}
                <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />

                {/* Data circles */}
                {points.map((p: any, i: number) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke={colors.primary} strokeWidth="2.5" />
                    <text x={p.x} y={p.y - 8} fontSize="8" fill={theme.text} fontWeight="700" textAnchor="middle">
                      {p.val}%
                    </text>
                    <text x={p.x} y={graphHeight - 2} fontSize="9" fill={theme.textSecondary} fontWeight="600" textAnchor="middle">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', height: graphHeight }}>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>No academic growth records available yet.</Text>
              </View>
            )}
          </View>
        </View>

        {/* ================= TEACHER REMARKS ================= */}
        <View style={[styles.remarksCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <Text style={[styles.remarksHeader, { color: theme.textSecondary }]}>CLASS TEACHER FEEDBACK</Text>
          <Text style={[styles.remarksTitle, { color: theme.text }]}>{activeChild.classTeacherName || 'Class Teacher'} Remarks</Text>
          <Text style={[styles.remarksBodyText, { color: theme.textSecondary }]}>
            No teacher feedback recorded yet.
          </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  bioPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bioAvatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioInfo: {
    flex: 1,
    marginLeft: 16,
  },
  bioName: {
    fontSize: 16,
    fontWeight: '900',
  },
  bioClass: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  bioMetaGrid: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  bioMetaCol: {
    justifyContent: 'center',
  },
  bioMetaHeader: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bioMetaVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginVertical: 10,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  telemetryCard: {
    width: '48%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  telemetryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  telemetryTextContainer: {
    flex: 1,
  },
  telemetryTitle: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '900',
    marginVertical: 2,
  },
  telemetryDesc: {
    fontSize: 9,
    fontWeight: '600',
  },
  performanceCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  graphContainer: {
    width: '100%',
    alignItems: 'center',
  },
  remarksCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  remarksHeader: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  remarksTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  remarksBodyText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
