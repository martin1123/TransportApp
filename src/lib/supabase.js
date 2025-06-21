import { createClient } from '@supabase/supabase-js'

/**
 * Configuración del cliente de Supabase
 * 
 * Supabase es la base de datos PostgreSQL y sistema de autenticación que usamos.
 * Proporciona:
 * - Base de datos en tiempo real
 * - Autenticación de usuarios
 * - Row Level Security (RLS)
 * - APIs automáticas
 * 
 * Este archivo configura el cliente que se usa en toda la aplicación
 * para interactuar con la base de datos y servicios de autenticación.
 */

// URLs y claves de Supabase desde las variables de entorno
const supabaseUrl = 'https://bmwvtorislhpxqdjfyul.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtd3Z0b3Jpc2xocHhxZGpmeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjkyOTksImV4cCI6MjA2NTUwNTI5OX0.RFljOWx0chqv4NLq9uQsoNAZZtdWRM2xsv1cvE42L4g'

// Verificación de que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración de autenticación
    autoRefreshToken: true, 
    persistSession: true,   
    detectSessionInUrl: false, 
  },
})

/**
 * Función helper para realizar consultas con manejo de errores
 * 
 * @param {Function} queryFn - Función que realiza la consulta a Supabase
 * @returns {Object} - Objeto con data y error
 */
export const executeQuery = async (queryFn) => {
  try {
    const result = await queryFn()
    
    if (result.error) {
      return {
        data: null,
        error: "Error al ejecutar la consulta: " + result.error.message
      }
    }
    
    return {
      data: result.data,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: "Error inesperado: " + error.message
    }
  }
}