import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ArrowLeft, BookOpen, Edit2, Users, User, X, Check } from 'lucide-react-native';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';

interface PrincipalClassManagementProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const PrincipalClassManagement: React.FC<PrincipalClassManagementProps> = ({ 
  onBack,
  onSyncAllPortals 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [classesList, setClassesList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedTeacherName, setSelectedTeacherName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadClassesAndTeachers = async () => {
    setLoading(true);
    try {
      const [clsRes, tchRes] = await Promise.all([
        api.get('/principal/classes'),
        api.get('/principal/teachers')
      ]);
      const formattedClasses = (clsRes.data || []).map((c: any) => ({
        id: c._id,
        name: c.name,
        section: c.section,
        strength: c.approvedCount || 0,
        capacity: c.maxCapacity || 40,
        classTeacher: c.classTeacher ? c.classTeacher.name : 'Not Assigned',
        classTeacherId: c.classTeacher ? c.classTeacher._id : null,
        subjectTeachers: []
      }));
      setClassesList(formattedClasses);
      setTeachersList(tchRes.data || []);
    } catch (err) {
      console.error('Failed to load class and teacher records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndTeachers();
  }, []);

  const handleEditClassTeacher = (cls: any) => {
    setEditingClassId(cls.id);
    setSelectedTeacherName(cls.classTeacher || '');
  };

  const handleSaveClassTeacher = async () => {
    if (!editingClassId) return;

    const selectedTeacherObj = teachersList.find(t => t.name === selectedTeacherName);
    const teacherId = selectedTeacherObj ? selectedTeacherObj._id : null;

    try {
      await api.put(`/principal/class/${editingClassId}`, {
        classTeacherId: teacherId
      });
      alert('Class Teacher assignment changed successfully! All student and teacher portals updated.');
      setEditingClassId(null);
      loadClassesAndTeachers();
      onSyncAllPortals();
    } catch (err) {
      console.error(err);
      alert('Failed to change Class Teacher assignment.');
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Class Management</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Configure classes and assign tutors</Text>
          </View>
        </View>

        {/* ================= LOADING INDICATOR ================= */}
        {loading && (
          <ActivityIndicator size="small" color="#6F42C1" style={{ marginBottom: 12 }} />
        )}

        {/* ================= CLASS CARDS ================= */}
        {classesList.length > 0 ? (
          classesList.map(cls => (
            <Card key={cls.id} style={styles.classCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: '#6F42C115' }]}>
                  <BookOpen size={20} color="#6F42C1" />
                </View>
                <View style={styles.classTitleCol}>
                  <Text style={[styles.classNameText, { color: theme.text }]}>{cls.name} - {cls.section}</Text>
                  <Text style={{ fontSize: 9, color: theme.textSecondary }}>Roster Strength Details</Text>
                </View>
                <Pressable 
                  onPress={() => handleEditClassTeacher(cls)}
                  style={[styles.editBtn, { borderColor: theme.border }]}
                >
                  <Edit2 size={12} color="#6F42C1" />
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* Metrics grids */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCell}>
                  <Text style={[styles.metricVal, { color: theme.text }]}>{cls.strength} / {cls.capacity}</Text>
                  <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Strength / Cap</Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={[styles.metricVal, { color: colors.success }]}>
                    {cls.capacity > 0 ? Math.round((cls.strength / cls.capacity) * 100) : 0}%
                  </Text>
                  <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Fill Ratios</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.teachersSection}>
                <View style={styles.roleRow}>
                  <User size={12} color="#6F42C1" style={{ marginRight: 6 }} />
                  <Text style={[styles.roleLabel, { color: theme.textSecondary }]}>Class Teacher: </Text>
                  <Text style={[styles.roleValue, { color: theme.text, fontWeight: 'bold' }]}>
                    {cls.classTeacher || 'Not Assigned'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            title="Classes"
            message="No active classes configured in the database."
            iconName="BookOpen"
          />
        )}

      </ScrollView>

      {/* ================= EDIT CLASS TEACHER MODAL ================= */}
      <Modal
        visible={editingClassId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingClassId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Assign Class Teacher</Text>
              <Pressable onPress={() => setEditingClassId(null)} style={styles.closeBtn}>
                <X size={16} color={theme.text} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 11, color: theme.textSecondary, marginVertical: 8 }}>
              Select a tutor from the panel to manage this class roster:
            </Text>

            <ScrollView style={{ maxHeight: 180, marginVertical: 8 }}>
              {/* None option for unassigning class teacher */}
              <Pressable
                onPress={() => setSelectedTeacherName('')}
                style={[
                  styles.teacherSelectPill,
                  {
                    backgroundColor: selectedTeacherName === '' ? '#6F42C115' : 'transparent',
                    borderColor: selectedTeacherName === '' ? '#6F42C1' : theme.border
                  }
                ]}
              >
                <Text style={[styles.teacherSelectText, { color: selectedTeacherName === '' ? '#6F42C1' : theme.text, fontStyle: 'italic' }]}>
                  None / Remove Class Teacher
                </Text>
                {selectedTeacherName === '' && <Check size={14} color="#6F42C1" />}
              </Pressable>

              {teachersList.map(t => {
                const isSelected = selectedTeacherName === t.name;
                return (
                  <Pressable
                    key={t._id}
                    onPress={() => setSelectedTeacherName(t.name)}
                    style={[
                      styles.teacherSelectPill,
                      {
                        backgroundColor: isSelected ? '#6F42C115' : 'transparent',
                        borderColor: isSelected ? '#6F42C1' : theme.border
                      }
                    ]}
                  >
                    <Text style={[styles.teacherSelectText, { color: isSelected ? '#6F42C1' : theme.text }]}>
                      {t.name}
                    </Text>
                    {isSelected && <Check size={14} color="#6F42C1" />}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable 
              onPress={handleSaveClassTeacher}
              style={[styles.saveModalBtn, { backgroundColor: colors.success }]}
            >
              <Check size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Save Settings</Text>
            </Pressable>
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
  classCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: 'rgba(0,0,0,0.01)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  classNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  teachersSection: {
    marginTop: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleValue: {
    fontSize: 11,
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
  teacherSelectPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  teacherSelectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveModalBtn: {
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  }
});
