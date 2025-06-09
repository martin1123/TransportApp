 import React from 'react'
 import { BrowserRouter, Routes, Route } from 'react-router-dom'
 import Login from './pages/Login'
 import Register from './pages/Register'
 import Dashboard from './pages/Dashboard'
 import TripForm from './pages/TripForm'
 import RentabilityCalculator from './components/RentabilityCalculator'
 import Navigation from './components/Navigation'
 import ProtectedRoute from './components/ProtectedRoute'

 function App() {
   return (
     <BrowserRouter>
       <Navigation />
       <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
         <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
         <Route path="/viaje" element={<ProtectedRoute><TripForm /></ProtectedRoute>} />
         <Route path="/rentabilidad" element={<ProtectedRoute><RentabilityCalculator /></ProtectedRoute>} />
       </Routes>
     </BrowserRouter>
   )
 }

 export default App
