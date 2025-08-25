export interface TriageResult {
  priority: 'critical' | 'high' | 'medium' | 'low';
  specialty: string;
  confidence: number;
  reasoning?: string;
}

export interface MedicalCase {
  id: string;
  symptoms: string;
  diagnosis?: string;
  priority: TriageResult['priority'];
  specialty: string;
  outcome?: string;
  embedding?: number[];
}
