import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { 
  cleanNameInput, cleanPhoneInput, cleanAadhaarInput, cleanNumberInput, 
  validateName, validatePhone, validateAadhaar, validateEmail, validateDOB 
} from '../../services/validation';
import { 
  Search, Plus, ShieldAlert, ArrowLeft, Trash2, Key, 
  ToggleLeft, ToggleRight, Camera, DollarSign, Calendar, FileText 
} from 'lucide-react-native';

interface AdminTeachersProps {
  onNavigate: (tab: string) => void;
  onSyncAllPortals: () => void;
}

type SubTab = 'registry' | 'salary' | 'history';

export const AdminTeachers: React.FC<AdminTeachersProps> = ({ onNavigate, onSyncAllPortals }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('registry');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [profileTab, setProfileTab] = useState<'details' | 'salary'>('details');

  // Master lists
  const [teachers, setTeachers] = useState<any[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Salary History Filters states
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth] = useState('');
  const [historyStatus, setHistoryStatus] = useState('All');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');

  // Form states (Add Teacher)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [department, setDepartment] = useState('Academics');
  const [experience, setExperience] = useState('3 years');
  const [designation, setDesignation] = useState('TGT Teacher');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [salaryType, setSalaryType] = useState<'Monthly' | 'Daily Wage' | 'Contract'>('Monthly');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowance, setAllowance] = useState('');
  const [address, setAddress] = useState('');

  const [dob, setDob] = useState('1990-01-01');
  const [aadhaar, setAadhaar] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const nameRef = React.useRef<any>(null);
  const emailRef = React.useRef<any>(null);
  const phoneRef = React.useRef<any>(null);
  const basicSalaryRef = React.useRef<any>(null);
  const allowanceRef = React.useRef<any>(null);
  const aadhaarRef = React.useRef<any>(null);
  const dobRef = React.useRef<any>(null);

  const handleNameChange = (val: string) => {
    const cleaned = cleanNameInput(val);
    setName(cleaned);
    setErrors(prev => ({ ...prev, name: validateName(cleaned, 'Teacher Name') }));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrors(prev => ({ ...prev, email: validateEmail(val, 'Teacher Email') }));
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = cleanPhoneInput(val);
    setPhone(cleaned);
    setErrors(prev => ({ ...prev, phone: validatePhone(cleaned, 'Teacher Phone') }));
  };

  const handleDobChange = (val: string) => {
    const cleaned = val.replace(/[^0-9-]/g, '').slice(0, 10);
    setDob(cleaned);
    setErrors(prev => ({ ...prev, dob: validateDOB(cleaned, 'teacher') }));
  };

  const handleAadhaarChange = (val: string) => {
    const cleaned = cleanAadhaarInput(val);
    setAadhaar(cleaned);
    setErrors(prev => ({ ...prev, aadhaar: validateAadhaar(cleaned, 'Teacher Aadhaar') }));
  };

  const handleBasicSalaryChange = (val: string) => {
    const cleaned = cleanNumberInput(val);
    setBasicSalary(cleaned);
  };

  const handleAllowanceChange = (val: string) => {
    const cleaned = cleanNumberInput(val);
    setAllowance(cleaned);
  };

  // Editing and Class assignment states
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherStatus, setTeacherStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editTeacherIdVal, setEditTeacherIdVal] = useState('');
  const [classesList, setClassesList] = useState<any[]>([]);
  const [assignedClass, setAssignedClass] = useState('');

  // Pay Salary Form states
  const [payTeacherId, setPayTeacherId] = useState('');
  const [payTeacherName, setPayTeacherName] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payMonth, setPayMonth] = useState('');
  const [payReference, setPayReference] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [payDate, setPayDate] = useState('');

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const [res, classesRes] = await Promise.all([
        api.get('/admin/reports?type=teachers'),
        api.get('/admin/classes').catch(() => ({ data: [] }))
      ]);
      const teachersList = res.data || [];
      setTeachers(teachersList);
      setClassesList(classesRes.data || []);

      // Generate consolidated history ledger
      const historyTemp: any[] = [];
      teachersList.forEach((t: any) => {
        if (t.salaryPayments) {
          t.salaryPayments.forEach((p: any) => {
            historyTemp.push({
              id: p._id,
              teacherId: t._id,
              teacherName: t.name,
              employeeId: t.teacherId,
              department: t.department,
              salaryMonth: p.salaryMonth,
              amountPaid: p.amount,
              paymentMethod: p.paymentMethod,
              date: p.date,
              paidBy: p.paidBy || 'ADMIN',
              remarks: p.remarks,
              referenceNumber: p.referenceNumber,
              status: t.salaryStatus
            });
          });
        }
      });
      // Sort payments descending by date
      setSalaryHistory(historyTemp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleSelectPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setSelectedFile(file);
      }
    };
    input.click();
  };

  const handleDeletePhoto = () => {
    setPhotoPreview(null);
    setSelectedFile(null);
  };

  const openEditTeacher = (teacher: any) => {
    setEditingTeacherId(teacher._id);
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setQualification(teacher.qualification);
    setDepartment(teacher.department || 'Academics');
    setExperience(teacher.experience || '3 years');
    setDesignation(teacher.designation || 'TGT Teacher');
    setPhotoPreview(teacher.photo ? `http://localhost:5001${teacher.photo}` : null);
    setSelectedFile(null);
    setSalaryType(teacher.salaryType || 'Monthly');
    setBasicSalary(String(teacher.basicSalary || ''));
    setAllowance(String(teacher.allowance || ''));
    setAddress(teacher.address || '');
    setDob(teacher.dob ? teacher.dob.split('T')[0] : '1990-01-01');
    setAadhaar(teacher.aadhaar || '');
    setTeacherStatus(teacher.status || 'Active');
    setEditTeacherIdVal(teacher.teacherId || '');
    setAssignedClass(teacher.assignedClass?._id || teacher.assignedClass || '');
    setShowAddModal(true);
  };

  const handleAddTeacher = async () => {
    // Validate fields
    const nameErr = validateName(name, 'Teacher Name');
    const emailErr = validateEmail(email, 'Teacher Email');
    const phoneErr = validatePhone(phone, 'Teacher Phone');
    const dobErr = validateDOB(dob, 'teacher');
    const aadhaarErr = aadhaar ? validateAadhaar(aadhaar, 'Teacher Aadhaar') : null;

    const newErrors = {
      name: nameErr,
      email: emailErr,
      phone: phoneErr,
      dob: dobErr,
      aadhaar: aadhaarErr
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
    if (aadhaarErr) {
      aadhaarRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      let uploadedPhotoPath = photoPreview && photoPreview.startsWith('http') ? photoPreview.replace('http://localhost:5001', '') : '';
      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        const uploadRes = await api.post('/admin/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedPhotoPath = uploadRes.data.filePath;
      }

      const basicNum = Number(basicSalary) || 0;
      const allowanceNum = Number(allowance) || 0;
      const totalSal = basicNum + allowanceNum;

      const payload: any = { 
        name, 
        email, 
        phone, 
        qualification,
        department,
        experience,
        designation,
        photo: uploadedPhotoPath,
        salaryType,
        basicSalary: basicNum,
        allowance: allowanceNum,
        totalSalary: totalSal,
        address,
        assignedClass: assignedClass || null,
        dob,
        aadhaar: aadhaar || undefined
      };

      if (editingTeacherId) {
        payload.status = teacherStatus;
        payload.teacherId = editTeacherIdVal;
        await api.put(`/admin/teacher/${editingTeacherId}`, payload);
        alert('Teacher profile updated successfully.');
      } else {
        await api.post('/admin/teacher', payload);
        alert('Teacher onboarded successfully.');
      }
      
      setShowAddModal(false);
      resetForm();
      loadTeachers();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit teacher details.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingTeacherId(null);
    setTeacherStatus('Active');
    setEditTeacherIdVal('');
    setAssignedClass('');
    setName('');
    setEmail('');
    setPhone('');
    setQualification('');
    setDepartment('Academics');
    setExperience('3 years');
    setDesignation('TGT Teacher');
    setPhotoPreview(null);
    setSelectedFile(null);
    setSalaryType('Monthly');
    setBasicSalary('');
    setAllowance('');
    setAddress('');
    setDob('1990-01-01');
    setAadhaar('');
    setErrors({});
  };

  const openPaySalary = (teacher: any) => {
    const currentMonthStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    setPayTeacherId(teacher._id);
    setPayTeacherName(teacher.name);
    setPayAmount(String(teacher.remainingSalary || teacher.totalSalary || 0));
    setPayMonth(currentMonthStr);
    setPayMethod('UPI');
    setPayReference('');
    setPayRemarks('');
    setPayDate(new Date().toISOString().split('T')[0]);
    setShowPayModal(true);
  };

  const handlePaySalarySubmit = async () => {
    if (!payAmount || Number(payAmount) <= 0 || !payMonth) {
      return alert('Enter a valid amount and salary cycle month.');
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payReference,
        remarks: payRemarks,
        salaryMonth: payMonth
      };

      await api.post(`/admin/teacher/${payTeacherId}/pay-salary`, payload);
      alert(`Salary payment recorded for ${payTeacherName}.`);
      setShowPayModal(false);
      loadTeachers();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register payroll payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (teacher: any) => {
    const nextStatus = teacher.status === 'Active' ? 'Inactive' : 'Active';
    setSubmitting(true);
    try {
      await api.put(`/admin/teacher/${teacher._id}`, { status: nextStatus });
      alert(`Teacher account status set to: ${nextStatus}`);
      setSelectedTeacher(null);
      loadTeachers();
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to update teacher status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (teacher: any) => {
    alert(`Password reset successful.\nDefault credentials: VBV$3210`);
  };

  const handleDeleteTeacher = async (teacher: any) => {
    setSubmitting(true);
    try {
      const res = await api.delete(`/admin/teacher/${teacher._id}`);
      alert(res.data.message || 'Teacher account deleted successfully.');
      setSelectedTeacher(null);
      loadTeachers();
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to delete teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalSalary = () => {
    const basic = Number(basicSalary) || 0;
    const allow = Number(allowance) || 0;
    return basic + allow;
  };

  // Filter Registry List
  const filteredRegistry = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teacherId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter History ledger records
  const filteredHistory = salaryHistory.filter(h => {
    const nameMatch = h.teacherName.toLowerCase().includes(historySearch.toLowerCase()) ||
                      h.employeeId.toLowerCase().includes(historySearch.toLowerCase());
    const monthMatch = historyMonth ? h.salaryMonth.toLowerCase().includes(historyMonth.toLowerCase()) : true;
    const statusMatch = historyStatus === 'All' ? true : h.status === historyStatus;
    
    let dateRangeMatch = true;
    if (historyFromDate && historyToDate) {
      const fromTime = new Date(historyFromDate).getTime();
      const toTime = new Date(historyToDate).getTime();
      const pTime = new Date(h.date).getTime();
      dateRangeMatch = pTime >= fromTime && pTime <= toTime;
    }

    return nameMatch && monthMatch && statusMatch && dateRangeMatch;
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Teachers Module</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Manage teacher registry lists, payroll disbursements, and transactions</Text>
          </View>
        </View>

        {/* ================= SUB TABS BAR ================= */}
        <View style={styles.subTabsContainer}>
          {[
            { id: 'registry', label: 'Teacher Registry' },
            { id: 'salary', label: 'Salary Management' },
            { id: 'history', label: 'Salary History' }
          ].map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveSubTab(tab.id as SubTab)}
              style={[styles.subTabItem, {
                backgroundColor: activeSubTab === tab.id ? '#EF4444' : theme.surface,
                borderColor: activeSubTab === tab.id ? '#EF4444' : theme.border
              }]}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: activeSubTab === tab.id ? '#ffffff' : theme.text }}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ================= TAB 1: TEACHER REGISTRY ================= */}
        {activeSubTab === 'registry' && (
          <View>
            <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Search size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name, Employee ID..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Pressable onPress={() => setShowAddModal(true)} style={styles.actionAddBtn}>
              <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionAddBtnText}>Add Teacher Account</Text>
            </Pressable>

            {loading ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <View style={styles.listContainer}>
                {filteredRegistry.length > 0 ? (
                  filteredRegistry.map(t => {
                    const isActive = t.status === 'Active';
                    return (
                      <Pressable
                        key={t._id}
                        onPress={() => {
                          setSelectedTeacher(t);
                          setProfileTab('details');
                        }}
                        style={[styles.teacherCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        <View style={styles.cardHeader}>
                          {t.photo ? (
                            <Image source={{ uri: `http://localhost:5000${t.photo}` }} style={styles.avatarImage} />
                          ) : (
                            <View style={[styles.avatarCircle, { backgroundColor: isActive ? '#19875415' : '#64748B15' }]}>
                              <Text style={{ color: isActive ? '#198754' : '#64748B', fontWeight: '800' }}>T</Text>
                            </View>
                          )}
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.nameText, { color: theme.text }]}>{t.name}</Text>
                            <Text style={{ fontSize: 9, color: theme.textSecondary }}>ID: {t.teacherId} | Dept: {t.department}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Pressable 
                              onPress={(e) => {
                                e.stopPropagation();
                                openEditTeacher(t);
                              }}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#EF4444',
                                backgroundColor: '#EF444410',
                              }}
                            >
                              <Text style={{ fontSize: 8, fontWeight: '800', color: '#EF4444' }}>✏️ Edit</Text>
                            </Pressable>
                            <View style={[styles.statusBadge, { backgroundColor: isActive ? '#19875415' : '#64748B15' }]}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: isActive ? '#198754' : '#64748B' }}>
                                {t.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <EmptyState
                    title="Teacher Registry"
                    message="No teachers registered in this school."
                    iconName="Users"
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 2: SALARY MANAGEMENT ================= */}
        {activeSubTab === 'salary' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Payroll Dashboard</Text>
            <Card style={{ padding: 10, overflow: 'scroll' }}>
              {loading ? (
                <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 20 }} />
              ) : (
                <View>
                  {/* Table headers */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thText, { flex: 1.2 }]}>Teacher Name</Text>
                    <Text style={[styles.thText, { flex: 0.8 }]}>Dept/Id</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'right' }]}>Monthly</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'right' }]}>Paid</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'right' }]}>Remaining</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>Status</Text>
                    <Text style={[styles.thText, { flex: 0.7, textAlign: 'center' }]}>Action</Text>
                  </View>

                  {/* Rows */}
                  {teachers.length > 0 ? (
                    teachers.map(t => {
                      const statusColor = t.salaryStatus === 'Fully Paid' ? '#10B981' : (t.salaryStatus === 'Partially Paid' ? '#3B82F6' : '#DC3545');
                      return (
                        <View key={t._id} style={styles.tableRowLine}>
                          <View style={{ flex: 1.2 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text }}>{t.name}</Text>
                            <Text style={{ fontSize: 7, color: theme.textSecondary }}>{t.designation}</Text>
                          </View>
                          <View style={{ flex: 0.8 }}>
                            <Text style={{ fontSize: 8, color: theme.textSecondary }}>{t.teacherId}</Text>
                            <Text style={{ fontSize: 8, color: theme.textSecondary }}>{t.department}</Text>
                          </View>
                          <Text style={[styles.tdText, { flex: 0.8, textAlign: 'right' }]}>₹{(t.totalSalary || 0).toLocaleString()}</Text>
                          <Text style={[styles.tdText, { flex: 0.8, textAlign: 'right', color: '#10B981', fontWeight: '800' }]}>₹{(t.alreadyPaid || 0).toLocaleString()}</Text>
                          <Text style={[styles.tdText, { flex: 0.8, textAlign: 'right', color: '#DC3545', fontWeight: '800' }]}>₹{(t.remainingSalary || 0).toLocaleString()}</Text>
                          <View style={{ flex: 0.8, alignItems: 'center' }}>
                            <View style={[styles.miniStatusBadge, { backgroundColor: `${statusColor}15` }]}>
                              <Text style={{ fontSize: 7, fontWeight: '800', color: statusColor }}>{t.salaryStatus || 'Pending'}</Text>
                            </View>
                          </View>
                          <View style={{ flex: 0.7, alignItems: 'center' }}>
                            <Pressable 
                              onPress={() => openPaySalary(t)} 
                              style={[styles.payActionBtn, { opacity: (t.remainingSalary || 0) <= 0 ? 0.4 : 1 }]}
                              disabled={(t.remainingSalary || 0) <= 0}
                            >
                              <Text style={styles.payActionBtnText}>Pay</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <EmptyState
                      title="Salary Management"
                      message="No teacher salaries found."
                      iconName="DollarSign"
                    />
                  )}
                </View>
              )}
            </Card>
          </View>
        )}

        {/* ================= TAB 3: SALARY HISTORY ================= */}
        {activeSubTab === 'history' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Disbursement Filters</Text>
            <Card style={{ padding: 12, marginBottom: 14 }}>
              <View style={styles.filterInputsRow}>
                <TextInput 
                  style={[styles.filterInput, { color: theme.text, borderColor: theme.border, marginRight: 6 }]} 
                  value={historySearch} 
                  onChangeText={setHistorySearch} 
                  placeholder="Search Name or ID" 
                  placeholderTextColor={theme.textSecondary}
                />
                <TextInput 
                  style={[styles.filterInput, { color: theme.text, borderColor: theme.border, marginLeft: 6 }]} 
                  value={historyMonth} 
                  onChangeText={setHistoryMonth} 
                  placeholder="Cycle Month (e.g. June)" 
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.filterInputsRow}>
                <TextInput 
                  style={[styles.filterInput, { color: theme.text, borderColor: theme.border, marginRight: 6 }]} 
                  value={historyFromDate} 
                  onChangeText={setHistoryFromDate} 
                  placeholder="From (YYYY-MM-DD)" 
                  placeholderTextColor={theme.textSecondary}
                />
                <TextInput 
                  style={[styles.filterInput, { color: theme.text, borderColor: theme.border, marginLeft: 6 }]} 
                  value={historyToDate} 
                  onChangeText={setHistoryToDate} 
                  placeholder="To (YYYY-MM-DD)" 
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.salaryTypeContainer}>
                {['All', 'Pending', 'Partially Paid', 'Fully Paid'].map(status => (
                  <Pressable
                    key={status}
                    onPress={() => setHistoryStatus(status)}
                    style={[styles.salaryTypePill, {
                      borderColor: historyStatus === status ? '#EF4444' : theme.border,
                      backgroundColor: historyStatus === status ? '#EF444410' : 'transparent'
                    }]}
                  >
                    <Text style={{ fontSize: 9, color: historyStatus === status ? '#EF4444' : theme.text, fontWeight: '800' }}>{status}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Salary History Ledger</Text>
            {loading ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : filteredHistory.length === 0 ? (
              <EmptyState
                title="Salary History"
                message="No transactions match search criteria."
                iconName="Clock"
              />
            ) : (
              <Card style={{ padding: 14 }}>
                {filteredHistory.map((h, idx) => (
                  <View key={h.id || idx} style={[styles.ledgerRow, { borderBottomColor: idx === filteredHistory.length - 1 ? 'transparent' : theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text }}>{h.teacherName}</Text>
                      <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                        Emp ID: {h.employeeId} | Dept: {h.department} | Month: {h.salaryMonth}
                      </Text>
                      <Text style={{ fontSize: 8, color: theme.textSecondary }}>
                        Method: {h.paymentMethod} {h.referenceNumber ? `(Ref: ${h.referenceNumber})` : ''} | Paid By: {h.paidBy} | Date: {new Date(h.date).toLocaleDateString()}
                      </Text>
                      {h.remarks ? <Text style={{ fontSize: 8, color: theme.textSecondary, fontStyle: 'italic', marginTop: 2 }}>Remarks: {h.remarks}</Text> : null}
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>+₹{h.amountPaid.toLocaleString()}</Text>
                  </View>
                ))}
              </Card>
            )}
          </View>
        )}

      </ScrollView>

      {/* ================= ADD NEW/EDIT TEACHER MODAL ================= */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTeacherId ? 'Edit Teacher Account' : 'Add Teacher Account'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Teacher Profile Photo</Text>
              <View style={styles.photoUploadBox}>
                {photoPreview ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: photoPreview }} style={styles.photoPreviewImage} />
                    <View style={styles.previewControls}>
                      <Pressable onPress={handleSelectPhoto} style={[styles.photoControlBtn, { backgroundColor: '#3B82F6' }]}>
                        <Text style={styles.photoControlText}>Replace</Text>
                      </Pressable>
                      <Pressable onPress={handleDeletePhoto} style={[styles.photoControlBtn, { backgroundColor: '#DC3545' }]}>
                        <Text style={styles.photoControlText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={handleSelectPhoto} style={[styles.photoSelectorBtn, { borderColor: theme.border }]}>
                    <Camera size={20} color={theme.textSecondary} />
                    <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4 }}>Upload Photo (Click to select)</Text>
                  </Pressable>
                )}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Employee ID</Text>
              {editingTeacherId ? (
                <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value={editTeacherIdVal} editable={false} />
              ) : (
                <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value="Auto-Generated" editable={false} />
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Teacher Name</Text>
              <TextInput 
                ref={nameRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.name ? '#DC3545' : theme.border }]} 
                value={name} 
                onChangeText={handleNameChange} 
                placeholder="Enter Full Name" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Email Address</Text>
              <TextInput 
                ref={emailRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.email ? '#DC3545' : theme.border }]} 
                value={email} 
                onChangeText={handleEmailChange} 
                placeholder="teacher@vbvschool.edu.in" 
                keyboardType="email-address" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Contact Phone</Text>
              <TextInput 
                ref={phoneRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.phone ? '#DC3545' : theme.border }]} 
                value={phone} 
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
                value={dob} 
                onChangeText={handleDobChange} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Teacher Aadhaar Number</Text>
              <TextInput 
                ref={aadhaarRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.aadhaar ? '#DC3545' : theme.border }]} 
                value={aadhaar} 
                onChangeText={handleAadhaarChange} 
                placeholder="Aadhaar Card No" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Salary Type</Text>
              <View style={styles.salaryTypeContainer}>
                {(['Monthly', 'Daily Wage', 'Contract'] as const).map(type => (
                  <Pressable
                    key={type}
                    onPress={() => setSalaryType(type)}
                    style={[styles.salaryTypePill, {
                      borderColor: salaryType === type ? '#EF4444' : theme.border,
                      backgroundColor: salaryType === type ? '#EF444410' : 'transparent'
                    }]}
                  >
                    <Text style={{ fontSize: 10, color: salaryType === type ? '#EF4444' : theme.text, fontWeight: '800' }}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Basic Salary</Text>
              <TextInput 
                ref={basicSalaryRef}
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} 
                value={basicSalary} 
                onChangeText={handleBasicSalaryChange} 
                placeholder="Basic amount in ₹" 
                keyboardType="numeric" 
                placeholderTextColor={theme.textSecondary} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Allowance</Text>
              <TextInput 
                ref={allowanceRef}
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} 
                value={allowance} 
                onChangeText={handleAllowanceChange} 
                placeholder="Allowances in ₹" 
                keyboardType="numeric" 
                placeholderTextColor={theme.textSecondary} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Total Salary (Calculated)</Text>
              <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value={`₹ ${calculateTotalSalary().toLocaleString()}`} editable={false} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Residential Address</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={address} onChangeText={setAddress} placeholder="Home Address" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Qualifications</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={qualification} onChangeText={setQualification} placeholder="e.g. M.Sc Mathematics, B.Ed" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Department</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={department} onChangeText={setDepartment} placeholder="e.g. Academics" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Experience</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={experience} onChangeText={setExperience} placeholder="e.g. 5 years" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Designation</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={designation} onChangeText={setDesignation} placeholder="e.g. TGT Teacher" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Class Teacher Assignment</Text>
              <View style={[styles.salaryTypeContainer, { flexWrap: 'wrap', gap: 6 }]}>
                <Pressable
                  onPress={() => setAssignedClass('')}
                  style={[styles.salaryTypePill, {
                    borderColor: assignedClass === '' ? '#EF4444' : theme.border,
                    backgroundColor: assignedClass === '' ? '#EF444410' : 'transparent'
                  }]}
                >
                  <Text style={{ fontSize: 9, color: assignedClass === '' ? '#EF4444' : theme.text, fontWeight: '800' }}>Not Assigned</Text>
                </Pressable>
                {classesList.map(c => (
                  <Pressable
                    key={c._id}
                    onPress={() => setAssignedClass(c._id)}
                    style={[styles.salaryTypePill, {
                      borderColor: assignedClass === c._id ? '#EF4444' : theme.border,
                      backgroundColor: assignedClass === c._id ? '#EF444410' : 'transparent'
                    }]}
                  >
                    <Text style={{ fontSize: 9, color: assignedClass === c._id ? '#EF4444' : theme.text, fontWeight: '800' }}>{c.name} - {c.section}</Text>
                  </Pressable>
                ))}
              </View>

              {editingTeacherId && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Status</Text>
                  <View style={styles.salaryTypeContainer}>
                    {(['Active', 'Inactive'] as const).map(statusVal => (
                      <Pressable
                        key={statusVal}
                        onPress={() => setTeacherStatus(statusVal)}
                        style={[styles.salaryTypePill, {
                          borderColor: teacherStatus === statusVal ? '#EF4444' : theme.border,
                          backgroundColor: teacherStatus === statusVal ? '#EF444410' : 'transparent'
                        }]}
                      >
                        <Text style={{ fontSize: 9, color: teacherStatus === statusVal ? '#EF4444' : theme.text, fontWeight: '800' }}>{statusVal}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowAddModal(false)}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleAddTeacher} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>{editingTeacherId ? '✔ Save Changes' : 'Onboard Teacher'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= PAY SALARY DIALOG MODAL ================= */}
      <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={() => setShowPayModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Record Salary Disbursement</Text>
            <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center', marginBottom: 12 }}>Paying: {payTeacherName}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount to Pay (INR)</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Salary Cycle Month</Text>
              <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value={payMonth} editable={false} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Payment Date</Text>
              <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value={payDate} editable={false} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Payment Method</Text>
              <View style={styles.salaryTypeContainer}>
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setPayMethod(m)}
                    style={[styles.salaryTypePill, {
                      borderColor: payMethod === m ? '#EF4444' : theme.border,
                      backgroundColor: payMethod === m ? '#EF444410' : 'transparent'
                    }]}
                  >
                    <Text style={{ fontSize: 9, color: payMethod === m ? '#EF4444' : theme.text, fontWeight: '800' }}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Reference Number (Optional)</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={payReference} onChangeText={setPayReference} placeholder="e.g. Txn198270" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Remarks</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={payRemarks} onChangeText={setPayRemarks} placeholder="Payment details" placeholderTextColor={theme.textSecondary} />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowPayModal(false)}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handlePaySalarySubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>Disburse Salary</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= TEACHER PROFILE MANAGEMENT MODAL ================= */}
      {selectedTeacher && (
        <Modal visible={selectedTeacher !== null} transparent animationType="slide" onRequestClose={() => setSelectedTeacher(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Teacher Profile Hub</Text>
              
              {/* Profile tabs */}
              <View style={styles.tabsRow}>
                <Pressable onPress={() => setProfileTab('details')} style={[styles.tabBtn, { borderBottomColor: profileTab === 'details' ? '#EF4444' : 'transparent' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: profileTab === 'details' ? '#EF4444' : theme.textSecondary }}>Personal Details</Text>
                </Pressable>
                <Pressable onPress={() => setProfileTab('salary')} style={[styles.tabBtn, { borderBottomColor: profileTab === 'salary' ? '#EF4444' : 'transparent' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: profileTab === 'salary' ? '#EF4444' : theme.textSecondary }}>Salary Ledger</Text>
                </Pressable>
              </View>

              <ScrollView style={{ marginVertical: 10 }}>
                {profileTab === 'details' && (
                  <View>
                    <View style={styles.profileDetailsCard}>
                      {selectedTeacher.photo && (
                        <Image source={{ uri: `http://localhost:5000${selectedTeacher.photo}` }} style={styles.detailAvatarImage} />
                      )}
                      <Text style={[styles.profileDetailVal, { color: theme.text }]}>{selectedTeacher.name}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>Employee ID: {selectedTeacher.teacherId} | Status: {selectedTeacher.status}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center' }}>Email: {selectedTeacher.email} | Phone: {selectedTeacher.phone}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center' }}>Designation: {selectedTeacher.designation} | Dept: {selectedTeacher.department}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center' }}>Qualification: {selectedTeacher.qualification} | Exp: {selectedTeacher.experience}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>Address: {selectedTeacher.address || 'N/A'}</Text>
                    </View>

                    {/* Action options */}
                    <View style={styles.actionsPanel}>
                      <Pressable 
                        style={[styles.panelActionBtn, { borderColor: theme.border }]} 
                        onPress={() => handleToggleStatus(selectedTeacher)}
                        disabled={submitting}
                      >
                        {selectedTeacher.status === 'Active' ? (
                          <>
                            <ToggleRight size={18} color="#198754" />
                            <Text style={[styles.panelActionText, { color: theme.text }]}>Deactivate Account</Text>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={18} color="#64748B" />
                            <Text style={[styles.panelActionText, { color: theme.text }]}>Activate Account</Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable 
                        style={[styles.panelActionBtn, { borderColor: theme.border }]} 
                        onPress={() => handleResetPassword(selectedTeacher)}
                      >
                        <Key size={18} color="#F59E0B" />
                        <Text style={[styles.panelActionText, { color: theme.text }]}>Reset Password Credentials</Text>
                      </Pressable>

                      <Pressable 
                        style={[styles.panelActionBtn, { borderColor: '#DC354530', backgroundColor: '#DC354508' }]} 
                        onPress={() => handleDeleteTeacher(selectedTeacher)}
                        disabled={submitting}
                      >
                        <Trash2 size={18} color="#DC3545" />
                        <Text style={[styles.panelActionText, { color: '#DC3545' }]}>Delete / Soft Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {profileTab === 'salary' && (
                  <View>
                    <Card style={{ padding: 12, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Dynamic Monthly Totals</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>Monthly Salary: ₹{(selectedTeacher.totalSalary || 0).toLocaleString()}</Text>
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '800', marginTop: 2 }}>Paid to date: ₹{(selectedTeacher.alreadyPaid || 0).toLocaleString()}</Text>
                      <Text style={{ fontSize: 10, color: '#DC3545', fontWeight: '800', marginTop: 2 }}>Remaining balance: ₹{(selectedTeacher.remainingSalary || 0).toLocaleString()}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>Salary Status: {selectedTeacher.salaryStatus || 'Pending'}</Text>
                    </Card>

                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 14 }]}>Payments Statement Ledger</Text>
                    {(!selectedTeacher.salaryPayments || selectedTeacher.salaryPayments.length === 0) ? (
                      <Text style={{ fontSize: 10, color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: 14 }}>No salary payments made to this teacher.</Text>
                    ) : (
                      selectedTeacher.salaryPayments.map((p: any, idx: number) => (
                        <View key={p._id || idx} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text }}>Amount: ₹{p.amount.toLocaleString()}</Text>
                            <Text style={{ fontSize: 8, color: theme.textSecondary }}>{new Date(p.date).toLocaleDateString()}</Text>
                          </View>
                          <Text style={{ fontSize: 9, color: theme.textSecondary }}>Month: {p.salaryMonth} | Mode: {p.paymentMethod} {p.referenceNumber ? `(Ref: ${p.referenceNumber})` : ''}</Text>
                          {p.remarks ? <Text style={{ fontSize: 8, color: theme.textSecondary, fontStyle: 'italic' }}>Remarks: {p.remarks}</Text> : null}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </ScrollView>

              <Pressable 
                style={[styles.modalCancelBtn, { borderColor: theme.border, marginTop: 14, alignSelf: 'flex-end' }]} 
                onPress={() => setSelectedTeacher(null)}
              >
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Close</Text>
              </Pressable>
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
  subTabsContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  actionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  listContainer: {
    marginTop: 6,
  },
  teacherCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  detailAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
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
  profileDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  profileDetailVal: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionsPanel: {
    marginTop: 10,
  },
  panelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  panelActionText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 10,
  },
  photoUploadBox: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  photoSelectorBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    padding: 10,
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  previewControls: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
  photoControlBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoControlText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  salaryTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  salaryTypePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
    marginBottom: 6,
  },
  thText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  tableRowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdText: {
    fontSize: 9,
    color: '#334155',
  },
  miniStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  payActionBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  payActionBtnText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  filterInputsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
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
