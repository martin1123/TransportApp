import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, handleSupabaseError } from '@/lib/supabase'

/**
 * Contexto de Autenticación
 * Maneja el estado global de autenticación de la aplicación
 * 
 * Funcionalidades:
 * - Gestión de sesiones de usuario
 * - Login y registro de usuarios
 * - Persistencia de sesión
 * - Manejo de errores de autenticación
 */

// Creación del contexto
const AuthContext = createContext({})

/**
 * Hook personalizado para usar el contexto de autenticación
 * @returns {Object} - Objeto con datos y funciones de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

/**
 * Proveedor del contexto de autenticación
 * Envuelve la aplicación y proporciona funcionalidades de auth a todos los componentes
 */
export const AuthProvider = ({ children }) => {
  // Estados del contexto
  const [user, setUser] = useState(null)           // Usuario actual
  const [session, setSession] = useState(null)     // Sesión actual
  const [loading, setLoading] = useState(true)     // Estado de carga inicial

  /**
   * Efecto para inicializar la autenticación y escuchar cambios
   */
  useEffect(() => {
    // Función para obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        // Obtener sesión actual de Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error obteniendo sesión:', error)
        } else {
          // Establecer sesión y usuario si existen
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error en getInitialSession:', error)
      } finally {
        setLoading(false) // Terminar estado de carga
      }
    }

    // Ejecutar función de inicialización
    getInitialSession()

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Cambio de estado de auth:', event, session?.user?.email)
        
        // Actualizar estados según el evento
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup: cancelar suscripción al desmontar
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Función para iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Object} - Resultado de la operación
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      // Intentar iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { error: handleSupabaseError(error) }
      }

      // Si hay datos de sesión, actualizar estados
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error en signIn:', error)
      return { error: 'Error inesperado al iniciar sesión' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Función para registrar nuevo usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Object} - Resultado de la operación
   */
  const signUp = async (email, password) => {
    try {
      setLoading(true)
      
      // Intentar registrar usuario con Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { error: handleSupabaseError(error) }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error en signUp:', error)
      return { error: 'Error inesperado al registrar usuario' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Función para cerrar sesión
   * @returns {Object} - Resultado de la operación
   */
  const signOut = async () => {
    try {
      setLoading(true)
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: handleSupabaseError(error) }
      }

      // Limpiar estados locales
      setSession(null)
      setUser(null)

      return { error: null }
    } catch (error) {
      console.error('Error en signOut:', error)
      return { error: 'Error inesperado al cerrar sesión' }
    } finally {
      setLoading(false)
    }
  }

  // Valor del contexto que se proporciona a los componentes hijos
  const value = {
    user,           // Usuario actual
    session,        // Sesión actual
    loading,        // Estado de carga
    signIn,         // Función para iniciar sesión
    signUp,         // Función para registrarse
    signOut,        // Función para cerrar sesión
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}