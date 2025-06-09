import axios from 'axios'

export const buscarLugares = async (termino) => {
  if (!termino || termino.length < 3) return []

  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${termino}.json`,
      {
        params: {
          access_token: import.meta.env.VITE_MAPBOX_TOKEN,
          country: 'ar',
        },
      }
    )
    return response.data.features || []
  } catch (e) {
    console.error('Error buscando lugares:', e)
    return []
  }
}
