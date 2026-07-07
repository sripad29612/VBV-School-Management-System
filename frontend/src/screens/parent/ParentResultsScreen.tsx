import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ProgressRing } from '../../components/AnalyticsCharts';
import { ArrowLeft, Award, FileText, Download, CheckCircle2 } from 'lucide-react-native';
import { SubScreenChildSwitcher } from '../../components/SubScreenChildSwitcher';
import { EmptyState } from '../../components/EmptyState';

interface ParentResultsScreenProps {
  onBack: () => void;
  onSelectChild?: (childId: string) => void;
}

export const ParentResultsScreen: React.FC<ParentResultsScreenProps> = ({ onBack, onSelectChild }) => {
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [activeTerm, setActiveTerm] = useState<'Quarterly' | 'Half-Yearly' | 'Annual'>('Half-Yearly');

  const resultsList = parentData.results || [];

  const getResultsForTerm = () => {
    return resultsList.find(r => r.examType === activeTerm) || null;
  };

  const currentResult = getResultsForTerm();

  // Custom SVG Bar Chart calculation
  const graphWidth = 320;
  const graphHeight = 120;
  const paddingX = 40;
  const paddingY = 20;

  const barCount = currentResult ? currentResult.marks.length : 0;
  const barWidth = 18;
  const gap = barCount > 1 ? (graphWidth - paddingX * 2 - barCount * barWidth) / (barCount - 1) : 0;

  const barPoints = currentResult ? currentResult.marks.map((m: any, idx: number) => {
    const x = paddingX + idx * (barWidth + gap);
    const pct = (m.marksObtained / m.maxMarks) * 100;
    const h = ((graphHeight - paddingY * 2) * pct) / 100;
    const y = graphHeight - paddingY - h;
    const subjName = m.subject?.name || m.subject;
    return { x, y, h, pct, label: subjName.slice(0, 4) };
  }) : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Academic Results</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Child report cards & exam grades</Text>
        </View>
        <Award size={20} color={colors.primary} />
      </View>

      {onSelectChild && parentData.dashboard?.children && (
        <SubScreenChildSwitcher
          children={parentData.dashboard.children}
          selectedChildId={parentData.selectedChildId}
          onSelectChild={onSelectChild}
          theme={theme}
        />
      )}

      {/* ================= TERM SWITCHER ================= */}
      <View style={styles.termRow}>
        {(['Quarterly', 'Half-Yearly', 'Annual'] as const).map((term) => (
          <Pressable
            key={term}
            onPress={() => setActiveTerm(term)}
            style={[
              styles.termPill,
              { 
                backgroundColor: activeTerm === term ? colors.primary : theme.surface, 
                borderColor: colors.primary 
              }
            ]}
          >
            <Text style={[styles.termText, { color: activeTerm === term ? '#FFFFFF' : colors.primary }]}>
              {term === 'Half-Yearly' ? 'HALF-YR' : term.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {currentResult ? (
        <>
          {/* ================= SCORECARD CARD ================= */}
          <View style={[styles.scoreCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            <View style={styles.scoreLeft}>
              <ProgressRing percentage={currentResult.percentage} size={90} color={colors.primary} />
            </View>
            <View style={styles.scoreRight}>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>{currentResult.examType.toUpperCase()} EXAM</Text>
              <Text style={[styles.scorePct, { color: theme.text }]}>{currentResult.percentage}%</Text>
              <View style={[styles.gradeBadge, { backgroundColor: colors.success + '15' }]}>
                <Text style={[styles.gradeBadgeText, { color: colors.success }]}>
                  GRADE {currentResult.grade}
                </Text>
              </View>
              <Text style={[styles.rankText, { color: theme.textSecondary }]}>Class Rank: #{currentResult.rank || 3}</Text>
            </View>
          </View>

          {/* ================= SVG SUBJECTS BAR CHART ================= */}
          <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Subject-wise Scores (%)</Text>
            <View style={styles.svgContainer}>
              <svg width="100%" height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
                {/* Axis lines */}
                <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - paddingX} y2={graphHeight - paddingY} stroke={isDarkMode ? '#334155' : '#E2E8F0'} strokeWidth="1.5" />
                
                {/* Vertical bars */}
                {barPoints.map((p: any, i: number) => (
                  <g key={i}>
                    <rect x={p.x} y={p.y} width={barWidth} height={p.h} rx="4" fill={colors.primary} />
                    <text x={p.x + barWidth / 2} y={p.y - 6} fontSize="8" fill={theme.text} fontWeight="800" textAnchor="middle">{p.pct}%</text>
                    <text x={p.x + barWidth / 2} y={graphHeight - 4} fontSize="8" fill={theme.textSecondary} fontWeight="600" textAnchor="middle">{p.label}</text>
                  </g>
                ))}
              </svg>
            </View>
          </View>

          {/* ================= MARKS LIST ================= */}
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Marks Sheet Breakdown</Text>
          {currentResult.marks.map((m: any, idx: number) => {
            const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
            return (
              <View 
                key={idx} 
                style={[styles.subjectCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}
              >
                <View style={styles.subjRow}>
                  <View style={styles.subjLeft}>
                    <Text style={[styles.subjName, { color: theme.text }]}>{m.subject?.name || m.subject}</Text>
                    <Text style={[styles.subjProgressText, { color: theme.textSecondary }]}>Percentage: {pct}%</Text>
                  </View>
                  <Text style={[styles.subjScore, { color: colors.primary }]}>
                    {m.marksObtained}/{m.maxMarks}
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>
            );
          })}

          {/* ================= TEACHER FEEDBACK ================= */}
          <View style={[styles.remarksCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
            <Text style={[styles.remarksHeader, { color: theme.textSecondary }]}>TEACHER REMARKS</Text>
            <Text style={[styles.remarksBody, { color: theme.text }]}>
              "{currentResult.remarks || 'Satisfactory work during exams.'}"
            </Text>
          </View>

          {/* ================= DOWNLOAD BUTTON ================= */}
          <Pressable 
            onPress={() => alert('Report card download started')} 
            style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
          >
            <Download size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.downloadBtnText}>Download PDF Report Card</Text>
          </Pressable>
        </>
      ) : (
        <EmptyState
          title="Grade Report"
          message="No exam results published."
          iconName="Award"
        />
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
  termRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  termPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreCard: {
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
  scoreLeft: {
    marginRight: 16,
  },
  scoreRight: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scorePct: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  gradeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  rankText: {
    fontSize: 9,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  subjectCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  subjRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjLeft: {
    flex: 1,
  },
  subjName: {
    fontSize: 13,
    fontWeight: '800',
  },
  subjProgressText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  subjScore: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  remarksCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
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
    marginBottom: 6,
  },
  remarksBody: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  downloadBtn: {
    height: 48,
    borderRadius: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
