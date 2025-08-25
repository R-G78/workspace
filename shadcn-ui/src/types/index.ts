export interface TriageResult {
  priority: 'critical' | 'high' | 'medium' | 'low';
  specialty: string;
  confidence: number;
  reasoning?: string;
}

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
  vector?: number[];
  aiAnalysis?: TriageResult;
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

export * from './patient';
export * from './doctor';