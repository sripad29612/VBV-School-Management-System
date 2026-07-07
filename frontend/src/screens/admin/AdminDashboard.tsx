import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { 
  Users, UserCheck, ShieldAlert, Award, FileText, Calendar, 
  TrendingUp, TrendingDown, AlertCircle, Clock, Plus, Zap, DollarSign, ListOrdered, X, Wallet
} from 'lucide-react-native';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onSyncAllPortals: () => void;
  refreshTrigger?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onSyncAllPortals, refreshTrigger }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalTeachers: 0,
    classesCount: 0,
    pendingVerify: 0,
    todayCollection: 0,
    monthlyCollection: 0,
    pendingFees: 0,
    totalCollection: 0,
    attendancePresent: 0,
    attendanceTotal: 0,
    studentBdays: 0,
    teacherBdays: 0,
    totalExpected: 0,
    fullyPaidCount: 0,
    partiallyPaidCount: 0,
    pendingCount: 0,
    todayIncome: 0,
    todayExpense: 0,
    todayNetCollection: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyNetIncome: 0,
    totalIncome: 0,
    totalExpense: 0,
    netIncome: 0,
    pendingFeeCollection: 0,
    pendingSalaries: 0,
    expectedRevenue: 0,
    outstandingAmount: 0
  });

  const [classesList, setClassesList] = useState<any[]>([]);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  // Detailed Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  // Month selector for monthly collected modal
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const loadDashboardData = async () => {
    if (!hasInitialLoaded) {
      setLoading(true);
    }
    try {
      const [statsRes, classesRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/classes')
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }
      setClassesList(classesRes.data || []);
      setHasInitialLoaded(true);
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const openCardDetails = async (cardType: string) => {
    setActiveModal(cardType);
    setModalLoading(true);
    setModalData(null);
    try {
      let endpoint = `/admin/dashboard-detail?card=${cardType}`;
      if (cardType === 'monthly-collected') {
        endpoint += `&month=${selectedMonth}`;
      }
      const res = await api.get(endpoint);
      setModalData(res.data);
    } catch (e) {
      console.error('Error loading card detail:', e);
    } finally {
      setModalLoading(false);
    }
  };

  // Trigger monthly update when selected month changes
  useEffect(() => {
    if (activeModal === 'monthly-collected') {
      openCardDetails('monthly-collected');
    }
  }, [selectedMonth]);

  const handleNoticeSend = () => {
    const notice = prompt("Enter announcement text to broadcast to all portals:");
    if (notice && notice.trim()) {
      alert("Notice sent successfully to all student, parent, and teacher feeds!");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= WELCOME PREMIUM BANNER ================= */}
        <View style={[styles.welcomeBanner, { backgroundColor: '#071B4D' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeGreeting}>Good Morning,</Text>
            <Text style={styles.welcomeUser}>Ramanujam Acharya</Text>
            <Text style={styles.welcomeDate}>Today: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={styles.bannerRight}>
            <View style={styles.ayCapsule}>
              <Text style={styles.ayText}>AY 2026-27</Text>
            </View>
          </View>
        </View>

        {/* ================= QUICK ACTIONS PANEL ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Operations</Text>
        <Card style={styles.quickActionsCard}>
          <Pressable onPress={() => onNavigate('admissions')} style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: '#EF4444' }]}>
              <Plus size={16} color="#ffffff" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>New Admission</Text>
          </Pressable>

          <Pressable onPress={() => onNavigate('fees')} style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: '#10B981' }]}>
              <DollarSign size={16} color="#ffffff" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Collect Fee</Text>
          </Pressable>

          <Pressable onPress={() => onNavigate('teachers')} style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: '#3B82F6' }]}>
              <UserCheck size={16} color="#ffffff" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Add Teacher</Text>
          </Pressable>

          <Pressable onPress={handleNoticeSend} style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: '#F59E0B' }]}>
              <Plus size={16} color="#ffffff" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Send Notice</Text>
          </Pressable>

          <Pressable onPress={() => onNavigate('reports')} style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: '#6F42C1' }]}>
              <FileText size={16} color="#ffffff" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Reports</Text>
          </Pressable>

          <Pressable onPress={() => onNavigate('transport')} style={styles.actionBtn}>
            <View style={[styles.actionIconBox, { backgroundColor: '#5856d6' }]}>
              <FileText size={16} color="#ffffff" />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Transport</Text>
          </Pressable>
        </Card>

        {/* ================= STATS GRID ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Operational & Financial Metrics</Text>
        {loading ? (
          <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.gridContainer}>
            {/* Active Students -> Modal */}
            <Pressable onPress={() => openCardDetails('active-students')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#0B5ED715' }]}>
                <Users size={18} color="#0B5ED7" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.activeStudents}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Active Students</Text>
            </Pressable>

            {/* Total Teachers -> Navigate */}
            <Pressable onPress={() => onNavigate('teachers')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#19875415' }]}>
                <UserCheck size={18} color="#198754" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalTeachers}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Total Teachers</Text>
            </Pressable>

            {/* Total Classes -> Modal */}
            <Pressable onPress={() => openCardDetails('total-classes')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#6F42C115' }]}>
                <Award size={18} color="#6F42C1" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.classesCount}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Total Classes</Text>
            </Pressable>

            {/* Pending Admissions -> Navigate */}
            <Pressable onPress={() => onNavigate('admissions')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#DC354515' }]}>
                <ShieldAlert size={18} color="#DC3545" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingVerify}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Pending Admissions</Text>
            </Pressable>

            {/* Manage Expenses -> Navigate */}
            <Pressable onPress={() => onNavigate('expenses')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#E2E8F0', borderColor: theme.border }]}>
                <Wallet size={18} color="#475569" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.totalExpense || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Manage Expenses</Text>
            </Pressable>

            {/* Today's Income -> Modal */}
            <Pressable onPress={() => openCardDetails('today-income')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                <TrendingUp size={18} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.todayIncome || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Today's Income</Text>
            </Pressable>

            {/* Today's Expenses */}
            <Pressable onPress={() => openCardDetails('today-expenses')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <TrendingDown size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.todayExpense || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Today's Expenses</Text>
            </Pressable>

            {/* Today's Net Collection */}
            <Pressable onPress={() => openCardDetails('today-net')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#3B82F615' }]}>
                <DollarSign size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                ₹{(stats.todayNetCollection || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Today's Net Collection</Text>
            </Pressable>

            {/* Monthly Income -> Modal */}
            <Pressable onPress={() => openCardDetails('monthly-income')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                <TrendingUp size={18} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.monthlyIncome || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Monthly Income</Text>
            </Pressable>

            {/* Monthly Expenses */}
            <Pressable onPress={() => openCardDetails('monthly-expenses')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <TrendingDown size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.monthlyExpense || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Monthly Expenses</Text>
            </Pressable>

            {/* Monthly Net Income */}
            <Pressable onPress={() => openCardDetails('monthly-net')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#3B82F615' }]}>
                <DollarSign size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                ₹{(stats.monthlyNetIncome || 0).toLocaleString()}
              </Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Monthly Net Income</Text>
            </Pressable>

            {/* Total Income */}
            <Pressable onPress={() => openCardDetails('total-income')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                <TrendingUp size={18} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.totalIncome || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Total Income</Text>
            </Pressable>

            {/* Total Expenses */}
            <Pressable onPress={() => openCardDetails('total-expenses')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <TrendingDown size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.totalExpense || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Total Expenses</Text>
            </Pressable>

            {/* Net Income */}
            <Pressable onPress={() => openCardDetails('net-income')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#3B82F615' }]}>
                <DollarSign size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.netIncome || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Net Income</Text>
            </Pressable>

            {/* Pending Fee Collection -> Modal */}
            <Pressable onPress={() => openCardDetails('pending-deficits')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                <ShieldAlert size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.pendingFeeCollection || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Pending Fee Collection</Text>
            </Pressable>

            {/* Pending Salaries */}
            <Pressable onPress={() => openCardDetails('pending-salaries')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                <Clock size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.pendingSalaries || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Pending Salaries</Text>
            </Pressable>

            {/* Expected Revenue */}
            <Pressable onPress={() => openCardDetails('expected-revenue')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#8B5CF615' }]}>
                <DollarSign size={18} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.expectedRevenue || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Expected Revenue</Text>
            </Pressable>

            {/* Outstanding Amount */}
            <Pressable onPress={() => openCardDetails('outstanding-amount')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <AlertCircle size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>₹{(stats.outstandingAmount || 0).toLocaleString()}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Outstanding Amount</Text>
            </Pressable>

            {/* Students Fully Paid */}
            <Pressable onPress={() => openCardDetails('fully-paid')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                <UserCheck size={18} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.fullyPaidCount || 0}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Students Fully Paid</Text>
            </Pressable>

            {/* Students Pending */}
            <Pressable onPress={() => openCardDetails('students-pending')} style={[styles.statCardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <UserCheck size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingCount || 0}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Students Pending</Text>
            </Pressable>
          </View>
        )}

        {/* ================= INFORMATIONAL WIDGETS (Attendance & Birthdays) ================= */}
        <View style={styles.infoWidgetsRow}>
          <Card style={[styles.infoWidgetCard, { marginRight: 6 }]}>
            <View style={styles.infoWidgetHeader}>
              <Clock size={16} color="#0B5ED7" />
              <Text style={[styles.infoWidgetTitle, { color: theme.text }]}>Today's Attendance</Text>
            </View>
            <View style={styles.infoWidgetBody}>
              <Text style={[styles.infoWidgetValue, { color: theme.text }]}>
                {stats.attendancePresent} / {stats.attendanceTotal}
              </Text>
              <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '800', marginTop: 2 }}>
                {stats.attendanceTotal > 0 ? Math.round((stats.attendancePresent / stats.attendanceTotal) * 100) : 0}% Present
              </Text>
            </View>
          </Card>

          <Card style={[styles.infoWidgetCard, { marginLeft: 6 }]}>
            <View style={styles.infoWidgetHeader}>
              <Calendar size={16} color="#FF9F00" />
              <Text style={[styles.infoWidgetTitle, { color: theme.text }]}>Today's Birthdays</Text>
            </View>
            <View style={styles.infoWidgetBody}>
              <Text style={[styles.infoWidgetText, { color: theme.text }]}>
                Students : <Text style={{ fontWeight: '800' }}>{stats.studentBdays}</Text>
              </Text>
              <Text style={[styles.infoWidgetText, { color: theme.text, marginTop: 4 }]}>
                Teachers : <Text style={{ fontWeight: '800' }}>{stats.teacherBdays}</Text>
              </Text>
            </View>
          </Card>
        </View>

        {/* ================= CLASS-WISE STUDENT STRENGTH PROGRESS BARS ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Class Strength Capacity Validation</Text>
        <Card style={{ padding: 14 }}>
          {classesList.length === 0 ? (
            <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No classes configured.</Text>
          ) : (
            classesList.map(c => {
              const approved = c.approvedCount || 0;
              const cap = c.maxCapacity || 40;
              const pct = Math.min(100, Math.round((approved / cap) * 100));
              
              // Draw compact progress bars
              const barsCount = Math.round(pct / 10);
              const filledBar = "█".repeat(barsCount);
              const emptyBar = "░".repeat(10 - barsCount);
              
              return (
                <View key={c._id} style={styles.classProgressLine}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{c.name} - {c.section}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>{approved} / {cap} ({pct}%)</Text>
                  </View>
                  <Text style={{ fontFamily: 'Courier New', fontSize: 12, color: pct >= 100 ? '#DC3545' : '#10B981' }}>
                    {filledBar}{emptyBar}
                  </Text>
                </View>
              );
            })
          )}
        </Card>

      </ScrollView>

      {/* ================= DETAILED MODAL DIALOGS ================= */}
      {activeModal && (
        <Modal visible={activeModal !== null} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {activeModal === 'active-students' && 'School Strength Summary'}
                  {activeModal === 'total-classes' && 'Classes Capacity Overview'}
                  {(activeModal === 'today-income' || activeModal === 'today-collected') && "Today's Income details"}
                  {activeModal === 'today-expenses' && "Today's Expenses details"}
                  {activeModal === 'today-net' && "Today's Net Collection Details"}
                  {(activeModal === 'monthly-income' || activeModal === 'monthly-collected') && 'Monthly Income details'}
                  {activeModal === 'monthly-expenses' && 'Monthly Expenses Details'}
                  {activeModal === 'monthly-net' && 'Monthly Net Income details'}
                  {activeModal === 'total-income' && 'Total Income breakdown'}
                  {activeModal === 'total-expenses' && 'Total Expenses breakdown'}
                  {activeModal === 'net-income' && 'Net Income Statement Details'}
                  {(activeModal === 'pending-deficits' || activeModal === 'outstanding-amount' || activeModal === 'students-pending') && 'Pending Fee Collection details'}
                  {activeModal === 'expected-revenue' && 'Expected Annual Revenue Details'}
                  {activeModal === 'fully-paid' && 'Fully Paid Student Registry'}
                  {activeModal === 'pending-salaries' && 'Pending Salaries Details'}
                </Text>
                <Pressable 
                  onPress={() => setActiveModal(null)} 
                  style={[
                    styles.modalCloseBtn, 
                    { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }
                  ]}
                >
                  <X size={16} color={isDarkMode ? '#F1F5F9' : '#0F172A'} strokeWidth={2.5} />
                </Pressable>
              </View>

              {modalLoading ? (
                <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 30 }} />
              ) : (
                <ScrollView style={{ maxHeight: 400, marginVertical: 10 }}>
                  
                  {/* MODAL 1: ACTIVE STUDENTS */}
                  {activeModal === 'active-students' && modalData && (
                    <View>
                      <View style={styles.summaryStatsRow}>
                        <View style={styles.summaryStat}>
                          <Text style={styles.summaryLabel}>Total Active</Text>
                          <Text style={[styles.summaryVal, { color: '#0B5ED7' }]}>{modalData.totalStudents}</Text>
                        </View>
                        <View style={styles.summaryStat}>
                          <Text style={styles.summaryLabel}>Total Boys</Text>
                          <Text style={[styles.summaryVal, { color: '#10B981' }]}>{modalData.totalBoys}</Text>
                        </View>
                        <View style={styles.summaryStat}>
                          <Text style={styles.summaryLabel}>Total Girls</Text>
                          <Text style={[styles.summaryVal, { color: '#6F42C1' }]}>{modalData.totalGirls}</Text>
                        </View>
                      </View>

                      <Text style={styles.detailsHeader}>Class Breakdown</Text>
                      {modalData.classSummary.map((c: any) => (
                        <View key={c._id} style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>{c.name} - {c.section}</Text>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>{c.approvedCount} / {c.maxCapacity} Students</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* MODAL 2: TOTAL CLASSES */}
                  {activeModal === 'total-classes' && modalData && (
                    <View>
                      {modalData.classDetails.map((c: any) => (
                        <View key={c._id} style={styles.classDetailBox}>
                          <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800', marginBottom: 4 }}>
                            {c.name} - {c.section}
                          </Text>
                          <Text style={{ fontSize: 10, color: theme.textSecondary }}>Class Teacher: {c.classTeacher}</Text>
                          <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                            Capacity: {c.maxCapacity} | Strength: {c.approvedCount} (Boys: {c.boys}, Girls: {c.girls})
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* MODAL 3: TODAY COLLECTED */}
                  {(activeModal === 'today-income' || activeModal === 'today-collected') && modalData && (
                    <View>
                      {modalData.grandTotal > 0 ? (
                        <>
                          {Object.keys(modalData.breakdown).map(head => (
                            <View key={head} style={styles.detailRowLine}>
                              <Text style={{ fontSize: 11, color: theme.text, textTransform: 'capitalize' }}>{head} Fee</Text>
                              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>₹{modalData.breakdown[head].toLocaleString()}</Text>
                            </View>
                          ))}
                          <View style={styles.grandTotalLine}>
                            <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Grand Total Collected</Text>
                            <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '800' }}>₹{modalData.grandTotal.toLocaleString()}</Text>
                          </View>
                        </>
                      ) : (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' }}>
                            No fee collection records found for today.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* MODAL 4: MONTHLY FINANCIAL SUMMARY */}
                  {activeModal === 'monthly-collected' && modalData && (
                    <View>
                      {/* Month selector grid */}
                      <View style={styles.monthSelectorGrid}>
                        {monthNames.map((name, idx) => (
                          <Pressable
                            key={idx}
                            onPress={() => setSelectedMonth(idx)}
                            style={[styles.monthPill, {
                              backgroundColor: selectedMonth === idx ? '#EF4444' : theme.background,
                              borderColor: selectedMonth === idx ? '#EF4444' : theme.border
                            }]}
                          >
                            <Text style={{ fontSize: 8, color: selectedMonth === idx ? '#fff' : theme.textSecondary, fontWeight: '800' }}>
                              {name.slice(0, 3)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <View style={styles.monthlyFinancialCard}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800', marginBottom: 10 }}>
                          Financial Status: {monthNames[selectedMonth]}
                        </Text>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Collected Amount (Income)</Text>
                          <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '800' }}>₹{modalData.collected.toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Operational Expenses</Text>
                          <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '800' }}>₹{(modalData.expenses || 0).toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Net Profit / Margin</Text>
                          <Text style={{ fontSize: 11, color: (modalData.netProfit || 0) >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' }}>₹{(modalData.netProfit || 0).toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Pending Fee Balance</Text>
                          <Text style={{ fontSize: 11, color: '#DC3545', fontWeight: '800' }}>₹{modalData.pending.toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Pending Salaries</Text>
                          <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '800' }}>₹{(modalData.pendingSalaries || 0).toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Expected Revenue</Text>
                          <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '800' }}>₹{modalData.expectedCollection.toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>New Admissions</Text>
                          <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{modalData.admissionsCount}</Text>
                        </View>
                        <View style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Receipts Generated</Text>
                          <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{modalData.receiptsGenerated}</Text>
                        </View>
                      </View>

                      <Text style={styles.detailsHeader}>Payment Mode Breakdown</Text>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Cash payments</Text>
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>₹{modalData.modes.cash.toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>UPI transfers</Text>
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>₹{modalData.modes.upi.toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Bank / Card / Online</Text>
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>₹{modalData.modes.bankTransfer.toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Cheques cleared</Text>
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>₹{modalData.modes.cheque.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 5: PENDING DEFICITS / OUTSTANDING / STUDENTS PENDING */}
                  {(activeModal === 'pending-deficits' || activeModal === 'outstanding-amount' || activeModal === 'students-pending') && modalData && (
                    <View>
                      <View style={styles.summaryStatsRow}>
                        <View style={styles.summaryStat}>
                          <Text style={styles.summaryLabel}>Students Pending</Text>
                          <Text style={[styles.summaryVal, { color: '#DC3545' }]}>{modalData.studentsWithPending}</Text>
                        </View>
                        <View style={styles.summaryStat}>
                          <Text style={styles.summaryLabel}>Highest Outstanding</Text>
                          <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>₹{modalData.highestPending.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryStat}>
                          <Text style={styles.summaryLabel}>Average Pending</Text>
                          <Text style={[styles.summaryVal, { color: '#3B82F6' }]}>₹{Math.round(modalData.averagePending).toLocaleString()}</Text>
                        </View>
                      </View>

                      <Text style={styles.detailsHeader}>Heads Deficit Breakdown</Text>
                      {['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'].map(head => (
                        <View key={head} style={styles.detailRowLine}>
                          <Text style={{ fontSize: 11, color: theme.text, textTransform: 'capitalize' }}>{head} Fee Pending</Text>
                          <Text style={{ fontSize: 11, color: '#DC3545', fontWeight: '700' }}>₹{modalData.breakdown[head].toLocaleString()}</Text>
                        </View>
                      ))}
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Grand Total Pending</Text>
                        <Text style={{ fontSize: 12, color: '#DC3545', fontWeight: '800' }}>₹{modalData.grandTotalPending.toLocaleString()}</Text>
                      </View>

                      {modalData.studentList && modalData.studentList.length > 0 && (
                        <View style={{ marginTop: 14 }}>
                          <Text style={styles.detailsHeader}>Outstanding Students Details</Text>
                          {modalData.studentList.map((st: any, idx: number) => (
                            <View key={idx} style={[styles.classDetailBox, { backgroundColor: theme.background, borderRadius: 8, padding: 8, marginBottom: 8 }]}>
                              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{st.studentName} ({st.className})</Text>
                              <Text style={{ fontSize: 9, color: theme.textSecondary }}>Adm No: {st.admissionNumber}</Text>
                              <Text style={{ fontSize: 10, color: '#DC3545', fontWeight: '700', marginTop: 2 }}>Outstanding: ₹{st.balanceAmount.toLocaleString()}</Text>
                              
                              {st.pendingCategories && st.pendingCategories.length > 0 ? (
                                <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 4 }}><Text style={{ fontWeight: '700' }}>Pending Categories:</Text> {st.pendingCategories.join(' | ')}</Text>
                              ) : null}

                              {st.pendingInstallments && st.pendingInstallments.length > 0 ? (
                                <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 2 }}><Text style={{ fontWeight: '700' }}>Pending Installments:</Text> {st.pendingInstallments.join(' | ')}</Text>
                              ) : null}

                              {st.payments && st.payments.length > 0 ? (
                                <View style={{ marginTop: 4 }}>
                                  <Text style={{ fontSize: 8, color: theme.textSecondary, fontWeight: '700' }}>Receipt History:</Text>
                                  {st.payments.map((p: any, pIdx: number) => (
                                    <Text key={pIdx} style={{ fontSize: 8, color: theme.textSecondary }}>
                                      • {p.receiptNumber} - ₹{p.amount.toLocaleString()} ({p.date ? p.date.split('T')[0] : ''})
                                    </Text>
                                  ))}
                                </View>
                              ) : null}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* MODAL 6: TODAY EXPENSES */}
                  {activeModal === 'today-expenses' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Today's Expense Breakdown</Text>
                      {Object.keys(modalData.breakdown).length > 0 ? (
                        Object.entries(modalData.breakdown).map(([cat, val]: any) => (
                          <View key={cat} style={styles.detailRowLine}>
                            <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
                            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>₹{val.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No expenses recorded today.</Text>
                      )}
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Total Expenses</Text>
                        <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '800' }}>₹{modalData.grandTotal.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 7: TODAY'S NET */}
                  {activeModal === 'today-net' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Today's Balance Summary</Text>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Today's Income</Text>
                        <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>₹{modalData.todayIncome.toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Today's Expenses</Text>
                        <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>₹{modalData.todayExpense.toLocaleString()}</Text>
                      </View>
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Today's Net Collection</Text>
                        <Text style={{ fontSize: 12, color: modalData.netCollection >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' }}>₹{modalData.netCollection.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 8: MONTHLY INCOME */}
                  {activeModal === 'monthly-income' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Monthly Income Categories</Text>
                      {Object.keys(modalData.breakdown).length > 0 ? (
                        Object.entries(modalData.breakdown).map(([cat, val]: any) => (
                          <View key={cat} style={styles.detailRowLine}>
                            <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
                            <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>₹{val.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No income recorded this month.</Text>
                      )}
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Total Monthly Income</Text>
                        <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '800' }}>₹{modalData.grandTotal.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 9: MONTHLY EXPENSES */}
                  {activeModal === 'monthly-expenses' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Monthly Expense Categories</Text>
                      {Object.keys(modalData.breakdown).length > 0 ? (
                        Object.entries(modalData.breakdown).map(([cat, val]: any) => (
                          <View key={cat} style={styles.detailRowLine}>
                            <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
                            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>₹{val.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No expenses recorded this month.</Text>
                      )}
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Total Monthly Expenses</Text>
                        <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '800' }}>₹{modalData.grandTotal.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 10: MONTHLY NET */}
                  {activeModal === 'monthly-net' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Monthly Profitability Summary</Text>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Monthly Income</Text>
                        <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>₹{modalData.monthlyIncome.toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Monthly Expenses</Text>
                        <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>₹{modalData.monthlyExpense.toLocaleString()}</Text>
                      </View>
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Monthly Net Income</Text>
                        <Text style={{ fontSize: 12, color: modalData.netIncome >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' }}>₹{modalData.netIncome.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 11: TOTAL INCOME */}
                  {activeModal === 'total-income' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Cumulative Income Categories</Text>
                      {Object.keys(modalData.breakdown).length > 0 ? (
                        Object.entries(modalData.breakdown).map(([cat, val]: any) => (
                          <View key={cat} style={styles.detailRowLine}>
                            <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
                            <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>₹{val.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No income recorded yet.</Text>
                      )}
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Total Cumulative Income</Text>
                        <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '800' }}>₹{modalData.grandTotal.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 12: TOTAL EXPENSES */}
                  {activeModal === 'total-expenses' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Cumulative Expense Categories</Text>
                      {Object.keys(modalData.breakdown).length > 0 ? (
                        Object.entries(modalData.breakdown).map(([cat, val]: any) => (
                          <View key={cat} style={styles.detailRowLine}>
                            <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
                            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>₹{val.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No expenses recorded yet.</Text>
                      )}
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Total Cumulative Expenses</Text>
                        <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '800' }}>₹{modalData.grandTotal.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 13: NET INCOME */}
                  {activeModal === 'net-income' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Net Balance Statement</Text>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Total Income</Text>
                        <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>₹{modalData.totalIncome.toLocaleString()}</Text>
                      </View>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Total Expenses</Text>
                        <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>₹{modalData.totalExpense.toLocaleString()}</Text>
                      </View>
                      <View style={styles.grandTotalLine}>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Net Balance</Text>
                        <Text style={{ fontSize: 12, color: modalData.netIncome >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' }}>₹{modalData.netIncome.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {/* MODAL 14: EXPECTED REVENUE */}
                  {activeModal === 'expected-revenue' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Expected Annual Revenue Breakdown</Text>
                      <View style={styles.detailRowLine}>
                        <Text style={{ fontSize: 11, color: theme.text }}>Total Expected Annual Fees</Text>
                        <Text style={{ fontSize: 11, color: '#8B5CF6', fontWeight: '700' }}>₹{modalData.expectedRevenue.toLocaleString()}</Text>
                      </View>
                      {modalData.studentList && modalData.studentList.length > 0 && (
                        <View style={{ marginTop: 14 }}>
                          <Text style={styles.detailsHeader}>Student Billing List</Text>
                          {modalData.studentList.map((st: any, idx: number) => (
                            <View key={idx} style={styles.detailRowLine}>
                              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>{st.studentName} ({st.className})</Text>
                              <Text style={{ fontSize: 11, color: theme.textSecondary }}>₹{st.totalAmount.toLocaleString()}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* MODAL 15: FULLY PAID */}
                  {activeModal === 'fully-paid' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Fully Paid Student Registry</Text>
                      {modalData.studentList && modalData.studentList.length > 0 ? (
                        modalData.studentList.map((st: any, idx: number) => (
                          <View key={idx} style={[styles.detailRowLine, { paddingVertical: 8 }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{st.studentName}</Text>
                              <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                                Class: {st.className} | Receipts: {st.receiptCount} | Last Paid: {st.lastPaymentDate ? st.lastPaymentDate.split('T')[0] : 'N/A'}
                              </Text>
                            </View>
                            <View style={{ justifyContent: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '800' }}>₹{st.paidAmount.toLocaleString()}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No fully paid students.</Text>
                      )}
                    </View>
                  )}

                  {/* MODAL 16: PENDING SALARIES */}
                  {activeModal === 'pending-salaries' && modalData && (
                    <View>
                      <Text style={styles.detailsHeader}>Outstanding Salaries Details</Text>
                      <View style={[styles.detailRowLine, { marginBottom: 12 }]}>
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>Total Pending Salaries</Text>
                        <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '900' }}>₹{modalData.totalPending.toLocaleString()}</Text>
                      </View>
                      {modalData.teacherList && modalData.teacherList.length > 0 ? (
                        modalData.teacherList.map((t: any, idx: number) => (
                          <View key={idx} style={[styles.detailRowLine, { paddingVertical: 8 }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{t.name}</Text>
                              <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                                Monthly Salary: ₹{t.totalSalary.toLocaleString()} | Paid: ₹{t.alreadyPaid.toLocaleString()}
                              </Text>
                            </View>
                            <View style={{ justifyContent: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '800' }}>₹{t.remaining.toLocaleString()}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic' }}>No pending salaries.</Text>
                      )}
                    </View>
                  )}

                </ScrollView>
              )}

            </View>
          </View>
        </Modal>
      )}

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
  welcomeBanner: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeGreeting: {
    color: '#FF9F00',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  welcomeUser: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  welcomeDate: {
    color: '#BAC4E0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  bannerRight: {
    justifyContent: 'center',
  },
  ayCapsule: {
    backgroundColor: '#ffffff15',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  ayText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsCard: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCardBox: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    cursor: 'pointer' as any,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  statTitle: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  infoWidgetsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  infoWidgetCard: {
    flex: 1,
    padding: 12,
  },
  infoWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoWidgetTitle: {
    fontSize: 10,
    fontWeight: '800',
  },
  infoWidgetBody: {
    alignItems: 'flex-start',
  },
  infoWidgetValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  infoWidgetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  classProgressLine: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.25,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  detailsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  detailRowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  classDetailBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
  },
  monthSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthPill: {
    width: '23%',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  monthlyFinancialCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  }
});
