import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { 
  ArrowLeft, MessageSquare, Send, Mic, Video, Users, 
  Calendar as CalIcon, ChevronRight, User, PlusCircle, Check
} from 'lucide-react-native';

interface TeacherParentCommScreenProps {
  onBack: () => void;
}

export const TeacherParentCommScreen: React.FC<TeacherParentCommScreenProps> = ({ onBack }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const tData = useSelector((state: RootState) => state.dashboard.teacherData);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [activeTab, setActiveTab] = useState<'chat' | 'broadcast' | 'ptm'>('chat');
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  
  // Chat States
  const [typedMessage, setTypedMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Broadcast states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // PTM states
  const [ptmDate, setPtmDate] = useState('');
  const [ptmTime, setPtmTime] = useState('');
  const [ptmClass, setPtmClass] = useState('');
  const [ptmReason, setPtmReason] = useState('Academic progress review');

  useEffect(() => {
    if (tData?.dashboard?.assignedClass) {
      setPtmClass(tData.dashboard.assignedClass);
    } else {
      setPtmClass('No class assigned.');
    }
  }, [tData?.dashboard?.assignedClass]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const res = await api.get('/chat/contacts');
        // Only keep parents
        const filtered = (res.data || []).filter((c: any) => c.role === 'parent');
        setContacts(filtered);
      } catch (err) {
        console.error('Failed to fetch chat contacts:', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedParent) {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/chat/history/${selectedParent._id}`);
          setChatHistory(res.data.map((msg: any) => ({
            sender: msg.sender === user?._id ? 'teacher' : 'parent',
            text: msg.message,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        } catch (err) {
          console.error('Failed to fetch chat history:', err);
        }
      };
      fetchHistory();
      const interval = setInterval(fetchHistory, 5000);
      return () => clearInterval(interval);
    } else {
      setChatHistory([]);
    }
  }, [selectedParent, user?._id]);

  const quickReplies = [
    "Thank you. I will review this.",
    "Please send a formal leave application.",
    "We can discuss this during the next PTM.",
    "Please check the study material section."
  ];

  const handleSendChat = async () => {
    if (!typedMessage || !selectedParent) return;
    try {
      await api.post('/chat/send', {
        receiverId: selectedParent._id,
        message: typedMessage
      });
      setChatHistory(prev => [...prev, { sender: 'teacher', text: typedMessage, time: 'Just Now' }]);
      setTypedMessage('');
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (!selectedParent) return;
    try {
      await api.post('/chat/send', {
        receiverId: selectedParent._id,
        message: reply
      });
      setChatHistory(prev => [...prev, { sender: 'teacher', text: reply, time: 'Just Now' }]);
    } catch (err) {
      alert('Failed to send quick reply.');
    }
  };

  const handleVoiceRecordSimulate = () => {
    if (recording) {
      setRecording(false);
      setChatHistory(prev => [...prev, { sender: 'teacher', text: '🎤 Voice Note (0:12s)', time: 'Just Now' }]);
      alert('Voice note uploaded and sent to parent.');
    } else {
      setRecording(true);
      alert('Recording started... Tap Voice Note button again to send.');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMsg) return alert('Please fill in broadcast details');
    try {
      await api.post('/teacher/announcement', {
        title: broadcastTitle,
        message: broadcastMsg,
        type: 'Announcement',
        recipientRole: 'parent'
      });
      alert(`Broadcast message "${broadcastTitle}" broadcasted successfully to all Class parents.`);
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send broadcast.');
    }
  };

  const handleSchedulePTM = () => {
    if (!ptmDate || !ptmTime) return alert('Please fill in PTM date and time');
    alert(`PTM meeting successfully scheduled for ${ptmDate} at ${ptmTime} for ${ptmClass}.`);
    setPtmDate('');
    setPtmTime('');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Parent Communication</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Connect with parent guardians</Text>
          </View>
        </View>

        {/* ================= TABS SELECTOR ================= */}
        <View style={[styles.tabsRow, { backgroundColor: theme.border }]}>
          {[
            { key: 'chat', label: 'Chat Messaging' },
            { key: 'broadcast', label: 'Broadcast' },
            { key: 'ptm', label: 'PTM Scheduler' }
          ].map(t => (
            <Pressable
              key={t.key}
              onPress={() => {
                setActiveTab(t.key as any);
                setSelectedParent(null);
              }}
              style={[styles.tabItem, activeTab === t.key && { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === t.key ? theme.text : theme.textSecondary }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ================= TAB 1: CHAT CHANNELS ================= */}
        {activeTab === 'chat' && !selectedParent && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Chats</Text>
            {loadingContacts && <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />}
            {!loadingContacts && contacts.length === 0 ? (
              <Card style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>No parent conversations.</Text>
              </Card>
            ) : (
              contacts.map(parent => (
                <Pressable
                  key={parent._id}
                  onPress={() => setSelectedParent(parent)}
                  style={[styles.parentChatCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '15' }]}>
                    <User size={18} color={colors.primary} />
                  </View>
                  
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={[styles.parentName, { color: theme.text, fontWeight: '600' }]}>
                        {parent.name.split(' (Parent of')[0]}
                      </Text>
                    </View>
                    <Text style={[styles.studentLink, { color: theme.textSecondary }]}>
                      Parent of {parent.name.includes('Parent of') ? parent.name.split('Parent of')[1]?.replace(')', '') : 'Student'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.textSecondary} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === 'chat' && selectedParent && (
          <Card style={styles.chatWindowCard}>
            <View style={styles.chatWindowHeader}>
              <Pressable onPress={() => setSelectedParent(null)} style={styles.chatBack}>
                <ArrowLeft size={16} color={theme.text} />
              </Pressable>
              <View style={{ marginLeft: 8 }}>
                <Text style={[styles.windowParentName, { color: theme.text }]}>
                  {selectedParent.name.split(' (Parent of')[0]}
                </Text>
                <Text style={{ fontSize: 9, color: theme.textSecondary }}>
                  Parent of {selectedParent.name.includes('Parent of') ? selectedParent.name.split('Parent of')[1]?.replace(')', '') : 'Student'}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.messageScroll} contentContainerStyle={{ paddingVertical: 10 }}>
              {chatHistory.map((chat, idx) => {
                const isMe = chat.sender === 'teacher';
                return (
                  <View 
                    key={idx} 
                    style={[
                      styles.bubbleRow, 
                      isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
                    ]}
                  >
                    <View style={[
                      styles.msgBubble,
                      isMe 
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
                        : { backgroundColor: theme.background, borderBottomLeftRadius: 2, borderColor: theme.border, borderWidth: 1 }
                    ]}>
                      <Text style={{ fontSize: 11, color: isMe ? '#fff' : theme.text }}>
                        {chat.text}
                      </Text>
                      <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                        {chat.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Quick replies helper */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplyScroll}>
              {quickReplies.map((qr, idx) => (
                <Pressable 
                  key={idx}
                  onPress={() => handleQuickReply(qr)}
                  style={[styles.replyPill, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '700' }}>{qr}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Text input entry */}
            <View style={styles.inputAreaRow}>
              <Pressable 
                onPress={handleVoiceRecordSimulate}
                style={[styles.voiceBtn, recording && { backgroundColor: colors.danger + '20' }]}
              >
                <Mic size={18} color={recording ? colors.danger : theme.textSecondary} />
              </Pressable>
              <TextInput
                style={[styles.chatInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Type your response here..."
                placeholderTextColor={theme.textSecondary}
                value={typedMessage}
                onChangeText={setTypedMessage}
              />
              <Pressable onPress={handleSendChat} style={styles.sendBtn}>
                <Send size={16} color="#fff" />
              </Pressable>
            </View>
          </Card>
        )}

        {/* ================= TAB 2: BROADCAST NOTIFICATION ================= */}
        {activeTab === 'broadcast' && (
          <Card style={styles.broadcastForm}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Broadcast Subject Title</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="e.g. Unit Test 2 marks published"
              placeholderTextColor={theme.textSecondary}
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Broadcast Announcement Message</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Write the message that will be broadcasted to all parent registers..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
            />

            <Pressable 
              onPress={handleSendBroadcast}
              style={[styles.submitBroadcastBtn, { backgroundColor: colors.primary }]}
            >
              <Send size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.submitBroadcastBtnText}>Send Broadcast to Parents</Text>
            </Pressable>
          </Card>
        )}

        {/* ================= TAB 3: PTM SCHEDULES ================= */}
        {activeTab === 'ptm' && (
          <Card style={styles.ptmForm}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Class</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={ptmClass}
              onChangeText={setPtmClass}
              editable={false}
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1.2, marginRight: 6 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PTM Meeting Date</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={ptmDate}
                  onChangeText={setPtmDate}
                  editable={!!tData?.dashboard?.assignedClassId}
                />
              </View>
              <View style={{ flex: 0.8, marginLeft: 6 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Start Time</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  placeholder="e.g. 15:00"
                  placeholderTextColor={theme.textSecondary}
                  value={ptmTime}
                  onChangeText={setPtmTime}
                  editable={!!tData?.dashboard?.assignedClassId}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Agenda / Discussion Context</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={ptmReason}
              onChangeText={setPtmReason}
              editable={!!tData?.dashboard?.assignedClassId}
            />

            <Pressable 
              onPress={handleSchedulePTM}
              disabled={!tData?.dashboard?.assignedClassId}
              style={[
                styles.schedulePtmBtn, 
                { backgroundColor: tData?.dashboard?.assignedClassId ? colors.primary : '#A0AEC0' }
              ]}
            >
              <CalIcon size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.schedulePtmBtnText}>Create PTM Slots</Text>
            </Pressable>
          </Card>
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
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  parentChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: 'rgba(0,0,0,0.01)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parentName: {
    fontSize: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  studentLink: {
    fontSize: 9,
    marginTop: 1,
  },
  lastMsg: {
    fontSize: 10,
    marginTop: 4,
  },
  chatWindowCard: {
    padding: 12,
    height: 380,
    justifyContent: 'space-between',
    marginVertical: 0,
  },
  chatWindowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  chatBack: {
    padding: 4,
  },
  windowParentName: {
    fontSize: 12,
    fontWeight: '800',
  },
  messageScroll: {
    flex: 1,
    marginVertical: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  msgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: '75%',
  },
  bubbleTime: {
    fontSize: 7,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  quickReplyScroll: {
    maxHeight: 28,
    marginBottom: 8,
  },
  replyPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  inputAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chatInput: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 11,
    marginRight: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastForm: {
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
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  submitBroadcastBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitBroadcastBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  ptmForm: {
    padding: 16,
    marginVertical: 0,
  },
  formRow: {
    flexDirection: 'row',
  },
  schedulePtmBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  schedulePtmBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  }
});
