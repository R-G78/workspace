export interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  department?: string;
  status: 'active' | 'unavailable' | 'off-duty';
  currentPatients?: number;
  schedule?: {
    start: string;
    end: string;
  }[];
}
