import React, { useState, useRef, useEffect } from 'react';
import { Route, MapPin, DollarSign, TrendingUp, TrendingDown, Minus, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchSuggestions, fetchRoute, MAPBOX_ACCESS_TOKEN} from '@/utils/Mapbox'; // <-- Importa el helper centralizado

/**
 * Pantalla de Análisis de Rentabilidad de Viajes
 */
const TripsScreen = () => {
  // Obtener usuario autenticado del contexto
  const { user } = useAuth();

  // Estados del formulario principal
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    desiredPricePerKm: '',
    tripPrice: '',
  });

  // Estados para el sistema de sugerencias de direcciones
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Estados para coordenadas geográficas seleccionadas
  const [originCoords, setOriginCoords] = useState(null); // [longitud, latitud]
  const [destinationCoords, setDestinationCoords] = useState(null);

  // Estados para análisis de rentabilidad
  const [analysis, setAnalysis] = useState(null);

  // Estados de UI y control
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Estados para el mapa
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  // Configuración de Mapbox

  // Cargar Mapbox GL JS dinámicamente
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        if (!window.mapboxgl) {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
          script.onload = () => {
            window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
            setMapboxLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
          setMapboxLoaded(true);
        }
      } catch (error) {
        console.error('Error cargando Mapbox:', error);
      }
    };
    loadMapbox();
  }, []);

  // Inicializar el mapa cuando Mapbox esté cargado
  useEffect(() => {
    if (!mapboxLoaded || !window.mapboxgl || map.current || !mapContainer.current) return;
    try {
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-58.4173, -34.6118], // Buenos Aires
        zoom: 10,
      });
      map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
      map.current.on('error', (e) => {
        console.error('Error del mapa:', e);
      });
    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }
  }, [mapboxLoaded]);

  // Actualizar el mapa con la ruta calculada
  useEffect(() => {
    if (!map.current || !routeGeoJSON || !window.mapboxgl) return;
    try {
      // Remover ruta existente si existe
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      // Remover marcadores existentes
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
      existingMarkers.forEach(marker => marker.remove());
      // Agregar nueva ruta
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON,
      });
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563EB',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
      // Agregar marcadores para origen y destino
      if (originCoords) {
        new window.mapboxgl.Marker({ color: '#10b981' })
          .setLngLat(originCoords)
          .setPopup(new window.mapboxgl.Popup().setText('Origen'))
          .addTo(map.current);
      }
      if (destinationCoords) {
        new window.mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat(destinationCoords)
          .setPopup(new window.mapboxgl.Popup().setText('Destino'))
          .addTo(map.current);
      }
      // Ajustar vista para mostrar toda la ruta
      const coords = routeGeoJSON.features[0].geometry.coordinates;
      const bounds = coords.reduce(function (bounds, coord) {
        return bounds.extend(coord);
      }, new window.mapboxgl.LngLatBounds(coords[0], coords[0]));
      map.current.fitBounds(bounds, { padding: 50 });
    } catch (error) {
      console.error('Error actualizando mapa:', error);
    }
  }, [routeGeoJSON, originCoords, destinationCoords]);

  // Notificaciones
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Limpiar marcadores y ruta del mapa cuando se limpian los estados
  useEffect(() => {
    if (!map.current || originCoords || destinationCoords || routeGeoJSON) return;
    // Elimina todos los marcadores
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    // Elimina la ruta si existe
    if (map.current.getSource && map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
  }, [originCoords, destinationCoords, routeGeoJSON]);

  // Sugerencias de direcciones usando el helper centralizado
  const fetchSuggestionsHandler = async (query, isOrigin) => {
    if (query.length < 3) {
      if (isOrigin) {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }
    try {
      const suggestions = await fetchSuggestions(query);
      if (isOrigin) {
        setOriginSuggestions(suggestions);
        setShowOriginSuggestions(true);
      } else {
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    }
  };

  // Selección de sugerencia
  const selectSuggestion = (suggestion, isOrigin) => {
    if (isOrigin) {
      setFormData(prev => ({ ...prev, origin: suggestion.place_name }));
      setOriginCoords(suggestion.geometry.coordinates);
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    } else {
      setFormData(prev => ({ ...prev, destination: suggestion.place_name }));
      setDestinationCoords(suggestion.geometry.coordinates);
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  // Cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'origin') {
      fetchSuggestionsHandler(value, true);
    } else if (name === 'destination') {
      fetchSuggestionsHandler(value, false);
    }
    if (notification) setNotification(null);
  };

  // Calcular rentabilidad y ruta usando el helper centralizado
  const calculateProfitability = async () => {
    if (!originCoords || !destinationCoords) {
      showNotification('error', 'Por favor selecciona origen y destino válidos de las sugerencias');
      return;
    }
    if (!formData.desiredPricePerKm || !formData.tripPrice) {
      showNotification('error', 'Por favor completa el precio deseado por km y el precio del viaje');
      return;
    }
    const tripPrice = parseFloat(formData.tripPrice);
    const desiredPricePerKm = parseFloat(formData.desiredPricePerKm);
    if (isNaN(tripPrice) || tripPrice <= 0 || isNaN(desiredPricePerKm) || desiredPricePerKm <= 0) {
      showNotification('error', 'Por favor ingresa precios válidos');
      return;
    }
    setLoading(true);
    try {
      const route = await fetchRoute(originCoords, destinationCoords);
      const distanceKm = route.distance / 1000;
      const actualPricePerKm = tripPrice / distanceKm;
      const difference = ((actualPricePerKm - desiredPricePerKm) / desiredPricePerKm) * 100;
      let profitability;
      if (difference >= 10) {
        profitability = 'rentable';
      } else if (difference >= -10) {
        profitability = 'poco_rentable';
      } else {
        profitability = 'no_rentable';
      }
      setAnalysis({
        distance: distanceKm,
        actualPricePerKm,
        profitability,
        difference,
      });
      setRouteGeoJSON({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: route.geometry,
            properties: {},
          },
        ],
      });
    } catch (error) {
      console.error('Error calculando ruta:', error);
      showNotification('error', 'Error al calcular la ruta. Verifica tu conexión a internet');
    } finally {
      setLoading(false);
    }
  };

  // limpiar el formulario
  const handleClearForm = () => {
    setFormData({
      origin: '',
      destination: '',
      desiredPricePerKm: '',
      tripPrice: '',
    });
    setOriginCoords(null);
    setDestinationCoords(null);
    setAnalysis(null);
    setRouteGeoJSON(null);
  };

  // Helpers UI
  const getProfitabilityColor = (profitability) => {
    switch (profitability) {
      case 'rentable': return 'text-green-400 border-green-400';
      case 'poco_rentable': return 'text-yellow-400 border-yellow-400';
      case 'no_rentable': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };
  const getProfitabilityIcon = (profitability) => {
    switch (profitability) {
      case 'rentable': return <TrendingUp size={24} className="text-green-400" />;
      case 'poco_rentable': return <Minus size={24} className="text-yellow-400" />;
      case 'no_rentable': return <TrendingDown size={24} className="text-red-400" />;
      default: return null;
    }
  };
  const getProfitabilityLabel = (profitability) => {
    switch (profitability) {
      case 'rentable': return 'RENTABLE';
      case 'poco_rentable': return 'POCO RENTABLE';
      case 'no_rentable': return 'NO RENTABLE';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Route size={32} className="text-primary-500" />
          <h1 className="text-3xl font-bold">Rentabilidad de Viajes</h1>
        </div>
      </div>

      {/* Notificación temporal */}
      {notification && (
        <div className={`${notification.type === 'success' ? 'notification-success' : 'notification-error'} fixed top-4 right-4 z-50`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Formulario de datos del viaje */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
            <MapPin size={24} className="text-primary-500" />
            <span>Datos del Viaje</span>
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Campo de origen */}
            <div className="relative">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Dirección de origen
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="Ingresa la dirección de origen"
                  className="input-field pl-10 w-full"
                  onFocus={() => {
                    if (originSuggestions.length > 0) {
                      setShowOriginSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowOriginSuggestions(false), 200);
                  }}
                />
              </div>
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-dark-800 border border-dark-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {originSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center space-x-3 p-3 hover:bg-dark-700 cursor-pointer transition-colors duration-200"
                      onClick={() => selectSuggestion(suggestion, true)}
                    >
                      <MapPin size={16} className="text-dark-400 flex-shrink-0" />
                      <span className="text-sm text-white">{suggestion.place_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Campo de destino */}
            <div className="relative">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Dirección de destino
              </label>
              <div className="relative">
                <Navigation size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="Ingresa la dirección de destino"
                  className="input-field pl-10 w-full"
                  onFocus={() => {
                    if (destinationSuggestions.length > 0) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowDestinationSuggestions(false), 200);
                  }}
                />
              </div>
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-dark-800 border border-dark-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {destinationSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center space-x-3 p-3 hover:bg-dark-700 cursor-pointer transition-colors duration-200"
                      onClick={() => selectSuggestion(suggestion, false)}
                    >
                      <MapPin size={16} className="text-dark-400 flex-shrink-0" />
                      <span className="text-sm text-white">{suggestion.place_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Precio deseado por km */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Precio por km deseado (ARS)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="number"
                  name="desiredPricePerKm"
                  value={formData.desiredPricePerKm}
                  onChange={handleInputChange}
                  placeholder="750.00"
                  className="input-field pl-10 w-full"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            {/* Precio total del viaje */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Precio del viaje (ARS)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="number"
                  name="tripPrice"
                  value={formData.tripPrice}
                  onChange={handleInputChange}
                  placeholder="5000.00"
                  className="input-field pl-10 w-full"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
          {/* Botón para calcular */}
          <button
            onClick={calculateProfitability}
            disabled={loading}
            className={`btn-primary w-full mt-6 flex items-center justify-center space-x-2 ${
              loading ? 'btn-disabled' : ''
            }`}
          >
            {loading && <div className="loading-spinner w-5 h-5"></div>}
            <span>{loading ? 'Calculando ruta...' : 'Calcular Rentabilidad'}</span>
          </button>
        </div>

        {/* Resultados del análisis */}
        {analysis && (
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Análisis de Rentabilidad</h2>
            <div className={`border-2 rounded-xl p-6 ${getProfitabilityColor(analysis.profitability)}`}>
              <div className="flex items-center space-x-3 mb-6">
                {getProfitabilityIcon(analysis.profitability)}
                <span className={`text-2xl font-bold ${getProfitabilityColor(analysis.profitability).split(' ')[0]}`}>
                  {getProfitabilityLabel(analysis.profitability)}
                </span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-dark-800 rounded-lg p-4">
                  <span className="block text-sm text-dark-400 mb-1">Distancia calculada</span>
                  <span className="text-xl font-bold">{analysis.distance.toFixed(2)} km</span>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <span className="block text-sm text-dark-400 mb-1">Precio real por km</span>
                  <span className="text-xl font-bold">${analysis.actualPricePerKm.toFixed(2)}</span>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <span className="block text-sm text-dark-400 mb-1">Precio deseado por km</span>
                  <span className="text-xl font-bold">${parseFloat(formData.desiredPricePerKm).toFixed(2)}</span>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <span className="block text-sm text-dark-400 mb-1">Diferencia</span>
                  <span className={`text-xl font-bold ${analysis.difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.difference > 0 ? '+' : ''}{analysis.difference.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <span className="block text-sm text-dark-400 mb-1">Precio total</span>
                  <span className="text-xl font-bold">${parseFloat(formData.tripPrice).toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleClearForm}
                className="btn-success w-full flex items-center justify-center space-x-2"
              >
                <span>Limpiar formulario</span>
              </button>
            </div>
          </div>
        )}

        {/* Mapa de Mapbox */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
            <MapPin size={24} className="text-primary-500" />
            <span>Mapa del Viaje</span>
          </h2>
          {mapboxLoaded ? (
            <div
              ref={mapContainer}
              className="w-full h-96 rounded-xl border border-dark-600 overflow-hidden"
              style={{ minHeight: '400px' }}
            />
          ) : (
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center h-96 flex flex-col items-center justify-center">
              <div className="loading-spinner w-8 h-8 mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Cargando mapa...</h3>
              <p className="text-dark-400 mb-2">
                Inicializando Mapbox GL JS
              </p>
            </div>
          )}
          {analysis && (
            <div className="mt-4 text-center">
              <p className="text-dark-400">
                Ruta calculada: <span className="text-white font-semibold">{analysis.distance.toFixed(2)} km</span>
              </p>
              <p className="text-sm text-dark-500 mt-1">
                Marcador verde: Origen • Marcador rojo: Destino • Línea azul: Ruta
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripsScreen;