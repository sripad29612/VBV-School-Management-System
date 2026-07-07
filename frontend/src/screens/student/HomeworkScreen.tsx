import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Search, ArrowLeft, Calendar, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface HomeworkScreenProps {
  onBack: () => void;
}

export const HomeworkScreen: React.FC<HomeworkScreenProps> = ({ onBack }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Completed'>('All');

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

  const rawHomework = studentData.homework || [];

  // Generate complete list of homework with status from database submissions
  const processedHomework = rawHomework.map((hw: any, idx: number) => {
    // Match status from DB submissions
    const studentId = studentData.dashboard?.studentId || '';
    const sub = hw.submissions?.find((s: any) => s.student === studentId || s.student?._id === studentId);
    const status: 'Pending' | 'Submitted' | 'Completed' = sub 
      ? (sub.status === 'Late' ? 'Submitted' : sub.status) 
      : 'Pending';

    const teacherName = hw.teacher?.name || hw.teacher?.username || 'Teacher';
    
    // Subject color mapping
    const subjectColors: { [key: string]: string } = {
      'Mathematics': '#2563EB',
      'Science': '#10B981',
      'English': '#F97316',
      'Social Studies': '#8B5CF6',
      'Telugu': '#F43F5E',
      'Computer': '#06B6D4'
    };
    const subjectColor = subjectColors[hw.subject?.name] || colors.primary;

    return {
      ...hw,
      status,
      teacherName,
      subjectColor
    };
  });

  // Filter based on chips & search query
  const filteredHomework = processedHomework.filter(hw => {
    const matchesSearch = hw.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (hw.description && hw.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (hw.subject?.name && hw.subject.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = activeFilter === 'All' || hw.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: 'Pending' | 'Submitted' | 'Completed') => {
    switch (status) {
      case 'Pending':
        return {
          bg: colors.danger + '12',
          text: colors.danger,
          label: 'Pending',
          icon: AlertCircle
        };
      case 'Submitted':
        return {
          bg: colors.info + '12',
          text: colors.info,
          label: 'Submitted',
          icon: Clock
        };
      case 'Completed':
        return {
          bg: colors.success + '12',
          text: colors.success,
          label: 'Completed',
          icon: CheckCircle2
        };
    }
  };

  const handleHomeworkSubmit = (hwId: string) => {
    alert('Homework submission page triggered. Upload PDF attachment to complete.');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Homework & Tasks</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage your daily school assignments</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <FileText size={20} color={colors.primary} />
        </View>
      </View>

      {/* ================= SEARCH BAR ================= */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <Search size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search subjects, topics, or tasks..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ================= FILTER CHIPS ================= */}
      <View style={styles.filterContainer}>
        {(['All', 'Pending', 'Submitted', 'Completed'] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
              activeFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: theme.textSecondary },
              activeFilter === filter && { color: '#FFFFFF' }
            ]}>
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ================= HOMEWORK LIST ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredHomework.length > 0 ? (
          filteredHomework.map((hw) => {
            const badge = getStatusBadge(hw.status);
            const StatusIcon = badge.icon;
            const formattedDate = new Date(hw.dueDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            });

            return (
              <View 
                key={hw._id} 
                style={[
                  styles.homeworkCard, 
                  { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }
                ]}
              >
                {/* Colored Left Indicator Strip */}
                <View style={[styles.subjectStrip, { backgroundColor: hw.subjectColor }]} />
                
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.subjectLabel, { color: hw.subjectColor }]}>
                      {hw.subject?.name || 'Class Subject'}
                    </Text>
                    <Text style={[styles.hwTitle, { color: theme.text }]}>{hw.title}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <StatusIcon size={12} color={badge.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <Text style={[styles.hwDescription, { color: theme.textSecondary }]}>
                  {hw.description || 'No detailed instructions provided. Please consult the subject teacher for info.'}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.footerLeft}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Teacher</Text>
                    <Text style={[styles.metaValue, { color: theme.text }]}>{hw.teacherName}</Text>
                  </View>

                  <View style={styles.footerRight}>
                    <View style={styles.dueDateBox}>
                      <Calendar size={12} color={theme.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.dueDateText, { color: theme.textSecondary }]}>Due: {formattedDate}</Text>
                    </View>

                    {hw.status === 'Pending' && (
                      <Pressable 
                        onPress={() => handleHomeworkSubmit(hw._id)}
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      >
                        <Text style={styles.actionBtnText}>Submit Task</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState
            title="Homework"
            message="No homework has been assigned."
            iconName="FileText"
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 48,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    height: '100%',
    outlineStyle: 'none' as any,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 18,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  homeworkCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 14,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  subjectLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: '900',
    maxWidth: 200,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  hwDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  footerLeft: {
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  footerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dueDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
