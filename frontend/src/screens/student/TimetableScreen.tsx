import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { 
  ArrowLeft, Calendar as CalIcon, ChevronDown, ChevronUp, User, MapPin, Info 
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface TimetableScreenProps {
  onBack?: () => void;
  hideHeader?: boolean;
  timetableDataOverride?: any[];
}

export const TimetableScreen: React.FC<TimetableScreenProps> = ({ 
  onBack, 
  hideHeader = false,
  timetableDataOverride
}) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // View toggle: 'daily' | 'weekly'
  const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
  // Day selection (for daily view)
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  // Expanded days (for weekly view collapse/expand)
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({
    'Monday': true // Default first day open
  });

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

    // Autofill selectedDay to current weekday if valid
    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = daysArr[new Date().getDay()];
    if (today !== 'Sunday') {
      setSelectedDay(today);
    }
  }, []);

  const rawTimetable = timetableDataOverride || studentData.timetable || [];
  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Helper: Find periods for a given day
  const getPeriodsForDay = (dayName: string) => {
    const dayData = rawTimetable.find(t => t.day.toLowerCase() === dayName.toLowerCase());
    if (dayData && dayData.periods && dayData.periods.length > 0) {
      return dayData.periods;
    }
    return [];
  };

  const getSubjectColor = (subjName: string) => {
    const subjectColors: { [key: string]: string } = {
      'Mathematics': '#2563EB',
      'Science': '#10B981',
      'English': '#F97316',
      'Social Studies': '#8B5CF6',
      'Telugu': '#F43F5E',
      'Computer': '#06B6D4'
    };
    return subjectColors[subjName] || colors.primary;
  };

  const toggleDayExpand = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  if (!rawTimetable || rawTimetable.length === 0) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {!hideHeader && (
          <View style={styles.header}>
            {onBack && (
              <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ArrowLeft size={18} color={colors.primary} />
              </Pressable>
            )}
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Class Timetable</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Weekly school calendar slots</Text>
            </View>
          </View>
        )}
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Class Timetable"
            message="No timetable available."
            iconName="Calendar"
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      {!hideHeader && (
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ArrowLeft size={18} color={colors.primary} />
            </Pressable>
          )}
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Class Schedule</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Weekly period timelines</Text>
          </View>
          <View style={styles.headerIconContainer}>
            <CalIcon size={20} color={colors.primary} />
          </View>
        </View>
      )}

      {/* ================= DAILY / WEEKLY TOGGLE ================= */}
      <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable 
          onPress={() => setViewType('daily')}
          style={[styles.toggleBtn, viewType === 'daily' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.toggleBtnText, { color: viewType === 'daily' ? '#FFFFFF' : theme.textSecondary }]}>
            Daily View
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setViewType('weekly')}
          style={[styles.toggleBtn, viewType === 'weekly' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.toggleBtnText, { color: viewType === 'weekly' ? '#FFFFFF' : theme.textSecondary }]}>
            Weekly View
          </Text>
        </Pressable>
      </View>

      {/* ================= DAY CHIPS (DAILY VIEW) ================= */}
      {viewType === 'daily' && (
        <View style={styles.dayChipsOuter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipsContainer}>
            {daysList.map((day) => (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedDay === day && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={[
                  styles.dayChipText,
                  { color: theme.textSecondary },
                  selectedDay === day && { color: '#FFFFFF' }
                ]}>
                  {day.slice(0, 3)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ================= TIMELINE CONTENT ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* A. DAILY VIEW TIMELINE */}
        {viewType === 'daily' && (
          <View style={styles.timelineContainer}>
            {getPeriodsForDay(selectedDay).map((period: any, idx: number) => {
              const subjName = period.subject?.name || 'Subject';
              const subjColor = getSubjectColor(subjName);
              return (
                <View key={idx} style={styles.timelineNode}>
                  
                  {/* Left Column: Time details */}
                  <View style={styles.nodeLeft}>
                    <Text style={[styles.timeText, { color: theme.text }]} numberOfLines={1}>
                      {period.startTime}
                    </Text>
                    <Text style={[styles.periodNumber, { color: theme.textSecondary }]}>
                      Period {idx + 1}
                    </Text>
                  </View>

                  {/* Center Column: Bullet indicator & line */}
                  <View style={styles.nodeCenter}>
                    <View style={[styles.timelineLine, idx === 0 && styles.firstLine, idx === 5 && styles.lastLine]} />
                    <View style={[styles.bulletDot, { backgroundColor: subjColor }]} />
                  </View>

                  {/* Right Column: Card details */}
                  <View style={[styles.nodeRight, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
                    <View style={[styles.rightCardStrip, { backgroundColor: subjColor }]} />
                    <View style={styles.nodeRightContent}>
                      <Text style={[styles.subjectNameText, { color: theme.text }]}>{subjName}</Text>
                      
                      <View style={styles.metaInfoRow}>
                        <View style={styles.metaItem}>
                          <User size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
                          <Text style={[styles.metaValText, { color: theme.textSecondary }]}>
                            {period.teacher?.name || 'Teacher'}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <MapPin size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
                          <Text style={[styles.metaValText, { color: theme.textSecondary }]}>
                            Room {period.room || (101 + idx)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                </View>
              );
            })}
          </View>
        )}

        {/* B. WEEKLY VIEW COLLAPSE LIST */}
        {viewType === 'weekly' && (
          <View style={styles.weeklyContainer}>
            {daysList.map((day) => {
              const periods = getPeriodsForDay(day);
              const isOpen = expandedDays[day];

              return (
                <View 
                  key={day} 
                  style={[
                    styles.weekDayCard, 
                    { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }
                  ]}
                >
                  {/* Collapsable Header */}
                  <Pressable 
                    onPress={() => toggleDayExpand(day)}
                    style={styles.weekDayHeader}
                  >
                    <View style={styles.weekDayHeaderLeft}>
                      <CalIcon size={16} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.weekDayTitle, { color: theme.text }]}>{day}</Text>
                      <Text style={[styles.weekDaySubtitle, { color: theme.textSecondary }]}>
                        ({periods.length} Classes)
                      </Text>
                    </View>
                    {isOpen ? <ChevronUp size={16} color={theme.textSecondary} /> : <ChevronDown size={16} color={theme.textSecondary} />}
                  </Pressable>

                  {/* Periods Content */}
                  {isOpen && (
                    <View style={styles.weekDayPeriodsBox}>
                      {periods.map((p: any, pIdx: number) => {
                        const subjName = p.subject?.name || 'Class Subject';
                        const subjColor = getSubjectColor(subjName);
                        return (
                          <View key={pIdx} style={[styles.weekPeriodRow, pIdx === periods.length - 1 && styles.noBorder]}>
                            <View style={[styles.weekPeriodDot, { backgroundColor: subjColor }]} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={[styles.weekPeriodSubject, { color: theme.text }]}>{subjName}</Text>
                              <Text style={[styles.weekPeriodMeta, { color: theme.textSecondary }]}>
                                {p.startTime} · {p.teacher?.name || 'Teacher'} · Room {p.room || (101 + pIdx)}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
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
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayChipsOuter: {
    marginBottom: 18,
  },
  dayChipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timelineContainer: {
    width: '100%',
    paddingLeft: 10,
    paddingTop: 10,
  },
  timelineNode: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  nodeLeft: {
    width: 76,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  periodNumber: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  nodeCenter: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#E2E8F0',
  },
  firstLine: {
    top: '50%',
  },
  lastLine: {
    bottom: '50%',
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  nodeRight: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    marginLeft: 8,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  rightCardStrip: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  nodeRightContent: {
    padding: 12,
    paddingLeft: 16,
  },
  subjectNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaInfoRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValText: {
    fontSize: 10,
    fontWeight: '600',
  },
  weeklyContainer: {
    width: '100%',
  },
  weekDayCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weekDayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDayTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  weekDaySubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  weekDayPeriodsBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
  },
  weekPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  weekPeriodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekPeriodSubject: {
    fontSize: 12,
    fontWeight: '800',
  },
  weekPeriodMeta: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
});
