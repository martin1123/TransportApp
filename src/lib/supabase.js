import { createClient } from '@supabase/supabase-js'

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

