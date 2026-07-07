import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Bell, ArrowLeft, Calendar, BookOpen, Award, AlertTriangle, CheckSquare } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [activeCategory, setActiveCategory] = useState<'All' | 'Homework' | 'Exam' | 'Event' | 'Emergency'>('All');
  const [unreadList, setUnreadList] = useState<{ [key: string]: boolean }>({});

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

    // Initialize unread list with initial values
    const initialUnreads: { [key: string]: boolean } = {};
    const notices = studentData.dashboard?.recentNotifications || [];
    notices.forEach((n: any, idx: number) => {
      initialUnreads[n._id || idx] = idx < 3; // First 3 are unread
    });
    setUnreadList(initialUnreads);
  }, [studentData.dashboard?.recentNotifications]);

  const rawNotifications = studentData.dashboard?.recentNotifications || [];

  // Enriched notifications list mapping to categories and metadata
  const processedNotifications = rawNotifications.map((notif: any, idx: number) => {
    const titleLower = notif.title.toLowerCase();
    const msgLower = notif.message.toLowerCase();

    let category: 'Homework' | 'Exam' | 'Event' | 'Emergency' = 'Event';
    let icon = Calendar;
    let iconColor = colors.primary;

    if (titleLower.includes('homework') || msgLower.includes('assignment') || titleLower.includes('math') || titleLower.includes('science')) {
      category = 'Homework';
      icon = BookOpen;
      iconColor = colors.secondary;
    } else if (titleLower.includes('exam') || titleLower.includes('test') || titleLower.includes('mid-term') || titleLower.includes('grade')) {
      category = 'Exam';
      icon = Award;
      iconColor = colors.success;
    } else if (titleLower.includes('emergency') || msgLower.includes('delay') || titleLower.includes('closed') || msgLower.includes('alert')) {
      category = 'Emergency';
      icon = AlertTriangle;
      iconColor = colors.danger;
    }

    const unread = unreadList[notif._id || idx] ?? false;

    return {
      ...notif,
      category,
      icon,
      iconColor,
      unread
    };
  });

  const finalNotifications = processedNotifications;

  // Filter items
  const filteredNotifications = finalNotifications.filter((notif: any) => {
    return activeCategory === 'All' || notif.category === activeCategory;
  });

  const handleMarkAllRead = () => {
    const clearedUnreads = { ...unreadList };
    Object.keys(clearedUnreads).forEach(k => {
      clearedUnreads[k] = false;
    });
    setUnreadList(clearedUnreads);
    alert('Notice Board marked as read.');
  };

  const handleNotificationTap = (id: string) => {
    setUnreadList(prev => ({
      ...prev,
      [id]: false
    }));
  };

  const unreadCount = Object.values(unreadList).filter(v => v).length;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notice Board</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {unreadCount > 0 ? `${unreadCount} unread notices` : 'All caught up!'}
          </Text>
        </View>
        <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
          <Text style={[styles.markReadText, { color: colors.primary }]}>Clear All</Text>
        </Pressable>
      </View>

      {/* ================= CATEGORY FILTERS ================= */}
      <View style={styles.filterContainer}>
        {(['All', 'Homework', 'Exam', 'Event', 'Emergency'] as const).map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.filterPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
              activeCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: theme.textSecondary },
              activeCategory === cat && { color: '#FFFFFF' }
            ]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ================= NOTIFICATION CARDS ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif: any, idx: number) => {
            const Icon = notif.icon;
            const notifId = notif._id || idx;
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
                  styles.notificationCard,
                  { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow },
                  notif.unread && styles.unreadCardBorder
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: notif.iconColor + '10' }]}>
                  <Icon size={20} color={notif.iconColor} />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.categoryBadge, { backgroundColor: notif.iconColor + '15', color: notif.iconColor }]}>
                      {notif.category}
                    </Text>
                    <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formattedDate}</Text>
                  </View>

                  <Text style={[styles.titleText, { color: theme.text }]}>{notif.title}</Text>
                  <Text style={[styles.descText, { color: theme.textSecondary }]}>{notif.message}</Text>
                </View>

                {notif.unread && (
                  <View style={[styles.unreadBadgeDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            title="Notice Board"
            message="No notices available."
            iconName="Bell"
          />
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
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
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 18,
    gap: 6,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    paddingRight: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  descText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  unreadBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    right: 14,
    top: 20,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
