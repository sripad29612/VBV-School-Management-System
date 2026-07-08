import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Image, Alert, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { 
  ArrowLeft, Copy, DollarSign, Receipt, FileText, CheckCircle2, 
  TrendingUp, AlertTriangle, Phone, Send, Mail, Printer, Trash2, Edit2
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import { cleanNumberInput } from '../../services/validation';

interface AdminFeesProps {
  onNavigate: (tab: string) => void;
  onSyncAllPortals: () => void;
  initialStudentId?: string | null;
  clearInitialStudentId?: () => void;
  openReceiptOnLoad?: boolean;
  clearOpenReceiptOnLoad?: () => void;
  refreshTrigger?: number;
}

export const AdminFees: React.FC<AdminFeesProps> = (props) => {
  const { onNavigate, onSyncAllPortals, initialStudentId, clearInitialStudentId, openReceiptOnLoad, clearOpenReceiptOnLoad, refreshTrigger } = props;
  const { width: windowWidth } = useWindowDimensions();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'defaulters' | 'installments'>('ledger');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [feeStats, setFeeStats] = useState({
    collected: 0,
    pending: 0,
    defaultersCount: 0
  });

  const [collectionsHistory, setCollectionsHistory] = useState<any[]>([]);
  const [defaultersList, setDefaultersList] = useState<any[]>([]);
  const [studentSearchList, setStudentSearchList] = useState<any[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [amountPaid, setAmountPaid] = useState('6000');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [feeCategory, setFeeCategory] = useState('Tuition');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryAmounts, setCategoryAmounts] = useState<{[key: string]: string}>({});

  // Discount & Late Fee states
  const [discountApplied, setDiscountApplied] = useState('');
  const [scholarshipApplied, setScholarshipApplied] = useState('');
  const [lateFeeApplied, setLateFeeApplied] = useState('');
  const [selectedStudentLedger, setSelectedStudentLedger] = useState<any | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any | null>(null);

  // Installment collection mode states
  const [collectionMode, setCollectionMode] = useState<'category' | 'installment'>('category');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
  const [installmentAmountPaid, setInstallmentAmountPaid] = useState('');

  // Class plan states
  const [classesList, setClassesList] = useState<any[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form states - Installment Plan Template
  const [planClass, setPlanClass] = useState('');
  const [planYear, setPlanYear] = useState('2026-27');
  const [planAnnualFee, setPlanAnnualFee] = useState('');
  const [planInstallmentsCount, setPlanInstallmentsCount] = useState('3');
  const [planInstallmentsList, setPlanInstallmentsList] = useState<any[]>([]);
  const [planStatusSelect, setPlanStatusSelect] = useState<'Draft' | 'Published' | 'Archived'>('Draft');
  const [planDistributionMode, setPlanDistributionMode] = useState<'A' | 'B'>('A');
  const [planPublishedAt, setPlanPublishedAt] = useState<string | null>(null);
  const [planArchivedAt, setPlanArchivedAt] = useState<string | null>(null);

  const safeSplitDate = (d: any): string => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Student-specific actions states
  const [selectedInst, setSelectedInst] = useState<any | null>(null);
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [newDueDateText, setNewDueDateText] = useState('');
  const [showLateFeeModal, setShowLateFeeModal] = useState(false);
  const [newLateFeeText, setNewLateFeeText] = useState('');
  const [lateFeeOverrideReason, setLateFeeOverrideReason] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [instNoteText, setInstNoteText] = useState('');
  const [showInstHistoryModal, setShowInstHistoryModal] = useState(false);

  const regenerateInstallmentsWithClass = (fee: string, countStr: string, heads: any, mode: 'A' | 'B') => {
    const total = Number(fee) || 0;
    const count = Number(countStr) || 1;
    const generated: any[] = [];

    const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
    const structure = heads || { admission: 0, tuition: total, books: 0, hostel: 0, transport: 0, uniform: 0, exam: 0, other: 0 };

    if (mode === 'A') {
      const repeatingComps = ['tuition', 'hostel', 'transport'];
      const oneTimeComps = ['admission', 'books', 'uniform', 'exam', 'other'];

      for (let i = 0; i < count; i++) {
        const bd: any = {};
        let termAmount = 0;

        oneTimeComps.forEach(comp => {
          const val = Number(structure[comp]) || 0;
          bd[comp] = i === 0 ? val : 0;
          termAmount += bd[comp];
        });

        repeatingComps.forEach(comp => {
          const val = Number(structure[comp]) || 0;
          if (count === 1) {
            bd[comp] = val;
          } else {
            if (i === 0) {
              bd[comp] = Math.round(val * 0.20);
            } else {
              bd[comp] = Math.round((val * 0.80) / (count - 1));
            }
          }
          termAmount += bd[comp];
        });

        generated.push({
          name: `Term ${i + 1}`,
          amount: termAmount,
          dueDate: planInstallmentsList[i]?.dueDate || '',
          gracePeriod: planInstallmentsList[i]?.gracePeriod || 0,
          lateFee: planInstallmentsList[i]?.lateFee || 0,
          discount: planInstallmentsList[i]?.discount || 0,
          breakdown: bd
        });
      }

      // Rounding adjustment for components in Mode A
      const allComps = [...oneTimeComps, ...repeatingComps];
      allComps.forEach(comp => {
        const classTotal = Number(structure[comp]) || 0;
        const generatedSum = generated.reduce((sum, term) => sum + (term.breakdown[comp] || 0), 0);
        const diff = classTotal - generatedSum;
        if (diff !== 0 && generated.length > 0) {
          generated[generated.length - 1].breakdown[comp] += diff;
        }
      });

      // Re-calculate the overall amounts
      generated.forEach(term => {
        term.amount = Object.values(term.breakdown).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
      });

    } else {
      // Mode B - Manual
      for (let i = 0; i < count; i++) {
        const bd: any = {};
        components.forEach(comp => {
          bd[comp] = planInstallmentsList[i]?.breakdown?.[comp] || 0;
        });

        if (i === 0 && Object.values(bd).every(v => v === 0)) {
          components.forEach(comp => {
            bd[comp] = Number(structure[comp]) || 0;
          });
        }

        generated.push({
          name: `Term ${i + 1}`,
          amount: Object.values(bd).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0),
          dueDate: planInstallmentsList[i]?.dueDate || '',
          gracePeriod: planInstallmentsList[i]?.gracePeriod || 0,
          lateFee: planInstallmentsList[i]?.lateFee || 0,
          discount: planInstallmentsList[i]?.discount || 0,
          breakdown: bd
        });
      }
    }
    setPlanInstallmentsList(generated);
  };

  const handleClassSelection = (clsName: string) => {
    setPlanClass(clsName);
    const cls = classesList.find(c => c.name === clsName);
    if (cls && cls.feeStructure) {
      const heads = cls.feeStructure;
      const total = Object.values(heads).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
      setPlanAnnualFee(String(total));
      regenerateInstallmentsWithClass(String(total), planInstallmentsCount, heads, planDistributionMode);
    }
  };

  const handleDistributionModeChange = (mode: 'A' | 'B') => {
    setPlanDistributionMode(mode);
    const cls = classesList.find(c => c.name === planClass);
    const heads = cls ? cls.feeStructure : null;
    regenerateInstallmentsWithClass(planAnnualFee, planInstallmentsCount, heads, mode);
  };

  const handleInstallmentsCountChange = (countStr: string) => {
    setPlanInstallmentsCount(countStr);
    const cls = classesList.find(c => c.name === planClass);
    const heads = cls ? cls.feeStructure : null;
    regenerateInstallmentsWithClass(planAnnualFee, countStr, heads, planDistributionMode);
  };

  const openAddPlan = () => {
    setEditingPlanId(null);
    const defaultClass = classesList[0]?.name || '';
    setPlanClass(defaultClass);
    setPlanYear('2026-27');
    setPlanStatusSelect('Draft');
    setPlanDistributionMode('A');
    setPlanInstallmentsCount('3');
    setPlanPublishedAt(null);
    setPlanArchivedAt(null);
    
    const cls = classesList[0];
    const heads = cls ? cls.feeStructure : null;
    const total = cls && cls.feeStructure ? Object.values(cls.feeStructure).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0) : 60000;
    setPlanAnnualFee(String(total));
    
    regenerateInstallmentsWithClass(String(total), '3', heads, 'A');
    setShowPlanModal(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlanId(plan._id);
    setPlanClass(plan.className);
    setPlanYear(plan.academicYear || '2026-27');
    setPlanAnnualFee(String(plan.totalAmount));
    setPlanInstallmentsCount(String(plan.installments?.length || 0));
    setPlanStatusSelect(plan.status || 'Draft');
    setPlanDistributionMode(plan.mode || 'A');
    setPlanPublishedAt(plan.publishedAt || null);
    setPlanArchivedAt(plan.archivedAt || null);

    setPlanInstallmentsList(plan.installments?.map((inst: any) => ({
      name: inst.name,
      amount: inst.amount,
      dueDate: safeSplitDate(inst.dueDate),
      gracePeriod: inst.gracePeriod || 0,
      lateFee: inst.lateFee || 0,
      discount: inst.discount || 0,
      breakdown: inst.breakdown || { admission: 0, tuition: inst.amount, books: 0, hostel: 0, transport: 0, uniform: 0, exam: 0, other: 0 }
    })) || []);
    setShowPlanModal(true);
  };

  const handleSavePlan = async (targetStatus?: 'Draft' | 'Published' | 'Archived') => {
    const finalStatus = targetStatus || planStatusSelect;

    if (!planClass || !planAnnualFee || !planInstallmentsCount) {
      Alert.alert('Required Fields', 'Please complete Class, Annual Fee, and Number of Installments.');
      return;
    }
    for (const inst of planInstallmentsList) {
      if (!inst.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(inst.dueDate)) {
        Alert.alert('Required Date', `Due Date for ${inst.name} must be in YYYY-MM-DD format.`);
        return;
      }
    }

    // Component distributions validation for manual mode and published status
    if (finalStatus === 'Published') {
      const clsObj = classesList.find(c => c.name === planClass);
      if (clsObj) {
        const heads = clsObj.feeStructure || {};
        const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
        for (const comp of components) {
          const classCompAmt = Number(heads[comp]) || 0;
          const instCompSum = planInstallmentsList.reduce((acc, inst) => acc + (Number(inst.breakdown?.[comp]) || 0), 0);
          if (Math.abs(classCompAmt - instCompSum) > 0.01) {
            Alert.alert(
              'Validation Error', 
              `Sum of installment ${comp} fees (₹${instCompSum}) must equal the original class ${comp} fee (₹${classCompAmt}).`
            );
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        className: planClass,
        academicYear: planYear,
        totalAmount: Number(planAnnualFee),
        status: finalStatus,
        mode: planDistributionMode,
        installments: planInstallmentsList.map(inst => ({
          name: inst.name,
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          gracePeriod: Number(inst.gracePeriod) || 0,
          lateFee: Number(inst.lateFee) || 0,
          discount: Number(inst.discount) || 0,
          breakdown: inst.breakdown
        }))
      };

      const response = await api.post('/admin/installment-plans', payload);
      
      Alert.alert('Success', `Installment Plan saved as ${finalStatus} successfully.`);
      setPlanStatusSelect(finalStatus);
      setShowPlanModal(false);
      loadFeeData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save installment plan template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = (id: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete installment plan for class ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/installment-plans/${id}`);
              Alert.alert('Success', 'Installment Plan template deleted.');
              loadFeeData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete template.');
            }
          }
        }
      ]
    );
  };

  const handlePublishPlan = async (id: string) => {
    try {
      await api.post(`/admin/installment-plans/${id}/publish`);
      Alert.alert('Success', 'Installment Plan published.');
      loadFeeData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to publish.');
    }
  };

  const handleArchivePlan = async (id: string) => {
    try {
      await api.post(`/admin/installment-plans/${id}/archive`);
      Alert.alert('Success', 'Installment Plan archived.');
      loadFeeData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to archive.');
    }
  };

  const handleSaveDueDate = async () => {
    if (!selectedStudentId || !selectedInst) return;
    if (!newDueDateText || !/^\d{4}-\d{2}-\d{2}$/.test(newDueDateText)) {
      Alert.alert('Invalid Date', 'Due Date must be in YYYY-MM-DD format.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/admin/fees/student/${selectedStudentId}/installment/${selectedInst._id}/due-date`, {
        dueDate: newDueDateText
      });
      Alert.alert('Success', 'Installment due date extended successfully.');
      setShowDueDateModal(false);
      
      const res = await api.get(`/admin/student/${selectedStudentId}/profile`);
      if (res.data) {
        setSelectedStudentProfile(res.data.student);
        setSelectedStudentLedger(res.data.fee);
      }
      loadFeeData();
      onSyncAllPortals();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update due date.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLateFeeOverride = async () => {
    if (!selectedStudentId || !selectedInst) return;
    if (!lateFeeOverrideReason || lateFeeOverrideReason.trim() === '') {
      Alert.alert('Required', 'A reason for the late fee override is required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/admin/fees/student/${selectedStudentId}/installment/${selectedInst._id}/late-fee-override`, {
        lateFee: Number(newLateFeeText) || 0,
        reason: lateFeeOverrideReason
      });
      Alert.alert('Success', 'Late fee override saved.');
      setShowLateFeeModal(false);
      
      const res = await api.get(`/admin/student/${selectedStudentId}/profile`);
      if (res.data) {
        setSelectedStudentProfile(res.data.student);
        setSelectedStudentLedger(res.data.fee);
      }
      loadFeeData();
      onSyncAllPortals();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to override late fee.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedStudentId || !selectedInst) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/fees/student/${selectedStudentId}/installment/${selectedInst._id}/note`, {
        note: instNoteText
      });
      Alert.alert('Success', 'Internal note updated.');
      setShowNoteModal(false);
      
      const res = await api.get(`/admin/student/${selectedStudentId}/profile`);
      if (res.data) {
        setSelectedStudentProfile(res.data.student);
        setSelectedStudentLedger(res.data.fee);
      }
      loadFeeData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save note.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadFeeData = async () => {
    setLoading(true);
    try {
      const [ledgersRes, studentsRes, plansRes, classesRes] = await Promise.all([
        api.get('/admin/reports?type=fees').catch(() => ({ data: [] })),
        api.get('/admin/reports?type=students').catch(() => ({ data: [] })),
        api.get('/admin/installment-plans').catch(() => ({ data: [] })),
        api.get('/admin/classes').catch(() => ({ data: [] }))
      ]);

      const feeLedgers = ledgersRes.data || [];
      setStudentSearchList(studentsRes.data || []);
      setInstallmentPlans(plansRes.data || []);
      setClassesList(classesRes.data || []);

      let totCollected = 0;
      let pendFees = 0;
      let defaulters = 0;
      const history: any[] = [];
      const defaultersTemp: any[] = [];

      feeLedgers.forEach((ledger: any) => {
        totCollected += ledger.paidAmount;
        pendFees += ledger.balanceAmount;
        if (ledger.balanceAmount > 0) {
          defaulters++;
          defaultersTemp.push({
            id: ledger._id,
            studentId: ledger.student?._id || '',
            studentName: ledger.student?.name || 'Student',
            rollNumber: ledger.student?.rollNumber || '',
            admissionNumber: ledger.student?.admissionNumber || '',
            parentName: ledger.student?.parent?.fatherName || 'Parent',
            parentPhone: ledger.student?.parent?.phone || '',
            className: ledger.student?.class?.name || 'Class III',
            sectionName: ledger.student?.class?.section || 'A',
            pendingAmount: ledger.balanceAmount,
            dueDate: ledger.dueDate,
            reminderCount: ledger.reminderCount || 0,
            lastReminderDate: ledger.lastReminderDate,
            photo: ledger.student?.photo
          });
        }

        if (ledger.payments) {
          ledger.payments.forEach((p: any) => {
            history.push({
              id: p._id,
              studentId: ledger.student?._id || '',
              studentName: ledger.student?.name || 'Approved Student',
              admissionNumber: ledger.student?.admissionNumber || '',
              parentName: ledger.student?.parent?.fatherName || 'Parent',
              parentPhone: ledger.student?.parent?.phone || '',
              className: ledger.student?.class?.name || 'Class III',
              sectionName: ledger.student?.class?.section || 'A',
              amount: p.amount,
              method: p.paymentMethod,
              date: p.date,
              receiptNumber: p.receiptNumber,
              category: p.category,
              transactionId: p.transactionId,
              remarks: p.remarks,
              collectedBy: p.collectedBy
            });
          });
        }
      });

      setFeeStats({
        collected: totCollected,
        pending: pendFees,
        defaultersCount: defaulters
      });

      setCollectionsHistory(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setDefaultersList(defaultersTemp.sort((a, b) => b.pendingAmount - a.pendingAmount)); // Sort highest pending first
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedStudentId) {
      api.get(`/admin/student/${selectedStudentId}/profile`).then(res => {
        if (res.data) {
          setSelectedStudentProfile(res.data.student);
          setSelectedStudentLedger(res.data.fee);
        }
      }).catch(err => {
        console.error('Failed to load student profile:', err);
      });
    } else {
      setSelectedStudentProfile(null);
      setSelectedStudentLedger(null);
    }
  }, [selectedStudentId, refreshTrigger]);

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setShowCollectModal(true);
      if (clearInitialStudentId) {
        clearInitialStudentId();
      }
    }
  }, [initialStudentId]);

  useEffect(() => {
    if (openReceiptOnLoad && selectedStudentLedger && selectedStudentLedger.payments && selectedStudentLedger.payments.length > 0) {
      const payments = selectedStudentLedger.payments;
      const latestPayment = payments[payments.length - 1];
      const newRec = {
        receiptNumber: latestPayment.receiptNumber,
        amount: latestPayment.amount,
        method: latestPayment.paymentMethod,
        date: latestPayment.date,
        category: latestPayment.category || 'Multiple',
        breakdown: latestPayment.breakdown || {},
        studentName: selectedStudentProfile?.name || 'Student',
        transactionId: latestPayment.transactionId || '',
        remarks: latestPayment.remarks || '',
        collectedBy: latestPayment.collectedBy || 'ADMIN'
      };
      setActiveReceipt(newRec);
      setShowReceiptModal(true);
      if (clearOpenReceiptOnLoad) {
        clearOpenReceiptOnLoad();
      }
    }
  }, [openReceiptOnLoad, selectedStudentLedger, selectedStudentProfile]);

  const handleCloneStructure = async () => {
    setSubmitting(true);
    try {
      await api.post('/admin/fees/clone');
      alert('Fee Structure configuration cloned successfully.');
    } catch (err) {
      alert('Failed to clone structure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectSubmit = async () => {
    if (!selectedStudentId) {
      return alert('Please select a student.');
    }

    setSubmitting(true);
    try {
      let payload: any = {
        studentId: selectedStudentId,
        paymentMethod,
        transactionId,
        remarks
      };

      let categoryList = '';
      let totalPayment = 0;
      let breakdownPayload: any = {};

      if (collectionMode === 'installment') {
        if (!selectedInstallmentId) {
          setSubmitting(false);
          return alert('Please select an installment to collect.');
        }
        const inst = selectedStudentLedger?.installments?.find((i: any) => i._id === selectedInstallmentId);
        if (!inst) {
          setSubmitting(false);
          return alert('Selected installment not found.');
        }

        const amt = Number(installmentAmountPaid);
        if (isNaN(amt) || amt <= 0) {
          setSubmitting(false);
          return alert('Please enter a valid positive payment amount.');
        }

        payload.installmentId = selectedInstallmentId;
        payload.amountPaid = amt;
        
        categoryList = `Installment: ${inst.name}`;
        totalPayment = amt;
        breakdownPayload = { tuition: amt };

      } else {
        if (selectedCategories.length === 0) {
          setSubmitting(false);
          return alert('Please select at least one fee category.');
        }

        // Validate category amounts
        const categoriesPaidPayload: {[key: string]: number} = {};

        for (const cat of selectedCategories) {
          const amtStr = categoryAmounts[cat] || '';
          const amt = Number(amtStr) || 0;
          if (amt <= 0) {
            setSubmitting(false);
            return alert(`Please enter a valid payment amount (> 0) for ${cat} Fee.`);
          }

          // Check outstanding balance
          if (selectedStudentLedger) {
            const item = selectedStudentLedger.breakdown?.[cat] || { total: 0, paid: 0 };
            const bal = item.total - item.paid;
            if (amt > bal + 0.01) {
              setSubmitting(false);
              return alert(`Payment for ${cat} Fee (₹${amt}) exceeds the outstanding balance (₹${bal}).`);
            }
          }

          categoriesPaidPayload[cat] = amt;
          totalPayment += amt;
        }

        if (totalPayment <= 0) {
          setSubmitting(false);
          return alert('Total payment amount must be greater than zero.');
        }

        payload.amountPaid = totalPayment;
        payload.discountApplied = discountApplied ? Number(discountApplied) : undefined;
        payload.scholarshipApplied = scholarshipApplied ? Number(scholarshipApplied) : undefined;
        payload.lateFeeApplied = lateFeeApplied ? Number(lateFeeApplied) : undefined;
        payload.categoriesPaid = categoriesPaidPayload;

        categoryList = selectedCategories.join(', ');
        breakdownPayload = categoriesPaidPayload;
      }

      const res = await api.post('/admin/fees/collect', payload);
      alert('Payment collected successfully.');
      
      const updatedFee = res.data.fee;
      const latestPayment = updatedFee.payments[updatedFee.payments.length - 1];
      const rNum = latestPayment ? latestPayment.receiptNumber : res.data.receiptNumber;
      
      const newRec = {
        receiptNumber: rNum,
        amount: totalPayment,
        method: paymentMethod,
        date: new Date().toISOString(),
        category: categoryList,
        breakdown: breakdownPayload,
        studentName: studentSearchList.find(s => s._id === selectedStudentId)?.name || 'Student',
        transactionId,
        remarks,
        collectedBy: latestPayment?.collectedBy || 'ADMIN'
      };

      setActiveReceipt(newRec);
      setShowCollectModal(false);
      setShowReceiptModal(true);

      // Reset form fields
      setSelectedCategories([]);
      setCategoryAmounts({});
      setDiscountApplied('');
      setScholarshipApplied('');
      setLateFeeApplied('');
      setTransactionId('');
      setRemarks('');
      setSelectedInstallmentId('');
      setInstallmentAmountPaid('');
      
      loadFeeData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (feeId: string) => {
    setSubmitting(true);
    try {
      await api.post(`/admin/fees/${feeId}/remind`);
      alert('Reminder sent to parent successfully! Reminder count incremented.');
      loadFeeData();
    } catch (err) {
      alert('Failed to register reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionClick = (actionName: string, detail: string) => {
    alert(`${actionName} triggered successfully.\nRecipient: ${detail}`);
  };

  const filteredStudents = studentSearchList.filter(s => {
    const query = searchKey.toLowerCase().trim();
    if (!query) return false;
    return s.name.toLowerCase().includes(query) ||
           (s.rollNumber && s.rollNumber.toLowerCase().includes(query)) ||
           (s.admissionNumber && s.admissionNumber.toLowerCase().includes(query)) ||
           (s._id && s._id.toLowerCase().includes(query)) ||
           (s.parent && s.parent.phone && s.parent.phone.includes(query));
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Fee Collection Center</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Reconcile payments, print receipts, and configure structure</Text>
          </View>
        </View>

        {/* ================= CLONE ACTION ================= */}
        <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.cloneTitle, { color: theme.text }]}>Configure Academic Year Fees</Text>
            <Text style={{ fontSize: 9, color: theme.textSecondary }}>Clone and copy over all class structures from the previous term.</Text>
          </View>
          <Pressable onPress={handleCloneStructure} style={styles.cloneBtn} disabled={submitting}>
            <Copy size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.cloneBtnText}>Clone Structure</Text>
          </Pressable>
        </Card>

        {/* ================= STATS WIDGETS ================= */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <DollarSign size={20} color="#10B981" />
            <Text style={[styles.statVal, { color: theme.text }]}>₹{feeStats.collected.toLocaleString()}</Text>
            <Text style={{ fontSize: 8, color: theme.textSecondary }}>Collected Fees</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AlertTriangle size={20} color="#DC3545" />
            <Text style={[styles.statVal, { color: theme.text }]}>₹{feeStats.pending.toLocaleString()}</Text>
            <Text style={{ fontSize: 8, color: theme.textSecondary }}>Pending Deficits ({feeStats.defaultersCount} Defaulters)</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <Pressable
            onPress={() => setActiveTab('ledger')}
            style={[styles.tabSelectorItem, {
              backgroundColor: activeTab === 'ledger' ? '#EF4444' : theme.surface,
              borderColor: activeTab === 'ledger' ? '#EF4444' : theme.border
            }]}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: activeTab === 'ledger' ? '#ffffff' : theme.text }}>Collections Ledger</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('defaulters')}
            style={[styles.tabSelectorItem, {
              backgroundColor: activeTab === 'defaulters' ? '#EF4444' : theme.surface,
              borderColor: activeTab === 'defaulters' ? '#EF4444' : theme.border
            }]}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: activeTab === 'defaulters' ? '#ffffff' : theme.text }}>Pending Defaulters ({defaultersList.length})</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('installments')}
            style={[styles.tabSelectorItem, {
              backgroundColor: activeTab === 'installments' ? '#EF4444' : theme.surface,
              borderColor: activeTab === 'installments' ? '#EF4444' : theme.border
            }]}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: activeTab === 'installments' ? '#ffffff' : theme.text }}>Installment Templates ({installmentPlans.length})</Text>
          </Pressable>
        </View>

        {/* Action Button */}
        <Pressable onPress={() => setShowCollectModal(true)} style={styles.actionCollectBtn}>
          <Receipt size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.actionCollectBtnText}>Record Payment Collection</Text>
        </Pressable>

        {/* ================= TAB 1: COLLECTIONS LEDGER ================= */}
        {activeTab === 'ledger' && (
          <View>
            {selectedStudentId ? (
              <View>
                <Pressable 
                  onPress={() => setSelectedStudentId('')} 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 4 }}
                >
                  <ArrowLeft size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: 'bold', fontSize: 13 }}>
                    Back to Recent Payments
                  </Text>
                </Pressable>

                {selectedStudentProfile && (
                  <Card style={{ padding: 14, marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
                      {selectedStudentProfile.name} ({selectedStudentProfile.rollNumber || 'Adm: ' + selectedStudentProfile.admissionNumber})
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <View>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Class: {selectedStudentProfile.class?.name || 'N/A'}</Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Parent: {selectedStudentProfile.parent?.fatherName || 'N/A'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Phone: {selectedStudentProfile.parent?.phone || 'N/A'}</Text>
                      </View>
                    </View>

                    {selectedStudentLedger && (
                      <View style={{ borderTopWidth: 0.5, borderTopColor: theme.border, paddingTop: 10 }}>
                        {/* Overall Progress Bar */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text }}>Payment Progress:</Text>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10B981' }}>
                            {Math.round(((selectedStudentLedger.paidAmount || 0) / (selectedStudentLedger.totalAmount || 1)) * 100)}% Completed
                          </Text>
                        </View>
                        
                        <View style={{ height: 8, backgroundColor: isDarkMode ? '#334155' : '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                          <View style={{ height: '100%', backgroundColor: '#10B981', width: (Math.round(((selectedStudentLedger.paidAmount || 0) / (selectedStudentLedger.totalAmount || 1)) * 100) + '%') as any }} />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                          <View>
                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>Total Annual Fee</Text>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>₹{(selectedStudentLedger.totalAmount || 0).toLocaleString()}</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>Total Paid</Text>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10B981' }}>₹{(selectedStudentLedger.paidAmount || 0).toLocaleString()}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 10, color: theme.textSecondary }}>Balance Due</Text>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#DC3545' }}>₹{(selectedStudentLedger.balanceAmount || 0).toLocaleString()}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </Card>
                )}

                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 8 }]}>Student Installment Ledger</Text>
                
                {selectedStudentLedger?.installments?.length > 0 ? (
                  selectedStudentLedger.installments.map((inst: any) => {
                    const outstanding = Math.max(0, inst.amount + (inst.lateFee || 0) - (inst.discount || 0) - inst.paidAmount);
                    return (
                      <Card key={inst._id} style={{ padding: 12, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>{inst.name}</Text>
                              <View style={[{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                marginLeft: 8
                              }, inst.status === 'Paid' ? { backgroundColor: '#D1FAE5' } : inst.status === 'Partially Paid' ? { backgroundColor: '#FEF3C7' } : inst.status === 'Overdue' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F3F4F6' }]}>
                                <Text style={[{ fontSize: 9, fontWeight: 'bold' }, inst.status === 'Paid' ? { color: '#065F46' } : inst.status === 'Partially Paid' ? { color: '#D97706' } : inst.status === 'Overdue' ? { color: '#B91C1C' } : { color: '#4B5563' }]}>
                                  {inst.status}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                              Due Date: {safeSplitDate(inst.dueDate) || 'N/A'} (Grace: {inst.gracePeriod} days)
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                              Total Amount: ₹{(inst.amount + (inst.lateFee || 0) - (inst.discount || 0)).toLocaleString()} | Paid: ₹{(inst.paidAmount || 0).toLocaleString()} | Bal: ₹{outstanding.toLocaleString()} ({inst.percentage || 0}%)
                            </Text>
                            {inst.breakdown && (
                              <View style={{ marginTop: 4, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.primary + '30', marginVertical: 4 }}>
                                {Object.entries(inst.breakdown).map(([cat, total]: [string, any]) => {
                                  if (!total || total <= 0) return null;
                                  const paid = (inst.breakdownPaid && inst.breakdownPaid[cat]) || 0;
                                  const rem = Math.max(0, total - paid);
                                  const pct = Math.round((paid / total) * 100);
                                  let label = cat.charAt(0).toUpperCase() + cat.slice(1);
                                  if (label === 'Exam') label = 'Examination';
                                  return (
                                    <Text key={cat} style={{ fontSize: 9, color: theme.textSecondary, marginVertical: 1 }}>
                                      • {label}: expected ₹{total.toLocaleString()} | paid ₹{paid.toLocaleString()} | rem ₹{rem.toLocaleString()} ({pct}%)
                                    </Text>
                                  );
                                })}
                              </View>
                            )}
                            {(inst.lateFee > 0 || inst.discount > 0) && (
                              <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: 'bold', marginTop: 2 }}>
                                {inst.lateFee > 0 ? `⚠️ Overridden Late Fee: ₹${inst.lateFee} ` : ''}
                                {inst.discount > 0 ? `🎁 Applied Discount: ₹${inst.discount}` : ''}
                              </Text>
                            )}
                            {inst.internalNotes ? (
                              <View style={{ marginTop: 6, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 6, borderRadius: 6, borderLeftWidth: 2, borderLeftColor: '#3B82F6' }}>
                                <Text style={{ fontSize: 10, color: theme.text, fontStyle: 'italic' }}>
                                  ✍️ Internal Note: {inst.internalNotes}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        {/* Action buttons list */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, borderTopWidth: 0.5, borderTopColor: theme.border, paddingTop: 8 }}>
                          {inst.status !== 'Paid' && (
                            <Pressable 
                              onPress={() => {
                                setCollectionMode('installment');
                                setSelectedInstallmentId(inst._id);
                                setInstallmentAmountPaid(String(outstanding));
                                setShowCollectModal(true);
                              }} 
                              style={{ backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                            >
                              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#fff' }}>Collect</Text>
                            </Pressable>
                          )}
                          <Pressable 
                            onPress={() => {
                              setSelectedInst(inst);
                              setNewDueDateText(safeSplitDate(inst.dueDate));
                              setShowDueDateModal(true);
                            }} 
                            style={{ borderWidth: 0.5, borderColor: theme.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.text }}>Extend Due</Text>
                          </Pressable>
                          <Pressable 
                            onPress={() => {
                              setSelectedInst(inst);
                              setNewLateFeeText(String(inst.lateFee || 0));
                              setLateFeeOverrideReason('');
                              setShowLateFeeModal(true);
                            }} 
                            style={{ borderWidth: 0.5, borderColor: theme.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.text }}>Override Late Fee</Text>
                          </Pressable>
                          <Pressable 
                            onPress={() => {
                              setSelectedInst(inst);
                              setInstNoteText(inst.internalNotes || '');
                              setShowNoteModal(true);
                            }} 
                            style={{ borderWidth: 0.5, borderColor: theme.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.text }}>Add Note</Text>
                          </Pressable>
                          {inst.payments?.length > 0 && (
                            <Pressable 
                              onPress={() => {
                                setSelectedInst(inst);
                                setShowInstHistoryModal(true);
                              }} 
                              style={{ borderWidth: 0.5, borderColor: theme.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#E0F2FE' }}
                            >
                              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0369A1' }}>History ({inst.payments.length})</Text>
                            </Pressable>
                          )}
                        </View>
                      </Card>
                    );
                  })
                ) : (
                  <EmptyState title="No Installments" message="No installments assigned to this student ledger." iconName="Receipt" />
                )}
              </View>
            ) : (
              <View>
                {/* Search Bar */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Search Student Ledger</Text>
                  <TextInput 
                    style={[styles.modalInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]} 
                    value={searchKey} 
                    onChangeText={setSearchKey} 
                    placeholder="Enter Student Name, Roll No, or Phone..." 
                    placeholderTextColor={theme.textSecondary} 
                  />
                  {searchKey ? (
                    <View style={[styles.studentsFallbackGrid, { marginBottom: 10 }]}>
                      {studentSearchList.filter((s: any) =>
                        s.name.toLowerCase().includes(searchKey.toLowerCase()) ||
                        s.rollNumber?.toLowerCase().includes(searchKey.toLowerCase()) ||
                        s.admissionNumber?.toLowerCase().includes(searchKey.toLowerCase())
                      ).slice(0, 6).map(s => (
                        <Pressable 
                          key={s._id} 
                          onPress={() => {
                            setSelectedStudentId(s._id);
                            setSearchKey('');
                          }}
                          style={[styles.studentSelectPill, { borderColor: theme.border }]}
                        >
                          <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>{s.name} ({s.rollNumber || 'PENDING'})</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Payments Ledger</Text>
                {loading ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <Card style={{ padding: 14 }}>
                    {collectionsHistory.length > 0 ? (
                      collectionsHistory.map((c, idx) => (
                        <Pressable 
                          key={c.id || idx} 
                          onPress={() => {
                            setActiveReceipt(c);
                            setShowReceiptModal(true);
                          }}
                          style={[styles.ledgerRow, { borderBottomColor: idx === collectionsHistory.length - 1 ? 'transparent' : theme.border }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.ledgerName, { color: theme.text }]}>{c.studentName}</Text>
                            <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                              Adm No: {c.admissionNumber} | Class: {c.className}-{c.sectionName}
                            </Text>
                            <Text style={{ fontSize: 8, color: theme.textSecondary }}>
                              Receipt: {c.receiptNumber} | {c.category} ({c.method}) | Date: {new Date(c.date).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={styles.ledgerVal}>+₹{c.amount.toLocaleString()}</Text>
                        </Pressable>
                      ))
                    ) : (
                      <EmptyState
                        title="Fees Ledger"
                        message="No payment transactions recorded yet."
                        iconName="Receipt"
                      />
                    )}
                  </Card>
                )}
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 2: PENDING DEFAULTERS ================= */}
        {activeTab === 'defaulters' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Defaulters Registry (Highest Pending First)</Text>
            {loading ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <View>
                {defaultersList.length > 0 ? (
                  defaultersList.map(def => (
                    <Card key={def.id} style={{ padding: 14, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{def.studentName.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{def.studentName}</Text>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Class: {def.className} - {def.sectionName} | Parent: {def.parentName}</Text>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Due Date: {new Date(def.dueDate).toLocaleDateString()}</Text>
                          <Text style={{ fontSize: 9, color: '#F59E0B', fontWeight: '800', marginTop: 2 }}>
                            Reminders: {def.reminderCount} sent {def.lastReminderDate ? `(Last: ${new Date(def.lastReminderDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})` : ''}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#DC3545' }}>₹{def.pendingAmount.toLocaleString()}</Text>
                      </View>

                      {/* Defaulter action bar */}
                      <View style={[styles.defaulterActionBox, { flexWrap: 'wrap', justifyContent: 'flex-start' }]}>
                        <Pressable onPress={() => handleActionClick('Call parent', def.parentPhone)} style={[styles.defBtn, { borderColor: theme.border, minWidth: windowWidth < 600 ? '48%' : '22%', marginBottom: windowWidth < 600 ? 6 : 0 }]}>
                          <Phone size={11} color={theme.text} />
                          <Text style={{ fontSize: 9, color: theme.text, marginLeft: 4 }}>Call Parent</Text>
                        </Pressable>
                        <Pressable onPress={() => handleActionClick('WhatsApp message', def.parentPhone)} style={[styles.defBtn, { borderColor: theme.border, minWidth: windowWidth < 600 ? '48%' : '22%', marginBottom: windowWidth < 600 ? 6 : 0 }]}>
                          <Send size={11} color="#10B981" />
                          <Text style={{ fontSize: 9, color: theme.text, marginLeft: 4 }}>WhatsApp</Text>
                        </Pressable>
                        <Pressable onPress={() => handleSendReminder(def.id)} style={[styles.defBtn, { borderColor: theme.border, minWidth: windowWidth < 600 ? '48%' : '22%', marginBottom: windowWidth < 600 ? 6 : 0 }]}>
                          <Mail size={11} color="#3B82F6" />
                          <Text style={{ fontSize: 9, color: theme.text, marginLeft: 4 }}>Send Reminder</Text>
                        </Pressable>
                        <Pressable 
                          onPress={() => {
                            setSelectedStudentId(def.studentId);
                            setShowCollectModal(true);
                          }} 
                          style={[styles.defBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444', minWidth: windowWidth < 600 ? '48%' : '22%', marginBottom: windowWidth < 600 ? 6 : 0 }]}
                        >
                          <DollarSign size={11} color="#ffffff" />
                          <Text style={{ fontSize: 9, color: '#ffffff', marginLeft: 4 }}>Collect</Text>
                        </Pressable>
                      </View>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    title="Defaulters Registry"
                    message="No pending fee defaulters found."
                    iconName="AlertTriangle"
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 3: INSTALLMENT PLANS ================= */}
        {activeTab === 'installments' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Fee Installment Plans</Text>
              <Pressable onPress={openAddPlan} style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Create Plan Template</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <View>
                {installmentPlans.length > 0 ? (
                  installmentPlans.map(plan => (
                    <Card key={plan._id} style={{ padding: 14, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>Class: {plan.className}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>Academic Year: {plan.academicYear} | Annual Fee: ₹{plan.totalAmount.toLocaleString()}</Text>
                            <View style={[{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginLeft: 8
                            }, plan.status === 'Published' ? { backgroundColor: '#D1FAE5' } : plan.status === 'Archived' ? { backgroundColor: '#F3F4F6' } : { backgroundColor: '#FEF3C7' }]}>
                              <Text style={[{ fontSize: 9, fontWeight: 'bold' }, plan.status === 'Published' ? { color: '#065F46' } : plan.status === 'Archived' ? { color: '#4B5563' } : { color: '#D97706' }]}>
                                {plan.status || 'Draft'}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>Installments: {plan.installments?.length || 0} terms</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                          <Pressable onPress={() => openEditPlan(plan)} style={{ padding: 6, marginRight: 8 }}><Edit2 size={16} color={colors.primary} /></Pressable>
                          <Pressable onPress={() => handleDeletePlan(plan._id, plan.className)} style={{ padding: 6 }}><Trash2 size={16} color="#ff3b30" /></Pressable>
                        </View>
                      </View>
                      
                      <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#e5e5ea', paddingTop: 8 }}>
                        {plan.installments?.map((inst: any, i: number) => (
                          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                            <Text style={{ fontSize: 11, color: theme.text, fontWeight: '600' }}>{inst.name}</Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>₹{inst.amount.toLocaleString()} | Due: {safeSplitDate(inst.dueDate) || 'N/A'}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Publish / Archive Quick buttons */}
                      <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end', borderTopWidth: 0.5, borderTopColor: '#e5e5ea', paddingTop: 8, gap: 8 }}>
                        {plan.status === 'Draft' && (
                          <Pressable onPress={() => handlePublishPlan(plan._id)} style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#065F46' }}>Publish</Text>
                          </Pressable>
                        )}
                        {plan.status !== 'Archived' && (
                          <Pressable onPress={() => handleArchivePlan(plan._id)} style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#B91C1C' }}>Archive</Text>
                          </Pressable>
                        )}
                      </View>
                    </Card>
                  ))
                ) : (
                  <EmptyState title="No Installment Plan Templates" message="Configure installment templates by selecting a Class, Academic Year, and total Annual Fee." iconName="AlertTriangle" />
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* ================= RECORD PAYMENT MODAL ================= */}
      <Modal visible={showCollectModal} transparent animationType="slide" onRequestClose={() => setShowCollectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Record Collection Payment</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Search Student Profile</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={searchKey} onChangeText={setSearchKey} placeholder="Enter Student Name, Roll No, or Phone..." placeholderTextColor={theme.textSecondary} />

              <View style={styles.studentsFallbackGrid}>
                {filteredStudents.slice(0, 6).map(s => (
                  <Pressable 
                    key={s._id} 
                    onPress={() => {
                      setSelectedStudentId(s._id);
                      setSearchKey('');
                    }}
                    style={[styles.studentSelectPill, { 
                      borderColor: selectedStudentId === s._id ? '#EF4444' : theme.border,
                      backgroundColor: selectedStudentId === s._id ? '#EF444415' : 'transparent'
                    }]}
                  >
                    <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>{s.name} ({s.rollNumber || 'PENDING'})</Text>
                  </Pressable>
                ))}
              </View>

              {selectedStudentProfile && (
                <Card style={{ padding: 12, marginVertical: 8, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 8 }}>
                    Student Verification Details
                  </Text>
                  
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text, width: 120 }}>1. Full Name:</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedStudentProfile.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text, width: 120 }}>2. Class:</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedStudentProfile.class?.name || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text, width: 120 }}>3. Section:</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedStudentProfile.class?.section || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text, width: 120 }}>4. Father Name:</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedStudentProfile.parent?.fatherName || 'N/A'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.text, width: 120 }}>5. Parent Phone:</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedStudentProfile.parent?.phone || 'N/A'}</Text>
                    </View>
                  </View>

                  {selectedStudentLedger && (
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text, marginBottom: 6 }}>
                        Ledger Breakdown:
                      </Text>
                      {['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'].map(head => {
                        const item = selectedStudentLedger.breakdown?.[head] || { total: 0, paid: 0 };
                        const bal = item.total - item.paid;
                        const status = item.status || (item.paid >= item.total - 0.01 ? 'Paid' : (item.paid > 0 ? 'Partially Paid' : 'Unpaid'));
                        
                        let label = head.charAt(0).toUpperCase() + head.slice(1);
                        if (label === 'Exam') label = 'Examination';
                        
                        return (
                          <View key={head} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
                            <Text style={{ fontSize: 9, color: theme.text, flex: 2 }}>{label} Fee</Text>
                            <Text style={{ fontSize: 9, color: theme.textSecondary, flex: 1.5 }}>Total: ₹{item.total.toLocaleString()}</Text>
                            <Text style={{ fontSize: 9, color: '#10B981', flex: 1.5 }}>Paid: ₹{item.paid.toLocaleString()}</Text>
                            <Text style={{ fontSize: 9, color: '#DC3545', flex: 1.5 }}>Rem: ₹{bal.toLocaleString()}</Text>
                            <Text style={[{ fontSize: 9, fontWeight: 'bold', flex: 1.2, textAlign: 'right' }, status === 'Paid' ? { color: '#065F46' } : status === 'Partially Paid' ? { color: '#D97706' } : { color: '#B91C1C' }]}>
                              {status}
                            </Text>
                          </View>
                        );
                      })}
                      <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: theme.border, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>Total Balance Due:</Text>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC3545' }}>
                          ₹{selectedStudentLedger.balanceAmount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </Card>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 10 }]}>Collection Mode</Text>
              <View style={styles.studentsFallbackGrid}>
                <Pressable 
                  onPress={() => setCollectionMode('category')}
                  style={[styles.studentSelectPill, { 
                    borderColor: collectionMode === 'category' ? '#EF4444' : theme.border,
                    backgroundColor: collectionMode === 'category' ? '#EF444415' : 'transparent'
                  }]}
                >
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>Category-Wise</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setCollectionMode('installment')}
                  style={[styles.studentSelectPill, { 
                    borderColor: collectionMode === 'installment' ? '#EF4444' : theme.border,
                    backgroundColor: collectionMode === 'installment' ? '#EF444415' : 'transparent'
                  }]}
                >
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>Installment Plan</Text>
                </Pressable>
              </View>

              {collectionMode === 'installment' ? (
                <View style={{ marginVertical: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Installment</Text>
                  <View style={{ flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {selectedStudentLedger?.installments?.length === 0 || !selectedStudentLedger?.installments ? (
                      <Text style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' }}>No installments assigned to student.</Text>
                    ) : (
                      selectedStudentLedger.installments.map((inst: any) => {
                        const isSelected = selectedInstallmentId === inst._id;
                        const outstanding = inst.amount + (inst.lateFee || 0) - (inst.discount || 0) - inst.paidAmount;
                        return (
                          <Pressable 
                            key={inst._id}
                            onPress={() => {
                              setSelectedInstallmentId(inst._id);
                              setInstallmentAmountPaid(String(outstanding));
                            }}
                            style={{ 
                              padding: 10, 
                              borderWidth: 1, 
                              borderRadius: 8, 
                              borderColor: isSelected ? colors.primary : theme.border,
                              backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.05)' : 'transparent',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginVertical: 4
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text }}>{inst.name}</Text>
                              <Text style={{ fontSize: 9, color: theme.textSecondary }}>Due: {new Date(inst.dueDate).toLocaleDateString()} | Status: {inst.status}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.secondary }}>₹{outstanding.toLocaleString()}</Text>
                              <Text style={{ fontSize: 8, color: theme.textSecondary }}>Original: ₹{inst.amount}</Text>
                            </View>
                          </Pressable>
                        );
                      })
                    )}
                  </View>

                  {selectedInstallmentId ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text }}>Collection Amount:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 'bold' }}>₹</Text>
                        <TextInput
                          style={[styles.modalInput, { width: 120, marginBottom: 0, height: 36, paddingVertical: 4, textAlign: 'right', color: theme.text, borderColor: theme.border }]}
                          value={installmentAmountPaid}
                          onChangeText={(val) => setInstallmentAmountPaid(cleanNumberInput(val))}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Fee Categories</Text>
                  <View style={styles.studentsFallbackGrid}>
                    {['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'].map(c => {
                      const isSelected = selectedCategories.includes(c);
                      return (
                        <Pressable 
                          key={c} 
                          onPress={() => {
                            if (isSelected) {
                              setSelectedCategories(prev => prev.filter(k => k !== c));
                              setCategoryAmounts(prev => {
                                const copy = { ...prev };
                                delete copy[c];
                                return copy;
                              });
                            } else {
                              setSelectedCategories(prev => [...prev, c]);
                              if (selectedStudentLedger) {
                                const item = selectedStudentLedger.breakdown?.[c] || { total: 0, paid: 0 };
                                const bal = Math.max(0, item.total - item.paid);
                                setCategoryAmounts(prev => ({ ...prev, [c]: String(bal) }));
                              } else {
                                setCategoryAmounts(prev => ({ ...prev, [c]: '' }));
                              }
                            }
                          }}
                          style={[styles.studentSelectPill, { 
                            borderColor: isSelected ? '#EF4444' : theme.border,
                            backgroundColor: isSelected ? '#EF444415' : 'transparent'
                          }]}
                        >
                          <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800', textTransform: 'capitalize' }}>
                            {isSelected ? '☑' : '☐'} {c}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {selectedCategories.length > 0 && (
                    <View style={{ marginVertical: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 8 }}>
                        Amount Per Selected Fee Head
                      </Text>
                      {selectedCategories.map(cat => {
                        const item = selectedStudentLedger?.breakdown?.[cat] || { total: 0, paid: 0 };
                        const bal = Math.max(0, item.total - item.paid);
                        return (
                          <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 10, color: theme.text, textTransform: 'capitalize', fontWeight: 'bold' }}>{cat} Fee</Text>
                              <Text style={{ fontSize: 8, color: theme.textSecondary }}>Outstanding Balance: ₹{bal.toLocaleString()}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '800' }}>₹</Text>
                              <TextInput
                                style={[styles.modalInput, { width: 100, marginBottom: 0, height: 32, paddingVertical: 4, textAlign: 'right', color: theme.text, borderColor: theme.border }]}
                                value={categoryAmounts[cat] || ''}
                                onChangeText={(val) => {
                                  const cleaned = cleanNumberInput(val);
                                  setCategoryAmounts(prev => ({ ...prev, [cat]: cleaned }));
                                }}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={theme.textSecondary}
                              />
                            </View>
                          </View>
                        );
                      })}

                      <View style={{ marginTop: 12, backgroundColor: '#10B98115', padding: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>Total Payment Amount:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981' }}>
                          ₹ {Object.keys(categoryAmounts).reduce((sum, key) => selectedCategories.includes(key) ? sum + (Number(categoryAmounts[key]) || 0) : sum, 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 10 }]}>Payment Method</Text>
              <View style={styles.studentsFallbackGrid}>
                {['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'].map(m => (
                  <Pressable 
                    key={m} 
                    onPress={() => setPaymentMethod(m)}
                    style={[styles.studentSelectPill, { 
                      borderColor: paymentMethod === m ? '#EF4444' : theme.border,
                      backgroundColor: paymentMethod === m ? '#EF444415' : 'transparent'
                    }]}
                  >
                    <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Transaction / Reference ID</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={transactionId} onChangeText={setTransactionId} placeholder="e.g. TXN987210" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Remarks</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={remarks} onChangeText={setRemarks} placeholder="Collected details" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Scholarship / Discount Deductions (Optional)</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TextInput style={[styles.modalInput, { flex: 1, marginRight: 5, color: theme.text, borderColor: theme.border }]} value={discountApplied} onChangeText={(val) => setDiscountApplied(cleanNumberInput(val))} placeholder="Discount Amt" keyboardType="numeric" placeholderTextColor={theme.textSecondary} />
                <TextInput style={[styles.modalInput, { flex: 1, marginLeft: 5, color: theme.text, borderColor: theme.border }]} value={scholarshipApplied} onChangeText={(val) => setScholarshipApplied(cleanNumberInput(val))} placeholder="Scholarship Amt" keyboardType="numeric" placeholderTextColor={theme.textSecondary} />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Late Fee Penalty Additions (Optional)</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={lateFeeApplied} onChangeText={(val) => setLateFeeApplied(cleanNumberInput(val))} placeholder="Late Fee Penalty" keyboardType="numeric" placeholderTextColor={theme.textSecondary} />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowCollectModal(false)}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleCollectSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Record Payment</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= RECEIPT TICKET VIEW ================= */}
      {activeReceipt && (
        <Modal visible={showReceiptModal} transparent animationType="slide" onRequestClose={() => setShowReceiptModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Payment Receipt</Text>
              
              <View style={[styles.receiptTicket, { borderColor: theme.border }]}>
                <Text style={styles.receiptTitle}>VIDYA BHARATHI VIDYAPEETH</Text>
                <Text style={styles.receiptSubtitle}>Nirmal District, Telangana | Affiliation: 3630042</Text>
                <View style={styles.receiptDivider} />
                
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLbl}>Receipt Number:</Text>
                  <Text style={styles.receiptDetailVal}>{activeReceipt.receiptNumber}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLbl}>Date Collected:</Text>
                  <Text style={styles.receiptDetailVal}>{new Date(activeReceipt.date).toLocaleString()}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLbl}>Student Name:</Text>
                  <Text style={styles.receiptDetailVal}>{activeReceipt.studentName}</Text>
                </View>
                <View style={styles.receiptDivider} />
                <Text style={{ fontSize: 9, fontWeight: '800', color: theme.text, marginBottom: 4, textTransform: 'uppercase' }}>
                  Fee Component Breakdown:
                </Text>
                {activeReceipt.breakdown ? (
                  Object.entries(activeReceipt.breakdown).map(([cat, amt]) => {
                    const val = Number(amt) || 0;
                    if (val > 0) {
                      return (
                        <View key={cat} style={styles.receiptDetailRow}>
                          <Text style={[styles.receiptDetailLbl, { textTransform: 'capitalize' }]}>{cat} Fee:</Text>
                          <Text style={styles.receiptDetailVal}>₹ {val.toLocaleString()}</Text>
                        </View>
                      );
                    }
                    return null;
                  })
                ) : (
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLbl}>Category:</Text>
                    <Text style={styles.receiptDetailVal}>{activeReceipt.category}</Text>
                  </View>
                )}
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLbl}>Payment Method:</Text>
                  <Text style={styles.receiptDetailVal}>{activeReceipt.method} {activeReceipt.transactionId ? `(${activeReceipt.transactionId})` : ''}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLbl}>Remarks:</Text>
                  <Text style={styles.receiptDetailVal}>{activeReceipt.remarks || 'N/A'}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLbl}>Collected By:</Text>
                  <Text style={styles.receiptDetailVal}>{activeReceipt.collectedBy || 'ADMIN'}</Text>
                </View>

                <View style={styles.receiptDivider} />
                <View style={styles.receiptDetailRow}>
                  <Text style={[styles.receiptDetailLbl, { fontSize: 12, fontWeight: '800' }]}>Total Collected:</Text>
                  <Text style={[styles.receiptDetailVal, { fontSize: 12, fontWeight: '800', color: '#10B981' }]}>
                    ₹ {activeReceipt.amount.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Action buttons inside Receipt Ticket modal */}
              <View style={styles.receiptActionsRow}>
                <Pressable onPress={() => handleActionClick('PDF generation', activeReceipt.receiptNumber)} style={styles.receiptActionBtn}>
                  <FileText size={14} color={theme.text} />
                  <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 4 }}>PDF</Text>
                </Pressable>
                <Pressable onPress={() => handleActionClick('Print ticket', activeReceipt.receiptNumber)} style={styles.receiptActionBtn}>
                  <Printer size={14} color={theme.text} />
                  <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 4 }}>Print</Text>
                </Pressable>
                <Pressable onPress={() => handleActionClick('SMS reminder', activeReceipt.parentPhone || 'Mobile')} style={styles.receiptActionBtn}>
                  <Mail size={14} color={theme.text} />
                  <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 4 }}>SMS</Text>
                </Pressable>
                <Pressable onPress={() => handleActionClick('WhatsApp receipt', activeReceipt.parentPhone || 'Mobile')} style={styles.receiptActionBtn}>
                  <Send size={14} color="#10B981" />
                  <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 4 }}>WhatsApp</Text>
                </Pressable>
                <Pressable onPress={() => handleActionClick('Email receipt', 'Email')} style={styles.receiptActionBtn}>
                  <Mail size={14} color="#3B82F6" />
                  <Text style={{ fontSize: 8, color: theme.textSecondary, marginTop: 4 }}>Email</Text>
                </Pressable>
              </View>

              <View style={[styles.modalActionsRow, { marginTop: 18 }]}>
                <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border, alignSelf: 'flex-end' }]} onPress={() => setShowReceiptModal(false)}>
                  <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ================= INSTALLMENT PLAN CONFIGURATION MODAL ================= */}
      <Modal visible={showPlanModal} transparent animationType="slide" onRequestClose={() => setShowPlanModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingPlanId ? 'Edit Plan Template' : 'Create Class Installment Plan'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {planStatusSelect === 'Archived' && (
                <View style={{ marginBottom: 14, padding: 10, borderRadius: 8, backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', borderWidth: 0.5, borderColor: theme.border }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#B91C1C', marginBottom: 4 }}>Status: Archived (Read-Only)</Text>
                  {planPublishedAt && <Text style={{ fontSize: 10, color: theme.textSecondary }}>Published: {new Date(planPublishedAt).toLocaleDateString()} {new Date(planPublishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                  {planArchivedAt && <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>Archived: {new Date(planArchivedAt).toLocaleDateString()} {new Date(planArchivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                </View>
              )}

              <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>Select Target Class</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {classesList.map(c => (
                  <Pressable 
                    key={c._id} 
                    onPress={() => handleClassSelection(c.name)} 
                    disabled={planStatusSelect === 'Archived'}
                    style={[{
                      borderWidth: 1,
                      borderColor: '#e5e5ea',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 8
                    }, planClass === c.name ? {
                      backgroundColor: '#EF4444',
                      borderColor: '#EF4444'
                    } : planStatusSelect === 'Archived' && {
                      opacity: 0.5
                    }]}
                  >
                    <Text style={{ fontSize: 11, color: planClass === c.name ? '#fff' : theme.text }}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>Academic Year</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                value={planYear} 
                onChangeText={setPlanYear} 
                placeholder="2026-27"
                editable={planStatusSelect !== 'Archived'}
              />

              <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>Distribution Mode</Text>
              <View style={[styles.studentsFallbackGrid, { marginBottom: 12 }]}>
                <Pressable 
                  onPress={() => handleDistributionModeChange('A')}
                  disabled={planStatusSelect === 'Archived'}
                  style={[styles.studentSelectPill, { 
                    borderColor: planDistributionMode === 'A' ? '#EF4444' : theme.border,
                    backgroundColor: planDistributionMode === 'A' ? '#EF444415' : 'transparent',
                    opacity: planStatusSelect === 'Archived' && planDistributionMode !== 'A' ? 0.5 : 1
                  }]}
                >
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>Mode A: Automatic</Text>
                </Pressable>
                <Pressable 
                  onPress={() => handleDistributionModeChange('B')}
                  disabled={planStatusSelect === 'Archived'}
                  style={[styles.studentSelectPill, { 
                    borderColor: planDistributionMode === 'B' ? '#EF4444' : theme.border,
                    backgroundColor: planDistributionMode === 'B' ? '#EF444415' : 'transparent',
                    opacity: planStatusSelect === 'Archived' && planDistributionMode !== 'B' ? 0.5 : 1
                  }]}
                >
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>Mode B: Manual</Text>
                </Pressable>
              </View>

              <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>Annual Fee (₹)</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }, (planStatusSelect === 'Archived' || planDistributionMode === 'B') && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                value={planAnnualFee} 
                onChangeText={(val) => {
                  setPlanAnnualFee(cleanNumberInput(val));
                  const cls = classesList.find(c => c.name === planClass);
                  const heads = cls ? cls.feeStructure : null;
                  regenerateInstallmentsWithClass(cleanNumberInput(val), planInstallmentsCount, heads, planDistributionMode);
                }} 
                placeholder="60000"
                keyboardType="numeric"
                editable={planStatusSelect !== 'Archived' && planDistributionMode === 'A'}
              />

              <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>Number of Installments</Text>
              <TextInput 
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                value={planInstallmentsCount} 
                onChangeText={(val) => {
                  handleInstallmentsCountChange(cleanNumberInput(val));
                }} 
                placeholder="3"
                keyboardType="numeric"
                editable={planStatusSelect !== 'Archived'}
              />

              {planDistributionMode === 'B' && (() => {
                const clsObj = classesList.find(c => c.name === planClass);
                if (!clsObj) return null;
                const heads = clsObj.feeStructure || {};
                const warnings: string[] = [];
                const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
                components.forEach(comp => {
                  const classCompAmt = Number(heads[comp]) || 0;
                  const instCompSum = planInstallmentsList.reduce((acc, inst) => acc + (Number(inst.breakdown?.[comp]) || 0), 0);
                  if (Math.abs(classCompAmt - instCompSum) > 0.01) {
                    warnings.push(`⚠️ ${comp.toUpperCase()}: Sum in terms is ₹${instCompSum} (Class requires ₹${classCompAmt})`);
                  }
                });
                if (warnings.length > 0) {
                  return (
                    <View style={{ backgroundColor: '#FFFBEB', padding: 10, borderRadius: 8, marginVertical: 10 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#B45309', marginBottom: 4 }}>Manual Mode Component Sum Mismatches:</Text>
                      {warnings.map((w, i) => <Text key={i} style={{ fontSize: 9, color: '#B45309' }}>{w}</Text>)}
                    </View>
                  );
                }
                return null;
              })()}

              {planInstallmentsList.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text, borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea', paddingBottom: 4, marginBottom: 8 }}>Configure Terms</Text>
                  {planInstallmentsList.map((inst, index) => (
                    <View key={index} style={{ borderBottomWidth: 0.5, borderBottomColor: '#f2f2f7', paddingBottom: 10, marginBottom: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text }}>{inst.name} - Total Term Fee: ₹{inst.amount}</Text>
                      
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Due Date (YYYY-MM-DD)</Text>
                          <TextInput 
                            style={[styles.modalInput, { fontSize: 11, paddingVertical: 4, height: 32, marginBottom: 0, color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                            value={inst.dueDate} 
                            placeholder="YYYY-MM-DD"
                            editable={planStatusSelect !== 'Archived'}
                            onChangeText={(val) => {
                              const updated = [...planInstallmentsList];
                              updated[index].dueDate = val;
                              setPlanInstallmentsList(updated);
                            }}
                          />
                        </View>
                        <View style={{ width: 80 }}>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Grace (Days)</Text>
                          <TextInput 
                            style={[styles.modalInput, { fontSize: 11, paddingVertical: 4, height: 32, marginBottom: 0, color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                            value={String(inst.gracePeriod)} 
                            keyboardType="numeric"
                            editable={planStatusSelect !== 'Archived'}
                            onChangeText={(val) => {
                              const updated = [...planInstallmentsList];
                              updated[index].gracePeriod = Number(cleanNumberInput(val)) || 0;
                              setPlanInstallmentsList(updated);
                            }}
                          />
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', marginTop: 6, marginBottom: 6 }}>
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Late Fee (₹)</Text>
                          <TextInput 
                            style={[styles.modalInput, { fontSize: 11, paddingVertical: 4, height: 32, marginBottom: 0, color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                            value={String(inst.lateFee)} 
                            keyboardType="numeric"
                            editable={planStatusSelect !== 'Archived'}
                            onChangeText={(val) => {
                              const updated = [...planInstallmentsList];
                              updated[index].lateFee = Number(cleanNumberInput(val)) || 0;
                              setPlanInstallmentsList(updated);
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Discount (₹)</Text>
                          <TextInput 
                            style={[styles.modalInput, { fontSize: 11, paddingVertical: 4, height: 32, marginBottom: 0, color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                            value={String(inst.discount)} 
                            keyboardType="numeric"
                            editable={planStatusSelect !== 'Archived'}
                            onChangeText={(val) => {
                              const updated = [...planInstallmentsList];
                              updated[index].discount = Number(cleanNumberInput(val)) || 0;
                              setPlanInstallmentsList(updated);
                            }}
                          />
                        </View>
                      </View>

                      {planDistributionMode === 'B' ? (
                        <View style={{ marginTop: 6, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 8, borderRadius: 8 }}>
                          <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 4, fontWeight: 'bold' }}>Component Breakdowns (Manual Mode):</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'].map(comp => (
                              <View key={comp} style={{ width: '47%' }}>
                                <Text style={{ fontSize: 8, color: theme.textSecondary, textTransform: 'capitalize' }}>{comp} (₹)</Text>
                                <TextInput 
                                  style={[styles.modalInput, { fontSize: 10, paddingVertical: 2, height: 28, marginBottom: 4, color: theme.text, borderColor: theme.border }, planStatusSelect === 'Archived' && { backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6', opacity: 0.8 }]} 
                                  value={String(inst.breakdown?.[comp] || 0)} 
                                  keyboardType="numeric"
                                  editable={planStatusSelect !== 'Archived'}
                                  onChangeText={(val) => {
                                    const updated = [...planInstallmentsList];
                                    if (!updated[index].breakdown) updated[index].breakdown = {};
                                    updated[index].breakdown[comp] = Number(cleanNumberInput(val)) || 0;
                                    
                                    // Recalculate inst.amount
                                    updated[index].amount = Object.values(updated[index].breakdown).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
                                    setPlanInstallmentsList(updated);
                                    
                                    // Recalculate planAnnualFee
                                    const totalPlanSum = updated.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
                                    setPlanAnnualFee(String(totalPlanSum));
                                  }}
                                />
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalActionsRow, { width: '100%', paddingHorizontal: 4 }]}>
              {(() => {
                const clsObj = classesList.find(c => c.name === planClass);
                const isBModeMismatch = planDistributionMode === 'B' && clsObj && (() => {
                  const heads = clsObj.feeStructure || {};
                  const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
                  let mismatch = false;
                  components.forEach(comp => {
                    const classCompAmt = Number(heads[comp]) || 0;
                    const instCompSum = planInstallmentsList.reduce((acc, inst) => acc + (Number(inst.breakdown?.[comp]) || 0), 0);
                    if (Math.abs(classCompAmt - instCompSum) > 0.01) {
                      mismatch = true;
                    }
                  });
                  return mismatch;
                })();

                const isBtnDisabled = submitting || isBModeMismatch;

                if (planStatusSelect === 'Archived') {
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#B91C1C' }}>Archived Template</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable 
                          style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444', justifyContent: 'center' }} 
                          onPress={() => {
                            setShowPlanModal(false);
                            handleDeletePlan(editingPlanId!, planClass);
                          }}
                        >
                          <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '800' }}>Delete</Text>
                        </Pressable>
                        <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowPlanModal(false)}>
                          <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Close</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }

                if (planStatusSelect === 'Published') {
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, width: '100%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={16} color="#10B981" />
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10B981' }}>Published ✓</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowPlanModal(false)}>
                          <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
                        </Pressable>
                        <Pressable 
                          style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444', justifyContent: 'center' }} 
                          onPress={() => handleSavePlan('Archived')}
                          disabled={submitting}
                        >
                          <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '800' }}>Archive</Text>
                        </Pressable>
                        <Pressable 
                          style={[styles.modalSubmitBtn, isBtnDisabled && { backgroundColor: '#A1A1AA' }]} 
                          onPress={() => handleSavePlan('Published')}
                          disabled={isBtnDisabled}
                        >
                          <Text style={styles.modalSubmitBtnText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }

                // Draft status (Default)
                return (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
                    <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowPlanModal(false)}>
                      <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.modalCancelBtn, { borderColor: colors.primary }]} 
                      onPress={() => handleSavePlan('Draft')}
                      disabled={isBtnDisabled}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Save Draft</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.modalSubmitBtn, isBtnDisabled && { backgroundColor: '#A1A1AA' }]} 
                      onPress={() => handleSavePlan('Published')}
                      disabled={isBtnDisabled}
                    >
                      <Text style={styles.modalSubmitBtnText}>{submitting ? 'Publishing...' : 'Publish'}</Text>
                    </Pressable>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= DUE DATE MODAL ================= */}
      <Modal visible={showDueDateModal} transparent animationType="fade" onRequestClose={() => setShowDueDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Extend Due Date</Text>
            {selectedInst && (
              <View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                  Installment: {selectedInst.name} | Current Due: {safeSplitDate(selectedInst.dueDate) || 'N/A'}
                </Text>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>New Due Date (YYYY-MM-DD)</Text>
                <TextInput 
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                  value={newDueDateText}
                  onChangeText={setNewDueDateText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                />
                <View style={styles.modalActionsRow}>
                  <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowDueDateModal(false)}>
                    <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalSubmitBtn} onPress={handleSaveDueDate} disabled={submitting}>
                    <Text style={styles.modalSubmitBtnText}>{submitting ? 'Saving...' : 'Save Extension'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= LATE FEE OVERRIDE MODAL ================= */}
      <Modal visible={showLateFeeModal} transparent animationType="fade" onRequestClose={() => setShowLateFeeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Late Fee Override</Text>
            {selectedInst && (
              <View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                  Installment: {selectedInst.name} | Current Late Fee: ₹{selectedInst.lateFee || 0}
                </Text>
                
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Override Late Fee Amount (₹)</Text>
                <TextInput 
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                  value={newLateFeeText}
                  onChangeText={(val) => setNewLateFeeText(cleanNumberInput(val))}
                  keyboardType="numeric"
                  placeholder="e.g. 50 or 0"
                  placeholderTextColor={theme.textSecondary}
                />

                <Text style={[styles.fieldLabel, { color: theme.text }]}>Override Reason (Mandatory)</Text>
                <TextInput 
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                  value={lateFeeOverrideReason}
                  onChangeText={setLateFeeOverrideReason}
                  placeholder="Reason for late fee change"
                  placeholderTextColor={theme.textSecondary}
                />

                <View style={styles.modalActionsRow}>
                  <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowLateFeeModal(false)}>
                    <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalSubmitBtn} onPress={handleSaveLateFeeOverride} disabled={submitting}>
                    <Text style={styles.modalSubmitBtnText}>{submitting ? 'Saving...' : 'Override Late Fee'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= ADD INTERNAL NOTE MODAL ================= */}
      <Modal visible={showNoteModal} transparent animationType="fade" onRequestClose={() => setShowNoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Internal Note</Text>
            {selectedInst && (
              <View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                  Installment: {selectedInst.name}
                </Text>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Note (Visible only to Admins)</Text>
                <TextInput 
                  style={[styles.modalInput, { color: theme.text, borderColor: theme.border, height: 60 }]}
                  value={instNoteText}
                  onChangeText={setInstNoteText}
                  placeholder="Enter administrative details..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
                <View style={styles.modalActionsRow}>
                  <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowNoteModal(false)}>
                    <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalSubmitBtn} onPress={handleSaveNote} disabled={submitting}>
                    <Text style={styles.modalSubmitBtnText}>{submitting ? 'Saving...' : 'Save Note'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= VIEW HISTORY MODAL ================= */}
      <Modal visible={showInstHistoryModal} transparent animationType="slide" onRequestClose={() => setShowInstHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Payment Log Details</Text>
            {selectedInst && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 12, textAlign: 'center' }}>
                  Installment Name: {selectedInst.name}
                </Text>
                {selectedInst.payments?.map((pay: any, index: number) => (
                  <View key={index} style={{ borderBottomWidth: 0.5, borderBottomColor: theme.border, paddingVertical: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text }}>
                        Receipt: {pay.receiptNumber}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10B981' }}>
                        +₹{pay.amount.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>
                      Method: {pay.paymentMethod} | Date: {new Date(pay.date).toLocaleString()}
                    </Text>
                    {pay.remarks ? (
                      <Text style={{ fontSize: 9, color: theme.textSecondary, fontStyle: 'italic', marginTop: 2 }}>
                        Remarks: {pay.remarks}
                      </Text>
                    ) : null}
                  </View>
                ))}
                
                <Pressable 
                  style={[{
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 16
                  }]} 
                  onPress={() => setShowInstHistoryModal(false)}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Close Log</Text>
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
  cloneTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  cloneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6F42C1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cloneBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
  },
  statBox: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  tabSelector: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  tabSelectorItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCollectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionCollectBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  ledgerName: {
    fontSize: 11,
    fontWeight: '800',
  },
  ledgerVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 10,
  },
  studentsFallbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  studentSelectPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  modalInput: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  receiptTicket: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F8FAFC',
    marginVertical: 10,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1E293B',
  },
  receiptSubtitle: {
    fontSize: 8,
    textAlign: 'center',
    color: '#64748B',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
    borderStyle: 'dashed' as any,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptDetailLbl: {
    fontSize: 10,
    color: '#475569',
  },
  receiptDetailVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF444415',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  defaulterActionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 6,
  },
  defBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  receiptActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  }
});
