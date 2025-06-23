import React, { useState, useEffect, useCallback } from 'react';
import { History, Calendar, Search, Filter, ChevronDown, ChevronUp, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEarnings } from '@/context/EarningsContext';
import { supabase } from '@/lib/supabase';

const PantallaHistorial = () => {
  // Hooks de contexto para usuario y refresco de historial
  const { user } = useAuth();
  const { setRefreshHistory } = useEarnings();

  // Estados principales de la pantalla
  const [registros, setRegistros] = useState([]); // Todos los registros traídos de la base
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]); // Registros filtrados y ordenados
  const [cargando, setCargando] = useState(true); // Estado de carga
  const [busqueda, setBusqueda] = useState(''); // Texto de búsqueda
  const [campoOrden, setCampoOrden] = useState('date'); // Campo por el que se ordena
  const [orden, setOrden] = useState('desc'); // Orden ascendente o descendente
  const [mostrarFiltros, setMostrarFiltros] = useState(false); // Mostrar/ocultar filtros
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null); // Registro expandido
  const [notificacion, setNotificacion] = useState(null); // Notificación de éxito/error

  // Función para cargar el historial desde Supabase
  const cargarHistorial = useCallback(async () => {
    if (!user) return;
    setCargando(true);
    const { data, error } = await supabase
      .from('earnings_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (!error) setRegistros(data || []);
    setCargando(false);
    if (error) mostrarNotificacion('error', 'Error al cargar el historial');
  }, [user]);

  // Cargar historial al montar el componente o cuando cambia el usuario
  useEffect(() => { if (user) cargarHistorial(); }, [user, cargarHistorial]);
  // Permite refrescar el historial desde otros componentes
  useEffect(() => { setRefreshHistory(() => cargarHistorial); }, [setRefreshHistory, cargarHistorial]);

  // Filtrado y ordenamiento de los registros según búsqueda y campo de orden
  useEffect(() => {
    let filtrados = [...registros];
    if (busqueda) {
      const q = busqueda.toLowerCase();
      filtrados = filtrados.filter(r =>
        r.date.includes(q) ||
        r.net_earnings.toString().includes(q) ||
        r.gross_earnings.toString().includes(q)
      );
    }
    filtrados.sort((a, b) => {
      let aVal = a[campoOrden], bVal = b[campoOrden];
      if (campoOrden === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      return orden === 'asc' ? aVal - bVal : bVal - aVal;
    });
    setRegistrosFiltrados(filtrados);
  }, [registros, busqueda, campoOrden, orden]);

  // Mostrar notificaciones temporales
  const mostrarNotificacion = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 3000);
  };

  // Eliminar un registro de la base y del estado local
  const eliminarRegistro = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    const { error } = await supabase.from('earnings_records').delete().eq('id', id);
    if (!error) {
      setRegistros(prev => prev.filter(r => r.id !== id));
      setRegistroSeleccionado(null);
      mostrarNotificacion('success', 'Registro eliminado correctamente');
    } else {
      mostrarNotificacion('error', 'Error al eliminar el registro');
    }
  };

  // Cambiar el campo y sentido de orden
  const manejarOrden = (campo) => {
    setOrden(campoOrden === campo ? (orden === 'asc' ? 'desc' : 'asc') : 'desc');
    setCampoOrden(campo);
  };

  // Utilidades para mostrar datos en formato amigable
  const formatearFecha = d => new Date(d).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const formatearMoneda = a => `$${a?.toFixed(2)}`;
  const obtenerIconoOrden = f => campoOrden === f ? (orden === 'asc' ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />) : null;

  // Calcular totales para los resúmenes
  const totales = registrosFiltrados.reduce((acc, r) => ({
    totalBruto: acc.totalBruto + r.gross_earnings,
    totalNeto: acc.totalNeto + r.net_earnings,
    totalViajes: acc.totalViajes + r.trips_completed,
    totalKm: acc.totalKm + r.kilometers_driven,
    totalHoras: acc.totalHoras + r.hours_worked,
  }), { totalBruto: 0, totalNeto: 0, totalViajes: 0, totalKm: 0, totalHoras: 0 });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Barra superior con título y botón de filtros */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History size={28} className="text-blue-500" />
          <h1 className="text-2xl font-bold">Historial de Ganancias</h1>
        </div>
        <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className="btn-primary flex items-center space-x-2">
          <Filter size={20} /><span>Filtros</span>
        </button>
      </div>

      {/* Notificación de éxito o error */}
      {notificacion && (
        <div className={`notification ${notificacion.tipo} animate-slide-up`}>
          <span>{notificacion.mensaje}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Filtros y búsqueda */}
        {mostrarFiltros && (
          <div className="card animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Search size={20} /><span>Filtros y Búsqueda</span>
            </h2>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por fecha o monto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-300 mb-2">Ordenar por:</span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => manejarOrden('date')} className={`sort-button ${campoOrden === 'date' ? 'active' : ''}`}>Fecha{obtenerIconoOrden('date')}</button>
                <button onClick={() => manejarOrden('net_earnings')} className={`sort-button ${campoOrden === 'net_earnings' ? 'active' : ''}`}>Ganancia Neta{obtenerIconoOrden('net_earnings')}</button>
                <button onClick={() => manejarOrden('trips_completed')} className={`sort-button ${campoOrden === 'trips_completed' ? 'active' : ''}`}>Viajes{obtenerIconoOrden('trips_completed')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center"><span className="block text-sm text-gray-400 mb-1">Total Registros</span><span className="text-2xl font-bold">{registrosFiltrados.length}</span></div>
          <div className="card text-center"><span className="block text-sm text-gray-400 mb-1">Ganancia Neta Total</span><span className="text-2xl font-bold text-green-400">{formatearMoneda(totales.totalNeto)}</span></div>
          <div className="card text-center"><span className="block text-sm text-gray-400 mb-1">Total Viajes</span><span className="text-2xl font-bold">{totales.totalViajes}</span></div>
        </div>

        {/* Lista de registros o mensajes de carga/vacío */}
        <div className="card">
          {cargando ? (
            // Estado de carga
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Cargando historial...</p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            // Sin registros
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{busqueda ? 'No se encontraron registros' : 'No hay registros de ganancias'}</h3>
              <p className="text-gray-400">{busqueda ? 'Intenta con otros términos de búsqueda' : 'Los registros aparecerán aquí cuando los crees'}</p>
            </div>
          ) : (
            // Lista de registros
            <div className="space-y-4">
              {registrosFiltrados.map(registro => (
                <div key={registro.id} className={`border border-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-500 ${registroSeleccionado === registro.id ? 'border-blue-500 bg-blue-900/10' : 'bg-gray-800'}`}>
                  {/* Encabezado del registro */}
                  <div className="p-4 cursor-pointer" onClick={() => setRegistroSeleccionado(registroSeleccionado === registro.id ? null : registro.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{formatearFecha(registro.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${registro.net_earnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatearMoneda(registro.net_earnings)}</span>
                        {registro.net_earnings >= 0 ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />}
                      </div>
                    </div>
                    {/* Métricas rápidas */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
                      <div className="text-center"><span className="block text-xs text-gray-400">Viajes</span><span className="font-semibold">{registro.trips_completed}</span></div>
                      <div className="text-center"><span className="block text-xs text-gray-400">Km</span><span className="font-semibold">{registro.kilometers_driven.toFixed(1)}</span></div>
                      <div className="text-center"><span className="block text-xs text-gray-400">Horas</span><span className="font-semibold">{registro.hours_worked.toFixed(1)}</span></div>
                      <div className="text-center"><span className="block text-xs text-gray-400">Bruto</span><span className="font-semibold">{formatearMoneda(registro.gross_earnings)}</span></div>
                    </div>
                  </div>
                  {/* Detalle expandido del registro */}
                  {registroSeleccionado === registro.id && (
                    <div className="border-t border-gray-700 bg-gray-900 p-4 animate-fade-in">
                      {/* Ingresos */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-300 mb-3">Ingresos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex justify-between"><span className="text-gray-400">Ganancias base:</span><span className="font-semibold">{formatearMoneda(registro.total_earnings)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Propinas:</span><span className="font-semibold">{formatearMoneda(registro.tips)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Extras:</span><span className="font-semibold">{formatearMoneda(registro.extras)}</span></div>
                        </div>
                      </div>
                      {/* Gastos */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-300 mb-3">Gastos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between"><span className="text-gray-400">Combustible:</span><span className="font-semibold">{formatearMoneda(registro.fuel_cost)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Otros gastos:</span><span className="font-semibold">{formatearMoneda(registro.other_expenses)}</span></div>
                        </div>
                      </div>
                      {/* Métricas */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-300 mb-3">Métricas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex justify-between"><span className="text-gray-400">Neto por km:</span><span className="font-semibold">{formatearMoneda(registro.net_per_km)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Neto por hora:</span><span className="font-semibold">{formatearMoneda(registro.net_per_hour)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Neto por viaje:</span><span className="font-semibold">{formatearMoneda(registro.net_per_trip)}</span></div>
                        </div>
                      </div>
                      {/* Botón para eliminar registro */}
                      <button onClick={() => eliminarRegistro(registro.id)} className="btn-danger w-full flex items-center justify-center space-x-2">
                        <Trash2 size={16} /><span>Eliminar registro</span>
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

export default PantallaHistorial;