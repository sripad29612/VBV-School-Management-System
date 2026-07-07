import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ArrowLeft, Save, User, Check, Search, PlusCircle, Trash2 } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';

interface PrincipalTeacherAssignmentProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const PrincipalTeacherAssignment: React.FC<PrincipalTeacherAssignmentProps> = ({ 
  onBack,
  onSyncAllPortals 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Assignment configuration form states
  const [subject, setSubject] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [classTeacherOf, setClassTeacherOf] = useState<string>('');

  const { principalData } = useSelector((state: RootState) => state.dashboard);
  const allClasses = (principalData?.classes || []).map((c: any) => `${c.name} ${c.section}`);

  // Load existing assignments
  useEffect(() => {
    if (principalData?.teachers && principalData.teachers.length > 0) {
      const formatted = principalData.teachers.map((t: any) => ({
        id: t._id,
        name: t.name,
        subject: t.subjects && t.subjects.length > 0 ? t.subjects[0].name : '',
        assignedClasses: t.assignedClasses?.map((c: any) => `${c.name} ${c.section}`) || [],
        classTeacherOf: t.assignedClass ? `${t.assignedClass.name} ${t.assignedClass.section}` : '',
        status: 'Active'
      }));
      setTeachersList(formatted);
    } else {
      setTeachersList([]);
    }
  }, [principalData?.teachers]);

  const handleSelectTeacher = (teacher: any) => {
    setSelectedTeacherId(teacher.id);
    setSubject(teacher.subject || '');
    setAssignedClasses(teacher.assignedClasses || []);
    setClassTeacherOf(teacher.classTeacherOf || '');
  };

  const toggleClassSelection = (className: string) => {
    if (assignedClasses.includes(className)) {
      setAssignedClasses(prev => prev.filter(c => c !== className));
      if (classTeacherOf === className) {
        setClassTeacherOf('');
      }
    } else {
      setAssignedClasses(prev => [...prev, className]);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedTeacherId) return;

    setSaving(true);
    // Find classTeacherOf Class ID
    const foundClassTeacherOfObj = (principalData?.classes || []).find(
      (c: any) => `${c.name} ${c.section}` === classTeacherOf
    );
    const classTeacherOfId = foundClassTeacherOfObj ? foundClassTeacherOfObj._id : null;

    // Find assignedClasses Class IDs
    const assignedClassIds = assignedClasses.map(name => {
      const found = (principalData?.classes || []).find(
        (c: any) => `${c.name} ${c.section}` === name
      );
      return found ? found._id : null;
    }).filter(id => id !== null);

    try {
      await api.put(`/principal/teacher/${selectedTeacherId}/assignment`, {
        subject,
        classTeacherOf: classTeacherOfId,
        assignedClasses: assignedClassIds
      });
      alert('Teacher assignments updated and synchronized across all portals successfully!');
      setSelectedTeacherId(null);
      onSyncAllPortals();
    } catch (err) {
      console.error(err);
      alert('Failed to update teacher assignments in database.');
    } finally {
      setSaving(false);
    }
  };

  const filteredClassOptions = allClasses.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (teachersList.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, padding: 16 }]}>
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#6F42C1" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Teacher Assignments</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Configure master school schedules</Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Teacher Roster"
            message="No teachers registered in this school."
            iconName="Users"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={selectedTeacherId ? () => setSelectedTeacherId(null) : onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#6F42C1" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Teacher Assignments</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>
              {selectedTeacherId ? 'Modify Teacher Role' : 'Select a teacher from the roster'}
            </Text>
          </View>
        </View>

        {/* ================= TEACHER LIST VIEW ================= */}
        {!selectedTeacherId && (
          <View>
            {teachersList.map(teacher => (
              <Pressable
                key={teacher.id}
                onPress={() => handleSelectTeacher(teacher)}
                style={[styles.teacherCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '15' }]}>
                    <User size={18} color={colors.primary} />
                  </View>
                  <View style={styles.teacherDetails}>
                    <Text style={[styles.teacherName, { color: theme.text }]}>{teacher.name}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Primary Subject: {teacher.subject}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
                    <Text style={[styles.statusText, { color: colors.success }]}>{teacher.status}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.cardInfoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Assigned Classes</Text>
                    <Text style={[styles.infoVal, { color: theme.text }]}>
                      {teacher.assignedClasses?.join(', ') || 'None'}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Class Teacher Of</Text>
                    <Text style={[styles.infoVal, { color: colors.primary, fontWeight: 'bold' }]}>
                      {teacher.classTeacherOf || 'Not Assigned'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ================= DETAILED ASSIGNMENT FORM ================= */}
        {selectedTeacherId && (
          <Card style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              Configuring: {teachersList.find(t => t.id === selectedTeacherId)?.name}
            </Text>

            {/* Step 1: Subject Entry */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Subject Assignment</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="e.g. Mathematics"
              placeholderTextColor={theme.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />

            {/* Step 2: Assigned Classes (Multi-select) */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select Assigned Classes</Text>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Search size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search classes..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Search list options */}
            <ScrollView style={styles.classesSelectorScroll} nestedScrollEnabled>
              <View style={styles.pillGrid}>
                {filteredClassOptions.map(clsName => {
                  const isSel = assignedClasses.includes(clsName);
                  return (
                    <Pressable
                      key={clsName}
                      onPress={() => toggleClassSelection(clsName)}
                      style={[
                        styles.classOptionPill,
                        {
                          backgroundColor: isSel ? '#6F42C1' : theme.background,
                          borderColor: isSel ? '#6F42C1' : theme.border
                        }
                      ]}
                    >
                      <Text style={{ color: isSel ? '#fff' : theme.textSecondary, fontSize: 10, fontWeight: '800' }}>
                        {clsName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Step 3: Class Teacher Selector (Single-select from assigned list) */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Assign Class Teacher Role (Only One)</Text>
            <View style={styles.classTeacherRadioRow}>
              {assignedClasses.length > 0 ? (
                assignedClasses.map(clsName => {
                  const isClassTeacher = classTeacherOf === clsName;
                  return (
                    <Pressable
                      key={clsName}
                      onPress={() => setClassTeacherOf(isClassTeacher ? '' : clsName)}
                      style={[
                        styles.radioPill,
                        {
                          backgroundColor: isClassTeacher ? colors.success : theme.background,
                          borderColor: isClassTeacher ? colors.success : theme.border
                        }
                      ]}
                    >
                      <Text style={{ color: isClassTeacher ? '#fff' : theme.textSecondary, fontSize: 10, fontWeight: '800' }}>
                        {isClassTeacher ? '✓ ' : ''}{clsName}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={{ fontSize: 10, fontStyle: 'italic', color: theme.textSecondary }}>
                  Assign at least one class above first.
                </Text>
              )}
            </View>

            {/* Save Actions */}
            <Pressable 
              onPress={handleSaveAssignment}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: '#6F42C1', opacity: saving ? 0.7 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" style={{ paddingVertical: 4 }} />
              ) : (
                <>
                  <Save size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Assignment</Text>
                </>
              )}
            </Pressable>
          </Card>
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
  teacherCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.01)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherDetails: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '800',
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
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardInfoGrid: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  formCard: {
    padding: 16,
    marginVertical: 0,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
  },
  classesSelectorScroll: {
    maxHeight: 120,
    marginBottom: 12,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  classOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  classTeacherRadioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  radioPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  saveBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  }
});
