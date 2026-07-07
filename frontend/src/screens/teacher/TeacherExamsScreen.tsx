import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { Clipboard, Calendar, Clock, MapPin } from 'lucide-react-native';
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

export const TeacherExamsScreen: React.FC = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [duties, setDuties] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher/exams/duties');
      setDuties(res.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve invigilation duties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Invigilation Duty Schedule</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.listSection}>
          {duties.length === 0 ? (
            <EmptyState title="No Duties Assigned" message="You have not been assigned invigilation duties for any published exams." iconName="Clipboard" />
          ) : (
            duties.map(dt => (
              <Card key={dt._id} style={styles.dutyCard}>
                <View style={styles.cardHeader}>
                  <Clipboard size={22} color={colors.primary} />
                  <Text style={[styles.examName, { color: theme.text }]}>{dt.examName}</Text>
                </View>

                {dt.subjects?.map((sub: any, index: number) => (
                  <View key={index} style={[styles.subRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.subjectTitle, { color: theme.text }]}>{sub.subject?.name || 'Subject'}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaCol}>
                        <Calendar size={13} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{sub.date ? sub.date.split('T')[0] : ''}</Text>
                      </View>
                      
                      <View style={styles.metaCol}>
                        <Clock size={13} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                          {formatTime12Hour(sub.startTime, sub.session)} – {formatTime12Hour(sub.endTime, sub.session)}
                        </Text>
                      </View>
                    </View>

                    {dt.classes && dt.classes.length > 0 && (
                      <View style={styles.classesBadgeRow}>
                        {dt.classes.map((c: any) => (
                          <View key={c._id || c} style={styles.classBadge}>
                            <Text style={styles.classBadgeText}>{c.name || 'Class'}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
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
  listSection: {
    paddingBottom: 40
  },
  dutyCard: {
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 10,
    marginBottom: 12
  },
  examName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8
  },
  subRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginBottom: 4
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 6
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4
  },
  classesBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  classBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary
  }
});
