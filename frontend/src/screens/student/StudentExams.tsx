import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { Calendar, Clock, Download, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

const formatTime12Hour = (timeStr: string, session?: string) => {
  if (!timeStr) {
    return session === 'Afternoon' ? '01:30 PM' : '09:00 AM';
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].trim();
  if (isNaN(hours)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
};

interface StudentExamsProps {
  onBack: () => void;
}

export const StudentExams: React.FC<StudentExamsProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [countdownText, setCountdownText] = useState('No upcoming exams');
  const [nextExamSubject, setNextExamSubject] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/exams');
      setExams(res.data || []);
      calculateCountdown(res.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve your exam timetable.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCountdown = (examList: any[]) => {
    if (examList.length === 0) return;

    // Flatten all subjects with date & startTime
    const allSlots: any[] = [];
    examList.forEach(ex => {
      if (ex.subjects) {
        ex.subjects.forEach((s: any) => {
          if (s.date) {
            const dateStr = s.date.split('T')[0];
            const timeStr = s.startTime || '09:00';
            const examDateTime = new Date(`${dateStr}T${timeStr}`);
            allSlots.push({
              subjectName: s.subject?.name || 'Exam Slot',
              dateTime: examDateTime
            });
          }
        });
      }
    });

    // Sort chronologically and filter future exams
    const now = new Date();
    const futureSlots = allSlots
      .filter(s => s.dateTime > now)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    if (futureSlots.length > 0) {
      const next = futureSlots[0];
      setNextExamSubject(next.subjectName);

      // Compute simple countdown
      const diffMs = next.dateTime.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        setCountdownText(`${diffDays}d ${diffHours}h remaining`);
      } else if (diffHours > 0) {
        setCountdownText(`${diffHours}h ${diffMins}m remaining`);
      } else {
        setCountdownText(`${diffMins}m remaining`);
      }
    } else {
      setCountdownText('No upcoming exams');
      setNextExamSubject('');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPDF = (id: string) => {
    const pdfUrl = `${api.defaults.baseURL}/student/exams/${id}/pdf`;
    Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'Failed to download timetable PDF. Make sure you are authenticated.'));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text, marginLeft: 12 }]}>Exam Timetable Hub</Text>
      </View>

      {/* Countdown Card */}
      {nextExamSubject ? (
        <Card style={styles.countdownCard}>
          <View style={[styles.countdownIconBg, { backgroundColor: '#FF950015' }]}>
            <Clock size={24} color="#FF9500" />
          </View>
          <View style={styles.countdownContent}>
            <Text style={styles.countdownTitle}>Next Exam: {nextExamSubject}</Text>
            <Text style={styles.countdownTimer}>{countdownText}</Text>
          </View>
        </Card>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.listSection}>
          {exams.length === 0 ? (
            <EmptyState title="No Published Exams" message="Your upcoming examination timetables will appear here once published." iconName="Calendar" />
          ) : (
            exams.map(ex => (
              <Card key={ex._id} style={styles.examCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.examName, { color: theme.text }]}>{ex.examName}</Text>
                    <Text style={[styles.instructions, { color: theme.textSecondary }]}>Rules: {ex.instructions || 'Follow standard exam instructions.'}</Text>
                  </View>
                  <Pressable style={styles.downloadBtn} onPress={() => handleDownloadPDF(ex._id)}>
                    <Download size={18} color="#fff" />
                  </Pressable>
                </View>

                {/* Subslots list */}
                <View style={styles.slotsTable}>
                  <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.th, { color: theme.text, flex: 1.5 }]}>Subject</Text>
                    <Text style={[styles.th, { color: theme.text, flex: 1.5 }]}>Date</Text>
                    <Text style={[styles.th, { color: theme.text, flex: 1.8 }]}>Time</Text>
                    <Text style={[styles.th, { color: theme.text, flex: 0.8 }]}>Max</Text>
                  </View>

                  {ex.subjects?.map((sub: any, idx: number) => (
                    <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.td, { color: theme.text, flex: 1.5, fontWeight: '600' }]}>{sub.subject?.name || 'Subject'}</Text>
                      <Text style={[styles.td, { color: theme.textSecondary, flex: 1.5 }]}>{sub.date ? sub.date.split('T')[0] : ''}</Text>
                      <Text style={[styles.td, { color: theme.textSecondary, flex: 1.8 }]}>
                        {formatTime12Hour(sub.startTime, sub.session)} – {formatTime12Hour(sub.endTime, sub.session)}
                      </Text>
                      <Text style={[styles.td, { color: theme.textSecondary, flex: 0.8 }]}>{sub.maxMarks}m</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  countdownCard: {
    backgroundColor: '#007aff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20
  },
  countdownIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownContent: {
    marginLeft: 14
  },
  countdownTitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500'
  },
  countdownTimer: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4
  },
  listSection: {
    paddingBottom: 40
  },
  examCard: {
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 12,
    marginBottom: 12
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  instructions: {
    fontSize: 12,
    marginTop: 4
  },
  downloadBtn: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8
  },
  slotsTable: {
    marginTop: 4
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 8
  },
  th: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
    alignItems: 'center'
  },
  td: {
    fontSize: 12
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  }
});
