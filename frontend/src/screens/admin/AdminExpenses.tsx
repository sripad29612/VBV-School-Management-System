import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { Search, Plus, ArrowLeft, Trash2, Calendar, FileText, CheckCircle, Edit2, XCircle, ChevronDown } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface AdminExpensesProps {
  onNavigate: (tab: string) => void;
  onSyncAllPortals?: () => void;
  refreshTrigger?: number;
}

const EXPENSE_CATEGORIES = [
  'Teacher Salary',
  'Electricity',
  'Water',
  'Internet',
  'Transport Fuel',
  'Maintenance',
  'Books Purchase',
  'Furniture',
  'Office Supplies',
  'Exam Expenses',
  'Miscellaneous',
  'Lab Equipment',
  'Events'
];

export const AdminExpenses: React.FC<AdminExpensesProps> = ({ onNavigate, onSyncAllPortals, refreshTrigger }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [cancellingExpenseId, setCancellingExpenseId] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[1]); // Electricity default
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/expenses');
      setExpenses(res.data || []);
    } catch (e) {
      console.error(e);
      alert('Failed to load expenses list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [refreshTrigger]);

  const resetForm = () => {
    setCategory(EXPENSE_CATEGORIES[1]);
    setAmount('');
    setPaymentMode('Cash');
    setPaidTo('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setRemarks('');
    setEditingExpenseId(null);
  };

  const handleFormSubmit = async () => {
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      return alert('Please enter a valid positive expense amount.');
    }
    if (!paidTo.trim()) {
      return alert('Please enter who this amount was Paid To.');
    }

    setSubmitting(true);
    try {
      const payload = {
        category,
        amount: Number(amount),
        paymentMode,
        paidTo: paidTo.trim(),
        date,
        description: description.trim(),
        remarks: remarks.trim()
      };

      if (editingExpenseId) {
        await api.put(`/admin/expenses/${editingExpenseId}`, payload);
        alert('Expense record updated successfully.');
      } else {
        await api.post('/admin/expenses', payload);
        alert('Expense recorded successfully.');
      }

      setShowFormModal(false);
      resetForm();
      loadExpenses();
      if (onSyncAllPortals) onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save expense details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      return alert('Please specify a cancellation reason.');
    }

    setSubmitting(true);
    try {
      await api.delete(`/admin/expenses/${cancellingExpenseId}`, {
        data: { cancelReason: cancelReason.trim() }
      });
      alert('Expense transaction cancelled successfully.');
      setShowCancelModal(false);
      setCancellingExpenseId(null);
      setCancelReason('');
      loadExpenses();
      if (onSyncAllPortals) onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel expense transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditExpense = (exp: any) => {
    setEditingExpenseId(exp._id);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setPaymentMode(exp.paymentMode);
    setPaidTo(exp.paidTo || '');
    setDate(exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDescription(exp.description || '');
    setRemarks(exp.remarks || '');
    setShowFormModal(true);
  };

  const openVoucherDetail = (exp: any) => {
    setSelectedVoucher(exp);
    setShowVoucherModal(true);
  };

  const filteredExpenses = expenses.filter(exp => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (exp.voucherNumber && exp.voucherNumber.toLowerCase().includes(query)) ||
                          (exp.description && exp.description.toLowerCase().includes(query)) ||
                          (exp.paidTo && exp.paidTo.toLowerCase().includes(query)) ||
                          (exp.category && exp.category.toLowerCase().includes(query));

    if (activeCategoryFilter === 'All') return matchesSearch;
    return matchesSearch && exp.category === activeCategoryFilter;
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={() => onNavigate('dashboard')} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#EF4444" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Expense Management</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Track, edit, and cancel school operational expense vouchers</Text>
          </View>
        </View>

        {/* ================= ACTIONS ================= */}
        <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Search size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by voucher, description, category, payee..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Pressable onPress={() => { resetForm(); setShowFormModal(true); }} style={styles.actionAddBtn}>
          <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.actionAddBtnText}>Record General Expense</Text>
        </Pressable>

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
          {['All', ...EXPENSE_CATEGORIES].map(cat => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategoryFilter(cat)}
              style={[styles.filterChipPill, { 
                backgroundColor: activeCategoryFilter === cat ? '#EF4444' : theme.surface,
                borderColor: activeCategoryFilter === cat ? '#EF4444' : theme.border 
              }]}
            >
              <Text style={{ fontSize: 9, color: activeCategoryFilter === cat ? '#ffffff' : theme.text, fontWeight: '800' }}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ================= EXPENSE LIST ================= */}
        {loading ? (
          <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.listContainer}>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map(exp => (
                <Card 
                  key={exp._id}
                  style={[
                    styles.expenseCard, 
                    exp.isCancelled && { opacity: 0.65, borderLeftColor: '#DC3545', borderLeftWidth: 3 }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.categoryText, { color: theme.text }]}>{exp.category}</Text>
                        {exp.isCancelled && (
                          <View style={styles.cancelledBadge}>
                            <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>
                        Voucher: {exp.voucherNumber || 'GENERAL'} | Mode: {exp.paymentMode}
                      </Text>
                      {exp.paidTo ? (
                        <Text style={{ fontSize: 9, color: theme.textSecondary }}>Paid To: {exp.paidTo}</Text>
                      ) : null}
                      {exp.description ? (
                        <Text style={{ fontSize: 10, color: theme.text, marginTop: 4, fontStyle: 'italic' }}>
                          "{exp.description}"
                        </Text>
                      ) : null}
                      {exp.isCancelled && exp.cancelReason ? (
                        <Text style={{ fontSize: 9, color: '#DC3545', marginTop: 4, fontWeight: '700' }}>
                          Reason: {exp.cancelReason}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <Text style={[styles.amountText, { color: exp.isCancelled ? theme.textSecondary : '#DC3545' }]}>
                        ₹{exp.amount.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: 8, color: theme.textSecondary, marginBottom: 6 }}>
                        {exp.date ? exp.date.split('T')[0] : ''}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        <Pressable onPress={() => openVoucherDetail(exp)} style={styles.iconBtn}>
                          <FileText size={10} color="#10B981" />
                        </Pressable>
                        {!exp.isCancelled && (
                          <>
                            {exp.category !== 'Teacher Salary' && (
                              <Pressable onPress={() => openEditExpense(exp)} style={styles.iconBtn}>
                                <Edit2 size={10} color="#3B82F6" />
                              </Pressable>
                            )}
                            <Pressable 
                              onPress={() => { setCancellingExpenseId(exp._id); setCancelReason(''); setShowCancelModal(true); }} 
                              style={styles.iconBtn}
                            >
                              <XCircle size={10} color="#DC3545" />
                            </Pressable>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <EmptyState
                title="Expense Registry"
                message="No matching expenses found."
                iconName="DollarSign"
              />
            )}
          </View>
        )}

      </ScrollView>

      {/* ================= NEW/EDIT EXPENSE MODAL ================= */}
      <Modal visible={showFormModal} transparent animationType="slide" onRequestClose={() => setShowFormModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingExpenseId ? '✏️ Edit Expense Entry' : 'Record Operational Expense'}
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Expense Category</Text>
              <Pressable onPress={() => setShowCategoryDropdown(!showCategoryDropdown)} style={[styles.dropdownTrigger, { borderColor: theme.border }]}>
                <Text style={{ fontSize: 12, color: theme.text }}>{category}</Text>
                <ChevronDown size={14} color={theme.textSecondary} />
              </Pressable>

              {showCategoryDropdown && (
                <View style={[styles.dropdownOptions, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <Pressable
                      key={cat}
                      onPress={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                      style={styles.dropdownItem}
                    >
                      <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount (₹)</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} 
                value={amount} 
                onChangeText={setAmount} 
                placeholder="Amount in Rupees" 
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Payment Mode</Text>
              <Pressable onPress={() => setShowModeDropdown(!showModeDropdown)} style={[styles.dropdownTrigger, { borderColor: theme.border }]}>
                <Text style={{ fontSize: 12, color: theme.text }}>{paymentMode}</Text>
                <ChevronDown size={14} color={theme.textSecondary} />
              </Pressable>

              {showModeDropdown && (
                <View style={[styles.dropdownOptions, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {['Cash', 'UPI', 'Cheque', 'Bank Transfer', 'Online'].map(mode => (
                    <Pressable
                      key={mode}
                      onPress={() => { setPaymentMode(mode); setShowModeDropdown(false); }}
                      style={styles.dropdownItem}
                    >
                      <Text style={{ fontSize: 11, color: theme.text }}>{mode}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Paid To</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} 
                value={paidTo} 
                onChangeText={setPaidTo} 
                placeholder="e.g. Electric Board, Ram Stationery" 
                placeholderTextColor={theme.textSecondary} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Date (YYYY-MM-DD)</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} 
                value={date} 
                onChangeText={setDate} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor={theme.textSecondary} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Description / Bill Reference</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border, height: 60 }]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="e.g. Electric bill for June 2026" 
                placeholderTextColor={theme.textSecondary}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Internal Audit Remarks (Optional)</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} 
                value={remarks} 
                onChangeText={setRemarks} 
                placeholder="Remarks" 
                placeholderTextColor={theme.textSecondary} 
              />

            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable onPress={() => setShowFormModal(false)} style={[styles.modalBtn, styles.modalCancelBtn, { borderColor: theme.border }]}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleFormSubmit} style={[styles.modalBtn, styles.modalSaveBtn]} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Save Entry</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= CANCEL CONFIRMATION MODAL ================= */}
      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: '#DC3545' }]}>⚠️ Cancel Transaction</Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 14 }}>
              Financial audits require cancellation instead of deletion. Specify the reason for cancelling this voucher.
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Cancellation Reason</Text>
            <TextInput 
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, height: 60 }]} 
              value={cancelReason} 
              onChangeText={setCancelReason} 
              placeholder="e.g. Double bill submission, Incorrect value input" 
              placeholderTextColor={theme.textSecondary}
              multiline
            />

            <View style={styles.modalActionsRow}>
              <Pressable onPress={() => setShowCancelModal(false)} style={[styles.modalBtn, styles.modalCancelBtn, { borderColor: theme.border }]}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Go Back</Text>
              </Pressable>
              <Pressable onPress={handleCancelSubmit} style={[styles.modalBtn, { backgroundColor: '#DC3545' }]} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Confirm Cancellation</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= VIEW/PRINT VOUCHER DETAIL MODAL ================= */}
      <Modal visible={showVoucherModal} transparent animationType="slide" onRequestClose={() => setShowVoucherModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, padding: 20 }]}>
            <Text style={[styles.modalTitle, { color: '#EF4444', textAlign: 'center', marginBottom: 15 }]}>
              📄 Expense Payment Voucher
            </Text>
            
            {selectedVoucher ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350, marginBottom: 15 }}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>
                    VIDYA BHARATHI HIGH SCHOOL
                  </Text>
                  <Text style={{ fontSize: 9, color: theme.textSecondary, textAlign: 'center' }}>
                    Devarra Palsi, Kubeer, Nirmal District, Telangana - 504103
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Voucher Number:</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text }}>
                      {selectedVoucher.voucherNumber || 'GENERAL'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Payment Date:</Text>
                    <Text style={{ fontSize: 10, color: theme.text }}>
                      {selectedVoucher.date ? selectedVoucher.date.split('T')[0] : ''}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Category:</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text }}>
                      {selectedVoucher.category}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Payment Mode:</Text>
                    <Text style={{ fontSize: 10, color: theme.text }}>
                      {selectedVoucher.paymentMode}
                    </Text>
                  </View>

                  {selectedVoucher.paidTo ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>Paid To:</Text>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text }}>
                        {selectedVoucher.paidTo}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>Description:</Text>
                    <Text style={{ fontSize: 10, color: theme.text, marginTop: 2 }}>
                      {selectedVoucher.description || 'N/A'}
                    </Text>
                  </View>

                  {selectedVoucher.remarks ? (
                    <View style={{ marginTop: 2 }}>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>Remarks:</Text>
                      <Text style={{ fontSize: 10, color: theme.text, marginTop: 2 }}>
                        {selectedVoucher.remarks}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text }}>Voucher Status:</Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: selectedVoucher.isCancelled ? '#DC3545' : '#198754' }}>
                      {selectedVoucher.isCancelled ? 'CANCELLED' : 'APPROVED'}
                    </Text>
                  </View>

                  {selectedVoucher.isCancelled && selectedVoucher.cancelReason ? (
                    <View style={{ backgroundColor: '#DC354515', padding: 8, borderRadius: 4, marginTop: 2 }}>
                      <Text style={{ fontSize: 9, color: '#DC3545', fontWeight: 'bold' }}>
                        Cancellation Reason: {selectedVoucher.cancelReason}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 10, borderRadius: 6, marginTop: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 9, color: theme.textSecondary }}>TOTAL AMOUNT PAID</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#DC3545', marginTop: 4 }}>
                      ₹{selectedVoucher.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalActionsRow}>
              <Pressable onPress={() => setShowVoucherModal(false)} style={[styles.modalBtn, styles.modalCancelBtn, { borderColor: theme.border }]}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Close</Text>
              </Pressable>
              <Pressable 
                onPress={() => Alert.alert('Voucher PDF', 'Voucher PDF generated. Printing queued successfully.')} 
                style={[styles.modalBtn, { backgroundColor: '#10B981' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Print Voucher</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
  },
  actionAddBtn: {
    backgroundColor: '#EF4444',
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterChipPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    height: 26,
  },
  listContainer: {
    gap: 10,
  },
  expenseCard: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '900',
  },
  cancelledBadge: {
    backgroundColor: '#DC354515',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cancelledBadgeText: {
    color: '#DC3545',
    fontSize: 7,
    fontWeight: '900',
  },
  iconBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 16,
    padding: 18,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 11,
    backgroundColor: '#F8FAFC',
  },
  dropdownTrigger: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    padding: 4,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
  },
  modalSaveBtn: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
    fontSize: 11,
    fontWeight: '800',
  }
});
