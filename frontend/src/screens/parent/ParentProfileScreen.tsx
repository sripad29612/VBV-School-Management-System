import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toggleTheme } from '../../store/themeSlice';
import { logout } from '../../store/authSlice';
import { colors } from '../../theme/colors';
import { User, Shield, Moon, LogOut, Phone, Home, FileText, ChevronRight, ArrowLeft } from 'lucide-react-native';

interface ParentProfileScreenProps {
  onBack?: () => void;
}

export const ParentProfileScreen: React.FC<ParentProfileScreenProps> = ({ onBack }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const profile = parentData.dashboard || {
    fatherName: 'Father Name',
    motherName: 'Mother Name',
    phone: '+919999999999',
    address: 'Address Details'
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Settings & Account</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Parent account settings & campus policies</Text>
        </View>
        <User size={20} color={colors.primary} />
      </View>

      {/* ================= BIO DETAILS ================= */}
      <View style={[styles.settingsGroupCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <Text style={[styles.groupLabel, { color: colors.primary }]}>PARENT IDENTITIES</Text>
        
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Text style={[styles.detailTitle, { color: theme.textSecondary }]}>Father Name</Text>
            <Text style={[styles.detailVal, { color: theme.text }]}>{profile.fatherName}</Text>
          </View>
          <User size={16} color={theme.textSecondary} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Text style={[styles.detailTitle, { color: theme.textSecondary }]}>Mother Name</Text>
            <Text style={[styles.detailVal, { color: theme.text }]}>{profile.motherName}</Text>
          </View>
          <User size={16} color={theme.textSecondary} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Text style={[styles.detailTitle, { color: theme.textSecondary }]}>Contact Phone</Text>
            <Text style={[styles.detailVal, { color: theme.text }]}>{profile.phone}</Text>
          </View>
          <Phone size={16} color={theme.textSecondary} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Text style={[styles.detailTitle, { color: theme.textSecondary }]}>Residential Address</Text>
            <Text style={[styles.detailVal, { color: theme.text }]}>{profile.address}</Text>
          </View>
          <Home size={16} color={theme.textSecondary} />
        </View>
      </View>

      {/* ================= PREFERENCES ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>App Settings</Text>
      <View style={[styles.settingsGroupCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Moon size={18} color={theme.text} style={{ marginRight: 10 }} />
            <Text style={[styles.toggleText, { color: theme.text }]}>Dark Mode Theme</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={handleToggleTheme}
            trackColor={{ false: '#CBD5E1', true: colors.primary + '60' }}
            thumbColor={isDarkMode ? colors.primary : '#F1F5F9'}
          />
        </View>
      </View>

      {/* ================= CAMPUS POLICIES ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>School Guidelines</Text>
      <View style={[styles.settingsGroupCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {[
          { label: 'VBV Code of Conduct', icon: Shield },
          { label: 'Tuition Installment Policy', icon: FileText }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <Pressable 
              key={index}
              onPress={() => alert(`Opening ${item.label}...`)}
              style={styles.clickableRow}
            >
              <View style={styles.clickableLeft}>
                <Icon size={16} color={theme.textSecondary} style={{ marginRight: 10 }} />
                <Text style={[styles.clickableText, { color: theme.text }]}>{item.label}</Text>
              </View>
              <ChevronRight size={14} color={theme.textSecondary} />
            </Pressable>
          );
        })}
      </View>

      {/* ================= LOGOUT BUTTON ================= */}
      <Pressable 
        onPress={handleLogout} 
        style={[styles.logoutBtn, { backgroundColor: colors.danger }]}
      >
        <LogOut size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Logout Account</Text>
      </Pressable>

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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  settingsGroupCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  groupLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.0,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLeft: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clickableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  clickableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickableText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    height: 48,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
