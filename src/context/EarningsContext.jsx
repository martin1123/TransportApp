import React, { createContext, useContext, useState, useCallback } from 'react'

/**
 * Contexto de Ganancias
 * Maneja el estado global relacionado con los datos de ganancias
 * y proporciona funciones para refrescar datos entre componentes
 * 
 * Funcionalidades:
 * - Comunicación entre componentes para refrescar datos
 * - Gestión de callbacks para actualización de historial
 * - Estado compartido para sincronización de datos
 */

// Creación del contexto
const EarningsContext = createContext({})

/**
 * Hook personalizado para usar el contexto de ganancias
 * @returns {Object} - Objeto con funciones para manejar ganancias
 */
export const useEarnings = () => {
  const context = useContext(EarningsContext)
  if (!context) {
    throw new Error('useEarnings debe ser usado dentro de un EarningsProvider')
  }
  return context
}

/**
 * Proveedor del contexto de ganancias
 * Permite comunicación entre componentes para refrescar datos
 */
export const EarningsProvider = ({ children }) => {
  // Estado para almacenar la función de refresco del historial
  const [refreshHistoryCallback, setRefreshHistoryCallback] = useState(null)

  /**
   * Función para ejecutar el refresco del historial
   * Se llama desde cualquier componente que necesite actualizar los datos
   */
  const refreshHistory = useCallback(() => {
    if (refreshHistoryCallback) {
      console.log('Refrescando historial de ganancias...')
      refreshHistoryCallback()
    }
  }, [refreshHistoryCallback])

  /**
   * Función para establecer el callback de refresco
   * El componente de historial registra su función de refresco aquí
   * @param {Function} callback - Función que refresca los datos
   */
  const setRefreshHistory = useCallback((callback) => {
    setRefreshHistoryCallback(() => callback)
  }, [])

  // Valor del contexto que se proporciona a los componentes hijos
  const value = {
    refreshHistory,     // Función para ejecutar refresco
    setRefreshHistory,  // Función para registrar callback de refresco
  }

  return (
    <EarningsContext.Provider value={value}>
      {children}
    </EarningsContext.Provider>
  )
}