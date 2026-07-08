import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { ArrowLeft, Plus, Clipboard, FileText, CheckCircle, UploadCloud, X, Calendar } from 'lucide-react-native';

interface TeacherHomeworkScreenProps {
  onBack: () => void;
  onRefreshData?: () => void;
}

export const TeacherHomeworkScreen: React.FC<TeacherHomeworkScreenProps> = ({ onBack, onRefreshData }) => {
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Dynamic list of past homeworks from MongoDB
  const pastHomeworks = teacherData.dashboard?.recentHomework ? teacherData.dashboard.recentHomework.map((hw: any) => ({
    id: hw._id || hw.id,
    title: hw.title,
    description: hw.description,
    maxMarks: hw.maxMarks ? String(hw.maxMarks) : '100'
  })) : [];

  // Resolve assigned classes dynamically:
  // 1. Primary class (assignedClass, e.g. "Class VI - A")
  // 2. Schedule classes (e.g. "Class 3A", "Class 3B", "Class 4A")
  const primaryClass = classContext.className;
  const primaryClassId = classContext.classId;

  const [classList, setClassList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const list = [{ id: primaryClassId, name: primaryClass }];
    
    // Scan schedules to find other classes this teacher teaches
    if (teacherData.dashboard?.schedules?.length > 0) {
      teacherData.dashboard.schedules.forEach((sched: any) => {
        const cName = `${sched.class}${sched.section ? ' - ' + sched.section : ''}`;
        if (!list.find(item => item.name === cName)) {
          const hashId = sched.classId;
          list.push({ id: hashId, name: cName });
        }
      });
    }

    setClassList(list.filter(item => item.id));
    // Auto-select the primary class
    if (primaryClassId) {
      setSelectedClasses([primaryClassId]);
    } else if (list.length > 0 && list[0].id) {
      setSelectedClasses([list[0].id]);
    } else {
      setSelectedClasses([]);
    }
  }, [teacherData.dashboard]);

  const handleToggleClass = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(prev => prev.filter(id => id !== classId));
    } else {
      setSelectedClasses(prev => [...prev, classId]);
    }
  };

  // Productivity: Copy Previous Homework
  const handleCopyPrevious = (pastHw: any) => {
    setTitle(pastHw.title);
    setDescription(pastHw.description);
    setMaxMarks(pastHw.maxMarks);
    setShowCopyModal(false);
  };

  const handleAssign = async () => {
    if (!title || !description || !dueDate) {
      return alert('Please fill in all homework details');
    }
    if (selectedClasses.length === 0) {
      return alert('Please select at least one class');
    }

    setSubmitting(true);

    try {
      let resolvedSubjectId = null;
      if (teacherData.dashboard?.subjects && teacherData.dashboard.subjects.length > 0) {
        const sub = teacherData.dashboard.subjects[0];
        resolvedSubjectId = typeof sub === 'object' ? sub._id : sub;
      } else if (teacherData.dashboard?.recentHomework?.length > 0) {
        const hw = teacherData.dashboard.recentHomework[0];
        if (hw.subject?._id) resolvedSubjectId = hw.subject._id;
      }

      if (!resolvedSubjectId) {
        return alert('You must have at least one subject assigned to create homework.');
      }

      for (const classId of selectedClasses) {
        if (classId) {
          await api.post('/teacher/homework', {
            classId: classId,
            subjectId: resolvedSubjectId,
            title: title,
            description: `${description} [Max Marks: ${maxMarks}]`,
            dueDate: new Date(dueDate)
          });
        }
      }

      alert(`Homework assigned successfully to ${selectedClasses.length} class(es)!`);
      if (onRefreshData) onRefreshData();
      onBack();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign homework.');
      onBack();
    }
 finally {
      setSubmitting(false);
    }
  };

  const recentHomeworkList = teacherData.dashboard?.recentHomework || [];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#F97316" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Assign Homework</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Create and distribute assignments</Text>
          </View>
        </View>

        {/* ================= PRODUCTIVITY PANEL ================= */}
        <Pressable 
          onPress={() => setShowCopyModal(true)}
          style={[styles.copyBtn, { backgroundColor: '#F9731615', borderColor: '#F9731630' }]}
        >
          <Clipboard size={16} color="#F97316" style={{ marginRight: 8 }} />
          <Text style={styles.copyBtnText}>Copy Previous Homework</Text>
        </Pressable>

        {/* ================= FORM CARD ================= */}
        <Card style={styles.formCard}>
          {/* Read Only Teacher Profile Info */}
          <View style={styles.readOnlyContainer}>
            <View style={styles.readOnlyItem}>
              <Text style={[styles.readOnlyLabel, { color: theme.textSecondary }]}>Subject</Text>
              <Text style={[styles.readOnlyValue, { color: theme.text }]}>
                {teacherData.dashboard?.subjects && teacherData.dashboard.subjects.length > 0
                  ? (typeof teacherData.dashboard.subjects[0] === 'object' ? teacherData.dashboard.subjects[0].name : teacherData.dashboard.subjects[0])
                  : 'Assigned Subject'}
              </Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={[styles.readOnlyLabel, { color: theme.textSecondary }]}>Teacher</Text>
              <Text style={[styles.readOnlyValue, { color: theme.text }]}>{user?.name || 'Teacher'}</Text>
            </View>
          </View>

          {/* Class Checklist (Restricted to assigned classes) */}
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Target Classes</Text>
          <View style={styles.checklistGrid}>
            {classList.map(cls => {
              const checked = selectedClasses.includes(cls.id);
              return (
                <Pressable
                  key={cls.id}
                  onPress={() => handleToggleClass(cls.id)}
                  style={[
                    styles.checkPill,
                    {
                      backgroundColor: checked ? '#F97316' : theme.background,
                      borderColor: checked ? '#F97316' : theme.border
                    }
                  ]}
                >
                  <Text style={[styles.checkText, { color: checked ? '#fff' : theme.textSecondary }]}>
                    {cls.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Form inputs */}
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Homework Title</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Chapter 5 Fractions Practice"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { color: theme.text }]}>Instructions / Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Describe the questions or pages to complete..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Due Date</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Max Marks</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
                value={maxMarks}
                onChangeText={setMaxMarks}
              />
            </View>
          </View>

          {/* Attachment options (Mock UI) */}
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Attachment & Images</Text>
          <View style={styles.uploadContainer}>
            <Pressable style={[styles.uploadBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <UploadCloud size={20} color={theme.textSecondary} />
              <Text style={[styles.uploadText, { color: theme.textSecondary }]}>Upload PDF / Document</Text>
            </Pressable>
            <Pressable style={[styles.uploadBox, { borderColor: theme.border, backgroundColor: theme.background, marginTop: 8 }]}>
              <UploadCloud size={20} color={theme.textSecondary} />
              <Text style={[styles.uploadText, { color: theme.textSecondary }]}>Upload Images (Reference)</Text>
            </Pressable>
          </View>

          <Pressable 
            onPress={handleAssign} 
            disabled={submitting}
            style={[styles.assignBtn, { backgroundColor: '#F97316' }]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Plus size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.assignBtnText}>Assign Homework</Text>
              </>
            )}
          </Pressable>
        </Card>

        {/* ================= RECENTLY ASSIGNED ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Recently Assigned</Text>
        {recentHomeworkList.length > 0 ? (
          recentHomeworkList.map((hw: any, idx: number) => (
            <View key={hw._id || idx} style={[styles.hwCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.hwStrip} />
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={[styles.hwSubject, { color: '#F97316' }]}>{hw.subject?.name || 'Subject'}</Text>
                <Text style={[styles.hwTitleText, { color: theme.text }]}>{hw.title}</Text>
                <Text style={[styles.hwMetaText, { color: theme.textSecondary }]}>
                  Class: {hw.class?.name || 'Class'} {hw.class?.section || ''}
                </Text>
              </View>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-GB') : ''}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="Recently Assigned"
            message="No homework has been assigned."
            iconName="FileText"
          />
        )}

      </ScrollView>

      {/* ================= COPY PREVIOUS HOMEWORK MODAL ================= */}
      <Modal
        visible={showCopyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCopyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Copy Previous Homework</Text>
              <Pressable onPress={() => setShowCopyModal(false)}>
                <X size={20} color={theme.text} />
              </Pressable>
            </View>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {pastHomeworks.length > 0 ? (
                pastHomeworks.map((ph: any) => (
                  <Pressable
                    key={ph.id}
                    onPress={() => handleCopyPrevious(ph)}
                    style={[styles.pastHwItem, { borderBottomColor: theme.border }]}
                  >
                    <Text style={[styles.pastHwTitle, { color: theme.text }]}>{ph.title}</Text>
                    <Text style={[styles.pastHwDesc, { color: theme.textSecondary }]} numberOfLines={2}>{ph.description}</Text>
                    <Text style={[styles.pastHwMarks, { color: '#F97316' }]}>Max Marks: {ph.maxMarks}</Text>
                  </Pressable>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>No past homeworks found.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    padding: 16,
    marginVertical: 0,
  },
  readOnlyContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  readOnlyItem: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readOnlyValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  checkPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  checkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  uploadContainer: {
    marginVertical: 4,
  },
  uploadBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  assignBtn: {
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  assignBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 12,
  },
  hwCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingRight: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  hwStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#F97316',
  },
  hwSubject: {
    fontSize: 9,
    fontWeight: '800',
  },
  hwTitleText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  hwMetaText: {
    fontSize: 10,
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'center',
  },
  dueBadgeText: {
    color: '#E65100',
    fontSize: 9,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pastHwItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pastHwTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  pastHwDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  pastHwMarks: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  }
});
