import React, { useState } from 'react'

const RentabilityCalculator = () => {
  const [distancia, setDistancia] = useState('')
  const [precioCombustible, setPrecioCombustible] = useState('')
  const [consumo, setConsumo] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Calculando rentabilidad con:', { distancia, precioCombustible, consumo })
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calculadora de Rentabilidad</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Distancia (km)</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={distancia}
            onChange={(e) => setDistancia(e.target.value)}
            placeholder="0"
            required
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
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Calcular
        </button>
      </form>
    </div>
  )
}

export default RentabilityCalculator
