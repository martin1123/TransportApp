import axios from 'axios';

export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiNDI4OTk3NDciLCJhIjoiY21iNm5qOGZ0MDFubDJycGxyaW03MTN0YSJ9.KiujcKaRF9ED2we6H3-GAw';

export const fetchSuggestions = async (query, country = 'ar', limit = 5) => {
  if (!query || query.length < 3) return [];
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
  const { data } = await axios.get(url, {
    params: {
      access_token: MAPBOX_ACCESS_TOKEN,
      country,
      limit,
    },
  });
  return data.features || [];
};

export const fetchRoute = async (originCoords, destinationCoords) => {
  if (!originCoords || !destinationCoords) throw new Error('Coordenadas inválidas');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destinationCoords[0]},${destinationCoords[1]}`;
  const { data } = await axios.get(url, {
    params: {
      access_token: MAPBOX_ACCESS_TOKEN,
      geometries: 'geojson',
      overview: 'full',
    },
  });
  if (!data.routes || data.routes.length === 0) throw new Error('No se pudo calcular la ruta');
  return data.routes[0];
};