import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, GraduationCap, ShieldAlert, BookOpen, RotateCw, MapPin, Phone } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface DigitalIDScreenProps {
  onBack?: () => void;
  hideHeader?: boolean;
}

export const DigitalIDScreen: React.FC<DigitalIDScreenProps> = ({ onBack, hideHeader = false }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Flip animation states
  const [isFlipped, setIsFlipped] = useState(false);
  const flipValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleFlipCard = () => {
    Animated.spring(flipValue, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  if (!studentData.digitalId) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {!hideHeader && (
          <View style={styles.header}>
            {onBack && (
              <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ArrowLeft size={18} color={colors.primary} />
              </Pressable>
            )}
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Digital ID Card</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Secure student identification badge</Text>
            </View>
          </View>
        )}
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Digital ID"
            message="Student ID Card is not generated yet."
            iconName="GraduationCap"
          />
        </View>
      </Animated.View>
    );
  }

  const idData = studentData.digitalId;

  // Interpolations for card rotate transitions
  const frontInterpolate = flipValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      {!hideHeader && (
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ArrowLeft size={18} color={colors.primary} />
            </Pressable>
          )}
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Digital ID Card</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Secure student identification badge</Text>
          </View>
          <View style={styles.headerIconContainer}>
            <GraduationCap size={20} color={colors.primary} />
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
          Tap the card or click the button below to flip and view the emergency contact information and rules list.
        </Text>

        {/* ================= FLIP CARD WRAPPER ================= */}
        <Pressable onPress={handleFlipCard} style={styles.idCardOuterWrapper}>
          
          {/* A. CARD FRONT SIDE */}
          <Animated.View style={[
            styles.idCard, 
            styles.cardFront, 
            frontAnimatedStyle,
            { shadowColor: colors.primary }
          ]}>
            <View style={styles.cardOverlay}>
              {/* Logo Row */}
              <View style={styles.logoRow}>
                <Image source={require('../../../assets/logo.jpg')} style={styles.schoolLogo} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.schoolNameText}>{idData.schoolName}</Text>
                  <Text style={styles.idLabelText}>STUDENT IDENTITY BADGE</Text>
                </View>
              </View>

              {/* Photo & Main Details */}
              <View style={styles.studentDetailsContainer}>
                <View style={styles.photoContainer}>
                  {idData.photo ? (
                    <Image source={{ uri: idData.photo }} style={styles.studentPhoto} />
                  ) : (
                    <View style={styles.photoFallback}>
                      <GraduationCap size={36} color="rgba(255,255,255,0.7)" />
                    </View>
                  )}
                </View>

                <View style={styles.detailsList}>
                  <Text style={styles.studentNameText} numberOfLines={1}>{idData.name}</Text>
                  <Text style={styles.classDetailsText}>{idData.class && idData.class.startsWith('Class') ? idData.class : `Class ${idData.class}`} - Sec {idData.section || 'A'}</Text>
                  
                  <View style={styles.metaInfoRow}>
                    <View style={styles.metaColumn}>
                      <Text style={styles.metaHeader}>ROLL NO</Text>
                      <Text style={styles.metaVal}>{idData.rollNumber}</Text>
                    </View>
                    <View style={styles.metaColumn}>
                      <Text style={styles.metaHeader}>BLOOD GROUP</Text>
                      <Text style={styles.metaVal}>{idData.bloodGroup || 'B+'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* QR Code & Validity Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.validityBox}>
                  <Text style={styles.validityLabel}>VALID THRU</Text>
                  <Text style={styles.validityDate}>APRIL 2027</Text>
                </View>

                <View style={styles.qrCodeBox}>
                  {idData.qrCode ? (
                    <Image source={{ uri: idData.qrCode }} style={styles.qrCodeImg} />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <Text style={styles.qrPlaceholderText}>VBV</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* B. CARD BACK SIDE */}
          <Animated.View style={[
            styles.idCard, 
            styles.cardBack, 
            backAnimatedStyle,
            { shadowColor: colors.primary }
          ]}>
            <View style={styles.cardBackOverlay}>
              <Text style={styles.backHeaderTitle}>EMERGENCY DETAILS</Text>
              
              {/* Details grid */}
              <View style={styles.backDetailsGrid}>
                <View style={styles.backDetailItem}>
                  <Phone size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.backDetailLabel}>Emergency Contact</Text>
                    <Text style={styles.backDetailVal}>{idData.emergencyContact || '+91 99483 70709'}</Text>
                  </View>
                </View>
                <View style={styles.backDetailItem}>
                  <Phone size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.backDetailLabel}>School Contact</Text>
                    <Text style={styles.backDetailVal}>+91 99483 69209</Text>
                  </View>
                </View>
                <View style={styles.backDetailItem}>
                  <MapPin size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.backDetailLabel}>Residential Address</Text>
                    <Text style={styles.backDetailVal} numberOfLines={1}>{idData.address}</Text>
                  </View>
                </View>
              </View>

              {/* Guidelines / Rules */}
              <View style={styles.rulesSection}>
                <View style={styles.rulesHeader}>
                  <BookOpen size={12} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.rulesTitle}>VBV Code of Conduct</Text>
                </View>
                <Text style={styles.rulesBullet}>1. ID card must be worn visible on school campus at all times.</Text>
                <Text style={styles.rulesBullet}>2. Attendance record is strictly monitored; maintain above 85%.</Text>
                <Text style={styles.rulesBullet}>3. Report loss of ID card to principal office immediately.</Text>
              </View>

              {/* Footer */}
              <View style={styles.backFooter}>
                <ShieldAlert size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.validityMsg}>This badge is property of VBV Palsi. Non-transferable.</Text>
              </View>
            </View>
          </Animated.View>

        </Pressable>

        {/* ================= ACTIONS ================= */}
        <Pressable 
          onPress={handleFlipCard}
          style={({ pressed }) => [
            styles.flipBtn,
            { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
        >
          <RotateCw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.flipBtnText}>{isFlipped ? 'Show Badge Front' : 'Show Emergency Contacts'}</Text>
        </Pressable>

      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    alignSelf: 'stretch',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  idCardOuterWrapper: {
    width: 320,
    height: 460,
    position: 'relative',
    marginBottom: 24,
    // Enable perspective for 3D flip effect on Web
    ...({
      perspective: 1000,
    } as any),
  },
  idCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    zIndex: 2,
    ...({
      backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
    } as any),
    backgroundColor: '#2563EB',
  },
  cardBack: {
    zIndex: 1,
    ...({
      backgroundImage: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    } as any),
    backgroundColor: '#1E293B',
    transform: [{ rotateY: '180deg' }],
  },
  cardOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardBackOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 16,
  },
  schoolLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  schoolNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  idLabelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  studentDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 18,
  },
  photoContainer: {
    width: 90,
    height: 110,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  studentPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsList: {
    flex: 1,
    justifyContent: 'center',
  },
  studentNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  classDetailsText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  metaInfoRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 16,
  },
  metaColumn: {
    justifyContent: 'center',
  },
  metaHeader: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },
  validityBox: {
    justifyContent: 'center',
  },
  validityLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  validityDate: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  qrCodeBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeImg: {
    width: '100%',
    height: '100%',
  },
  qrPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  qrPlaceholderText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
  },
  backHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.0,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 10,
    textAlign: 'center',
  },
  backDetailsGrid: {
    marginVertical: 14,
    gap: 12,
  },
  backDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backDetailLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backDetailVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    maxWidth: 220,
  },
  rulesSection: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rulesTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rulesBullet: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 4,
  },
  backFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 12,
    gap: 8,
  },
  validityMsg: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 8,
    fontWeight: '600',
    flex: 1,
  },
  flipBtn: {
    width: 320,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  flipBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
