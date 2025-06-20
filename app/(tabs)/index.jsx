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
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEarnings } from '@/context/EarningsContext';
import { supabase } from '@/lib/supabase';
import { EarningsRecord } from '@/types/database';
import { DollarSign, TrendingUp, Calculator, LogOut } from 'lucide-react-native';

export default function EarningsScreen() {
  const { signOut, user } = useAuth();
  const { refreshHistory } = useEarnings();
  const [formData, setFormData] = useState({
    totalEarnings: '',
    tripsCompleted: '',
    kilometersDriver: '',
    hoursWorked: '',
    tips: '',
    extras: '',
    fuelCost: '',
    otherExpenses: '',
  });

  const [calculations, setCalculations] = useState({
    grossEarnings: 0,
    grossPerKm: 0,
    grossPerHour: 0,
    grossPerTrip: 0,
    totalExpenses: 0,
    netEarnings: 0,
    netPerKm: 0,
    netPerHour: 0,
    netPerTrip: 0,
  });

  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    calculateValues();
  }, [formData]);

  const calculateValues = () => {
    const totalEarnings = parseFloat(formData.totalEarnings) || 0;
    const tripsCompleted = parseFloat(formData.tripsCompleted) || 0;
    const kilometersDriver = parseFloat(formData.kilometersDriver) || 0;
    const hoursWorked = parseFloat(formData.hoursWorked) || 0;
    const tips = parseFloat(formData.tips) || 0;
    const extras = parseFloat(formData.extras) || 0;
    const fuelCost = parseFloat(formData.fuelCost) || 0;
    const otherExpenses = parseFloat(formData.otherExpenses) || 0;

    const grossEarnings = totalEarnings + tips + extras;
    const totalExpenses = fuelCost + otherExpenses;
    const netEarnings = grossEarnings - totalExpenses;

    setCalculations({
      grossEarnings,
      grossPerKm: kilometersDriver > 0 ? grossEarnings / kilometersDriver : 0,
      grossPerHour: hoursWorked > 0 ? grossEarnings / hoursWorked : 0,
      grossPerTrip: tripsCompleted > 0 ? grossEarnings / tripsCompleted : 0,
      totalExpenses,
      netEarnings,
      netPerKm: kilometersDriver > 0 ? netEarnings / kilometersDriver : 0,
      netPerHour: hoursWorked > 0 ? netEarnings / hoursWorked : 0,
      netPerTrip: tripsCompleted > 0 ? netEarnings / tripsCompleted : 0,
    });
  };

  const handleSave = async () => {
    if (!user) return;

    const requiredFields = ['totalEarnings', 'tripsCompleted', 'kilometersDriver', 'hoursWorked'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    const earningsData: Omit<EarningsRecord, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      total_earnings: parseFloat(formData.totalEarnings),
      trips_completed: parseInt(formData.tripsCompleted),
      kilometers_driven: parseFloat(formData.kilometersDriver),
      hours_worked: parseFloat(formData.hoursWorked),
      tips: parseFloat(formData.tips) || 0,
      extras: parseFloat(formData.extras) || 0,
      fuel_cost: parseFloat(formData.fuelCost) || 0,
      other_expenses: parseFloat(formData.otherExpenses) || 0,
      // Map camelCase calculations to snake_case column names
      gross_earnings: calculations.grossEarnings,
      gross_per_km: calculations.grossPerKm,
      gross_per_hour: calculations.grossPerHour,
      gross_per_trip: calculations.grossPerTrip,
      total_expenses: calculations.totalExpenses,
      net_earnings: calculations.netEarnings,
      net_per_km: calculations.netPerKm,
      net_per_hour: calculations.netPerHour,
      net_per_trip: calculations.netPerTrip,
    };

    const { error } = await supabase
      .from('earnings_records')
      .insert([earningsData]);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } else {
      Alert.alert('Éxito', 'Registro guardado correctamente');
      
      // Reset form
      setFormData({
        totalEarnings: '',
        tripsCompleted: '',
        kilometersDriver: '',
        hoursWorked: '',
        tips: '',
        extras: '',
        fuelCost: '',
        otherExpenses: '',
      });

      // Refresh history in real-time
      refreshHistory();
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Error', 'No se pudo cerrar sesión: ' + error.message);
      } else {
        // Force navigation to login screen
        router.replace('/(auth)/login');
      }
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error inesperado al cerrar sesión');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <DollarSign size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Registro de Ganancias</Text>
        </View>
        <TouchableOpacity 
          onPress={handleSignOut} 
          style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
          disabled={signingOut}
        >
          <LogOut size={20} color={signingOut ? "#94a3b8" : "#ef4444"} />
          {signingOut && <Text style={styles.signOutText}>Saliendo...</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de Entrada</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ganancias Totales *</Text>
            <TextInput
              style={styles.input}
              value={formData.totalEarnings}
              onChangeText={(text) => setFormData(prev => ({ ...prev, totalEarnings: text }))}
              placeholder="$0.00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Viajes Realizados *</Text>
            <TextInput
              style={styles.input}
              value={formData.tripsCompleted}
              onChangeText={(text) => setFormData(prev => ({ ...prev, tripsCompleted: text }))}
              placeholder="0"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kilómetros Recorridos *</Text>
            <TextInput
              style={styles.input}
              value={formData.kilometersDriver}
              onChangeText={(text) => setFormData(prev => ({ ...prev, kilometersDriver: text }))}
              placeholder="0.0 km"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Horas Trabajadas *</Text>
            <TextInput
              style={styles.input}
              value={formData.hoursWorked}
              onChangeText={(text) => setFormData(prev => ({ ...prev, hoursWorked: text }))}
              placeholder="0.0 hrs"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Propinas</Text>
            <TextInput
              style={styles.input}
              value={formData.tips}
              onChangeText={(text) => setFormData(prev => ({ ...prev, tips: text }))}
              placeholder="$0.00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Extras</Text>
            <TextInput
              style={styles.input}
              value={formData.extras}
              onChangeText={(text) => setFormData(prev => ({ ...prev, extras: text }))}
              placeholder="$0.00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gasto en Combustible</Text>
            <TextInput
              style={styles.input}
              value={formData.fuelCost}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fuelCost: text }))}
              placeholder="$0.00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gastos Varios</Text>
            <TextInput
              style={styles.input}
              value={formData.otherExpenses}
              onChangeText={(text) => setFormData(prev => ({ ...prev, otherExpenses: text }))}
              placeholder="$0.00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calculator size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Cálculos Automáticos</Text>
          </View>

          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>Ganancias Brutas</Text>
            <Text style={styles.calculationValue}>
              ${calculations.grossEarnings.toFixed(2)}
            </Text>
            <View style={styles.calculationDetails}>
              <Text style={styles.calculationDetail}>
                Por km: ${calculations.grossPerKm.toFixed(2)}
              </Text>
              <Text style={styles.calculationDetail}>
                Por hora: ${calculations.grossPerHour.toFixed(2)}
              </Text>
              <Text style={styles.calculationDetail}>
                Por viaje: ${calculations.grossPerTrip.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>Gastos Totales</Text>
            <Text style={[styles.calculationValue, styles.expenseValue]}>
              ${calculations.totalExpenses.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.calculationCard, styles.netCard]}>
            <Text style={styles.calculationTitle}>Ganancias Netas</Text>
            <Text style={[styles.calculationValue, styles.netValue]}>
              ${calculations.netEarnings.toFixed(2)}
            </Text>
            <View style={styles.calculationDetails}>
              <Text style={styles.calculationDetail}>
                Por km: ${calculations.netPerKm.toFixed(2)}
              </Text>
              <Text style={styles.calculationDetail}>
                Por hora: ${calculations.netPerHour.toFixed(2)}
              </Text>
              <Text style={styles.calculationDetail}>
                Por viaje: ${calculations.netPerTrip.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <TrendingUp size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : 'Guardar Registro'}
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calculationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
  },
  calculationValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  expenseValue: {
    color: '#ef4444',
  },
  netCard: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  netValue: {
    color: '#10b981',
  },
  calculationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calculationDetail: {
    fontSize: 12,
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});