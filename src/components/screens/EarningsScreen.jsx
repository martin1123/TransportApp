import React, { useState, useEffect } from 'react'
import { DollarSign, Calculator, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useEarnings } from '@/context/EarningsContext'
import { supabase } from '@/lib/supabase'

// Estado inicial del formulario
const formularioInicial = {
  gananciasTotales: '', viajesRealizados: '', kilometrosRecorridos: '', horasTrabajadas: '',
  propinas: '', extras: '', gastoCombustible: '', gastosVarios: ''
}
// Campos obligatorios para validación
const camposRequeridos = ['gananciasTotales', 'viajesRealizados', 'kilometrosRecorridos', 'horasTrabajadas']

// Definición de los campos del formulario
const campos = [
  { name: 'gananciasTotales', label: 'Ganancias Totales *', placeholder: '0.00', step: '0.01', required: true },
  { name: 'viajesRealizados', label: 'Viajes Realizados *', placeholder: '0', step: '1', required: true },
  { name: 'kilometrosRecorridos', label: 'Kilómetros Recorridos *', placeholder: '0.0', step: '0.1', required: true },
  { name: 'horasTrabajadas', label: 'Horas Trabajadas *', placeholder: '0.0', step: '0.1', required: true },
  { name: 'propinas', label: 'Propinas', placeholder: '0.00', step: '0.01' },
  { name: 'extras', label: 'Extras', placeholder: '0.00', step: '0.01' },
  { name: 'gastoCombustible', label: 'Gasto en Combustible', placeholder: '0.00', step: '0.01' },
  { name: 'gastosVarios', label: 'Gastos Varios', placeholder: '0.00', step: '0.01' },
]

const EarningsScreen = () => {
  // Hooks de contexto y estados locales
  const { user } = useAuth()
  const { refreshHistory } = useEarnings()
  const [datosFormulario, setDatosFormulario] = useState(formularioInicial)
  const [calculos, setCalculos] = useState({})
  const [cargando, setCargando] = useState(false)
  const [notificacion, setNotificacion] = useState(null)

  // Efecto para recalcular los valores automáticos cada vez que cambia el formulario
  useEffect(() => {
    const f = {
      gananciasTotales: parseFloat(datosFormulario.gananciasTotales) || 0,
      viajesRealizados: parseFloat(datosFormulario.viajesRealizados) || 0,
      kilometrosRecorridos: parseFloat(datosFormulario.kilometrosRecorridos) || 0,
      horasTrabajadas: parseFloat(datosFormulario.horasTrabajadas) || 0,
      propinas: parseFloat(datosFormulario.propinas) || 0,
      extras: parseFloat(datosFormulario.extras) || 0,
      gastoCombustible: parseFloat(datosFormulario.gastoCombustible) || 0,
      gastosVarios: parseFloat(datosFormulario.gastosVarios) || 0,
    }
    // Cálculos automáticos de ganancias y gastos
    const gananciasBrutas = f.gananciasTotales + f.propinas + f.extras
    const gastosTotales = f.gastoCombustible + f.gastosVarios
    const gananciasNetas = gananciasBrutas - gastosTotales
    setCalculos({
      gananciasBrutas,
      brutasPorKm: f.kilometrosRecorridos ? gananciasBrutas / f.kilometrosRecorridos : 0,
      brutasPorHora: f.horasTrabajadas ? gananciasBrutas / f.horasTrabajadas : 0,
      brutasPorViaje: f.viajesRealizados ? gananciasBrutas / f.viajesRealizados : 0,
      gastosTotales,
      gananciasNetas,
      netasPorKm: f.kilometrosRecorridos ? gananciasNetas / f.kilometrosRecorridos : 0,
      netasPorHora: f.horasTrabajadas ? gananciasNetas / f.horasTrabajadas : 0,
      netasPorViaje: f.viajesRealizados ? gananciasNetas / f.viajesRealizados : 0,
    })
  }, [datosFormulario])

  // Muestra una notificación temporal
  const mostrarNotificacion = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje })
    setTimeout(() => setNotificacion(null), 3000)
  }

  // Maneja los cambios en los inputs del formulario
  const manejarCambioInput = e => {
    const { name, value } = e.target
    setDatosFormulario(prev => ({ ...prev, [name]: value }))
    if (notificacion) setNotificacion(null)
  }

  // Guarda los datos en la base de datos (Supabase)
  const manejarGuardar = async () => {
    if (!user) return
    // Valida campos obligatorios
    const faltantes = camposRequeridos.filter(f => !datosFormulario[f])
    if (faltantes.length) return mostrarNotificacion('error', 'Por favor completa todos los campos obligatorios')
    setCargando(true)
    try {
      // Mapeo de variables en español a las columnas de supabase
      const f = {
        gananciasTotales: parseFloat(datosFormulario.gananciasTotales) || 0,
        viajesRealizados: parseFloat(datosFormulario.viajesRealizados) || 0,
        kilometrosRecorridos: parseFloat(datosFormulario.kilometrosRecorridos) || 0,
        horasTrabajadas: parseFloat(datosFormulario.horasTrabajadas) || 0,
        propinas: parseFloat(datosFormulario.propinas) || 0,
        extras: parseFloat(datosFormulario.extras) || 0,
        gastoCombustible: parseFloat(datosFormulario.gastoCombustible) || 0,
        gastosVarios: parseFloat(datosFormulario.gastosVarios) || 0,
      }
      // Construye el objeto para guardar en la base de datos
      const earningsData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        total_earnings: f.gananciasTotales,
        trips_completed: f.viajesRealizados,
        kilometers_driven: f.kilometrosRecorridos,
        hours_worked: f.horasTrabajadas,
        tips: f.propinas,
        extras: f.extras,
        fuel_cost: f.gastoCombustible,
        other_expenses: f.gastosVarios,
        gross_earnings: calculos.gananciasBrutas,
        gross_per_km: calculos.brutasPorKm,
        gross_per_hour: calculos.brutasPorHora,
        gross_per_trip: calculos.brutasPorViaje,
        total_expenses: calculos.gastosTotales,
        net_earnings: calculos.gananciasNetas,
        net_per_km: calculos.netasPorKm,
        net_per_hour: calculos.netasPorHora,
        net_per_trip: calculos.netasPorViaje,
      }
      // Inserta el registro en la tabla de supabase
      const { error } = await supabase.from('earnings_records').insert([earningsData])
      if (error) throw error
      mostrarNotificacion('success', 'Registro guardado correctamente')
      setDatosFormulario(formularioInicial)
      refreshHistory()
    } catch (error) {
      mostrarNotificacion('error', 'No se pudo guardar el registro')
    } finally {
      setCargando(false)
    }
  }

  // Renderizado del componente principal
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 lg:mb-8 pb-4 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <DollarSign size={28} className="text-primary-500" />
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Registro de Ganancias</h1>
        </div>
      </div>
      {/* Notificación de éxito o error */}
      {notificacion && (
        <div className={`${notificacion.tipo === 'success' ? 'notification-success' : 'notification-error'} mb-6`}>
          <span>{notificacion.mensaje}</span>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Formulario de entrada de datos */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-primary-500" /> Datos de Entrada
          </h2>
          <div className="grid gap-4">
            {campos.map(campo => (
              <div key={campo.name}>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  {campo.label}
                </label>
                <input
                  type="number"
                  name={campo.name}
                  value={datosFormulario[campo.name]}
                  onChange={manejarCambioInput}
                  placeholder={campo.placeholder}
                  className="input-field w-full"
                  step={campo.step}
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Panel de cálculos automáticos y botón de guardar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-success-500" /> Cálculos Automáticos
            </h2>
            <div className="space-y-4">
              {/* Ganancias Brutas */}
              <div className="bg-dark-700 rounded-lg p-4 border border-success-600/20">
                <h3 className="text-sm font-medium text-dark-300 mb-2">Ganancias Brutas</h3>
                <div className="text-2xl font-bold text-success-400 mb-3">
                  ${calculos.gananciasBrutas?.toFixed(2) || '0.00'}
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs text-dark-400">
                  <span>Por km: ${calculos.brutasPorKm?.toFixed(2) || '0.00'}</span>
                  <span>Por hora: ${calculos.brutasPorHora?.toFixed(2) || '0.00'}</span>
                  <span>Por viaje: ${calculos.brutasPorViaje?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              {/* Gastos Totales */}
              <div className="bg-dark-700 rounded-lg p-4 border border-danger-600/20">
                <h3 className="text-sm font-medium text-dark-300 mb-2">Gastos Totales</h3>
                <div className="text-2xl font-bold text-danger-400">
                  ${calculos.gastosTotales?.toFixed(2) || '0.00'}
                </div>
              </div>
              {/* Ganancias Netas */}
              <div className="bg-dark-700 rounded-lg p-4 border-2 border-primary-600">
                <h3 className="text-sm font-medium text-dark-300 mb-2">Ganancias Netas</h3>
                <div className="text-3xl font-bold text-primary-400 mb-3">
                  ${calculos.gananciasNetas?.toFixed(2) || '0.00'}
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs text-dark-400">
                  <span>Por km: ${calculos.netasPorKm?.toFixed(2) || '0.00'}</span>
                  <span>Por hora: ${calculos.netasPorHora?.toFixed(2) || '0.00'}</span>
                  <span>Por viaje: ${calculos.netasPorViaje?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
            {/* Botón para guardar el registro */}
            <button
              onClick={manejarGuardar}
              disabled={cargando}
              className={`btn-primary w-full mt-6 flex items-center justify-center gap-2 ${cargando ? 'btn-disabled' : ''}`}
            >
              {cargando ? (
                <>
                  <div className="loading-spinner w-5 h-5"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Registro
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EarningsScreen