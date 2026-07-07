import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ArrowLeft, Save, Plus, Trash2, Calendar as CalIcon, Copy, Printer, Check, X, FileText, Edit } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';

interface PrincipalTimetableProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const PrincipalTimetable: React.FC<PrincipalTimetableProps> = ({ 
  onBack,
  onSyncAllPortals 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const { principalData } = useSelector((state: RootState) => state.dashboard);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Timetable core info
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [effectiveDate, setEffectiveDate] = useState('01 June 2026');
  const [isActive, setIsActive] = useState(true);

  // Active weekly timetable schedule map: { [day]: periodList }
  const [schedule, setSchedule] = useState<{ [day: string]: any[] }>({
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': []
  });

  const [activeDay, setActiveDay] = useState('Monday');
  const [showEditModal, setShowEditModal] = useState(false);

  // Lists loaded from MongoDB
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Modal Form states
  const [slotTime, setSlotTime] = useState('09:00 AM - 09:45 AM');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [modalClassId, setModalClassId] = useState('');
  const [slotRoom, setSlotRoom] = useState('Room 101');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  // Copy timatable Day/Year states
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState('Monday');
  const [copyTargetDay, setCopyTargetDay] = useState('Tuesday');
  const [copySourceYear, setCopySourceYear] = useState('2026-27');
  const [copyTargetYear, setCopyTargetYear] = useState('2026-27');

  // Search inside timetable view
  const [searchQuery, setSearchQuery] = useState('');

  // Print view state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<'class' | 'teacher' | 'school'>('class');

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const loadSupportingData = async () => {
    try {
      const [tRes, sRes, rRes, cRes] = await Promise.all([
        api.get('/principal/teachers'),
        api.get('/principal/subjects'),
        api.get('/principal/rooms'),
        api.get('/principal/classes')
      ]);
      setTeachers((tRes.data || []).filter((t: any) => t.status === 'Active'));
      setSubjects(sRes.data || []);
      setRooms(rRes.data || []);
      setClasses(cRes.data || []);
    } catch (err) {
      console.error('Failed to load supporting data:', err);
    }
  };

  const loadTimetableForClass = async (classId: string) => {
    if (!classId) return;
    setLoadingSchedule(true);
    try {
      const res = await api.get(`/principal/timetable/${classId}`);
      setSchedule(res.data || {
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': []
      });
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    if (classes && classes.length > 0) {
      const firstClass = classes[0];
      setSelectedClassId(firstClass._id);
      loadTimetableForClass(firstClass._id);
    }
  }, [classes]);

  const handleSaveSlot = async () => {
    if (!modalClassId || !selectedTeacherId || !selectedSubjectId || !slotTime) {
      alert('Please fill in all required fields (Class, Teacher, Subject, Timing).');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Please select at least one weekday.');
      return;
    }

    const times = slotTime.split(' - ');
    if (times.length < 2) {
      alert('Please enter timing in the format "hh:mm AM - hh:mm AM".');
      return;
    }

    setLoadingSchedule(true);
    try {
      await api.post('/principal/timetable', {
        classId: modalClassId,
        teacherId: selectedTeacherId,
        subjectId: selectedSubjectId,
        room: slotRoom,
        startTime: times[0].trim(),
        endTime: times[1].trim(),
        days: selectedDays,
        academicYear,
        periodId: editingPeriodId
      });

      alert(editingPeriodId ? 'Period slot updated successfully.' : 'Period slot(s) created successfully.');
      setShowEditModal(false);
      
      // Reload timetable and rooms
      loadTimetableForClass(selectedClassId);
      const rRes = await api.get('/principal/rooms');
      setRooms(rRes.data || []);
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save timetable slot.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleEditSlot = (slot: any) => {
    setEditingPeriodId(slot.id);
    setSlotTime(slot.time);
    setSelectedTeacherId(slot.teacherId);
    
    const foundTeacher = teachers.find((t: any) => t._id === slot.teacherId);
    setTeacherSearch(foundTeacher ? foundTeacher.name : slot.teacher);
    
    setSelectedSubjectId(slot.subjectId);
    setSlotRoom(slot.room === 'N/A' ? '' : slot.room);
    setModalClassId(selectedClassId);
    setSelectedDays([activeDay]);
    setShowEditModal(true);
  };

  const handleDeleteSlotPrompt = (slot: any) => {
    const confirmDelete = typeof window !== 'undefined' && window.confirm 
      ? window.confirm('Are you sure you want to delete this timetable period slot?')
      : true;
      
    if (confirmDelete) {
      handleDeleteSlot(slot.id);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setLoadingSchedule(true);
    try {
      await api.delete(`/principal/timetable/${selectedClassId}/${activeDay}/${slotId}`);
      alert('Period slot deleted successfully.');
      loadTimetableForClass(selectedClassId);
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete period.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleToggleActive = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    alert(`Timetable marked as ${newStatus ? 'Active' : 'Inactive'}.`);
  };

  const handleCopyTimetable = async () => {
    setLoadingSchedule(true);
    try {
      await api.post('/principal/timetable/copy', {
        sourceClassId: selectedClassId,
        sourceDay: copySourceDay,
        targetDay: copyTargetDay,
        sourceYear: copySourceYear,
        targetYear: copyTargetYear
      });
      alert('Timetable copied successfully!');
      setShowCopyModal(false);
      loadTimetableForClass(selectedClassId);
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to copy timetable.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleDuplicateYear = async () => {
    const targetYr = typeof window !== 'undefined' && window.prompt 
      ? window.prompt('Enter Target Academic Year (e.g. 2027-28):', '2027-28')
      : '2027-28';
    if (!targetYr) return;

    setLoadingSchedule(true);
    try {
      await api.post('/principal/timetable/duplicate-year', {
        sourceYear: academicYear,
        targetYear: targetYr
      });
      alert(`Timetable successfully duplicated to Academic Year ${targetYr}!`);
      setAcademicYear(targetYr);
      loadTimetableForClass(selectedClassId);
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to duplicate year.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#6F42C1" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Timetable Management</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Configure master school schedules</Text>
          </View>
        </View>

        {/* ================= CORE INFO CARD ================= */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Academic Year</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={academicYear}
                onChangeText={setAcademicYear}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Effective From Date</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={effectiveDate}
                onChangeText={setEffectiveDate}
              />
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>
              Current Status: <Text style={{ color: isActive ? colors.success : colors.danger, fontWeight: 'bold' }}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
            </Text>
            <Pressable 
              onPress={handleToggleActive}
              style={[styles.statusToggleBtn, { backgroundColor: isActive ? '#EF4444' : '#10B981' }]}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                {isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* ================= TIMETABLE ACTIONS ROW ================= */}
        <View style={styles.actionsGrid}>
          <Pressable 
            onPress={() => {
              setEditingPeriodId(null);
              setSlotTime('09:00 AM - 09:45 AM');
              setSelectedTeacherId('');
              setTeacherSearch('');
              setSelectedSubjectId('');
              setSlotRoom('Room 101');
              setModalClassId(selectedClassId);
              setSelectedDays([activeDay]);
              setShowEditModal(true);
            }} 
            style={[styles.actionBtn, { borderColor: theme.border }]}
          >
            <Plus size={14} color="#6F42C1" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Create Slot</Text>
          </Pressable>

          <Pressable onPress={() => setShowCopyModal(true)} style={[styles.actionBtn, { borderColor: theme.border }]}>
            <Copy size={14} color="#6F42C1" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Copy Prev / Term</Text>
          </Pressable>

          <Pressable onPress={handleDuplicateYear} style={[styles.actionBtn, { borderColor: theme.border }]}>
            <Copy size={14} color="#6F42C1" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Duplicate Yr</Text>
          </Pressable>

          <Pressable onPress={() => setShowPrintModal(true)} style={[styles.actionBtn, { borderColor: theme.border }]}>
            <Printer size={14} color="#6F42C1" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Print</Text>
          </Pressable>
        </View>

        {/* ================= CLASS SELECTOR ================= */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Select Class to Manage Timetable</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.daysScroll, { marginBottom: 12 }]}>
          {(classes || []).map((c: any) => (
            <Pressable
              key={c._id}
              onPress={() => {
                setSelectedClassId(c._id);
                loadTimetableForClass(c._id);
              }}
              style={[
                styles.dayTabPill,
                {
                  backgroundColor: selectedClassId === c._id ? '#6F42C1' : theme.background,
                  borderColor: selectedClassId === c._id ? '#6F42C1' : theme.border
                }
              ]}
            >
              <Text style={{ color: selectedClassId === c._id ? '#fff' : theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
                {c.name} {c.section}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loadingSchedule && (
          <ActivityIndicator size="small" color="#6F42C1" style={{ marginVertical: 6 }} />
        )}

        {/* ================= WEEKDAY SELECTOR ================= */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
          {daysList.map(day => (
            <Pressable
              key={day}
              onPress={() => setActiveDay(day)}
              style={[
                styles.dayTabPill,
                {
                  backgroundColor: activeDay === day ? '#6F42C1' : theme.background,
                  borderColor: activeDay === day ? '#6F42C1' : theme.border
                }
              ]}
            >
              <Text style={{ color: activeDay === day ? '#fff' : theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
                {day}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ================= SEARCH BAR ================= */}
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface, marginBottom: 10, height: 36 }]}
          placeholder="Search Teacher, Subject, Room, or Class..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* ================= SCHEDULE PERIODS LIST ================= */}
        <Text style={[styles.sectionHeadingTitle, { color: theme.text }]}>Periods for {activeDay}</Text>
        {(() => {
          const currentClass = classes.find(c => c._id === selectedClassId);
          const classNameStr = currentClass ? `${currentClass.name} ${currentClass.section}` : '';
          
          const filteredPeriods = (schedule[activeDay] || []).filter(slot => {
            const q = searchQuery.toLowerCase();
            return (
              slot.subject.toLowerCase().includes(q) ||
              slot.teacher.toLowerCase().includes(q) ||
              slot.room.toLowerCase().includes(q) ||
              classNameStr.toLowerCase().includes(q)
            );
          });

          return filteredPeriods.length > 0 ? (
            filteredPeriods.map(slot => (
              <Card key={slot.id} style={styles.slotCard}>
                <View style={styles.slotDetailsRow}>
                  <View style={styles.timeBox}>
                    <CalIcon size={14} color="#6F42C1" />
                    <Text style={[styles.timeText, { color: theme.text }]}>{slot.time}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable onPress={() => handleEditSlot(slot)} style={[styles.deleteBtn, { marginRight: 12 }]}>
                      <Edit size={14} color="#6F42C1" />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSlotPrompt(slot)} style={styles.deleteBtn}>
                      <Trash2 size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.slotMetaGrid}>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Subject</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>{slot.subject}</Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Class / Room</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>{classNameStr} ({slot.room})</Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Teacher Assigned</Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>{slot.teacher}</Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              title="Class Timetable"
              message="No timetable configured."
              iconName="Calendar"
            />
          );
        })()}

      </ScrollView>

      {/* ================= CREATE/EDIT PERIOD SLOT MODAL ================= */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingPeriodId ? 'Edit Period Slot' : 'Configure Period Slot'}
              </Text>
              <Pressable onPress={() => setShowEditModal(false)} style={styles.closeBtn}>
                <X size={16} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Slot Timing (e.g. Start - End)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={slotTime}
                onChangeText={setSlotTime}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Class</Text>
              <View style={styles.dropdownContainer}>
                {classes.map((cls: any) => (
                  <Pressable 
                    key={cls._id} 
                    onPress={() => setModalClassId(cls._id)}
                    style={[
                      styles.pillOption, 
                      { borderColor: theme.border },
                      modalClassId === cls._id ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                    ]}
                  >
                    <Text style={{ color: modalClassId === cls._id ? '#fff' : theme.text, fontSize: 10, fontWeight: '700' }}>
                      {cls.name} {cls.section}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Assigned Teacher</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Search teacher..."
                placeholderTextColor={theme.textSecondary}
                value={teacherSearch}
                onChangeText={(txt) => {
                  setTeacherSearch(txt);
                  setShowTeacherDropdown(true);
                }}
                onFocus={() => setShowTeacherDropdown(true)}
              />
              {showTeacherDropdown && (
                <Card style={styles.dropdownListCard}>
                  <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled>
                    {teachers
                      .filter((t: any) => t.name.toLowerCase().includes(teacherSearch.toLowerCase()))
                      .map((t: any) => (
                        <Pressable
                          key={t._id}
                          onPress={() => {
                            setSelectedTeacherId(t._id);
                            setTeacherSearch(t.name);
                            setShowTeacherDropdown(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <Text style={{ color: theme.text, fontSize: 11 }}>{t.name}</Text>
                        </Pressable>
                      ))}
                  </ScrollView>
                </Card>
              )}

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Subject</Text>
              <View style={styles.dropdownContainer}>
                {subjects.map((sub: any) => (
                  <Pressable 
                    key={sub._id} 
                    onPress={() => setSelectedSubjectId(sub._id)}
                    style={[
                      styles.pillOption, 
                      { borderColor: theme.border },
                      selectedSubjectId === sub._id ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                    ]}
                  >
                    <Text style={{ color: selectedSubjectId === sub._id ? '#fff' : theme.text, fontSize: 10, fontWeight: '700' }}>
                      {sub.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Room Number</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Room..."
                placeholderTextColor={theme.textSecondary}
                value={slotRoom}
                onChangeText={setSlotRoom}
              />
              {rooms.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, maxHeight: 32 }}>
                  {rooms.map((rm: string) => (
                    <Pressable 
                      key={rm} 
                      onPress={() => setSlotRoom(rm)}
                      style={[
                        styles.roomPill, 
                        { borderColor: theme.border },
                        slotRoom === rm ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                      ]}
                    >
                      <Text style={{ color: slotRoom === rm ? '#fff' : theme.textSecondary, fontSize: 9 }}>{rm}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>Select Weekdays</Text>
              <View style={styles.dropdownContainer}>
                {daysList.map((day) => {
                  const isSel = selectedDays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => {
                        if (isSel) {
                          setSelectedDays(prev => prev.filter(d => d !== day));
                        } else {
                          setSelectedDays(prev => [...prev, day]);
                        }
                      }}
                      style={[
                        styles.pillOption,
                        { borderColor: theme.border },
                        isSel ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                      ]}
                    >
                      <Text style={{ color: isSel ? '#fff' : theme.text, fontSize: 10, fontWeight: '700' }}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable 
                onPress={handleSaveSlot}
                style={[styles.saveModalBtn, { backgroundColor: colors.success }]}
              >
                <Check size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Save Period Slot</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= COPY TIMETABLE MODAL ================= */}
      <Modal
        visible={showCopyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCopyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Copy Day / Term Timetable</Text>
              <Pressable onPress={() => setShowCopyModal(false)} style={styles.closeBtn}>
                <X size={16} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Source Day</Text>
              <View style={styles.dropdownContainer}>
                {daysList.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setCopySourceDay(day)}
                    style={[
                      styles.pillOption,
                      { borderColor: theme.border },
                      copySourceDay === day ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                    ]}
                  >
                    <Text style={{ color: copySourceDay === day ? '#fff' : theme.text, fontSize: 10 }}>{day}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Day</Text>
              <View style={styles.dropdownContainer}>
                {daysList.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setCopyTargetDay(day)}
                    style={[
                      styles.pillOption,
                      { borderColor: theme.border },
                      copyTargetDay === day ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                    ]}
                  >
                    <Text style={{ color: copyTargetDay === day ? '#fff' : theme.text, fontSize: 10 }}>{day}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Source Year</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={copySourceYear}
                onChangeText={setCopySourceYear}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Year</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={copyTargetYear}
                onChangeText={setCopyTargetYear}
              />

              <Pressable 
                onPress={handleCopyTimetable}
                style={[styles.saveModalBtn, { backgroundColor: colors.primary }]}
              >
                <Check size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Confirm Copy</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= PRINT PREVIEW MODAL ================= */}
      <Modal
        visible={showPrintModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrintModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxWidth: 500, width: '95%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Print Layout View</Text>
              <Pressable onPress={() => setShowPrintModal(false)} style={styles.closeBtn}>
                <X size={16} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Print Layout Mode</Text>
              <View style={styles.dropdownContainer}>
                {[
                  { label: 'Class View', val: 'class' },
                  { label: 'Teacher View', val: 'teacher' },
                  { label: 'School Master View', val: 'school' }
                ].map((pt) => (
                  <Pressable
                    key={pt.val}
                    onPress={() => setPrintType(pt.val as any)}
                    style={[
                      styles.pillOption,
                      { borderColor: theme.border },
                      printType === pt.val ? { backgroundColor: '#6F42C1', borderColor: '#6F42C1' } : null
                    ]}
                  >
                    <Text style={{ color: printType === pt.val ? '#fff' : theme.text, fontSize: 10 }}>{pt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* TIMETABLE PRINTABLE LAYOUT VIEW */}
              <View style={{ marginVertical: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>
                  {printType === 'class' ? 'CLASS TIMETABLE' : printType === 'teacher' ? 'TEACHER TIMETABLE' : 'SCHOOL MASTER TIMETABLE'}
                </Text>
                
                <View style={styles.printTable}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.printTableHeader, { flex: 1.2 }]}>Day</Text>
                    <Text style={[styles.printTableHeader, { flex: 2 }]}>Timing</Text>
                    <Text style={[styles.printTableHeader, { flex: 1.5 }]}>Subject</Text>
                    <Text style={[styles.printTableHeader, { flex: 1.5 }]}>Room</Text>
                    <Text style={[styles.printTableHeader, { flex: 2.5 }]}>Details</Text>
                  </View>

                  {daysList.map((day) => {
                    const periodsForDay = schedule[day] || [];
                    return periodsForDay.length > 0 ? (
                      periodsForDay.map((p, pIdx) => (
                        <View key={`${day}-${pIdx}`} style={{ flexDirection: 'row' }}>
                          <Text style={[styles.printTableCell, { flex: 1.2 }]}>{pIdx === 0 ? day : ''}</Text>
                          <Text style={[styles.printTableCell, { flex: 2 }]}>{p.time}</Text>
                          <Text style={[styles.printTableCell, { flex: 1.5 }]}>{p.subject}</Text>
                          <Text style={[styles.printTableCell, { flex: 1.5 }]}>{p.room}</Text>
                          <Text style={[styles.printTableCell, { flex: 2.5 }]}>{p.teacher}</Text>
                        </View>
                      ))
                    ) : (
                      <View key={`${day}-empty`} style={{ flexDirection: 'row' }}>
                        <Text style={[styles.printTableCell, { flex: 1.2 }]}>{day}</Text>
                        <Text style={[styles.printTableCell, { flex: 8.8, color: theme.textSecondary }]}>
                          No teaching slots scheduled
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <Pressable 
                onPress={() => {
                  alert('Timetable layout sent to print queue.');
                  setShowPrintModal(false);
                }}
                style={[styles.saveModalBtn, { backgroundColor: colors.success }]}
              >
                <Printer size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Send to Printer</Text>
              </Pressable>
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
  infoCard: {
    padding: 14,
    marginVertical: 0,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  statusLabel: {
    fontSize: 11,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderRadius: 10,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  daysScroll: {
    maxHeight: 34,
    marginBottom: 14,
  },
  dayTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  sectionHeadingTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginVertical: 8,
  },
  slotCard: {
    padding: 12,
    marginVertical: 6,
  },
  slotDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  slotMetaGrid: {
    flexDirection: 'row',
  },
  metaCell: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  saveModalBtn: {
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  pillOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 4,
  },
  roomPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  dropdownListCard: {
    marginTop: 4,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  printTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 12,
  },
  printTableHeader: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 10,
  },
  printTableCell: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    textAlign: 'center',
    fontSize: 10,
  }
});
