import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { TripAnalysis } from '@/types/database';
import { Route, MapPin, DollarSign, TrendingUp, TrendingDown, Minus, Navigation, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import axios from 'axios';

//TODO:
// Mapbox 
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiNDI4OTk3NDciLCJhIjoiY21iNm5qOGZ0MDFubDJycGxyaW03MTN0YSJ9.KiujcKaRF9ED2we6H3-GAw';

// Mapbox GL para web
let mapboxgl: any = null;
if (Platform.OS === 'web') {
  try {
    mapboxgl = require('mapbox-gl');
    if (mapboxgl) {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    }
  } catch (error) {
    console.warn('Mapbox GL not available:', error);
  }
}

interface MapboxSuggestion {
  id: string;
  place_name: string;
  geometry: {
    coordinates: [number, number];
  };
}

interface MapboxRoute {
  distance: number;
  geometry: any;
}

export default function TripsScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    desiredPricePerKm: '',
    tripPrice: '',
  });

  const [originSuggestions, setOriginSuggestions] = useState<MapboxSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<MapboxSuggestion[]>([]);
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const [analysis, setAnalysis] = useState<{
    distance: number;
    actualPricePerKm: number;
    profitability: 'rentable' | 'poco_rentable' | 'no_rentable';
    difference: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Map related state
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

  // Initialize the map only once (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapboxgl || map.current) return;

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-58.4173, -34.6118], // Buenos Aires
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }
  }, []);

  // Update map with route
  useEffect(() => {
    if (Platform.OS !== 'web' || !map.current || !routeGeoJSON) return;

    // Remove existing route layer if it exists
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add route source and layer
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

    // Add markers for origin and destination
    if (originCoords) {
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat(originCoords)
        .setPopup(new mapboxgl.Popup().setText('Origen'))
        .addTo(map.current);
    }

    if (destinationCoords) {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(destinationCoords)
        .setPopup(new mapboxgl.Popup().setText('Destino'))
        .addTo(map.current);
    }

    // Fit map to show the entire route
    const coords = routeGeoJSON.features[0].geometry.coordinates;
    const bounds = coords.reduce(function (bounds: any, coord: any) {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coords[0], coords[0]));

    map.current.fitBounds(bounds, {
      padding: 50,
    });
  }, [routeGeoJSON, originCoords, destinationCoords]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch address suggestions from Mapbox
  const fetchSuggestions = async (query: string, isOrigin: boolean) => {
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
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            country: 'ar', 
            limit: 5,
          },
        }
      );

      const suggestions = response.data.features || [];
      
      if (isOrigin) {
        setOriginSuggestions(suggestions);
        setShowOriginSuggestions(true);
      } else {
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const selectSuggestion = (suggestion: MapboxSuggestion, isOrigin: boolean) => {
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
      // Get route from Mapbox Directions API
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destinationCoords[0]},${destinationCoords[1]}`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            geometries: 'geojson',
            overview: 'full',
          },
        }
      );

      if (!response.data.routes || response.data.routes.length === 0) {
        showNotification('error', 'No se pudo calcular la ruta entre los puntos seleccionados');
        return;
      }

      const route: MapboxRoute = response.data.routes[0];
      const distanceKm = route.distance / 1000; 
      const actualPricePerKm = tripPrice / distanceKm;
      const difference = ((actualPricePerKm - desiredPricePerKm) / desiredPricePerKm) * 100;

      let profitability: 'rentable' | 'poco_rentable' | 'no_rentable';
      
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
      console.error('Error calculating route:', error);
      showNotification('error', 'Error al calcular la ruta. Verifica tu conexión a internet');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !analysis) return;

    setLoading(true);

    const tripData: Omit<TripAnalysis, 'id' | 'created_at'> = {
      user_id: user.id,
      origin: formData.origin,
      destination: formData.destination,
      distance_km: analysis.distance,
      trip_price: parseFloat(formData.tripPrice),
      desired_price_per_km: parseFloat(formData.desiredPricePerKm),
      actual_price_per_km: analysis.actualPricePerKm,
      profitability: analysis.profitability,
    };

    const { error } = await supabase
      .from('trip_analysis')
      .insert([tripData]);

    setLoading(false);

    if (error) {
      showNotification('error', 'No se pudo guardar el análisis');
    } else {
      showNotification('success', 'Análisis guardado correctamente');
      // Reset form
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
    }
  };

  const getProfitabilityColor = (profitability: string) => {
    switch (profitability) {
      case 'rentable':
        return '#10b981';
      case 'poco_rentable':
        return '#f59e0b';
      case 'no_rentable':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getProfitabilityIcon = (profitability: string) => {
    switch (profitability) {
      case 'rentable':
        return <TrendingUp size={20} color="#10b981" />;
      case 'poco_rentable':
        return <Minus size={20} color="#f59e0b" />;
      case 'no_rentable':
        return <TrendingDown size={20} color="#ef4444" />;
      default:
        return null;
    }
  };

  const getProfitabilityLabel = (profitability: string) => {
    switch (profitability) {
      case 'rentable':
        return 'RENTABLE';
      case 'poco_rentable':
        return 'POCO RENTABLE';
      case 'no_rentable':
        return 'NO RENTABLE';
      default:
        return '';
    }
  };

  const renderSuggestionItem = ({ item, isOrigin }: { item: MapboxSuggestion; isOrigin: boolean }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => selectSuggestion(item, isOrigin)}
    >
      <MapPin size={16} color="#64748b" style={styles.suggestionIcon} />
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.place_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Route size={24} color="#2563EB" />
        <Text style={styles.headerTitle}>Rentabilidad de Viajes</Text>
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
          <Text style={styles.sectionTitle}>Datos del Viaje</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección de origen</Text>
            <View style={styles.inputContainer}>
              <MapPin size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.origin}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, origin: text }));
                  fetchSuggestions(text, true);
                  if (notification) setNotification(null);
                }}
                placeholder="Ingresa la dirección de origen"
                placeholderTextColor="#64748b"
                onFocus={() => {
                  if (originSuggestions.length > 0) {
                    setShowOriginSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow for selection
                  setTimeout(() => setShowOriginSuggestions(false), 200);
                }}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección de destino</Text>
            <View style={styles.inputContainer}>
              <Navigation size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.destination}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, destination: text }));
                  fetchSuggestions(text, false);
                  if (notification) setNotification(null);
                }}
                placeholder="Ingresa la dirección de destino"
                placeholderTextColor="#64748b"
                onFocus={() => {
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow for selection
                  setTimeout(() => setShowDestinationSuggestions(false), 200);
                }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Precio por km deseado (ARS)</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.desiredPricePerKm}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, desiredPricePerKm: text }));
                  if (notification) setNotification(null);
                }}
                placeholder="750.00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Precio del viaje (ARS)</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.tripPrice}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, tripPrice: text }));
                  if (notification) setNotification(null);
                }}
                placeholder="5000.00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
            onPress={calculateProfitability}
            disabled={loading}
          >
            <Text style={styles.calculateButtonText}>
              {loading ? 'Calculando ruta...' : 'Calcular Rentabilidad'}
            </Text>
          </TouchableOpacity>
        </View>

        {analysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Análisis de Rentabilidad</Text>
            
            <View style={[
              styles.analysisCard,
              { borderColor: getProfitabilityColor(analysis.profitability) }
            ]}>
              <View style={styles.analysisHeader}>
                {getProfitabilityIcon(analysis.profitability)}
                <Text style={[
                  styles.profitabilityText,
                  { color: getProfitabilityColor(analysis.profitability) }
                ]}>
                  {getProfitabilityLabel(analysis.profitability)}
                </Text>
              </View>

              <View style={styles.analysisDetails}>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Distancia calculada:</Text>
                  <Text style={styles.analysisValue}>
                    {analysis.distance.toFixed(2)} km
                  </Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Precio real por km:</Text>
                  <Text style={styles.analysisValue}>
                    ${analysis.actualPricePerKm.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Precio deseado por km:</Text>
                  <Text style={styles.analysisValue}>
                    ${parseFloat(formData.desiredPricePerKm).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Diferencia:</Text>
                  <Text style={[
                    styles.analysisValue,
                    { color: analysis.difference >= 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {analysis.difference > 0 ? '+' : ''}{analysis.difference.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Precio total:</Text>
                  <Text style={styles.analysisValue}>
                    ${parseFloat(formData.tripPrice).toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Guardando...' : 'Guardar Análisis'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mapbox Map Container */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapa del Viaje</Text>
          {Platform.OS === 'web' && mapboxgl ? (
            <View
              ref={mapContainer}
              style={styles.mapContainer}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <MapPin size={48} color="#64748b" />
              <Text style={styles.mapPlaceholderText}>
                Mapa del viaje
              </Text>
              <Text style={styles.mapPlaceholderSubtext}>
                {analysis ? 
                  `Ruta calculada: ${analysis.distance.toFixed(2)} km` : 
                  'Calcula una ruta para ver el mapa'
                }
              </Text>
              {Platform.OS !== 'web' && (
                <Text style={styles.mapPlaceholderNote}>
                  El mapa interactivo está disponible en la versión web
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {showOriginSuggestions && originSuggestions.length > 0 && (
        <View style={styles.suggestionsOverlay}>
          <FlatList
            data={originSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderSuggestionItem({ item, isOrigin: true })}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {showDestinationSuggestions && destinationSuggestions.length > 0 && (
        <View style={styles.suggestionsOverlay}>
          <FlatList
            data={destinationSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderSuggestionItem({ item, isOrigin: false })}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
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
    marginBottom: 16,
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
  suggestionsOverlay: {
    position: 'absolute',
    top: 200, 
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 200,
    elevation: 20, 
    shadowColor: '#000', 
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  calculateButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profitabilityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  analysisDetails: {
    marginBottom: 20,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mapPlaceholder: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 300,
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  mapPlaceholderNote: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});