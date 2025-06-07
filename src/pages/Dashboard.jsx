import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useEarnings } from '../context/EarningsContext'

const Dashboard = () => {
  const { user } = useAuth()
  const { earnings } = useEarnings()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Bienvenido, {user?.email || 'Usuario'}.</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Resumen de rentabilidad</h2>
        {earnings.length > 0 ? (
          <ul className="list-disc list-inside">
            {earnings.map((e, i) => (
              <li key={i}>Viaje {i + 1}: ${e.toFixed(2)}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No hay datos de rentabilidad disponibles.</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
