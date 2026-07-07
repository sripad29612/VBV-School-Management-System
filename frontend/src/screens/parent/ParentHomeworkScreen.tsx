import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, Search, FileText, CheckCircle, Clock } from 'lucide-react-native';
import { SubScreenChildSwitcher } from '../../components/SubScreenChildSwitcher';
import { EmptyState } from '../../components/EmptyState';

interface ParentHomeworkScreenProps {
  onBack: () => void;
  onSelectChild?: (childId: string) => void;
}

export const ParentHomeworkScreen: React.FC<ParentHomeworkScreenProps> = ({ onBack, onSelectChild }) => {
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Completed'>('All');

  const baseHomework = parentData.homework || [];

  const homeworkList = baseHomework.map((hw: any) => ({
    ...hw,
    teacherName: hw.teacher?.name || hw.teacher?.username || 'Teacher'
  }));

  // Filter items
  const filteredHomework = homeworkList.filter(hw => {
    const matchesSearch = hw.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          hw.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filters
    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Pending') return matchesSearch && hw.status === 'Pending';
    if (activeFilter === 'Submitted') return matchesSearch && hw.status === 'Submitted';
    return matchesSearch && hw.status === 'Completed';
  });

  return (
    <View style={styles.container}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Homework Tasks</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Child assignment details</Text>
        </View>
        <FileText size={20} color={colors.primary} />
      </View>

      {onSelectChild && parentData.dashboard?.children && (
        <SubScreenChildSwitcher
          children={parentData.dashboard.children}
          selectedChildId={parentData.selectedChildId}
          onSelectChild={onSelectChild}
          theme={theme}
        />
      )}

      {/* ================= SEARCH BAR ================= */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <Search size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search subjects or homework..."
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
              { 
                backgroundColor: activeFilter === filter ? colors.primary : theme.surface, 
                borderColor: colors.primary 
              }
            ]}
          >
            <Text style={[styles.filterText, { color: activeFilter === filter ? '#FFFFFF' : colors.primary }]}>
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ================= LIST CONTENT ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredHomework.length > 0 ? (
          filteredHomework.map((hw, idx) => {
            const isPending = hw.status === 'Pending';
            const isSubmitted = hw.status === 'Submitted';
            const isCompleted = hw.status === 'Completed';

            let statusBg = colors.danger + '12';
            let statusText = 'PENDING';
            let statusColor = colors.danger;
            let StatusIcon = Clock;

            if (isSubmitted) {
              statusBg = colors.primary + '12';
              statusText = 'SUBMITTED';
              statusColor = colors.primary;
              StatusIcon = Clock;
            } else if (isCompleted) {
              statusBg = colors.success + '12';
              statusText = 'COMPLETED';
              statusColor = colors.success;
              StatusIcon = CheckCircle;
            }

            const subjectColor = colors.primary;

            return (
              <View 
                key={hw._id || idx} 
                style={[styles.homeworkCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}
              >
                <View style={[styles.subjectStrip, { backgroundColor: subjectColor }]} />
                
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.subjectLabel, { color: subjectColor }]}>{hw.subject?.name || 'Class Subject'}</Text>
                    <Text style={[styles.hwTitle, { color: theme.text }]} numberOfLines={1}>{hw.title}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <StatusIcon size={12} color={statusColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                  </View>
                </View>

                <Text style={[styles.hwDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                  {hw.description}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.footerLeft}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Teacher</Text>
                    <Text style={[styles.metaValue, { color: theme.text }]}>{hw.teacherName || 'Class Teacher'}</Text>
                  </View>
                  <View style={styles.footerRight}>
                    <View style={styles.dueDateBox}>
                      <Clock size={12} color={colors.secondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.dueDateText, { color: colors.secondary }]}>
                        Due: {new Date(hw.dueDate).toLocaleDateString('en-GB')}
                      </Text>
                    </View>
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

    </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 48,
    marginHorizontal: 16,
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
    paddingHorizontal: 16,
    marginBottom: 18,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  },
  dueDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
