import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import EarningsScreen from '../components/screens/EarningsScreen'
import HistoryScreen from '../components/screens/HistoryScreen'
import TripsScreen from '../components/screens/TripsScreen'
import ServicesScreen from '../components/screens/ServicesScreen'

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80 pb-20 lg:pb-0 pt-16 lg:pt-0 overflow-x-hidden">
        <Routes>
          {/* Ruta por defecto - Pantalla de ganancias */}
          <Route index element={<EarningsScreen />} />
          
          {/* Rutas de las diferentes secciones */}
          <Route path="history" element={<HistoryScreen />} />
          <Route path="trips" element={<TripsScreen />} />
          <Route path="services" element={<ServicesScreen />} />
        </Routes>
      </main>
    </div>
  )
}

export default Dashboard