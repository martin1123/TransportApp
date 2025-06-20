import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { EarningsProvider } from './context/EarningsContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

/**
 * Componente principal de la aplicación
 * Configura el enrutamiento y los proveedores de contexto globales
 * 
 * Estructura:
 * - Router: Maneja la navegación entre páginas
 * - AuthProvider: Proporciona estado de autenticación global
 * - EarningsProvider: Maneja el estado de los datos de ganancias
 * - Routes: Define las rutas de la aplicación
 */
function App() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Router>
        <AuthProvider>
          <EarningsProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route 
                path="/dashboard/*" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </EarningsProvider>
        </AuthProvider>
      </Router>
    </div>
  )
}

export default App