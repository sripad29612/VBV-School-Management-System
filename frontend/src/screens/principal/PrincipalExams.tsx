import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Alert, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { 
  Calendar, Clock, Plus, Trash2, Edit2, FileText, CheckCircle, 
  Copy, Printer, Eye, ArrowLeft, CalendarDays
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface PrincipalExamsProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const formatTime12Hour = (timeStr: string, session?: string) => {
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

export const PrincipalExams: React.FC<PrincipalExamsProps> = ({ onBack, onSyncAllPortals }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Form states
  const [editingExam, setEditingExam] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examType, setExamType] = useState('Unit Test'); // Unit Test, Quarterly, Half-Yearly, Annual, Custom
  const [customExamName, setCustomExamName] = useState('');
  const [examStartDate, setExamStartDate] = useState(''); // YYYY-MM-DD
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Completed'>('Draft');

  // Arranged subjects state: Record<subjectId, { dayNumber: number, session: 'Morning' | 'Afternoon' | 'None', maxMarks: string }>
  const [arrangedSubjects, setArrangedSubjects] = useState<Record<string, { dayNumber: number, session: 'Morning' | 'Afternoon' | 'None', maxMarks: string }>>({});

  // Copy Previous states
  const [copySourceId, setCopySourceId] = useState('');
  const [copyTargetYear, setCopyTargetYear] = useState('2027-28');

  const loadData = async () => {
    setLoading(true);
    try {
      const [examsRes, classesRes] = await Promise.all([
        api.get('/principal/exams').catch(() => ({ data: [] })),
        api.get('/principal/classes').catch(() => ({ data: [] }))
      ]);

      setExams(examsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve academic schedules details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    // Auto load subjects for that class
    const cls = classes.find(c => c._id === classId);
    const initialArrangements: Record<string, any> = {};
    if (cls && cls.subjects) {
      cls.subjects.forEach((sub: any) => {
        initialArrangements[sub._id] = {
          dayNumber: 1,
          session: 'None',
          maxMarks: '100',
          startTime: '',
          endTime: ''
        };
      });
    }
    setArrangedSubjects(initialArrangements);
  };

  const updateArrangement = (subId: string, field: string, value: any) => {
    setArrangedSubjects(prev => {
      const updated = {
        ...prev[subId],
        [field]: value
      };
      if (field === 'session') {
        if (value === 'Morning') {
          updated.startTime = '09:00';
          updated.endTime = '12:00';
        } else if (value === 'Afternoon') {
          updated.startTime = '13:30';
          updated.endTime = '16:30';
        } else {
          updated.startTime = '';
          updated.endTime = '';
        }
      }
      return {
        ...prev,
        [subId]: updated
      };
    });
  };

  const handleSaveExam = async () => {
    const activeClass = classes.find(c => c._id === selectedClassId);
    if (!selectedClassId || !examStartDate) {
      Alert.alert('Required Fields', 'Please select Class and specify Exam Start Date.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(examStartDate)) {
      Alert.alert('Invalid Date', 'Exam Start Date must be in YYYY-MM-DD format.');
      return;
    }

    const scheduledSlots: any[] = [];
    const subjectsToSchedule = Object.keys(arrangedSubjects);

    for (const subId of subjectsToSchedule) {
      const arr = arrangedSubjects[subId];
      if (arr.session !== 'None') {
        const offsetDays = arr.dayNumber - 1;
        const startDateObj = new Date(examStartDate);
        const slotDate = new Date(startDateObj.getTime() + offsetDays * 24 * 60 * 60 * 1000);
        
        // Validation: Start and End Time must be present and valid format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const subName = classes.find(c => c._id === selectedClassId)?.subjects?.find((s: any) => s._id === subId)?.name || 'Subject';
        if (!arr.startTime || !timeRegex.test(arr.startTime)) {
          Alert.alert('Invalid Time', `Please enter a valid start time (HH:MM) for ${subName}.`);
          return;
        }
        if (!arr.endTime || !timeRegex.test(arr.endTime)) {
          Alert.alert('Invalid Time', `Please enter a valid end time (HH:MM) for ${subName}.`);
          return;
        }

        const [startH, startM] = arr.startTime.split(':').map(Number);
        const [endH, endM] = arr.endTime.split(':').map(Number);
        const startVal = startH * 60 + startM;
        const endVal = endH * 60 + endM;

        if (endVal <= startVal) {
          Alert.alert('Invalid Timings', `End time must occur after start time for ${subName}.`);
          return;
        }

        scheduledSlots.push({
          subject: subId,
          date: slotDate.toISOString().split('T')[0],
          startTime: arr.startTime,
          endTime: arr.endTime,
          maxMarks: Number(arr.maxMarks) || 100,
          session: arr.session,
          dayNumber: arr.dayNumber,
          invigilator: null
        });
      }
    }

    // Same day overlap validation in frontend
    for (let i = 0; i < scheduledSlots.length; i++) {
      const slotA = scheduledSlots[i];
      const [saH, saM] = slotA.startTime.split(':').map(Number);
      const [eaH, eaM] = slotA.endTime.split(':').map(Number);
      const startA = saH * 60 + saM;
      const endA = eaH * 60 + eaM;

      for (let j = i + 1; j < scheduledSlots.length; j++) {
        const slotB = scheduledSlots[j];
        if (slotA.date === slotB.date) {
          const [sbH, sbM] = slotB.startTime.split(':').map(Number);
          const [ebH, ebM] = slotB.endTime.split(':').map(Number);
          const startB = sbH * 60 + sbM;
          const endB = ebH * 60 + ebM;

          if (startA < endB && startB < endA) {
            const subAName = classes.find(c => c._id === selectedClassId)?.subjects?.find((s: any) => s._id === slotA.subject)?.name || 'Subject A';
            const subBName = classes.find(c => c._id === selectedClassId)?.subjects?.find((s: any) => s._id === slotB.subject)?.name || 'Subject B';
            Alert.alert('Time Conflict', `Conflict detected on Day ${slotA.dayNumber} (${slotA.date}): '${subAName}' and '${subBName}' exams overlap in time.`);
            return;
          }
        }
      }
    }

    if (scheduledSlots.length === 0) {
      Alert.alert('No Scheduled Subjects', 'Please assign at least one subject to a session.');
      return;
    }

    const finalName = examType === 'Custom' ? customExamName : `${examType} - ${activeClass?.name || 'Exam'}`;
    if (!finalName.trim()) {
      Alert.alert('Required Name', 'Please specify Exam Name.');
      return;
    }

    setSubmitting(true);
    const payload = {
      examName: finalName,
      academicYear,
      classes: [selectedClassId],
      instructions,
      status,
      subjects: scheduledSlots
    };

    console.log('[DEBUG FRONTEND] Button click: handleSaveExam');
    console.log('[DEBUG FRONTEND] API URL:', editingExam ? `/principal/exams/${editingExam._id}` : '/principal/exams');
    console.log('[DEBUG FRONTEND] Payload:', JSON.stringify(payload, null, 2));

    try {
      if (editingExam) {
        await api.put(`/principal/exams/${editingExam._id}`, payload);
        Alert.alert('Success', 'Exam timetable updated.');
      } else {
        await api.post('/principal/exams', payload);
        Alert.alert('Success', 'Exam schedule created successfully.');
      }
      setShowScheduleModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Clash / Error', err.response?.data?.message || 'Conflict detected. Check for duplicate slots.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
    try {
      await api.post(`/principal/exams/${id}/publish`, { status: targetStatus });
      Alert.alert('Success', `Timetable status set to ${targetStatus}.`);
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update schedule status.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/principal/exams/${id}/duplicate`);
      Alert.alert('Success', 'Timetable duplicated to Draft.');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to duplicate schedule.');
    }
  };

  const handleCopyPrevious = async () => {
    if (!copySourceId) return;
    setSubmitting(true);
    try {
      await api.post(`/principal/exams/${copySourceId}/copy-previous`, { targetYear: copyTargetYear });
      Alert.alert('Success', `Schedule copied.`);
      setShowCopyModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to copy exam schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = (id: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to permanently delete exam timetable: ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/principal/exams/${id}`);
              Alert.alert('Success', 'Exam schedule deleted.');
              loadData();
            } catch (err) {
              Alert.alert('Error', 'Could not delete exam.');
            }
          }
        }
      ]
    );
  };

  const handleDownloadPDF = (id: string) => {
    const pdfUrl = `${api.defaults.baseURL}/principal/exams/${id}/pdf`;
    Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'Could not open PDF file.'));
  };

  const openAddExam = () => {
    setEditingExam(null);
    setAcademicYear('2026-27');
    setSelectedClassId(classes[0]?._id || '');
    setExamType('Unit Test');
    setCustomExamName('');
    setExamStartDate('');
    setInstructions('');
    setStatus('Draft');
    // Clear subject arrangements
    if (classes[0]) handleClassChange(classes[0]._id);
    else setArrangedSubjects({});
    setShowScheduleModal(true);
  };

  const openEditExam = (ex: any) => {
    setEditingExam(ex);
    setAcademicYear(ex.academicYear || '2026-27');
    const targetClass = ex.classes?.[0]?._id || ex.classes?.[0] || '';
    setSelectedClassId(targetClass);
    setInstructions(ex.instructions || '');
    setStatus(ex.status || 'Draft');
    
    // Resolve exam type
    const nameStr = ex.examName || '';
    if (nameStr.startsWith('Unit Test')) setExamType('Unit Test');
    else if (nameStr.startsWith('Quarterly')) setExamType('Quarterly');
    else if (nameStr.startsWith('Half-Yearly')) setExamType('Half-Yearly');
    else if (nameStr.startsWith('Annual')) setExamType('Annual');
    else {
      setExamType('Custom');
      setCustomExamName(nameStr);
    }

    // Resolve exam start date as minimum of all subject dates
    const dates = ex.subjects?.map((s: any) => new Date(s.date).getTime()) || [];
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      setExamStartDate(minDate.toISOString().split('T')[0]);
    } else {
      setExamStartDate('');
    }

    // Map arranged subjects from DB slots
    const cls = classes.find(c => c._id === targetClass);
    const initialArrangements: Record<string, any> = {};
    if (cls && cls.subjects) {
      cls.subjects.forEach((sub: any) => {
        const dbSlot = ex.subjects?.find((s: any) => (s.subject?._id || s.subject) === sub._id);
        if (dbSlot) {
          initialArrangements[sub._id] = {
            dayNumber: dbSlot.dayNumber || 1,
            session: dbSlot.session || 'Morning',
            maxMarks: String(dbSlot.maxMarks || '100'),
            startTime: dbSlot.startTime || (dbSlot.session === 'Morning' ? '09:00' : '13:30'),
            endTime: dbSlot.endTime || (dbSlot.session === 'Morning' ? '12:00' : '16:30')
          };
        } else {
          initialArrangements[sub._id] = {
            dayNumber: 1,
            session: 'None',
            maxMarks: '100',
            startTime: '',
            endTime: ''
          };
        }
      });
    }
    setArrangedSubjects(initialArrangements);
    setShowScheduleModal(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text, marginLeft: 12 }]}>Exam Schedules</Text>
      </View>

      {/* Top Banner Actions */}
      <View style={styles.actionHeader}>
        <Pressable style={styles.headerBtn} onPress={openAddExam}>
          <Plus size={18} color="#fff" />
          <Text style={styles.headerBtnTxt}>New Timetable</Text>
        </Pressable>

        <Pressable style={[styles.headerBtn, { backgroundColor: '#5856d6' }]} onPress={() => setShowCopyModal(true)}>
          <Copy size={18} color="#fff" />
          <Text style={styles.headerBtnTxt}>Copy Past Schedule</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.listSection}>
          {exams.length === 0 ? (
            <EmptyState title="No Exam Schedules" message="Configure and publish session exam schedules." iconName="Calendar" />
          ) : (
            exams.map(ex => (
              <Card key={ex._id} style={styles.examCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Text style={[styles.examNameText, { color: theme.text }]}>{ex.examName}</Text>
                    <Text style={[styles.academicYearText, { color: theme.textSecondary }]}>Year: {ex.academicYear} | {ex.classes?.map((c: any) => c.name).join(', ')}</Text>
                  </View>
                  <View style={[styles.statusBadge, ex.status === 'Published' ? styles.badgePub : styles.badgeDraft]}>
                    <Text style={styles.badgeText}>{ex.status}</Text>
                  </View>
                </View>

                {/* Slots details list */}
                <View style={styles.slotsTable}>
                  {ex.subjects?.map((s: any, idx: number) => (
                    <View key={idx} style={styles.slotRowCompact}>
                      <CalendarDays size={14} color={theme.textSecondary} />
                      <Text style={[styles.slotDateText, { color: theme.text }]}>{s.date ? s.date.split('T')[0] : 'No Date'}</Text>
                      <Text style={[styles.slotSubjectText, { color: theme.text }]}>{s.subject?.name || 'Subject'}</Text>
                      <Text style={[styles.slotSessionText, { color: colors.primary }]}>
                        {formatTime12Hour(s.startTime, s.session)} – {formatTime12Hour(s.endTime, s.session)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardActions}>
                  <Pressable style={styles.actionBtn} onPress={() => openEditExam(ex)}>
                    <Edit2 size={15} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Modify</Text>
                  </Pressable>

                  <Pressable style={styles.actionBtn} onPress={() => handlePublish(ex._id, ex.status)}>
                    <CheckCircle size={15} color={ex.status === 'Published' ? '#ff9500' : '#34c759'} />
                    <Text style={[styles.actionBtnText, { color: ex.status === 'Published' ? '#ff9500' : '#34c759' }]}>
                      {ex.status === 'Published' ? 'Set Draft' : 'Publish'}
                    </Text>
                  </Pressable>

                  <Pressable style={styles.actionBtn} onPress={() => handleDownloadPDF(ex._id)}>
                    <FileText size={15} color="#5856d6" />
                    <Text style={[styles.actionBtnText, { color: '#5856d6' }]}>Print PDF</Text>
                  </Pressable>

                  <Pressable style={styles.actionBtn} onPress={() => handleDuplicate(ex._id)}>
                    <Copy size={15} color="#5856d6" />
                    <Text style={[styles.actionBtnText, { color: '#5856d6' }]}>Clone</Text>
                  </Pressable>

                  <Pressable style={styles.actionBtn} onPress={() => handleDeleteExam(ex._id, ex.examName)}>
                    <Trash2 size={15} color="#ff3b30" />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* SCHEDULE MODAL */}
      <Modal visible={showScheduleModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingExam ? 'Modify Exam Timetable' : 'Schedule New Timetable'}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Academic Year</Text>
              <TextInput placeholder="Academic Year (e.g. 2026-27)" style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.textSecondary} value={academicYear} onChangeText={setAcademicYear} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Class</Text>
              <View style={styles.selectColumn}>
                {classes.map(c => (
                  <Pressable key={c._id} onPress={() => handleClassChange(c._id)} style={[styles.selectOptCol, selectedClassId === c._id && styles.selectOptActive]}>
                    <Text style={[styles.selectOptText, { color: selectedClassId === c._id ? '#fff' : theme.text }]}>{c.name} ({c.section})</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Exam Type</Text>
              <View style={styles.selectRow}>
                {['Unit Test', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom'].map(type => (
                  <Pressable key={type} onPress={() => setExamType(type)} style={[styles.selectOpt, examType === type && styles.selectOptActive]}>
                    <Text style={{ color: examType === type ? '#fff' : theme.text }}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              {examType === 'Custom' && (
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Custom Exam Name</Text>
                  <TextInput placeholder="Enter custom name" style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.textSecondary} value={customExamName} onChangeText={setCustomExamName} />
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Exam Start Date</Text>
              <TextInput placeholder="Start Date (YYYY-MM-DD)" style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.textSecondary} value={examStartDate} onChangeText={setExamStartDate} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Special Instructions / General Rules</Text>
              <TextInput placeholder="General Rules" style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.textSecondary} value={instructions} onChangeText={setInstructions} />

              {/* Arranged subjects slot setup */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Arrange Subjects</Text>
              {Object.keys(arrangedSubjects).length === 0 ? (
                <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginBottom: 12 }}>Select a class to load subjects.</Text>
              ) : (
                Object.keys(arrangedSubjects).map(subId => {
                  const subArr = arrangedSubjects[subId];
                  const subObj = classes.find(c => c._id === selectedClassId)?.subjects?.find((s: any) => s._id === subId);
                  
                  return (
                    <View key={subId} style={[styles.subjectArrangeCard, { borderColor: theme.border }]}>
                      <Text style={[styles.arrangeSubName, { color: theme.text }]}>{subObj?.name || 'Subject'}</Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Day Number:</Text>
                        <View style={{ flexDirection: 'row' }}>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(day => (
                            <Pressable key={day} onPress={() => updateArrangement(subId, 'dayNumber', day)} style={[styles.miniBtn, subArr.dayNumber === day && styles.miniBtnActive]}>
                              <Text style={{ fontSize: 10, color: subArr.dayNumber === day ? '#fff' : theme.text }}>D{day}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Session:</Text>
                        <View style={{ flexDirection: 'row' }}>
                          {['None', 'Morning', 'Afternoon'].map(sess => (
                            <Pressable key={sess} onPress={() => updateArrangement(subId, 'session', sess)} style={[styles.miniBtnSess, subArr.session === sess && styles.miniBtnActive]}>
                              <Text style={{ fontSize: 10, color: subArr.session === sess ? '#fff' : theme.text }}>{sess}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      {subArr.session !== 'None' && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
                          <Text style={{ fontSize: 12, color: theme.textSecondary }}>Timings (HH:MM):</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput 
                              style={[styles.miniInput, { color: theme.text, borderColor: theme.border }]} 
                              placeholder="Start"
                              placeholderTextColor={theme.textSecondary}
                              value={subArr.startTime || ''} 
                              onChangeText={(val) => updateArrangement(subId, 'startTime', val)}
                              maxLength={5}
                            />
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginHorizontal: 4 }}>to</Text>
                            <TextInput 
                              style={[styles.miniInput, { color: theme.text, borderColor: theme.border }]} 
                              placeholder="End"
                              placeholderTextColor={theme.textSecondary}
                              value={subArr.endTime || ''} 
                              onChangeText={(val) => updateArrangement(subId, 'endTime', val)}
                              maxLength={5}
                            />
                          </View>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Max Marks:</Text>
                        <TextInput 
                          style={[styles.miniInput, { color: theme.text, borderColor: theme.border }]} 
                          value={subArr.maxMarks} 
                          onChangeText={(val) => updateArrangement(subId, 'maxMarks', val)} 
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowScheduleModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveExam} disabled={submitting}>
                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save Timetable'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Copy Past Year Timetable Modal */}
      <Modal visible={showCopyModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Copy Previous Exam Schedule</Text>
            <ScrollView style={{ marginBottom: 16 }}>
              <Text style={[styles.dropdownLabel, { color: theme.text }]}>Select Source Timetable to Copy</Text>
              <View style={styles.selectColumn}>
                {exams.map(ex => (
                  <Pressable key={ex._id} onPress={() => setCopySourceId(ex._id)} style={[styles.selectOptCol, copySourceId === ex._id && styles.selectOptActive]}>
                    <Text style={[styles.selectOptText, { color: copySourceId === ex._id ? '#fff' : theme.text }]}>{ex.examName} ({ex.academicYear})</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Target Academic Year</Text>
              <TextInput placeholder="Target Year (e.g. 2027-28)" style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={copyTargetYear} onChangeText={setCopyTargetYear} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowCopyModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleCopyPrevious} disabled={submitting || !copySourceId}>
                <Text style={styles.saveBtnText}>{submitting ? 'Copying...' : 'Copy Timetable'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8
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
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerBtn: {
    flex: 0.48,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 10,
    marginBottom: 10
  },
  titleCol: {
    flex: 1
  },
  examNameText: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  academicYearText: {
    fontSize: 11,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  badgePub: {
    backgroundColor: '#e3fbe3',
    borderColor: '#bbf7bb',
    borderWidth: 0.5
  },
  badgeDraft: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 0.5
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#856404'
  },
  slotsTable: {
    marginTop: 4,
    marginBottom: 12
  },
  slotRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5ea'
  },
  slotDateText: {
    fontSize: 11,
    marginLeft: 6,
    width: 80
  },
  slotSubjectText: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1
  },
  slotSessionText: {
    fontSize: 11,
    fontWeight: '600'
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e5ea',
    paddingTop: 10
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4
  },
  modalBg: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20
  },
  modalBody: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalScroll: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 6
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
    height: 44
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  selectOpt: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8
  },
  selectOptCol: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8
  },
  selectColumn: {
    marginBottom: 12
  },
  selectOptActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectOptText: {
    fontSize: 13
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    paddingBottom: 4
  },
  subjectArrangeCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.01)'
  },
  arrangeSubName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6
  },
  miniBtn: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniBtnSess: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  miniInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    width: 60,
    height: 28,
    textAlign: 'center'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelBtn: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8e8e93'
  },
  saveBtn: {
    flex: 0.48,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  }
});
