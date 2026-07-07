import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, Calendar as CalIcon, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react-native';
import api from '../../services/api';
import { EmptyState } from '../../components/EmptyState';

interface ParentCalendarScreenProps {
  onBack?: () => void;
}

export const ParentCalendarScreen: React.FC<ParentCalendarScreenProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/parent/calendar');
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar dates builders
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    // Empty previous spots
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dateBox} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvent = events.find(e => e.date === dateString);

      let boxBg = theme.surface;
      let borderStyle = {};
      let dotColor = null;

      if (dayEvent) {
        borderStyle = { borderColor: dayEvent.color, borderWidth: 1.5 };
        dotColor = dayEvent.color;
      }

      days.push(
        <View key={d} style={[styles.dateBox, { backgroundColor: boxBg }, borderStyle]}>
          <Text style={[styles.dateText, { color: theme.text }]}>{d}</Text>
          {dotColor && <View style={[styles.eventDot, { backgroundColor: dotColor }]} />}
        </View>
      );
    }

    return days;
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
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>School Calendar</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>PTMs, exams, and holidays schedule</Text>
        </View>
        <CalIcon size={20} color={colors.primary} />
      </View>

      {/* ================= LEGEND BAR ================= */}
      <View style={[styles.legendCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {[
          { label: 'PTM', color: colors.primary },
          { label: 'Exams', color: colors.danger },
          { label: 'Sports', color: colors.secondary },
          { label: 'Holiday', color: colors.warning }
        ].map((leg, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: leg.color }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>{leg.label}</Text>
          </View>
        ))}
      </View>

      {/* ================= CALENDAR BOX ================= */}
      <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
            <ChevronLeft size={16} color={theme.text} />
          </Pressable>
          <Text style={[styles.monthText, { color: theme.text }]}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable onPress={handleNextMonth} style={styles.navBtn}>
            <ChevronRight size={16} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, index) => (
            <Text key={index} style={[styles.weekText, { color: theme.textSecondary }]}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {renderCalendarGrid()}
        </View>
      </View>

      {/* ================= EVENT LISTS ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Upcoming Activities</Text>
      {events.length > 0 ? (
        <View style={[styles.eventsContainer, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
          {events.map((ev, index) => (
            <View key={index} style={[styles.eventRow, index === events.length - 1 && styles.noBorder]}>
              <View style={[styles.iconCircle, { backgroundColor: ev.color + '15' }]}>
                <Bookmark size={16} color={ev.color} />
              </View>
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitleText, { color: theme.text }]}>{ev.title}</Text>
                <Text style={[styles.eventDateText, { color: theme.textSecondary }]}>{ev.date}</Text>
              </View>
              <View style={[styles.eventTag, { backgroundColor: ev.color + '15' }]}>
                <Text style={[styles.eventTagText, { color: ev.color }]}>{ev.type.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="School Calendar"
          message="No activities scheduled yet."
          iconName="Calendar"
        />
      )}

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
  legendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '800',
  },
  calendarCard: {
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 13,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateBox: {
    width: '14.28%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 8,
    position: 'relative',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  eventsContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
    paddingRight: 4,
  },
  eventTitleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventDateText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  eventTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
});
