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
  id: number;
  name: string;
  symptoms: string;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: Date;
}

export * from './patient';