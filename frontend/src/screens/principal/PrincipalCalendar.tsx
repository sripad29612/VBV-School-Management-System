import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';
import { ArrowLeft, Plus, Calendar as CalIcon, Trash2 } from 'lucide-react-native';

interface PrincipalCalendarProps {
  onBack: () => void;
  onSyncAllPortals: () => void;
}

export const PrincipalCalendar: React.FC<PrincipalCalendarProps> = ({ 
  onBack,
  onSyncAllPortals 
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [events, setEvents] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'Exam' | 'Sports' | 'PTM' | 'Meeting' | 'Competition' | 'Holiday' | 'Event'>('Event');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventDesc, setEventDesc] = useState('');
  
  // Dynamic Month Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();

  const loadEvents = async () => {
    try {
      const res = await api.get('/principal/calendar');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to retrieve events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddEvent = async () => {
    if (!eventTitle || !eventDate) {
      return alert('Please fill in title and date');
    }
    try {
      await api.post('/principal/calendar', {
        title: eventTitle,
        description: eventDesc,
        type: eventType,
        startDate: eventDate,
        endDate: eventDate
      });
      alert('Event added to school academic calendar planner!');
      setEventTitle('');
      setEventDesc('');
      loadEvents();
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to save calendar event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.delete(`/principal/calendar/${id}`);
      loadEvents();
      onSyncAllPortals();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Exam': return '#3B82F6';
      case 'Sports': return '#10B981';
      case 'PTM': return '#8B5CF6';
      case 'Holiday': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in current month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Start day of week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  // Generate grid cells: firstDayIndex empty cells + daysInMonth cells
  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push(d);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#6F42C1" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Academic Calendar</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Schedule term events and holidays</Text>
          </View>
        </View>

        {/* ================= EVENT CREATOR CARD ================= */}
        <Card style={styles.creatorCard}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Schedule New Event</Text>
          
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Event Category</Text>
          <View style={styles.typeRow}>
            {['Exam', 'Sports', 'PTM', 'Meeting', 'Competition', 'Holiday', 'Event'].map(t => (
              <Pressable
                key={t}
                onPress={() => setEventType(t as any)}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: eventType === t ? getEventColor(t) : theme.background,
                    borderColor: eventType === t ? getEventColor(t) : theme.border
                  }
                ]}
              >
                <Text style={{ color: eventType === t ? '#fff' : theme.textSecondary, fontSize: 9, fontWeight: '800' }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Event Title</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="e.g. Science Exhibition Setup"
            placeholderTextColor={theme.textSecondary}
            value={eventTitle}
            onChangeText={setEventTitle}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Event Date</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={eventDate}
                onChangeText={setEventDate}
              />
            </View>
            <View style={{ flex: 1.5, marginLeft: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="e.g. Review assembly room slots"
                placeholderTextColor={theme.textSecondary}
                value={eventDesc}
                onChangeText={setEventDesc}
              />
            </View>
          </View>

          <Pressable 
            onPress={handleAddEvent}
            style={[styles.addBtn, { backgroundColor: '#6F42C1' }]}
          >
            <Plus size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Add Calendar Event</Text>
          </Pressable>
        </Card>

        {/* ================= CALENDAR PREVIEW GRID (LOVABLE CARD STYLE) ================= */}
        <Card style={[styles.calendarCard, { maxHeight: 550, padding: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text }}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={handlePrevMonth} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '800' }}>Prev</Text>
              </Pressable>
              <Pressable onPress={handleTodayMonth} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '800' }}>Today</Text>
              </Pressable>
              <Pressable onPress={handleNextMonth} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 9, color: theme.textSecondary, fontWeight: '800' }}>Next</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.calendarHeaderRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dDay, idx) => (
              <Text key={idx} style={[styles.calendarDayHeader, { color: theme.textSecondary, flex: 1, textAlign: 'center' }]}>{dDay}</Text>
            ))}
          </View>

          <View style={[styles.calendarDatesGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {gridCells.map((dayNum, index) => {
              if (dayNum === null) {
                return <View key={`empty-${index}`} style={{ width: '14.28%', height: 36 }} />;
              }

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              // Match event from database list
              const dayEvents = events.filter(e => {
                const sDate = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '';
                return sDate === dateStr;
              });
              const hasEvents = dayEvents.length > 0;
              const eventColor = hasEvents ? getEventColor(dayEvents[0].type) : 'transparent';

              return (
                <View key={`day-${dayNum}`} style={{ width: '14.28%', height: 36, alignItems: 'center', justifyContent: 'center', marginVertical: 2 }}>
                  <View style={[
                    styles.dateNumCircle, 
                    hasEvents && { backgroundColor: eventColor, borderRadius: 14 }
                  ]}>
                    <Text style={{
                      color: hasEvents ? '#ffffff' : theme.text,
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>{dayNum}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ================= EVENT LIST LEDGER ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Schedules & Events Ledger</Text>
        {events.length > 0 ? (
          events.map(event => (
            <Card key={event._id} style={styles.eventListItem}>
              <View style={styles.eventLeftStrip}>
                <View style={[styles.stripIndicator, { backgroundColor: getEventColor(event.type) }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.eventItemTitle, { color: theme.text }]}>{event.title}</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>{event.description}</Text>
                  <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 4 }}>
                    Date: {event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : 'N/A'} | Category: {event.type}
                  </Text>
                </View>
                <Pressable 
                  onPress={() => handleDeleteEvent(event._id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={14} color={colors.danger} />
                </Pressable>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            title="School Calendar"
            message="No academic events scheduled yet."
            iconName="Calendar"
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
  creatorCard: {
    padding: 16,
    marginVertical: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
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
    marginBottom: 6,
  },
  addBtn: {
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  calendarCard: {
    padding: 14,
    marginVertical: 0,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayHeader: {
    fontWeight: 'bold',
    width: '14%',
    textAlign: 'center',
    fontSize: 10,
  },
  calendarDatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDateBox: {
    width: '14%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dateNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventListItem: {
    padding: 12,
    marginVertical: 4,
  },
  eventLeftStrip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  eventItemTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  }
});
