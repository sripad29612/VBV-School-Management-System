import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ArrowLeft, UserCheck, AlertCircle, Calendar, Plus, X, Award, CheckCircle, HelpCircle, Check, Save } from 'lucide-react-native';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';

interface PrincipalSubstituteManagementProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const PrincipalSubstituteManagement: React.FC<PrincipalSubstituteManagementProps> = ({ 
  onBack,
  onSyncAllPortals 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const { principalData } = useSelector((state: RootState) => state.dashboard);
  const teachers = (principalData?.teachers || []).map((t: any) => t.name);
  const classes = (principalData?.classes || []).map((c: any) => `${c.name} ${c.section}`);

  // States
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [substitutesList, setSubstitutesList] = useState<any[]>([]);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Form State
  const [originalTeacher, setOriginalTeacher] = useState('');
  const [substituteTeacher, setSubstituteTeacher] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [durationMode, setDurationMode] = useState<'Today' | 'Custom'>('Today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      const [leavesRes, subsRes] = await Promise.all([
        api.get('/principal/leaves'),
        api.get('/principal/substitutes')
      ]);
      setLeaveRequests(leavesRes.data);
      setSubstitutesList(subsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Actions
  const handleApproveLeave = async (reqId: string) => {
    try {
      await api.post(`/principal/leave/${reqId}/approve`, { status: 'Approved' });
      alert('Leave request approved! The teacher has been marked as "On Leave" for today.');
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve leave request.');
    }
  };

  const handleRejectLeave = async (reqId: string) => {
    try {
      await api.post(`/principal/leave/${reqId}/approve`, { status: 'Rejected' });
      alert('Leave request rejected.');
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reject leave request.');
    }
  };

  // Open substitute assignment pre-filled
  const handleTriggerSubstitute = (leaveReq: any) => {
    setOriginalTeacher(leaveReq.teacherName);
    setAssignedClass(leaveReq.className || 'Class VI - A');
    setStartDate(leaveReq.fromDate);
    setEndDate(leaveReq.toDate);
    setDurationMode(leaveReq.fromDate === leaveReq.toDate ? 'Today' : 'Custom');
    setShowAssignForm(true);
  };

  const handleSaveSubstitute = async () => {
    if (!originalTeacher || !substituteTeacher || !assignedClass) {
      alert('Please select the Original Teacher, Substitute Teacher, and Class.');
      return;
    }

    if (originalTeacher === substituteTeacher) {
      alert('Substitute teacher must be different from the original teacher.');
      return;
    }

    const start = durationMode === 'Today' ? new Date().toISOString().split('T')[0] : startDate;
    const end = durationMode === 'Today' ? new Date().toISOString().split('T')[0] : endDate;

    try {
      await api.post('/principal/substitute', {
        originalTeacherName: originalTeacher,
        substituteTeacherName: substituteTeacher,
        className: assignedClass,
        startDate: start,
        endDate: end
      });

      alert(`Successfully assigned ${substituteTeacher} as substitute class teacher for ${assignedClass}!`);
      loadData();
      setShowAssignForm(false);
      setOriginalTeacher('');
      setSubstituteTeacher('');
      setAssignedClass('');
      onSyncAllPortals();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign substitute cover.');
    }
  };

  const handleDeleteAssignment = (id: string) => {
    alert('Substitute assignment cannot be deleted directly (archived by date).');
  };

  // Status helper (checking date bounds)
  const getAssignmentStatus = (item: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (today > item.endDate) {
      return 'Expired';
    }
    return item.status || 'Active';
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Substitutes & Leaves</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Approve teacher leaves and assign temporary covers</Text>
          </View>
        </View>

        {/* ================= PENDING LEAVE REQUESTS ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Leave Requests</Text>
        {leaveRequests.filter(r => r.status === 'Pending').length > 0 ? (
          leaveRequests.filter(r => r.status === 'Pending').map(req => (
            <Card key={req.id} style={styles.leaveCard}>
              <View style={styles.leaveHeaderRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>{req.teacherName.charAt(req.teacherName.startsWith('M') ? 4 : 0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.teacherNameText, { color: theme.text }]}>{req.teacherName}</Text>
                  <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '800' }}>{req.leaveType}</Text>
                </View>
                <View style={styles.leaveDateBadge}>
                  <Calendar size={12} color={theme.textSecondary} />
                  <Text style={{ fontSize: 9, color: theme.textSecondary, marginLeft: 4 }}>
                    {req.fromDate === req.toDate ? req.fromDate : `${req.fromDate} to ${req.toDate}`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.reasonText, { color: theme.textSecondary }]}>
                Reason: "{req.reason}"
              </Text>

              <View style={styles.leaveActionRow}>
                <Pressable 
                  onPress={() => handleRejectLeave(req.id)}
                  style={[styles.actionBtnReject, { borderColor: theme.border }]}
                >
                  <X size={12} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '800', marginLeft: 4 }}>Reject</Text>
                </Pressable>
                
                <Pressable 
                  onPress={() => handleApproveLeave(req.id)}
                  style={[styles.actionBtnApprove, { backgroundColor: colors.success + '15' }]}
                >
                  <Check size={12} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 10, fontWeight: '800', marginLeft: 4 }}>Approve</Text>
                </Pressable>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            title="Leave Requests"
            message="No pending leave requests found."
            iconName="Calendar"
          />
        )}

        {/* ================= APPROVED LEAVES (NEED SUBSTITUTE) ================= */}
        {leaveRequests.filter(r => r.status === 'Approved').length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Approved Leaves - Assign Substitute</Text>
            {leaveRequests.filter(r => r.status === 'Approved').map(req => {
              // Check if substitute assignment already exists
              const subExists = substitutesList.some(s => s.originalTeacher === req.teacherName && s.startDate === req.fromDate);
              return (
                <Card key={req.id} style={[styles.leaveCard, { borderColor: subExists ? theme.border : '#EF444430' }]}>
                  <View style={styles.leaveHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.teacherNameText, { color: theme.text }]}>{req.teacherName}</Text>
                      <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                        Leave Period: {req.fromDate === req.toDate ? req.fromDate : `${req.fromDate} to ${req.toDate}`}
                      </Text>
                    </View>
                    {subExists ? (
                      <View style={[styles.statusPill, { backgroundColor: colors.success + '15' }]}>
                        <Check size={10} color={colors.success} />
                        <Text style={{ fontSize: 8, color: colors.success, fontWeight: '800', marginLeft: 3 }}>Substitute Assigned</Text>
                      </View>
                    ) : (
                      <Pressable 
                        onPress={() => handleTriggerSubstitute(req)}
                        style={[styles.actionBtnTriggerSub, { backgroundColor: '#EC4899' }]}
                      >
                        <Plus size={10} color="#fff" />
                        <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800', marginLeft: 4 }}>Assign Substitute</Text>
                      </Pressable>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* ================= ASSIGNMENT FORM ================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Substitute Setup Form</Text>
          <Pressable 
            onPress={() => setShowAssignForm(!showAssignForm)}
            style={[styles.smallBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.smallBtnText}>{showAssignForm ? 'Close Form' : 'Create Assignment'}</Text>
          </Pressable>
        </View>

        {showAssignForm && (
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={[styles.cardFormTitle, { color: theme.text }]}>Assign Temporary Substitute Teacher</Text>
            
            {/* Form Fields */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select Absent Teacher</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
              {teachers.map(t => (
                <Pressable 
                  key={t}
                  onPress={() => setOriginalTeacher(t)}
                  style={[
                    styles.selectPill, 
                    { borderColor: theme.border, backgroundColor: theme.surface },
                    originalTeacher === t && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                  ]}
                >
                  <Text style={[styles.selectPillText, { color: theme.text }, originalTeacher === t && { color: colors.primary, fontWeight: '800' }]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select Substitute Teacher</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
              {teachers.map(t => (
                <Pressable 
                  key={t}
                  onPress={() => setSubstituteTeacher(t)}
                  style={[
                    styles.selectPill, 
                    { borderColor: theme.border, backgroundColor: theme.surface },
                    substituteTeacher === t && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                  ]}
                >
                  <Text style={[styles.selectPillText, { color: theme.text }, substituteTeacher === t && { color: colors.primary, fontWeight: '800' }]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
              {classes.map(c => (
                <Pressable 
                  key={c}
                  onPress={() => setAssignedClass(c)}
                  style={[
                    styles.selectPill, 
                    { borderColor: theme.border, backgroundColor: theme.surface },
                    assignedClass === c && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                  ]}
                >
                  <Text style={[styles.selectPillText, { color: theme.text }, assignedClass === c && { color: colors.primary, fontWeight: '800' }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select Duration</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Pressable 
                onPress={() => setDurationMode('Today')}
                style={[
                  styles.durationBtn, 
                  { borderColor: theme.border },
                  durationMode === 'Today' && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={{ fontSize: 10, color: durationMode === 'Today' ? '#fff' : theme.text, fontWeight: '700' }}>Today Only</Text>
              </Pressable>

              <Pressable 
                onPress={() => setDurationMode('Custom')}
                style={[
                  styles.durationBtn, 
                  { borderColor: theme.border, marginLeft: 8 },
                  durationMode === 'Custom' && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={{ fontSize: 10, color: durationMode === 'Custom' ? '#fff' : theme.text, fontWeight: '700' }}>Custom Range</Text>
              </Pressable>
            </View>

            {durationMode === 'Custom' && (
              <View style={styles.datesRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput 
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>End Date (YYYY-MM-DD)</Text>
                  <TextInput 
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            )}

            <Pressable 
              onPress={handleSaveSubstitute}
              style={[styles.submitFormBtn, { backgroundColor: colors.primary }]}
            >
              <Save size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginLeft: 6 }}>Save substitute assignments</Text>
            </Pressable>
          </Card>
        )}

        {/* ================= ACTIVE ASSIGNMENTS LIST ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Cover Assignments</Text>
        {substitutesList.length > 0 ? (
          substitutesList.map(item => {
            const assignmentStatus = getAssignmentStatus(item);
            const isExpired = assignmentStatus === 'Expired';
            return (
              <Card key={item.id} style={[styles.subListItem, isExpired && { opacity: 0.6 }]}>
                <View style={styles.subItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>
                      {item.substituteTeacher}
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>
                      Substitute for {item.originalTeacher}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
                      Class: {item.assignedClass} | Duration: {item.startDate === item.endDate ? item.startDate : `${item.startDate} to ${item.endDate}`}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[
                      styles.statusPill, 
                      { backgroundColor: isExpired ? '#F3F4F6' : colors.success + '15' }
                    ]}>
                      <Text style={{ 
                        fontSize: 8, 
                        fontWeight: '800', 
                        color: isExpired ? theme.textSecondary : colors.success,
                        textTransform: 'uppercase' 
                      }}>{assignmentStatus}</Text>
                    </View>
                    <Pressable 
                      onPress={() => handleDeleteAssignment(item.id)}
                      style={{ marginTop: 10 }}
                    >
                      <X size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <EmptyState
            title="Substitute Assignments"
            message="No substitute cover assignments active today."
            iconName="UserCheck"
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
    paddingBottom: 110,
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
    fontSize: 16,
    fontWeight: '900',
  },
  subScreenSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  leaveCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  leaveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  teacherNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  leaveDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 8,
    borderRadius: 8,
  },
  leaveActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionBtnReject: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  actionBtnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBtnTriggerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardFormTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
  },
  horizontalSelect: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  selectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  selectPillText: {
    fontSize: 9,
  },
  durationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  datesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 10,
    fontSize: 11,
    backgroundColor: '#fff',
  },
  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: 38,
    marginTop: 8,
  },
  subListItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 8,
  },
  subItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
