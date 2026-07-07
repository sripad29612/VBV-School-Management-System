import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors } from '../theme/colors';

interface IDCardProps {
  studentData: {
    name: string;
    rollNumber: string;
    admissionNumber: string;
    class: string;
    section: string;
    bloodGroup: string;
    dob: string;
    emergencyContact: string;
    qrCode: string;
    photo?: string;
  };
}

export const IDCard: React.FC<IDCardProps> = ({ studentData }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const getSchoolSettings = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('admin_school_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return {
      schoolName: 'VIDYA BHARATHI VIDYAPEETH',
      schoolAddress: 'Palsi, Kubeer, Nirmal',
      schoolMotto: 'VIDYA DADATI VINAYAM',
      udiseCode: '36161101901',
      affiliationNumber: '3630042',
      schoolBoard: 'State Board'
    };
  };

  const settings = getSchoolSettings();

  return (
    <Pressable onPress={() => setIsFlipped(!isFlipped)} style={styles.container}>
      {!isFlipped ? (
        // FRONT SIDE OF ID CARD
        <View style={[styles.cardSide, { backgroundColor: theme.surface, borderColor: colors.primary }]}>
          {/* Header Banner */}
          <View style={styles.header}>
            <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.schoolName, { fontSize: 11 }]} numberOfLines={1}>{settings.schoolName}</Text>
              <Text style={styles.schoolAddress} numberOfLines={1}>{settings.schoolAddress}</Text>
              <Text style={{ fontSize: 7, color: colors.secondary, fontWeight: '700' }}>UDISE: {settings.udiseCode} | Board: {settings.schoolBoard}</Text>
            </View>
          </View>
          
          <View style={styles.body}>
            {/* Left: Info */}
            <View style={styles.infoCol}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>NAME</Text>
              <Text style={[styles.val, { color: theme.text }]} numberOfLines={1}>{studentData.name}</Text>

              <Text style={[styles.label, { color: theme.textSecondary }]}>ROLL NUMBER</Text>
              <Text style={[styles.val, { color: theme.text }]}>{studentData.rollNumber}</Text>

              <Text style={[styles.label, { color: theme.textSecondary }]}>CLASS & SECTION</Text>
              <Text style={[styles.val, { color: theme.text }]}>{studentData.class} - {studentData.section || 'A'}</Text>
              
              <Text style={[styles.label, { color: theme.textSecondary }]}>EMERGENCY CALL</Text>
              <Text style={[styles.val, { color: colors.secondary, fontWeight: '700' }]}>{studentData.emergencyContact}</Text>
            </View>

            {/* Right: Photo & QR */}
            <View style={styles.photoCol}>
              <View style={styles.photoContainer}>
                {/* Fallback to initials if photo is empty */}
                <Text style={styles.avatarText}>{studentData.name.charAt(0)}</Text>
              </View>
              {studentData.qrCode ? (
                <Image source={{ uri: studentData.qrCode }} style={styles.qrCode} />
              ) : (
                <View style={styles.qrPlaceholder} />
              )}
            </View>
          </View>

          {/* Footer Card Ribbon */}
          <View style={[styles.ribbon, { backgroundColor: colors.primary }]}>
            <Text style={styles.ribbonText}>STUDENT IDENTITY CARD</Text>
            <Text style={styles.flipHint}>Tap to flip</Text>
          </View>
        </View>
      ) : (
        // BACK SIDE OF ID CARD
        <View style={[styles.cardSide, { backgroundColor: theme.surface, borderColor: colors.secondary }]}>
          {/* Header Banner */}
          <View style={[styles.header, { borderBottomColor: colors.secondary }]}>
            <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.schoolName, { fontSize: 11 }]} numberOfLines={1}>{settings.schoolName}</Text>
            </View>
          </View>

          <View style={styles.backBody}>
            <View style={styles.detailRow}>
              <Text style={[styles.backLabel, { color: theme.textSecondary }]}>Admission Number:</Text>
              <Text style={[styles.backVal, { color: theme.text }]}>{studentData.admissionNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.backLabel, { color: theme.textSecondary }]}>Date of Birth:</Text>
              <Text style={[styles.backVal, { color: theme.text }]}>
                {new Date(studentData.dob).toLocaleDateString('en-GB')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.backLabel, { color: theme.textSecondary }]}>Blood Group:</Text>
              <Text style={[styles.backVal, { color: colors.danger, fontWeight: 'bold' }]}>{studentData.bloodGroup}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.backLabel, { color: theme.textSecondary }]}>Address:</Text>
              <Text style={[styles.backVal, { color: theme.text }]} numberOfLines={2}>
                {settings.schoolAddress}
              </Text>
            </View>

            <View style={styles.ruleBox}>
              <Text style={[styles.ruleTitle, { color: colors.secondary }]}>TERMS & CONDITIONS</Text>
              <Text style={[styles.ruleText, { color: theme.textSecondary }]}>
                1. This card is non-transferable and remains the property of the school.
                2. Loss of card must be reported immediately to the admin office.
              </Text>
            </View>
          </View>

          {/* Footer Card Ribbon */}
          <View style={[styles.ribbon, { backgroundColor: colors.secondary }]}>
            <Text style={styles.ribbonText}>{settings.schoolMotto.toUpperCase()}</Text>
            <Text style={styles.flipHint}>Tap to flip</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    height: 240,
    marginVertical: 12,
    alignSelf: 'center',
  },
  cardSide: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B5ED7',
    letterSpacing: 0.5,
  },
  schoolNameSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F57C00',
    marginTop: -2,
  },
  schoolAddress: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
  },
  infoCol: {
    flex: 2,
    justifyContent: 'space-around',
  },
  photoCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  val: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0B5ED7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  qrCode: {
    width: 45,
    height: 45,
  },
  qrPlaceholder: {
    width: 45,
    height: 45,
    backgroundColor: '#cbd5e1',
  },
  ribbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  ribbonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  flipHint: {
    color: '#ffffff',
    fontSize: 7,
    fontStyle: 'italic',
  },
  backBody: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  backLabel: {
    fontSize: 10,
    fontWeight: '600',
    width: 120,
  },
  backVal: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  ruleBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  ruleTitle: {
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
  },
  ruleText: {
    fontSize: 7,
    lineHeight: 9,
  },
});
