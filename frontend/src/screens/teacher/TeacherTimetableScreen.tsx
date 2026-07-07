import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ArrowLeft, UserCheck, PlusCircle, Award, FileText, Clock, MapPin } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface TeacherTimetableScreenProps {
  onBack: () => void;
  onNavigateToTab: (tab: any, prefilledClass?: string) => void;
}

export const TeacherTimetableScreen: React.FC<TeacherTimetableScreenProps> = ({ 
  onBack, 
  onNavigateToTab 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const schedules = teacherData.dashboard?.schedules || [];

  const periods = schedules.map((s: any, idx: number) => ({
    id: `period_${idx}`,
    time: `${s.startTime} - ${s.endTime}`,
    subject: s.subject,
    className: `${s.class}${s.section ? ' - ' + s.section : ''}`,
    room: s.room || 'N/A',
    isFree: false
  }));

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Timetable Schedule</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Manage daily slots and shortcuts</Text>
          </View>
        </View>

        {/* ================= TIMETABLE CARDS ================= */}
        <View style={styles.periodsContainer}>
          {periods.length > 0 ? (
            periods.map((period: any) => (
              <Card 
                key={period.id}
                style={[
                  styles.periodCard, 
                  period.isFree ? { borderStyle: 'dashed', backgroundColor: theme.background } : null
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.timeBox}>
                    <Clock size={12} color={colors.primary} style={{ marginRight: 5 }} />
                    <Text style={[styles.timeText, { color: theme.text }]}>{period.time}</Text>
                  </View>
                  {!period.isFree && (
                    <View style={styles.roomBox}>
                      <MapPin size={10} color={theme.textSecondary} style={{ marginRight: 3 }} />
                      <Text style={[styles.roomText, { color: theme.textSecondary }]}>{period.room}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.subjectRow}>
                  <Text style={[
                    styles.subjectText, 
                    { color: period.isFree ? theme.textSecondary : theme.text }
                  ]}>
                    {period.subject}
                  </Text>
                  <View style={[
                    styles.classBadge, 
                    { backgroundColor: period.isFree ? '#E2E8F0' : colors.primary + '15' }
                  ]}>
                    <Text style={[
                      styles.classBadgeText, 
                      { color: period.isFree ? '#64748B' : colors.primary }
                    ]}>
                      {period.className}
                    </Text>
                  </View>
                </View>

                {/* Quick Actions Shortcuts from Timetable Period Card */}
                {!period.isFree && (
                  <View style={[styles.shortcutsWrapper, { borderTopColor: theme.border }]}>
                    <Pressable 
                      onPress={() => onNavigateToTab('attendance')}
                      style={[styles.shortcutBtn, { backgroundColor: '#10B98110' }]}
                    >
                      <UserCheck size={12} color="#10B981" />
                      <Text style={[styles.shortcutBtnText, { color: '#10B981' }]}>Attendance</Text>
                    </Pressable>

                    <Pressable 
                      onPress={() => onNavigateToTab('homework')}
                      style={[styles.shortcutBtn, { backgroundColor: '#F9731610' }]}
                    >
                      <PlusCircle size={12} color="#F97316" />
                      <Text style={[styles.shortcutBtnText, { color: '#F97316' }]}>Homework</Text>
                    </Pressable>

                    <Pressable 
                      onPress={() => onNavigateToTab('marks')}
                      style={[styles.shortcutBtn, { backgroundColor: '#8B5CF610' }]}
                    >
                      <Award size={12} color="#8B5CF6" />
                      <Text style={[styles.shortcutBtnText, { color: '#8B5CF6' }]}>Marks</Text>
                    </Pressable>

                    <Pressable 
                      onPress={() => onNavigateToTab('daily-report', period.className)}
                      style={[styles.shortcutBtn, { backgroundColor: '#06B6D410' }]}
                    >
                      <FileText size={12} color="#06B6D4" />
                      <Text style={[styles.shortcutBtnText, { color: '#06B6D4' }]}>Report</Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <EmptyState
              title="Class Timetable"
              message="No teaching schedule today."
              iconName="Clock"
            />
          )}
        </View>

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
    paddingBottom: 90,
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
  periodsContainer: {
    marginTop: 8,
  },
  periodCard: {
    marginVertical: 6,
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  roomBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomText: {
    fontSize: 9,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '800',
  },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  shortcutsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shortcutBtnText: {
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 3,
  }
});
