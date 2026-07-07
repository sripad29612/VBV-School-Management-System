import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { reportService } from '../../services/reportService';
import { ArrowLeft, Check, X, Undo, CornerDownRight, FileText } from 'lucide-react-native';

interface PrincipalLessonReportsProps {
  onBack: () => void;
}

export const PrincipalLessonReports: React.FC<PrincipalLessonReportsProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [reportsList, setReportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Return with Note modal states
  const [returnReportId, setReturnReportId] = useState<string | null>(null);
  const [returnNote, setReturnNote] = useState('');

  const loadReportsList = async () => {
    setLoading(true);
    try {
      const data = await reportService.fetchReports();
      // Skip local drafts for Principal review
      const visible = data.filter((r: any) => r.status !== 'Draft');
      setReportsList(visible.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsList();
  }, []);

  const handleApprove = async (reportId: string) => {
    try {
      await reportService.updateStatus(reportId, 'Approved');
      alert('Report approved successfully!');
      loadReportsList();
    } catch (err) {
      alert('Failed to approve report.');
    }
  };

  const handleReject = async (reportId: string) => {
    try {
      await reportService.updateStatus(reportId, 'Rejected');
      alert('Report rejected. Sent back to teacher roster.');
      loadReportsList();
    } catch (err) {
      alert('Failed to reject report.');
    }
  };

  const handleReturnPrompt = (reportId: string) => {
    setReturnReportId(reportId);
    setReturnNote('');
  };

  const handleSaveReturnNote = async () => {
    if (!returnReportId) return;
    try {
      await reportService.updateStatus(returnReportId, 'Returned', returnNote);
      alert('Report returned to teacher with guidelines note.');
      setReturnReportId(null);
      loadReportsList();
    } catch (err) {
      alert('Failed to return report.');
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Lesson Teaching Reports</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Approve, Reject, or Return teacher logs</Text>
          </View>
        </View>

        {/* ================= LIST OF REPORTS ================= */}
        {loading ? (
          <ActivityIndicator size="small" color="#6F42C1" style={{ marginTop: 20 }} />
        ) : reportsList.length > 0 ? (
          reportsList.map((rep: any) => (
            <Card key={rep._id} style={{ padding: 16, marginVertical: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{rep.teacherName}</Text>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: rep.status === 'Submitted' ? '#FFE8D6' 
                      : rep.status === 'Reviewed' ? '#E0F2FE' 
                      : rep.status === 'Approved' ? '#D1E7DD' 
                      : rep.status === 'Rejected' ? '#F8D7DA' : '#FFF3CD',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6
                  }
                ]}>
                  <Text style={{ 
                    fontSize: 8, 
                    fontWeight: '800', 
                    color: rep.status === 'Submitted' ? '#D97706' 
                      : rep.status === 'Reviewed' ? '#0284C7' 
                      : rep.status === 'Approved' ? '#0F5132' 
                      : rep.status === 'Rejected' ? '#842029' : '#664D03',
                    textTransform: 'uppercase'
                  }}>{rep.status}</Text>
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>
                  Class: {rep.className} | Subject: {rep.subject}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
                  Topic: {rep.chapter} - {rep.topicCovered}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
                  Date: {rep.date} | Submitted: {rep.submissionTime}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 }}>
                  Completion Status: {rep.completionStatus}
                </Text>
                {rep.notes ? (
                  <View style={styles.noteBox}>
                    <CornerDownRight size={10} color={theme.textSecondary} style={{ marginRight: 4, marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>
                      {rep.notes}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons for Principal */}
              {(rep.status === 'Submitted' || rep.status === 'Reviewed' || rep.status === 'Returned') && (
                <View style={styles.actionRow}>
                  <Pressable 
                    onPress={() => handleReturnPrompt(rep._id)}
                    style={[styles.actionBtn, { backgroundColor: '#FFF3CD' }]}
                  >
                    <Undo size={12} color="#664D03" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#664D03', fontSize: 9, fontWeight: '800' }}>Return</Text>
                  </Pressable>

                  <Pressable 
                    onPress={() => handleReject(rep._id)}
                    style={[styles.actionBtn, { backgroundColor: '#F8D7DA', marginHorizontal: 6 }]}
                  >
                    <X size={12} color="#842029" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#842029', fontSize: 9, fontWeight: '800' }}>Reject</Text>
                  </Pressable>

                  <Pressable 
                    onPress={() => handleApprove(rep._id)}
                    style={[styles.actionBtn, { backgroundColor: '#D1E7DD' }]}
                  >
                    <Check size={12} color="#0F5132" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#0F5132', fontSize: 9, fontWeight: '800' }}>Approve</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FileText size={28} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 8 }}>
              No lesson reports submitted for review.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ================= RETURN NOTE OVERLAY MODAL ================= */}
      <Modal
        visible={returnReportId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReturnReportId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Return Report with Notes</Text>
            
            <TextInput
              style={[styles.noteInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="e.g. Please clarify homework exercises list or complete activity details..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={returnNote}
              onChangeText={setReturnNote}
            />

            <View style={styles.modalActions}>
              <Pressable 
                onPress={() => setReturnReportId(null)}
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveReturnNote}
                style={[styles.modalBtn, { backgroundColor: '#6F42C1' }]}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Submit Note</Text>
              </Pressable>
            </View>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
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
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  noteInput: {
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 11,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  }
});
