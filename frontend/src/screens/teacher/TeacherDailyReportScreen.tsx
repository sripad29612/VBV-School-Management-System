import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { reportService, DailyReport } from '../../services/reportService';
import { EmptyState } from '../../components/EmptyState';
import { ArrowLeft, Save, Send, Clock, BookOpen, CheckSquare, PlusCircle } from 'lucide-react-native';

interface TeacherDailyReportScreenProps {
  onBack: () => void;
  onRefreshData?: () => void;
  initialClass?: string; // pre-populated from timetable
}

export const TeacherDailyReportScreen: React.FC<TeacherDailyReportScreenProps> = ({ 
  onBack, 
  onRefreshData,
  initialClass 
}) => {
  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const { user } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const getTeacherClassContext = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const override = window.localStorage.getItem('active_teacher_class_context');
      if (override) {
        const parsed = JSON.parse(override);
        return {
          classId: parsed.classId || 'class_cover_temp_id',
          className: parsed.className || 'Not Assigned',
          isSubstitute: true,
          originalTeacher: parsed.originalTeacher
        };
      }
    }
    return {
      classId: teacherData.dashboard?.assignedClassId || null,
      className: teacherData.dashboard?.assignedClass || 'Not Assigned',
      isSubstitute: false,
      originalTeacher: null
    };
  };

  const classContext = getTeacherClassContext();

  const [activeReportId, setActiveReportId] = useState<string | undefined>(undefined);
  const [className, setClassName] = useState(classContext.className || 'Not Assigned');

  useEffect(() => {
    setClassName(classContext.className || 'Not Assigned');
  }, [classContext.className]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [chapter, setChapter] = useState('');
  const [topicCovered, setTopicCovered] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [teachingMethod, setTeachingMethod] = useState('');
  const [activities, setActivities] = useState('');
  const [homeworkGiven, setHomeworkGiven] = useState('');
  const [studentsPresent, setStudentsPresent] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'Completed' | 'In Progress' | 'Delayed'>('Completed');
  const [notes, setNotes] = useState('');

  const [history, setHistory] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set initial class name if navigated from timetable period
  useEffect(() => {
    if (initialClass) {
      setClassName(initialClass);
    } else {
      setClassName(classContext.className);
    }
  }, [initialClass, classContext.className]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await reportService.fetchReports();
      const filtered = data.filter(r => r.teacherName === (user?.name || 'Teacher'));
      setHistory(filtered.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const clearForm = () => {
    setActiveReportId(undefined);
    setChapter('');
    setTopicCovered('');
    setLearningObjectives('');
    setTeachingMethod('');
    setActivities('');
    setHomeworkGiven('');
    setStudentsPresent('');
    setCompletionStatus('Completed');
    setNotes('');
  };

  const loadReportIntoForm = (report: DailyReport) => {
    setActiveReportId(report._id);
    setClassName(report.className);
    setDate(report.date);
    setChapter(report.chapter);
    setTopicCovered(report.topicCovered);
    setLearningObjectives(report.learningObjectives);
    setTeachingMethod(report.teachingMethod);
    setActivities(report.activities);
    setHomeworkGiven(report.homeworkGiven);
    setStudentsPresent(report.studentsPresent.toString());
    setCompletionStatus(report.completionStatus);
    setNotes(report.notes || '');
  };

  const handleSaveDraft = async () => {
    if (!chapter || !topicCovered) {
      return alert('Please fill in Chapter and Topic Covered to save a draft.');
    }
    setSubmitting(true);
    try {
      await reportService.saveDraft({
        _id: activeReportId,
        className,
        subject: teacherData.dashboard?.subjects && teacherData.dashboard.subjects.length > 0
          ? (typeof teacherData.dashboard.subjects[0] === 'object' ? teacherData.dashboard.subjects[0].name : teacherData.dashboard.subjects[0])
          : 'Subject',
        date,
        chapter,
        topicCovered,
        learningObjectives,
        teachingMethod,
        activities,
        homeworkGiven,
        studentsPresent: Number(studentsPresent) || 0,
        completionStatus,
        notes,
        teacherName: user?.name || 'Teacher'
      });
      alert('Report draft saved successfully!');
      clearForm();
      loadHistory();
    } catch (err) {
      console.error(err);
      alert('Failed to save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!chapter || !topicCovered || !learningObjectives || !teachingMethod) {
      return alert('Please fill in Chapter, Topic Covered, Learning Objectives, and Teaching Method before submitting.');
    }
    setSubmitting(true);
    try {
      await reportService.createReport({
        _id: activeReportId,
        className,
        subject: teacherData.dashboard?.subjects && teacherData.dashboard.subjects.length > 0
          ? (typeof teacherData.dashboard.subjects[0] === 'object' ? teacherData.dashboard.subjects[0].name : teacherData.dashboard.subjects[0])
          : 'Subject',
        date,
        chapter,
        topicCovered,
        learningObjectives,
        teachingMethod,
        activities,
        homeworkGiven,
        studentsPresent: Number(studentsPresent) || 0,
        completionStatus,
        notes,
        teacherName: user?.name || 'Teacher'
      });

      alert('Report submitted to Principal Portal successfully!');
      clearForm();
      loadHistory();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = '#E2E8F0';
    let text = '#64748B';
    
    if (status === 'Submitted') {
      bg = '#FFE8D6';
      text = '#D97706';
    } else if (status === 'Reviewed') {
      bg = '#E0F2FE';
      text = '#0284C7';
    } else if (status === 'Approved') {
      bg = '#D1E7DD';
      text = '#0F5132';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#06B6D4" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Daily Teaching Report</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Submit daily lessons details to Principal</Text>
          </View>
        </View>

        {/* ================= FORM CARD ================= */}
        <Card style={styles.formCard}>
          <View style={styles.formTitleRow}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              {activeReportId ? 'Edit Report' : 'New Report Entry'}
            </Text>
            {activeReportId && (
              <Pressable onPress={clearForm} style={styles.clearBtn}>
                <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '700' }}>Reset/New</Text>
              </Pressable>
            )}
          </View>

          {/* Form fields */}
          <View style={styles.readOnlyRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Subject</Text>
              <Text style={[styles.readOnlyText, { color: theme.text }]}>Mathematics</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Class Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={className}
                onChangeText={setClassName}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1.2, marginRight: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Report Date</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={{ flex: 0.8, marginLeft: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Present Students</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={studentsPresent}
                onChangeText={setStudentsPresent}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Chapter Name / Number</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Chapter 4 Fractions"
            placeholderTextColor={theme.textSecondary}
            value={chapter}
            onChangeText={setChapter}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Topic Covered</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Describe the specific topics taught..."
            placeholderTextColor={theme.textSecondary}
            value={topicCovered}
            onChangeText={setTopicCovered}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Learning Objectives</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Objectives students are expected to learn..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={2}
            value={learningObjectives}
            onChangeText={setLearningObjectives}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Teaching Method & Visual Aids Used</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Blackboard drawings, Visual cards"
            placeholderTextColor={theme.textSecondary}
            value={teachingMethod}
            onChangeText={setTeachingMethod}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Classroom Activities</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Detail student activities..."
            placeholderTextColor={theme.textSecondary}
            value={activities}
            onChangeText={setActivities}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Homework Assigned</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Exercise 4.2 Questions 1-5"
            placeholderTextColor={theme.textSecondary}
            value={homeworkGiven}
            onChangeText={setHomeworkGiven}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Completion Status</Text>
          <View style={styles.statusSelectRow}>
            {['Completed', 'In Progress', 'Delayed'].map((status) => (
              <Pressable
                key={status}
                onPress={() => setCompletionStatus(status as any)}
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: completionStatus === status ? '#06B6D4' : theme.background,
                    borderColor: completionStatus === status ? '#06B6D4' : theme.border,
                  }
                ]}
              >
                <Text style={[styles.statusPillText, { color: completionStatus === status ? '#fff' : theme.textSecondary }]}>
                  {status}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Teacher Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Any special remarks or disruptions..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Save Draft / Submit buttons */}
          <View style={styles.formActions}>
            <Pressable 
              onPress={handleSaveDraft}
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: '#06B6D4', borderWidth: 1.5 }]}
            >
              <Save size={16} color="#06B6D4" style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: '#06B6D4' }]}>Save Draft</Text>
            </Pressable>
            
            <Pressable 
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.actionBtn, { backgroundColor: '#06B6D4', flex: 1.3 }]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Send size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>Submit to Principal</Text>
                </>
              )}
            </Pressable>
          </View>
        </Card>

        {/* ================= HISTORY LIST ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Teaching Reports Ledger</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#06B6D4" />
        ) : history.length > 0 ? (
          history.map(item => (
            <Pressable 
              key={item._id}
              onPress={() => loadReportIntoForm(item)}
              style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.historyCardHeader}>
                <View style={styles.historyCardMeta}>
                  <BookOpen size={14} color="#06B6D4" />
                  <Text style={[styles.historyClassText, { color: theme.text }]}>{item.className}</Text>
                  <Text style={[styles.historyDateText, { color: theme.textSecondary }]}>· {item.date}</Text>
                </View>
                {getStatusBadge(item.status)}
              </View>
              <Text style={[styles.historyTopic, { color: theme.text }]}>
                {item.chapter} - {item.topicCovered}
              </Text>
              <View style={styles.historyDetails}>
                <Text style={{ fontSize: 9, color: theme.textSecondary }}>Completion: {item.completionStatus}</Text>
                <Text style={{ fontSize: 9, color: theme.textSecondary }}>Students Present: {item.studentsPresent}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Teaching Reports"
            message="No teaching reports submitted yet."
            iconName="BookOpen"
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
  formCard: {
    padding: 16,
    marginVertical: 0,
  },
  formTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  clearBtn: {
    padding: 4,
  },
  readOnlyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  readOnlyText: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    lineHeight: 38,
    fontSize: 12,
    fontWeight: '800',
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  textArea: {
    height: 60,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusSelectRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionBtn: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 14,
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: 'rgba(0,0,0,0.01)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyClassText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  historyDateText: {
    fontSize: 10,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  historyTopic: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 16,
  }
});
