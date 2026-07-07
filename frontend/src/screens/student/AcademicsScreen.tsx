import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Award, BookOpen, FileText, CheckSquare, ChevronRight, GraduationCap, LayoutGrid } from 'lucide-react-native';

interface AcademicsScreenProps {
  onNavigate: (tab: 'dashboard' | 'attendance' | 'homework' | 'results' | 'materials' | 'timetable' | 'idcard' | 'notifications' | 'profile' | 'exams') => void;
}

export const AcademicsScreen: React.FC<AcademicsScreenProps> = ({ onNavigate }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
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
  }, []);

  const attendancePct = studentData.dashboard?.attendancePct ?? 0;
  const pendingHomework = studentData.homework?.filter((h: any) => h.status === 'Pending').length ?? 0;
  const examPct = studentData.results && studentData.results.length > 0 ? studentData.results[0].percentage : null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Academics Hub</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Track your progress & course content</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <LayoutGrid size={20} color={colors.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HUB CARDS ================= */}
        {[
          {
            title: 'Attendance Tracker',
            subtitle: 'Daily records and monthly trends',
            val: `${attendancePct.toFixed(0)}%`,
            desc: 'Target minimum: 85%',
            color: '#2563EB',
            bg: '#EFF6FF',
            icon: CheckSquare,
            tab: 'attendance'
          },
          {
            title: 'Homework Tasks',
            subtitle: 'Assignments and school projects',
            val: `${pendingHomework} Tasks`,
            desc: 'Pending submissions',
            color: '#F97316',
            bg: '#FFF7ED',
            icon: FileText,
            tab: 'homework'
          },
          {
            title: 'Grade Report',
            subtitle: 'Report cards and grade analytics',
            val: examPct !== null ? `${examPct}%` : 'N/A',
            desc: 'Term Quarterly Score',
            color: '#10B981',
            bg: '#ECFDF5',
            icon: Award,
            tab: 'results'
          },
          {
            title: 'Study Materials',
            subtitle: 'Reference notes and worksheets',
            val: `${studentData.studyMaterials?.length || 0} Docs`,
            desc: 'Available learning files',
            color: '#8B5CF6',
            bg: '#F5F3FF',
            icon: BookOpen,
            tab: 'materials'
          },
          {
            title: 'Exam Hub',
            subtitle: 'Term examination schedules & dates',
            val: 'Timetable',
            desc: 'View published dates',
            color: '#FF9500',
            bg: '#FFF9F0',
            icon: Award,
            tab: 'exams'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={idx}
              onPress={() => onNavigate(item.tab as any)}
              style={({ pressed }) => [
                styles.hubCard,
                { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border, 
                  shadowColor: theme.cardShadow,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Icon size={22} color={item.color} />
              </View>

              <View style={styles.infoBox}>
                <Text style={[styles.titleText, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.subText, { color: theme.textSecondary }]}>{item.subtitle}</Text>
                
                <View style={styles.bottomMetaRow}>
                  <Text style={[styles.metaVal, { color: item.color }]}>{item.val}</Text>
                  <View style={[styles.metaDot, { backgroundColor: theme.border }]} />
                  <Text style={[styles.metaDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                </View>
              </View>

              <ChevronRight size={16} color={theme.textSecondary} />
            </Pressable>
          );
        })}

        {/* ================= PROUD STANDING CARD ================= */}
        <View style={[styles.footerCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          <GraduationCap size={28} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={[styles.footerCardTitle, { color: theme.text }]}>VBV Excellence Program</Text>
          <Text style={[styles.footerCardDesc, { color: theme.textSecondary }]}>
            Maintain outstanding attendance and complete your assignments on time to qualify for the annual Vidya Bharathi awards.
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
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoBox: {
    flex: 1,
    paddingRight: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '900',
  },
  subText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  metaDesc: {
    fontSize: 10,
    fontWeight: '600',
  },
  footerCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  footerCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  footerCardDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
