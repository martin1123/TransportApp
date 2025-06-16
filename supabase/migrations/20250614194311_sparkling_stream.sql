/*

  1. New Tables
    - `earnings_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `total_earnings` (numeric)
      - `trips_completed` (integer)
      - `kilometers_driven` (numeric)
      - `hours_worked` (numeric)
      - `tips` (numeric)
      - `extras` (numeric)
      - `fuel_cost` (numeric)
      - `other_expenses` (numeric)
      - `gross_earnings` (numeric, calculated)
      - `gross_per_km` (numeric, calculated)
      - `gross_per_hour` (numeric, calculated)
      - `gross_per_trip` (numeric, calculated)
      - `total_expenses` (numeric, calculated)
      - `net_earnings` (numeric, calculated)
      - `net_per_km` (numeric, calculated)
      - `net_per_hour` (numeric, calculated)
      - `net_per_trip` (numeric, calculated)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `trip_analysis`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `origin` (text)
      - `destination` (text)
      - `distance_km` (numeric)
      - `trip_price` (numeric)
      - `desired_price_per_km` (numeric)
      - `actual_price_per_km` (numeric)
      - `profitability` (enum: rentable, poco_rentable, no_rentable)
      - `created_at` (timestamp)

    - `service_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `service_type` (enum: vtv, oil_change, timing_belt, brakes)
      - `service_date` (date)
      - `current_mileage` (numeric)
      - `next_service_date` (date, nullable)
      - `next_service_mileage` (numeric, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create custom types
CREATE TYPE profitability_type AS ENUM ('rentable', 'poco_rentable', 'no_rentable');
CREATE TYPE service_type AS ENUM ('vtv', 'oil_change', 'timing_belt', 'brakes');

-- Create earnings_records table
CREATE TABLE IF NOT EXISTS earnings_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_earnings numeric(10,2) NOT NULL DEFAULT 0,
  trips_completed integer NOT NULL DEFAULT 0,
  kilometers_driven numeric(8,2) NOT NULL DEFAULT 0,
  hours_worked numeric(6,2) NOT NULL DEFAULT 0,
  tips numeric(10,2) NOT NULL DEFAULT 0,
  extras numeric(10,2) NOT NULL DEFAULT 0,
  fuel_cost numeric(10,2) NOT NULL DEFAULT 0,
  other_expenses numeric(10,2) NOT NULL DEFAULT 0,
  gross_earnings numeric(10,2) NOT NULL DEFAULT 0,
  gross_per_km numeric(8,2) NOT NULL DEFAULT 0,
  gross_per_hour numeric(8,2) NOT NULL DEFAULT 0,
  gross_per_trip numeric(8,2) NOT NULL DEFAULT 0,
  total_expenses numeric(10,2) NOT NULL DEFAULT 0,
  net_earnings numeric(10,2) NOT NULL DEFAULT 0,
  net_per_km numeric(8,2) NOT NULL DEFAULT 0,
  net_per_hour numeric(8,2) NOT NULL DEFAULT 0,
  net_per_trip numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trip_analysis table
CREATE TABLE IF NOT EXISTS trip_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km numeric(8,2) NOT NULL DEFAULT 0,
  trip_price numeric(10,2) NOT NULL DEFAULT 0,
  desired_price_per_km numeric(8,2) NOT NULL DEFAULT 0,
  actual_price_per_km numeric(8,2) NOT NULL DEFAULT 0,
  profitability profitability_type NOT NULL DEFAULT 'poco_rentable',
  created_at timestamptz DEFAULT now()
);

-- Create service_records table
CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type service_type NOT NULL,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  current_mileage numeric(10,2) NOT NULL DEFAULT 0,
  next_service_date date,
  next_service_mileage numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE earnings_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for earnings_records
CREATE POLICY "Users can manage their own earnings records"
  ON earnings_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for trip_analysis
CREATE POLICY "Users can manage their own trip analysis"
  ON trip_analysis
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for service_records
CREATE POLICY "Users can manage their own service records"
  ON service_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS earnings_records_user_id_idx ON earnings_records(user_id);
CREATE INDEX IF NOT EXISTS earnings_records_date_idx ON earnings_records(date);
CREATE INDEX IF NOT EXISTS trip_analysis_user_id_idx ON trip_analysis(user_id);
CREATE INDEX IF NOT EXISTS trip_analysis_created_at_idx ON trip_analysis(created_at);
CREATE INDEX IF NOT EXISTS service_records_user_id_idx ON service_records(user_id);
CREATE INDEX IF NOT EXISTS service_records_service_type_idx ON service_records(service_type);

-- Create updated_at trigger for earnings_records
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_earnings_records_updated_at
    BEFORE UPDATE ON earnings_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();