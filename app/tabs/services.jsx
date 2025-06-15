import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ServiceRecord } from '@/types/database';
import { Settings, Calendar, Gauge, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Trash2 } from 'lucide-react-native';

const SERVICE_TYPES = [
  { key: 'vtv', label: 'VTV', rule: 'years', value: 2 },
  { key: 'oil_change', label: 'Cambio de aceite', rule: 'km', value: 10000 },
  { key: 'timing_belt', label: 'Cambio de distribución', rule: 'km', value: 70000 },
  { key: 'brakes', label: 'Cambio de frenos', rule: 'km', value: 40000 },
];

export default function ServicesScreen() {
  const { user } = useAuth();
  const [currentMileage, setCurrentMileage] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadUpcomingServices();
    }
  }, [user]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const loadUpcomingServices = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('service_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUpcomingServices(data);
    }
  };

  const toggleService = (serviceKey: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceKey) ? prev.filter(s => s !== serviceKey) : [...prev, serviceKey]
    );
  };

  const calculateNextService = (serviceType: string, currentMileage: number, serviceDate: string) => {
    const service = SERVICE_TYPES.find(s => s.key === serviceType);
    if (!service) return {};

    if (service.rule === 'years') {
      const nextDate = new Date(serviceDate);
      nextDate.setFullYear(nextDate.getFullYear() + service.value);
      return { next_service_date: nextDate.toISOString().split('T')[0] };
    } else {
      return { next_service_mileage: currentMileage + service.value };
    }
  };

  const handleSave = async () => {
    if (!user || !currentMileage || selectedServices.length === 0) {
      showNotification('error', 'Por favor completa el kilometraje y selecciona al menos un servicio');
      return;
    }

    setLoading(true);

    const mileage = parseFloat(currentMileage);
    const currentDate = new Date().toISOString().split('T')[0];

    try {
      // Process each selected service
      for (const serviceType of selectedServices) {
        const nextService = calculateNextService(serviceType, mileage, currentDate);
        
        // Check if service already exists for this user and service type
        const { data: existingService } = await supabase
          .from('service_records')
          .select('id')
          .eq('user_id', user.id)
          .eq('service_type', serviceType)
          .limit(1);

        const serviceData = {
          user_id: user.id,
          service_type: serviceType as any,
          service_date: currentDate,
          current_mileage: mileage,
          ...nextService,
        };

        if (existingService && existingService.length > 0) {
          // Update existing service record
          const { error } = await supabase
            .from('service_records')
            .update(serviceData)
            .eq('id', existingService[0].id);

          if (error) throw error;
        } else {
          // Insert new service record
          const { error } = await supabase
            .from('service_records')
            .insert([serviceData]);

          if (error) throw error;
        }
      }

      showNotification('success', 'Servicios registrados correctamente');
      setCurrentMileage('');
      setSelectedServices([]);
      loadUpcomingServices();
    } catch (error) {
      showNotification('error', 'No se pudieron guardar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from('service_records')
      .delete()
      .eq('id', serviceId);

    if (!error) {
      showNotification('success', 'Servicio eliminado correctamente');
      loadUpcomingServices();
    } else {
      showNotification('error', 'No se pudo eliminar el servicio');
    }
  };

  const isServiceDue = (service: ServiceRecord) => {
    const today = new Date();
    
    if (service.next_service_date) {
      const nextServiceDate = new Date(service.next_service_date);
      const daysUntilService = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilService <= 30; // Due within 30 days
    }
    
    if (service.next_service_mileage && currentMileage) {
      const currentKm = parseFloat(currentMileage);
      return currentKm >= (service.next_service_mileage - 1000); // Due within 1000 km
    }
    
    return false;
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'vtv':
        return <CheckCircle size={20} color="#2563EB" />;
      case 'oil_change':
        return <Gauge size={20} color="#059669" />;
      case 'timing_belt':
        return <Settings size={20} color="#EA580C" />;
      case 'brakes':
        return <AlertCircle size={20} color="#DC2626" />;
      default:
        return <Settings size={20} color="#64748b" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#2563EB" />
        <Text style={styles.headerTitle}>Registro de Servicios</Text>
      </View>

      {notification && (
        <View style={[
          styles.notificationContainer,
          notification.type === 'success' ? styles.successNotification : styles.errorNotification
        ]}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} color="#ffffff" />
          ) : (
            <AlertCircle size={20} color="#ffffff" />
          )}
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nuevo Registro</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kilometraje Actual</Text>
            <View style={styles.inputContainer}>
              <Gauge size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={currentMileage}
                onChangeText={(text) => {
                  setCurrentMileage(text);
                  if (notification) setNotification(null);
                }}
                placeholder="120,000 km"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Servicios Realizados</Text>
          {SERVICE_TYPES.map(service => (
            <TouchableOpacity
              key={service.key}
              style={[
                styles.serviceOption,
                selectedServices.includes(service.key) && styles.serviceOptionSelected
              ]}
              onPress={() => toggleService(service.key)}
            >
              <View style={styles.serviceOptionLeft}>
                {getServiceIcon(service.key)}
                <View style={styles.serviceOptionText}>
                  <Text style={styles.serviceOptionTitle}>{service.label}</Text>
                  <Text style={styles.serviceOptionRule}>
                    Repetir cada {service.value} {service.rule === 'years' ? 'años' : 'km'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.checkbox,
                selectedServices.includes(service.key) && styles.checkboxSelected
              ]}>
                {selectedServices.includes(service.key) && (
                  <CheckCircle size={16} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Guardando...' : 'Registrar Servicios'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Servicios</Text>
          
          {upcomingServices.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#64748b" />
              <Text style={styles.emptyStateText}>
                No hay servicios registrados
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Registra servicios para recibir recordatorios
              </Text>
            </View>
          ) : (
            upcomingServices.map(service => {
              const serviceType = SERVICE_TYPES.find(s => s.key === service.service_type);
              const isDue = isServiceDue(service);
              
              return (
                <View
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    isDue && styles.serviceCardDue
                  ]}
                >
                  <View style={styles.serviceCardHeader}>
                    <View style={styles.serviceCardHeaderLeft}>
                      {getServiceIcon(service.service_type)}
                      <View style={styles.serviceCardTitle}>
                        <Text style={styles.serviceCardName}>
                          {serviceType?.label}
                        </Text>
                        {isDue && (
                          <Text style={styles.serviceDueLabel}>PRÓXIMO</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteServiceButton}
                      onPress={() => deleteService(service.id)}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.serviceCardDetails}>
                    <View style={styles.serviceCardRow}>
                      <Text style={styles.serviceCardLabel}>Último servicio:</Text>
                      <Text style={styles.serviceCardValue}>
                        {new Date(service.service_date).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.serviceCardRow}>
                      <Text style={styles.serviceCardLabel}>Kilometraje:</Text>
                      <Text style={styles.serviceCardValue}>
                        {service.current_mileage.toLocaleString()} km
                      </Text>
                    </View>

                    {service.next_service_date && (
                      <View style={styles.serviceCardRow}>
                        <Text style={styles.serviceCardLabel}>Próximo:</Text>
                        <Text style={styles.serviceCardValue}>
                          {new Date(service.next_service_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {service.next_service_mileage && (
                      <View style={styles.serviceCardRow}>
                        <Text style={styles.serviceCardLabel}>Próximo km:</Text>
                        <Text style={styles.serviceCardValue}>
                          {service.next_service_mileage.toLocaleString()} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  successNotification: {
    backgroundColor: '#059669',
  },
  errorNotification: {
    backgroundColor: '#dc2626',
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#1e40af10',
  },
  serviceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  serviceOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  serviceOptionRule: {
    fontSize: 12,
    color: '#64748b',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  serviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceCardDue: {
    borderColor: '#f59e0b',
    backgroundColor: '#f59e0b10',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceCardTitle: {
    marginLeft: 12,
    flex: 1,
  },
  serviceCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  serviceDueLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 2,
  },
  deleteServiceButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#dc262620',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  serviceCardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  serviceCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceCardLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  serviceCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});