import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { logout } from '../../store/authSlice';
import { toggleTheme } from '../../store/themeSlice';
import api from '../../services/api';
import { ArrowLeft, User, Mail, Award, Book, LogOut, Sun, Moon, ChevronRight, FileText } from 'lucide-react-native';

interface TeacherProfileScreenProps {
  onBack: () => void;
}

export const TeacherProfileScreen: React.FC<TeacherProfileScreenProps> = ({ onBack }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const tDetails = {
    name: user?.name || teacherData.dashboard?.name || 'Teacher',
    teacherId: user?.username || teacherData.dashboard?.teacherId || 'N/A',
    qualification: teacherData.dashboard?.qualification || 'N/A',
    assignedClass: teacherData.dashboard?.assignedClass || 'No Class Assigned',
    email: user?.email || `${user?.username || 'teacher'}@vbvschool.edu.in`
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const openSalaryHistory = async () => {
    setShowSalaryModal(true);
    setSalaryLoading(true);
    try {
      const res = await api.get('/teacher/salary-history');
      setSalaryHistory(res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to retrieve salary payments history.');
    } finally {
      setSalaryLoading(false);
    }
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Teacher Profile</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Account details and credentials</Text>
          </View>
        </View>

        {/* ================= CARD PROFILE BANNER ================= */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{tDetails.name?.charAt(0) || 'A'}</Text>
            </View>
            <Text style={[styles.profileName, { color: theme.text }]}>{tDetails.name}</Text>
            <Text style={[styles.profileSub, { color: theme.textSecondary }]}>Faculty Member</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <User size={16} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Teacher ID</Text>
              <Text style={[styles.infoVal, { color: theme.text }]}>{tDetails.teacherId}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Award size={16} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Qualifications</Text>
              <Text style={[styles.infoVal, { color: theme.text }]}>{tDetails.qualification || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Book size={16} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Assigned Class</Text>
              <Text style={[styles.infoVal, { color: theme.text }]}>{tDetails.assignedClass || 'None'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Mail size={16} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email Address</Text>
              <Text style={[styles.infoVal, { color: theme.text }]}>{tDetails.email}</Text>
            </View>
          </View>
        </Card>

        {/* ================= SALARY HISTORY ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Financials & Compensation</Text>
        <Card style={{ paddingVertical: 8 }}>
          <Pressable onPress={openSalaryHistory} style={styles.preferenceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={18} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={[styles.preferenceText, { color: theme.text }]}>
                Salary History & Payslips
              </Text>
            </View>
            <ChevronRight size={16} color={theme.textSecondary} />
          </Pressable>
        </Card>

        {/* ================= ACCOUNT PREFERENCES ================= */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Preferences & Theme</Text>
        <Card style={{ paddingVertical: 8 }}>
          <Pressable onPress={handleToggleTheme} style={styles.preferenceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isDarkMode ? (
                <Sun size={18} color="#F59E0B" style={{ marginRight: 12 }} />
              ) : (
                <Moon size={18} color="#64748B" style={{ marginRight: 12 }} />
              )}
              <Text style={[styles.preferenceText, { color: theme.text }]}>
                {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Text>
            </View>
            <ChevronRight size={16} color={theme.textSecondary} />
          </Pressable>
        </Card>

        {/* ================= LOGOUT BUTTON ================= */}
        <Pressable 
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.danger }]}
        >
          <LogOut size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout Account</Text>
        </Pressable>

      </ScrollView>

      {/* ================= SALARY HISTORY MODAL ================= */}
      <Modal visible={showSalaryModal} transparent animationType="slide" onRequestClose={() => setShowSalaryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: '#EF4444' }]}>💵 Salary Registry</Text>
            
            {salaryLoading ? (
              <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350, width: '100%', marginVertical: 10 }}>
                {salaryHistory.length > 0 ? (
                  salaryHistory.map((item, index) => (
                    <View 
                      key={item._id || index} 
                      style={[
                        styles.salaryRow, 
                        { 
                          borderColor: theme.border, 
                          borderBottomWidth: index === salaryHistory.length - 1 ? 0 : 1 
                        }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text }}>
                          {item.salaryMonth}
                        </Text>
                        <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>
                          Voucher: {item.referenceNumber || 'N/A'} | Mode: {item.paymentMethod}
                        </Text>
                        <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                          Paid Date: {item.date ? item.date.split('T')[0] : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#198754' }}>
                          ₹{item.amount.toLocaleString()}
                        </Text>
                        <Pressable 
                          onPress={() => Alert.alert('Payslip PDF', `Payslip for ${item.salaryMonth} has been downloaded.`)}
                          style={[styles.downloadBtn, { backgroundColor: '#EF444415' }]}
                        >
                          <Text style={{ fontSize: 8, color: '#EF4444', fontWeight: 'bold' }}>Download</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>No salary records found.</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <Pressable onPress={() => setShowSalaryModal(false)} style={[styles.logoutBtn, { width: '100%', marginTop: 10, marginBottom: 0 }]}>
              <Text style={styles.logoutBtnText}>Close</Text>
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
  profileCard: {
    padding: 20,
    marginVertical: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileSub: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 12,
    marginTop: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  preferenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 90,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '90%',
    maxWidth: 450,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  salaryRow: {
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  downloadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  }
});
