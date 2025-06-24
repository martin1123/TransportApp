# TransportApp

## 📑 Índice

- [🧱 Tecnologías y Propósito](#-tecnologías-y-propósito)
- [🛠 Tecnologías utilizadas](#tecnologías-utilizadas)
- [🧩 Estructura del Proyecto](#-estructura-del-proyecto)
- [⚙️ Configuración](#configuración)
- [📥 Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [🧬 Base de Datos](#-base-de-datos)
  - [📊 Tabla earnings_records](#-tabla-earnings_records)
  - [🧮 Tabla trip_analysis](#-tabla-trip_analysis)
  - [🛠 Tabla service_records](#-tabla-service_records)
- [📢 Notas Finales](#-notas-finales)
- [👫🏻 Participantes](#-participantes)


# 🧱 Tecnologías y Propósito
TransportApp es una aplicación orientada a personas que trabajan con transporte de pasajeros: conductores de taxis, remises o apps como Uber/Cabify. El objetivo es brindarles una herramienta ágil para:
- Registrar viajes realizados
- Calcular automáticamente ingresos y gastos
- Consultar el historial de servicios
- Obtener estadísticas de rendimiento


# Tecnologías utilizadas:
- ⚛️ React
- ⚡ Vite
- 🎨 TailwindCSS
- 🧰 Supabase (auth y base de datos)
- Netlify 🌐
  
# 🧩 Estructura del Proyecto   
<img width="548" alt="Captura de pantalla 2025-06-24 a la(s) 9 45 11 a  m" src="https://github.com/user-attachments/assets/7ca6cbea-8621-416f-96fd-f55fc15c1a5f" />


# Configuración:
Antes de correr el proyecto localmente es necesario tener:
- Una cuenta de Supabase con proyecto creado
- Crear un archivo .env y completarlo con: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY


# 📥 Instalación y Ejecución Local:
 🧩 1.  Clonar el repositorio
```bash
git clone https://github.com/martin1123/TransportApp.git
cd transportapp
```

📦 2. Instalar dependencias
```bash
npm install
```

🚀 3. Iniciar servidor
```bash

npm run dev
```

# 🧬 Base de Datos
TransportApp utiliza Supabase como backend, donde se almacenan todos los datos clave del usuario: ganancias, viajes, servicios realizados, etc. A continuación se detallan las tablas principales utilizadas:

## 📊 Tabla earnings_records
| Campo               | Tipo         | Restricciones                                | Descripción                             |
|--------------------|--------------|----------------------------------------------|-----------------------------------------|
| id                 | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()       | Identificador único del registro        |
| user_id            | uuid         | FK → auth.users(id), ON DELETE CASCADE       | Usuario dueño del registro              |
| date               | date         | NOT NULL, DEFAULT CURRENT_DATE               | Fecha del registro                      |
| total_earnings     | numeric(10,2)| NOT NULL, DEFAULT 0                          | Total ganado ese día                    |
| trips_completed    | integer      | NOT NULL, DEFAULT 0                          | Cantidad de viajes realizados           |
| kilometres_driven  | numeric(8,2) | NOT NULL, DEFAULT 0                          | KM conducidos                           |
| hours_worked       | numeric(6,2) | NOT NULL, DEFAULT 0                          | Horas trabajadas                        |
| tips               | numeric(10,2)| NOT NULL, DEFAULT 0                          | Propinas                                |
| extras             | numeric(10,2)| NOT NULL, DEFAULT 0                          | Ingresos extra                          |
| fuel_cost          | numeric(10,2)| NOT NULL, DEFAULT 0                          | Gasto en combustible                    |
| other_expenses     | numeric(10,2)| NOT NULL, DEFAULT 0                          | Otros gastos                            |
| gross_earnings     | numeric(10,2)| NOT NULL, DEFAULT 0                          | Ganancia bruta                          |
| gross_per_km       | numeric(8,2) | NOT NULL, DEFAULT 0                          | Ganancia bruta por kilómetro            |
| gross_per_hour     | numeric(8,2) | NOT NULL, DEFAULT 0                          | Ganancia bruta por hora                 |
| gross_per_trip     | numeric(8,2) | NOT NULL, DEFAULT 0                          | Ganancia bruta por viaje                |
| total_expenses     | numeric(10,2)| NOT NULL, DEFAULT 0                          | Total de egresos                        |
| net_earnings       | numeric(10,2)| NOT NULL, DEFAULT 0                          | Ganancia neta                           |
| net_per_km         | numeric(8,2) | NOT NULL, DEFAULT 0                          | Ganancia neta por km                    |
| net_per_hour       | numeric(8,2) | NOT NULL, DEFAULT 0                          | Ganancia neta por hora                  |
| net_per_trip       | numeric(8,2) | NOT NULL, DEFAULT 0                          | Ganancia neta por viaje                 |
| created_at         | timestamptz  | DEFAULT now()                                | Fecha de creación del registro          |
| updated_at         | timestamptz  | DEFAULT now()                                | Fecha de última modificación            |



## 🧮 Tabla trip_analysis
| Campo                  | Tipo         | Restricciones                                | Descripción                               |
|-----------------------|--------------|----------------------------------------------|-------------------------------------------|
| id                    | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()       | ID único del análisis                     |
| user_id               | uuid         | FK → auth.users(id), ON DELETE CASCADE       | Usuario dueño del análisis                |
| origin                | text         | NOT NULL                                     | Origen del viaje                          |
| destination           | text         | NOT NULL                                     | Destino del viaje                         |
| distance_km           | numeric(8,2) | NOT NULL, DEFAULT 0                          | Distancia del viaje                       |
| trip_price            | numeric(10,2)| NOT NULL, DEFAULT 0                          | Precio total del viaje                    |
| desired_price_per_km  | numeric(8,2) | NOT NULL, DEFAULT 0                          | Precio deseado por km                     |
| actual_price_per_km   | numeric(8,2) | NOT NULL, DEFAULT 0                          | Precio real por km                        |
| profitability_type    | text         | NOT NULL, DEFAULT 'poco_rentable'            | Rentabilidad del viaje (evaluación)       |
| created_at            | timestamptz  | DEFAULT now()                                | Fecha del registro                        |



## 🛠 Tabla service_records
| Campo                | Tipo         | Restricciones                                | Descripción                                 |
|---------------------|--------------|----------------------------------------------|---------------------------------------------|
| id                  | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()       | ID único del servicio                       |
| user_id             | uuid         | FK → auth.users(id), ON DELETE CASCADE       | Usuario dueño del registro                  |
| service_type        | text         | NOT NULL                                     | Tipo de servicio realizado                  |
| service_date        | date         | NOT NULL, DEFAULT CURRENT_DATE               | Fecha del servicio                          |
| current_mileage     | numeric(10,2)| NOT NULL, DEFAULT 0                          | Kilometraje al momento del servicio         |
| next_service_date   | date         | NULL                                         | Próxima fecha estimada de servicio          |
| next_service_mileage| numeric(10,2)| NULL                                         | Kilometraje estimado del próximo servicio   |
| created_at          | timestamptz  | DEFAULT now()                                | Fecha de creación del registro              |




# 📢 Notas Finales
- Se utiliza React Context para manejar la sesión y los datos de usuario
- Se usan hooks personalizados para mantener lógica separada y reutilizable
- El diseño es completamente responsivo y optimizado para uso móvil


# 👫🏻 Participantes
- Melissa Baran
- Martín Maccio
- Tobías Carbonare

