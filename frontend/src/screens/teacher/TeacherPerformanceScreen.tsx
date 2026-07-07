import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { BarChart, ProgressRing, PieChart } from '../../components/AnalyticsCharts';
import { ArrowLeft, TrendingUp, Award, AlertTriangle, AlertCircle, FileText, CheckCircle2 } from 'lucide-react-native';

interface TeacherPerformanceScreenProps {
  onBack: () => void;
}

export const TeacherPerformanceScreen: React.FC<TeacherPerformanceScreenProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const reports = teacherData.reports || [];
  const dashboard = teacherData.dashboard || {};

  // 1. Calculate overall averages
  const validAttCount = reports.filter((r: any) => r.attendancePct !== null && r.attendancePct !== undefined).length;
  const attendanceRate = validAttCount > 0 
    ? Math.round(reports.reduce((sum: number, r: any) => sum + (r.attendancePct || 0), 0) / validAttCount) 
    : null;

  const validHwCount = reports.filter((r: any) => r.homeworkPct !== null && r.homeworkPct !== undefined).length;
  const homeworkRate = validHwCount > 0 
    ? Math.round(reports.reduce((sum: number, r: any) => sum + (r.homeworkPct || 0), 0) / validHwCount) 
    : null;

  const validMarksCount = reports.filter((r: any) => r.latestPercentage !== null && r.latestPercentage !== undefined).length;
  const marksAvg = validMarksCount > 0 
    ? Math.round(reports.reduce((sum: number, r: any) => sum + (r.latestPercentage || 0), 0) / validMarksCount) 
    : null;

  // 2. Load dynamic charts
  const mathChapterData = dashboard.mathChapterData || [];
  const monthlyTrendData = dashboard.monthlyTrendData || [];

  // 3. Dynamic performers
  const sortedByMarks = [...reports]
    .filter((r: any) => r.latestPercentage !== null && r.latestPercentage !== undefined)
    .sort((a: any, b: any) => b.latestPercentage - a.latestPercentage);

  const topPerformers = sortedByMarks.slice(0, 3).map((r: any, idx: number) => ({
    rank: idx + 1,
    name: r.name,
    roll: r.rollNumber || 'N/A',
    score: Math.round(r.latestPercentage),
    grade: r.latestGrade || 'N/A'
  }));

  const needingSupport = [...reports]
    .filter((r: any) => r.latestPercentage !== null && r.latestPercentage !== undefined && r.latestPercentage < 60)
    .sort((a: any, b: any) => a.latestPercentage - b.latestPercentage)
    .slice(0, 3)
    .map((r: any) => ({
      name: r.name,
      roll: r.rollNumber || 'N/A',
      score: Math.round(r.latestPercentage),
      grade: r.latestGrade || 'N/A',
      issue: 'Low Marks Alert'
    }));

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#EC4899" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Class Performance Analytics</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>
              Lovable Analytics Screen - {dashboard.assignedClass || 'None'}
            </Text>
          </View>
        </View>

        {/* ================= OVERALL STATS TRIO ================= */}
        <View style={styles.statsSummaryRow}>
          <Card style={styles.statsCard}>
            <Text style={[styles.statsVal, { color: colors.success, fontSize: attendanceRate !== null ? 16 : 8, textAlign: 'center' }]}>
              {attendanceRate !== null ? `${attendanceRate}%` : 'Attendance not available.'}
            </Text>
            <Text style={[styles.statsLbl, { color: theme.textSecondary }]}>Attendance</Text>
          </Card>
          <Card style={styles.statsCard}>
            <Text style={[styles.statsVal, { color: colors.warning, fontSize: homeworkRate !== null ? 16 : 8, textAlign: 'center' }]}>
              {homeworkRate !== null ? `${homeworkRate}%` : 'No homework assigned.'}
            </Text>
            <Text style={[styles.statsLbl, { color: theme.textSecondary }]}>HW Completion</Text>
          </Card>
          <Card style={styles.statsCard}>
            <Text style={[styles.statsVal, { color: colors.primary, fontSize: marksAvg !== null ? 16 : 8, textAlign: 'center' }]}>
              {marksAvg !== null ? `${marksAvg}%` : 'No marks available.'}
            </Text>
            <Text style={[styles.statsLbl, { color: theme.textSecondary }]}>Marks Average</Text>
          </Card>
        </View>

        {/* ================= SUBJECT/CHAPTER PERFORMANCE CHART ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Mathematics Chapter-wise Performance</Text>
        <Card>
          {mathChapterData.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Performance data not available.</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 10 }]}>Average Scores (%)</Text>
              <BarChart data={mathChapterData} color="#EC4899" height={160} />
            </>
          )}
        </Card>

        {/* ================= MONTHLY ATTENDANCE TREND ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Monthly Attendance Trend</Text>
        <Card>
          {monthlyTrendData.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Attendance not available.</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 10 }]}>Monthly Rate (%)</Text>
              <BarChart data={monthlyTrendData} color="#10B981" height={160} />
            </>
          )}
        </Card>

        {/* ================= TOP PERFORMERS ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Top Academic Performers</Text>
        <Card style={{ paddingVertical: 8 }}>
          {topPerformers.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Performance data not available.</Text>
            </View>
          ) : (
            topPerformers.map((student, idx) => (
              <View key={student.roll}>
                <View style={styles.rankItemRow}>
                  <View style={[styles.rankBox, { backgroundColor: idx === 0 ? '#FEF08A' : idx === 1 ? '#E2E8F0' : '#FFEDD5' }]}>
                    <Text style={[styles.rankText, { color: idx === 0 ? '#A16207' : idx === 1 ? '#475569' : '#C2410C' }]}>
                      #{student.rank}
                    </Text>
                  </View>
                  <View style={styles.studentDetails}>
                    <Text style={[styles.studentNameText, { color: theme.text }]}>{student.name}</Text>
                    <Text style={[styles.studentRollText, { color: theme.textSecondary }]}>Roll No: {student.roll}</Text>
                  </View>
                  <View style={styles.scoreDetails}>
                    <Text style={[styles.scoreValText, { color: colors.success }]}>{student.score}%</Text>
                    <Text style={[styles.scoreGradeText, { color: theme.textSecondary }]}>Grade {student.grade}</Text>
                  </View>
                </View>
                {idx < topPerformers.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />}
              </View>
            ))
          )}
        </Card>

        {/* ================= STUDENTS NEEDING SUPPORT ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Students Needing Support</Text>
        <Card style={{ paddingVertical: 8, marginBottom: 80 }}>
          {needingSupport.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Performance data not available.</Text>
            </View>
          ) : (
            needingSupport.map((student, idx) => (
              <View key={student.roll}>
                <View style={styles.rankItemRow}>
                  <View style={[styles.warningBox, { backgroundColor: colors.danger + '15' }]}>
                    <AlertCircle size={16} color={colors.danger} />
                  </View>
                  <View style={styles.studentDetails}>
                    <Text style={[styles.studentNameText, { color: theme.text }]}>{student.name}</Text>
                    <Text style={[styles.issueText, { color: colors.danger }]}>{student.issue}</Text>
                  </View>
                  <View style={styles.scoreDetails}>
                    <Text style={[styles.scoreValText, { color: colors.danger }]}>{student.score}%</Text>
                    <Text style={[styles.scoreGradeText, { color: theme.textSecondary }]}>Grade {student.grade}</Text>
                  </View>
                </View>
                {idx < needingSupport.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />}
              </View>
            ))
          )}
        </Card>

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
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  statsVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  statsLbl: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rankItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  warningBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  studentNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentRollText: {
    fontSize: 10,
    marginTop: 1,
  },
  issueText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  scoreDetails: {
    alignItems: 'flex-end',
  },
  scoreValText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreGradeText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  itemDivider: {
    height: 1,
  }
});
