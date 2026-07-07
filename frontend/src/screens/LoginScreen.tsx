import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { loginRequest, loginSuccess, loginFailure, clearError } from '../store/authSlice';
import { colors } from '../theme/colors';
import api from '../services/api';
import { Eye, EyeOff, Lock, User as UserIcon, Phone, AlertCircle, ArrowLeft, GraduationCap, Users, UserCheck, ShieldAlert } from 'lucide-react-native';

export const LoginScreen = ({
  initialRole,
  initialStep
}: {
  initialRole?: 'student' | 'parent' | 'teacher' | 'principal' | 'admin',
  initialStep?: 'choice' | 'input'
} = {}) => {
  // Navigation inside login flow
  // 'choice' shows the 4 role cards grid (Screen 8)
  // 'input' shows the credential entry fields (Screens 9-12)
  const [loginStep, setLoginStep] = useState<'choice' | 'input'>(initialStep || 'choice');
  const [role, setRole] = useState<'student' | 'parent' | 'teacher' | 'principal' | 'admin'>(initialRole || 'student');
  
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
    if (initialStep) {
      setLoginStep(initialStep);
    }
    if (initialRole) {
      if (initialRole === 'student') {
        setRollNumber('STD001');
        setPassword('VBV@123');
      } else if (initialRole === 'parent') {
        setPhone('9948360000');
        setPassword('VBV@321');
      } else if (initialRole === 'teacher') {
        setTeacherId('TCH001');
        setPassword('VBV$3210');
      } else if (initialRole === 'principal') {
        setUsername('VIDYABHARATHI');
        setPassword('VBV112233445566$');
      } else if (initialRole === 'admin') {
        setUsername('ADMIN');
        setPassword('VBV@admin2026');
      }
    }
  }, [initialRole, initialStep]);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  // Clear errors when switching steps or roles
  useEffect(() => {
    dispatch(clearError());
  }, [role, loginStep, dispatch]);

  // Path routing listener for web
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/admin-login') {
        setRole('admin');
        setLoginStep('input');
        // Pre-populate admin demo credentials
        setUsername('ADMIN');
        setPassword('VBV@admin2026');
      }
    }
  }, []);

  const selectRolePortal = (selectedRole: 'student' | 'parent' | 'teacher' | 'principal' | 'admin') => {
    setRole(selectedRole);
    setLoginStep('input');
    setRollNumber('');
    setPhone('');
    setTeacherId('');
    setUsername('');
    setPassword('');
  };

  const handleLoginSubmit = async () => {
    dispatch(loginRequest());
    let loginData = {};
    let endpoint = '/auth/login/';

    if (role === 'student') {
      if (!rollNumber || !password) {
        return dispatch(loginFailure('Please enter student roll number'));
      }
      loginData = { rollNumber, password };
      endpoint += 'student';
    } else if (role === 'parent') {
      if (!phone || !password) {
        return dispatch(loginFailure('Please enter registered phone number'));
      }
      loginData = { phone, password };
      endpoint += 'parent';
    } else if (role === 'teacher') {
      if (!teacherId || !password) {
        return dispatch(loginFailure('Please enter teacher ID'));
      }
      loginData = { teacherId, password };
      endpoint += 'teacher';
    } else if (role === 'principal') {
      if (!username || !password) {
        return dispatch(loginFailure('Please enter principal credentials'));
      }
      loginData = { username, password };
      endpoint += 'principal';
    } else if (role === 'admin') {
      if (!username || !password) {
        return dispatch(loginFailure('Please enter administrator credentials'));
      }
      loginData = { username, password };
      endpoint += 'admin';
    }

    try {
      const response = await api.post(endpoint, loginData);
      dispatch(loginSuccess({
        user: response.data.details || { _id: response.data._id, name: 'Chief Administrator' },
        token: response.data.token,
        role: response.data.role
      }));
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login failed, please check details';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}>
      
      {/* ================= STEP A: SELECT ROLE PORTAL (Screen 8) ================= */}
      {loginStep === 'choice' && (
        <View style={[styles.choiceContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.choiceTitle, { color: theme.text }]}>Welcome Back!</Text>
          <Text style={[styles.choiceSubtitle, { color: theme.textSecondary }]}>Select the portal you want to access</Text>

          <View style={styles.cardsGrid}>
            <Pressable 
              onPress={() => selectRolePortal('student')} 
              style={[styles.portalCard, { borderColor: '#0B5ED7', backgroundColor: isDarkMode ? '#1e293b' : '#F8FAFC' }]}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <GraduationCap size={26} color="#0B5ED7" />
              </View>
              <Text style={[styles.portalCardText, { color: theme.text }]}>Student Portal</Text>
            </Pressable>

            <Pressable 
              onPress={() => selectRolePortal('parent')} 
              style={[styles.portalCard, { borderColor: '#F57C00', backgroundColor: isDarkMode ? '#1e293b' : '#F8FAFC' }]}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: '#FFE8CC' }]}>
                <Users size={26} color="#F57C00" />
              </View>
              <Text style={[styles.portalCardText, { color: theme.text }]}>Parent Portal</Text>
            </Pressable>

            <Pressable 
              onPress={() => selectRolePortal('teacher')} 
              style={[styles.portalCard, { borderColor: '#198754', backgroundColor: isDarkMode ? '#1e293b' : '#F8FAFC' }]}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: '#D1E7DD' }]}>
                <UserCheck size={26} color="#198754" />
              </View>
              <Text style={[styles.portalCardText, { color: theme.text }]}>Teacher Portal</Text>
            </Pressable>

            <Pressable 
              onPress={() => selectRolePortal('principal')} 
              style={[styles.portalCard, { borderColor: '#6F42C1', backgroundColor: isDarkMode ? '#1e293b' : '#F8FAFC' }]}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <ShieldAlert size={26} color="#6F42C1" />
              </View>
              <Text style={[styles.portalCardText, { color: theme.text }]}>Principal Portal</Text>
            </Pressable>
          </View>

          {/* Outline graphic at bottom */}
          <Pressable
            onPress={() => {
              setRole('admin');
              setLoginStep('input');
              setUsername('');
              setPassword('');
            }}
            style={[styles.sloganCard, { borderTopColor: theme.border }]}
          >
            <Text style={[styles.sloganText, { color: '#F57C00' }]}>विद्या ददाति विनयम</Text>
            <Text style={[styles.sloganSub, { color: theme.textSecondary }]}>VBV Digital Campus System v2.1</Text>
          </Pressable>
        </View>
      )}

      {/* ================= STEP B: CREDENTIAL FORMS (Screens 9-12) ================= */}
      {loginStep === 'input' && (
        <View style={[styles.loginCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          
          {/* Header Back Button */}
          <Pressable onPress={() => setLoginStep('choice')} style={styles.formBackBtn}>
            <ArrowLeft size={16} color={theme.textSecondary} />
            <Text style={[styles.formBackBtnText, { color: theme.textSecondary }]}>Portals</Text>
          </Pressable>

          {/* Heading with role specific coloring */}
          <Text style={[
            styles.formTitle, 
            { 
              color: role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1'))) 
            }
          ]}>
            {role === 'student' ? 'Student Login' : (role === 'parent' ? 'Parent Login' : (role === 'teacher' ? 'Teacher Login' : (role === 'admin' ? 'Administrator Login' : 'Principal Login')))}
          </Text>
          <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
            Please enter your pre-assigned credentials
          </Text>

          {/* Dynamic Inputs with custom theme coloring */}
          <View style={styles.formContainer}>
            {role === 'student' && (
              <View style={[styles.inputBox, { borderColor: theme.border }]}>
                <UserIcon size={18} color="#0B5ED7" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter Roll Number"
                  placeholderTextColor={theme.textSecondary}
                  value={rollNumber}
                  onChangeText={setRollNumber}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {role === 'parent' && (
              <View style={[styles.inputBox, { borderColor: theme.border }]}>
                <Phone size={18} color="#F57C00" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter Mobile Number"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            )}

            {role === 'teacher' && (
              <View style={[styles.inputBox, { borderColor: theme.border }]}>
                <UserIcon size={18} color="#198754" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter Teacher ID or Name"
                  placeholderTextColor={theme.textSecondary}
                  value={teacherId}
                  onChangeText={setTeacherId}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {role === 'principal' && (
              <View style={[styles.inputBox, { borderColor: theme.border }]}>
                <UserIcon size={18} color="#6F42C1" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter Username"
                  placeholderTextColor={theme.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {role === 'admin' && (
              <View style={[styles.inputBox, { borderColor: theme.border }]}>
                <UserIcon size={18} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter Admin Email"
                  placeholderTextColor={theme.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            )}

            <View style={[styles.inputBox, { borderColor: theme.border }]}>
              <Lock 
                size={18} 
                color={role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1')))} 
                style={styles.inputIcon} 
              />
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: theme.text }]}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={18} color={theme.textSecondary} />
                ) : (
                  <Eye size={18} color={theme.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Remember me & Forgot Password */}
          <View style={styles.optionsRow}>
            <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxRow}>
              <View style={[
                styles.checkbox, 
                { 
                  borderColor: role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1'))), 
                  backgroundColor: rememberMe ? (role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1')))) : 'transparent' 
                }
              ]} />
              <Text style={[styles.checkboxLabel, { color: theme.textSecondary }]}>Remember Me</Text>
            </Pressable>
            <Text style={[
              styles.forgotLabel, 
              { color: role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1'))) }
            ]}>
              Forgot Password?
            </Text>
          </View>

          {/* Error Alert Banner */}
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Action (Color matches role theme) */}
          <Pressable
            onPress={handleLoginSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1'))),
                opacity: (pressed || loading) ? 0.82 : 1,
                shadowColor: role === 'student' ? '#0B5ED7' : (role === 'parent' ? '#F57C00' : (role === 'teacher' ? '#198754' : (role === 'admin' ? '#EF4444' : '#6F42C1'))),
              }
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Login</Text>
            )}
          </Pressable>

          {/* Credentials Help Box */}
          {role === 'admin' && (
            <View style={styles.helpRibbonBox}>
              <Text style={styles.helpRibbonTitle}>Default Administrator</Text>
              <Text style={styles.helpRibbonText}>
                Email: admin@vbv.edu{'\n'}
                Password: VBV@admin2026
              </Text>
            </View>
          )}

        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    alignItems: 'center',
  },
  
  // Step Choice layouts (Screen 8)
  choiceContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#0B5ED7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  choiceSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 20,
  },
  cardsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  portalCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  portalIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  portalCardText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  sloganCard: {
    width: '100%',
    borderTopWidth: 1.5,
    paddingTop: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sloganText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  sloganSub: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },

  // Input layouts
  loginCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
  },
  formBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  formBackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    outlineStyle: 'none' as any,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 6,
  },
  checkboxLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  forgotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBE9',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFC1C0',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 11,
    marginLeft: 8,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  helpRibbonBox: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpRibbonTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  helpRibbonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
});

