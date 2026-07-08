import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { 
  cleanNameInput, cleanPhoneInput, cleanNumberInput, 
  validateName, validatePhone, validateEmail, validateDOB, validatePassword 
} from '../../services/validation';
import { ArrowLeft, LogOut, ShieldCheck, Plus, Trash2, Zap, Clock, Edit3 } from 'lucide-react-native';

interface AdminProfileProps {
  onNavigate: (tab: string) => void;
  onSyncAllPortals: () => void;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ onNavigate, onSyncAllPortals }) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'settings' | 'classes' | 'promote' | 'logs' | 'principals'>('profile');

  // Classes & Section manager states
  const [classesList, setClassesList] = useState<any[]>([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('Class I');
  const [newClassSection, setNewClassSection] = useState('A');
  const [newClassCapacity, setNewClassCapacity] = useState('40');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classFeeBreakdown, setClassFeeBreakdown] = useState<{[key: string]: number}>({
    admission: 0,
    tuition: 0,
    books: 0,
    hostel: 0,
    transport: 0,
    uniform: 0,
    exam: 0,
    other: 0
  });

  // Promotion Wizard states
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');

  // Settings form states
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [schoolName, setSchoolName] = useState('Vidya Bharathi Vidyapeeth');
  const [schoolMotto, setSchoolMotto] = useState('विद्या ददाति विनयम');
  const [udiseCode, setUdiseCode] = useState('36161101901');
  const [affiliationNumber, setAffiliationNumber] = useState('3630042');
  const [schoolBoard, setSchoolBoard] = useState('State Board');
  const [schoolAddress, setSchoolAddress] = useState('Village: Palsi, Mandal: Kubeer, District: Nirmal, Telangana - 504103');
  const [schoolPhone, setSchoolPhone] = useState('+91 99483 70709');
  const [schoolEmail, setSchoolEmail] = useState('info@vbvschool.edu.in');
  const [schoolWebsite, setSchoolWebsite] = useState('www.vbvschool.edu.in');
  const [principalName, setPrincipalName] = useState('Not Assigned');
  const [reportCardFooter, setReportCardFooter] = useState('Designed by Vidya Bharathi Vidyapeeth');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for your payment. Keep this receipt for reference.');

  // System logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Principal Manager states
  const [principalsList, setPrincipalsList] = useState<any[]>([]);
  const [principalsLoading, setPrincipalsLoading] = useState(false);
  const [showPrincipalModal, setShowPrincipalModal] = useState(false);
  const [editingPrincipalId, setEditingPrincipalId] = useState<string | null>(null);
  
  const [principalEmpId, setPrincipalEmpId] = useState('');
  const [principalNameVal, setPrincipalNameVal] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');
  const [principalQual, setPrincipalQual] = useState('');
  const [principalExp, setPrincipalExp] = useState('');
  const [principalDesignation, setPrincipalDesignation] = useState('Principal');
  const [principalAddress, setPrincipalAddress] = useState('');

  const [principalDob, setPrincipalDob] = useState('1980-01-01');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const nameRef = React.useRef<any>(null);
  const emailRef = React.useRef<any>(null);
  const phoneRef = React.useRef<any>(null);
  const dobRef = React.useRef<any>(null);
  const passwordRef = React.useRef<any>(null);

  const handleNameChange = (val: string) => {
    const cleaned = cleanNameInput(val);
    setPrincipalNameVal(cleaned);
    setErrors(prev => ({ ...prev, name: validateName(cleaned, 'Principal Name') }));
  };

  const handleEmailChange = (val: string) => {
    setPrincipalEmail(val);
    setErrors(prev => ({ ...prev, email: validateEmail(val, 'Principal Email') }));
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = cleanPhoneInput(val);
    setPrincipalPhone(cleaned);
    setErrors(prev => ({ ...prev, phone: validatePhone(cleaned, 'Principal Phone') }));
  };

  const handleDobChange = (val: string) => {
    const cleaned = val.replace(/[^0-9-]/g, '').slice(0, 10);
    setPrincipalDob(cleaned);
    setErrors(prev => ({ ...prev, dob: validateDOB(cleaned, 'principal') }));
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPasswordVal(val);
    setErrors(prev => ({ ...prev, password: validatePassword(val) }));
  };

  // Password reset state
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordPrincipalId, setResetPasswordPrincipalId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  const loadPrincipals = async () => {
    setPrincipalsLoading(true);
    try {
      const res = await api.get('/admin/principals');
      setPrincipalsList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPrincipalsLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, classesRes] = await Promise.all([
        api.get('/admin/settings').catch(() => null),
        api.get('/admin/classes').catch(() => ({ data: [] }))
      ]);

      if (settingsRes && settingsRes.data) {
        const s = settingsRes.data;
        setAcademicYear(s.academicYear || '2026-27');
        setSchoolName(s.schoolName || 'Vidya Bharathi Vidyapeeth');
        setSchoolMotto(s.schoolMotto || 'विद्या ददाति विनयम');
        setUdiseCode(s.udiseCode || '36161101901');
        setAffiliationNumber(s.affiliationNumber || '3630042');
        setSchoolBoard(s.schoolBoard || 'State Board');
        setSchoolAddress(s.schoolAddress || 'Village: Palsi, Mandal: Kubeer, District: Nirmal, Telangana - 504103');
        setSchoolPhone(s.schoolPhone || '+91 99483 70709');
        setSchoolEmail(s.schoolEmail || 'info@vbvschool.edu.in');
        setSchoolWebsite(s.schoolWebsite || 'www.vbvschool.edu.in');
        setPrincipalName(s.principalName || 'Not Assigned');
        setReportCardFooter(s.reportCardFooter || 'Designed by Vidya Bharathi Vidyapeeth');
        setReceiptFooter(s.receiptFooter || 'Thank you for your payment. Keep this receipt for reference.');
      }

      setClassesList(classesRes.data || []);
      if (classesRes.data && classesRes.data.length > 0) {
        setFromClassId(classesRes.data[0]._id);
        setToClassId(classesRes.data[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'logs') {
      loadAuditLogs();
    } else if (activeSubTab === 'principals') {
      loadPrincipals();
    }
  }, [activeSubTab]);

  const resetPrincipalForm = () => {
    setEditingPrincipalId(null);
    const nextEmpId = `PRN-${new Date().getFullYear()}-${String(principalsList.length + 1).padStart(3, '0')}`;
    setPrincipalEmpId(nextEmpId);
    setPrincipalNameVal('');
    setPrincipalEmail('');
    setPrincipalPhone('');
    setPrincipalQual('');
    setPrincipalExp('');
    setPrincipalDesignation('Principal');
    setPrincipalAddress('');
    setPrincipalDob('1980-01-01');
    setErrors({});
  };

  const openEditPrincipal = (p: any) => {
    setEditingPrincipalId(p._id);
    setPrincipalEmpId(p.employeeId);
    setPrincipalNameVal(p.name);
    setPrincipalEmail(p.email);
    setPrincipalPhone(p.phone);
    setPrincipalQual(p.qualification || '');
    setPrincipalExp(p.experience || '');
    setPrincipalDesignation(p.designation || 'Principal');
    setPrincipalAddress(p.address || '');
    setPrincipalDob(p.dob ? p.dob.split('T')[0] : '1980-01-01');
    setErrors({});
    setShowPrincipalModal(true);
  };

  const handleSavePrincipal = async () => {
    const nameErr = validateName(principalNameVal, 'Principal Name');
    const emailErr = validateEmail(principalEmail, 'Principal Email');
    const phoneErr = validatePhone(principalPhone, 'Principal Phone');
    const dobErr = validateDOB(principalDob, 'principal');

    const newErrors = {
      name: nameErr,
      email: emailErr,
      phone: phoneErr,
      dob: dobErr
    };

    setErrors(newErrors);

    if (nameErr) {
      nameRef.current?.focus();
      return;
    }
    if (emailErr) {
      emailRef.current?.focus();
      return;
    }
    if (phoneErr) {
      phoneRef.current?.focus();
      return;
    }
    if (dobErr) {
      dobRef.current?.focus();
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        employeeId: principalEmpId,
        name: principalNameVal,
        email: principalEmail,
        phone: principalPhone,
        qualification: principalQual,
        experience: principalExp,
        designation: principalDesignation,
        address: principalAddress,
        dob: principalDob
      };

      if (editingPrincipalId) {
        await api.put(`/admin/principals/${editingPrincipalId}`, payload);
        alert('Principal profile updated successfully.');
      } else {
        await api.post('/admin/principals', payload);
        alert('Principal registered. Awaiting Administrator approval.');
      }
      setShowPrincipalModal(false);
      resetPrincipalForm();
      loadPrincipals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save principal details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrincipal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Principal profile?')) return;
    try {
      await api.delete(`/admin/principals/${id}`);
      alert('Principal profile deleted.');
      loadPrincipals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete principal.');
    }
  };

  const handleStatusAction = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
    if (!confirm(`Are you sure you want to ${action} this Principal?`)) return;
    try {
      const res = await api.post(`/admin/principals/${id}/${action}`);
      alert(res.data.message || `Principal status set to ${action}d.`);
      
      if (action === 'approve' && res.data.credentials) {
        alert(`Account Login Created!\nUsername: ${res.data.credentials.username}\nPassword: ${res.data.credentials.password}`);
      }
      
      loadPrincipals();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to change status.`);
    }
  };

  const handleResetPassword = async () => {
    const err = validatePassword(newPasswordVal);
    if (err) {
      setErrors(prev => ({ ...prev, password: err }));
      passwordRef.current?.focus();
      return;
    }
    try {
      await api.post(`/admin/principals/${resetPasswordPrincipalId}/reset-password`, { newPassword: newPasswordVal });
      alert('Principal password reset successfully.');
      setShowResetPasswordModal(false);
      setNewPasswordVal('');
      setResetPasswordPrincipalId(null);
      setErrors({});
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleSaveSettings = async () => {
    setSubmitting(true);
    try {
      const payload = {
        academicYear,
        schoolName,
        schoolMotto,
        udiseCode,
        affiliationNumber,
        schoolBoard,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        schoolWebsite,
        principalName,
        reportCardFooter,
        receiptFooter
      };

      await api.post('/admin/settings', payload);
      alert('School settings updated and propagated successfully.');
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddClass = () => {
    setEditingClassId(null);
    setNewClassName('Class I');
    setNewClassSection('A');
    setNewClassCapacity('40');
    setClassFeeBreakdown({
      admission: 0,
      tuition: 0,
      books: 0,
      hostel: 0,
      transport: 0,
      uniform: 0,
      exam: 0,
      other: 0
    });
    setShowAddClassModal(true);
  };

  const openEditClass = (c: any) => {
    setEditingClassId(c._id);
    setNewClassName(c.name);
    setNewClassSection(c.section);
    setNewClassCapacity(String(c.maxCapacity));
    const fees = c.feeStructure || {};
    setClassFeeBreakdown({
      admission: fees.admission || 0,
      tuition: fees.tuition || 0,
      books: fees.books || 0,
      hostel: fees.hostel || 0,
      transport: fees.transport || 0,
      uniform: fees.uniform || 0,
      exam: fees.exam || 0,
      other: fees.other || 0
    });
    setShowAddClassModal(true);
  };

  const handleCreateClass = async () => {
    if (!newClassName || !newClassSection) return alert('Name and section are required.');
    setSubmitting(true);
    try {
      const payload = {
        name: newClassName,
        section: newClassSection,
        maxCapacity: Number(newClassCapacity),
        feeStructure: classFeeBreakdown
      };

      if (editingClassId) {
        await api.put(`/admin/classes/${editingClassId}`, payload);
        alert('Class configuration updated.');
      } else {
        await api.post('/admin/classes', payload);
        alert('New class/section configured.');
      }
      setShowAddClassModal(false);
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    setSubmitting(true);
    try {
      await api.delete(`/admin/classes/${id}`);
      alert('Class deleted successfully.');
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoteAction = async () => {
    if (!fromClassId || !toClassId || fromClassId === toClassId) {
      return alert('Select distinct source and target classes for promotion.');
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/promote', { fromClassId, toClassId });
      alert(`Promotion Complete: Promoted ${res.data.promoteCount} students successfully.`);
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger promotions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Settings & Profile</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Class manager, promotion wizard, system audit logs, and parameters</Text>
          </View>
        </View>

        {/* Tab row navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabsRow}>
          {[
            { id: 'profile', label: 'My Profile' },
            { id: 'settings', label: 'School Settings' },
            { id: 'classes', label: 'Class Manager' },
            { id: 'promote', label: 'Promotion Wizard' },
            { id: 'logs', label: 'System Logs' },
            { id: 'principals', label: 'Principal Manager' }
          ].map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveSubTab(tab.id as any)}
              style={[styles.subTabPill, {
                backgroundColor: activeSubTab === tab.id ? '#EF4444' : theme.surface,
                borderColor: activeSubTab === tab.id ? '#EF4444' : theme.border,
                marginRight: 6
              }]}
            >
              <Text style={{ fontSize: 9, fontWeight: '800', color: activeSubTab === tab.id ? '#ffffff' : theme.text }}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ================= TAB 1: PROFILE VIEW ================= */}
        {activeSubTab === 'profile' && (
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarCircle}>
                <ShieldCheck size={28} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.profileName, { color: theme.text }]}>Ramanujam Acharya</Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>Chief Administrator | ID: ADM001</Text>
              </View>
              <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                <LogOut size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 9, color: '#ffffff', fontWeight: '800' }}>Logout</Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* ================= TAB 2: GLOBAL SCHOOL SETTINGS ================= */}
        {activeSubTab === 'settings' && (
          <Card style={{ padding: 14 }}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Academic Year</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={academicYear} onChangeText={setAcademicYear} placeholder="e.g. 2026-27" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>School Name</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolName} onChangeText={setSchoolName} placeholder="School Name" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>School Motto (HINDI / ENGLISH)</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolMotto} onChangeText={setSchoolMotto} placeholder="Motto" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>School UDISE Code</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={udiseCode} onChangeText={setUdiseCode} placeholder="UDISE Code" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Affiliation Number</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={affiliationNumber} onChangeText={setAffiliationNumber} placeholder="Affiliation" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>School Board</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolBoard} onChangeText={setSchoolBoard} placeholder="Board" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>School Address</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolAddress} onChangeText={setSchoolAddress} placeholder="Address" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>School Phone Contact</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolPhone} onChangeText={setSchoolPhone} placeholder="Phone" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Official Email</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolEmail} onChangeText={setSchoolEmail} placeholder="Email" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Website URL</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={schoolWebsite} onChangeText={setSchoolWebsite} placeholder="Website" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Principal Name</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={principalName} onChangeText={setPrincipalName} placeholder="Principal Name" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Report Card Footer Label</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={reportCardFooter} onChangeText={setReportCardFooter} placeholder="Report Card Footer" placeholderTextColor={theme.textSecondary} />

            <Text style={[styles.fieldLabel, { color: theme.text }]}>Fee Receipt Footer Label</Text>
            <TextInput style={[styles.inputBox, { color: theme.text, borderColor: theme.border }]} value={receiptFooter} onChangeText={setReceiptFooter} placeholder="Receipt Footer" placeholderTextColor={theme.textSecondary} />

            <Pressable onPress={handleSaveSettings} style={styles.actionSaveBtn} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.actionSaveBtnText}>Save Configurations</Text>}
            </Pressable>
          </Card>
        )}

        {/* ================= TAB 3: DYNAMIC CLASS & SECTION MANAGER ================= */}
        {activeSubTab === 'classes' && (
          <View>
            <Pressable onPress={openAddClass} style={styles.addClassTrigger}>
              <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>Add Dynamic Class / Section</Text>
            </Pressable>

            {classesList.map(c => (
              <Card key={c._id} style={styles.classRecordCard}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: theme.text, fontWeight: '800' }}>{c.name} - Section {c.section}</Text>
                  <Text style={{ fontSize: 9, color: theme.textSecondary }}>Max Capacity: {c.maxCapacity} | Strength: {c.approvedCount || 0}</Text>
                  {c.feeStructure ? (
                    <Text style={{ fontSize: 8, color: '#10B981', fontWeight: 'bold', marginTop: 2 }}>
                      Annual Fees Configured: ₹{String(Object.values(c.feeStructure).reduce((s: number, v: any) => s + (Number(v) || 0), 0))}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable onPress={() => openEditClass(c)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#3B82F610', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit3 size={16} color="#3B82F6" />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteClass(c._id)} style={styles.deleteClassBtn} disabled={submitting}>
                    <Trash2 size={16} color="#DC3545" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ================= TAB 4: PROMOTION WIZARD ================= */}
        {activeSubTab === 'promote' && (
          <Card style={{ padding: 14 }}>
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 12 }}>Select the source and target classes to auto-promote active students, reset attendance registers, and clone dynamic fees structures.</Text>
            
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Promote From Class</Text>
            <View style={styles.classesSelectorGrid}>
              {classesList.map(c => (
                <Pressable
                  key={c._id}
                  onPress={() => setFromClassId(c._id)}
                  style={[styles.classCapacityPill, { 
                    borderColor: fromClassId === c._id ? '#EF4444' : theme.border,
                    backgroundColor: fromClassId === c._id ? '#EF444415' : 'transparent'
                  }]}
                >
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>{c.name} - {c.section}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 10 }]}>Promote To Target Class</Text>
            <View style={styles.classesSelectorGrid}>
              {classesList.map(c => (
                <Pressable
                  key={c._id}
                  onPress={() => setToClassId(c._id)}
                  style={[styles.classCapacityPill, { 
                    borderColor: toClassId === c._id ? '#EF4444' : theme.border,
                    backgroundColor: toClassId === c._id ? '#EF444415' : 'transparent'
                  }]}
                >
                  <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>{c.name} - {c.section}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handlePromoteAction} style={[styles.actionSaveBtn, { backgroundColor: '#6F42C1', marginTop: 16 }]} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#ffffff" size="small" /> : (
                <>
                  <Zap size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.actionSaveBtnText}>Execute Promotion Wizard</Text>
                </>
              )}
            </Pressable>
          </Card>
        )}

        {/* ================= TAB 5: SYSTEM AUDIT LOGS ================= */}
        {activeSubTab === 'logs' && (
          <Card style={{ padding: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 12 }}>System Activity Audit Logs</Text>
            {logsLoading ? (
              <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 20 }} />
            ) : auditLogs.length === 0 ? (
              <EmptyState
                title="System Logs"
                message="No activity logs recorded."
                iconName="Clock"
              />
            ) : (
              auditLogs.map((log: any) => (
                <View key={log._id} style={styles.logRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Clock size={12} color="#EF4444" />
                    <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>{log.action}</Text>
                    <Text style={{ fontSize: 8, color: theme.textSecondary, marginLeft: 'auto' }}>{new Date(log.timestamp).toLocaleString()}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Performed by: {log.user} | Details: {log.details}</Text>
                </View>
              ))
            )}
          </Card>
        )}

        {/* ================= TAB 6: PRINCIPALS MANAGER ================= */}
        {activeSubTab === 'principals' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Principals Registry</Text>
              <Pressable
                onPress={() => {
                  resetPrincipalForm();
                  setShowPrincipalModal(true);
                }}
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>+ Add Principal</Text>
              </Pressable>
            </View>

            {principalsLoading ? (
              <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 20 }} />
            ) : principalsList.length === 0 ? (
              <EmptyState
                title="Principal Manager"
                message="No principal accounts registered yet."
                iconName="Users"
              />
            ) : (
              <View>
                {principalsList.map((p) => {
                  const statusColors = {
                    'Approved': { bg: '#10B98115', text: '#10B981' },
                    'Pending Approval': { bg: '#F59E0B15', text: '#F59E0B' },
                    'Rejected': { bg: '#DC354515', text: '#DC3545' },
                    'Suspended': { bg: '#64748B15', text: '#64748B' }
                  };
                  const colorsObj = (statusColors as any)[p.status] || { bg: '#E2E8F0', text: '#64748B' };

                  return (
                    <Card key={p._id} style={{ padding: 14, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>{p.name}</Text>
                          <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 2 }}>
                            Emp ID: {p.employeeId} | {p.designation}
                          </Text>
                          <Text style={{ fontSize: 8, color: theme.textSecondary }}>
                            Email: {p.email} | Phone: {p.phone}
                          </Text>
                          {p.qualification || p.experience ? (
                            <Text style={{ fontSize: 8, color: theme.textSecondary }}>
                              Qual: {p.qualification || 'N/A'} | Exp: {p.experience || 'N/A'}
                            </Text>
                          ) : null}
                          {p.address ? (
                            <Text style={{ fontSize: 8, color: theme.textSecondary, fontStyle: 'italic' }}>
                              Address: {p.address}
                            </Text>
                          ) : null}
                        </View>
                        
                        <View style={[styles.statusBadge, { backgroundColor: colorsObj.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }]}>
                          <Text style={{ fontSize: 8, fontWeight: '800', color: colorsObj.text }}>
                            {p.status}
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons row */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
                        {p.status === 'Pending Approval' && (
                          <>
                            <Pressable onPress={() => handleStatusAction(p._id, 'approve')} style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800' }}>✔ Approve</Text>
                            </Pressable>
                            <Pressable onPress={() => handleStatusAction(p._id, 'reject')} style={{ backgroundColor: '#DC3545', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800' }}>❌ Reject</Text>
                            </Pressable>
                          </>
                        )}
                        {p.status === 'Approved' && (
                          <>
                            <Pressable onPress={() => handleStatusAction(p._id, 'suspend')} style={{ backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800' }}>⏸ Suspend</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setResetPasswordPrincipalId(p._id);
                                setNewPasswordVal('');
                                setShowResetPasswordModal(true);
                              }}
                              style={{ backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}
                            >
                              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800' }}>🔑 Reset Password</Text>
                            </Pressable>
                          </>
                        )}
                        {(p.status === 'Suspended' || p.status === 'Rejected') && (
                          <Pressable onPress={() => handleStatusAction(p._id, 'approve')} style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800' }}>✔ Approve / Reactivate</Text>
                          </Pressable>
                        )}

                        <Pressable onPress={() => openEditPrincipal(p)} style={{ borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                          <Text style={{ color: theme.text, fontSize: 8, fontWeight: '800' }}>✏️ Edit</Text>
                        </Pressable>

                        <Pressable onPress={() => handleDeletePrincipal(p._id)} style={{ borderWidth: 1, borderColor: '#DC3545', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                          <Text style={{ color: '#DC3545', fontSize: 8, fontWeight: '800' }}>🗑 Delete</Text>
                        </Pressable>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* ================= ADD CLASS/SECTION MODAL ================= */}
      <Modal visible={showAddClassModal} transparent animationType="slide" onRequestClose={() => setShowAddClassModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingClassId ? '✏️ Edit Class & Fees' : 'Configure Class & Section'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Class Level Name</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={newClassName} onChangeText={setNewClassName} placeholder="e.g. Class I" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Section Name</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={newClassSection} onChangeText={setNewClassSection} placeholder="e.g. A" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Maximum Seat Capacity</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={newClassCapacity} onChangeText={(val) => setNewClassCapacity(cleanNumberInput(val))} placeholder="e.g. 40" keyboardType="numeric" placeholderTextColor={theme.textSecondary} />

              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginTop: 14, marginBottom: 8, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
                💰 Configure Fee Structure (Annual)
              </Text>

              {['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'].map(head => (
                <View key={head} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, color: theme.text, textTransform: 'capitalize', flex: 1 }}>{head} Fee (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, { width: 120, marginBottom: 0, height: 32, paddingVertical: 4, color: theme.text, borderColor: theme.border }]}
                    value={String(classFeeBreakdown[head] ?? 0)}
                    onChangeText={(val) => {
                      const cleaned = cleanNumberInput(val);
                      const num = cleaned === '' ? 0 : (Number(cleaned) || 0);
                      setClassFeeBreakdown(prev => ({ ...prev, [head]: num }));
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              ))}

              <View style={{ marginTop: 12, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>Total Annual Fee:</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981' }}>
                  ₹ {Object.values(classFeeBreakdown).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowAddClassModal(false)}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleCreateClass} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>{editingClassId ? 'Save Changes' : 'Create configuration'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= PRINCIPAL REGISTRATION/EDIT MODAL ================= */}
      <Modal visible={showPrincipalModal} transparent animationType="slide" onRequestClose={() => setShowPrincipalModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingPrincipalId ? '✏️ Edit Principal Profile' : 'Onboard Principal'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Employee ID</Text>
              <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value={principalEmpId} editable={false} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Full Name</Text>
              <TextInput 
                ref={nameRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.name ? '#DC3545' : theme.border }]} 
                value={principalNameVal} 
                onChangeText={handleNameChange} 
                placeholder="Principal Name" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Email Address</Text>
              <TextInput 
                ref={emailRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.email ? '#DC3545' : theme.border }]} 
                value={principalEmail} 
                onChangeText={handleEmailChange} 
                placeholder="principal@vbvschool.edu.in" 
                keyboardType="email-address" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone Number</Text>
              <TextInput 
                ref={phoneRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.phone ? '#DC3545' : theme.border }]} 
                value={principalPhone} 
                onChangeText={handlePhoneChange} 
                placeholder="Mobile Number" 
                keyboardType="phone-pad" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput 
                ref={dobRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.dob ? '#DC3545' : theme.border }]} 
                value={principalDob} 
                onChangeText={handleDobChange} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Qualifications</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={principalQual} onChangeText={setPrincipalQual} placeholder="e.g. Ph.D, M.Ed" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Experience</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={principalExp} onChangeText={setPrincipalExp} placeholder="e.g. 10 years as VP" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Designation</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={principalDesignation} onChangeText={setPrincipalDesignation} placeholder="e.g. Principal / Director" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Address</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={principalAddress} onChangeText={setPrincipalAddress} placeholder="Residential Address" placeholderTextColor={theme.textSecondary} />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowPrincipalModal(false)}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleSavePrincipal} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>{editingPrincipalId ? '✔ Save Changes' : 'Onboard Principal'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= PRINCIPAL RESET PASSWORD MODAL ================= */}
      <Modal visible={showResetPasswordModal} transparent animationType="slide" onRequestClose={() => setShowResetPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>🔑 Reset Principal Password</Text>

            <Text style={[styles.fieldLabel, { color: theme.text }]}>New Password</Text>
            <TextInput 
              ref={passwordRef}
              style={[styles.modalInput, { color: theme.text, borderColor: errors.password ? '#DC3545' : theme.border }]} 
              secureTextEntry 
              value={newPasswordVal} 
              onChangeText={handleNewPasswordChange} 
              placeholder="Enter New Password" 
              placeholderTextColor={theme.textSecondary} 
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowResetPasswordModal(false)}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleResetPassword}>
                <Text style={styles.modalSubmitBtnText}>Reset Password</Text>
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
  subTabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  subTabPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EF444415',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 6,
  },
  inputBox: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 10,
  },
  actionSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  actionSaveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  addClassTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  classRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 10,
  },
  deleteClassBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DC354510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classesSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  classCapacityPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
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
  logRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 9,
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '800',
  }
});
