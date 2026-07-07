import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, CreditCard, CheckCircle2, ChevronRight, FileText, Download } from 'lucide-react-native';
import { SubScreenChildSwitcher } from '../../components/SubScreenChildSwitcher';
import api from '../../services/api';

interface ParentFeesScreenProps {
  onBack: () => void;
  onSelectChild?: (childId: string) => void;
}

export const ParentFeesScreen: React.FC<ParentFeesScreenProps> = ({ onBack, onSelectChild }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { parentData, studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [submitting, setSubmitting] = useState(false);

  const isStudent = user?.role === 'student';
  const activeFees = isStudent ? studentData?.fees : parentData?.fees;
  const activeChild = isStudent ? studentData : (parentData?.dashboard?.children?.find((c: any) => c._id === parentData.selectedChildId) || parentData?.dashboard?.children?.[0]);

  const feeData = activeFees ? {
    totalFees: activeFees.totalAmount || 0,
    paidAmount: activeFees.paidAmount || 0,
    balanceAmount: activeFees.balanceAmount || 0,
    installments: activeFees.installments || [],
    receipts: (activeFees.payments || []).map((p: any) => ({
      receiptNumber: p.receiptNumber,
      amount: p.amount,
      paidDate: p.date || new Date(),
      category: p.category
    }))
  } : {
    totalFees: 0,
    paidAmount: 0,
    balanceAmount: 0,
    installments: [],
    receipts: []
  };

  const handlePayInstallment = async (instId: string, name: string, outstanding: number) => {
    if (!activeChild) return;
    setSubmitting(true);
    try {
      const payload = {
        studentId: activeChild._id,
        installmentId: instId,
        paymentMethod: 'UPI',
        transactionId: `TXN-UPI-${Date.now().toString().slice(-6)}`,
        remarks: `Paid ${name} via UPI ${isStudent ? 'Student' : 'Parent'} Portal`
      };

      await api.post('/admin/fees/collect', payload);
      alert(`Payment of ₹${outstanding} for ${name} completed successfully!`);
      
      // Reload dashboard data
      if (!isStudent && onSelectChild) {
        onSelectChild(activeChild._id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingInstallment = feeData.installments.find((inst: any) => inst.status !== 'Paid');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Fee Account</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Invoices & receipt transactions</Text>
        </View>
        <CreditCard size={20} color={colors.primary} />
      </View>

      {!isStudent && onSelectChild && parentData?.dashboard?.children && (
        <SubScreenChildSwitcher
          children={parentData.dashboard.children}
          selectedChildId={parentData.selectedChildId}
          onSelectChild={onSelectChild}
          theme={theme}
        />
      )}

      {/* ================= SUMMARY STATS CARD ================= */}
      <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <View style={styles.summaryRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL FEE</Text>
            <Text style={[styles.statVal, { color: theme.text }]}>₹{feeData.totalFees.toLocaleString()}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.success }]}>PAID AMOUNT</Text>
            <Text style={[styles.statVal, { color: colors.success }]}>
              ₹{feeData.paidAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>OUTSTANDING</Text>
            <Text style={[styles.statVal, { color: colors.secondary }]}>
              ₹{feeData.balanceAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>STATUS</Text>
            <View style={[styles.statusTag, { backgroundColor: feeData.balanceAmount === 0 ? colors.success + '15' : colors.warning + '15' }]}>
              <Text style={[styles.statusTagText, { color: feeData.balanceAmount === 0 ? colors.success : colors.warning }]}>
                {feeData.balanceAmount === 0 ? 'FULLY PAID' : 'PENDING'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= PREMIUM ORANGE NEXT DUE CARD ================= */}
      {upcomingInstallment && (
        <View style={[styles.dueCard, { shadowColor: colors.secondary }]}>
          <View style={styles.dueOverlay}>
            <View style={styles.dueTop}>
              <Text style={styles.dueLabel}>NEXT INSTALLMENT: {upcomingInstallment.name}</Text>
              <Text style={styles.dueAmount}>₹{(upcomingInstallment.amount - (upcomingInstallment.discount || 0) + (upcomingInstallment.lateFee || 0)).toLocaleString()}</Text>
              <Text style={styles.dueDate}>Due Date: {new Date(upcomingInstallment.dueDate).toLocaleDateString('en-GB')}</Text>
            </View>

            <Pressable 
              onPress={() => handlePayInstallment(upcomingInstallment._id, upcomingInstallment.name, (upcomingInstallment.amount - (upcomingInstallment.discount || 0) + (upcomingInstallment.lateFee || 0)))} 
              style={styles.payBtn}
              disabled={submitting}
            >
              <Text style={styles.payBtnText}>{submitting ? 'Processing...' : 'Pay Now via UPI'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ================= FEE CATEGORY LEDGER ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Fee Category Ledger</Text>
      <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow, padding: 16 }]}>
        {activeFees && activeFees.breakdown ? (
          Object.entries(activeFees.breakdown).map(([cat, item]: [string, any]) => {
            const total = item.total || 0;
            const paid = item.paid || 0;
            const bal = Math.max(0, total - paid);
            const status = item.status || (paid >= total - 0.01 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid'));
            let label = cat.charAt(0).toUpperCase() + cat.slice(1);
            if (label === 'Exam') label = 'Examination';
            
            return (
              <View key={cat} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text }}>{label} Fee</Text>
                  <View style={[{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4
                  }, status === 'Paid' ? { backgroundColor: '#D1FAE5' } : status === 'Partially Paid' ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[{ fontSize: 8, fontWeight: 'bold' }, status === 'Paid' ? { color: '#065F46' } : status === 'Partially Paid' ? { color: '#D97706' } : { color: '#B91C1C' }]}>
                      {status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                  Expected: ₹{total.toLocaleString()} | Paid: ₹{paid.toLocaleString()} | Remaining: ₹{bal.toLocaleString()}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={{ textAlign: 'center', color: theme.textSecondary }}>No fee breakdown available.</Text>
        )}
      </View>

      {/* ================= INSTALLMENTS TIMELINE ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Fee Installments Plan</Text>
      <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {feeData.installments.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20, color: theme.textSecondary }}>No installment plan configured for this class.</Text>
        ) : (
          feeData.installments.map((inst: any, index: number) => {
            const isPaid = inst.status === 'Paid';
            const cost = inst.amount - (inst.discount || 0) + (inst.lateFee || 0);
            const remaining = Math.max(0, cost - (inst.paidAmount || 0));
            const pct = Math.round(((inst.paidAmount || 0) / (cost || 1)) * 100);
            return (
              <View key={inst._id || index} style={[styles.timelineNode, index === feeData.installments.length - 1 && styles.noBorder, { flexDirection: 'column', alignItems: 'stretch', paddingVertical: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.nodeIconCircle, { backgroundColor: isPaid ? colors.success + '15' : colors.warning + '15', marginRight: 10 }]}>
                      <CheckCircle2 size={16} color={isPaid ? colors.success : colors.warning} />
                    </View>
                    <View>
                      <Text style={[styles.nodeTitle, { color: theme.text, fontWeight: 'bold' }]}>{inst.name}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                        Due: {new Date(inst.dueDate).toLocaleDateString('en-GB')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>₹{cost.toLocaleString()}</Text>
                    <Text style={[{ fontSize: 9, fontWeight: 'bold' }, isPaid ? { color: colors.success } : { color: colors.warning }]}>
                      {inst.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Sub-item Details & Progress Bar */}
                <View style={{ marginTop: 8, paddingLeft: 34 }}>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                    Paid: ₹{(inst.paidAmount || 0).toLocaleString()} | Remaining: ₹{remaining.toLocaleString()}
                  </Text>
                  <View style={{ height: 6, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginTop: 4, marginBottom: 2 }}>
                    <View style={{ height: '100%', backgroundColor: isPaid ? '#10B981' : '#F59E0B', width: (pct + '%') as any }} />
                  </View>
                  <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: 'bold', marginBottom: 4 }}>
                    {pct}% Completed
                  </Text>
                  {inst.breakdown && (
                    <View style={{ marginTop: 4, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.primary + '30', marginVertical: 4 }}>
                      {Object.entries(inst.breakdown).map(([cat, total]: [string, any]) => {
                        if (!total || total <= 0) return null;
                        const paid = (inst.breakdownPaid && inst.breakdownPaid[cat]) || 0;
                        const rem = Math.max(0, total - paid);
                        const catPct = Math.round((paid / total) * 100);
                        let label = cat.charAt(0).toUpperCase() + cat.slice(1);
                        if (label === 'Exam') label = 'Examination';
                        return (
                          <Text key={cat} style={{ fontSize: 9, color: theme.textSecondary, marginVertical: 1 }}>
                            • {label}: expected ₹{total.toLocaleString()} | paid ₹{paid.toLocaleString()} | rem ₹{rem.toLocaleString()} ({catPct}%)
                          </Text>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ================= RECEIPT HISTORY ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Receipt Archive</Text>
      <View style={[styles.receiptsContainer, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {feeData.receipts.length === 0 ? (
          <Text style={{ textAlign: 'center', padding: 20, color: theme.textSecondary }}>No payment records found.</Text>
        ) : (
          feeData.receipts.map((rec: any, index: number) => (
            <View key={index} style={[styles.receiptItem, index === feeData.receipts.length - 1 && styles.noBorder]}>
              <View style={[styles.receiptIconCircle, { backgroundColor: colors.primary + '15' }]}>
                <FileText size={18} color={colors.primary} />
              </View>
              <View style={styles.receiptDetails}>
                <Text style={[styles.receiptTitle, { color: theme.text }]}>Receipt {rec.receiptNumber}</Text>
                <Text style={[styles.receiptMeta, { color: theme.textSecondary }]}>
                  Paid on: {new Date(rec.paidDate).toLocaleDateString('en-GB')} · ₹{rec.amount.toLocaleString()} ({rec.category})
                </Text>
              </View>
              <Pressable 
                onPress={() => {
                  const url = `${api.defaults.baseURL}/parent/child/${activeChild._id}/fees/receipt/${rec.receiptNumber}/download`;
                  Linking.openURL(url).catch(() => alert('Failed to open receipt download link. Make sure you are logged in.'));
                }}
                style={styles.downloadIconBtn}
              >
                <Download size={16} color={colors.primary} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
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
  subScreenTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subScreenSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  statusTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
  dueCard: {
    height: 150,
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 18,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    ...({
      backgroundImage: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    } as any),
    backgroundColor: '#F97316',
  },
  dueOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  dueTop: {
    justifyContent: 'center',
  },
  dueLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dueAmount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  dueDate: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  payBtn: {
    backgroundColor: '#FFFFFF',
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payBtnText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  timelineCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  nodeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nodeDetails: {
    flex: 1,
    paddingRight: 4,
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  nodeRight: {
    alignItems: 'flex-end',
  },
  nodeAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeStatusLabel: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  receiptsContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  receiptIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  receiptDetails: {
    flex: 1,
    paddingRight: 4,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  receiptMeta: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  downloadIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
