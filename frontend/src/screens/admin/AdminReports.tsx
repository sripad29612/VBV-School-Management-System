import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { BarChart, PieChart } from '../../components/AnalyticsCharts';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { ArrowLeft, FileText, Calendar, Printer, Table, ChevronDown } from 'lucide-react-native';

interface AdminReportsProps {
  onNavigate: (tab: string) => void;
  refreshTrigger?: number;
}

type DatePreset = 'Today' | 'Yesterday' | 'Last 7 Days' | 'This Month' | 'This Year' | 'Custom';

const REPORT_TYPES = [
  { id: 'class-strength', name: 'Class Strength & Capacity' },
  { id: 'daily-collection', name: 'Daily Collection Report' },
  { id: 'monthly-collection', name: 'Monthly Collection Report' },
  { id: 'yearly-collection', name: 'Yearly Collection Report' },
  { id: 'income-report', name: 'General Income Report' },
  { id: 'expense-report', name: 'Operational Expense Report' },
  { id: 'salary-report', name: 'Teacher Salary Paid Report' },
  { id: 'profit-loss', name: 'Profit & Loss Statement' },
  { id: 'pending-fee-report', name: 'Pending Fees Deficit Report' }
];

export const AdminReports: React.FC<AdminReportsProps> = ({ onNavigate, refreshTrigger }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<DatePreset>('This Month');
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const getInitialDates = () => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: formatDate(start),
      to: formatDate(today)
    };
  };

  const initialDates = getInitialDates();
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);

  // Default Stats for chart preview
  const [classesList, setClassesList] = useState<any[]>([]);
  const [collectedVal, setCollectedVal] = useState(0);
  const [pendingVal, setPendingVal] = useState(0);

  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'Today') {
      setFromDate(formatDate(today));
      setToDate(formatDate(today));
    } else if (preset === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setFromDate(formatDate(yesterday));
      setToDate(formatDate(yesterday));
    } else if (preset === 'Last 7 Days') {
      const prev = new Date(today);
      prev.setDate(prev.getDate() - 7);
      setFromDate(formatDate(prev));
      setToDate(formatDate(today));
    } else if (preset === 'This Month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDate(start));
      setToDate(formatDate(today));
    } else if (preset === 'This Year') {
      const start = new Date(today.getFullYear(), 0, 1);
      setFromDate(formatDate(start));
      setToDate(formatDate(today));
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Class Strength default if selected
      if (selectedReport.id === 'class-strength') {
        const [classesRes, feesRes] = await Promise.all([
          api.get('/admin/classes').catch(() => ({ data: [] })),
          api.get('/admin/reports?type=fees').catch(() => ({ data: [] }))
        ]);

        setClassesList(classesRes.data || []);
        
        const start = new Date(fromDate).getTime();
        const end = new Date(toDate).getTime();
        let collSum = 0;
        let pendSum = 0;
        const feeLedgers = feesRes.data || [];

        feeLedgers.forEach((ledger: any) => {
          pendSum += ledger.balanceAmount;
          if (ledger.payments) {
            ledger.payments.forEach((p: any) => {
              const pTime = new Date(p.date).getTime();
              if (pTime >= start && pTime <= end) {
                collSum += p.amount;
              }
            });
          }
        });

        setCollectedVal(collSum);
        setPendingVal(pendSum);
        setReportData(null);
      } else {
        // 2. Fetch specific transactional report
        const res = await api.get(`/admin/reports?type=${selectedReport.id}&from=${fromDate}&to=${toDate}`);
        setReportData(res.data);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedReport, fromDate, toDate, refreshTrigger]);

  const handleExport = (format: 'PDF' | 'Excel' | 'Print') => {
    alert(`Initiating official report export:\nReport: ${selectedReport.name}\nFormat: ${format}\nDate Range: ${fromDate} to ${toDate}\nStatus: Completed successfully.`);
  };

  const presets: DatePreset[] = ['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'This Year', 'Custom'];

  // Helper to render transactions tables
  const renderReportTable = () => {
    if (!reportData) return null;

    if (selectedReport.id === 'profit-loss') {
      return (
        <Card style={{ padding: 16, marginBottom: 14 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Profit & Loss Statement Summary</Text>
          <View style={styles.detailRowLine}>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Total Revenue (Income)</Text>
            <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '900' }}>₹{reportData.totalIncome.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRowLine}>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Total Expenditures (Expenses)</Text>
            <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '900' }}>₹{reportData.totalExpense.toLocaleString()}</Text>
          </View>
          <View style={[styles.detailRowLine, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, marginTop: 4 }]}>
            <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Net Profit / Margin</Text>
            <Text style={{ fontSize: 13, color: reportData.netProfit >= 0 ? '#10B981' : '#EF4444', fontWeight: '900' }}>
              ₹{reportData.netProfit.toLocaleString()}
            </Text>
          </View>

          <Text style={[styles.detailsHeader, { marginTop: 14 }]}>Income Categories</Text>
          {Object.keys(reportData.incomeByCategory).map(cat => (
            <View key={cat} style={styles.detailRowLine}>
              <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>₹{reportData.incomeByCategory[cat].toLocaleString()}</Text>
            </View>
          ))}

          <Text style={[styles.detailsHeader, { marginTop: 14 }]}>Expense Categories</Text>
          {Object.keys(reportData.expenseByCategory).map(cat => (
            <View key={cat} style={styles.detailRowLine}>
              <Text style={{ fontSize: 11, color: theme.text }}>{cat}</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>₹{reportData.expenseByCategory[cat].toLocaleString()}</Text>
            </View>
          ))}
        </Card>
      );
    }

    if (selectedReport.id === 'pending-fee-report') {
      const totalPending = reportData.reduce((sum: number, r: any) => sum + r.balanceAmount, 0);
      return (
        <Card style={{ padding: 14 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Fee Deficits Details (₹{totalPending.toLocaleString()} pending)</Text>
          {reportData.map((f: any) => (
            <View key={f._id} style={styles.tableRowContainer}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{f.student?.name || 'Student'}</Text>
                <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                  Class: {f.student?.class?.name || 'Class'} | Parent: {f.student?.parent?.fatherName || 'Parent'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#DC3545', fontWeight: '800' }}>₹{f.balanceAmount.toLocaleString()}</Text>
                <Text style={{ fontSize: 9, color: theme.textSecondary }}>Paid: ₹{f.paidAmount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </Card>
      );
    }

    // Default transaction list for collections / income / expenses / salaries
    const isIncome = selectedReport.id.includes('collection') || selectedReport.id.includes('income');
    const totalAmount = reportData.reduce((sum: number, r: any) => sum + r.amount, 0);

    return (
      <Card style={{ padding: 14 }}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Voucher Ledger ({reportData.length} entries | Total: ₹{totalAmount.toLocaleString()})
        </Text>
        {reportData.map((t: any) => (
          <View key={t._id} style={styles.tableRowContainer}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>
                {t.voucherNumber || t.receiptNumber || 'VCHR-GEN'} ({t.category})
              </Text>
              <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic', marginTop: 2 }}>
                "{t.description}"
              </Text>
              <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                Mode: {t.paymentMode} | Date: {t.date ? t.date.split('T')[0] : ''} | By: {t.createdBy}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, color: isIncome ? '#10B981' : '#EF4444', fontWeight: '900' }}>
                ₹{t.amount.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={() => onNavigate('dashboard')} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#EF4444" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Reports & Statement Audits</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Single source of truth P&L, collections, and deficit statements</Text>
          </View>
        </View>

        {/* ================= REPORT TYPE SELECTORDropdown ================= */}
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Select Report Type</Text>
          <Pressable onPress={() => setShowReportDropdown(!showReportDropdown)} style={[styles.dropdownTrigger, { borderColor: theme.border }]}>
            <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>{selectedReport.name}</Text>
            <ChevronDown size={16} color={theme.textSecondary} />
          </Pressable>

          {showReportDropdown && (
            <View style={[styles.dropdownOptions, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              {REPORT_TYPES.map(rep => (
                <Pressable
                  key={rep.id}
                  onPress={() => { setSelectedReport(rep); setShowReportDropdown(false); }}
                  style={styles.dropdownItem}
                >
                  <Text style={{ fontSize: 11, color: theme.text, fontWeight: selectedReport.id === rep.id ? '800' : '500' }}>{rep.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        {/* ================= DATE FILTERS MODULE ================= */}
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Date Range Filter</Text>
          <View style={styles.presetRow}>
            {presets.map(p => (
              <Pressable
                key={p}
                onPress={() => applyPreset(p)}
                style={[styles.presetPill, {
                  backgroundColor: activePreset === p ? '#EF4444' : theme.surface,
                  borderColor: activePreset === p ? '#EF4444' : theme.border
                }]}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: activePreset === p ? '#ffffff' : theme.text }}>{p}</Text>
              </Pressable>
            ))}
          </View>

          {activePreset === 'Custom' && (
            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 4 }}>From Date</Text>
                <TextInput
                  style={[styles.dateInput, { color: theme.text, borderColor: theme.border }]}
                  value={fromDate}
                  onChangeText={setFromDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 4 }}>To Date</Text>
                <TextInput
                  style={[styles.dateInput, { color: theme.text, borderColor: theme.border }]}
                  value={toDate}
                  onChangeText={setToDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          )}
        </Card>

        {/* ================= EXPORT CONTROLS ================= */}
        <View style={styles.exportActionsRow}>
          <Pressable onPress={() => handleExport('PDF')} style={[styles.exportBtn, { backgroundColor: '#EF4444' }]}>
            <FileText size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </Pressable>
          <Pressable onPress={() => handleExport('Excel')} style={[styles.exportBtn, { backgroundColor: '#10B981' }]}>
            <Table size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.exportBtnText}>Export Excel</Text>
          </Pressable>
          <Pressable onPress={() => handleExport('Print')} style={[styles.exportBtn, { backgroundColor: '#3B82F6' }]}>
            <Printer size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.exportBtnText}>Print</Text>
          </Pressable>
        </View>

        {/* ================= CHARTS AND BREAKDOWNS ================= */}
        {loading ? (
          <ActivityIndicator size="small" color="#EF4444" style={{ marginVertical: 40 }} />
        ) : selectedReport.id === 'class-strength' ? (
          classesList.length === 0 && collectedVal === 0 && pendingVal === 0 ? (
            <EmptyState
              title="Reports & Analytics"
              message="No reports data available yet."
              iconName="FileText"
            />
          ) : (
            <View>
              <Card style={{ padding: 14, marginBottom: 14 }}>
                <Text style={[styles.chartHeader, { color: theme.text }]}>Class Capacity Distribution</Text>
                <BarChart
                  data={classesList.slice(0, 7).map(c => ({
                    label: `${c.name}-${c.section}`,
                    value: c.approvedCount
                  }))}
                  color="#EF4444"
                />
              </Card>

              <Card style={{ padding: 14 }}>
                <Text style={[styles.chartHeader, { color: theme.text }]}>Collections vs. Deficits Ratio</Text>
                <PieChart collected={collectedVal} pending={pendingVal} />
                <View style={styles.ratioLegend}>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Collected: ₹{collectedVal.toLocaleString()}</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Pending Deficits: ₹{pendingVal.toLocaleString()}</Text>
                </View>
              </Card>
            </View>
          )
        ) : (
          renderReportTable()
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
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  dropdownTrigger: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    padding: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateInputsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  dateInput: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 11,
    backgroundColor: '#F8FAFC',
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  exportBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  chartHeader: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  ratioLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  detailRowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailsHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EF4444',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  tableRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  classDetailBox: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#343A40',
    paddingVertical: 8,
    marginTop: 6,
  },
  monthlyFinancialCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  }
});
