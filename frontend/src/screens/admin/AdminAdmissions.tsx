import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { Search, Plus, ShieldAlert, ArrowLeft, Trash2, Calendar, FileText, CheckCircle2, ChevronDown } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import { 
  cleanNameInput, cleanPhoneInput, cleanAadhaarInput, cleanNumberInput, cleanRollNumberInput, 
  validateName, validatePhone, validateAadhaar, validateEmail, validateDOB, validateRollNumber 
} from '../../services/validation';

interface AdminAdmissionsProps {
  onNavigate: (tab: string) => void;
  onSyncAllPortals: () => void;
  initialStudentId?: string | null;
  clearInitialStudentId?: () => void;
  setSearchSelectionStudentId?: (id: string | null) => void;
  setOpenReceiptOnLoad?: (open: boolean) => void;
  refreshTrigger?: number;
}

export const AdminAdmissions: React.FC<AdminAdmissionsProps> = (props) => {
  const { onNavigate, onSyncAllPortals, initialStudentId, clearInitialStudentId, refreshTrigger } = props;
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Approved' | 'Archived'>('All');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Aggregated Student Profile tabs
  const [profileData, setProfileData] = useState<any | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'personal' | 'parents' | 'fee'>('overview');
  const [archiveReason, setArchiveReason] = useState<'Transferred' | 'Alumni' | 'Left School' | 'Other'>('Transferred');
  const [archiveRemarks, setArchiveRemarks] = useState('');

  // Editing and Parent Occupation states
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editRollNumberVal, setEditRollNumberVal] = useState('');
  const [editAdmissionNumberVal, setEditAdmissionNumberVal] = useState('');
  const [occupation, setOccupation] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('Select Class');
  const [dob, setDob] = useState('2015-05-14');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [religion, setReligion] = useState('Hindu');
  const [category, setCategory] = useState('General');
  const [emergencyContact, setEmergencyContact] = useState('+919876543227');
  const [fatherName, setFatherName] = useState('Mr. Prabhakar Rao');
  const [motherName, setMotherName] = useState('Mrs. Srivani Rao');
  const [parentPhone, setParentPhone] = useState('9948360027');
  const [parentEmail, setParentEmail] = useState('parent@vbvschool.edu.in');
  const [parentAadhaar, setParentAadhaar] = useState('360142998877');
  const [aadhaar, setAadhaar] = useState('360124991122');
  const [address, setAddress] = useState('Palsi, Kubeer, Nirmal');
  
  // Custom Overridable Fee Structure Draft
  const [feesBreakdown, setFeesBreakdown] = useState({
    admission: 0,
    tuition: 0,
    books: 0,
    hostel: 0,
    transport: 0,
    uniform: 0,
    exam: 0,
    other: 0
  });

  // Document checklist (Phase 2 validation)
  const [docBirthCert, setDocBirthCert] = useState(false);
  const [docAadhaar, setDocAadhaar] = useState(false);
  const [docTC, setDocTC] = useState(false);
  const [docReportCard, setDocReportCard] = useState(false);
  const [docPhoto, setDocPhoto] = useState(false);

  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const nameRef = React.useRef<any>(null);
  const dobRef = React.useRef<any>(null);
  const aadhaarRef = React.useRef<any>(null);
  const emergencyContactRef = React.useRef<any>(null);
  const fatherNameRef = React.useRef<any>(null);
  const motherNameRef = React.useRef<any>(null);
  const parentPhoneRef = React.useRef<any>(null);
  const parentEmailRef = React.useRef<any>(null);
  const parentAadhaarRef = React.useRef<any>(null);
  const rollNumberRef = React.useRef<any>(null);

  const handleNameChange = (val: string) => {
    const cleaned = cleanNameInput(val);
    setName(cleaned);
    setErrors(prev => ({ ...prev, name: validateName(cleaned, 'Student Name') }));
  };

  const handleDobChange = (val: string) => {
    const cleaned = val.replace(/[^0-9-]/g, '').slice(0, 10);
    setDob(cleaned);
    setErrors(prev => ({ ...prev, dob: validateDOB(cleaned, 'student') }));
  };

  const handleAadhaarChange = (val: string) => {
    const cleaned = cleanAadhaarInput(val);
    setAadhaar(cleaned);
    setErrors(prev => ({ ...prev, aadhaar: validateAadhaar(cleaned, 'Student Aadhaar') }));
  };

  const handleEmergencyContactChange = (val: string) => {
    const cleaned = cleanPhoneInput(val);
    setEmergencyContact(cleaned);
    setErrors(prev => ({ ...prev, emergencyContact: validatePhone(cleaned, 'Emergency Contact') }));
  };

  const handleFatherNameChange = (val: string) => {
    const cleaned = cleanNameInput(val);
    setFatherName(cleaned);
    setErrors(prev => ({ ...prev, fatherName: validateName(cleaned, 'Father Name') }));
  };

  const handleMotherNameChange = (val: string) => {
    const cleaned = cleanNameInput(val);
    setMotherName(cleaned);
    setErrors(prev => ({ ...prev, motherName: validateName(cleaned, 'Mother Name') }));
  };

  const handleParentPhoneChange = (val: string) => {
    const cleaned = cleanPhoneInput(val);
    setParentPhone(cleaned);
    setErrors(prev => ({ ...prev, parentPhone: validatePhone(cleaned, 'Parent Phone') }));
  };

  const handleParentEmailChange = (val: string) => {
    setParentEmail(val);
    setErrors(prev => ({ ...prev, parentEmail: validateEmail(val, 'Parent Email') }));
  };

  const handleParentAadhaarChange = (val: string) => {
    const cleaned = cleanAadhaarInput(val);
    setParentAadhaar(cleaned);
    setErrors(prev => ({ ...prev, parentAadhaar: validateAadhaar(cleaned, 'Parent Aadhaar') }));
  };

  const handleRollNumberChange = (val: string) => {
    const cleaned = cleanRollNumberInput(val);
    setEditRollNumberVal(cleaned);
    setErrors(prev => ({ ...prev, rollNumber: validateRollNumber(cleaned) }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes, feeStructsRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/reports?type=admissions').catch(() => ({ data: [] })),
        api.get('/admin/fee-structures').catch(() => ({ data: [] }))
      ]);
      setClassesList(classesRes.data || []);
      setStudents(studentsRes.data || []);
      setFeeStructures(feeStructsRes.data || []);
      if (classesRes.data && classesRes.data.length > 0 && !selectedClassId) {
        setSelectedClassId(classesRes.data[0]._id);
        setSelectedClassName(`${classesRes.data[0].name} - ${classesRes.data[0].section}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedStudentId) {
      handleFetchProfile(selectedStudentId);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (initialStudentId) {
      handleFetchProfile(initialStudentId);
      if (clearInitialStudentId) {
        clearInitialStudentId();
      }
    }
  }, [initialStudentId]);

  // Update default custom fees draft on class change
  useEffect(() => {
    if (editingStudentId) return; // Do not overwrite existing student's custom fees!

    const selectedClass = classesList.find(c => c._id === selectedClassId);
    if (selectedClass) {
      if (selectedClass.feeStructure) {
        setFeesBreakdown({
          admission: selectedClass.feeStructure.admission || 0,
          tuition: selectedClass.feeStructure.tuition || 0,
          books: selectedClass.feeStructure.books || 0,
          hostel: selectedClass.feeStructure.hostel || 0,
          transport: selectedClass.feeStructure.transport || 0,
          uniform: selectedClass.feeStructure.uniform || 0,
          exam: selectedClass.feeStructure.exam || 0,
          other: selectedClass.feeStructure.other || 0
        });
      } else if (feeStructures.length > 0) {
        const matched = feeStructures.find(fs => fs.className === selectedClass.name);
        if (matched && matched.heads) {
          setFeesBreakdown({
            admission: matched.heads.admission || 0,
            tuition: matched.heads.tuition || 0,
            books: matched.heads.books || 0,
            hostel: matched.heads.hostel || 0,
            transport: matched.heads.transport || 0,
            uniform: matched.heads.uniform || 0,
            exam: matched.heads.exam || 0,
            other: matched.heads.other || 0
          });
        }
      }
    }
  }, [selectedClassId, feeStructures, classesList, editingStudentId]);

  const resetForm = () => {
    setEditingStudentId(null);
    setEditRollNumberVal('');
    setEditAdmissionNumberVal('');
    setOccupation('');
    setName('');
    setDob('2015-05-14');
    setGender('Male');
    setBloodGroup('B+');
    setReligion('Hindu');
    setCategory('General');
    setEmergencyContact('');
    setFatherName('');
    setMotherName('');
    setParentPhone('');
    setParentEmail('');
    setParentAadhaar('');
    setAadhaar('');
    setAddress('');
    setErrors({});
  };

  const openEditStudent = (student: any) => {
    setEditingStudentId(student._id);
    setName(student.name);
    setDob(student.dob ? student.dob.split('T')[0] : '2015-05-14');
    setGender(student.gender || 'Male');
    setBloodGroup(student.bloodGroup || 'B+');
    setReligion(student.religion || 'Hindu');
    setCategory(student.category || 'General');
    setEmergencyContact(student.emergencyContact || '');
    setAadhaar(student.aadhaar || '');
    setEditRollNumberVal(student.rollNumber || '');
    setEditAdmissionNumberVal(student.admissionNumber || '');

    if (student.class) {
      const clsId = typeof student.class === 'object' ? student.class._id : student.class;
      setSelectedClassId(clsId);
      const foundCls = classesList.find(c => c._id === clsId);
      if (foundCls) {
        setSelectedClassName(`${foundCls.name} - ${foundCls.section}`);
      }
    }

    if (student.parent) {
      setFatherName(student.parent.fatherName || '');
      setMotherName(student.parent.motherName || '');
      setParentPhone(student.parent.phone || '');
      setParentEmail(student.parent.email || '');
      setParentAadhaar(student.parent.aadhaar || '');
      setAddress(student.parent.address || '');
      setOccupation(student.parent.occupation || '');
    } else {
      setFatherName('');
      setMotherName('');
      setParentPhone('');
      setParentEmail('');
      setParentAadhaar('');
      setAddress('');
      setOccupation('');
    }

    if (student.customFees) {
      setFeesBreakdown({
        admission: student.customFees.admission || 0,
        tuition: student.customFees.tuition || 0,
        books: student.customFees.books || 0,
        hostel: student.customFees.hostel || 0,
        transport: student.customFees.transport || 0,
        uniform: student.customFees.uniform || 0,
        exam: student.customFees.exam || 0,
        other: student.customFees.other || 0
      });
    }

    setShowAddModal(true);
  };

  const handleAddAdmission = async () => {
    // Validate all fields
    const nameErr = validateName(name, 'Student Name');
    const dobErr = validateDOB(dob, 'student');
    const aadhaarErr = aadhaar ? validateAadhaar(aadhaar, 'Student Aadhaar') : null;
    const emergencyContactErr = validatePhone(emergencyContact, 'Emergency Contact');
    const fatherErr = validateName(fatherName, 'Father Name');
    const motherErr = motherName ? validateName(motherName, 'Mother Name') : null;
    const parentPhoneErr = validatePhone(parentPhone, 'Parent Phone');
    const parentEmailErr = parentEmail ? validateEmail(parentEmail, 'Parent Email') : null;
    const parentAadhaarErr = parentAadhaar ? validateAadhaar(parentAadhaar, 'Parent Aadhaar') : null;
    const rollNumberErr = (editingStudentId && editRollNumberVal) ? validateRollNumber(editRollNumberVal) : null;
    const targetClassErr = !selectedClassId ? 'Target class is required.' : null;

    const newErrors = {
      name: nameErr,
      dob: dobErr,
      aadhaar: aadhaarErr,
      emergencyContact: emergencyContactErr,
      fatherName: fatherErr,
      motherName: motherErr,
      parentPhone: parentPhoneErr,
      parentEmail: parentEmailErr,
      parentAadhaar: parentAadhaarErr,
      rollNumber: rollNumberErr,
      classId: targetClassErr
    };

    setErrors(newErrors);

    // Focus the first invalid field and prevent submit
    if (nameErr) {
      nameRef.current?.focus();
      return;
    }
    if (targetClassErr) {
      alert('Please select a Target Class Allocation.');
      return;
    }
    if (editingStudentId && rollNumberErr) {
      rollNumberRef.current?.focus();
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
    if (emergencyContactErr) {
      emergencyContactRef.current?.focus();
      return;
    }
    if (fatherErr) {
      fatherNameRef.current?.focus();
      return;
    }
    if (motherErr) {
      motherNameRef.current?.focus();
      return;
    }
    if (parentPhoneErr) {
      parentPhoneRef.current?.focus();
      return;
    }
    if (parentEmailErr) {
      parentEmailRef.current?.focus();
      return;
    }
    if (parentAadhaarErr) {
      parentAadhaarRef.current?.focus();
      return;
    }

    if (!editingStudentId) {
      const targetClass = classesList.find(c => c._id === selectedClassId);
      if (targetClass && targetClass.approvedCount >= targetClass.maxCapacity) {
        return alert(`Class Full: Enrollment blocked for ${targetClass.name} - ${targetClass.section} (${targetClass.approvedCount}/${targetClass.maxCapacity} seats occupied).`);
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name,
        classId: selectedClassId,
        dob,
        gender,
        bloodGroup,
        religion,
        category,
        emergencyContact,
        fatherName,
        motherName,
        parentPhone,
        parentEmail,
        parentAadhaar,
        aadhaar,
        address,
        occupation,
        customFees: feesBreakdown
      };

      if (editingStudentId) {
        payload.rollNumber = editRollNumberVal;
        payload.admissionNumber = editAdmissionNumberVal;
        await api.put(`/admin/student/${editingStudentId}`, payload);
        alert('Student profile details updated successfully.');
      } else {
        await api.post('/admin/student', payload);
        alert('Admission enquiry saved in PENDING status.');
      }

      setShowAddModal(false);
      resetForm();
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit student details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchProfile = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/student/${id}/profile`);
      setProfileData(res.data);
      setSelectedStudentId(id);
      setProfileTab('overview');
      if (res.data.student) {
        setDocBirthCert(res.data.student.documentChecklist?.birthCert || false);
        setDocAadhaar(res.data.student.documentChecklist?.aadhaar || false);
        setDocTC(res.data.student.documentChecklist?.tc || false);
        setDocReportCard(res.data.student.documentChecklist?.reportCard || false);
        setDocPhoto(res.data.student.documentChecklist?.photo || false);
      }
    } catch (e) {
      alert('Failed to retrieve consolidated profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!docBirthCert || !docAadhaar || !docPhoto) {
      return alert('Approval blocked: Must verify Birth Cert, Aadhaar card, and Photo.');
    }

    setSubmitting(true);
    try {
      await api.post(`/admin/student/${selectedStudentId}/approve`, {
        documentChecklist: {
          birthCert: docBirthCert,
          aadhaar: docAadhaar,
          tc: docTC,
          reportCard: docReportCard,
          photo: docPhoto
        }
      });
      alert('Student approved. Admission, Roll number and Logins created.');
      setSelectedStudentId(null);
      setProfileData(null);
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHold = async () => {
    setSubmitting(true);
    try {
      await api.post(`/admin/student/${selectedStudentId}/hold`);
      alert('Student status set to HOLD. Verification requirements pending.');
      setSelectedStudentId(null);
      setProfileData(null);
      loadData();
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to update student status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await api.post(`/admin/student/${selectedStudentId}/reject`);
      alert('Student registration request rejected.');
      setSelectedStudentId(null);
      setProfileData(null);
      loadData();
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to reject registration request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveSubmit = async () => {
    if (!selectedStudentId) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/student/${selectedStudentId}`, { 
        data: { 
          status: archiveReason,
          remarks: archiveRemarks
        } 
      });
      alert('Student archived successfully.');
      setShowArchiveModal(false);
      setSelectedStudentId(null);
      setProfileData(null);
      loadData();
      onSyncAllPortals();
    } catch (e) {
      alert('Archive transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedStudentId) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/student/${selectedStudentId}/restore`);
      alert('Student record restored successfully.');
      setSelectedStudentId(null);
      setProfileData(null);
      loadData();
      onSyncAllPortals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermanentDelete = () => {
    if (!selectedStudentId) return;
    Alert.alert(
      'Permanent Deletion',
      'Are you sure you want to permanently delete this student record and all associated logs/ledgers? This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Permanently Delete', 
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete(`/admin/student/${selectedStudentId}/permanent`);
              alert('Student profile deleted permanently.');
              setSelectedStudentId(null);
              setProfileData(null);
              loadData();
              onSyncAllPortals();
            } catch (err: any) {
              alert(err.response?.data?.message || 'Failed to delete student.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const updateFeeField = (head: string, val: string) => {
    let cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    if (cleaned === '') {
      cleaned = '0';
    }
    const num = Number(cleaned);
    setFeesBreakdown(prev => ({
      ...prev,
      [head]: num
    }));
  };

  const calculateTotalFees = () => {
    return Object.values(feesBreakdown).reduce((a, b) => a + b, 0);
  };

  const filtered = students.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (s.name && s.name.toLowerCase().includes(query)) ||
                          (s.admissionNumber && s.admissionNumber.toLowerCase().includes(query)) ||
                          (s.parent && s.parent.phone && s.parent.phone.includes(query));

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Pending') return matchesSearch && ['Pending', 'Hold'].includes(s.status);
    if (activeFilter === 'Approved') return matchesSearch && s.status === 'Approved';
    return matchesSearch && ['Transferred', 'Alumni', 'Left School', 'Rejected', 'Archived'].includes(s.status);
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
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Admissions Registry</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Mongoose validation check & document verification</Text>
          </View>
        </View>

        {/* ================= SEARCH & ACTIONS ================= */}
        <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Search size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name, admission no, or parent mobile..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.filterChipsRow}>
          {(['All', 'Pending', 'Approved', 'Archived'] as const).map(f => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChipPill, { 
                backgroundColor: activeFilter === f ? '#EF4444' : theme.surface,
                borderColor: activeFilter === f ? '#EF4444' : theme.border 
              }]}
            >
              <Text style={{ fontSize: 10, color: activeFilter === f ? '#ffffff' : theme.text, fontWeight: '800' }}>{f}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setShowAddModal(true)} style={styles.actionAddBtn}>
          <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.actionAddBtnText}>Record New Registration (Phase 1)</Text>
        </Pressable>

        {/* ================= LISTING ADMISSIONS ================= */}
        {loading ? (
          <ActivityIndicator color="#EF4444" size="small" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.listContainer}>
            {filtered.length > 0 ? (
              filtered.map(s => (
                <Pressable
                  key={s._id}
                  onPress={() => handleFetchProfile(s._id)}
                  style={[styles.admissionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{s.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.nameText, { color: theme.text }]}>{s.name}</Text>
                      <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                        Class: {s.class?.name || 'Nursery'} | Section: {s.class?.section || 'A'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Pressable 
                        onPress={(e) => {
                          e.stopPropagation();
                          openEditStudent(s);
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
                      <View style={[styles.statusBadge, { 
                        backgroundColor: s.status === 'Approved' ? '#10B98115' : (s.status === 'Pending' ? '#F59E0B15' : (s.status === 'Hold' ? '#3B82F615' : '#64748B15')) 
                      }]}>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: s.status === 'Approved' ? '#10B981' : (s.status === 'Pending' ? '#F59E0B' : (s.status === 'Hold' ? '#3B82F6' : '#64748B')) }}>
                          {s.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <EmptyState
                title="Admissions Registry"
                message="No student admissions registered yet."
                iconName="Users"
              />
            )}
          </View>
        )}

      </ScrollView>

      {/* ================= NEW/EDIT ADMISSION FORM MODAL ================= */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingStudentId ? '✏️ Edit Student Admission Profile' : 'Add Student Admission (Phase 1)'}
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Student Name</Text>
              <TextInput 
                ref={nameRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.name ? '#DC3545' : theme.border }]} 
                value={name} 
                onChangeText={handleNameChange} 
                placeholder="Student Full Name" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Target Class Allocation</Text>
              <Pressable onPress={() => setShowClassDropdown(!showClassDropdown)} style={[styles.dropdownTrigger, { borderColor: theme.border }]}>
                <Text style={{ fontSize: 12, color: theme.text }}>{selectedClassName}</Text>
                <ChevronDown size={14} color={theme.textSecondary} />
              </Pressable>

              {showClassDropdown && (
                <View style={[styles.dropdownOptions, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {classesList.map(c => {
                    const isFull = c.approvedCount >= c.maxCapacity;
                    return (
                      <Pressable
                        key={c._id}
                        onPress={() => {
                          if (!isFull || editingStudentId) {
                            setSelectedClassId(c._id);
                            setSelectedClassName(`${c.name} - ${c.section}`);
                            setShowClassDropdown(false);
                          }
                        }}
                        style={[styles.dropdownItem, { opacity: (isFull && !editingStudentId) ? 0.4 : 1 }]}
                      >
                        <Text style={{ fontSize: 11, color: theme.text }}>{c.name} - {c.section} {isFull ? '(Class Full)' : `(${c.approvedCount}/${c.maxCapacity} seats)`}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

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

              {editingStudentId && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Roll Number</Text>
                  <TextInput 
                    ref={rollNumberRef}
                    style={[styles.modalInput, { color: theme.text, borderColor: errors.rollNumber ? '#DC3545' : theme.border }]} 
                    value={editRollNumberVal} 
                    onChangeText={handleRollNumberChange} 
                    placeholder="Roll Number (e.g. Nursery-A-001)" 
                    placeholderTextColor={theme.textSecondary} 
                  />
                  {errors.rollNumber && <Text style={styles.errorText}>{errors.rollNumber}</Text>}

                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Admission Number</Text>
                  <TextInput style={[styles.modalInput, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: '#F1F5F9' }]} value={editAdmissionNumberVal} editable={false} />
                </>
              )}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Gender</Text>
              <View style={styles.radioGroup}>
                <Pressable onPress={() => setGender('Male')} style={styles.radioOption}>
                  <View style={[styles.radioCircle, { borderColor: '#EF4444' }]}>
                    {gender === 'Male' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginLeft: 6 }}>Male</Text>
                </Pressable>
                <Pressable onPress={() => setGender('Female')} style={styles.radioOption}>
                  <View style={[styles.radioCircle, { borderColor: '#EF4444' }]}>
                    {gender === 'Female' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginLeft: 6 }}>Female</Text>
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Blood Group</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={bloodGroup} onChangeText={setBloodGroup} placeholder="e.g. B+" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Religion (Optional)</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={religion} onChangeText={setReligion} placeholder="e.g. Hindu, Muslim, Christian" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Category (Optional)</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={category} onChangeText={setCategory} placeholder="e.g. General, OBC, SC, ST" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Student Aadhaar Number</Text>
              <TextInput 
                ref={aadhaarRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.aadhaar ? '#DC3545' : theme.border }]} 
                value={aadhaar} 
                onChangeText={handleAadhaarChange} 
                placeholder="Aadhaar Card No" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Emergency Contact Phone</Text>
              <TextInput 
                ref={emergencyContactRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.emergencyContact ? '#DC3545' : theme.border }]} 
                value={emergencyContact} 
                onChangeText={handleEmergencyContactChange} 
                placeholder="Emergency Phone Number" 
                keyboardType="phone-pad" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.emergencyContact && <Text style={styles.errorText}>{errors.emergencyContact}</Text>}

              {/* ================= EDITABLE FEES SECTION ================= */}
              <Text style={[styles.fieldLabel, { color: theme.text, marginTop: 14 }]}>Customize Student Fee Structure</Text>
              
              <Card style={{ padding: 14, marginBottom: 14, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: 16 }}>
                {Object.keys(feesBreakdown).map(head => (
                  <View key={head} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 10, color: theme.text, textTransform: 'capitalize', fontWeight: '600', flex: 1 }}>
                      {head} Fee
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '800' }}>₹</Text>
                      <TextInput
                        style={[styles.smallFeeInput, { 
                          color: theme.text, 
                          borderColor: theme.border, 
                          borderWidth: 1, 
                          borderRadius: 8, 
                          paddingHorizontal: 8, 
                          paddingVertical: 2, 
                          fontSize: 10, 
                          textAlign: 'right',
                          width: 100,
                          height: 28
                        }]}
                        keyboardType="numeric"
                        value={String((feesBreakdown as any)[head] ?? 0)}
                        onChangeText={(val) => updateFeeField(head, val)}
                      />
                    </View>
                  </View>
                ))}
                
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: 12, 
                  backgroundColor: '#10B98115', 
                  padding: 10, 
                  borderRadius: 10 
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: theme.text }}>Total Student Fee:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981' }}>
                    ₹ {calculateTotalFees().toLocaleString()}
                  </Text>
                </View>
              </Card>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Father's Full Name</Text>
              <TextInput 
                ref={fatherNameRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.fatherName ? '#DC3545' : theme.border }]} 
                value={fatherName} 
                onChangeText={handleFatherNameChange} 
                placeholder="Father Name" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.fatherName && <Text style={styles.errorText}>{errors.fatherName}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Mother's Full Name</Text>
              <TextInput 
                ref={motherNameRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.motherName ? '#DC3545' : theme.border }]} 
                value={motherName} 
                onChangeText={handleMotherNameChange} 
                placeholder="Mother Name" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.motherName && <Text style={styles.errorText}>{errors.motherName}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Parent Phone</Text>
              <TextInput 
                ref={parentPhoneRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.parentPhone ? '#DC3545' : theme.border }]} 
                value={parentPhone} 
                onChangeText={handleParentPhoneChange} 
                placeholder="Phone" 
                keyboardType="phone-pad" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.parentPhone && <Text style={styles.errorText}>{errors.parentPhone}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Parent Email</Text>
              <TextInput 
                ref={parentEmailRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.parentEmail ? '#DC3545' : theme.border }]} 
                value={parentEmail} 
                onChangeText={handleParentEmailChange} 
                placeholder="Email" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.parentEmail && <Text style={styles.errorText}>{errors.parentEmail}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Parent Aadhaar</Text>
              <TextInput 
                ref={parentAadhaarRef}
                style={[styles.modalInput, { color: theme.text, borderColor: errors.parentAadhaar ? '#DC3545' : theme.border }]} 
                value={parentAadhaar} 
                onChangeText={handleParentAadhaarChange} 
                placeholder="Parent Aadhaar" 
                placeholderTextColor={theme.textSecondary} 
              />
              {errors.parentAadhaar && <Text style={styles.errorText}>{errors.parentAadhaar}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Parent Occupation</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={occupation} onChangeText={setOccupation} placeholder="e.g. Engineer, Business" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Address</Text>
              <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]} value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor={theme.textSecondary} />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleAddAdmission} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSubmitBtnText}>{editingStudentId ? '✔ Save Changes' : 'Submit Draft'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= COMPREHENSIVE TABS STUDENT PROFILE HUB ================= */}
      {selectedStudentId && profileData && profileData.student && (
        <Modal visible={selectedStudentId !== null} transparent animationType="slide" onRequestClose={() => { setSelectedStudentId(null); setProfileData(null); }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Student Profile Hub</Text>
              
              {/* Tab Navigation header (Only restricted tabs allowed now) */}
              <View style={styles.tabsRow}>
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'personal', label: 'Personal Details' },
                  { id: 'parents', label: 'Parent Details' },
                  { id: 'fee', label: 'Fee Structure' }
                ].map(tab => (
                  <Pressable 
                    key={tab.id}
                    onPress={() => setProfileTab(tab.id as any)}
                    style={[styles.tabBtn, { borderBottomColor: profileTab === tab.id ? '#EF4444' : 'transparent' }]}
                  >
                    <Text style={{ fontSize: 9, color: profileTab === tab.id ? '#EF4444' : theme.textSecondary, fontWeight: '800' }}>{tab.label}</Text>
                  </Pressable>
                ))}
              </View>

              <ScrollView style={{ marginVertical: 10 }}>
                {/* TAB 1: OVERVIEW & APPROVAL ACTIONS */}
                {profileTab === 'overview' && (
                  <View>
                    <Card style={{ padding: 12 }}>
                      <Text style={{ fontSize: 13, color: theme.text, fontWeight: '800' }}>{profileData.student.name}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>Admission status: {profileData.student.status}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>Assigned Roll No: {profileData.student.rollNumber || 'PENDING'}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>Admission No: {profileData.student.admissionNumber || 'PENDING'}</Text>
                    </Card>

                    {profileData.student.status === 'Approved' && (
                      <Card style={{ padding: 12, marginTop: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 8 }}>⚡ Quick Actions</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                          <Pressable 
                            onPress={() => {
                              setSelectedStudentId(null);
                              setProfileData(null);
                              openEditStudent(profileData.student);
                            }}
                            style={{ 
                              flex: 1, 
                              height: 32, 
                              borderWidth: 1, 
                              borderColor: theme.border, 
                              borderRadius: 6, 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              backgroundColor: theme.surface 
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text }}>✏️ Edit Student</Text>
                          </Pressable>

                          <Pressable 
                            onPress={() => {
                              setSelectedStudentId(null);
                              setProfileData(null);
                              if (props.setSearchSelectionStudentId && props.onNavigate) {
                                props.setSearchSelectionStudentId(profileData.student._id);
                                props.onNavigate('fees');
                              }
                            }}
                            style={{ 
                              flex: 1, 
                              height: 32, 
                              borderWidth: 1, 
                              borderColor: theme.border, 
                              borderRadius: 6, 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              backgroundColor: theme.surface 
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text }}>💰 Collect Fee</Text>
                          </Pressable>

                          <Pressable 
                            onPress={() => {
                              setProfileTab('fee');
                            }}
                            style={{ 
                              flex: 1, 
                              height: 32, 
                              borderWidth: 1, 
                              borderColor: theme.border, 
                              borderRadius: 6, 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              backgroundColor: theme.surface 
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text }}>📄 Ledger</Text>
                          </Pressable>
                        </View>
                      </Card>
                    )}

                    {['Pending', 'Hold'].includes(profileData.student.status) && (
                      <Card style={{ padding: 12, marginTop: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Admission Verification (Phase 2)</Text>
                        {[
                          { label: 'Birth Certificate', checked: docBirthCert, set: setDocBirthCert },
                          { label: 'Aadhaar Card', checked: docAadhaar, set: setDocAadhaar },
                          { label: 'Transfer Certificate (TC)', checked: docTC, set: setDocTC },
                          { label: 'Report Card', checked: docReportCard, set: setDocReportCard },
                          { label: 'Passport Photo', checked: docPhoto, set: setDocPhoto }
                        ].map((doc, index) => (
                          <Pressable key={index} onPress={() => doc.set(!doc.checked)} style={styles.checklistLine}>
                            <View style={[styles.checkboxBox, { borderColor: '#EF4444', backgroundColor: doc.checked ? '#EF4444' : 'transparent' }]}>
                              {doc.checked && <Text style={{ color: '#ffffff', fontSize: 8 }}>✓</Text>}
                            </View>
                            <Text style={{ fontSize: 10, color: theme.text }}>{doc.label}</Text>
                          </Pressable>
                        ))}

                        <View style={styles.decisionBtns}>
                          {profileData.student.status === 'Pending' && (
                            <Pressable onPress={handleHold} style={[styles.decisionBtn, { backgroundColor: '#3B82F6' }]} disabled={submitting}>
                              <Text style={styles.decisionBtnText}>Put on Hold</Text>
                            </Pressable>
                          )}
                          <Pressable onPress={handleReject} style={[styles.decisionBtn, { backgroundColor: '#DC3545' }]} disabled={submitting}>
                            <Text style={styles.decisionBtnText}>Reject Request</Text>
                          </Pressable>
                        </View>
 
                        <Pressable onPress={handleApprove} style={[styles.modalApproveBtn, { marginTop: 10, alignSelf: 'stretch' }]} disabled={submitting}>
                          {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalApproveBtnText}>Verify &amp; Approve Student</Text>}
                        </Pressable>
                      </Card>
                    )}
                  </View>
                )}

                {/* TAB 2: PERSONAL DETAILS */}
                {profileTab === 'personal' && (
                  <Card style={{ padding: 12 }}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Gender: {profileData.student.gender || 'Male'}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Date of Birth: {profileData.student.dob ? new Date(profileData.student.dob).toLocaleDateString() : 'N/A'}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Blood Group: {profileData.student.bloodGroup}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Religion: {profileData.student.religion || 'Hindu'}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Category: {profileData.student.category || 'General'}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Emergency Call: {profileData.student.emergencyContact}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Student Aadhaar: {profileData.student.aadhaar || 'N/A'}</Text>
                  </Card>
                )}

                {/* TAB 3: PARENT DETAILS */}
                {profileTab === 'parents' && (
                  <Card style={{ padding: 12 }}>
                    <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>Father: {profileData.student.parent?.fatherName}</Text>
                    <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800', marginTop: 4 }}>Mother: {profileData.student.parent?.motherName}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 6 }}>Phone: {profileData.student.parent?.phone}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Email: {profileData.student.parent?.email || 'N/A'}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Aadhaar: {profileData.student.parent?.aadhaar || 'N/A'}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Address: {profileData.student.parent?.address}</Text>
                  </Card>
                )}

                {/* TAB 4: FEE STRUCTURE */}
                {profileTab === 'fee' && (
                  <Card style={{ padding: 12 }}>
                    {profileData.fee ? (
                      <View>
                        <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '800' }}>Pending Balance: ₹{profileData.fee.balanceAmount.toLocaleString()}</Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Total Fee: ₹{profileData.fee.totalAmount.toLocaleString()} | Paid: ₹{profileData.fee.paidAmount.toLocaleString()}</Text>
                        
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginTop: 10 }}>Collections History:</Text>
                        {profileData.fee.payments && profileData.fee.payments.map((p: any, idx: number) => (
                          <View key={idx} style={{ paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 10, color: theme.text }}>Receipt: {p.receiptNumber} | Amount: ₹{p.amount}</Text>
                            <Text style={{ fontSize: 8, color: theme.textSecondary }}>Method: {p.paymentMethod} | Date: {new Date(p.date).toLocaleDateString()}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Estimated Registration Fees Breakdown:</Text>
                        {Object.keys(profileData.student.customFees || {}).map(head => {
                          const val = profileData.student.customFees[head] || 0;
                          return (
                            <View key={head} style={styles.detailRowLine}>
                              <Text style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'capitalize' }}>{head} Fee</Text>
                              <Text style={{ fontSize: 11, color: theme.text, fontWeight: '800' }}>₹{val.toLocaleString()}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Card>
                )}


              </ScrollView>

              <View style={styles.modalActionsRow}>
                {['Pending', 'Hold', 'Approved'].includes(profileData.student.status) ? (
                  <Pressable style={[styles.archiveBtn, { borderColor: '#E2E8F0', marginRight: 10 }]} onPress={() => {
                    setArchiveReason('Transferred');
                    setArchiveRemarks('');
                    setShowArchiveModal(true);
                  }}>
                    <Trash2 size={14} color="#64748B" />
                    <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '800', marginLeft: 4 }}>Archive</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable style={{ backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8, flexDirection: 'row', alignItems: 'center' }} onPress={handleRestore}>
                      <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '800' }}>Restore Student</Text>
                    </Pressable>
                    <Pressable style={{ backgroundColor: '#DC3545', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8, flexDirection: 'row', alignItems: 'center' }} onPress={handlePermanentDelete}>
                      <Trash2 size={12} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '800' }}>Delete Permanently</Text>
                    </Pressable>
                  </>
                )}
                
                <Pressable style={[styles.modalCancelBtn, { borderColor: theme.border, flex: 1 }]} onPress={() => { setSelectedStudentId(null); setProfileData(null); }}>
                  <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800', textAlign: 'center' }}>Close Profile</Text>
                </Pressable>
              </View>

            {/* ================= ARCHIVE OVERLAY PANEL ================= */}
            {showArchiveModal && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000
              }}>
                <Card style={{ width: '85%', padding: 20, backgroundColor: theme.surface, borderRadius: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text, marginBottom: 12 }}>Archive Student Record</Text>
                  
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.textSecondary, marginBottom: 8 }}>Reason for Archiving:</Text>
                  {['Transferred', 'Alumni', 'Left School', 'Other'].map(r => (
                    <Pressable 
                      key={r} 
                      onPress={() => setArchiveReason(r as any)}
                      style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}
                    >
                      <View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        borderWidth: 1.5,
                        borderColor: archiveReason === r ? '#EF4444' : theme.textSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8
                      }}>
                        {archiveReason === r && (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: theme.text }}>{r}</Text>
                    </Pressable>
                  ))}

                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.textSecondary, marginTop: 12, marginBottom: 4 }}>Remarks (Optional):</Text>
                  <TextInput
                    style={[styles.modalInput, { color: theme.text, borderColor: theme.border, height: 36, paddingVertical: 6, marginVertical: 0 }]}
                    value={archiveRemarks}
                    onChangeText={setArchiveRemarks}
                    placeholder="Enter remarks..."
                    placeholderTextColor={theme.textSecondary}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <Pressable 
                      onPress={() => setShowArchiveModal(false)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}
                    >
                      <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>Cancel</Text>
                    </Pressable>
                    <Pressable 
                      onPress={handleArchiveSubmit}
                      style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>Archive Student</Text>
                    </Pressable>
                  </View>
                </Card>
              </View>
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
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterChipPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
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
  admissionCard: {
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
    backgroundColor: '#EF444415',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
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
    borderRadius: 20,
    padding: 16,
  },
  smallModalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
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
  dropdownTrigger: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  dropdownOptions: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  feeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  smallFeeInput: {
    width: 80,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    fontSize: 11,
    textAlign: 'right',
    backgroundColor: '#ffffff',
  },
  feeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
  checklistLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  decisionBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  modalApproveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApproveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  archiveOptionPill: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  detailRowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
