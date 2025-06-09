import React from 'react'
import { Link } from 'react-router-dom'

const Navigation = () => (
  <nav className="bg-gray-100 p-4 flex space-x-4">
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/viaje">Planificar viaje</Link>
    <Link to="/rentabilidad">Rentabilidad</Link>
    <Link to="/login">Salir</Link>
  </nav>
)

export default Navigation
