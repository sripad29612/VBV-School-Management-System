import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { ArrowLeft, MapPin, Phone, MessageSquare, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import api from '../../services/api';

interface ParentTransportScreenProps {
  onBack: () => void;
}

export const ParentTransportScreen: React.FC<ParentTransportScreenProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const { parentData } = useSelector((state: RootState) => state.dashboard);
  const activeChild = parentData.dashboard?.children?.find((c: any) => c._id === parentData.selectedChildId) || parentData.dashboard?.children?.[0];

  const [loading, setLoading] = useState(true);
  const [transport, setTransport] = useState<any | null>(null);

  const fetchTransport = async () => {
    if (!activeChild?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/parent/child/${activeChild._id}/transport`);
      setTransport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, [activeChild?._id]);

  const hasTransport = transport && transport.vehicle;

  const driverInfo = {
    name: transport?.vehicle?.driver?.name || 'Driver Not Assigned',
    phone: transport?.vehicle?.driver?.mobile || '',
    busNo: transport?.vehicle?.vehicleNumber || 'Pending Setup',
    route: transport?.route || 'Route Pending',
    pickupPoint: transport?.pickupPoint || 'Not Configured',
    dropPoint: transport?.dropPoint || 'Not Configured',
    pickupTime: transport?.pickupTime || 'N/A',
    dropTime: transport?.dropTime || 'N/A',
    eta: 'In Transit',
    status: transport?.vehicle?.status || 'Inactive',
  };

  const routeTimeline = [
    { stop: driverInfo.pickupPoint, time: driverInfo.pickupTime, completed: true },
    { stop: 'Bypass Junction', time: '07:55 AM', completed: true },
    { stop: driverInfo.dropPoint, time: driverInfo.dropTime, completed: false },
    { stop: 'School Campus', time: '08:25 AM', completed: false }
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hasTransport) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Transport Tracker</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Live bus routes & status tracking</Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="Transport Status"
            message="No transport services assigned."
            iconName="MapPin"
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subScreenTitle, { color: theme.text }]}>Transport Tracker</Text>
          <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Live bus routes & status tracking</Text>
        </View>
        <MapPin size={20} color={colors.primary} />
      </View>

      {/* ================= MOCK MAP GRAPHIC ================= */}
      <View style={[styles.mapCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <View style={styles.mapIllustration}>
          <View style={styles.mapGridRow}>
            <View style={styles.mapLineHorizontal} />
          </View>
          <View style={styles.mapGridRow}>
            <View style={styles.mapLineHorizontal} />
          </View>
          <View style={styles.mapLineVertical} />

          {/* Marker pins */}
          <View style={[styles.mapPinCircle, { left: '30%', top: '25%', backgroundColor: colors.success }]}>
            <Text style={styles.pinText}>Start</Text>
          </View>
          
          <View style={[styles.mapPinCircle, { left: '60%', top: '55%', backgroundColor: colors.secondary, width: 28, height: 28, borderRadius: 14 }]}>
            <MapPin size={12} color="#FFFFFF" />
          </View>

          <View style={[styles.mapPinCircle, { right: '15%', bottom: '25%', backgroundColor: colors.primary }]}>
            <Text style={styles.pinText}>School</Text>
          </View>
        </View>

        <View style={styles.etaRow}>
          <View style={[styles.statusIndicator, { backgroundColor: colors.success + '15' }]}>
            <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.indicatorText, { color: colors.success }]}>{driverInfo.status.toUpperCase()}</Text>
          </View>
          <Text style={[styles.etaValue, { color: theme.text }]}>{driverInfo.eta}</Text>
        </View>
      </View>

      {/* ================= DRIVER DETAILS PROFILE ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Driver & Bus Details</Text>
      <View style={[styles.driverCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <View style={styles.driverTop}>
          <View style={[styles.driverAvatarFallback, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.driverInitial, { color: colors.primary }]}>D</Text>
          </View>
          <View style={styles.driverInfoCol}>
            <Text style={[styles.driverName, { color: theme.text }]}>{driverInfo.name}</Text>
            <Text style={[styles.driverSubText, { color: theme.textSecondary }]}>Bus Plate: {driverInfo.busNo}</Text>
            <Text style={[styles.driverSubText, { color: colors.primary, fontWeight: '700' }]}>{driverInfo.route}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionsRow}>
          <Pressable 
            onPress={() => alert(`Calling driver at ${driverInfo.phone}`)}
            style={[styles.actionButton, { backgroundColor: colors.success + '12' }]}
          >
            <Phone size={14} color={colors.success} style={{ marginRight: 6 }} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>Call Driver</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => alert('Opening Direct Chat with driver Rajesh...')}
            style={[styles.actionButton, { backgroundColor: colors.primary + '12' }]}
          >
            <MessageSquare size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Message</Text>
          </Pressable>
        </View>
      </View>

      {/* ================= ROUTE TIMELINE ================= */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Today's Route Progress</Text>
      <View style={[styles.timelineContainer, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        {routeTimeline.map((node, index) => {
          const isDone = node.completed;
          return (
            <View key={index} style={[styles.timelineNode, index === 3 && styles.noBorder]}>
              <View style={[styles.nodeIndicator, { backgroundColor: isDone ? colors.success + '15' : colors.warning + '15' }]}>
                <CheckCircle2 size={16} color={isDone ? colors.success : colors.warning} />
              </View>
              <View style={styles.nodeDetails}>
                <Text style={[styles.nodeTitle, { color: theme.text, textDecorationLine: isDone ? 'line-through' : 'none' } as any]}>
                  {node.stop}
                </Text>
                <Text style={[styles.nodeSubtitle, { color: theme.textSecondary }]}>
                  {isDone ? `Passed at ${node.time}` : `Scheduled ETA ${node.time}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

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
  mapCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  mapIllustration: {
    height: 180,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridRow: {
    height: 90,
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
    width: '100%',
  },
  mapLineHorizontal: {
    height: 10,
    width: '100%',
    backgroundColor: '#CBD5E1',
    top: 40,
    position: 'absolute',
  },
  mapLineVertical: {
    width: 10,
    height: '100%',
    backgroundColor: '#CBD5E1',
    left: '50%',
    position: 'absolute',
  },
  mapPinCircle: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 8,
    fontWeight: '800',
  },
  etaValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  driverCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  driverTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: '900',
  },
  driverInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '800',
  },
  driverSubText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineContainer: {
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
  timelineNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  nodeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nodeDetails: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
