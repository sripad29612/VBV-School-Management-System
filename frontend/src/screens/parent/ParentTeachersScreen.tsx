import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, Search, Users, Phone, Video, Calendar as CalIcon, MessageSquare } from 'lucide-react-native';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';

interface ParentTeachersScreenProps {
  onBack: () => void;
}

export const ParentTeachersScreen: React.FC<ParentTeachersScreenProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const childId = parentData.selectedChildId;

  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (!childId) return;
    const fetchTeachers = async () => {
      try {
        const res = await api.get(`/parent/child/${childId}/teachers`);
        setTeachers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeachers();
  }, [childId]);

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSchedulePTM = (teacherName: string) => {
    alert(`PTM appointment requested with ${teacherName}. You will receive a notification once approved.`);
  };

  return (
    <View style={styles.container}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Teachers Directory</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Direct contact with child instructors</Text>
        </View>
        <Users size={20} color={colors.primary} />
      </View>

      {/* ================= SEARCH BAR ================= */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <Search size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search teachers or subject specialties..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ================= LIST CONTENT ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((t, idx) => (
            <View 
              key={idx} 
              style={[styles.teacherCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>{t.name.split(' ')[1]?.[0] || 'T'}</Text>
                  {t.isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.teacherDetails}>
                  <Text style={[styles.teacherName, { color: theme.text }]}>{t.name}</Text>
                  <Text style={[styles.teacherRole, { color: theme.textSecondary }]}>{t.role}</Text>
                  <View style={styles.onlineBadge}>
                    <Text style={{ fontSize: 8, color: t.isOnline ? colors.success : theme.textSecondary, fontWeight: '800' }}>
                      {t.isOnline ? 'ONLINE NOW' : 'OFFLINE'}
                    </Text>
                  </View>
                </View>
                {t.unread && (
                  <View style={styles.unreadMessageBadge}>
                    <Text style={styles.unreadText}>1</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.cardActions}>
                <Pressable 
                  onPress={() => alert(`Dialing voice call to ${t.name}`)}
                  style={[styles.actionBtnCircle, { backgroundColor: colors.success + '10' }]}
                >
                  <Phone size={16} color={colors.success} />
                </Pressable>
                
                <Pressable 
                  onPress={() => alert(`Starting video call connection with ${t.name}`)}
                  style={[styles.actionBtnCircle, { backgroundColor: colors.primary + '10' }]}
                >
                  <Video size={16} color={colors.primary} />
                </Pressable>

                <Pressable 
                  onPress={() => alert(`Opening Direct Chat with ${t.name}`)}
                  style={[styles.actionBtnCircle, { backgroundColor: colors.secondary + '10' }]}
                >
                  <MessageSquare size={16} color={colors.secondary} />
                </Pressable>

                <Pressable 
                  onPress={() => handleSchedulePTM(t.name)}
                  style={[styles.ptmButton, { backgroundColor: colors.primary }]}
                >
                  <CalIcon size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.ptmText}>Schedule PTM</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="Teachers Directory"
            message="No class teachers registered."
            iconName="Users"
          />
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
    paddingBottom: 90,
    paddingHorizontal: 16,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  teacherCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '900',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  teacherDetails: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '800',
  },
  teacherRole: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  onlineBadge: {
    marginTop: 4,
  },
  unreadMessageBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ptmButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ptmText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
