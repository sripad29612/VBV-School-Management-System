import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ProgressRing } from '../../components/AnalyticsCharts';
import { ArrowLeft, Search, User, Phone, CheckCircle2, AlertCircle, X, Award, Smile } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface TeacherStudentsScreenProps {
  onBack: () => void;
}

export const TeacherStudentsScreen: React.FC<TeacherStudentsScreenProps> = ({ onBack }) => {
  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const studentsRaw = teacherData.classStudents || [];
  const reportsRaw = teacherData.reports || [];

  const students = studentsRaw.map((s: any) => {
    const rep = reportsRaw.find((r: any) => r._id === s._id) || {};
    return {
      _id: s._id,
      name: s.name,
      rollNumber: s.rollNumber || 'N/A',
      attendancePct: (rep.attendancePct !== null && rep.attendancePct !== undefined) ? `${Math.round(rep.attendancePct)}%` : 'N/A',
      homeworkPct: (rep.homeworkPct !== null && rep.homeworkPct !== undefined) ? `${Math.round(rep.homeworkPct)}%` : 'N/A',
      marksPct: (rep.latestPercentage !== null && rep.latestPercentage !== undefined) ? `${Math.round(rep.latestPercentage)}%` : 'N/A',
      behaviour: s.behaviour || 'N/A',
      performance: rep.latestGrade === 'A' || rep.latestGrade === 'A+' ? 'High' : (rep.latestGrade === 'F' ? 'Low' : (rep.latestGrade && rep.latestGrade !== 'N/A' ? 'Average' : 'N/A')),
      parentName: s.fatherName || s.motherName || 'N/A',
      parentPhone: s.emergencyContact || s.parentPhone || 'N/A',
      bloodGroup: s.bloodGroup || 'N/A'
    };
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getPerformanceColor = (perf: string) => {
    if (perf === 'High') return '#10B981';
    if (perf === 'Average') return '#F59E0B';
    if (perf === 'N/A') return theme.textSecondary || '#718096';
    return '#EF4444';
  };

  const getBehaviourColor = (beh: string) => {
    if (beh === 'Excellent') return '#10B981';
    if (beh === 'Good') return '#3B82F6';
    if (beh === 'N/A') return theme.textSecondary || '#718096';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Students Directory</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Search and inspect student metrics</Text>
          </View>
        </View>

        {/* ================= SEARCH & FILTERS ================= */}
        <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Search size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name or roll number..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ================= STUDENT CARDS ================= */}
        <View style={styles.listContainer}>
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <Pressable
                key={student._id}
                onPress={() => setSelectedStudent(student)}
                style={[styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                {/* Profile Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={[styles.nameText, { color: theme.text }]}>{student.name}</Text>
                    <Text style={[styles.rollText, { color: theme.textSecondary }]}>Roll No: {student.rollNumber}</Text>
                  </View>
                  
                  <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(student.performance) + '15' }]}>
                    <Text style={[styles.performanceText, { color: getPerformanceColor(student.performance) }]}>
                      {student.performance}
                    </Text>
                  </View>
                </View>

                <View style={[styles.metricsDivider, { backgroundColor: theme.border }]} />

                {/* Roster Card Metrics */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCell}>
                    <Text style={[styles.metricVal, { color: theme.text }]}>{student.attendancePct}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Attendance</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={[styles.metricVal, { color: theme.text }]}>{student.homeworkPct}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Homework</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={[styles.metricVal, { color: theme.text }]}>{student.marksPct}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Avg Marks</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={[styles.metricVal, { color: getBehaviourColor(student.behaviour) }]}>{student.behaviour}</Text>
                    <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Behaviour</Text>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <EmptyState
              title="Students Register"
              message="No students assigned."
              iconName="User"
            />
          )}
        </View>

      </ScrollView>

      {/* ================= DETAILED PROFILE MODAL ================= */}
      <Modal
        visible={selectedStudent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Student Detailed Profile</Text>
              <Pressable onPress={() => setSelectedStudent(null)} style={styles.closeBtn}>
                <X size={18} color={theme.text} />
              </Pressable>
            </View>

            {selectedStudent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileModalHeader}>
                  <View style={[styles.modalAvatarCircle, { backgroundColor: colors.primary }]}>
                    <Text style={styles.modalAvatarText}>{selectedStudent.name.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.modalStudentName, { color: theme.text }]}>{selectedStudent.name}</Text>
                  <Text style={[styles.modalStudentRoll, { color: theme.textSecondary }]}>
                    Roll Number: {selectedStudent.rollNumber} | Blood Group: {selectedStudent.bloodGroup}
                  </Text>
                </View>

                {/* Detail Metrics Card */}
                <Card style={styles.modalDetailCard}>
                  <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Academic Metrics</Text>
                  <View style={styles.modalMetricsGrid}>
                    <View style={styles.gridCell}>
                      <Text style={[styles.gridCellVal, { color: colors.success }]}>{selectedStudent.attendancePct}%</Text>
                      <Text style={[styles.gridCellLbl, { color: theme.textSecondary }]}>Attendance Rate</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={[styles.gridCellVal, { color: colors.warning }]}>{selectedStudent.homeworkPct}%</Text>
                      <Text style={[styles.gridCellLbl, { color: theme.textSecondary }]}>Homework Completed</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={[styles.gridCellVal, { color: colors.primary }]}>{selectedStudent.marksPct}%</Text>
                      <Text style={[styles.gridCellLbl, { color: theme.textSecondary }]}>Academic Score</Text>
                    </View>
                  </View>
                </Card>

                {/* Parent & Info Cards */}
                <Card style={styles.modalDetailCard}>
                  <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Guardian & Emergency Contacts</Text>
                  <View style={styles.infoRow}>
                    <User size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Guardian:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudent.parentName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Phone size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone Number:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{selectedStudent.parentPhone}</Text>
                  </View>
                </Card>

                {/* Behaviour Cards */}
                <Card style={styles.modalDetailCard}>
                  <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Conduct & Class Performance</Text>
                  <View style={styles.infoRow}>
                    <Smile size={14} color={getBehaviourColor(selectedStudent.behaviour)} style={{ marginRight: 8 }} />
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Conduct Grade:</Text>
                    <Text style={[styles.infoValue, { color: getBehaviourColor(selectedStudent.behaviour), fontWeight: 'bold' }]}>
                      {selectedStudent.behaviour}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Award size={14} color={getPerformanceColor(selectedStudent.performance)} style={{ marginRight: 8 }} />
                    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Class Rank Group:</Text>
                    <Text style={[styles.infoValue, { color: getPerformanceColor(selectedStudent.performance), fontWeight: 'bold' }]}>
                      {selectedStudent.performance} Performer
                    </Text>
                  </View>
                </Card>
                
                <Pressable 
                  onPress={() => setSelectedStudent(null)}
                  style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.closeModalBtnText}>Close Detailed Profile</Text>
                </Pressable>
              </ScrollView>
            )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  listContainer: {
    marginTop: 4,
  },
  studentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  rollText: {
    fontSize: 10,
    marginTop: 1,
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  performanceText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricsDivider: {
    height: 1,
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
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
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  modalAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalStudentRoll: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  modalDetailCard: {
    padding: 12,
    marginVertical: 6,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  gridCell: {
    alignItems: 'center',
  },
  gridCellVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  gridCellLbl: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    width: 100,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeModalBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  closeModalBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  }
});
