export interface TriageItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  timestamp: string;
  patientId?: string;
  doctorId?: string;
  symptoms?: string[];
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  assignedDoctor?: string;
  waitTime?: number;
  room?: string;
  notes?: string[];
}

export interface TriageStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  lastSync: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin' | 'nurse';
  specialization?: string;
  department?: string;
  profileImage?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  insuranceInfo?: string;
  contactNumber?: string;
  emergencyContact?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  availability: 'available' | 'busy' | 'off-duty';
  contactNumber?: string;
  email: string;
}