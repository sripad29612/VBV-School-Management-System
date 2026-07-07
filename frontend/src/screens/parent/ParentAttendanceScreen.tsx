import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ProgressRing } from '../../components/AnalyticsCharts';
import { ArrowLeft, Calendar as CalIcon, ChevronLeft, ChevronRight, Award, AlertCircle } from 'lucide-react-native';
import { SubScreenChildSwitcher } from '../../components/SubScreenChildSwitcher';
import { EmptyState } from '../../components/EmptyState';

interface ParentAttendanceScreenProps {
  onBack: () => void;
  onSelectChild?: (childId: string) => void;
}

export const ParentAttendanceScreen: React.FC<ParentAttendanceScreenProps> = ({ onBack, onSelectChild }) => {
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const attendanceRecords = parentData.attendance || [];

  const getStats = () => {
    let records = [...attendanceRecords];
    const now = new Date();

    if (timeframe === 'monthly') {
      records = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });
    } else if (timeframe === 'quarterly') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      records = records.filter(r => new Date(r.date) >= threeMonthsAgo);
    }

    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const leave = records.filter(r => r.status === 'Late').length;
    const total = present + absent + leave;
    const attendancePct = total > 0 ? ((present + leave * 0.5) / total) * 100 : 0;

    return { present, absent, leave, total, attendancePct };
  };

  const stats = getStats();

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Child Attendance</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Overview & daily logs</Text>
          </View>
        </View>
        {onSelectChild && parentData.dashboard?.children && (
          <SubScreenChildSwitcher
            children={parentData.dashboard.children}
            selectedChildId={parentData.selectedChildId}
            onSelectChild={onSelectChild!}
            theme={theme}
          />
        )}
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Child Attendance"
            message="No attendance records available yet."
            iconName="Calendar"
          />
        </View>
      </View>
    );
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper to draw SVG line chart
  const getTrendData = () => {
    if (timeframe === 'yearly') {
      return [
        { label: 'Jan', val: 95 }, { label: 'Feb', val: 92 }, { label: 'Mar', val: 96 },
        { label: 'Apr', val: 90 }, { label: 'May', val: 93 }, { label: 'Jun', val: 94 }
      ];
    }
    return [
      { label: 'Wk 1', val: 100 }, { label: 'Wk 2', val: 80 },
      { label: 'Wk 3', val: 95 }, { label: 'Wk 4', val: 100 }
    ];
  };

  const trendData = getTrendData();
  const graphWidth = 320;
  const graphHeight = 80;
  const paddingX = 35;
  const paddingY = 12;
  const points = trendData.map((d, index) => {
    const x = paddingX + (index * (graphWidth - paddingX * 2)) / (trendData.length - 1);
    const y = graphHeight - paddingY - ((d.val - 50) * (graphHeight - paddingY * 2)) / 50; // scale 50-100
    return { x, y, label: d.label, val: d.val };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Calendar calculations
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    // Empty spaces for previous month's alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDateBox} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = attendanceRecords.find(r => r.date.startsWith(dateString));
      
      let boxBg = theme.surface;
      let textColor = theme.text;
      
      if (record) {
        if (record.status === 'Present') {
          boxBg = colors.success + '15';
          textColor = colors.success;
        } else if (record.status === 'Absent') {
          boxBg = colors.danger + '15';
          textColor = colors.danger;
        } else if (record.status === 'Late') {
          boxBg = colors.warning + '15';
          textColor = colors.warning;
        }
      }

      days.push(
        <View key={d} style={[styles.calendarDateBox, { backgroundColor: boxBg }]}>
          <Text style={[styles.calendarDateText, { color: textColor }]}>{d}</Text>
        </View>
      );
    }

    return days;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Attendance History</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Child classroom logs tracker</Text>
        </View>
        <CalIcon size={20} color={colors.primary} />
      </View>

      {onSelectChild && parentData.dashboard?.children && (
        <SubScreenChildSwitcher
          children={parentData.dashboard.children}
          selectedChildId={parentData.selectedChildId}
          onSelectChild={onSelectChild}
          theme={theme}
        />
      )}

      {/* ================= TIMEFRAME SWITCHER ================= */}
      <View style={styles.timeframeRow}>
        {(['monthly', 'quarterly', 'yearly'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTimeframe(t)}
            style={[
              styles.timeframePill,
              { backgroundColor: timeframe === t ? colors.primary : theme.surface, borderColor: colors.primary }
            ]}
          >
            <Text style={[styles.timeframeText, { color: timeframe === t ? '#FFFFFF' : colors.primary }]}>
              {t.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ================= CIRCULAR PROGRESS RATE ================= */}
      <View style={[styles.rateCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <View style={styles.rateLeft}>
          <ProgressRing percentage={stats.attendancePct} size={90} color={colors.primary} />
        </View>
        <View style={styles.rateRight}>
          <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>AVERAGE ATTENDANCE</Text>
          <Text style={[styles.ratePct, { color: theme.text }]}>{stats.attendancePct.toFixed(1)}%</Text>
          <View style={[styles.statusBadge, { backgroundColor: stats.attendancePct >= 85 ? colors.success + '15' : colors.danger + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: stats.attendancePct >= 85 ? colors.success : colors.danger }]}>
              {stats.attendancePct >= 85 ? 'EXCELLENT RATE' : 'ATTENTION REQUIRED'}
            </Text>
          </View>
        </View>
      </View>

      {/* ================= COUNTS GRID ================= */}
      <View style={styles.countsRow}>
        {[
          { label: 'Present Days', count: stats.present, color: colors.success },
          { label: 'Absent Days', count: stats.absent, color: colors.danger },
          { label: 'Late/Leave', count: stats.leave, color: colors.warning }
        ].map((item, index) => (
          <View key={index} style={[styles.countCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            <Text style={[styles.countVal, { color: item.color }]}>{item.count}</Text>
            <Text style={[styles.countLabel, { color: theme.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ================= SVG TREND CHART ================= */}
      <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>Attendance Rate Trend (%)</Text>
        <View style={styles.svgContainer}>
          <svg width="100%" height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
            <line x1={paddingX} y1={paddingY} x2={graphWidth - paddingX} y2={paddingY} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />
            <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - paddingX} y2={graphHeight - paddingY} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />
            <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="2.5" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke={colors.primary} strokeWidth="2" />
                <text x={p.x} y={p.y - 7} fontSize="8" fill={theme.text} fontWeight="700" textAnchor="middle">{p.val}%</text>
                <text x={p.x} y={graphHeight - 2} fontSize="8" fill={theme.textSecondary} fontWeight="600" textAnchor="middle">{p.label}</text>
              </g>
            ))}
          </svg>
        </View>
      </View>

      {/* ================= CALENDAR GRID ================= */}
      {timeframe === 'monthly' && (
        <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
              <ChevronLeft size={16} color={theme.text} />
            </Pressable>
            <Text style={[styles.calendarMonthText, { color: theme.text }]}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.navBtn}>
              <ChevronRight size={16} color={theme.text} />
            </Pressable>
          </View>

          {/* Week labels */}
          <View style={styles.weekLabelsRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, index) => (
              <Text key={index} style={[styles.weekLabelText, { color: theme.textSecondary }]}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 90,
  },
  header: {
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  subScreenTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subScreenSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  timeframeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  timeframePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rateCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  rateLeft: {
    marginRight: 16,
  },
  rateRight: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratePct: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  countsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  countCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  countVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  countLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  chartCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 12,
  },
  svgContainer: {
    width: '100%',
    alignItems: 'center',
  },
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: '800',
  },
  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekLabelText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDateBox: {
    width: '14.28%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 8,
  },
  calendarDateText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
