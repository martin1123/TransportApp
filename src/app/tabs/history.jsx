import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useEarnings } from '@/context/EarningsContext';
import { supabase } from '@/lib/supabase';
import { EarningsRecord } from '@/types/database';
import { 
  History, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react-native';

type SortField = 'date' | 'net_earnings' | 'gross_earnings' | 'trips_completed';
type SortOrder = 'asc' | 'desc';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { setRefreshHistory } = useEarnings();
  const [records, setRecords] = useState<EarningsRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EarningsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const loadEarningsHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('earnings_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadEarningsHistory();
    }
  }, [user, loadEarningsHistory]);

  useEffect(() => {
    filterAndSortRecords();
  }, [records, searchQuery, sortField, sortOrder]);

  // Set up the refresh callback for real-time updates
  useEffect(() => {
    setRefreshHistory(() => loadEarningsHistory);
  }, [setRefreshHistory, loadEarningsHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsHistory();
    setRefreshing(false);
  };

  const filterAndSortRecords = () => {
    let filtered = [...records];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.date.includes(query) ||
        record.net_earnings.toString().includes(query) ||
        record.gross_earnings.toString().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecords(filtered);
  };

  const deleteRecord = async (recordId: string) => {
    const { error } = await supabase
      .from('earnings_records')
      .delete()
      .eq('id', recordId);

    if (!error) {
      setRecords(prev => prev.filter(record => record.id !== recordId));
      setSelectedRecord(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp size={16} color="#2563EB" /> : 
      <ChevronDown size={16} color="#2563EB" />;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const calculateTotals = () => {
    const totals = filteredRecords.reduce((acc, record) => ({
      totalGross: acc.totalGross + record.gross_earnings,
      totalNet: acc.totalNet + record.net_earnings,
      totalTrips: acc.totalTrips + record.trips_completed,
      totalKm: acc.totalKm + record.kilometers_driven,
      totalHours: acc.totalHours + record.hours_worked,
    }), {
      totalGross: 0,
      totalNet: 0,
      totalTrips: 0,
      totalKm: 0,
      totalHours: 0,
    });

    return totals;
  };

  const totals = calculateTotals();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <History size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Historial de Ganancias</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Filter size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por fecha o monto..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Ordenar por:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortField === 'date' && styles.sortButtonActive]}
                onPress={() => handleSort('date')}
              >
                <Text style={[styles.sortButtonText, sortField === 'date' && styles.sortButtonTextActive]}>
                  Fecha
                </Text>
                {getSortIcon('date')}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortField === 'net_earnings' && styles.sortButtonActive]}
                onPress={() => handleSort('net_earnings')}
              >
                <Text style={[styles.sortButtonText, sortField === 'net_earnings' && styles.sortButtonTextActive]}>
                  Ganancia Neta
                </Text>
                {getSortIcon('net_earnings')}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortField === 'trips_completed' && styles.sortButtonActive]}
                onPress={() => handleSort('trips_completed')}
              >
                <Text style={[styles.sortButtonText, sortField === 'trips_completed' && styles.sortButtonTextActive]}>
                  Viajes
                </Text>
                {getSortIcon('trips_completed')}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Registros</Text>
          <Text style={styles.summaryValue}>{filteredRecords.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ganancia Neta Total</Text>
          <Text style={[styles.summaryValue, styles.positiveValue]}>
            {formatCurrency(totals.totalNet)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Viajes</Text>
          <Text style={styles.summaryValue}>{totals.totalTrips}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#64748b" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No se encontraron registros' : 'No hay registros de ganancias'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los registros aparecerán aquí cuando los crees'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={[
                styles.recordCard,
                selectedRecord === record.id && styles.recordCardSelected
              ]}
              onPress={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
            >
              <View style={styles.recordHeader}>
                <View style={styles.recordHeaderLeft}>
                  <Calendar size={16} color="#64748b" />
                  <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                </View>
                <View style={styles.recordHeaderRight}>
                  <Text style={[
                    styles.recordNetEarnings,
                    record.net_earnings >= 0 ? styles.positiveValue : styles.negativeValue
                  ]}>
                    {formatCurrency(record.net_earnings)}
                  </Text>
                  {record.net_earnings >= 0 ? 
                    <TrendingUp size={16} color="#10b981" /> : 
                    <TrendingDown size={16} color="#ef4444" />
                  }
                </View>
              </View>

              <View style={styles.recordSummary}>
                <View style={styles.recordSummaryItem}>
                  <Text style={styles.recordSummaryLabel}>Viajes</Text>
                  <Text style={styles.recordSummaryValue}>{record.trips_completed}</Text>
                </View>
                <View style={styles.recordSummaryItem}>
                  <Text style={styles.recordSummaryLabel}>Km</Text>
                  <Text style={styles.recordSummaryValue}>{record.kilometers_driven.toFixed(1)}</Text>
                </View>
                <View style={styles.recordSummaryItem}>
                  <Text style={styles.recordSummaryLabel}>Horas</Text>
                  <Text style={styles.recordSummaryValue}>{record.hours_worked.toFixed(1)}</Text>
                </View>
                <View style={styles.recordSummaryItem}>
                  <Text style={styles.recordSummaryLabel}>Bruto</Text>
                  <Text style={styles.recordSummaryValue}>{formatCurrency(record.gross_earnings)}</Text>
                </View>
              </View>

              {selectedRecord === record.id && (
                <View style={styles.recordDetails}>
                  <View style={styles.recordDetailsSection}>
                    <Text style={styles.recordDetailsTitle}>Ingresos</Text>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Ganancias base:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.total_earnings)}</Text>
                    </View>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Propinas:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.tips)}</Text>
                    </View>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Extras:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.extras)}</Text>
                    </View>
                  </View>

                  <View style={styles.recordDetailsSection}>
                    <Text style={styles.recordDetailsTitle}>Gastos</Text>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Combustible:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.fuel_cost)}</Text>
                    </View>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Otros gastos:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.other_expenses)}</Text>
                    </View>
                  </View>

                  <View style={styles.recordDetailsSection}>
                    <Text style={styles.recordDetailsTitle}>Métricas</Text>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Neto por km:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.net_per_km)}</Text>
                    </View>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Neto por hora:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.net_per_hour)}</Text>
                    </View>
                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.recordDetailsLabel}>Neto por viaje:</Text>
                      <Text style={styles.recordDetailsValue}>{formatCurrency(record.net_per_trip)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteRecord(record.id)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Eliminar registro</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  filtersContainer: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  sortContainer: {
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sortButtonActive: {
    backgroundColor: '#1e40af20',
    borderColor: '#2563EB',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 4,
  },
  sortButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  positiveValue: {
    color: '#10b981',
  },
  negativeValue: {
    color: '#ef4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  recordCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#1e40af10',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 14,
    color: '#e2e8f0',
    marginLeft: 8,
    fontWeight: '500',
  },
  recordHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordNetEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  recordSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  recordSummaryItem: {
    alignItems: 'center',
  },
  recordSummaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
  },
  recordSummaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  recordDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  recordDetailsSection: {
    marginBottom: 16,
  },
  recordDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  recordDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordDetailsLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recordDetailsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc262620',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});