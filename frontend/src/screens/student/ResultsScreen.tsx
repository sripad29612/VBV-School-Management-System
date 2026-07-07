import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { BarChart, ProgressRing } from '../../components/AnalyticsCharts';
import { ArrowLeft, Award, Calendar, FileText, BarChart2, Star, Download, Sparkles, TrendingUp } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface ResultsScreenProps {
  onBack: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ onBack }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Selected Term filter: 'Quarterly' | 'Half-Yearly' | 'Annual'
  const [activeTerm, setActiveTerm] = useState<'Quarterly' | 'Half-Yearly' | 'Annual'>('Quarterly');

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

  const results = studentData.results || [];

  // Find result from DB
  const getActiveResult = () => {
    return results.find(r => r.examType === activeTerm) || null;
  };

  const currentResult = getActiveResult();

  const handleDownloadReport = () => {
    if (!currentResult) return;
    alert(`Initiating download for ${currentResult.examType} Report Card. Saved in downloads folder.`);
  };

  // Convert marks array into Bar Chart structure
  const barChartData = currentResult ? currentResult.marks.map((m: any) => ({
    label: m.subject?.name?.slice(0, 4) || 'Subj',
    value: m.marksObtained
  })) : [];

  const getSubjectColor = (idx: number) => {
    const subjectColors = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#F43F5E', '#06B6D4'];
    return subjectColors[idx % subjectColors.length];
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Academic Results</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Grades, scorecards & report downloads</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Award size={20} color={colors.primary} />
        </View>
      </View>

      {/* ================= TERM TOGGLE CHIPS ================= */}
      <View style={styles.termToggleContainer}>
        {(['Quarterly', 'Half-Yearly', 'Annual'] as const).map((term) => (
          <Pressable
            key={term}
            onPress={() => setActiveTerm(term)}
            style={[
              styles.termPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
              activeTerm === term && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.termText,
              { color: theme.textSecondary },
              activeTerm === term && { color: '#FFFFFF' }
            ]}>
              {term}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {currentResult ? (
          <>
            {/* ================= GRADIENT OVERALL SCORE CARD ================= */}
            <View style={[styles.gradientScoreCard, { shadowColor: colors.primary }]}>
              <View style={styles.gradientOverlay}>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreMetaLabel}>Academic Performance</Text>
                  <Text style={styles.overallScoreText}>{currentResult.percentage}%</Text>
                  
                  <View style={styles.scoreMetricsRow}>
                    <View style={styles.scoreMetricBadge}>
                      <Text style={styles.scoreMetricLabel}>GRADE</Text>
                      <Text style={styles.scoreMetricVal}>{currentResult.grade}</Text>
                    </View>
                    <View style={styles.scoreMetricDivider} />
                    <View style={styles.scoreMetricBadge}>
                      <Text style={styles.scoreMetricLabel}>RANK</Text>
                      <Text style={styles.scoreMetricVal}>#{currentResult.rank}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.scoreProgressCircle}>
                  <ProgressRing 
                    percentage={currentResult.percentage} 
                    size={84} 
                    strokeWidth={7} 
                    color="#FFFFFF" 
                  />
                </View>
              </View>
            </View>

            {/* ================= BAR CHART VISUALIZATION ================= */}
            <View style={[styles.visualCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
              <View style={styles.visualHeader}>
                <TrendingUp size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.visualTitle, { color: theme.text }]}>Subject-Wise Score Distribution</Text>
              </View>
              <BarChart data={barChartData} height={130} color={colors.primary} />
            </View>

            {/* ================= DOWNLOAD REPORT CARD ================= */}
            <Pressable 
              onPress={handleDownloadReport} 
              style={({ pressed }) => [
                styles.downloadBtn,
                { transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
            >
              <FileText size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.downloadText}>Download Official Report Card</Text>
            </Pressable>

            {/* ================= SUBJECT CARDS LIST ================= */}
            <Text style={[styles.sectionHeading, { color: theme.text }]}>Report Details</Text>
            {currentResult.marks.map((m: any, idx: number) => {
              const subjColor = getSubjectColor(idx);
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.subjectCard, 
                    { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }
                  ]}
                >
                  <View style={[styles.subjectStrip, { backgroundColor: subjColor }]} />
                  
                  <View style={styles.subjRowHeader}>
                    <View style={styles.subjTitleGroup}>
                      <View style={[styles.subjDot, { backgroundColor: subjColor }]} />
                      <Text style={[styles.subjName, { color: theme.text }]}>{m.subject?.name || 'Class Subject'}</Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: subjColor + '10' }]}>
                      <Text style={[styles.scoreText, { color: subjColor }]}>{m.marksObtained}/{m.maxMarks}</Text>
                    </View>
                  </View>

                  <Text style={[styles.remarksLabel, { color: theme.textSecondary }]}>Teacher Remarks</Text>
                  <Text style={[styles.remarksText, { color: theme.text }]}>
                    {m.remarks || 'Keep up the consistent effort and interest.'}
                  </Text>
                </View>
              );
            })}
          </>
        ) : (
          <EmptyState
            title="Grade Report"
            message="No exam results published."
            iconName="Award"
          />
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
  termToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  termPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  gradientScoreCard: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    ...({
      backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
    } as any),
    backgroundColor: '#2563EB',
  },
  gradientOverlay: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  scoreInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreMetaLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overallScoreText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  scoreMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreMetricBadge: {
    marginRight: 14,
  },
  scoreMetricLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreMetricVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  scoreMetricDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: 14,
  },
  scoreProgressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  visualTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  downloadBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginVertical: 12,
  },
  subjectCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectStrip: {
    width: 5,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  subjRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  subjName: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '900',
  },
  remarksRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  remarksLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  remarksText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
});
