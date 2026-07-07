import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';
import { ArrowLeft, Send, Users, User, Bell } from 'lucide-react-native';

interface PrincipalAnnouncementsProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const PrincipalAnnouncements: React.FC<PrincipalAnnouncementsProps> = ({ 
  onBack,
  onSyncAllPortals 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['all']);
  const [targetClass, setTargetClass] = useState('Class VI - A');
  const [classes, setClasses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const loadAnnouncements = async () => {
    try {
      const res = await api.get('/principal/notifications');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/principal/classes');
      setClasses(res.data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadClasses();
  }, []);

  const handleToggleRecipient = (key: string) => {
    if (key === 'all') {
      setRecipients(['all']);
      return;
    }
    setRecipients(prev => {
      let next = prev.filter(r => r !== 'all');
      if (next.includes(key)) {
        next = next.filter(r => r !== key);
      } else {
        next.push(key);
      }
      return next.length === 0 ? ['all'] : next;
    });
  };

  const handlePostNotice = async () => {
    if (!title || !message) {
      return alert('Please fill in title and message details');
    }
    setSubmitting(true);

    try {
      let classId = null;
      if (recipients.includes('class')) {
        const matchedClass = classes.find(c => 
          `${c.name} - ${c.section}`.toLowerCase() === targetClass.trim().toLowerCase() ||
          c.name.toLowerCase() === targetClass.trim().toLowerCase()
        );
        if (matchedClass) {
          classId = matchedClass._id;
        } else {
          setSubmitting(false);
          return alert(`Class "${targetClass}" not found in database.`);
        }
      }

      await api.post('/principal/notification', {
        title,
        message,
        recipientRoles: recipients,
        classId,
        type: 'Announcement'
      });

      alert('Announcement successfully posted and synced across selected portals!');
      setTitle('');
      setMessage('');
      loadAnnouncements();
      onSyncAllPortals();
    } catch (err: any) {
      console.error(err);
      alert('Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#6F42C1" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Broadcast Board</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Send notices and alerts to portals</Text>
          </View>
        </View>

        {/* ================= FORM CARD ================= */}
        <Card style={styles.formCard}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Recipient Audience</Text>
          <View style={styles.recipientRow}>
            {[
              { key: 'all', label: 'All School' },
              { key: 'teacher', label: 'Teachers' },
              { key: 'student', label: 'Students' },
              { key: 'parent', label: 'Parents' },
              { key: 'class', label: 'Specific Class' }
            ].map(opt => {
              const isSelected = recipients.includes(opt.key);
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleToggleRecipient(opt.key)}
                  style={[
                    styles.recipientPill,
                    {
                      backgroundColor: isSelected ? '#6F42C1' : theme.background,
                      borderColor: isSelected ? '#6F42C1' : theme.border,
                    }
                  ]}
                >
                  <Text style={{ color: isSelected ? '#fff' : theme.textSecondary, fontSize: 10, fontWeight: '800' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {recipients.includes('class') && (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Class Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="e.g. Class VI - A, LKG A"
                placeholderTextColor={theme.textSecondary}
                value={targetClass}
                onChangeText={setTargetClass}
              />
            </>
          )}

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notice Title</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Monsoon break advisory"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notice Message / Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Write announcement body here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <Pressable 
            onPress={handlePostNotice}
            disabled={submitting}
            style={[styles.postBtn, { backgroundColor: '#6F42C1' }]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.postBtnText}>Broadcast Notice</Text>
              </>
            )}
          </Pressable>
        </Card>

        {/* ================= RECENT NOTICE LEDGER ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Broadcast History Ledger</Text>
        {announcements.length > 0 ? (
          announcements.map(ann => {
            const getRecipientLabel = (role: string) => {
              switch (role) {
                case 'all': return 'All School';
                case 'teacher': return 'Teachers';
                case 'student': return 'Students';
                case 'parent': return 'Parents';
                default: return 'Specific Class';
              }
            };
            return (
              <Card key={ann._id} style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <View style={[styles.badge, { backgroundColor: '#6F42C115' }]}>
                    <Text style={{ color: '#6F42C1', fontSize: 8, fontWeight: '800' }}>{getRecipientLabel(ann.recipientRole)}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: theme.textSecondary }}>{new Date(ann.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.noticeTitleText, { color: theme.text }]}>{ann.title}</Text>
                <Text style={[styles.noticeDescText, { color: theme.textSecondary }]}>{ann.message}</Text>
              </Card>
            );
          })
        ) : (
          <EmptyState
            title="Broadcast Announcements"
            message="No notice broadcasts or announcements posted yet."
            iconName="Bell"
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
  formCard: {
    padding: 16,
    marginVertical: 0,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  recipientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  recipientPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  postBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginVertical: 14,
  },
  noticeCard: {
    padding: 12,
    marginVertical: 6,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noticeTitleText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeDescText: {
    fontSize: 10,
    lineHeight: 14,
  }
});
