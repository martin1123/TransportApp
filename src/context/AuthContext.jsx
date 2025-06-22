import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Creación del contexto
const AuthContext = createContext({})


export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)           
  const [session, setSupabaseSession] = useState(null)     
  const [loading, setLoading] = useState(true)     

 
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error obteniendo sesión:', error)
        } else {
          setSupabaseSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error en getInitialSession:', error)
      } finally {
        setLoading(false) 
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Cambio de estado de auth:', event, session?.user?.email)
        
        setSupabaseSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])


  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      // Intentar iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { error: "error al iniciar sesion" }
      }

      // Si hay datos de sesión, actualizar estados
      if (data.session) {
        setSupabaseSession(data.session)
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


  const signUp = async (email, password) => {
    try {
      setLoading(true)
      
      // Intentar registrar usuario con Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { error: "Error al registrarse" }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error en signUp:', error)
      return { error: 'Error inesperado al registrar usuario' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: "Ocurrio un error al desconectarse de supabase al cerrar sesion" }
      }

      // Limpiar estados locales
      setSupabaseSession(null)
      setUser(null)

      return { error: null }
    } catch (error) {
      console.error('Error en signOut:', error)
      return { error: 'Error inesperado al cerrar sesión' }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,           
    session,       
    loading,        
    signIn,        
    signUp,       
    signOut,        
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}