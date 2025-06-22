import React, { useState, useEffect, useCallback } from 'react';
import { History, Calendar, Search, Filter, ChevronDown, ChevronUp, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEarnings } from '@/context/EarningsContext';
import { supabase } from '@/lib/supabase';

const HistoryScreen = () => {
  const { user } = useAuth();
  const { setRefreshHistory } = useEarnings();

  const [records, setRecords] = useState([]); 
  const [filteredRecords, setFilteredRecords] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false); 

  const [searchQuery, setSearchQuery] = useState(''); 
  const [sortField, setSortField] = useState('date'); 
  const [sortOrder, setSortOrder] = useState('desc'); 
  const [showFilters, setShowFilters] = useState(false); 

  const [selectedRecord, setSelectedRecord] = useState(null); 
  const [notification, setNotification] = useState(null); 

   // Para cargar el historial de ganancias desde Supabase
  const loadEarningsHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Consulta a Supabase para obtener registros del usuario
      const { data, error } = await supabase
        .from('earnings_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      // Actualizar estado con los datos obtenidos
      setRecords(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
      showNotification('error', 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    if (user) {
      loadEarningsHistory();
    }
  }, [user, loadEarningsHistory]);

  //Para ordenar registros cuando cambian los criterios
  useEffect(() => {
    filterAndSortRecords();
  }, [records, searchQuery, sortField, sortOrder]);

  //Registrar función de refresco para uso desde otros componentes (para que otros componentes actualicen el historial)
  useEffect(() => {
    setRefreshHistory(() => loadEarningsHistory);
  }, [setRefreshHistory, loadEarningsHistory]);

  //Para mostrar notificaciones 
  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Auto-ocultar después de 3 segundos
    setTimeout(() => setNotification(null), 3000);
  };

  /**
   * Función para filtrar y ordenar registros según los criterios actuales
   */
  const filterAndSortRecords = () => {
    let filtered = [...records];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.date.includes(query) ||
        record.net_earnings.toString().includes(query) ||
        record.gross_earnings.toString().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

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

 //Para eliminar un registro específico
  const deleteRecord = async (recordId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return;
    }

    try {
      // Eliminar de Supabase
      const { error } = await supabase
        .from('earnings_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        throw error;
      }

      setRecords(prev => prev.filter(record => record.id !== recordId));
      setSelectedRecord(null); 
      showNotification('success', 'Registro eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando registro:', error);
      showNotification('error', 'Error al eliminar el registro');
    }
  };

 

  //Función para obtener el icono de ordenamiento 
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp size={16} className="text-blue-500" /> : 
      <ChevronDown size={16} className="text-blue-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  //Calcular total de los registros filtrados
  const calculateTotals = () => {
    return filteredRecords.reduce((acc, record) => ({
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
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header de la pantalla con título y botón de filtros */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History size={28} className="text-blue-500" />
            <h1 className="text-2xl font-bold">Historial de Ganancias</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-primary flex items-center space-x-2"
          >
            <Filter size={20} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Notificación temporal */}
      {notification && (
        <div className={`notification ${notification.type} animate-slide-up`}>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Panel de filtros (mostrar/ocultar) */}
        {showFilters && (
          <div className="card animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Search size={20} />
              <span>Filtros y Búsqueda</span>
            </h2>
            
            {/* Barra de búsqueda */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por fecha o monto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Botones de ordenamiento */}
            <div>
              <span className="block text-sm font-medium text-gray-300 mb-2">Ordenar por:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('date')}
                  className={`sort-button ${sortField === 'date' ? 'active' : ''}`}
                >
                  <span>Fecha</span>
                  {getSortIcon('date')}
                </button>
                <button
                  onClick={() => handleSort('net_earnings')}
                  className={`sort-button ${sortField === 'net_earnings' ? 'active' : ''}`}
                >
                  <span>Ganancia Neta</span>
                  {getSortIcon('net_earnings')}
                </button>
                <button
                  onClick={() => handleSort('trips_completed')}
                  className={`sort-button ${sortField === 'trips_completed' ? 'active' : ''}`}
                >
                  <span>Viajes</span>
                  {getSortIcon('trips_completed')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de resumen con totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <span className="block text-sm text-gray-400 mb-1">Total Registros</span>
            <span className="text-2xl font-bold">{filteredRecords.length}</span>
          </div>
          <div className="card text-center">
            <span className="block text-sm text-gray-400 mb-1">Ganancia Neta Total</span>
            <span className="text-2xl font-bold text-green-400">{formatCurrency(totals.totalNet)}</span>
          </div>
          <div className="card text-center">
            <span className="block text-sm text-gray-400 mb-1">Total Viajes</span>
            <span className="text-2xl font-bold">{totals.totalTrips}</span>
          </div>
        </div>

        {/* Lista de registros */}
        <div className="card">
          {loading ? (
            // Estado de carga
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Cargando historial...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            // Estado vacío
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No se encontraron registros' : 'No hay registros de ganancias'}
              </h3>
              <p className="text-gray-400">
                {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los registros aparecerán aquí cuando los crees'}
              </p>
            </div>
          ) : (
            // Lista de registros
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`border border-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-500 ${
                    selectedRecord === record.id ? 'border-blue-500 bg-blue-900/10' : 'bg-gray-800'
                  }`}
                >
                  {/* Header del registro (clickeable para expandir) */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Fecha del registro */}
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{formatDate(record.date)}</span>
                      </div>
                      
                      {/* Ganancia neta con indicador de tendencia */}
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${
                          record.net_earnings >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(record.net_earnings)}
                        </span>
                        {record.net_earnings >= 0 ? 
                          <TrendingUp size={16} className="text-green-400" /> : 
                          <TrendingDown size={16} className="text-red-400" />
                        }
                      </div>
                    </div>

                    {/* Resumen de métricas principales */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
                      <div className="text-center">
                        <span className="block text-xs text-gray-400">Viajes</span>
                        <span className="font-semibold">{record.trips_completed}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xs text-gray-400">Km</span>
                        <span className="font-semibold">{record.kilometers_driven.toFixed(1)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xs text-gray-400">Horas</span>
                        <span className="font-semibold">{record.hours_worked.toFixed(1)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xs text-gray-400">Bruto</span>
                        <span className="font-semibold">{formatCurrency(record.gross_earnings)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalles expandidos (mostrar solo si está seleccionado) */}
                  {selectedRecord === record.id && (
                    <div className="border-t border-gray-700 bg-gray-900 p-4 animate-fade-in">
                      {/* Sección de ingresos */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-300 mb-3">Ingresos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ganancias base:</span>
                            <span className="font-semibold">{formatCurrency(record.total_earnings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Propinas:</span>
                            <span className="font-semibold">{formatCurrency(record.tips)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Extras:</span>
                            <span className="font-semibold">{formatCurrency(record.extras)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sección de gastos */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-300 mb-3">Gastos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Combustible:</span>
                            <span className="font-semibold">{formatCurrency(record.fuel_cost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Otros gastos:</span>
                            <span className="font-semibold">{formatCurrency(record.other_expenses)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sección de métricas calculadas */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-300 mb-3">Métricas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Neto por km:</span>
                            <span className="font-semibold">{formatCurrency(record.net_per_km)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Neto por hora:</span>
                            <span className="font-semibold">{formatCurrency(record.net_per_hour)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Neto por viaje:</span>
                            <span className="font-semibold">{formatCurrency(record.net_per_trip)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de eliminar */}
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="btn-danger w-full flex items-center justify-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Eliminar registro</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;