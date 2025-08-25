export interface Patient {
  id: number | string;
  name: string;
  symptoms?: string;
  status?: 'waiting' | 'in_progress' | 'completed';
  age?: number;
  gender?: string;
  contactNumber?: string;
  insuranceInfo?: string;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  emergencyContact?: string;
  triage?: import('./index').TriageItem;
  created_at?: Date | string;
}
