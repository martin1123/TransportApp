import React, { useState } from 'react'

const RentabilityCalculator = () => {
  const [distancia, setDistancia] = useState('')
  const [precioCombustible, setPrecioCombustible] = useState('')
  const [consumo, setConsumo] = useState('')
  const [precioViaje, setPrecioViaje] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)

    const d = parseFloat(distancia)
    const pComb = parseFloat(precioCombustible)
    const cons = parseFloat(consumo)
    const pViaj = parseFloat(precioViaje)

    if (isNaN(d) || isNaN(pComb) || isNaN(cons) || isNaN(pViaj) || cons <= 0) {
      setError('Por favor ingresa valores numéricos válidos')
      return
    }

    const litros = d / cons
    const costo = litros * pComb
    const ganancia = pViaj - costo

    setResultado({ costo, ganancia })
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calculadora de Rentabilidad</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Distancia (km)</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Precio combustible (por litro)</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={precioCombustible}
            onChange={(e) => setPrecioCombustible(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Consumo (km/l)</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={consumo}
            onChange={(e) => setConsumo(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Precio cobrado al pasajero</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={precioViaje}
            onChange={(e) => setPrecioViaje(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Calcular
        </button>
      </form>

      {resultado && (
        <div className="mt-6 text-sm bg-gray-50 p-4 rounded border">
          <p>Costo del viaje: ${resultado.costo.toFixed(2)}</p>
          <p>Ganancia neta: ${resultado.ganancia.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}

export default RentabilityCalculator
