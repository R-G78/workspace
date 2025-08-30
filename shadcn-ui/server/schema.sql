-- Database schema for MedicAid

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT,
  gender VARCHAR(50),
  symptoms TEXT,
  medicalHistory TEXT,
  status ENUM('waiting', 'in_progress', 'completed') DEFAULT 'waiting',
  contactNumber VARCHAR(20),
  insuranceInfo TEXT,
  allergies JSON,
  currentMedications JSON,
  emergencyContact TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  status ENUM('active', 'busy', 'off_duty') DEFAULT 'active',
  contactNumber VARCHAR(20),
  department VARCHAR(100),
  schedule JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create triage_items table
CREATE TABLE IF NOT EXISTS triage_items (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('new', 'in_progress', 'completed') DEFAULT 'new',
  category VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  wait_time INT,
  assigned_doctor VARCHAR(36),
  vital_signs JSON,
  vector JSON,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (assigned_doctor) REFERENCES doctors(id)
);

-- Insert sample data for testing
INSERT INTO doctors (id, name, specialty, status, contactNumber, department) VALUES
('D-001', 'Dr. John Smith', 'General Medicine', 'active', '+1234567890', 'General Practice'),
('D-002', 'Dr. Sarah Johnson', 'Emergency Medicine', 'active', '+1234567891', 'Emergency');

INSERT INTO patients (id, name, age, gender, symptoms, status) VALUES
('P-001', 'Jane Doe', 35, 'Female', 'Fever, headache', 'waiting'),
('P-002', 'John Brown', 45, 'Male', 'Chest pain', 'in_progress');

INSERT INTO triage_items (id, patient_id, title, priority, status, assigned_doctor) VALUES
('T-001', 'P-001', 'Fever Case', 'medium', 'new', 'D-001'),
('T-002', 'P-002', 'Chest Pain', 'high', 'in_progress', 'D-002');
