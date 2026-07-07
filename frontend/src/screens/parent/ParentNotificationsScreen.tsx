import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, Bell, FileText, CheckCircle, MapPin, CreditCard, AlertCircle } from 'lucide-react-native';

interface ParentNotificationsScreenProps {
  onBack?: () => void;
}

export const ParentNotificationsScreen: React.FC<ParentNotificationsScreenProps> = ({ onBack }) => {
  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [activeCategory, setActiveCategory] = useState<'All' | 'Academic' | 'Transport' | 'Fees'>('All');
  const [unreadList, setUnreadList] = useState<{ [key: string]: boolean }>({});

  const rawNotifications = parentData.dashboard?.notifications || [];

  const notifications = rawNotifications.map((n: any, idx: number) => {
    const titleL = n.title.toLowerCase();
    let category: 'Academic' | 'Transport' | 'Fees' = 'Academic';
    let icon = FileText;
    let iconColor = colors.primary;

    if (titleL.includes('bus') || titleL.includes('route') || titleL.includes('transport')) {
      category = 'Transport';
      icon = MapPin;
      iconColor = colors.secondary;
    } else if (titleL.includes('fee') || titleL.includes('payment') || titleL.includes('due')) {
      category = 'Fees';
      icon = CreditCard;
      iconColor = colors.warning;
    }

    return {
      _id: n._id || `gen-${idx}`,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      category,
      icon,
      iconColor
    };
  });

  const filteredNotifications = notifications.filter((n: any) => 
    activeCategory === 'All' || n.category === activeCategory
  );

  const handleMarkAllRead = () => {
    setUnreadList({});
    alert('All notices marked as read.');
  };

  const handleNotificationTap = (id: string) => {
    setUnreadList(prev => ({
      ...prev,
      [id]: false
    }));
  };

  return (
    <View style={styles.container}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Notice Board</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Important school announcements</Text>
        </View>
        <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
          <Text style={styles.markReadText}>Mark All Read</Text>
        </Pressable>
      </View>

      {/* ================= CATEGORY CHIPS ================= */}
      <View style={styles.chipsRow}>
        {(['All', 'Academic', 'Transport', 'Fees'] as const).map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.chipPill,
              { 
                backgroundColor: activeCategory === cat ? colors.primary : theme.surface, 
                borderColor: colors.primary 
              }
            ]}
          >
            <Text style={[styles.chipText, { color: activeCategory === cat ? '#FFFFFF' : colors.primary }]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ================= LIST CONTENT ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif: any, idx: number) => {
            const Icon = notif.icon || FileText;
            const notifId = notif._id || idx;
            const isUnread = unreadList[notifId] ?? false;
            const formattedDate = new Date(notif.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <Pressable
                key={notifId}
                onPress={() => handleNotificationTap(notifId)}
                style={[
                  styles.notifCard,
                  { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow },
                  isUnread && { borderColor: colors.primary + '30', borderWidth: 1.5 }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: (notif.iconColor || colors.primary) + '12' }]}>
                  <Icon size={18} color={notif.iconColor || colors.primary} />
                </View>
                <View style={styles.notifInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {isUnread && <View style={styles.unreadBadge} />}
                  </View>
                  <Text style={[styles.notifMsg, { color: theme.textSecondary }]} numberOfLines={3}>
                    {notif.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                    {formattedDate} · {notif.category}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notices for this category.</Text>
          </View>
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
  markReadBtn: {
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markReadText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  chipPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '800',
    maxWidth: '90%',
  },
  unreadBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  notifMsg: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
  },
  notifTime: {
    fontSize: 8,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
