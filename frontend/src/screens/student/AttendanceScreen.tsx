import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ProgressRing } from '../../components/AnalyticsCharts';
import { 
  ArrowLeft, Calendar as CalIcon, ChevronLeft, ChevronRight, TrendingUp, Info
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface AttendanceScreenProps {
  onBack: () => void;
}

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ onBack }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // View state: 'monthly' | 'quarterly' | 'yearly'
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  // Selected calendar month/year
  const [currentDate, setCurrentDate] = useState(new Date());

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
  }, []);

  const attendanceRecords = studentData.attendance || [];
  
  // Aggregate stats based on selected timeframe
  const getStats = () => {
    let records = [...attendanceRecords];
    const now = new Date();

    if (timeframe === 'monthly') {
      // Filter for currently selected month
      records = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });
    } else if (timeframe === 'quarterly') {
      // Last 90 days
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      records = records.filter(r => new Date(r.date) >= threeMonthsAgo);
    } // else yearly: all records

    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const leave = records.filter(r => r.status === 'Late').length; // Map Late to Leave/Yellow
    const total = present + absent + leave;
    const attendancePct = total > 0 ? ((present + leave * 0.5) / total) * 100 : 92;

    return { present, absent, leave, total, attendancePct };
  };

  const { present, absent, leave, attendancePct } = getStats();

  // Helper: Month Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper: Generate calendar grid days for standard 7x6 month grid
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding from previous month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthTotalDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthTotalDays - i) });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }

    // Padding for next month
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    return days;
  };

  // Match day with record status
  const getDayStatus = (date: Date) => {
    const dayOfWeek = date.getDay();
    // Weekends are Holidays
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Holiday';
    }

    const dateStr = date.toDateString();
    const record = attendanceRecords.find(r => new Date(r.date).toDateString() === dateStr);

    if (record) {
      if (record.status === 'Present') return 'Present';
      if (record.status === 'Absent') return 'Absent';
      if (record.status === 'Late') return 'Leave';
    }
    
    return 'None';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return '#10B981'; // Green
      case 'Absent': return '#EF4444'; // Red
      case 'Leave': return '#F59E0B'; // Yellow
      case 'Holiday': return '#94A3B8'; // Grey
      default: return 'transparent';
    }
  };

  // Attendance Line Chart Data (Simulated monthly averages for chart visualization)
  const chartData = [
    { label: 'Jan', value: 95 },
    { label: 'Feb', value: 92 },
    { label: 'Mar', value: 96 },
    { label: 'Apr', value: 90 },
    { label: 'May', value: 94 },
    { label: 'Jun', value: attendancePct },
  ];

  // SVG parameters for Line Chart
  const chartWidth = 320;
  const chartHeight = 120;
  const paddingX = 30;
  const paddingY = 15;

  const points = chartData.map((d, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / (chartData.length - 1);
    const y = chartHeight - paddingY - ((d.value - 60) * (chartHeight - paddingY * 2)) / 40; // Scale 60% - 100%
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z` : '';

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>My Attendance</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Overview & daily logs</Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Attendance"
            message="Attendance records are not available yet."
            iconName="Calendar"
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Attendance</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Overview & daily logs</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <CalIcon size={20} color={colors.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= TIME TIMEFRAME TOGGLE ================= */}
        <View style={[styles.toggleContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(['monthly', 'quarterly', 'yearly'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTimeframe(t)}
              style={[
                styles.toggleBtn,
                timeframe === t && { backgroundColor: colors.primary }
              ]}
            >
              <Text style={[
                styles.toggleBtnText,
                { color: timeframe === t ? '#FFFFFF' : theme.textSecondary }
              ]}>
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ================= TOP SUMMARY CARD ================= */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.summaryLeft}>
            <ProgressRing percentage={attendancePct} size={100} strokeWidth={8} color={colors.primary} />
          </View>
          <View style={styles.summaryRight}>
            <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>Status Summary</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{attendancePct.toFixed(1)}% Present</Text>
            
            <View style={styles.statsMetricsGrid}>
              <View style={styles.metricBadge}>
                <View style={[styles.metricDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Present: </Text>
                <Text style={[styles.metricCount, { color: theme.text }]}>{present}</Text>
              </View>
              <View style={styles.metricBadge}>
                <View style={[styles.metricDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Absent: </Text>
                <Text style={[styles.metricCount, { color: theme.text }]}>{absent}</Text>
              </View>
              <View style={styles.metricBadge}>
                <View style={[styles.metricDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Leave: </Text>
                <Text style={[styles.metricCount, { color: theme.text }]}>{leave}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= TREND LINE CHART ================= */}
        <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.chartHeader}>
            <TrendingUp size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.chartTitle, { color: theme.text }]}>Attendance Trends (Last 6 Months)</Text>
          </View>
          <View style={styles.chartWrapper}>
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke={isDarkMode ? '#334155' : '#F1F5F9'} strokeWidth="1" />

              {/* Area Gradient */}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* Line path */}
              <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#FFFFFF" stroke={colors.primary} strokeWidth="2.5" />
                  {/* Tooltip percentage text */}
                  <text x={p.x} y={p.y - 8} fontSize="8" fill={theme.text} fontWeight="700" textAnchor="middle">
                    {p.value.toFixed(0)}%
                  </text>
                  {/* Labels on x-axis */}
                  <text x={p.x} y={chartHeight - 2} fontSize="9" fill={theme.textSecondary} fontWeight="600" textAnchor="middle">
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </View>
        </View>

        {/* ================= INTERACTIVE CALENDAR ================= */}
        <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={prevMonth} style={[styles.monthNavBtn, { backgroundColor: theme.background }]}>
              <ChevronLeft size={16} color={theme.text} />
            </Pressable>
            <Text style={[styles.calendarMonthName, { color: theme.text }]}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={nextMonth} style={[styles.monthNavBtn, { backgroundColor: theme.background }]}>
              <ChevronRight size={16} color={theme.text} />
            </Pressable>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdayRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, idx) => (
              <Text key={idx} style={[styles.weekdayText, { color: theme.textSecondary }]}>{w}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {generateCalendarDays().map((cell, idx) => {
              const status = getDayStatus(cell.date);
              const statusColor = getStatusColor(status);
              return (
                <View key={idx} style={styles.dayCell}>
                  <View style={[
                    styles.dayNumberContainer,
                    !cell.isCurrentMonth && styles.opaqueCell,
                    status !== 'None' && { borderBottomWidth: 3, borderBottomColor: statusColor }
                  ]}>
                    <Text style={[
                      styles.dayText, 
                      { color: cell.isCurrentMonth ? theme.text : theme.textSecondary },
                      status === 'Holiday' && { color: theme.textSecondary }
                    ]}>
                      {cell.day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Color Legend indicator */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Leave</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Holiday</Text>
            </View>
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
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLeft: {
    marginRight: 20,
  },
  summaryRight: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 4,
  },
  statsMetricsGrid: {
    marginTop: 6,
    gap: 4,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricCount: {
    fontSize: 10,
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  chartWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthName: {
    fontSize: 14,
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  opaqueCell: {
    opacity: 0.35,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
});
