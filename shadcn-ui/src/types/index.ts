// Re-export types from their respective files
export * from './patient';
export * from './doctor';
export * from './triage';
export * from './stats';
export * from './medical';

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