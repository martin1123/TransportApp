import React, { useState } from 'react'
import { buscarLugares } from '../lib/mapboxService'

const TripForm = () => {
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [coordOrigen, setCoordOrigen] = useState(null)
  const [coordDestino, setCoordDestino] = useState(null)
  const [sugerenciasOrigen, setSugerenciasOrigen] = useState([])
  const [sugerenciasDestino, setSugerenciasDestino] = useState([])
  const [error, setError] = useState('')

  const handleOrigenChange = async (e) => {
    const value = e.target.value
    setOrigen(value)
    setError('')

    if (value.length > 2) {
      try {
        const results = await buscarLugares(value)
        setSugerenciasOrigen(results)
      } catch {
        setError('Error al buscar origen')
      }
    } else {
      setSugerenciasOrigen([])
    }
  }

  const handleDestinoChange = async (e) => {
    const value = e.target.value
    setDestino(value)
    setError('')

    if (value.length > 2) {
      try {
        const results = await buscarLugares(value)
        setSugerenciasDestino(results)
      } catch {
        setError('Error al buscar destino')
      }
    } else {
      setSugerenciasDestino([])
    }
  }

  const seleccionarOrigen = (place) => {
    setOrigen(place.place_name)
    setCoordOrigen(place.center)
    setSugerenciasOrigen([])
  }

  const seleccionarDestino = (place) => {
    setDestino(place.place_name)
    setCoordDestino(place.center)
    setSugerenciasDestino([])
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Planificar viaje</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form className="space-y-4">
        <div>
          <label className="block text-sm">Origen</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={origen}
            onChange={handleOrigenChange}
            placeholder="Ingresa el punto de partida"
          />
          <ul className="text-sm mt-1 border rounded max-h-40 overflow-auto">
            {sugerenciasOrigen?.map((s) => (
              <li
                key={s.id}
                onClick={() => seleccionarOrigen(s)}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              >
                {s.place_name}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="block text-sm">Destino</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={destino}
            onChange={handleDestinoChange}
            placeholder="Ingresa el destino"
          />
          <ul className="text-sm mt-1 border rounded max-h-40 overflow-auto">
            {sugerenciasDestino?.map((s) => (
              <li
                key={s.id}
                onClick={() => seleccionarDestino(s)}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              >
                {s.place_name}
              </li>
            ))}
          </ul>
        </div>

        {coordOrigen && (
          <p className="text-sm text-gray-600">
            Coordenadas origen: {coordOrigen[1].toFixed(5)}, {coordOrigen[0].toFixed(5)}
          </p>
        )}
        {coordDestino && (
          <p className="text-sm text-gray-600">
            Coordenadas destino: {coordDestino[1].toFixed(5)}, {coordDestino[0].toFixed(5)}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded"
        >
          Calcular ruta
        </button>
      </form>
    </div>
  )
}

export default TripForm
