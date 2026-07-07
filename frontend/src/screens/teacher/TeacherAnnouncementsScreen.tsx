import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';
import { ArrowLeft, Bell, Send, UploadCloud, CheckCircle, FileText, Plus, X } from 'lucide-react-native';

interface TeacherAnnouncementsScreenProps {
  onBack: () => void;
  onRefreshData?: () => void;
}

export const TeacherAnnouncementsScreen: React.FC<TeacherAnnouncementsScreenProps> = ({ onBack, onRefreshData }) => {
  const { teacherData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [noticeType, setNoticeType] = useState<'Exam' | 'Holiday' | 'Competition' | 'Meeting' | 'General'>('General');
  const [recipient, setRecipient] = useState<'all' | 'student' | 'parent'>('all');
  
  const [submitting, setSubmitting] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/teacher/announcements');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePost = async () => {
    if (!title || !message) {
      return alert('Please fill in title and message details');
    }
    setSubmitting(true);
    try {
      await api.post('/teacher/announcement', {
        title,
        message,
        type: noticeType,
        recipientRole: recipient
      });

      alert('Announcement posted successfully to selected groups!');
      setTitle('');
      setMessage('');
      fetchNotices();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to post announcement.');
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
            <ArrowLeft size={18} color="#EF4444" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Announcements</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Post notices and classroom alerts</Text>
          </View>
        </View>

        {/* ================= FORM CARD ================= */}
        <Card style={styles.formCard}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notice Category</Text>
          <View style={styles.typeSelectorRow}>
            {['Exam', 'Holiday', 'Competition', 'Meeting', 'General'].map((t) => (
              <Pressable
                key={t}
                onPress={() => setNoticeType(t as any)}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: noticeType === t 
                      ? t === 'Exam' ? '#3B82F6' 
                        : t === 'Holiday' ? '#EF4444' 
                        : t === 'Competition' ? '#10B981'
                        : t === 'Meeting' ? '#8B5CF6' : '#64748B'
                      : theme.background,
                    borderColor: noticeType === t ? 'transparent' : theme.border,
                  }
                ]}
              >
                <Text style={[styles.typeText, { color: noticeType === t ? '#fff' : theme.textSecondary }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Audience</Text>
          <View style={styles.audienceRow}>
            {[
              { key: 'all', label: 'All (Parents & Students)' },
              { key: 'student', label: 'Students Only' },
              { key: 'parent', label: 'Parents Only' },
            ].map(opt => (
              <Pressable
                key={opt.key}
                onPress={() => setRecipient(opt.key as any)}
                style={[
                  styles.audiencePill,
                  {
                    backgroundColor: recipient === opt.key ? colors.primary : theme.background,
                    borderColor: recipient === opt.key ? colors.primary : theme.border,
                  }
                ]}
              >
                <Text style={[styles.audienceText, { color: recipient === opt.key ? '#fff' : theme.textSecondary }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notice Title</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Science Fair Registration open"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notice Details / Body</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Write announcement description here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Attachments</Text>
          <Pressable style={[styles.uploadBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
            <UploadCloud size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Add attachment file (PDF/Image)</Text>
          </Pressable>

          <Pressable 
            onPress={handlePost}
            disabled={submitting}
            style={[styles.postBtn, { backgroundColor: '#EF4444' }]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.postBtnText}>Post Notice</Text>
              </>
            )}
          </Pressable>
        </Card>

        {/* ================= RECENT NOTICES ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Notices</Text>
        {notices.length > 0 ? (
          notices.map((notice: any) => {
            const noticeColor = notice.type === 'Exam' ? '#3B82F6' 
              : notice.type === 'Holiday' ? '#EF4444' 
              : notice.type === 'Competition' ? '#10B981'
              : notice.type === 'Meeting' ? '#8B5CF6' : '#64748B';
            return (
              <Card key={notice._id || notice.id} style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <View style={[styles.noticeBadge, { backgroundColor: noticeColor }]}>
                    <Text style={styles.noticeBadgeText}>{notice.type}</Text>
                  </View>
                  <Text style={[styles.noticeDateText, { color: theme.textSecondary }]}>
                    {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-GB') : 'Today'}
                  </Text>
                </View>
                <Text style={[styles.noticeTitleText, { color: theme.text }]}>{notice.title}</Text>
                <Text style={[styles.noticeDescText, { color: theme.textSecondary }]}>{notice.message || notice.desc}</Text>
              </Card>
            );
          })
        ) : (
          <EmptyState
            title="Announcements"
            message="No notices available."
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
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  audienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  audiencePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    height: 40,
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
  uploadBox: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  postBtn: {
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
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
  noticeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noticeBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  noticeDateText: {
    fontSize: 9,
    fontWeight: '600',
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
