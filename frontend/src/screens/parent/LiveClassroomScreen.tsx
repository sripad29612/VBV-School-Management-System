import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, Video, RefreshCw, BookOpen, Clock, Users } from 'lucide-react-native';

interface LiveClassroomScreenProps {
  onBack: () => void;
}

export const LiveClassroomScreen: React.FC<LiveClassroomScreenProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [refreshing, setRefreshing] = useState(false);

  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const activeChild = parentData.dashboard?.children?.find((c: any) => c._id === parentData.selectedChildId) || parentData.dashboard?.children?.[0];
  const snapshots = parentData.snapshots || { enabled: true, timeline: [], latestImage: '' };
  const latestTimestamp = snapshots.timeline && snapshots.timeline.length > 0 ? snapshots.timeline[0].timestamp : null;
  const homeworkList = parentData.homework || [];
  
  const latestHw = homeworkList.length > 0 ? homeworkList[0] : null;
  const teacherName = activeChild?.classTeacherName || 'Class Teacher';

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      alert('Security stream feed reconnected.');
    }, 1000);
  };

  const timelineLogs = snapshots.timeline ? snapshots.timeline.map((snap: any, index: number) => ({
    activity: `Camera Snapshot Capture`,
    time: new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: index === 0 ? 'Active' : 'Completed',
    imageUrl: snap.imageUrl
  })) : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Live Classroom</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Security surveillance video feed</Text>
        </View>
        <Video size={20} color={colors.primary} />
      </View>

      {/* ================= MONITOR SCREEN VIEWPORT ================= */}
      <View style={[styles.videoViewport, { backgroundColor: '#0F172A', shadowColor: colors.primary }]}>
        {refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting security feed...</Text>
          </View>
        ) : (
          <View style={{ flex: 1, position: 'relative' }}>
            {snapshots.latestImage ? (
              <Image source={{ uri: snapshots.latestImage }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, resizeMode: 'cover' }} />
            ) : null}
            <View style={styles.videoOverlay}>
              <View style={styles.liveOverlayBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveText}>LIVE NOW 🔴</Text>
              </View>
              
              <Pressable onPress={handleRefresh} style={styles.refreshBtn}>
                <RefreshCw size={14} color="#FFFFFF" />
              </Pressable>
            </View>

            {!snapshots.latestImage && (
              <View style={styles.videoPlaceholder}>
                <Video size={48} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.feedStatusText}>No live camera snapshot captured yet.</Text>
              </View>
            )}
            {snapshots.latestImage && (
              <View style={{ position: 'absolute', bottom: 10, left: 14, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                  Front Desk View · {latestTimestamp ? new Date(latestTimestamp).toLocaleTimeString() : ''}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ================= LIVE STATS INFO CARD ================= */}
      <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <View style={styles.statRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TEACHER IN CHARGE</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{teacherName}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>CHILD ATTENDANCE RATE</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{activeChild?.attendancePct ? `${Math.round(activeChild.attendancePct)}%` : 'No records'}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.statRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>LAST UPDATED</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {latestTimestamp ? new Date(latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>SURVEILLANCE STATUS</Text>
            <Text style={[styles.statValue, { color: snapshots.enabled ? colors.success : colors.danger }]}>
              {snapshots.enabled ? 'Active & Secure' : 'Disabled'}
            </Text>
          </View>
        </View>
      </View>

      {/* ================= TEACHER CLASS NOTES ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Active Blackboard Notes</Text>
      <View style={[styles.notesCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {latestHw ? (
          <>
            <View style={styles.notesHeader}>
              <BookOpen size={16} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={[styles.notesTitle, { color: theme.text }]}>Lesson Objective: {latestHw.title}</Text>
            </View>
            <Text style={[styles.notesBody, { color: theme.textSecondary }]}>
              "{latestHw.description}"
            </Text>
          </>
        ) : (
          <View style={{ padding: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center' }}>
              No active classroom notes or assignments posted today.
            </Text>
          </View>
        )}
      </View>

      {/* ================= TIMELINE LOGS ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Class Activity Timeline</Text>
      <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {timelineLogs.length > 0 ? (
          timelineLogs.map((log: any, index: number) => {
            const isActive = index === 0;
            return (
              <View key={index} style={[styles.timelineNode, index === timelineLogs.length - 1 && styles.noBorder]}>
                <View style={[styles.nodeIcon, { backgroundColor: isActive ? colors.primary + '15' : '#F1F5F9' }]}>
                  <Clock size={14} color={isActive ? colors.primary : theme.textSecondary} />
                </View>
                <View style={styles.nodeDetails}>
                  <Text style={[styles.nodeTitle, { color: theme.text, fontWeight: isActive ? '900' : '700' }]}>
                    {log.activity}
                  </Text>
                  <Text style={[styles.nodeTime, { color: theme.textSecondary }]}>{log.time}</Text>
                </View>
                <View style={[styles.nodeStatusBadge, { backgroundColor: isActive ? colors.primary : '#E2E8F0' }]}>
                  <Text style={[styles.nodeStatusText, { color: isActive ? '#FFFFFF' : theme.textSecondary }]}>
                    {isActive ? 'ACTIVE' : 'COMPLETED'}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              No classroom activity snapshots recorded in the last 48 hours.
            </Text>
          </View>
        )}
      </View>

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
  videoViewport: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 10,
    fontWeight: '700',
  },
  videoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  liveOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  feedStatusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 10,
    fontWeight: '600',
  },
  statsCard: {
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  notesCard: {
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
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  notesBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  timelineCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  nodeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nodeDetails: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 11,
  },
  nodeTime: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  nodeStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nodeStatusText: {
    fontSize: 8,
    fontWeight: '900',
  },
});
