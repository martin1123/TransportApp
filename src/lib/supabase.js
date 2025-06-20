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

/**
 * Cliente de Supabase configurado
 * 
 * Este objeto nos permite interactuar con:
 * - Base de datos (consultas, inserciones, actualizaciones, eliminaciones)
 * - Autenticación (login, registro, logout)
 * - Almacenamiento de archivos
 * - Funciones edge
 * - Suscripciones en tiempo real
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración de autenticación
    autoRefreshToken: true, // Renovar automáticamente el token de acceso
    persistSession: true,   // Mantener la sesión en localStorage del navegador
    detectSessionInUrl: false, // No detectar sesión en URL (para aplicaciones SPA)
  },
})

/**
 * Función helper para manejar errores de Supabase de forma consistente
 * 
 * Convierte los mensajes de error técnicos de Supabase en mensajes
 * más amigables para el usuario en español.
 * 
 * @param {Object} error - Error de Supabase
 * @returns {string} - Mensaje de error legible para el usuario
 */
export const handleSupabaseError = (error) => {
  if (!error) return null
  
  // Mapeo de errores comunes a mensajes en español
  const errorMessages = {
    // Errores de autenticación
    'Invalid login credentials': 'Credenciales incorrectas. Verifica tu correo y contraseña.',
    'User already registered': 'Este correo ya está registrado. Intenta iniciar sesión.',
    'Email not confirmed': 'Por favor confirma tu correo electrónico.',
    'Invalid email': 'El formato del correo electrónico no es válido.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Signup is disabled': 'El registro de nuevos usuarios está deshabilitado.',
    
    // Errores de base de datos
    'duplicate key value violates unique constraint': 'Ya existe un registro con estos datos.',
    'foreign key constraint': 'No se puede completar la operación debido a dependencias.',
    'check constraint': 'Los datos no cumplen con las validaciones requeridas.',
    
    // Errores de red
    'Failed to fetch': 'Error de conexión. Verifica tu conexión a internet.',
    'Network request failed': 'Error de red. Intenta nuevamente.',
    
    // Errores de permisos
    'insufficient_privilege': 'No tienes permisos para realizar esta acción.',
    'row_security': 'No tienes acceso a estos datos.',
  }
  
  // Buscar mensaje personalizado o usar el mensaje original
  const customMessage = Object.keys(errorMessages).find(key => 
    error.message && error.message.includes(key)
  )
  
  return customMessage ? errorMessages[customMessage] : (error.message || 'Error desconocido')
}

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
        error: handleSupabaseError(result.error)
      }
    }
    
    return {
      data: result.data,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: handleSupabaseError(error)
    }
  }
}