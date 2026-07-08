import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import api from '../../services/api';
import { 
  Bus, User, Calendar, MapPin, ShieldAlert, AlertTriangle, 
  Trash2, Edit, Plus, CheckCircle, Clock, Search, MapPinned, Route as RouteIcon
} from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

export const AdminTransport: React.FC = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'routes' | 'assignments'>('drivers');

  // Lists
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Expiry statistics
  const [stats, setStats] = useState({
    expiringLicences: 0,
    expiringInsurance: 0,
    totalVehicles: 0,
    totalDrivers: 0,
    assignedStudents: 0
  });

  // Form states - Driver
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [driverAlternateMobile, setDriverAlternateMobile] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverDob, setDriverDob] = useState('');
  const [driverBloodGroup, setDriverBloodGroup] = useState('O+');
  const [driverAadhaar, setDriverAadhaar] = useState('');
  const [driverLicence, setDriverLicence] = useState('');
  const [driverLicenceExpiry, setDriverLicenceExpiry] = useState('');
  const [driverExperience, setDriverExperience] = useState('');
  const [driverEmergency, setDriverEmergency] = useState('');
  
  // Form states - Vehicle
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [vehicleType, setVehicleType] = useState('Bus');
  const [vehicleCapacity, setVehicleCapacity] = useState('40');
  const [vehicleDriver, setVehicleDriver] = useState('');
  const [vehicleAttendant, setVehicleAttendant] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('Active');
  const [vehicleInsurance, setVehicleInsurance] = useState('');
  const [vehicleFitness, setVehicleFitness] = useState('');
  const [vehiclePollution, setVehiclePollution] = useState('');

  // Form states - Route
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [routeName, setRouteName] = useState('');
  const [routeStart, setRouteStart] = useState('');
  const [routeStops, setRouteStops] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [routePickupTime, setRoutePickupTime] = useState('');
  const [routeDropTime, setRouteDropTime] = useState('');
  const [routeFee, setRouteFee] = useState('');
  const [routeVehicle, setRouteVehicle] = useState('');

  // Form states - Assignment
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [assignRouteId, setAssignRouteId] = useState('');
  const [assignPickupPoint, setAssignPickupPoint] = useState('');

  // Validation Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Input Refs for Focus management
  const driverNameRef = useRef<TextInput>(null);
  const driverMobileRef = useRef<TextInput>(null);
  const driverAltMobileRef = useRef<TextInput>(null);
  const driverDobRef = useRef<TextInput>(null);
  const driverAadhaarRef = useRef<TextInput>(null);
  const driverLicenceRef = useRef<TextInput>(null);
  const driverLicenceExpiryRef = useRef<TextInput>(null);
  const driverExperienceRef = useRef<TextInput>(null);
  const driverEmergencyRef = useRef<TextInput>(null);

  const vehicleNoRef = useRef<TextInput>(null);
  const vehicleRegNoRef = useRef<TextInput>(null);
  const vehicleCapacityRef = useRef<TextInput>(null);
  const vehicleInsuranceRef = useRef<TextInput>(null);
  const vehicleFitnessRef = useRef<TextInput>(null);
  const vehiclePollutionRef = useRef<TextInput>(null);

  const routeNameRef = useRef<TextInput>(null);
  const routeStartRef = useRef<TextInput>(null);
  const routeEndRef = useRef<TextInput>(null);
  const routePickupTimeRef = useRef<TextInput>(null);
  const routeDropTimeRef = useRef<TextInput>(null);
  const routeFeeRef = useRef<TextInput>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversRes, vehiclesRes, routesRes, studentsRes, statsRes] = await Promise.all([
        api.get('/admin/drivers').catch(() => ({ data: [] })),
        api.get('/admin/vehicles').catch(() => ({ data: [] })),
        api.get('/admin/routes').catch(() => ({ data: [] })),
        api.get('/admin/reports?type=students').catch(() => ({ data: [] })),
        api.get('/admin/dashboard-stats').catch(() => ({ data: {} }))
      ]);

      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRoutes(routesRes.data || []);
      setStudents((studentsRes.data || []).filter((s: any) => s.status === 'Approved'));
      
      const statData = statsRes.data || {};
      setStats({
        expiringLicences: statData.licenceExpiryCount || 0,
        expiringInsurance: statData.insuranceExpiryCount || 0,
        totalVehicles: vehiclesRes.data?.length || 0,
        totalDrivers: driversRes.data?.length || 0,
        assignedStudents: statData.transportStudents || 0
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to retrieve transport module data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time regex validation helper
  const validateDriver = (): boolean => {
    const errs: Record<string, string> = {};
    
    if (!driverName.trim()) {
      errs.name = 'Driver name is required';
    } else if (!/^[A-Za-z\s]+$/.test(driverName)) {
      errs.name = 'Name must contain letters only';
    }

    if (!driverMobile) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(driverMobile)) {
      errs.mobile = 'Mobile must be exactly 10 digits';
    }

    if (driverAlternateMobile && !/^\d{10}$/.test(driverAlternateMobile)) {
      errs.alternateMobile = 'Alternate Mobile must be exactly 10 digits';
    }

    if (!driverDob) {
      errs.dob = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(driverDob)) {
      errs.dob = 'DOB must be in YYYY-MM-DD format';
    }

    if (!driverAadhaar) {
      errs.aadhaar = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(driverAadhaar)) {
      errs.aadhaar = 'Aadhaar must be exactly 12 digits';
    }

    if (!driverLicence.trim()) {
      errs.licenceNumber = 'Licence number is required';
    }

    if (!driverLicenceExpiry) {
      errs.licenceExpiry = 'Licence expiry is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(driverLicenceExpiry)) {
      errs.licenceExpiry = 'Expiry must be in YYYY-MM-DD format';
    }

    if (driverExperience && isNaN(Number(driverExperience))) {
      errs.experience = 'Experience must be a number';
    }

    if (!driverEmergency) {
      errs.emergencyContact = 'Emergency contact is required';
    } else if (!/^\d{10}$/.test(driverEmergency)) {
      errs.emergencyContact = 'Emergency contact must be 10 digits';
    }

    setErrors(errs);

    // Focus first invalid field
    if (Object.keys(errs).length > 0) {
      if (errs.name) driverNameRef.current?.focus();
      else if (errs.mobile) driverMobileRef.current?.focus();
      else if (errs.alternateMobile) driverAltMobileRef.current?.focus();
      else if (errs.dob) driverDobRef.current?.focus();
      else if (errs.aadhaar) driverAadhaarRef.current?.focus();
      else if (errs.licenceNumber) driverLicenceRef.current?.focus();
      else if (errs.licenceExpiry) driverLicenceExpiryRef.current?.focus();
      else if (errs.experience) driverExperienceRef.current?.focus();
      else if (errs.emergencyContact) driverEmergencyRef.current?.focus();
      return false;
    }
    return true;
  };

  const validateVehicle = (): boolean => {
    const errs: Record<string, string> = {};

    if (!vehicleNo.trim()) {
      errs.vehicleNumber = 'Vehicle Number is required';
    }

    if (!vehicleRegNo.trim()) {
      errs.registrationNumber = 'Registration Number is required';
    }

    if (!vehicleCapacity) {
      errs.capacity = 'Capacity is required';
    } else if (isNaN(Number(vehicleCapacity))) {
      errs.capacity = 'Capacity must be numbers only';
    }

    if (!vehicleInsurance) {
      errs.insurance = 'Insurance Expiry is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(vehicleInsurance)) {
      errs.insurance = 'Expiry must be in YYYY-MM-DD format';
    }

    if (!vehicleFitness) {
      errs.fitness = 'Fitness Expiry is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(vehicleFitness)) {
      errs.fitness = 'Expiry must be in YYYY-MM-DD format';
    }

    if (!vehiclePollution) {
      errs.pollution = 'Pollution Expiry is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(vehiclePollution)) {
      errs.pollution = 'Expiry must be in YYYY-MM-DD format';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.vehicleNumber) vehicleNoRef.current?.focus();
      else if (errs.registrationNumber) vehicleRegNoRef.current?.focus();
      else if (errs.capacity) vehicleCapacityRef.current?.focus();
      else if (errs.insurance) vehicleInsuranceRef.current?.focus();
      else if (errs.fitness) vehicleFitnessRef.current?.focus();
      else if (errs.pollution) vehiclePollutionRef.current?.focus();
      return false;
    }
    return true;
  };

  const validateRoute = (): boolean => {
    const errs: Record<string, string> = {};

    if (!routeName.trim()) {
      errs.routeName = 'Route Name is required';
    }

    if (!routeStart.trim()) {
      errs.startPoint = 'Start Point is required';
    }

    if (!routeEnd.trim()) {
      errs.endPoint = 'End Point is required';
    }

    if (!routePickupTime.trim()) {
      errs.pickupTime = 'Pickup Time is required';
    }

    if (!routeDropTime.trim()) {
      errs.dropTime = 'Drop Time is required';
    }

    if (!routeFee) {
      errs.monthlyFee = 'Monthly Fee is required';
    } else if (isNaN(Number(routeFee))) {
      errs.monthlyFee = 'Fee must be numbers only';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.routeName) routeNameRef.current?.focus();
      else if (errs.startPoint) routeStartRef.current?.focus();
      else if (errs.endPoint) routeEndRef.current?.focus();
      else if (errs.pickupTime) routePickupTimeRef.current?.focus();
      else if (errs.dropTime) routeDropTimeRef.current?.focus();
      else if (errs.monthlyFee) routeFeeRef.current?.focus();
      return false;
    }
    return true;
  };

  // CRUD handlers - Driver
  const handleSaveDriver = async () => {
    if (!validateDriver()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: driverName,
        mobile: driverMobile,
        alternateMobile: driverAlternateMobile,
        address: driverAddress,
        dob: driverDob,
        bloodGroup: driverBloodGroup,
        aadhaar: driverAadhaar,
        licenceNumber: driverLicence,
        licenceExpiryDate: driverLicenceExpiry,
        experience: Number(driverExperience) || 0,
        emergencyContact: driverEmergency
      };

      if (editingDriver) {
        await api.put(`/admin/drivers/${editingDriver._id}`, payload);
        Alert.alert('Success', 'Driver details updated.');
      } else {
        await api.post('/admin/drivers', payload);
        Alert.alert('Success', 'New Driver registered successfully.');
      }
      setShowDriverModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save driver.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = (id: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove driver ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/drivers/${id}`);
              Alert.alert('Deleted', 'Driver has been deleted.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete driver.');
            }
          }
        }
      ]
    );
  };

  const openAddDriver = () => {
    setEditingDriver(null);
    setErrors({});
    setDriverName('');
    setDriverMobile('');
    setDriverAlternateMobile('');
    setDriverAddress('');
    setDriverDob('');
    setDriverBloodGroup('O+');
    setDriverAadhaar('');
    setDriverLicence('');
    setDriverLicenceExpiry('');
    setDriverExperience('');
    setDriverEmergency('');
    setShowDriverModal(true);
  };

  const openEditDriver = (driver: any) => {
    setEditingDriver(driver);
    setErrors({});
    setDriverName(driver.name);
    setDriverMobile(driver.mobile);
    setDriverAlternateMobile(driver.alternateMobile || '');
    setDriverAddress(driver.address || '');
    setDriverDob(driver.dob ? driver.dob.split('T')[0] : '');
    setDriverBloodGroup(driver.bloodGroup || 'O+');
    setDriverAadhaar(driver.aadhaar);
    setDriverLicence(driver.licenceNumber);
    setDriverLicenceExpiry(driver.licenceExpiryDate ? driver.licenceExpiryDate.split('T')[0] : '');
    setDriverExperience(String(driver.experience || ''));
    setDriverEmergency(driver.emergencyContact || '');
    setShowDriverModal(true);
  };

  // CRUD handlers - Vehicle
  const handleSaveVehicle = async () => {
    if (!validateVehicle()) return;
    if (!vehicleDriver) {
      Alert.alert('Driver Required', 'Please assign a driver to this vehicle.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vehicleNumber: vehicleNo,
        registrationNumber: vehicleRegNo,
        vehicleType,
        capacity: Number(vehicleCapacity),
        driver: vehicleDriver,
        attendant: vehicleAttendant,
        status: vehicleStatus,
        insuranceExpiry: vehicleInsurance,
        fitnessCertificateExpiry: vehicleFitness,
        pollutionCertificateExpiry: vehiclePollution
      };

      if (editingVehicle) {
        await api.put(`/admin/vehicles/${editingVehicle._id}`, payload);
        Alert.alert('Success', 'Vehicle details updated.');
      } else {
        await api.post('/admin/vehicles', payload);
        Alert.alert('Success', 'Vehicle added successfully.');
      }
      setShowVehicleModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = (id: string, no: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove vehicle ${no}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/vehicles/${id}`);
              Alert.alert('Deleted', 'Vehicle record deleted.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete vehicle.');
            }
          }
        }
      ]
    );
  };

  const openAddVehicle = () => {
    if (drivers.length === 0) {
      Alert.alert('Driver Required', 'Please register at least one driver first.');
      return;
    }
    setEditingVehicle(null);
    setErrors({});
    setVehicleNo('');
    setVehicleRegNo('');
    setVehicleType('Bus');
    setVehicleCapacity('40');
    setVehicleDriver(drivers[0]._id);
    setVehicleAttendant('');
    setVehicleStatus('Active');
    setVehicleInsurance('');
    setVehicleFitness('');
    setVehiclePollution('');
    setShowVehicleModal(true);
  };

  const openEditVehicle = (veh: any) => {
    setEditingVehicle(veh);
    setErrors({});
    setVehicleNo(veh.vehicleNumber);
    setVehicleRegNo(veh.registrationNumber);
    setVehicleType(veh.vehicleType || 'Bus');
    setVehicleCapacity(String(veh.capacity));
    setVehicleDriver(veh.driver?._id || veh.driver || '');
    setVehicleAttendant(veh.attendant || '');
    setVehicleStatus(veh.status || 'Active');
    setVehicleInsurance(veh.insuranceExpiry ? veh.insuranceExpiry.split('T')[0] : '');
    setVehicleFitness(veh.fitnessCertificateExpiry ? veh.fitnessCertificateExpiry.split('T')[0] : '');
    setVehiclePollution(veh.pollutionCertificateExpiry ? veh.pollutionCertificateExpiry.split('T')[0] : '');
    setShowVehicleModal(true);
  };

  // CRUD handlers - Route
  const handleSaveRoute = async () => {
    if (!validateRoute()) return;
    setSubmitting(true);
    try {
      const payload = {
        routeName,
        startPoint: routeStart,
        stops: routeStops.split(',').map(s => s.trim()).filter(Boolean),
        endPoint: routeEnd,
        pickupTime: routePickupTime,
        dropTime: routeDropTime,
        monthlyFee: Number(routeFee),
        vehicle: routeVehicle || null
      };

      if (editingRoute) {
        await api.put(`/admin/routes/${editingRoute._id}`, payload);
        Alert.alert('Success', 'Route updated successfully.');
      } else {
        await api.post('/admin/routes', payload);
        Alert.alert('Success', 'Route created successfully.');
      }
      setShowRouteModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save route.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = (id: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove route ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/routes/${id}`);
              Alert.alert('Deleted', 'Route deleted.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete route.');
            }
          }
        }
      ]
    );
  };

  const openAddRoute = () => {
    setEditingRoute(null);
    setErrors({});
    setRouteName('');
    setRouteStart('');
    setRouteStops('');
    setRouteEnd('');
    setRoutePickupTime('07:30');
    setRouteDropTime('14:15');
    setRouteFee('1500');
    setRouteVehicle(vehicles[0]?._id || '');
    setShowRouteModal(true);
  };

  const openEditRoute = (r: any) => {
    setEditingRoute(r);
    setErrors({});
    setRouteName(r.routeName);
    setRouteStart(r.startPoint);
    setRouteStops(r.stops ? r.stops.join(', ') : '');
    setRouteEnd(r.endPoint);
    setRoutePickupTime(r.pickupTime);
    setRouteDropTime(r.dropTime);
    setRouteFee(String(r.monthlyFee));
    setRouteVehicle(r.vehicle?._id || r.vehicle || '');
    setShowRouteModal(true);
  };

  // Student Assignment
  const handleAssignTransport = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const payload = {
        routeId: assignRouteId || null,
        pickupPoint: assignPickupPoint
      };

      await api.post(`/admin/students/${selectedStudent._id}/transport`, payload);
      Alert.alert('Success', assignRouteId ? 'Student transport assignment saved.' : 'Student transport cleared.');
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save student assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignTransport = (stud: any) => {
    setSelectedStudent(stud);
    // Find current route if any
    const matchedRoute = routes.find(r => r.routeName === stud.transport?.route);
    setAssignRouteId(matchedRoute?._id || '');
    setAssignPickupPoint(stud.transport?.pickupPoint || '');
    setShowAssignModal(true);
  };

  const selectedRouteObj = routes.find(r => r._id === assignRouteId);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Expiry alerts card widgets */}
      <View style={styles.warningsRow}>
        <Card style={[styles.warningCard, { backgroundColor: isDarkMode ? '#2d1616' : '#fff1f1', borderColor: '#ffbaba' }]}>
          <ShieldAlert size={22} color="#ff3b30" />
          <Text style={styles.warnNum}>{stats.expiringLicences}</Text>
          <Text style={[styles.warnText, { color: theme.textSecondary }]}>Licences Expiring</Text>
        </Card>

        <Card style={[styles.warningCard, { backgroundColor: isDarkMode ? '#2d2516' : '#fffdf0', borderColor: '#ffe699' }]}>
          <AlertTriangle size={22} color="#e6a100" />
          <Text style={styles.warnNum}>{stats.expiringInsurance}</Text>
          <Text style={[styles.warnText, { color: theme.textSecondary }]}>Insurances Overdue</Text>
        </Card>
      </View>

      {/* Tabs list (4 Tabs) */}
      <View style={styles.tabsRow}>
        <Pressable onPress={() => setActiveTab('drivers')} style={[styles.tab, activeTab === 'drivers' && styles.tabActive]}>
          <User size={16} color={activeTab === 'drivers' ? colors.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'drivers' ? colors.primary : theme.textSecondary }]}>Drivers ({stats.totalDrivers})</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('vehicles')} style={[styles.tab, activeTab === 'vehicles' && styles.tabActive]}>
          <Bus size={16} color={activeTab === 'vehicles' ? colors.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'vehicles' ? colors.primary : theme.textSecondary }]}>Buses ({stats.totalVehicles})</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('routes')} style={[styles.tab, activeTab === 'routes' && styles.tabActive]}>
          <RouteIcon size={16} color={activeTab === 'routes' ? colors.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'routes' ? colors.primary : theme.textSecondary }]}>Routes ({routes.length})</Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('assignments')} style={[styles.tab, activeTab === 'assignments' && styles.tabActive]}>
          <MapPinned size={16} color={activeTab === 'assignments' ? colors.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'assignments' ? colors.primary : theme.textSecondary }]}>Students</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.content}>
          {/* DRIVERS TAB */}
          {activeTab === 'drivers' && (
            <View>
              <Pressable style={styles.addButton} onPress={openAddDriver}>
                <Plus size={18} color="#fff" />
                <Text style={styles.addButtonText}>Register Driver</Text>
              </Pressable>

              {drivers.length === 0 ? (
                <EmptyState title="No Drivers Listed" message="Register drivers with active licenses to link to your vehicles." iconName="User" />
              ) : (
                drivers.map(d => (
                  <Card key={d._id} style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <User size={20} color="#5856d6" />
                      <Text style={[styles.vehiclePlate, { color: theme.text }]}>{d.name}</Text>
                      <View style={styles.actions}>
                        <Pressable onPress={() => openEditDriver(d)} style={styles.iconBtn}><Edit size={16} color="#007aff" /></Pressable>
                        <Pressable onPress={() => handleDeleteDriver(d._id, d.name)} style={styles.iconBtn}><Trash2 size={16} color="#ff3b30" /></Pressable>
                      </View>
                    </View>
                    <View style={styles.detailsList}>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Mobile No:</Text> {d.mobile}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Licence No:</Text> {d.licenceNumber}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Licence Expiry:</Text> {d.licenceExpiryDate ? d.licenceExpiryDate.split('T')[0] : 'N/A'}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Aadhaar No:</Text> {d.aadhaar}</Text>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* VEHICLES TAB */}
          {activeTab === 'vehicles' && (
            <View>
              <Pressable style={styles.addButton} onPress={openAddVehicle}>
                <Plus size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add New Vehicle</Text>
              </Pressable>

              {vehicles.length === 0 ? (
                <EmptyState title="No Vehicles Registered" message="Add transport vehicles to start routing students." iconName="Bus" />
              ) : (
                vehicles.map(v => (
                  <Card key={v._id} style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <Bus size={20} color={colors.primary} />
                      <Text style={[styles.vehiclePlate, { color: theme.text }]}>{v.vehicleNumber}</Text>
                      <View style={styles.actions}>
                        <Pressable onPress={() => openEditVehicle(v)} style={styles.iconBtn}><Edit size={16} color="#007aff" /></Pressable>
                        <Pressable onPress={() => handleDeleteVehicle(v._id, v.vehicleNumber)} style={styles.iconBtn}><Trash2 size={16} color="#ff3b30" /></Pressable>
                      </View>
                    </View>
                    <View style={styles.detailsList}>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Registration RC:</Text> {v.registrationNumber}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Assigned Driver:</Text> {v.driver?.name || 'Not assigned'}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Vehicle Type:</Text> {v.vehicleType || 'Bus'}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Capacity:</Text> {v.capacity} seats</Text>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <View>
              <Pressable style={styles.addButton} onPress={openAddRoute}>
                <Plus size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add New Route</Text>
              </Pressable>

              {routes.length === 0 ? (
                <EmptyState title="No Routes Formed" message="Configure routes, stops, and schedules." iconName="MapPin" />
              ) : (
                routes.map(r => (
                  <Card key={r._id} style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <RouteIcon size={20} color="#34c759" />
                      <Text style={[styles.vehiclePlate, { color: theme.text }]}>{r.routeName}</Text>
                      <View style={styles.actions}>
                        <Pressable onPress={() => openEditRoute(r)} style={styles.iconBtn}><Edit size={16} color="#007aff" /></Pressable>
                        <Pressable onPress={() => handleDeleteRoute(r._id, r.routeName)} style={styles.iconBtn}><Trash2 size={16} color="#ff3b30" /></Pressable>
                      </View>
                    </View>
                    <View style={styles.detailsList}>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Start ➔ End Point:</Text> {r.startPoint} ➔ {r.endPoint}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Stops:</Text> {r.stops?.join(', ') || 'Direct'}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Timings (Pickup/Drop):</Text> {r.pickupTime} / {r.dropTime}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Monthly Fee:</Text> ₹{r.monthlyFee}</Text>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}><Text style={styles.detailLabel}>Vehicle:</Text> {r.vehicle?.vehicleNumber || 'No vehicle linked'}</Text>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && (
            <View>
              <View style={[styles.searchBox, { borderColor: theme.border }]}>
                <Search size={18} color={theme.textSecondary} />
                <TextInput 
                  placeholder="Search student or class..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {filteredStudents.length === 0 ? (
                <EmptyState title="No Matching Students" message="Approved students will appear here for transport assignments." iconName="UserCheck" />
              ) : (
                filteredStudents.map(s => (
                  <Card key={s._id} style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <User size={18} color={colors.primary} />
                      <Text style={[styles.studentName, { color: theme.text }]}>{s.name}</Text>
                      <Text style={[styles.studentClass, { color: theme.textSecondary }]}>({s.class?.name})</Text>
                      <Pressable style={styles.assignBtn} onPress={() => openAssignTransport(s)}>
                        <Text style={styles.assignBtnText}>{s.transport?.route ? 'Update Route' : 'Assign Route'}</Text>
                      </Pressable>
                    </View>
                    {s.transport?.route ? (
                      <View style={styles.transportDetails}>
                        <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Route:</Text> {s.transport.route}</Text>
                        <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Pickup Point:</Text> {s.transport.pickupPoint}</Text>
                        <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Timings:</Text> {s.transport.pickupTime} / {s.transport.dropTime}</Text>
                        <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Monthly Fee:</Text> ₹{s.transport.fee}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.emptyTransport, { color: theme.textSecondary }]}>No transport assigned.</Text>
                    )}
                  </Card>
                ))
              )}
            </View>
          )}
        </View>
      )}

      {/* DRIVER MODAL */}
      <Modal visible={showDriverModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Driver Name</Text>
              <TextInput 
                ref={driverNameRef}
                placeholder="Driver Full Name (Letters only)" 
                style={[styles.input, { color: theme.text, borderColor: errors.name ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverName} 
                onChangeText={setDriverName} 
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Mobile Number</Text>
              <TextInput 
                ref={driverMobileRef}
                placeholder="Mobile (10 digits)" 
                style={[styles.input, { color: theme.text, borderColor: errors.mobile ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverMobile} 
                onChangeText={setDriverMobile} 
                keyboardType="phone-pad" 
                maxLength={10}
              />
              {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Alternate Mobile</Text>
              <TextInput 
                ref={driverAltMobileRef}
                placeholder="Alt Mobile (10 digits)" 
                style={[styles.input, { color: theme.text, borderColor: errors.alternateMobile ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverAlternateMobile} 
                onChangeText={setDriverAlternateMobile} 
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.alternateMobile && <Text style={styles.errorText}>{errors.alternateMobile}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Date of Birth</Text>
              <TextInput 
                ref={driverDobRef}
                placeholder="DOB (YYYY-MM-DD)" 
                style={[styles.input, { color: theme.text, borderColor: errors.dob ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverDob} 
                onChangeText={setDriverDob} 
              />
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Blood Group</Text>
              <View style={styles.selectRow}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <Pressable key={bg} onPress={() => setDriverBloodGroup(bg)} style={[styles.selectOpt, driverBloodGroup === bg && styles.selectOptActive]}>
                    <Text style={{ color: driverBloodGroup === bg ? '#fff' : theme.text }}>{bg}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Address</Text>
              <TextInput 
                placeholder="Residential Address" 
                style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverAddress} 
                onChangeText={setDriverAddress} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Aadhaar Card Number</Text>
              <TextInput 
                ref={driverAadhaarRef}
                placeholder="Aadhaar Card (12 digits)" 
                style={[styles.input, { color: theme.text, borderColor: errors.aadhaar ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverAadhaar} 
                onChangeText={setDriverAadhaar} 
                keyboardType="numeric" 
                maxLength={12}
              />
              {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Driving Licence Number</Text>
              <TextInput 
                ref={driverLicenceRef}
                placeholder="Licence Number (DL-XXXXXX)" 
                style={[styles.input, { color: theme.text, borderColor: errors.licenceNumber ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverLicence} 
                onChangeText={setDriverLicence} 
              />
              {errors.licenceNumber && <Text style={styles.errorText}>{errors.licenceNumber}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Licence Expiry Date</Text>
              <TextInput 
                ref={driverLicenceExpiryRef}
                placeholder="Expiry (YYYY-MM-DD)" 
                style={[styles.input, { color: theme.text, borderColor: errors.licenceExpiry ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverLicenceExpiry} 
                onChangeText={setDriverLicenceExpiry} 
              />
              {errors.licenceExpiry && <Text style={styles.errorText}>{errors.licenceExpiry}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Experience (Years)</Text>
              <TextInput 
                ref={driverExperienceRef}
                placeholder="Experience" 
                style={[styles.input, { color: theme.text, borderColor: errors.experience ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverExperience} 
                onChangeText={setDriverExperience} 
                keyboardType="numeric" 
              />
              {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Emergency Contact Number</Text>
              <TextInput 
                ref={driverEmergencyRef}
                placeholder="Emergency Phone (10 digits)" 
                style={[styles.input, { color: theme.text, borderColor: errors.emergencyContact ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={driverEmergency} 
                onChangeText={setDriverEmergency} 
                keyboardType="phone-pad" 
                maxLength={10}
              />
              {errors.emergencyContact && <Text style={styles.errorText}>{errors.emergencyContact}</Text>}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowDriverModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveDriver} disabled={submitting}>
                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* VEHICLE MODAL */}
      <Modal visible={showVehicleModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingVehicle ? 'Edit Vehicle Profile' : 'Add Transport Vehicle'}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Vehicle Number</Text>
              <TextInput 
                ref={vehicleNoRef}
                placeholder="Vehicle Number (e.g. MH-12-AB-1234)" 
                style={[styles.input, { color: theme.text, borderColor: errors.vehicleNumber ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehicleNo} 
                onChangeText={setVehicleNo} 
              />
              {errors.vehicleNumber && <Text style={styles.errorText}>{errors.vehicleNumber}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Registration Number (RC)</Text>
              <TextInput 
                ref={vehicleRegNoRef}
                placeholder="Registration Certificate No" 
                style={[styles.input, { color: theme.text, borderColor: errors.registrationNumber ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehicleRegNo} 
                onChangeText={setVehicleRegNo} 
              />
              {errors.registrationNumber && <Text style={styles.errorText}>{errors.registrationNumber}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Vehicle Type</Text>
              <View style={styles.selectRow}>
                {['Bus', 'Van', 'Mini-Bus', 'Cab'].map(type => (
                  <Pressable key={type} onPress={() => setVehicleType(type)} style={[styles.selectOpt, vehicleType === type && styles.selectOptActive]}>
                    <Text style={{ color: vehicleType === type ? '#fff' : theme.text }}>{type}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Seating Capacity</Text>
              <TextInput 
                ref={vehicleCapacityRef}
                placeholder="Capacity (e.g. 40)" 
                style={[styles.input, { color: theme.text, borderColor: errors.capacity ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehicleCapacity} 
                onChangeText={setVehicleCapacity} 
                keyboardType="numeric"
              />
              {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Assign Driver</Text>
              <View style={styles.selectColumn}>
                {drivers.map(d => (
                  <Pressable key={d._id} onPress={() => setVehicleDriver(d._id)} style={[styles.selectOptCol, vehicleDriver === d._id && styles.selectOptActive]}>
                    <Text style={[styles.selectOptText, { color: vehicleDriver === d._id ? '#fff' : theme.text }]}>{d.name} ({d.mobile})</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Attendant Name</Text>
              <TextInput 
                placeholder="Attendant Name" 
                style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehicleAttendant} 
                onChangeText={setVehicleAttendant} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Insurance Expiry Date</Text>
              <TextInput 
                ref={vehicleInsuranceRef}
                placeholder="Expiry (YYYY-MM-DD)" 
                style={[styles.input, { color: theme.text, borderColor: errors.insurance ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehicleInsurance} 
                onChangeText={setVehicleInsurance} 
              />
              {errors.insurance && <Text style={styles.errorText}>{errors.insurance}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Fitness Certificate Expiry</Text>
              <TextInput 
                ref={vehicleFitnessRef}
                placeholder="Expiry (YYYY-MM-DD)" 
                style={[styles.input, { color: theme.text, borderColor: errors.fitness ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehicleFitness} 
                onChangeText={setVehicleFitness} 
              />
              {errors.fitness && <Text style={styles.errorText}>{errors.fitness}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Pollution Certificate Expiry</Text>
              <TextInput 
                ref={vehiclePollutionRef}
                placeholder="Expiry (YYYY-MM-DD)" 
                style={[styles.input, { color: theme.text, borderColor: errors.pollution ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={vehiclePollution} 
                onChangeText={setVehiclePollution} 
              />
              {errors.pollution && <Text style={styles.errorText}>{errors.pollution}</Text>}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowVehicleModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveVehicle} disabled={submitting}>
                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ROUTE MODAL */}
      <Modal visible={showRouteModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingRoute ? 'Edit Route Profile' : 'Add Transport Route'}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Route Name</Text>
              <TextInput 
                ref={routeNameRef}
                placeholder="Route Name (e.g. Route 6)" 
                style={[styles.input, { color: theme.text, borderColor: errors.routeName ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routeName} 
                onChangeText={setRouteName} 
              />
              {errors.routeName && <Text style={styles.errorText}>{errors.routeName}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Start Point</Text>
              <TextInput 
                ref={routeStartRef}
                placeholder="Start Point" 
                style={[styles.input, { color: theme.text, borderColor: errors.startPoint ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routeStart} 
                onChangeText={setRouteStart} 
              />
              {errors.startPoint && <Text style={styles.errorText}>{errors.startPoint}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Multiple Stops (Comma separated)</Text>
              <TextInput 
                placeholder="Stop A, Stop B, Stop C" 
                style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routeStops} 
                onChangeText={setRouteStops} 
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>End Point</Text>
              <TextInput 
                ref={routeEndRef}
                placeholder="End Point" 
                style={[styles.input, { color: theme.text, borderColor: errors.endPoint ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routeEnd} 
                onChangeText={setRouteEnd} 
              />
              {errors.endPoint && <Text style={styles.errorText}>{errors.endPoint}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Pickup Time</Text>
              <TextInput 
                ref={routePickupTimeRef}
                placeholder="Pickup Time (e.g. 07:30)" 
                style={[styles.input, { color: theme.text, borderColor: errors.pickupTime ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routePickupTime} 
                onChangeText={setRoutePickupTime} 
              />
              {errors.pickupTime && <Text style={styles.errorText}>{errors.pickupTime}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Drop Time</Text>
              <TextInput 
                ref={routeDropTimeRef}
                placeholder="Drop Time (e.g. 14:15)" 
                style={[styles.input, { color: theme.text, borderColor: errors.dropTime ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routeDropTime} 
                onChangeText={setRouteDropTime} 
              />
              {errors.dropTime && <Text style={styles.errorText}>{errors.dropTime}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Monthly Fee (₹)</Text>
              <TextInput 
                ref={routeFeeRef}
                placeholder="Monthly Fee" 
                style={[styles.input, { color: theme.text, borderColor: errors.monthlyFee ? '#ff3b30' : theme.border }]} 
                placeholderTextColor={theme.textSecondary} 
                value={routeFee} 
                onChangeText={setRouteFee} 
                keyboardType="numeric"
              />
              {errors.monthlyFee && <Text style={styles.errorText}>{errors.monthlyFee}</Text>}

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Assign Vehicle</Text>
              <View style={styles.selectColumn}>
                {vehicles.map(v => (
                  <Pressable key={v._id} onPress={() => setRouteVehicle(v._id)} style={[styles.selectOptCol, routeVehicle === v._id && styles.selectOptActive]}>
                    <Text style={[styles.selectOptText, { color: routeVehicle === v._id ? '#fff' : theme.text }]}>{v.vehicleNumber} ({v.vehicleType})</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowRouteModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveRoute} disabled={submitting}>
                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* STUDENT ASSIGNMENT MODAL */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Assign Transport - {selectedStudent?.name}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Route</Text>
              <View style={styles.selectColumn}>
                <Pressable onPress={() => { setAssignRouteId(''); setAssignPickupPoint(''); }} style={[styles.selectOptCol, !assignRouteId && styles.selectOptActive]}>
                  <Text style={[styles.selectOptText, { color: !assignRouteId ? '#fff' : theme.text }]}>None (Cancel Service)</Text>
                </Pressable>
                {routes.map(r => (
                  <Pressable key={r._id} onPress={() => { setAssignRouteId(r._id); setAssignPickupPoint(r.stops[0] || r.startPoint); }} style={[styles.selectOptCol, assignRouteId === r._id && styles.selectOptActive]}>
                    <Text style={[styles.selectOptText, { color: assignRouteId === r._id ? '#fff' : theme.text }]}>{r.routeName} ({r.startPoint} ➔ {r.endPoint})</Text>
                  </Pressable>
                ))}
              </View>

              {selectedRouteObj ? (
                <View style={styles.transportDetails}>
                  <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Linked Vehicle:</Text> {selectedRouteObj.vehicle?.vehicleNumber || 'No vehicle linked'}</Text>
                  <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Pickup Time:</Text> {selectedRouteObj.pickupTime}</Text>
                  <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Drop Time:</Text> {selectedRouteObj.dropTime}</Text>
                  <Text style={{ fontSize: 12, color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Fee:</Text> ₹{selectedRouteObj.monthlyFee} / month</Text>
                </View>
              ) : null}

              {selectedRouteObj && selectedRouteObj.stops?.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Pickup Stop</Text>
                  <View style={styles.selectRow}>
                    {selectedRouteObj.stops.map((stop: string) => (
                      <Pressable key={stop} onPress={() => setAssignPickupPoint(stop)} style={[styles.selectOpt, assignPickupPoint === stop && styles.selectOptActive]}>
                        <Text style={{ color: assignPickupPoint === stop ? '#fff' : theme.text }}>{stop}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAssignModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleAssignTransport} disabled={submitting}>
                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  warningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  warningCard: {
    flex: 0.48,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center'
  },
  warnNum: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#ff3b30'
  },
  warnText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e5e5ea',
    paddingBottom: 4
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: colors.primary
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4
  },
  content: {
    marginBottom: 40
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8
  },
  itemCard: {
    padding: 16,
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    paddingBottom: 10,
    marginBottom: 10
  },
  vehiclePlate: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1
  },
  actions: {
    flexDirection: 'row'
  },
  iconBtn: {
    marginLeft: 12,
    padding: 4
  },
  detailsList: {
    marginTop: 4
  },
  detailText: {
    fontSize: 13,
    marginBottom: 6
  },
  detailLabel: {
    fontWeight: 'bold'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1
  },
  studentClass: {
    fontSize: 12,
    marginRight: 10
  },
  assignBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  assignBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  transportDetails: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    padding: 10,
    borderRadius: 6,
    marginTop: 4
  },
  emptyTransport: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4
  },
  modalBg: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20
  },
  modalBody: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalScroll: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 6,
    height: 44
  },
  errorText: {
    fontSize: 11,
    color: '#ff3b30',
    marginBottom: 8,
    fontWeight: '600'
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6
  },
  selectOpt: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  selectOptCol: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8
  },
  selectColumn: {
    marginBottom: 12
  },
  selectOptActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectOptText: {
    fontSize: 13
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelBtn: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8e8e93'
  },
  saveBtn: {
    flex: 0.48,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  }
});
