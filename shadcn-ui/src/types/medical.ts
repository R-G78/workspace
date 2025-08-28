import type { TriageItem } from './triage';

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  symptoms?: string;
  medicalHistory?: string;
  status?: 'waiting' | 'in_progress' | 'completed';
  contactNumber?: string;
  insuranceInfo?: string;
  allergies?: string[];
  currentMedications?: string[];
  emergencyContact?: string;
  triage?: TriageItem;
  created_at?: string;
}

export interface VitalSigns {
  temperature?: number;       // in Celsius
  bloodPressure?: string;    // systolic/diastolic
  heartRate?: number;        // beats per minute
  respiratoryRate?: number;  // breaths per minute
  oxygenSaturation?: number; // percentage
  consciousness?: 'alert' | 'verbal' | 'pain' | 'unresponsive'; // AVPU scale
  bloodGlucose?: number;     // mmol/L
  painScore?: number;        // 0-10 scale
}

export interface ClinicalNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
  type: 'triage' | 'assessment' | 'treatment' | 'discharge' | 'followup';
  private: boolean;
}

export interface ClinicalAssessment {
  primaryDiagnosis?: string;
  differentialDiagnosis?: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  recommendedActions: string[];
  requiredTests?: string[];
  specialistReferral?: string;
  followUpNeeded: boolean;
  followUpTimeframe?: string;
  clinicalReasoning: string;
}

export interface MedicalStandard {
  icdCode?: string;
  snomedCode?: string;
  description: string;
  category: string;
  severity: string;
  recommendedActions: string[];
  contraindications?: string[];
  requiredMonitoring?: string[];
}

export interface PatientRecord {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  symptoms: string;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  vitalSigns?: VitalSigns;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  status: 'waiting' | 'in_progress' | 'completed' | 'transferred';
  assignedDoctor?: string;
  notes?: ClinicalNote[];
  lastUpdated: string;
  triageTime?: string;
  waitTime?: number;
  clinicalAssessment?: ClinicalAssessment;
}
