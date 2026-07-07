import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react-native';

interface ParentChatScreenProps {
  chatHistory: any[];
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  onSendMessage: () => void;
  onBack: () => void;
  theme: any;
  user: any;
  activeContactName?: string;
}

export const ParentChatScreen: React.FC<ParentChatScreenProps> = ({
  chatHistory,
  chatMessage,
  setChatMessage,
  onSendMessage,
  onBack,
  theme,
  user,
  activeContactName
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to end when messages load
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* ================= HEADER ================= */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.teacherName, { color: theme.text }]}>{activeContactName || 'Class Teacher'}</Text>
          <Text style={[styles.teacherStatus, { color: colors.success }]}>Class Teacher (Online)</Text>
        </View>
        <View style={[styles.avatarBox, { backgroundColor: colors.primary + '12' }]}>
          <MessageSquare size={16} color={colors.primary} />
        </View>
      </View>

      {/* ================= CHAT HISTORY LIST ================= */}
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.chatHistoryContainer}
      >
        {chatHistory.length > 0 ? (
          chatHistory.map((msg: any, idx: number) => {
            const isMe = msg.sender === user?._id;
            return (
              <View 
                key={msg._id || idx} 
                style={[
                  styles.chatRow, 
                  isMe ? styles.chatRowRight : styles.chatRowLeft
                ]}
              >
                {!isMe && (
                  <View style={[styles.bubbleAvatar, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: colors.primary }}>AR</Text>
                  </View>
                )}
                <View 
                  style={[
                    styles.chatBubble,
                    isMe 
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } 
                      : { backgroundColor: theme.surface, borderBottomLeftRadius: 4, borderColor: theme.border, borderWidth: 1 }
                  ]}
                >
                  <Text style={[styles.chatText, isMe ? { color: '#FFFFFF' } : { color: theme.text }]}>
                    {msg.message}
                  </Text>
                  <Text style={[styles.chatTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.textSecondary }]}>
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No previous conversation history. Send a message to initiate contact.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ================= INPUT ROW ================= */}
      <View style={[styles.inputRow, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          style={[styles.inputText, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          placeholder="Write your message here..."
          placeholderTextColor={theme.textSecondary}
          value={chatMessage}
          onChangeText={setChatMessage}
        />
        <Pressable 
          onPress={onSendMessage} 
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
        >
          <Send size={16} color="#FFFFFF" />
        </Pressable>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  teacherStatus: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHistoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    paddingBottom: 100,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  chatRowLeft: {
    alignSelf: 'flex-start',
    gap: 8,
  },
  chatRowRight: {
    alignSelf: 'flex-end',
  },
  bubbleAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  chatText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  chatTime: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1.5,
    zIndex: 100,
  },
  inputText: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 12,
    fontWeight: '600',
    outlineStyle: 'none' as any,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
