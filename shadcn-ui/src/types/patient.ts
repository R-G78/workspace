import type { TriageItem } from './triage';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  symptoms?: string;
  medicalHistory?: string;
  status: 'waiting' | 'in_progress' | 'completed';
  contactNumber?: string;
  insuranceInfo?: string;
  allergies: string[];
  currentMedications: string[];
  emergencyContact?: string;
  triage?: TriageItem;
  created_at?: string;
}
  