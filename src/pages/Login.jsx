import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

/**
 * Componente de Página de Login
 * Permite a los usuarios iniciar sesión en la aplicación
 * 
 * Funcionalidades:
 * - Formulario de inicio de sesión
 * - Validación de campos
 * - Manejo de errores
 * - Redirección después del login
 * - Mostrar/ocultar contraseña
 * - Diseño responsive y atractivo
 */
const Login = () => {
  // Hook de navegación para redirigir después del login
  const navigate = useNavigate()
  
  // Obtener función de login del contexto de autenticación
  const { signIn } = useAuth()

  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  /**
   * Función para manejar cambios en los inputs del formulario
   * @param {Event} e - Evento del input
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('')
  }

  /**
   * Función para manejar el envío del formulario
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Intentar iniciar sesión
      const { error: authError } = await signIn(formData.email, formData.password)
      
      if (authError) {
        setError(authError)
      } else {
        // Redirigir al dashboard si el login es exitoso
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="w-full max-w-md">
        {/* Card principal del formulario */}
        <div className="card shadow-custom animate-fade-in">
          {/* Header del formulario */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <Car size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">TransportApp</h1>
            <p className="text-dark-400">Inicia sesión en tu cuenta</p>
          </div>

          {/* Formulario de login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mostrar error si existe */}
            {error && (
              <div className="notification-error">
                <span>{error}</span>
              </div>
            )}

            {/* Campo de email */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-dark-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field pl-10 w-full"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-dark-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field pl-10 pr-10 w-full"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-dark-400 hover:text-dark-300" />
                  ) : (
                    <Eye size={20} className="text-dark-400 hover:text-dark-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full flex items-center justify-center gap-2 ${
                loading ? 'btn-disabled' : ''
              }`}
            >
              {loading && <div className="loading-spinner w-5 h-5"></div>}
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            {/* Enlace a registro */}
            <div className="text-center">
              <span className="text-dark-400">¿No tienes cuenta? </span>
              <Link 
                to="/register" 
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200"
              >
                Regístrate aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login