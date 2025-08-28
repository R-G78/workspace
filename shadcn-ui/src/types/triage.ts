export interface TriageResult {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendedActions: string[];
  estimatedWaitTime: number;
  requiresImmediateAttention: boolean;
  suggestedSpecialist?: string;
  vitalSignsRequired: string[];
  reasoning?: string;
}

export interface TriageNote {
  id: string;
  content: string;
  timestamp: string;
  author: string;
  type: 'observation' | 'diagnosis' | 'treatment' | 'followup';
}

export interface TriageItem {
  id: string;
  patientId: string;
  patientName?: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  timestamp: string;
  waitTime: number;
  assignedDoctor?: string;
  vitalSigns: Record<string, any>;
  vector: number[];
  room?: string;
  symptoms?: string[];
  notes?: TriageNote[];
}
